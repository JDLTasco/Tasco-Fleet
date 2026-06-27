"use client";
import { useEffect, useRef, useState } from "react";

export type ColDef = { key: string; label: string; always?: boolean };

interface Props {
  storageKey: string;
  columns: ColDef[];
  onChange: (visible: Set<string>) => void;
}

export function useColumns(storageKey: string, columns: ColDef[]) {
  const allKeys = columns.map(c => c.key);
  const alwaysKeys = columns.filter(c => c.always).map(c => c.key);

  const [visible, setVisible] = useState<Set<string>>(() => new Set(allKeys));

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed: string[] = JSON.parse(saved);
        setVisible(new Set([...alwaysKeys, ...parsed.filter(k => allKeys.includes(k))]));
      }
    } catch {}
  }, [storageKey]);

  function toggle(key: string, on: boolean) {
    setVisible(prev => {
      const next = new Set(prev);
      on ? next.add(key) : next.delete(key);
      try {
        localStorage.setItem(storageKey, JSON.stringify([...next].filter(k => !alwaysKeys.includes(k))));
      } catch {}
      return next;
    });
  }

  function selectAll() {
    const next = new Set(allKeys);
    setVisible(next);
    try { localStorage.setItem(storageKey, JSON.stringify(allKeys.filter(k => !alwaysKeys.includes(k)))); } catch {}
  }

  return { visible, toggle, selectAll };
}

export default function ColumnSelector({ storageKey, columns, onChange }: Props) {
  const { visible, toggle, selectAll } = useColumns(storageKey, columns);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const alwaysKeys = columns.filter(c => c.always).map(c => c.key);
  const optional = columns.filter(c => !c.always);
  const selectedOptional = optional.filter(c => visible.has(c.key)).length;

  useEffect(() => { onChange(visible); }, [visible]);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ background: "#fff", color: "#1B3A6B", border: "1px solid #1B3A6B", fontSize: 13, padding: "5px 12px", display: "flex", alignItems: "center", gap: 5 }}>
        Columns <span style={{ fontSize: 11, color: "#888" }}>({selectedOptional + alwaysKeys.length}/{columns.length})</span> ▾
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 200,
          background: "#fff", border: "1px solid #dce6f5", borderRadius: 8,
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)", padding: "12px 0",
          minWidth: 220, maxHeight: 400, overflowY: "auto",
        }}>
          <div style={{ padding: "0 14px 8px", borderBottom: "1px solid #f0f4fa", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#1B3A6B" }}>Visible Columns</span>
            <button onClick={selectAll}
              style={{ fontSize: 11, color: "#1B3A6B", background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline" }}>
              Select all
            </button>
          </div>

          {columns.map(col => (
            <label key={col.key} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "6px 14px", cursor: col.always ? "default" : "pointer",
              background: "transparent",
              transition: "background 0.1s",
            }}
              onMouseEnter={e => { if (!col.always) (e.currentTarget as HTMLElement).style.background = "#f0f4fa"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <input type="checkbox"
                checked={visible.has(col.key)}
                disabled={col.always}
                onChange={e => toggle(col.key, e.target.checked)}
                style={{ width: 14, height: 14, margin: 0, accentColor: "#1B3A6B" }}
              />
              <span style={{ fontSize: 13, color: col.always ? "#aaa" : "#333" }}>
                {col.label}
                {col.always && <span style={{ fontSize: 10, color: "#bbb", marginLeft: 4 }}>(always)</span>}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
