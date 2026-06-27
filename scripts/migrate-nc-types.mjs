import pg from "pg";
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Drop old check constraint first (so UPDATEs below won't violate it)
    await client.query(`ALTER TABLE non_conformances DROP CONSTRAINT IF EXISTS non_conformances_incident_type_check`);
    // Migrate any old type values to closest new equivalent
    await client.query(`UPDATE non_conformances SET incident_type = 'work_hours' WHERE incident_type = 'hours'`);
    await client.query(`UPDATE non_conformances SET incident_type = 'distraction'  WHERE incident_type = 'vehicle'`);
    await client.query(`UPDATE non_conformances SET incident_type = 'admin'        WHERE incident_type = 'other'`);
    // Add new constraint with updated types
    await client.query(`
      ALTER TABLE non_conformances
      ADD CONSTRAINT non_conformances_incident_type_check
      CHECK (incident_type IN ('rest_30','admin','work_hours','diary','distraction'))
    `);
    await client.query("COMMIT");
    console.log("Migration complete: non_conformances incident_type constraint updated.");
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("Migration failed:", e.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
