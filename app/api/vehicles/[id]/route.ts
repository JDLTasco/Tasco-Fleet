import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vehicle = await query(
    `SELECT v.*, l.name AS location_name, cl.class AS class_name
     FROM vehicles v
     LEFT JOIN locations l ON l.id = v.location_id
     LEFT JOIN vehicle_classes cl ON cl.id = v.class_id
     WHERE v.id = $1`,
    [id]
  );
  if (!vehicle[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const compliance = await query(`SELECT * FROM vehicle_compliance WHERE vehicle_id = $1`, [id]);
  const history = await query(
    `SELECT h.transfer_date, h.transferring_depot, l.name AS location_name
     FROM vehicle_location_history h LEFT JOIN locations l ON l.id = h.location_id
     WHERE h.vehicle_id = $1 ORDER BY h.transfer_date DESC LIMIT 20`,
    [id]
  );

  return NextResponse.json({ vehicle: vehicle[0], compliance: compliance[0] || null, history });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const fields = [
    "vehicle_type", "sub_type", "make", "model", "description", "year", "vin",
    "tare_kg", "gvm_kg", "gcm_kg", "current_kms", "current_kms_date", "status",
    "action_required", "action_task", "notes",
  ];
  const sets: string[] = [];
  const vals: any[] = [];
  for (const f of fields) {
    if (f in body) {
      vals.push(body[f]);
      sets.push(`${f} = $${vals.length}`);
    }
  }
  if (sets.length === 0) return NextResponse.json({ error: "No fields to update" }, { status: 400 });

  vals.push(id);
  await query(`UPDATE vehicles SET ${sets.join(", ")}, updated_at = now() WHERE id = $${vals.length}`, vals);
  await logAudit("vehicles", id, "update", null, body);

  return NextResponse.json({ ok: true });
}
