"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useColumns } from "@/components/ColumnSelector";

const REPORT_COLS = [
  { key: "fleet_no",              label: "Fleet No",      always: true },
  { key: "vehicle_type",          label: "Type" },
  { key: "sub_type",              label: "Sub Type" },
  { key: "make",                  label: "Make" },
  { key: "model",                 label: "Model" },
  { key: "year",                  label: "Year" },
  { key: "vin",                   label: "VIN" },
  { key: "status",                label: "Status" },
  { key: "location_name",         label: "Depot" },
  { key: "registration_no",       label: "Rego No" },
  { key: "registration_state",    label: "Rego State" },
  { key: "registration_expiry",   label: "Rego Expiry" },
  { key: "nhvas_mass",            label: "NHVAS Mass" },
  { key: "mass_active",           label: "Mass Active" },
  { key: "dg_licence_required",   label: "DG Lic Req" },
  { key: "dg_expiry_date",        label: "DG Expiry" },
  { key: "current_kms",           label: "KMs" },
  { key: "acquired_date",         label: "Acquired" },
  { key: "acquisition_price",     label: "Acq Price" },
  { key: "class_name",            label: "Class" },
  { key: "gvm_kg",                label: "GVM (kg)" },
  { key: "gcm_kg",                label: "GCM (kg)" },
  { key: "tare_kg",               label: "Tare (kg)" },
];

type Location = { id: string; name: string };
type ReportRow = {
  fleet_no: string; vehicle_type: string; sub_type: string; make: string; model: string;
  year: number; vin: string; status: string; location_name: string;
  registration_no: string; registration_state: string; registration_expiry: string;
  nhvas_mass: boolean; mass_active: boolean; dg_licence_required: boolean; dg_expiry_date: string;
  current_kms: number; acquired_date: string; acquisition_price: number;
  class_name: string; gvm_kg: number; gcm_kg: number; tare_kg: number;
};

function fmt(v: unknown) {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return String(v);
}
function fmtDate(v: string | null) {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("en-AU");
}
function fmtNum(v: number | null) {
  if (v === null || v === undefined) return "—";
  return v.toLocaleString();
}

function downloadCSV(rows: ReportRow[]) {
  const cols: (keyof ReportRow)[] = [
    "fleet_no","vehicle_type","sub_type","make","model","year","vin","status",
    "location_name","registration_no","registration_state","registration_expiry",
    "nhvas_mass","mass_active","dg_licence_required","dg_expiry_date",
    "current_kms","acquired_date","acquisition_price","class_name","gvm_kg","gcm_kg","tare_kg",
  ];
  const header = [
    "Fleet No","Vehicle Type","Sub Type","Make","Model","Year","VIN","Status",
    "Depot","Rego No","Rego State","Rego Expiry",
    "NHVAS Mass","Mass Active","DG Lic Req","DG Expiry",
    "Current Kms","Acquired Date","Acq Price","Class","GVM (kg)","GCM (kg)","Tare (kg)",
  ];
  const escape = (v: unknown) => {
    const s = fmt(v as string);
    return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [header.join(","), ...rows.map(r => cols.map(c => escape(r[c])).join(","))];
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `tasco-fleet-report-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
}

export default function VehicleReportsPage() {
  const { visible, toggle, selectAll } = useColumns("vehicle-report-cols", REPORT_COLS);
  const [colPickerOpen, setColPickerOpen] = useState(false);
  const col = (key: string) => visible.has(key);
  const [locations, setLocations] = useState<Location[]>([]);
  const [filters, setFilters] = useState({
    depot: "", vehicleType: "", status: "active", make: "", model: "",
    registrationNo: "", registrationState: "", fleetNo: "", vin: "",
    nhvasMass: false, dgLicenceRequired: false, acquiredFrom: "", acquiredTo: "",
  });
  const [results, setResults] = useState<ReportRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [reportDate, setReportDate] = useState("");

  useEffect(() => {
    fetch("/api/locations").then(r => r.json()).then(setLocations);
  }, []);

  function set(key: string, val: string | boolean) {
    setFilters(f => ({ ...f, [key]: val }));
  }

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const q = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== "" && v !== false) q.set(k, String(v));
    });
    const res = await fetch(`/api/reports?${q}`);
    const data = await res.json();
    setResults(data);
    setReportDate(new Date().toLocaleString("en-AU"));
    setLoading(false);
  }

  return (
    <>
      <style>{`
        @media print {
          nav, .no-print { display: none !important; }
          .print-title { display: block !important; }
          body { font-size: 11px; }
          th, td { padding: 4px 6px; }
          table { font-size: 10px; }
        }
        .print-title { display: none; }
        .filter-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
        .results-wrap { overflow-x: auto; }
        .export-bar { display: flex; gap: 10px; margin-bottom: 12px; }
        .btn-export { padding: 7px 14px; border-radius: 4px; border: none; cursor: pointer; font-size: 13px; font-weight: 600; }
        .btn-pdf { background: #1B3A6B; color: #fff; }
        .btn-csv { background: #137333; color: #fff; }
        tr:hover td { background: #f5f8ff; }
      `}</style>

      <div className="print-title">
        <h2 style={{ margin: 0 }}>Tasco Carriers Fleet — Vehicle Report</h2>
        <p style={{ margin: "4px 0 16px", color: "#555", fontSize: 12 }}>Generated: {reportDate}</p>
      </div>

      <div className="no-print">
        <Link href="/reports" style={{ fontSize: 13, color: "#1B3A6B", textDecoration: "none" }}>← All Reports</Link>
        <div style={{ background: "#1B3A6B", color: "#fff", padding: "14px 20px", borderRadius: 8, marginBottom: 20, marginTop: 12 }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>Vehicle Reports</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, opacity: 0.85 }}>Filter by any combination of fields, then export</p>
        </div>

        <form onSubmit={generate}>
          <div className="filter-grid" style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13 }}>
              Depot / Location
              <select value={filters.depot} onChange={e => set("depot", e.target.value)} style={{ display: "block", width: "100%", marginTop: 4 }}>
                <option value="">All depots</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </label>
            <label style={{ fontSize: 13 }}>
              Vehicle Type
              <select value={filters.vehicleType} onChange={e => set("vehicleType", e.target.value)} style={{ display: "block", width: "100%", marginTop: 4 }}>
                <option value="">All types</option>
                {["Prime Mover","Rigid","Trailer","Semi Trailer","B-Train","Dog Trailer","Tanker","Crane Truck","Bus","Other"].map(t =>
                  <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label style={{ fontSize: 13 }}>
              Status
              <select value={filters.status} onChange={e => set("status", e.target.value)} style={{ display: "block", width: "100%", marginTop: 4 }}>
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="disposed">Disposed</option>
              </select>
            </label>
            <label style={{ fontSize: 13 }}>
              Make
              <input value={filters.make} onChange={e => set("make", e.target.value)} placeholder="e.g. Kenworth" style={{ display: "block", width: "100%", marginTop: 4, boxSizing: "border-box" }} />
            </label>
            <label style={{ fontSize: 13 }}>
              Model
              <input value={filters.model} onChange={e => set("model", e.target.value)} placeholder="e.g. T610" style={{ display: "block", width: "100%", marginTop: 4, boxSizing: "border-box" }} />
            </label>
            <label style={{ fontSize: 13 }}>
              Fleet No
              <input value={filters.fleetNo} onChange={e => set("fleetNo", e.target.value)} placeholder="e.g. 503" style={{ display: "block", width: "100%", marginTop: 4, boxSizing: "border-box" }} />
            </label>
            <label style={{ fontSize: 13 }}>
              VIN
              <input value={filters.vin} onChange={e => set("vin", e.target.value)} placeholder="partial match" style={{ display: "block", width: "100%", marginTop: 4, boxSizing: "border-box" }} />
            </label>
            <label style={{ fontSize: 13 }}>
              Registration No
              <input value={filters.registrationNo} onChange={e => set("registrationNo", e.target.value)} placeholder="partial match" style={{ display: "block", width: "100%", marginTop: 4, boxSizing: "border-box" }} />
            </label>
            <label style={{ fontSize: 13 }}>
              Rego State
              <input value={filters.registrationState} onChange={e => set("registrationState", e.target.value)} placeholder="VIC / NSW / QLD…" style={{ display: "block", width: "100%", marginTop: 4, boxSizing: "border-box" }} />
            </label>
            <label style={{ fontSize: 13 }}>
              Acquired From
              <input type="date" value={filters.acquiredFrom} onChange={e => set("acquiredFrom", e.target.value)} style={{ display: "block", width: "100%", marginTop: 4, boxSizing: "border-box" }} />
            </label>
            <label style={{ fontSize: 13 }}>
              Acquired To
              <input type="date" value={filters.acquiredTo} onChange={e => set("acquiredTo", e.target.value)} style={{ display: "block", width: "100%", marginTop: 4, boxSizing: "border-box" }} />
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 4 }}>
              <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={filters.nhvasMass} onChange={e => set("nhvasMass", e.target.checked)} />
                NHVAS Mass accredited only
              </label>
              <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={filters.dgLicenceRequired} onChange={e => set("dgLicenceRequired", e.target.checked)} />
                DG Licence required only
              </label>
            </div>
          </div>

          <button type="submit" disabled={loading} style={{ background: "#1B3A6B", color: "#fff", border: "none", padding: "10px 24px", borderRadius: 5, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            {loading ? "Generating…" : "Generate Report"}
          </button>

          {results !== null && (
            <span style={{ marginLeft: 16, fontSize: 13, color: "#555" }}>
              {results.length} vehicle{results.length !== 1 ? "s" : ""} found
            </span>
          )}
        </form>
      </div>

      {results !== null && results.length > 0 && (
        <>
          <div className="export-bar no-print" style={{ marginTop: 20 }}>
            <button className="btn-export btn-pdf" onClick={() => window.print()}>Print / Save PDF</button>
            <button className="btn-export btn-csv" onClick={() => downloadCSV(results)}>Download CSV</button>
            {/* Column picker */}
            <div style={{ position: "relative", display: "inline-block", marginLeft: 8 }}>
              <button onClick={() => setColPickerOpen(o => !o)}
                style={{ background: "#fff", color: "#1B3A6B", border: "1px solid #1B3A6B", fontSize: 13, padding: "5px 12px" }}>
                Columns ({REPORT_COLS.filter(c => !c.always && visible.has(c.key)).length + 1}/{REPORT_COLS.length}) ▾
              </button>
              {colPickerOpen && (
                <div style={{
                  position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 200,
                  background: "#fff", border: "1px solid #dce6f5", borderRadius: 8,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.15)", padding: "12px 0",
                  minWidth: 200, maxHeight: 380, overflowY: "auto",
                }}>
                  <div style={{ padding: "0 14px 8px", borderBottom: "1px solid #f0f4fa", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#1B3A6B" }}>Report Columns</span>
                    <button onClick={() => selectAll()} style={{ fontSize: 11, color: "#1B3A6B", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>All</button>
                  </div>
                  {REPORT_COLS.map(c => (
                    <label key={c.key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 14px", cursor: c.always ? "default" : "pointer" }}>
                      <input type="checkbox" checked={visible.has(c.key)} disabled={c.always}
                        onChange={e => toggle(c.key, e.target.checked)}
                        style={{ width: 13, height: 13, margin: 0, accentColor: "#1B3A6B" }} />
                      <span style={{ fontSize: 13, color: c.always ? "#aaa" : "#333" }}>{c.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <p className="print-title" style={{ fontSize: 12, color: "#555", margin: "0 0 8px" }}>
            {results.length} vehicle{results.length !== 1 ? "s" : ""} — Generated: {reportDate}
          </p>

          <div className="results-wrap">
            <table style={{ fontSize: 12 }}>
              <thead>
                <tr>
                  <th>Fleet No</th>
                  {col("vehicle_type")        && <th>Type</th>}
                  {col("sub_type")            && <th>Sub Type</th>}
                  {col("make")                && <th>Make</th>}
                  {col("model")               && <th>Model</th>}
                  {col("year")                && <th>Year</th>}
                  {col("vin")                 && <th>VIN</th>}
                  {col("status")              && <th>Status</th>}
                  {col("location_name")       && <th>Depot</th>}
                  {col("registration_no")     && <th>Rego No</th>}
                  {col("registration_state")  && <th>Rego St</th>}
                  {col("registration_expiry") && <th>Rego Expiry</th>}
                  {col("nhvas_mass")          && <th>NHVAS Mass</th>}
                  {col("mass_active")         && <th>Mass Active</th>}
                  {col("dg_licence_required") && <th>DG Lic</th>}
                  {col("dg_expiry_date")      && <th>DG Expiry</th>}
                  {col("current_kms")         && <th>KMs</th>}
                  {col("acquired_date")       && <th>Acquired</th>}
                  {col("acquisition_price")   && <th>Acq Price</th>}
                  {col("class_name")          && <th>Class</th>}
                  {col("gvm_kg")              && <th>GVM</th>}
                  {col("gcm_kg")              && <th>GCM</th>}
                  {col("tare_kg")             && <th>Tare</th>}
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i}>
                    <td>{fmt(r.fleet_no)}</td>
                    {col("vehicle_type")        && <td>{fmt(r.vehicle_type)}</td>}
                    {col("sub_type")            && <td>{fmt(r.sub_type)}</td>}
                    {col("make")                && <td>{fmt(r.make)}</td>}
                    {col("model")               && <td>{fmt(r.model)}</td>}
                    {col("year")                && <td>{fmt(r.year)}</td>}
                    {col("vin")                 && <td style={{ fontFamily: "monospace", fontSize: 11 }}>{fmt(r.vin)}</td>}
                    {col("status")              && <td><span style={{ padding: "1px 7px", borderRadius: 10, fontSize: 11, fontWeight: 600, background: r.status === "active" ? "#e6f4ea" : "#fce8e6", color: r.status === "active" ? "#137333" : "#c5221f" }}>{r.status}</span></td>}
                    {col("location_name")       && <td>{fmt(r.location_name)}</td>}
                    {col("registration_no")     && <td>{fmt(r.registration_no)}</td>}
                    {col("registration_state")  && <td>{fmt(r.registration_state)}</td>}
                    {col("registration_expiry") && <td>{fmtDate(r.registration_expiry)}</td>}
                    {col("nhvas_mass")          && <td>{fmt(r.nhvas_mass)}</td>}
                    {col("mass_active")         && <td>{fmt(r.mass_active)}</td>}
                    {col("dg_licence_required") && <td>{fmt(r.dg_licence_required)}</td>}
                    {col("dg_expiry_date")      && <td>{fmtDate(r.dg_expiry_date)}</td>}
                    {col("current_kms")         && <td>{fmtNum(r.current_kms)}</td>}
                    {col("acquired_date")       && <td>{fmtDate(r.acquired_date)}</td>}
                    {col("acquisition_price")   && <td>{r.acquisition_price ? `$${fmtNum(r.acquisition_price)}` : "—"}</td>}
                    {col("class_name")          && <td>{fmt(r.class_name)}</td>}
                    {col("gvm_kg")              && <td>{fmtNum(r.gvm_kg)}</td>}
                    {col("gcm_kg")              && <td>{fmtNum(r.gcm_kg)}</td>}
                    {col("tare_kg")             && <td>{fmtNum(r.tare_kg)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {results !== null && results.length === 0 && (
        <p style={{ color: "#888", marginTop: 20 }}>No vehicles match the selected filters.</p>
      )}
    </>
  );
}
