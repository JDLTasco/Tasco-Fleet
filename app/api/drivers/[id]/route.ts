import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await query(
    `SELECT d.*, l.name AS home_location
     FROM drivers d LEFT JOIN locations l ON l.id = d.home_location_id
     WHERE d.id = $1`,
    [id]
  );
  if (!rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const fields = ["driver_code","first_name","last_name","licence_no","licence_type",
    "licence_state","licence_expiry","dg_licence_no","dg_licence_expiry","phone","status","home_location_id"];
  const sets: string[] = [];
  const vals: any[] = [];
  for (const f of fields) {
    if (f in body) { vals.push(body[f]); sets.push(`${f} = $${vals.length}`); }
  }
  if (sets.length === 0) return NextResponse.json({ error: "No fields" }, { status: 400 });
  vals.push(id);
  await query(`UPDATE drivers SET ${sets.join(", ")}, updated_at = now() WHERE id = $${vals.length}`, vals);
  await logAudit("drivers", id, "update", null, body);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await query(`UPDATE drivers SET status = 'inactive', updated_at = now() WHERE id = $1`, [id]);
  await logAudit("drivers", id, "update", null, { status: "inactive" });
  return NextResponse.json({ ok: true });
}
