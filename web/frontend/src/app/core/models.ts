export type UserRole = 'ADMIN' | 'USER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  createdAt: string;
}

export interface Service {
  id: string;
  name: string;
  durationMinutes: number;
  priceCents: number;
  createdAt: string;
}

export type AppointmentStatus = 'BOOKED' | 'COMPLETED' | 'CANCELLED';

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  serviceId: string;
  serviceName: string;
  priceCents: number;
  durationMinutes: number;
  startTime: string; // ISO
  status: AppointmentStatus;
  createdByName: string;
  createdAt: string;
}

export interface RevenueSummary {
  weekCents: number;
  weekCount: number;
  monthCents: number;
  monthCount: number;
  weekLabel: string;
  monthLabel: string;
}

export interface SystemSetting {
  service: 'postgresql' | 'minio';
  label: string;
  description: string;
  fields: SettingField[];
  configured: boolean;
}

export interface SettingField {
  key: string;
  label: string;
  value: string;
  secret: boolean;
  placeholder: string;
}
