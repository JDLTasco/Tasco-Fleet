import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "dev-secret-change-me");
const COOKIE_NAME = "fleet_session";

export type SessionPayload = {
  userId: string;
  username: string;
  fullName: string;
  roleId: number; // 1 Operator, 2 Depot Manager, 3 Administrator
};

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT(payload as any)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(secret);

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export function clearSession() {
  cookies().delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/** Role names, matching the `roles` table seeded in schema.sql */
export const ROLE = { OPERATOR: 1, DEPOT_MANAGER: 2, ADMINISTRATOR: 3 } as const;

export function roleAtLeast(session: SessionPayload | null, minRole: number) {
  return !!session && session.roleId >= minRole;
}
