import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { users, tenants } from '../../../db/schema';
import { verifyPin, setSessionCookie } from '../../../lib/auth';

export const POST: APIRoute = async (context) => {
  const { db } = context.locals;
  const body: any = await context.request.json();
  const { username, pin } = body;

  if (!username || !pin) {
    return new Response(JSON.stringify({ message: 'Username and PIN are required' }), { status: 400 });
  }

  const user = await db.select().from(users).where(eq(users.username, username)).limit(1);

  if (user.length === 0) {
    return new Response(JSON.stringify({ message: 'Invalid credentials' }), { status: 401 });
  }

  const userData = user[0];
  const isValid = await verifyPin(pin, userData.pinHash);

  if (!isValid) {
    return new Response(JSON.stringify({ message: 'Invalid credentials' }), { status: 401 });
  }

  if (!userData.active) {
    return new Response(JSON.stringify({ message: 'Account is inactive' }), { status: 403 });
  }

  let tenantSlug = '';
  if (userData.tenantId) {
    const tenant = await db.select().from(tenants).where(eq(tenants.id, userData.tenantId)).limit(1);
    tenantSlug = tenant[0]?.slug || '';
  }

  setSessionCookie(context, {
    userId: userData.id,
    username: userData.username,
    name: userData.name,
    role: userData.role,
    tenantId: userData.tenantId,
  });

  return new Response(JSON.stringify({ 
    message: 'Login successful', 
    role: userData.role,
    tenantSlug 
  }), { status: 200 });
};
