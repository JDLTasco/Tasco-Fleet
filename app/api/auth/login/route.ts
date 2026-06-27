import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  if (!username || !password) {
    return NextResponse.json({ error: "Username and password required" }, { status: 400 });
  }

  const rows = await query<{
    id: string; username: string; full_name: string; password_hash: string; role_id: number; is_active: boolean;
  }>("SELECT id, username, full_name, password_hash, role_id, is_active FROM users WHERE username = $1", [username]);

  const user = rows[0];
  if (!user || !user.is_active) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  await createSession({
    userId: user.id,
    username: user.username,
    fullName: user.full_name,
    roleId: user.role_id,
  });

  return NextResponse.json({ ok: true });
}
