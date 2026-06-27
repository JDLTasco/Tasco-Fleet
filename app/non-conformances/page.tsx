"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { NC_TYPES, NC_TYPE_MAP } from "@/lib/nc-types";

type NC = {
  id: string; incident_type: string; description: string; incident_date: string;
  notes: string; created_at: string; fleet_no: string; make: string; model: string;
  driver_name: string; driver_code: string; depot_name: string;
};
type Vehicle = { id: string; fleet_no: string; make: string; model: string };
type Driver = { id: string; first_name: string; last_name: string; driver_code: string };

export default function NonConformancesPage() {
  const [records, setRecords] = useState<NC[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    vehicle_id: "", driver_id: "", incident_type: "", description: "", incident_date: "", notes: "",
  });
  const [descLen, setDescLen] = useState(0);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState("");
  const [filterVehicle, setFilterVehicle] = useState("");
  const [filterDriver, setFilterDriver] = useState("");

  function load() {
    const p = new URLSearchParams();
    if (filterType) p.set("incidentType", filterType);
    if (filterVehicle) p.set("vehicleId", filterVehicle);
    if (filterDriver) p.set("driverId", filterDriver);
    fetch(`/api/non-conformances?${p}`).then(r => r.json()).then(setRecords);
  }

  useEffect(() => {
    fetch("/api/vehicles").then(r => r.json()).then(setVehicles);
    fetch("/api/drivers").then(r => r.json()).then(setDrivers);
  }, []);

  useEffect(() => { load(); }, [filterType, filterVehicle, filterDriver]);

  function setDesc(val: string) {
    if (val.length <= 50) { setForm(f => ({ ...f, description: val })); setDescLen(val.length); }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(""); setSaving(true);
    if (!form.vehicle_id && !form.driver_id) {
      setError("Please select a vehicle and/or driver."); setSaving(false); return;
    }
    const res = await fetch("/api/non-conformances", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm({ vehicle_id: "", driver_id: "", incident_type: "", description: "", incident_date: "", notes: "" });
      setDescLen(0); setShowForm(false); load();
    } else {
      const d = await res.json(); setError(d.error);
    }
    setSaving(false);
  }

  async function deleteNC(id: string) {
    if (!confirm("Delete this non-conformance record?")) return;
    await fetch(`/api/non-conformances/${id}`, { method: "DELETE" });
    load();
  }

  function TypeBadge({ type }: { type: string }) {
    const t = NC_TYPE_MAP[type];
    if (!t) return <span>{type}</span>;
    return (
      <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600, background: t.bg, color: t.color, whiteSpace: "nowrap" }}>
        {t.label}
      </span>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0 }}>Non-Conformances</h2>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "#666" }}>Record and track incidents by vehicle and/or driver</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/reports/non-conformances"
            style={{ fontSize: 13, color: "#1B3A6B", border: "1px solid #1B3A6B", padding: "6px 14px", borderRadius: 5, textDecoration: "none" }}>
            Report &amp; Graphs
          </Link>
          <button onClick={() => setShowForm(!showForm)} style={{ background: "#1B3A6B" }}>
            {showForm ? "Cancel" : "+ Add Record"}
          </button>
        </div>
      </div>

      {showForm && (
        <div style={{ background: "#f8fafd", border: "1px solid #dce6f5", borderRadius: 8, padding: 20, marginBottom: 20 }}>
          <h3 style={{ margin: "0 0 16px", color: "#1B3A6B" }}>New Non-Conformance</h3>
          <form onSubmit={submit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 16px" }}>
              <label>
                <span style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 3 }}>Vehicle (optional)</span>
                <select value={form.vehicle_id} onChange={e => setForm(f => ({ ...f, vehicle_id: e.target.value }))}>
                  <option value="">— None —</option>
                  {vehicles.map((v: any) => (
                    <option key={v.id} value={v.id}>{v.fleet_no}{v.make ? ` — ${v.make}` : ""}{v.model ? ` ${v.model}` : ""}</option>
                  ))}
                </select>
              </label>
              <label>
                <span style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 3 }}>Driver (optional)</span>
                <select value={form.driver_id} onChange={e => setForm(f => ({ ...f, driver_id: e.target.value }))}>
                  <option value="">— None —</option>
                  {drivers.map((d: any) => (
                    <option key={d.id} value={d.id}>{d.first_name} {d.last_name}{d.driver_code ? ` (${d.driver_code})` : ""}</option>
                  ))}
                </select>
              </label>
              <label>
                <span style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 3 }}>Incident Type *</span>
                <select required value={form.incident_type} onChange={e => setForm(f => ({ ...f, incident_type: e.target.value }))}>
                  <option value="">— Select type —</option>
                  {NC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </label>
              <label>
                <span style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 3 }}>Incident Date *</span>
                <input type="date" required value={form.incident_date} onChange={e => setForm(f => ({ ...f, incident_date: e.target.value }))} />
              </label>
              <label style={{ gridColumn: "span 2" }}>
                <span style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 3 }}>
                  Description *{" "}
                  <span style={{ fontWeight: 400, color: descLen > 45 ? "#c5221f" : "#888" }}>({descLen}/50 characters)</span>
                </span>
                <input required value={form.description} onChange={e => setDesc(e.target.value)}
                  placeholder="Brief description of the non-conformance" maxLength={50} />
              </label>
            </div>
            <label style={{ marginTop: 8, display: "block" }}>
              <span style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 3 }}>Notes (optional)</span>
              <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Additional details…" style={{ width: "100%", boxSizing: "border-box" }} />
            </label>
            {error && <p className="error">{error}</p>}
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button type="submit" disabled={saving} style={{ background: "#1B3A6B" }}>{saving ? "Saving…" : "Save Record"}</button>
              <button type="button" onClick={() => setShowForm(false)} style={{ background: "#eee", color: "#333", border: "none" }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ fontSize: 13 }}>
          <option value="">All Types</option>
          {NC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select value={filterVehicle} onChange={e => setFilterVehicle(e.target.value)} style={{ fontSize: 13 }}>
          <option value="">All Vehicles</option>
          {vehicles.map((v: any) => <option key={v.id} value={v.id}>{v.fleet_no} {v.make}</option>)}
        </select>
        <select value={filterDriver} onChange={e => setFilterDriver(e.target.value)} style={{ fontSize: 13 }}>
          <option value="">All Drivers</option>
          {drivers.map((d: any) => <option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>)}
        </select>
        {(filterType || filterVehicle || filterDriver) && (
          <button onClick={() => { setFilterType(""); setFilterVehicle(""); setFilterDriver(""); }}
            style={{ fontSize: 12, background: "#eee", color: "#333", border: "none" }}>Clear filters</button>
        )}
      </div>

      <p style={{ fontSize: 12, color: "#888", margin: "0 0 8px" }}>{records.length} record{records.length !== 1 ? "s" : ""}</p>

      <table>
        <thead>
          <tr>
            <th>Date</th><th>Type</th><th>Description</th><th>Vehicle</th>
            <th>Driver</th><th>Depot</th><th>Notes</th><th></th>
          </tr>
        </thead>
        <tbody>
          {records.map(r => (
            <tr key={r.id}>
              <td style={{ whiteSpace: "nowrap" }}>{new Date(r.incident_date).toLocaleDateString("en-AU")}</td>
              <td><TypeBadge type={r.incident_type} /></td>
              <td>{r.description}</td>
              <td>{r.fleet_no ? `${r.fleet_no}${r.make ? ` ${r.make}` : ""}` : "—"}</td>
              <td>{r.driver_name?.trim() || "—"}</td>
              <td>{r.depot_name || "—"}</td>
              <td style={{ maxWidth: 200, fontSize: 12, color: "#666" }}>{r.notes || "—"}</td>
              <td>
                <button onClick={() => deleteNC(r.id)}
                  style={{ fontSize: 11, padding: "2px 8px", background: "#fce8e6", color: "#c5221f", border: "1px solid #c5221f" }}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {records.length === 0 && <p style={{ color: "#888", marginTop: 16 }}>No records found.</p>}
    </div>
  );
}
