import type { APIRoute } from 'astro';
import * as schema from '../../db/schema';
import crypto from 'node:crypto';
import { eq } from 'drizzle-orm';

export const POST: APIRoute = async (context) => {
  const { db, session } = context.locals;

  if (!session || session.role !== 'super_admin') {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
  }

  const body: any = await context.request.json();
  const { name, slug, storeName, address, receiptFooter, primaryColor, secondaryColor } = body;

  if (!name || !slug || !storeName) {
    return new Response(JSON.stringify({ message: 'Name, slug, and store name are required' }), { status: 400 });
  }

  try {
    const tenantId = crypto.randomUUID();
    await db.insert(schema.tenants).values({
      id: tenantId,
      name,
      slug: slug.toLowerCase().replace(/\s+/g, '-'),
      storeName,
      address,
      receiptFooter,
      primaryColor: primaryColor || '#6366f1',
      secondaryColor: secondaryColor || '#a855f7',
      createdAt: new Date(),
    });

    return new Response(JSON.stringify({ message: 'Tenant created', id: tenantId }), { status: 201 });
  } catch (err: any) {
    if (err.message?.includes('UNIQUE')) {
      return new Response(JSON.stringify({ message: 'Slug already exists' }), { status: 409 });
    }
    return new Response(JSON.stringify({ message: 'Failed to create tenant', error: err.message }), { status: 500 });
  }
};

export const PATCH: APIRoute = async (context) => {
  const { db, session, tenant } = context.locals;

  // 1. Authorization check
  if (!session || (session.role !== 'super_admin' && session.role !== 'tenant_admin')) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
  }

  const body: any = await context.request.json();
  const { name, storeName, address, receiptFooter, primaryColor, secondaryColor, logoUrl } = body;

  // 2. Permission Scoping
  // If tenant_admin, they can only update their own tenant
  const targetTenantId = session.role === 'super_admin' ? (context.params.id || (tenant as any)?.id) : session.tenantId;

  if (!targetTenantId) {
    return new Response(JSON.stringify({ message: 'Tenant context missing' }), { status: 400 });
  }

  try {
    await db.update(schema.tenants)
      .set({
        name,
        storeName,
        address,
        receiptFooter,
        primaryColor,
        secondaryColor,
        logoUrl,
      })
      .where(eq(schema.tenants.id, targetTenantId));

    return new Response(JSON.stringify({ message: 'Tenant updated successfully' }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ message: 'Failed to update tenant', error: err.message }), { status: 500 });
  }
};

export const GET: APIRoute = async (context) => {
  const { db, session } = context.locals;

  if (!session || session.role !== 'super_admin') {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
  }

  const tenants = await db.select().from(schema.tenants);
  return new Response(JSON.stringify(tenants), { status: 200 });
};
