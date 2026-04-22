import type { APIRoute } from 'astro';
import * as schema from '../../db/schema';
import crypto from 'node:crypto';
import { eq, and } from 'drizzle-orm';

export const POST: APIRoute = async (context) => {
  const { db, session, tenant } = context.locals;

  // Security: Only tenant_admin or super_admin
  if (!session || (session.role !== 'tenant_admin' && session.role !== 'super_admin')) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
  }

  const body: any = await context.request.json();
  const { name, category, price, stock, active } = body;

  if (!name || !category || price === undefined) {
    return new Response(JSON.stringify({ message: 'Name, category, and price are required' }), { status: 400 });
  }

  try {
    const productId = crypto.randomUUID();
    await db.insert(schema.products).values({
      id: productId,
      tenantId: tenant!.id,
      name,
      category,
      price: Number(price),
      stock: Number(stock || 0),
      active: active !== undefined ? active : true,
      createdAt: new Date(),
    });

    return new Response(JSON.stringify({ message: 'Product created', id: productId }), { status: 201 });
  } catch (err: any) {
    return new Response(JSON.stringify({ message: 'Failed to create product', error: err.message }), { status: 500 });
  }
};

export const PATCH: APIRoute = async (context) => {
  const { db, session, tenant } = context.locals;

  if (!session || (session.role !== 'tenant_admin' && session.role !== 'super_admin')) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
  }

  const body: any = await context.request.json();
  const { id, name, category, price, stock, active } = body;

  if (!id) return new Response(JSON.stringify({ message: 'Product ID is required' }), { status: 400 });

  try {
    await db.update(schema.products)
      .set({
        name,
        category,
        price: price !== undefined ? Number(price) : undefined,
        stock: stock !== undefined ? Number(stock) : undefined,
        active,
      })
      .where(and(
        eq(schema.products.id, id),
        eq(schema.products.tenantId, tenant!.id)
      ));

    return new Response(JSON.stringify({ message: 'Product updated successfully' }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ message: 'Failed to update product', error: err.message }), { status: 500 });
  }
};

export const DELETE: APIRoute = async (context) => {
  const { db, session, tenant } = context.locals;

  if (!session || (session.role !== 'tenant_admin' && session.role !== 'super_admin')) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
  }

  const body: any = await context.request.json();
  const { id } = body;
  if (!id) return new Response(JSON.stringify({ message: 'Product ID is required' }), { status: 400 });

  try {
    await db.delete(schema.products)
      .where(and(
        eq(schema.products.id, id),
        eq(schema.products.tenantId, tenant!.id)
      ));

    return new Response(JSON.stringify({ message: 'Product deleted successfully' }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ message: 'Failed to delete product', error: err.message }), { status: 500 });
  }
};
