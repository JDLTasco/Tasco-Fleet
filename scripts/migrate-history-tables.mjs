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
      CREATE TABLE IF NOT EXISTS vehicle_rego_history (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
        registration_no VARCHAR(50),
        registration_state VARCHAR(10),
        expiry_date DATE,
        notes TEXT,
        recorded_at TIMESTAMPTZ DEFAULT now()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS driver_licence_history (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
        licence_no VARCHAR(50),
        licence_type VARCHAR(20),
        licence_expiry DATE,
        dg_licence_no VARCHAR(50),
        dg_licence_expiry DATE,
        notes TEXT,
        recorded_at TIMESTAMPTZ DEFAULT now()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS vehicle_km_history (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
        kms INTEGER NOT NULL,
        reading_date DATE NOT NULL,
        notes TEXT,
        recorded_at TIMESTAMPTZ DEFAULT now()
      )
    `);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_rego_hist_vehicle ON vehicle_rego_history(vehicle_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_lic_hist_driver ON driver_licence_history(driver_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_km_hist_vehicle ON vehicle_km_history(vehicle_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_km_hist_date ON vehicle_km_history(reading_date)`);

    await client.query("COMMIT");
    console.log("Migration complete: vehicle_rego_history, driver_licence_history, vehicle_km_history tables created.");
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
