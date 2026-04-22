import type { APIRoute } from 'astro';
import { eq, and } from 'drizzle-orm';
import * as schema from '../../../db/schema';
import crypto from 'node:crypto';

export const POST: APIRoute = async (context) => {
  const { db, session, tenant } = context.locals;

  if (!session || !tenant) return new Response('Unauthorized', { status: 401 });

  // Check for existing open shift
  const existing = await db.select()
    .from(schema.shifts)
    .where(and(
      eq(schema.shifts.tenantId, tenant.id),
      eq(schema.shifts.status, 'open')
    )).limit(1);

  if (existing.length > 0) {
    return new Response(JSON.stringify({ message: 'A shift is already open' }), { status: 400 });
  }

  const body: any = await context.request.json();
  const { openingCash } = body;

  await db.insert(schema.shifts).values({
    id: crypto.randomUUID(),
    tenantId: tenant.id,
    userId: session.userId,
    openedAt: new Date(),
    openingCash: Number(openingCash),
    status: 'open',
  });

  return new Response(JSON.stringify({ message: 'Shift opened successfully' }), { status: 201 });
};
