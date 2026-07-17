import { Role } from '@generated/prisma/client';

/**
 * The Angular frontend models `UserRole` as the uppercase literals 'ADMIN' | 'USER',
 * while the Prisma enum stores lowercase 'admin' | 'user'. Internal authorization
 * (guards, JwtStrategy) keeps the lowercase Prisma value; only the JSON returned to the
 * browser is mapped to uppercase. Keep this mapping in one place.
 */
export type ApiRole = 'ADMIN' | 'USER';

export function toApiRole(role: Role | string): ApiRole {
  return String(role).toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER';
}

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: ApiRole;
  image?: string;
  createdAt?: Date | string;
}

export function toApiUser(user: {
  id: string;
  name: string;
  email: string;
  role: Role | string;
  image?: string | null;
  createdAt?: Date | string | null;
}): ApiUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: toApiRole(user.role),
    image: user.image ?? undefined,
    createdAt: user.createdAt ?? undefined,
  };
}
