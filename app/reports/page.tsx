import Link from "next/link";

export default function ReportsHubPage() {
  const reports = [
    {
      href: "/reports/vehicles",
      title: "Vehicle Reports",
      description: "Full fleet listing — filter by depot, type, make, model, VIN, rego, status, and more. Export to PDF or CSV.",
      color: "#1B3A6B",
    },
    {
      href: "/reports/rego",
      title: "Registration Expiry",
      description: "See which vehicles have registrations expiring soon. Filter by depot, state, type, and timeframe.",
      color: "#137333",
    },
    {
      href: "/reports/mass-verifications",
      title: "Mass Verifications",
      description: "Weighbridge records — filter by fleet number, depot, and date range. Includes all axle weights and docket references.",
      color: "#1a73e8",
    },
    {
      href: "/reports/drivers",
      title: "Driver Reports",
      description: "Driver listing with licence and DG licence details. Filter by depot, licence type, and expiry status.",
      color: "#e37400",
    },
  ];

  return (
    <div>
      <div style={{ background: "#1B3A6B", color: "#fff", padding: "20px 24px", borderRadius: 10, marginBottom: 28 }}>
        <h2 style={{ margin: 0, fontSize: 22 }}>Reports</h2>
        <p style={{ margin: "6px 0 0", fontSize: 14, opacity: 0.85 }}>Select a report type to filter and export your data</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {reports.map(r => (
          <Link key={r.href} href={r.href} style={{ textDecoration: "none" }}>
            <div style={{
              border: "2px solid #e0e8f5",
              borderRadius: 10,
              padding: "22px 20px",
              background: "#fff",
              cursor: "pointer",
            }}>
              <h3 style={{ margin: "0 0 8px", color: r.color, fontSize: 16 }}>{r.title}</h3>
              <p style={{ margin: 0, fontSize: 13, color: "#555", lineHeight: 1.5 }}>{r.description}</p>
              <div style={{ marginTop: 14, fontSize: 13, color: r.color, fontWeight: 600 }}>Open report →</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
