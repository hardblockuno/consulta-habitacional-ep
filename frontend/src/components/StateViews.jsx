import { AlertCircle, Loader2 } from "lucide-react";

export function LoadingState({ label = "Cargando" }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
      <Loader2 className="animate-spin" size={18} />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({ message }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
      <AlertCircle size={18} />
      <span>{message || "No se pudo cargar la informacion."}</span>
    </div>
  );
}

export function EmptyState({ label = "Sin resultados" }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
      {label}
    </div>
  );
}
