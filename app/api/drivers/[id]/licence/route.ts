import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await query(
    `SELECT id, licence_no, licence_type, licence_expiry, dg_licence_no, dg_licence_expiry, notes, recorded_at
     FROM driver_licence_history WHERE driver_id = $1 ORDER BY recorded_at DESC`,
    [id]
  );
  return NextResponse.json(rows);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { licence_no, licence_type, licence_expiry, dg_licence_no, dg_licence_expiry, notes } = body;

  // Save current values to history before overwriting
  const current = await query(
    `SELECT licence_no, licence_type, licence_expiry, dg_licence_no, dg_licence_expiry FROM drivers WHERE id = $1`,
    [id]
  );
  if (current[0]) {
    const c = current[0];
    if (c.licence_no || c.licence_expiry || c.dg_licence_no || c.dg_licence_expiry) {
      await query(
        `INSERT INTO driver_licence_history
           (driver_id, licence_no, licence_type, licence_expiry, dg_licence_no, dg_licence_expiry, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [id, c.licence_no, c.licence_type, c.licence_expiry, c.dg_licence_no, c.dg_licence_expiry,
         notes || "Superseded by amendment"]
      );
    }
  }

  // Update driver record
  const sets: string[] = [];
  const vals: any[] = [];
  const fields: Record<string, any> = { licence_no, licence_type, licence_expiry, dg_licence_no, dg_licence_expiry };
  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined) { vals.push(v); sets.push(`${k} = $${vals.length}`); }
  }
  if (sets.length) {
    vals.push(id);
    await query(`UPDATE drivers SET ${sets.join(", ")}, updated_at = now() WHERE id = $${vals.length}`, vals);
  }

  return NextResponse.json({ ok: true });
}
