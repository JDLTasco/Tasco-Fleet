import { query } from "./db";

export async function logAudit(
  tableName: string,
  recordId: string,
  action: "insert" | "update" | "delete",
  changedBy: string | null,
  changedFields?: Record<string, unknown>
) {
  await query(
    `INSERT INTO audit_log (table_name, record_id, action, changed_by, changed_fields)
     VALUES ($1,$2,$3,$4,$5)`,
    [tableName, recordId, action, changedBy, changedFields ? JSON.stringify(changedFields) : null]
  );
}
