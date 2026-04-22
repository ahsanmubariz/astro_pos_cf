import type { APIRoute } from 'astro';
import { eq, desc } from 'drizzle-orm';
import * as schema from '../../../db/schema';

export const GET: APIRoute = async (context) => {
  const { db, session, tenant } = context.locals;

  if (!session || !tenant) return new Response('Unauthorized', { status: 401 });

  const orders = await db.select({
    invoice: schema.transactions.invoiceNumber,
    date: schema.transactions.createdAt,
    subtotal: schema.transactions.subtotal,
    total: schema.transactions.total,
    cashier: schema.users.name
  })
  .from(schema.transactions)
  .innerJoin(schema.users, eq(schema.transactions.cashierId, schema.users.id))
  .where(eq(schema.transactions.tenantId, tenant.id))
  .orderBy(desc(schema.transactions.createdAt));

  // CSV Generation
  const headers = ['Invoice', 'Date', 'Subtotal', 'Total', 'Cashier'];
  const rows = orders.map((o: any) => [
    o.invoice,
    o.date?.toISOString() || '',
    o.subtotal.toFixed(2),
    o.total.toFixed(2),
    o.cashier
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((r: any) => r.join(','))
  ].join('\n');

  return new Response(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="transactions_${tenant.slug}_${new Date().toISOString().slice(0,10)}.csv"`
    }
  });
};
