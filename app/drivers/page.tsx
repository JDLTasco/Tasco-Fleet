"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Driver = {
  id: string; driver_code: string; first_name: string; last_name: string;
  licence_no: string; licence_type: string; licence_expiry: string;
  dg_licence_no: string; dg_licence_expiry: string; phone: string; status: string;
};
type Location = { id: string; name: string };
type DepotLink = { location_id: string; name: string };

function expiryColor(dateStr: string) {
  if (!dateStr) return undefined;
  const days = (new Date(dateStr).getTime() - Date.now()) / 86400000;
  return days < 0 ? "#c5221f" : days < 30 ? "#e37400" : undefined;
}

export default function DriversPage() {
  const router = useRouter();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>({});
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [managingDepots, setManagingDepots] = useState<string | null>(null);
  const [driverDepots, setDriverDepots] = useState<DepotLink[]>([]);
  const [addingDepot, setAddingDepot] = useState("");

  function load() {
    fetch("/api/drivers?status=" + statusFilter).then(r => r.json()).then(setDrivers);
  }

  useEffect(() => {
    load();
    fetch("/api/locations").then(r => r.json()).then(setLocations);
  }, [statusFilter]);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError("");
    const res = await fetch("/api/drivers", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { setForm({}); setShowForm(false); load(); }
    else { const d = await res.json(); setError(d.error); }
  }

  async function toggleArchive(d: Driver) {
    const isArchived = d.status === "inactive";
    const action = isArchived ? "restore" : "archive";
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} ${d.first_name} ${d.last_name}?`)) return;
    await fetch(`/api/drivers/${d.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: isArchived ? "active" : "inactive" }),
    });
    load();
  }

  async function openDepotManager(driverId: string) {
    setManagingDepots(driverId);
    const rows = await fetch(`/api/drivers/${driverId}/locations`).then(r => r.json());
    setDriverDepots(rows);
    setAddingDepot("");
  }

  async function addDepot() {
    if (!addingDepot || !managingDepots) return;
    await fetch(`/api/drivers/${managingDepots}/locations`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locationId: addingDepot }),
    });
    const rows = await fetch(`/api/drivers/${managingDepots}/locations`).then(r => r.json());
    setDriverDepots(rows);
    setAddingDepot("");
  }

  async function removeDepot(locationId: string) {
    await fetch(`/api/drivers/${managingDepots}/locations`, {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locationId }),
    });
    setDriverDepots(d => d.filter(x => x.location_id !== locationId));
  }

  function f(name: string, label: string, type = "text") {
    return (
      <label>
        <span style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 3 }}>{label}</span>
        <input type={type} value={form[name] || ""} onChange={e => setForm({ ...form, [name]: e.target.value })} />
      </label>
    );
  }

  const filtered = drivers.filter(d =>
    statusFilter === "all" ? true : statusFilter === "active" ? d.status === "active" : d.status === "inactive"
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Drivers</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ fontSize: 13 }}>
            <option value="active">Active</option>
            <option value="inactive">Archived</option>
            <option value="all">All</option>
          </select>
          <button onClick={() => setShowForm(!showForm)} style={{ background: "#1B3A6B" }}>
            {showForm ? "Cancel" : "+ Add Driver"}
          </button>
        </div>
      </div>

      {showForm && (
        <div style={{ background: "#f8fafd", border: "1px solid #dce6f5", borderRadius: 8, padding: 20, marginBottom: 20 }}>
          <h3 style={{ margin: "0 0 16px", color: "#1B3A6B" }}>Add New Driver</h3>
          <form onSubmit={submit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 16px" }}>
              {f("first_name","First Name")}{f("last_name","Last Name")}{f("driver_code","Driver Code")}
              {f("phone","Phone")}{f("licence_no","Licence No")}{f("licence_type","Licence Type (HC, MC…)")}
              {f("licence_expiry","Licence Expiry","date")}{f("dg_licence_no","DG Licence No")}{f("dg_licence_expiry","DG Expiry","date")}
            </div>
            {error && <p className="error">{error}</p>}
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button type="submit" style={{ background: "#1B3A6B" }}>Save Driver</button>
              <button type="button" onClick={() => setShowForm(false)} style={{ background: "#eee", color: "#333", border: "none" }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <p style={{ fontSize: 12, color: "#888", margin: "0 0 8px" }}>{filtered.length} driver{filtered.length !== 1 ? "s" : ""}</p>

      <table>
        <thead>
          <tr>
            <th>Code</th><th>Name</th><th>Phone</th><th>Licence</th><th>Expiry</th>
            <th>DG Licence</th><th>DG Expiry</th><th>Status</th><th>Depots</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(d => (
            <tr key={d.id} style={{ opacity: d.status === "inactive" ? 0.6 : 1 }}>
              <td>{d.driver_code || "—"}</td>
              <td><strong>{d.first_name} {d.last_name}</strong></td>
              <td>{d.phone || "—"}</td>
              <td>{d.licence_type} {d.licence_no}</td>
              <td style={{ color: expiryColor(d.licence_expiry) }}>
                {d.licence_expiry ? new Date(d.licence_expiry).toLocaleDateString("en-AU") : "—"}
              </td>
              <td>{d.dg_licence_no || "—"}</td>
              <td style={{ color: expiryColor(d.dg_licence_expiry) }}>
                {d.dg_licence_expiry ? new Date(d.dg_licence_expiry).toLocaleDateString("en-AU") : "—"}
              </td>
              <td><span className={`badge ${d.status === "active" ? "active" : "disposed"}`}>{d.status}</span></td>
              <td>
                <button onClick={() => openDepotManager(d.id)}
                  style={{ fontSize: 11, padding: "2px 8px", background: "#eef2f9", color: "#1B3A6B", border: "1px solid #1B3A6B" }}>
                  Manage Depots
                </button>
              </td>
              <td>
                <button onClick={() => toggleArchive(d)}
                  style={{
                    fontSize: 11, padding: "2px 8px",
                    background: d.status === "inactive" ? "#e6f4ea" : "#fce8e6",
                    color: d.status === "inactive" ? "#137333" : "#c5221f",
                    border: `1px solid ${d.status === "inactive" ? "#137333" : "#c5221f"}`,
                  }}>
                  {d.status === "inactive" ? "Restore" : "Archive"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {filtered.length === 0 && <p style={{ color: "#888", marginTop: 16 }}>No drivers found.</p>}

      {/* Depot Manager Modal */}
      {managingDepots && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
        }}>
          <div style={{ background: "#fff", borderRadius: 10, padding: 28, width: 400, boxShadow: "0 8px 32px rgba(0,0,0,0.25)" }}>
            <h3 style={{ margin: "0 0 16px", color: "#1B3A6B" }}>Manage Depots</h3>
            <p style={{ fontSize: 13, color: "#666", margin: "0 0 12px" }}>Assigned depots:</p>
            {driverDepots.length === 0
              ? <p style={{ fontSize: 13, color: "#aaa" }}>No depots assigned.</p>
              : driverDepots.map(dl => (
                <div key={dl.location_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #eee" }}>
                  <span style={{ fontSize: 14 }}>{dl.name}</span>
                  <button onClick={() => removeDepot(dl.location_id)}
                    style={{ fontSize: 11, padding: "2px 8px", background: "#fce8e6", color: "#c5221f", border: "1px solid #c5221f" }}>
                    Remove
                  </button>
                </div>
              ))
            }
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <select value={addingDepot} onChange={e => setAddingDepot(e.target.value)} style={{ flex: 1 }}>
                <option value="">Add a depot…</option>
                {locations.filter(l => !driverDepots.find(d => d.location_id === l.id)).map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
              <button onClick={addDepot} disabled={!addingDepot} style={{ background: "#1B3A6B" }}>Add</button>
            </div>
            <button onClick={() => setManagingDepots(null)}
              style={{ width: "100%", marginTop: 16, background: "#eee", color: "#333", border: "none" }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
