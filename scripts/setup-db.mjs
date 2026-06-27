import pg from "pg";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

await client.connect();

// Check if schema already applied
const { rows } = await client.query(`
  SELECT 1 FROM information_schema.tables WHERE table_name = 'roles'
`);

if (rows.length > 0) {
  console.log("Schema already applied, skipping.");
} else {
  console.log("Applying schema...");
  const schema = readFileSync(join(__dirname, "../schema.sql"), "utf8");
  await client.query(schema);
  console.log("Schema applied.");
}

await client.end();
