import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await query(
    `SELECT id, registration_no, registration_state, expiry_date, notes, recorded_at
     FROM vehicle_rego_history WHERE vehicle_id = $1 ORDER BY recorded_at DESC`,
    [id]
  );
  return NextResponse.json(rows);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { registration_no, registration_state, registration_expiry, notes } = await req.json();

  // Save current values to history before overwriting
  const current = await query(
    `SELECT registration_no, registration_state, registration_expiry FROM vehicle_compliance WHERE vehicle_id = $1`,
    [id]
  );
  if (current[0]) {
    await query(
      `INSERT INTO vehicle_rego_history (vehicle_id, registration_no, registration_state, expiry_date, notes)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, current[0].registration_no, current[0].registration_state, current[0].registration_expiry,
       notes || "Superseded by amendment"]
    );
  }

  // Upsert current compliance record
  await query(
    `INSERT INTO vehicle_compliance (vehicle_id, registration_no, registration_state, registration_expiry)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (vehicle_id) DO UPDATE SET
       registration_no = EXCLUDED.registration_no,
       registration_state = EXCLUDED.registration_state,
       registration_expiry = EXCLUDED.registration_expiry`,
    [id, registration_no, registration_state, registration_expiry]
  );

  return NextResponse.json({ ok: true });
}
