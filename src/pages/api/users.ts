import type { APIRoute } from 'astro';
import * as schema from '../../db/schema';
import { hashPin } from '../../lib/auth';
import crypto from 'node:crypto';
import { eq, and } from 'drizzle-orm';

export const POST: APIRoute = async (context) => {
  const { db, session, tenant } = context.locals;

  // 1. Authorization check
  if (!session || (session.role !== 'super_admin' && session.role !== 'tenant_admin')) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
  }

  const body: any = await context.request.json();
  const { name, username, pin, role, tenantId, active } = body;

  if (!name || !username || !pin || !role) {
    return new Response(JSON.stringify({ message: 'Name, username, pin, and role are required' }), { status: 400 });
  }

  // 2. Permission Scoping
  let finalTenantId = tenantId;
  if (session.role === 'tenant_admin') {
    // Tenant admins can only create users for their own tenant
    finalTenantId = session.tenantId;
    if (role === 'super_admin') {
      return new Response(JSON.stringify({ message: 'Forbidden: Cannot create super admin' }), { status: 403 });
    }
  }

  try {
    const pinHash = await hashPin(pin);
    const userId = crypto.randomUUID();
    
    await db.insert(schema.users).values({
      id: userId,
      tenantId: finalTenantId || null,
      name,
      username,
      pinHash,
      role,
      active: active ?? true,
      createdAt: new Date(),
    });

    return new Response(JSON.stringify({ message: 'User created', id: userId }), { status: 201 });
  } catch (err: any) {
    if (err.message?.includes('UNIQUE')) {
      return new Response(JSON.stringify({ message: 'Username already exists' }), { status: 409 });
    }
    return new Response(JSON.stringify({ message: 'Failed to create user', error: err.message }), { status: 500 });
  }
};

export const GET: APIRoute = async (context) => {
  const { db, session, tenant } = context.locals;

  if (!session || (session.role !== 'super_admin' && session.role !== 'tenant_admin')) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
  }

  let query = db.select({
    id: schema.users.id,
    name: schema.users.name,
    username: schema.users.username,
    role: schema.users.role,
    tenantId: schema.users.tenantId,
    active: schema.users.active,
    createdAt: schema.users.createdAt,
    tenantName: schema.tenants.name
  })
  .from(schema.users)
  .leftJoin(schema.tenants, eq(schema.users.tenantId, schema.tenants.id));

  // If tenant_admin, scope to their tenant
  if (session.role === 'tenant_admin') {
    query = query.where(eq(schema.users.tenantId, session.tenantId!));
  }

  const users = await query;
  return new Response(JSON.stringify(users), { status: 200 });
};
