/**
 * Pie de página institucional con reserva de derechos de autoría para SIGEP.
 */
export default function FooterLegal({ subtitle = "", className = "" }) {
  return (
    <footer
      className={`border-t border-slate-200/70 py-4 px-4 text-center text-[11px] text-slate-400 ${className}`}
    >
      {subtitle && <p className="mb-0.5 text-slate-500">{subtitle}</p>}
      <p>© SIGEP Todos los derechos reservados - Chile 2026</p>
    </footer>
  );
}
