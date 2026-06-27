"use client";
import { useState } from "react";
import Link from "next/link";
import ColumnSelector, { useColumns, ColDef } from "./ColumnSelector";
import VehicleRowActions from "./VehicleRowActions";

const COLUMNS: ColDef[] = [
  { key: "fleet_no",             label: "Fleet No",    always: true },
  { key: "vehicle_type",         label: "Type" },
  { key: "make_model",           label: "Make / Model" },
  { key: "registration_no",      label: "Rego" },
  { key: "registration_expiry",  label: "Rego Expiry" },
  { key: "current_kms",          label: "KMs" },
  { key: "location_name",        label: "Depot" },
  { key: "status",               label: "Status" },
  { key: "actions",              label: "Actions",     always: true },
];

type Vehicle = {
  id: string; fleet_no: string; vehicle_type: string; sub_type: string;
  make: string; model: string; status: string; current_kms: number;
  location_id: string; location_name: string;
  registration_no: string; registration_expiry: string;
};
type Location = { id: string; name: string };

export default function VehicleTable({ vehicles, locations }: { vehicles: Vehicle[]; locations: Location[] }) {
  const { visible, toggle, selectAll } = useColumns("vehicle-list-cols", COLUMNS);
  const [open, setOpen] = useState(false);
  const alwaysKeys = COLUMNS.filter(c => c.always).map(c => c.key);
  const optional = COLUMNS.filter(c => !c.always);

  function col(key: string) { return visible.has(key); }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
        <div style={{ position: "relative", display: "inline-block" }}>
          <button onClick={() => setOpen(o => !o)}
            style={{ background: "#fff", color: "#1B3A6B", border: "1px solid #1B3A6B", fontSize: 13, padding: "5px 12px", display: "flex", alignItems: "center", gap: 5 }}>
            Columns <span style={{ fontSize: 11, color: "#888" }}>
              ({optional.filter(c => visible.has(c.key)).length + alwaysKeys.length}/{COLUMNS.length})
            </span> ▾
          </button>

          {open && (
            <div style={{
              position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 200,
              background: "#fff", border: "1px solid #dce6f5", borderRadius: 8,
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)", padding: "12px 0",
              minWidth: 220,
            }}>
              <div style={{ padding: "0 14px 8px", borderBottom: "1px solid #f0f4fa", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#1B3A6B" }}>Visible Columns</span>
                <button onClick={() => { selectAll(); }}
                  style={{ fontSize: 11, color: "#1B3A6B", background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline" }}>
                  Select all
                </button>
              </div>
              {COLUMNS.map(c => (
                <label key={c.key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", cursor: c.always ? "default" : "pointer" }}>
                  <input type="checkbox" checked={visible.has(c.key)} disabled={c.always}
                    onChange={e => toggle(c.key, e.target.checked)}
                    style={{ width: 14, height: 14, margin: 0, accentColor: "#1B3A6B" }}
                  />
                  <span style={{ fontSize: 13, color: c.always ? "#aaa" : "#333" }}>
                    {c.label}{c.always && <span style={{ fontSize: 10, color: "#bbb", marginLeft: 4 }}>(always)</span>}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <p style={{ fontSize: 12, color: "#888", margin: "0 0 8px" }}>
        {vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""}
      </p>

      <table>
        <thead>
          <tr>
            <th>Fleet No</th>
            {col("vehicle_type")        && <th>Type</th>}
            {col("make_model")          && <th>Make / Model</th>}
            {col("registration_no")     && <th>Rego</th>}
            {col("registration_expiry") && <th>Rego Expiry</th>}
            {col("current_kms")         && <th>KMs</th>}
            {col("location_name")       && <th>Depot</th>}
            {col("status")              && <th>Status</th>}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map((v: any) => (
            <tr key={v.id}>
              <td><Link href={`/vehicles/${v.id}`}>{v.fleet_no}</Link></td>
              {col("vehicle_type")        && <td>{v.vehicle_type}{v.sub_type ? ` — ${v.sub_type}` : ""}</td>}
              {col("make_model")          && <td>{[v.make, v.model].filter(Boolean).join(" ")}</td>}
              {col("registration_no")     && <td>{v.registration_no || "—"}</td>}
              {col("registration_expiry") && <td>{v.registration_expiry ? new Date(v.registration_expiry).toLocaleDateString("en-AU") : "—"}</td>}
              {col("current_kms")         && <td>{v.current_kms?.toLocaleString() || "—"}</td>}
              {col("location_name")       && <td>{v.location_name || "—"}</td>}
              {col("status")              && <td><span className={`badge ${v.status}`}>{v.status}</span></td>}
              <td>
                <VehicleRowActions
                  vehicleId={v.id} fleetNo={v.fleet_no}
                  status={v.status} currentDepotId={v.location_id} locations={locations}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {vehicles.length === 0 && <p style={{ color: "#888", marginTop: 16 }}>No vehicles match this filter.</p>}
    </div>
  );
}
