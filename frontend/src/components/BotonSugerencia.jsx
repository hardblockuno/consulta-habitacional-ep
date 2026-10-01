import { CheckCircle2, MessageSquarePlus, Send, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

const RUTAS_MAP = {
  "/demanda": "Organización de la Demanda",
  "/bases-datos": "Bases de Datos y Padrón",
  "/personas": "Padrón Social",
  "/extraer-ahorro": "Ahorro Habitacional",
  "/extraer-rukan": "Ficha RUKAN",
  "/alertas": "Monitoreo y Alertas",
  "/tecnica": "Proyectos y Terrenos",
  "/postventa": "Postventa Habitacional",
  "/coordinacion": "Consola Ejecutiva de Coordinación",
  "/admin-soporte": "Consola de Administración y Soporte",
  "/reportes": "Reportes y Auditoría",
  "/dashboard": "Resumen General",
};

export default function BotonSugerencia() {
  const [abierto, setAbierto] = useState(false);
  const [tipo, setTipo] = useState("mejora"); // "mejora" | "problema" | "idea"
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState("");

  const location = useLocation();
  const { user } = useAuth();

  const moduloActual = useMemo(() => {
    const path = location.pathname;
    if (RUTAS_MAP[path]) return RUTAS_MAP[path];
    if (path.startsWith("/personas/")) return "Ficha Individual de Familia";
    return "Panel SIGEP";
  }, [location.pathname]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!mensaje.trim()) {
      setError("Por favor escribe tu sugerencia.");
      return;
    }

    setEnviando(true);
    setError("");

    try {
      await api.post("/feedback/", {
        modulo: moduloActual,
        ruta: location.pathname,
        tipo,
        mensaje: mensaje.trim(),
      });
      setExito(true);
      setMensaje("");
      setTimeout(() => {
        setExito(false);
        setAbierto(false);
      }, 2000);
    } catch {
      setError("No fue posible enviar la sugerencia. Intenta nuevamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      {/* Botón Flotante Permanente */}
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white/95 px-3.5 py-2 text-xs font-medium text-slate-700 shadow-md backdrop-blur-xs hover:border-slate-300 hover:bg-white hover:text-slate-900 active:scale-95 transition-all group"
        title="Enviar sugerencia de desarrollo para este panel"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-600 group-hover:bg-slate-900 group-hover:text-white transition-colors">
          <MessageSquarePlus size={13} />
        </span>
        <span className="tracking-tight">Escribir sugerencia</span>
      </button>

      {/* Modal / Popover Flotante */}
      {abierto && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 p-3 sm:p-4 backdrop-blur-xs">
          <div
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            {/* Cabecera */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
                    {moduloActual}
                  </span>
                </div>
                <h2 className="mt-1 text-sm font-semibold text-slate-900 tracking-tight">
                  Sugerencia para desarrollo
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition"
              >
                <X size={14} />
              </button>
            </div>

            {/* Contenido / Formulario */}
            {exito ? (
              <div className="py-8 text-center space-y-2">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <CheckCircle2 size={20} />
                </div>
                <p className="text-xs font-semibold text-slate-900">
                  Sugerencia recibida exitosamente
                </p>
                <p className="text-[11px] text-slate-400">
                  El equipo de desarrollo revisará tu aporte para las próximas mejoras de SIGEP.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
                {error && (
                  <div className="rounded-md border border-rose-200 bg-rose-50/80 p-2 text-xs text-rose-700">
                    {error}
                  </div>
                )}

                {/* Selector Segmentado de Tipo (Linear style) */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1.5">
                    Tipo de aporte
                  </label>
                  <div className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1 border border-slate-200/70 text-center">
                    <button
                      type="button"
                      onClick={() => setTipo("mejora")}
                      className={`rounded-md py-1 text-[11px] font-medium transition ${
                        tipo === "mejora"
                          ? "bg-white text-slate-900 shadow-2xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Mejora
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipo("problema")}
                      className={`rounded-md py-1 text-[11px] font-medium transition ${
                        tipo === "problema"
                          ? "bg-white text-slate-900 shadow-2xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Observación
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipo("idea")}
                      className={`rounded-md py-1 text-[11px] font-medium transition ${
                        tipo === "idea"
                          ? "bg-white text-slate-900 shadow-2xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Nueva idea
                    </button>
                  </div>
                </div>

                {/* Campo de Texto */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Comentario o propuesta
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    placeholder={`¿Qué cambio o funcionalidad propones para el módulo de ${moduloActual}?`}
                    className="w-full rounded-md border border-slate-200 bg-white p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none transition resize-none"
                  />
                  <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                    <span>
                      Enviado por: {user?.nombre_completo || user?.username || "Usuario"}
                    </span>
                    <span>{mensaje.length} caracteres</span>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setAbierto(false)}
                    className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={enviando || !mensaje.trim()}
                    className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-white shadow-2xs hover:bg-slate-800 disabled:opacity-50 transition"
                  >
                    <Send size={12} />
                    {enviando ? "Enviando..." : "Enviar sugerencia"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
