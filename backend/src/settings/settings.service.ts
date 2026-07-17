import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

const SECRET_MASK = '••••••••••';

interface FieldDef {
  key: string;
  label: string;
  secret: boolean;
  placeholder: string;
  /** Additional env var names to consult when the primary key is unset. */
  envFallbacks?: string[];
}

interface ServiceDef {
  service: 'postgresql' | 'minio';
  label: string;
  description: string;
  fields: FieldDef[];
}

const SERVICE_DEFS: ServiceDef[] = [
  {
    service: 'postgresql',
    label: 'PostgreSQL',
    description: 'Primary application database connection.',
    fields: [
      { key: 'POSTGRES_HOST', label: 'Host', secret: false, placeholder: 'localhost', envFallbacks: ['DATABASE_HOST', 'PGHOST'] },
      { key: 'POSTGRES_PORT', label: 'Port', secret: false, placeholder: '5432', envFallbacks: ['DATABASE_PORT', 'PGPORT'] },
      { key: 'POSTGRES_DB', label: 'Database', secret: false, placeholder: 'bizbook', envFallbacks: ['DATABASE_NAME', 'PGDATABASE'] },
      { key: 'POSTGRES_USER', label: 'User', secret: false, placeholder: 'app_user', envFallbacks: ['DATABASE_USER', 'PGUSER'] },
      { key: 'POSTGRES_PASSWORD', label: 'Password', secret: true, placeholder: 'Set a password', envFallbacks: ['DATABASE_PASSWORD', 'PGPASSWORD'] },
    ],
  },
  {
    service: 'minio',
    label: 'MinIO Object Storage',
    description: 'S3-compatible storage for exports and attachments.',
    fields: [
      { key: 'MINIO_ENDPOINT', label: 'Endpoint', secret: false, placeholder: 'minio.internal:9000' },
      { key: 'MINIO_BUCKET', label: 'Bucket', secret: false, placeholder: 'bizbook-files' },
      { key: 'MINIO_ACCESS_KEY', label: 'Access key', secret: false, placeholder: 'Access key', envFallbacks: ['MINIO_ROOT_USER'] },
      { key: 'MINIO_SECRET_KEY', label: 'Secret key', secret: true, placeholder: 'Secret key', envFallbacks: ['MINIO_ROOT_PASSWORD'] },
    ],
  },
];

export interface SettingFieldView {
  key: string;
  label: string;
  value: string;
  secret: boolean;
  placeholder: string;
}

export interface SystemSettingView {
  service: 'postgresql' | 'minio';
  label: string;
  description: string;
  configured: boolean;
  fields: SettingFieldView[];
}

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Resolve a raw configuration value: environment variable (including fallbacks) first,
   * then the SystemSetting DB override, otherwise null.
   */
  private resolveRaw(field: FieldDef, overrides: Map<string, string>): string | null {
    const candidates = [field.key, ...(field.envFallbacks ?? [])];
    for (const name of candidates) {
      const envVal = process.env[name];
      if (envVal && envVal.trim().length > 0) return envVal;
    }
    const dbVal = overrides.get(field.key);
    if (dbVal && dbVal.trim().length > 0) return dbVal;
    return null;
  }

  async findAll(): Promise<SystemSettingView[]> {
    const rows = await this.prisma.systemSetting.findMany();
    const overrides = new Map(rows.map((r) => [r.key, r.value]));

    return SERVICE_DEFS.map((def) => {
      const fields: SettingFieldView[] = def.fields.map((f) => {
        const raw = this.resolveRaw(f, overrides);
        // Never leak secret values to the client; report presence via a mask instead.
        const value = raw === null ? '' : f.secret ? SECRET_MASK : raw;
        return {
          key: f.key,
          label: f.label,
          value,
          secret: f.secret,
          placeholder: f.placeholder,
        };
      });
      const configured = def.fields.every((f) => this.resolveRaw(f, overrides) !== null);
      return {
        service: def.service,
        label: def.label,
        description: def.description,
        configured,
        fields,
      };
    });
  }

  /**
   * Persist configuration overrides into the SystemSetting table. Masked secret values
   * (the client echoing back the placeholder) and empty strings are ignored so an unchanged
   * secret is never clobbered.
   */
  async update(dto: UpdateSettingsDto): Promise<SystemSettingView[]> {
    const validKeys = new Set(SERVICE_DEFS.flatMap((d) => d.fields.map((f) => f.key)));

    const updates = (dto.fields ?? []).filter(
      (f) => validKeys.has(f.key) && f.value !== SECRET_MASK && f.value.trim().length > 0,
    );

    await Promise.all(
      updates.map((f) =>
        this.prisma.systemSetting.upsert({
          where: { key: f.key },
          update: { value: f.value },
          create: { key: f.key, value: f.value },
        }),
      ),
    );

    return this.findAll();
  }
}
