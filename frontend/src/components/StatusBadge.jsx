const dotStyles = {
  apta: "bg-emerald-500",
  observada: "bg-amber-500",
  bloqueada: "bg-rose-500",
  preventiva: "bg-amber-500",
  critica: "bg-rose-500",
};

export default function StatusBadge({ value }) {
  const clean = value ? value.replaceAll("_", " ") : "";
  const label = clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : "Sin estado";
  const dotColor = dotStyles[value] || "bg-slate-400";

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 shadow-2xs">
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
      {label}
    </span>
  );
}
