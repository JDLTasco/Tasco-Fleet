import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const fields = ["vehicle_id", "driver_id", "incident_type", "description", "incident_date", "notes"];
  const sets: string[] = [];
  const vals: any[] = [];
  for (const f of fields) {
    if (f in body) { vals.push(body[f]); sets.push(`${f} = $${vals.length}`); }
  }
  if (sets.length === 0) return NextResponse.json({ error: "No fields" }, { status: 400 });
  vals.push(id);
  await query(`UPDATE non_conformances SET ${sets.join(", ")}, updated_at = now() WHERE id = $${vals.length}`, vals);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await query(`DELETE FROM non_conformances WHERE id = $1`, [id]);
  return NextResponse.json({ ok: true });
}
