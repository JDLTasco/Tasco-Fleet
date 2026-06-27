import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { mode, depotId, depotName } = await req.json();
  if (mode !== "admin" && mode !== "depot") {
    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  }
  await createSession({ username: "Tasco", mode, depotId, depotName });
  return NextResponse.json({ ok: true });
}
