import { eq, and } from 'drizzle-orm';
import * as schema from '../db/schema';
import { getDb } from './db';

export async function getTenantBySlug(db: any, slug: string) {
  const result = await db.select().from(schema.tenants).where(eq(schema.tenants.slug, slug)).limit(1);
  return result[0] || null;
}

export async function getTenantById(db: any, id: string) {
  const result = await db.select().from(schema.tenants).where(eq(schema.tenants.id, id)).limit(1);
  return result[0] || null;
}

export function validateTenantAccess(userTenantId: string | null, requestedTenantId: string, role: string) {
  if (role === 'super_admin') return true;
  return userTenantId === requestedTenantId;
}

export function getBrandingStyles(tenant: typeof schema.tenants.$inferSelect) {
  return {
    '--primary': tenant.primaryColor || '#6366f1',
    '--secondary': tenant.secondaryColor || '#a855f7',
  };
}
