import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../db/schema';

export function getDb(runtime: any) {
  const d1 = runtime.env.DB;
  if (!d1) {
    throw new Error('D1 database not found in runtime. Check your wrangler.toml and Cloudflare configuration.');
  }
  return drizzle(d1, { schema });
}
