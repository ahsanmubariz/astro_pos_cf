import type { APIRoute } from 'astro';
import * as schema from '../../../../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import crypto from 'node:crypto';

export const GET: APIRoute = async (context) => {
  const { db, session, tenant } = context.locals;
  const { id } = context.params;

  if (!session || !tenant || !id) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
  }

  try {
    // 1. Get Transaction Details
    const transaction = await db.select({
      id: schema.transactions.id,
      invoiceNumber: schema.transactions.invoiceNumber,
      subtotal: schema.transactions.subtotal,
      total: schema.transactions.total,
      notes: schema.transactions.notes,
      status: schema.transactions.status,
      createdAt: schema.transactions.createdAt,
      cashierName: schema.users.name,
    })
    .from(schema.transactions)
    .leftJoin(schema.users, eq(schema.transactions.cashierId, schema.users.id))
    .where(and(
      eq(schema.transactions.id, id),
      eq(schema.transactions.tenantId, tenant.id)
    ))
    .limit(1);

    if (transaction.length === 0) {
      return new Response(JSON.stringify({ message: 'Transaction not found' }), { status: 404 });
    }

    // 2. Get Transaction Items
    const items = await db.select()
      .from(schema.transactionItems)
      .where(eq(schema.transactionItems.transactionId, id));

    // 3. Get Audit Logs
    const logs = await db.select({
      id: schema.transactionLogs.id,
      action: schema.transactionLogs.action,
      details: schema.transactionLogs.details,
      createdAt: schema.transactionLogs.createdAt,
      userName: schema.users.name,
    })
    .from(schema.transactionLogs)
    .leftJoin(schema.users, eq(schema.transactionLogs.userId, schema.users.id))
    .where(eq(schema.transactionLogs.transactionId, id))
    .orderBy(schema.transactionLogs.createdAt);

    return new Response(JSON.stringify({ 
      ...transaction[0], 
      items,
      logs 
    }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ message: 'Failed to fetch details', error: err.message }), { status: 500 });
  }
};

export const PATCH: APIRoute = async (context) => {
  const { db, session, tenant } = context.locals;
  const { id } = context.params;

  // Security: Only tenant_admin or super_admin can cancel/edit history
  if (!session || (session.role !== 'tenant_admin' && session.role !== 'super_admin') || !id) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
  }

  const body: any = await context.request.json();
  const { action, notes } = body;

  try {
    if (action === 'cancel') {
      // 1. Check current status
      const tx = await db.select().from(schema.transactions).where(eq(schema.transactions.id, id)).limit(1);
      if (tx[0].status === 'cancelled') {
        return new Response(JSON.stringify({ message: 'Transaction already cancelled' }), { status: 400 });
      }

      // 2. Restore Stock
      const items = await db.select().from(schema.transactionItems).where(eq(schema.transactionItems.transactionId, id));
      for (const item of items) {
        await db.update(schema.products)
          .set({ stock: sql`${schema.products.stock} + ${item.qty}` })
          .where(eq(schema.products.id, item.productId));
      }

      // 3. Update Status
      await db.update(schema.transactions)
        .set({ status: 'cancelled', notes: notes || tx[0].notes })
        .where(eq(schema.transactions.id, id));

      // 4. Log Action
      await db.insert(schema.transactionLogs).values({
        id: crypto.randomUUID(),
        transactionId: id,
        userId: session.userId,
        action: 'cancelled',
        details: JSON.stringify({ reason: notes || 'Admin cancellation' }),
        createdAt: new Date(),
      });

      return new Response(JSON.stringify({ message: 'Transaction cancelled and stock restored' }), { status: 200 });
    }

    return new Response(JSON.stringify({ message: 'Invalid action' }), { status: 400 });
  } catch (err: any) {
    return new Response(JSON.stringify({ message: 'Operation failed', error: err.message }), { status: 500 });
  }
};
