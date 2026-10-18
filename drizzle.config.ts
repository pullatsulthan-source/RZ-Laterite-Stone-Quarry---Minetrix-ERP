import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  connectionString: process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/rz_minetrix',
});
