export default function StatCard({ label, value, icon: Icon, tone = "slate" }) {
  const dotColors = {
    slate: "bg-slate-400",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
    sky: "bg-sky-500",
    indigo: "bg-indigo-500",
    violet: "bg-purple-500",
  };

  return (
    <div className="rounded-lg border border-slate-200/90 bg-white p-3.5 shadow-2xs">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-400">
            {tone !== "slate" && <span className={`h-1.5 w-1.5 rounded-full ${dotColors[tone] || "bg-slate-400"}`} />}
            {label}
          </span>
          <p className="mt-1 font-mono text-xl font-semibold tracking-tight text-slate-900">
            {Number(value || 0).toLocaleString("es-CL")}
          </p>
        </div>
        {Icon ? (
          <div className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-100 bg-slate-50 text-slate-500">
            <Icon size={14} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
