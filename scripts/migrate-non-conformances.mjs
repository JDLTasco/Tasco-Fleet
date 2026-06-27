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
    await client.query(`
      CREATE TABLE IF NOT EXISTS non_conformances (
        id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        vehicle_id    UUID REFERENCES vehicles(id) ON DELETE SET NULL,
        driver_id     UUID REFERENCES drivers(id) ON DELETE SET NULL,
        incident_type VARCHAR(20) NOT NULL CHECK (incident_type IN ('hours','vehicle','other')),
        description   VARCHAR(50) NOT NULL,
        incident_date DATE NOT NULL,
        notes         TEXT,
        created_at    TIMESTAMPTZ DEFAULT now(),
        updated_at    TIMESTAMPTZ DEFAULT now()
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_nc_vehicle  ON non_conformances(vehicle_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_nc_driver   ON non_conformances(driver_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_nc_date     ON non_conformances(incident_date)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_nc_type     ON non_conformances(incident_type)`);
    await client.query("COMMIT");
    console.log("Migration complete: non_conformances table created.");
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
