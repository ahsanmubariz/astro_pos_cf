/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    session: import('./lib/auth').UserSession | null;
    tenant: import('./db/schema').tenants.$inferSelect | null;
    db: import('drizzle-orm/d1').D1PreparedQuery<any, any>; // Simplified type
    runtime: {
      env: {
        DB: D1Database;
      };
    };
  }
}
