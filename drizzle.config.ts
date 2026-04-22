import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  driver: 'd1-http',
  dbCredentials: {
    accountId: 'YOUR_ACCOUNT_ID',
    databaseId: 'YOUR_DATABASE_ID',
    token: 'YOUR_TOKEN',
  },
});
