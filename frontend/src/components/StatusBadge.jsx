const styles = {
  apta: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  observada: "bg-amber-100 text-amber-900 ring-amber-200",
  bloqueada: "bg-rose-100 text-rose-800 ring-rose-200",
  preventiva: "bg-amber-100 text-amber-900 ring-amber-200",
  critica: "bg-rose-100 text-rose-800 ring-rose-200",
};

export default function StatusBadge({ value }) {
  const clean = value ? value.replaceAll("_", " ") : "";
  const label = clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : "Sin estado";
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ring-1 ${
        styles[value] || "bg-slate-100 text-slate-700 ring-slate-200"
      }`}
    >
      {label}
    </span>
  );
}
