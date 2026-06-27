export const NC_TYPES = [
  { value: "rest_30",     label: "30 Min Rest NC",   bg: "#fef3e2", color: "#e37400" },
  { value: "admin",       label: "Admin NC",          bg: "#e8f0fe", color: "#1a73e8" },
  { value: "work_hours",  label: "Work Hours NC",     bg: "#fce8e6", color: "#c5221f" },
  { value: "diary",       label: "Diary NC",          bg: "#f3e8fd", color: "#7b1fa2" },
  { value: "distraction", label: "Distraction",       bg: "#e6f4ea", color: "#137333" },
] as const;

export type NCTypeValue = typeof NC_TYPES[number]["value"];

export const NC_TYPE_MAP = Object.fromEntries(NC_TYPES.map(t => [t.value, t])) as Record<
  string,
  { value: string; label: string; bg: string; color: string }
>;
