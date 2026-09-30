export default function Section({ title, actions, children }) {
  return (
    <section className="rounded-lg border border-slate-200/80 bg-white p-4 shadow-2xs">
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xs font-semibold text-slate-900">{title}</h2>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}
