import "./globals.css";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import Image from "next/image";

export const metadata = { title: "Tasco Petroleum — Fleet" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const depotLabel = session?.mode === "depot" && session.depotName
    ? session.depotName
    : session ? "Admin" : null;

  return (
    <html lang="en">
      <body>
        {session && (
          <nav className="main-nav">
            <Link href="/vehicles" style={{ display: "flex", alignItems: "center", marginRight: 16 }}>
              <Image src="/logo.svg" alt="Tasco Petroleum" width={200} height={48} priority />
            </Link>
            <Link href="/vehicles">Vehicles</Link>
            <Link href="/drivers">Drivers</Link>
            <Link href="/mass-verifications">Mass Verifications</Link>
            <Link href="/non-conformances">Non-Conformances</Link>
            <Link href="/reports">Reports</Link>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
              {depotLabel && (
                <span style={{ fontSize: 12, color: "#a8c0e8" }}>
                  {session.mode === "depot" ? "Depot: " : ""}{depotLabel}
                </span>
              )}
              <Link href="/help" style={{ fontSize: 13, color: "#a8c0e8" }}>Help</Link>
              <Link href="/select-view" style={{ fontSize: 13, color: "#a8c0e8" }}>Switch View</Link>
              <form action="/api/auth/logout" method="post">
                <button type="submit" className="nav-logout">Log out</button>
              </form>
            </div>
          </nav>
        )}
        <main style={{ padding: 20, maxWidth: 1200, margin: "0 auto" }}>{children}</main>
      </body>
    </html>
  );
}
