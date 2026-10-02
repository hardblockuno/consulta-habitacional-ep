import { AlertTriangle, Building2, CheckCircle2, Search, Trash2, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../api/client.js";
import { EmptyState, ErrorState, LoadingState } from "./StateViews.jsx";

const DECRETO_COLORS = {
  DS49: "bg-indigo-50 text-indigo-700 border-indigo-200",
  DS01: "bg-blue-50 text-blue-700 border-blue-200",
  DS19: "bg-emerald-50 text-emerald-700 border-emerald-200",
  DS27: "bg-amber-50 text-amber-700 border-amber-200",
  DS10: "bg-teal-50 text-teal-700 border-teal-200",
};

export default function GestionComites({ onSelectComite }) {
  const [comites, setComites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [filtroDecreto, setFiltroDecreto] = useState("todos");

  // Estado para el modal de eliminación
  const [comiteAEliminar, setComiteAEliminar] = useState(null);
  const [confirmacionTexto, setConfirmacionTexto] = useState("");
  const [eliminando, setEliminando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState("");

  async function cargarComites() {
    setLoading(true);
    setError("");
    try {
      const resp = await api.get("/comites/");
      const data = Array.isArray(resp.data) ? resp.data : resp.data?.results || [];
      setComites(data);
    } catch (err) {
      setError("No se pudieron cargar los comités.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarComites();
  }, []);

  async function handleEliminarComite() {
    if (!comiteAEliminar) return;
    setEliminando(true);
    try {
      const resp = await api.delete(`/comites/${comiteAEliminar.id}/`);
      const detalle = resp.data?.detail || `Comité "${comiteAEliminar.nombre}" eliminado exitosamente.`;
      setMensajeExito(detalle);
      setComiteAEliminar(null);
      setConfirmacionTexto("");
      await cargarComites();
      setTimeout(() => setMensajeExito(""), 6000);
    } catch (err) {
      alert(err.response?.data?.detail || "No se pudo eliminar el comité.");
    } finally {
      setEliminando(false);
    }
  }

  const comitesFiltrados = comites.filter((c) => {
    const matchDecreto = filtroDecreto === "todos" || (c.decreto || "DS49") === filtroDecreto;
    if (!matchDecreto) return false;
    const q = busqueda.toLowerCase().trim();
    if (!q) return true;
    return (
      c.nombre?.toLowerCase().includes(q) ||
      c.comuna?.toLowerCase().includes(q) ||
      c.region?.toLowerCase().includes(q)
    );
  });

  const totalFamilias = comites.reduce((acc, c) => acc + (c.total_personas || 0), 0);

  return (
    <div className="space-y-5">
      {/* Resumen y buscador */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-slate-900">
            Comités ({comitesFiltrados.length})
          </h2>
          <p className="text-xs text-slate-500">
            {totalFamilias.toLocaleString("es-CL")} socios registrados
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Selector de filtro por Decreto */}
          <select
            value={filtroDecreto}
            onChange={(e) => setFiltroDecreto(e.target.value)}
            className="h-9 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 shadow-2xs focus:border-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="todos">Todos los decretos</option>
            <option value="DS49">DS49 · Fondo Solidario</option>
            <option value="DS01">DS01 · Sectores Medios</option>
            <option value="DS19">DS19 · Integración Social</option>
            <option value="DS27">DS27 · Mejoramiento</option>
            <option value="DS10">DS10 · Habitabilidad Rural</option>
          </select>

          <div className="relative w-full sm:w-60">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar comité o comuna..."
              className="h-9 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {mensajeExito && (
        <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-900 animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{mensajeExito}</span>
        </div>
      )}

      {loading && <LoadingState label="Cargando comités..." />}
      {error && <ErrorState message={error} />}

      {!loading && !error && comitesFiltrados.length === 0 && (
        <EmptyState label={busqueda ? "No se encontraron comités que coincidan con la búsqueda." : "No hay comités registrados aún. Carga una planilla Excel para iniciar."} />
      )}

      {!loading && !error && comitesFiltrados.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {comitesFiltrados.map((c) => (
            <div
              key={c.id}
              className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-2xs hover:border-slate-300 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                      <Building2 size={16} />
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 line-clamp-1">
                        {c.nombre}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        {c.comuna || "Comuna no especificada"} {c.region ? `· ${c.region}` : ""}
                      </p>
                    </div>
                  </div>
                  <span className={`shrink-0 inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold border ${DECRETO_COLORS[c.decreto] || "bg-slate-100 text-slate-700 border-slate-200"}`}>
                    {c.decreto || "DS49"}
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-4 rounded-md bg-slate-50 p-2.5">
                  <div className="flex items-center gap-1.5 text-xs text-slate-700">
                    <Users size={14} className="text-slate-500" />
                    <span className="font-semibold text-slate-900">{c.total_personas ?? 0}</span>
                    <span className="text-slate-500">socios</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {c.creado_en ? new Date(c.creado_en).toLocaleDateString("es-CL") : "Registro inicial"}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => onSelectComite ? onSelectComite(c.nombre) : null}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-800 hover:text-slate-950 hover:underline"
                >
                  Ver nómina &rarr;
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setComiteAEliminar(c);
                    setConfirmacionTexto("");
                  }}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Eliminar comité y sus registros"
                >
                  <Trash2 size={13} />
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de confirmación para eliminar */}
      {comiteAEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100">
                <AlertTriangle size={20} />
              </span>
              <div>
                <h3 className="text-base font-semibold text-slate-900">¿Eliminar comité?</h3>
                <p className="text-xs text-rose-600 font-medium">Esta acción es irreversible</p>
              </div>
            </div>

            <div className="mt-4 space-y-2 rounded-lg border border-rose-100 bg-rose-50/60 p-3.5 text-xs text-rose-900 leading-relaxed">
              <p>
                Estás a punto de eliminar el comité <strong>"{comiteAEliminar.nombre}"</strong>.
              </p>
              <p>
                Se borrarán de forma permanente sus <strong>{comiteAEliminar.total_personas || 0} personas asociadas</strong>, incluyendo sus fichas sociales, ahorros, observaciones y alertas vinculadas.
              </p>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-medium text-slate-700">
                Para confirmar, escribe <strong>ELIMINAR</strong> a continuación:
              </label>
              <input
                value={confirmacionTexto}
                onChange={(e) => setConfirmacionTexto(e.target.value)}
                placeholder="ELIMINAR"
                className="mt-1.5 h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-rose-600 focus:ring-1 focus:ring-rose-600 focus:outline-none"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={eliminando}
                onClick={() => setComiteAEliminar(null)}
                className="rounded-md border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={confirmacionTexto.trim() !== "ELIMINAR" || eliminando}
                onClick={handleEliminarComite}
                className="inline-flex items-center gap-1.5 rounded-md bg-rose-600 px-3.5 py-1.5 text-xs font-medium text-white shadow-2xs hover:bg-rose-700 transition-colors disabled:opacity-40"
              >
                <Trash2 size={13} />
                {eliminando ? "Eliminando..." : "Eliminar comité"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
