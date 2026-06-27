"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { NC_TYPES, NC_TYPE_MAP } from "@/lib/nc-types";

type Location = { id: string; name: string };
type Vehicle = { id: string; fleet_no: string; make: string; model: string };
type Driver = { id: string; first_name: string; last_name: string; driver_code: string };
type Row = {
  id: string; incident_type: string; description: string; incident_date: string;
  notes: string; created_at: string; fleet_no: string; make: string; model: string;
  driver_name: string; driver_code: string; depot_name: string;
};

function BarChart({ data }: { data: { label: string; count: number; bg: string; color: string }[] }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {data.map(d => (
        <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 140, fontSize: 12, color: "#444", textAlign: "right", flexShrink: 0 }}>{d.label}</div>
          <div style={{ flex: 1, background: "#f0f4fa", borderRadius: 4, height: 24, overflow: "hidden" }}>
            <div style={{
              width: `${(d.count / max) * 100}%`, minWidth: d.count > 0 ? 24 : 0,
              height: "100%", background: d.color, borderRadius: 4,
              transition: "width 0.4s ease",
              display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 6,
            }}>
              {d.count > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>{d.count}</span>}
            </div>
          </div>
          {d.count === 0 && <span style={{ fontSize: 12, color: "#aaa" }}>0</span>}
        </div>
      ))}
    </div>
  );
}

function MonthChart({ rows }: { rows: Row[] }) {
  const counts: Record<string, number> = {};
  rows.forEach(r => {
    const m = r.incident_date?.slice(0, 7);
    if (m) counts[m] = (counts[m] || 0) + 1;
  });
  const sorted = Object.entries(counts).sort(([a], [b]) => a.localeCompare(b));
  if (sorted.length < 2) return null;
  const max = Math.max(...sorted.map(([, v]) => v), 1);
  const BAR_W = 44;
  const H = 100;
  const totalW = sorted.length * (BAR_W + 8) + 20;

  return (
    <div style={{ overflowX: "auto" }}>
      <svg width={totalW} height={H + 40} style={{ display: "block" }}>
        {sorted.map(([month, count], i) => {
          const barH = Math.max((count / max) * H, 2);
          const x = 10 + i * (BAR_W + 8);
          const y = H - barH;
          const label = month.replace(/^(\d{4})-(\d{2})$/, (_, yr, mo) =>
            `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][Number(mo)-1]} ${yr.slice(2)}`
          );
          return (
            <g key={month}>
              <rect x={x} y={y} width={BAR_W} height={barH} rx={3} fill="#1B3A6B" />
              <text x={x + BAR_W / 2} y={y - 4} textAnchor="middle" fontSize={11} fill="#333">{count}</text>
              <text x={x + BAR_W / 2} y={H + 16} textAnchor="middle" fontSize={10} fill="#666">{label}</text>
            </g>
          );
        })}
        <line x1={0} y1={H} x2={totalW} y2={H} stroke="#e0e8f5" strokeWidth={1} />
      </svg>
    </div>
  );
}

function TopList({ title, items }: { title: string; items: { label: string; count: number }[] }) {
  if (items.length === 0) return null;
  const max = items[0].count;
  return (
    <div>
      <h4 style={{ margin: "0 0 10px", fontSize: 13, color: "#1B3A6B" }}>{title}</h4>
      {items.slice(0, 5).map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <div style={{ width: 20, fontSize: 12, color: "#888", textAlign: "right" }}>{i + 1}.</div>
          <div style={{ flex: 1, background: "#f0f4fa", borderRadius: 4, height: 20, overflow: "hidden" }}>
            <div style={{
              width: `${(item.count / max) * 100}%`, minWidth: 20, height: "100%",
              background: "#1B3A6B", borderRadius: 4, opacity: 0.7 + (0.3 * ((5 - i) / 5)),
            }} />
          </div>
          <div style={{ fontSize: 12, color: "#333", minWidth: 120 }}>{item.label}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#1B3A6B", width: 28, textAlign: "right" }}>{item.count}</div>
        </div>
      ))}
    </div>
  );
}

export default function NCReportPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [incidentType, setIncidentType] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [depot, setDepot] = useState("");
  const [fleetNo, setFleetNo] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [reportDate, setReportDate] = useState("");

  useEffect(() => {
    fetch("/api/locations").then(r => r.json()).then(setLocations);
    fetch("/api/vehicles?status=active").then(r => r.json()).then(setVehicles);
    fetch("/api/drivers?status=active").then(r => r.json()).then(setDrivers);
  }, []);

  async function generate() {
    setLoading(true);
    const p = new URLSearchParams();
    if (incidentType) p.set("incidentType", incidentType);
    if (vehicleId) p.set("vehicleId", vehicleId);
    if (driverId) p.set("driverId", driverId);
    if (depot) p.set("depot", depot);
    if (fleetNo) p.set("fleetNo", fleetNo);
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    const res = await fetch(`/api/reports/non-conformances?${p}`);
    setRows(await res.json());
    setReportDate(new Date().toLocaleString("en-AU"));
    setGenerated(true);
    setLoading(false);
  }

  function downloadCSV() {
    const headers = ["Date","Type","Description","Fleet No","Make","Model","Depot","Driver","Driver Code","Notes"];
    const csvRows = [headers, ...rows.map(r => [
      new Date(r.incident_date).toLocaleDateString("en-AU"),
      NC_TYPE_MAP[r.incident_type]?.label || r.incident_type,
      r.description || "", r.fleet_no || "", r.make || "", r.model || "",
      r.depot_name || "", r.driver_name?.trim() || "", r.driver_code || "", r.notes || "",
    ])];
    const csv = csvRows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `non-conformances-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  }

  // Derived chart data
  const typeChartData = NC_TYPES.map(t => ({
    label: t.label,
    count: rows.filter(r => r.incident_type === t.value).length,
    bg: t.bg, color: t.color,
  })).filter(d => d.count > 0);

  const vehicleCounts = Object.entries(
    rows.filter(r => r.fleet_no).reduce((acc, r) => {
      const k = r.fleet_no + (r.make ? ` ${r.make}` : "");
      acc[k] = (acc[k] || 0) + 1; return acc;
    }, {} as Record<string, number>)
  ).sort(([, a], [, b]) => b - a).map(([label, count]) => ({ label, count }));

  const driverCounts = Object.entries(
    rows.filter(r => r.driver_name?.trim()).reduce((acc, r) => {
      const k = r.driver_name.trim();
      acc[k] = (acc[k] || 0) + 1; return acc;
    }, {} as Record<string, number>)
  ).sort(([, a], [, b]) => b - a).map(([label, count]) => ({ label, count }));

  const sectionStyle = { background: "#f8fafd", border: "1px solid #dce6f5", borderRadius: 8, padding: "18px 20px", marginBottom: 16 };

  return (
    <div>
      <style>{`
        @media print { nav, .no-print { display: none !important; } .print-title { display: block !important; } }
        .print-title { display: none; }
      `}</style>

      <div className="print-title">
        <h2 style={{ margin: 0 }}>Tasco Carriers — Non-Conformance Report</h2>
        <p style={{ margin: "4px 0 16px", color: "#555", fontSize: 12 }}>Generated: {reportDate}</p>
      </div>

      <div className="no-print">
        <Link href="/reports" style={{ fontSize: 13, color: "#1B3A6B", textDecoration: "none" }}>← All Reports</Link>
        <h2 style={{ margin: "8px 0 16px", color: "#1B3A6B" }}>Non-Conformance Report</h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, background: "#f0f4fa", padding: 16, borderRadius: 8, marginBottom: 16 }}>
          <label style={{ marginBottom: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Incident Type</span>
            <select value={incidentType} onChange={e => setIncidentType(e.target.value)}>
              <option value="">All Types</option>
              {NC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </label>
          <label style={{ marginBottom: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Vehicle</span>
            <select value={vehicleId} onChange={e => setVehicleId(e.target.value)}>
              <option value="">All Vehicles</option>
              {vehicles.map((v: any) => <option key={v.id} value={v.id}>{v.fleet_no} {v.make} {v.model}</option>)}
            </select>
          </label>
          <label style={{ marginBottom: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Driver</span>
            <select value={driverId} onChange={e => setDriverId(e.target.value)}>
              <option value="">All Drivers</option>
              {drivers.map((d: any) => <option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>)}
            </select>
          </label>
          <label style={{ marginBottom: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Depot</span>
            <select value={depot} onChange={e => setDepot(e.target.value)}>
              <option value="">All Depots</option>
              {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </label>
          <label style={{ marginBottom: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Fleet No</span>
            <input value={fleetNo} onChange={e => setFleetNo(e.target.value)} placeholder="e.g. 503" />
          </label>
          <label style={{ marginBottom: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Date From</span>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} />
          </label>
          <label style={{ marginBottom: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Date To</span>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} />
          </label>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={generate} disabled={loading} style={{ background: "#1B3A6B" }}>
            {loading ? "Generating…" : "Generate Report"}
          </button>
          {generated && (
            <>
              <button onClick={() => window.print()} style={{ background: "#fff", color: "#1B3A6B", border: "1px solid #1B3A6B" }}>Print / Save PDF</button>
              <button onClick={downloadCSV} style={{ background: "#fff", color: "#1B3A6B", border: "1px solid #1B3A6B" }}>Download CSV</button>
              <span style={{ fontSize: 13, color: "#666" }}>{rows.length} record{rows.length !== 1 ? "s" : ""}</span>
            </>
          )}
        </div>
      </div>

      {generated && rows.length > 0 && (
        <>
          {/* Summary cards */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "20px 0 16px" }}>
            {NC_TYPES.map(t => {
              const count = rows.filter(r => r.incident_type === t.value).length;
              if (count === 0) return null;
              return (
                <div key={t.value} style={{ background: t.bg, border: `1px solid ${t.color}30`, borderRadius: 8, padding: "10px 16px", minWidth: 110, textAlign: "center" }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: t.color }}>{count}</div>
                  <div style={{ fontSize: 11, color: t.color, fontWeight: 600, marginTop: 2 }}>{t.label}</div>
                </div>
              );
            })}
            <div style={{ background: "#1B3A6B", border: "1px solid #1B3A6B30", borderRadius: 8, padding: "10px 16px", minWidth: 80, textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#fff" }}>{rows.length}</div>
              <div style={{ fontSize: 11, color: "#a8c0e8", fontWeight: 600, marginTop: 2 }}>Total</div>
            </div>
          </div>

          {/* Charts */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }} className="no-print">
            <div style={sectionStyle}>
              <h3 style={{ margin: "0 0 16px", fontSize: 14, color: "#1B3A6B" }}>Incidents by Type</h3>
              <BarChart data={typeChartData} />
            </div>
            <div style={sectionStyle}>
              <h3 style={{ margin: "0 0 16px", fontSize: 14, color: "#1B3A6B" }}>Incidents by Month</h3>
              <MonthChart rows={rows} />
              {Object.keys(rows.reduce((a, r) => { if (r.incident_date) a[r.incident_date.slice(0,7)] = 1; return a; }, {} as any)).length < 2 && (
                <p style={{ fontSize: 12, color: "#aaa", margin: 0 }}>Not enough date range for a trend chart.</p>
              )}
            </div>
          </div>

          {(vehicleCounts.length > 0 || driverCounts.length > 0) && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }} className="no-print">
              {vehicleCounts.length > 0 && (
                <div style={sectionStyle}>
                  <TopList title="Top Vehicles" items={vehicleCounts} />
                </div>
              )}
              {driverCounts.length > 0 && (
                <div style={sectionStyle}>
                  <TopList title="Top Drivers" items={driverCounts} />
                </div>
              )}
            </div>
          )}

          {/* Data table */}
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Date</th><th>Type</th><th>Description</th><th>Fleet No</th>
                  <th>Make / Model</th><th>Depot</th><th>Driver</th><th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => {
                  const t = NC_TYPE_MAP[r.incident_type];
                  return (
                    <tr key={r.id}>
                      <td style={{ whiteSpace: "nowrap" }}>{new Date(r.incident_date).toLocaleDateString("en-AU")}</td>
                      <td>
                        {t && <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600, background: t.bg, color: t.color, whiteSpace: "nowrap" }}>{t.label}</span>}
                      </td>
                      <td>{r.description}</td>
                      <td>{r.fleet_no || "—"}</td>
                      <td>{[r.make, r.model].filter(Boolean).join(" ") || "—"}</td>
                      <td>{r.depot_name || "—"}</td>
                      <td>{r.driver_name?.trim() || "—"}</td>
                      <td style={{ fontSize: 12, color: "#666" }}>{r.notes || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {generated && rows.length === 0 && (
        <p style={{ color: "#888", marginTop: 20 }}>No records match the selected filters.</p>
      )}
    </div>
  );
}
