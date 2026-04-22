import type { APIRoute } from 'astro';
import { eq, and, sql } from 'drizzle-orm';
import * as schema from '../../../db/schema';

export const POST: APIRoute = async (context) => {
  const { db, session, tenant } = context.locals;

  if (!session || !tenant) return new Response('Unauthorized', { status: 401 });

  const body: any = await context.request.json();
  const { closingCash } = body;

  // Find the open shift
  const openShift = await db.select()
    .from(schema.shifts)
    .where(and(
      eq(schema.shifts.tenantId, tenant.id),
      eq(schema.shifts.status, 'open')
    )).limit(1);

  if (openShift.length === 0) {
    return new Response(JSON.stringify({ message: 'No open shift found' }), { status: 400 });
  }

  const shift = openShift[0];

  // Calculate expected cash (opening + total transactions in this shift)
  const txTotal = await db.select({ total: sql`sum(total)` })
    .from(schema.transactions)
    .where(eq(schema.transactions.shiftId, shift.id));
  
  const expectedCash = shift.openingCash + (Number(txTotal[0].total) || 0);
  const difference = Number(closingCash) - expectedCash;

  await db.update(schema.shifts)
    .set({
      closedAt: new Date(),
      closingCash: Number(closingCash),
      expectedCash,
      difference,
      status: 'closed',
    })
    .where(eq(schema.shifts.id, shift.id));

  return new Response(JSON.stringify({ 
    message: 'Shift closed successfully',
    expectedCash,
    difference 
  }), { status: 200 });
};
