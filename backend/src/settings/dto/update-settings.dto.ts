import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';

export class SettingFieldUpdateDto {
  @ApiProperty({ description: 'Setting key', example: 'MINIO_ENDPOINT' })
  @IsString()
  key: string;

  @ApiProperty({ description: 'New value', example: 'minio.internal:9000' })
  @IsString()
  value: string;
}

export class UpdateSettingsDto {
  @ApiPropertyOptional({ description: 'Which service group is being saved', example: 'minio' })
  @IsOptional()
  @IsString()
  service?: string;

  @ApiProperty({ type: [SettingFieldUpdateDto], description: 'Fields to persist' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SettingFieldUpdateDto)
  fields: SettingFieldUpdateDto[];
}
