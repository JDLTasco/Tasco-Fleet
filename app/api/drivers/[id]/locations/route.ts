import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await query(
    `SELECT dl.location_id, l.name FROM driver_locations dl JOIN locations l ON l.id = dl.location_id WHERE dl.driver_id = $1 ORDER BY l.name`,
    [id]
  );
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { locationId } = await req.json();
  await query(
    `INSERT INTO driver_locations (driver_id, location_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [id, locationId]
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { locationId } = await req.json();
  await query(`DELETE FROM driver_locations WHERE driver_id = $1 AND location_id = $2`, [id, locationId]);
  return NextResponse.json({ ok: true });
}
