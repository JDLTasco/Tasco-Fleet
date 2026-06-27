"use client";
import { useEffect, useState } from "react";

export default function MassVerificationsPage() {
  const [recent, setRecent] = useState<any[]>([]);
  const [form, setForm] = useState<any>({ weigh_date: new Date().toISOString().slice(0, 10) });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function load() {
    fetch("/api/mass-verifications").then((r) => r.json()).then(setRecent);
  }
  useEffect(load, []);

  function field(name: string) {
    return {
      value: form[name] || "",
      onChange: (e: any) => setForm({ ...form, [name]: e.target.value }),
    };
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    const res = await fetch("/api/mass-verifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      setSuccess(`Saved. Total mass: ${data.total_mass_kg.toLocaleString()} kg`);
      setForm({ weigh_date: new Date().toISOString().slice(0, 10) });
      load();
    } else {
      setError(data.error);
    }
  }

  return (
    <div>
      <h2>Mass / Weighbridge Verification</h2>
      <p style={{ color: "#666", fontSize: 13 }}>
        Enter the weighbridge docket here at the time of weighing. This feeds your NHVAS Mass Management
        compliance record directly — no more transcribing paper dockets back at the office.
      </p>

      <form onSubmit={submit} className="section" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
        <label>Fleet No (prime mover) <input required {...field("fleet_no")} placeholder="e.g. 503" /></label>
        <label>Depot <input {...field("depot")} /></label>
        <label>Weigh date <input type="date" required {...field("weigh_date")} /></label>
        <label>Weigh time <input type="time" {...field("weigh_time")} /></label>
        <label>Weighbridge name <input {...field("weighbridge_name")} /></label>
        <label>Weighbridge state <input {...field("weighbridge_state")} placeholder="VIC" /></label>
        <label>Weighbridge address <input {...field("weighbridge_address")} /></label>
        <label>Docket reference <input {...field("docket_reference")} /></label>
        <label>Driver name <input {...field("driver_name")} /></label>
        <div />
        <label>Steer axle weight (kg) <input type="number" {...field("steer_axle_weight_kg")} /></label>
        <label>Drive axle weight (kg) <input type="number" {...field("drive_axle_weight_kg")} /></label>
        <label>Trailer 1 axle weight (kg) <input type="number" {...field("trailer_1_axle_weight_kg")} /></label>
        <label>Trailer 2 axle weight (kg) <input type="number" {...field("trailer_2_axle_weight_kg")} /></label>
        <label>Trailer 3 axle weight (kg) <input type="number" {...field("trailer_3_axle_weight_kg")} /></label>
        <div />
        {error && <p className="error" style={{ gridColumn: "1 / -1" }}>{error}</p>}
        {success && <p style={{ color: "#137333", gridColumn: "1 / -1" }}>{success}</p>}
        <button type="submit" style={{ gridColumn: "1 / -1", justifySelf: "start" }}>Submit verification</button>
      </form>

      <div className="section">
        <h3>Recent submissions</h3>
        <table>
          <thead><tr><th>Date</th><th>Fleet No</th><th>Depot</th><th>Weighbridge</th><th>Docket</th><th>Total Mass (kg)</th></tr></thead>
          <tbody>
            {recent.map((r) => (
              <tr key={r.id}>
                <td>{r.weigh_date ? new Date(r.weigh_date).toLocaleDateString("en-AU") : "—"}</td>
                <td>{r.fleet_no || "—"}</td>
                <td>{r.depot || "—"}</td>
                <td>{r.weighbridge_name || "—"}</td>
                <td>{r.docket_reference || "—"}</td>
                <td>{r.total_mass_kg?.toLocaleString() || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
