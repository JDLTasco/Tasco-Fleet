"use client";
export default function BackButton({ label = "← Back" }: { label?: string }) {
  return (
    <button
      onClick={() => window.history.back()}
      style={{
        background: "transparent", color: "#1B3A6B",
        border: "1px solid #1B3A6B", padding: "6px 14px",
        borderRadius: 5, cursor: "pointer", fontSize: 13, marginBottom: 16,
      }}
    >
      {label}
    </button>
  );
}
