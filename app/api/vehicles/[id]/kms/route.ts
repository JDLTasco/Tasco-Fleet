import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const conditions = ["vehicle_id = $1"];
  const vals: any[] = [id];
  if (from) { vals.push(from); conditions.push(`reading_date >= $${vals.length}`); }
  if (to) { vals.push(to); conditions.push(`reading_date <= $${vals.length}`); }

  const rows = await query(
    `SELECT id, kms, reading_date, notes, recorded_at
     FROM vehicle_km_history WHERE ${conditions.join(" AND ")} ORDER BY reading_date DESC`,
    vals
  );
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { kms, reading_date, notes } = await req.json();
  if (!kms || !reading_date) {
    return NextResponse.json({ error: "kms and reading_date required" }, { status: 400 });
  }

  await query(
    `INSERT INTO vehicle_km_history (vehicle_id, kms, reading_date, notes) VALUES ($1, $2, $3, $4)`,
    [id, kms, reading_date, notes || null]
  );

  // Update current_kms on the vehicle if this is the latest reading
  await query(
    `UPDATE vehicles SET current_kms = $1, current_kms_date = $2, updated_at = now()
     WHERE id = $3
       AND ($2::date >= current_kms_date OR current_kms_date IS NULL)`,
    [kms, reading_date, id]
  );

  return NextResponse.json({ ok: true }, { status: 201 });
}
