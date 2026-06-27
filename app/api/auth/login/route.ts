import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  if (username !== "Tasco" || password !== "Tasco123") {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  await createSession({ username: "Tasco", mode: "admin" });
  return NextResponse.json({ ok: true });
}
