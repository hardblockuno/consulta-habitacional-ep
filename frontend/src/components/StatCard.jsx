export default function StatCard({ label, value, icon: Icon, tone = "slate" }) {
  const tones = {
    slate: "border-slate-200 bg-white text-slate-950",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-900",
    amber: "border-amber-200 bg-amber-50 text-amber-950",
    rose: "border-rose-200 bg-rose-50 text-rose-950",
    cyan: "border-cyan-200 bg-cyan-50 text-cyan-950",
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-950",
    violet: "border-violet-200 bg-violet-50 text-violet-950",
  };
  return (
    <div className={`rounded-lg border p-4 shadow-sm ${tones[tone] || tones.slate}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium opacity-75">{label}</p>
          <p className="mt-2 text-3xl font-semibold">{Number(value || 0).toLocaleString("es-CL")}</p>
        </div>
        {Icon ? (
          <div className="rounded-lg bg-white/70 p-2 shadow-sm">
            <Icon size={20} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
