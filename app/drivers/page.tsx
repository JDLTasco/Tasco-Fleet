"use client";
import { useEffect, useState } from "react";

type Driver = {
  id: string; driver_code: string; first_name: string; last_name: string;
  licence_no: string; licence_type: string; licence_expiry: string;
  dg_licence_no: string; dg_licence_expiry: string; status: string; home_location: string;
};

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>({});
  const [error, setError] = useState("");

  function load() {
    fetch("/api/drivers").then((r) => r.json()).then(setDrivers);
  }
  useEffect(load, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/drivers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm({});
      setShowForm(false);
      load();
    } else {
      const d = await res.json();
      setError(d.error);
    }
  }

  function expiryWarning(dateStr: string) {
    if (!dateStr) return false;
    const days = (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return days < 30;
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>Drivers</h2>
        <button onClick={() => setShowForm(!showForm)}>{showForm ? "Cancel" : "Add driver"}</button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="section">
          <label>First name <input required value={form.first_name || ""} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></label>
          <label>Last name <input required value={form.last_name || ""} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></label>
          <label>Driver code <input value={form.driver_code || ""} onChange={(e) => setForm({ ...form, driver_code: e.target.value })} /></label>
          <label>Licence no <input value={form.licence_no || ""} onChange={(e) => setForm({ ...form, licence_no: e.target.value })} /></label>
          <label>Licence type (e.g. HC, MC, HR) <input value={form.licence_type || ""} onChange={(e) => setForm({ ...form, licence_type: e.target.value })} /></label>
          <label>Licence expiry <input type="date" value={form.licence_expiry || ""} onChange={(e) => setForm({ ...form, licence_expiry: e.target.value })} /></label>
          <label>DG licence no <input value={form.dg_licence_no || ""} onChange={(e) => setForm({ ...form, dg_licence_no: e.target.value })} /></label>
          <label>DG licence expiry <input type="date" value={form.dg_licence_expiry || ""} onChange={(e) => setForm({ ...form, dg_licence_expiry: e.target.value })} /></label>
          <label>Phone <input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
          {error && <p className="error">{error}</p>}
          <button type="submit">Save driver</button>
        </form>
      )}

      <table>
        <thead>
          <tr><th>Code</th><th>Name</th><th>Licence</th><th>Licence Expiry</th><th>DG Licence</th><th>DG Expiry</th><th>Home Depot</th></tr>
        </thead>
        <tbody>
          {drivers.map((d) => (
            <tr key={d.id}>
              <td>{d.driver_code || "—"}</td>
              <td>{d.first_name} {d.last_name}</td>
              <td>{d.licence_type} {d.licence_no}</td>
              <td style={{ color: expiryWarning(d.licence_expiry) ? "#c5221f" : undefined }}>
                {d.licence_expiry ? new Date(d.licence_expiry).toLocaleDateString("en-AU") : "—"}
              </td>
              <td>{d.dg_licence_no || "—"}</td>
              <td style={{ color: expiryWarning(d.dg_licence_expiry) ? "#c5221f" : undefined }}>
                {d.dg_licence_expiry ? new Date(d.dg_licence_expiry).toLocaleDateString("en-AU") : "—"}
              </td>
              <td>{d.home_location || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {drivers.length === 0 && <p style={{ color: "#888" }}>No drivers yet.</p>}
    </div>
  );
}
