import pg from "pg";
import bcrypt from "bcryptjs";

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

await client.connect();

const password = process.argv[2];
if (!password) { console.error("Usage: node scripts/set-passwords.mjs <password>"); process.exit(1); }

const hash = await bcrypt.hash(password, 12);

const { rows } = await client.query("SELECT id, username, full_name FROM users ORDER BY full_name");
console.log(`Setting password for ${rows.length} users:`);
for (const u of rows) {
  await client.query("UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2", [hash, u.id]);
  console.log(`  ✓ ${u.username} (${u.full_name})`);
}

await client.end();
console.log("Done.");
