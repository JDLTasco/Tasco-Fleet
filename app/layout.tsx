import "./globals.css";
import Link from "next/link";

export const metadata = { title: "Tasco Carriers Fleet" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav style={{ display: "flex", gap: 16, padding: "12px 20px", borderBottom: "1px solid #ddd", alignItems: "center" }}>
          <strong>Tasco Carriers — Fleet</strong>
          <Link href="/vehicles">Vehicles</Link>
          <Link href="/drivers">Drivers</Link>
          <Link href="/mass-verifications">Mass Verifications</Link>
          <form action="/api/auth/logout" method="post" style={{ marginLeft: "auto" }}>
            <button type="submit">Log out</button>
          </form>
        </nav>
        <main style={{ padding: 20, maxWidth: 1100, margin: "0 auto" }}>{children}</main>
      </body>
    </html>
  );
}
