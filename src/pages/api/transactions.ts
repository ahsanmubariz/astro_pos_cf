import type { APIRoute } from 'astro';
import { eq, and, sql } from 'drizzle-orm';
import * as schema from '../../db/schema';
import { generateInvoiceNumber } from '../../lib/utils';
import crypto from 'node:crypto';

export const POST: APIRoute = async (context) => {
  const { db, session, tenant } = context.locals;
  
  if (!session || !tenant) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
  }

  const body: any = await context.request.json();
  const { items } = body;

  // 1. Get open shift
  const openShift = await db.select()
    .from(schema.shifts)
    .where(and(
      eq(schema.shifts.tenantId, tenant.id),
      eq(schema.shifts.status, 'open')
    ))
    .limit(1);

  if (openShift.length === 0) {
    return new Response(JSON.stringify({ message: 'No open shift found' }), { status: 400 });
  }

  const shift = openShift[0];

  // 2. Calculate totals
  let subtotal = 0;
  for (const item of items) {
    subtotal += item.price * item.qty;
  }

  const tax = subtotal * 0.1; // 10%
  const total = subtotal + tax;

  // 3. Generate invoice number
  // In a real app, we'd use an atomic counter. Here we count existing transactions.
  const txCount = await db.select({ count: sql`count(*)` })
    .from(schema.transactions)
    .where(eq(schema.transactions.tenantId, tenant.id));
  
  const invoiceNumber = generateInvoiceNumber(tenant.slug, Number(txCount[0].count) + 1);

  // 4. Create Transaction
  const txId = crypto.randomUUID();
  
  await db.insert(schema.transactions).values({
    id: txId,
    tenantId: tenant.id,
    invoiceNumber,
    cashierId: session.userId,
    shiftId: shift.id,
    subtotal,
    tax: 10,
    total,
    createdAt: new Date(),
  });

  // 5. Create Transaction Items
  for (const item of items) {
    await db.insert(schema.transactionItems).values({
      id: crypto.randomUUID(),
      transactionId: txId,
      productId: item.productId,
      nameSnapshot: item.name,
      qty: item.qty,
      price: item.price,
      total: item.price * item.qty,
    });

    // Update stock (simplified)
    await db.update(schema.products)
      .set({ stock: sql`${schema.products.stock} - ${item.qty}` })
      .where(eq(schema.products.id, item.productId));
  }

  return new Response(JSON.stringify({ 
    message: 'Transaction created', 
    id: txId,
    invoiceNumber 
  }), { status: 201 });
};
