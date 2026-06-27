import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var _fleetPool: Pool | undefined;
}

export const pool =
  global._fleetPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes("render.com") ? { rejectUnauthorized: false } : undefined,
  });

if (process.env.NODE_ENV !== "production") {
  global._fleetPool = pool;
}

export async function query<T = any>(text: string, params?: any[]) {
  const res = await pool.query(text, params);
  return res.rows as T[];
}
