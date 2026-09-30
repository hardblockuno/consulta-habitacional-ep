import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Filter,
  Home,
  Image as ImageIcon,
  MessageCircle,
  Phone,
  PlusCircle,
  RefreshCw,
  Search,
  User,
  Wrench,
  X,
} from "lucide-react";
import { api, listFromResponse } from "../api/client.js";

const RECINTOS_PREDEFINIDOS = [
  "Baño",
  "Cocina",
  "Dormitorio Principal",
  "Dormitorio Secundario",
  "Living - Comedor",
  "Techumbre / Cubierta",
  "Fachada / Muros Exteriores",
  "Instalación Eléctrica",
  "Instalación Sanitaria / Gas",
  "Patio / Acceso",
  "Otro",
];

export default function Postventa() {
  const [copiado, setCopiado] = useState(false);

  const copiarEnlacePublico = () => {
    const url = `${window.location.origin}/postventa/solicitud`;
    navigator.clipboard.writeText(url);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado Interno para el Equipo EP */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-800 border border-cyan-200">
              <Wrench size={13} /> Área Técnica · Postventa
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 tracking-tight">
            Bandeja de Gestión de Postventa
          </h1>
          <p className="text-sm text-slate-500">
            Recepción centralizada de solicitudes de beneficiarios, gestión técnica y devolución de soluciones visadas.
          </p>
        </div>

        {/* Acceso y copiado de enlace para vecinos */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copiarEnlacePublico}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
          >
            {copiado ? "✓ Enlace Copiado" : "📋 Copiar Enlace Vecinos"}
          </button>
          <a
            href="/postventa/solicitud"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-700 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-cyan-800 transition"
          >
            <ExternalLink size={14} /> Abrir Portal Vecino
          </a>
        </div>
      </div>

      <BandejaEP />
    </div>
  );
}

/* =========================================================================
   1. BANDEJA DEL EQUIPO EP (Gestión, Revisión y Devolución Resuelta)
   ========================================================================= */
function BandejaEP() {
  const [tickets, setTickets] = useState([]);
  const [metricas, setMetricas] = useState({ total: 0, recibidas: 0, en_gestion: 0, resueltas: 0, urgentes: 0 });
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroUrgencia, setFiltroUrgencia] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [ticketSeleccionado, setTicketSeleccionado] = useState(null);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filtroEstado) params.estado = filtroEstado;
      if (filtroUrgencia) params.urgencia = filtroUrgencia;
      if (busqueda.trim()) params.q = busqueda.trim();

      const [resTickets, resMetricas] = await Promise.all([
        api.get("/postventa/tickets/", { params }),
        api.get("/postventa/tickets/resumen/"),
      ]);

      setTickets(listFromResponse(resTickets.data));
      setMetricas(resMetricas.data || {});
    } catch (err) {
      console.error("Error cargando tickets de postventa:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [filtroEstado, filtroUrgencia]);

  const handleBuscar = (e) => {
    e.preventDefault();
    cargarDatos();
  };

  return (
    <div className="space-y-6">
      {/* Tarjetas de Métricas */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Solicitudes</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{metricas.total || 0}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">🟡 Recibidas (Nuevas)</p>
            {metricas.urgentes > 0 && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                {metricas.urgentes} urgentes
              </span>
            )}
          </div>
          <p className="mt-1 text-2xl font-bold text-amber-900">{metricas.recibidas || 0}</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 shadow-2xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">🔵 En Gestión</p>
          <p className="mt-1 text-2xl font-bold text-blue-900">{metricas.en_gestion || 0}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-2xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">🟢 Resueltas</p>
          <p className="mt-1 text-2xl font-bold text-emerald-900">{metricas.resueltas || 0}</p>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleBuscar} className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={17} />
          <input
            type="text"
            placeholder="Buscar por RUT, nombre, código, casa o problema..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-800 placeholder-slate-400 focus:border-cyan-600 focus:bg-white focus:outline-hidden"
          />
        </form>

        <div className="flex items-center gap-2">
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 focus:border-cyan-600 focus:outline-hidden"
          >
            <option value="">Todos los Estados</option>
            <option value="recibida">🟡 Recibida (Pendiente)</option>
            <option value="en_gestion">🔵 En gestión</option>
            <option value="resuelta">🟢 Resuelta</option>
          </select>

          <select
            value={filtroUrgencia}
            onChange={(e) => setFiltroUrgencia(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 focus:border-cyan-600 focus:outline-hidden"
          >
            <option value="">Todas las Urgencias</option>
            <option value="urgente">⚠️ Solo Urgentes</option>
            <option value="normal">Normal</option>
          </select>

          <button
            type="button"
            onClick={cargarDatos}
            title="Recargar listado"
            className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Lista de Solicitudes */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-700 border-t-transparent"></div>
        </div>
      ) : tickets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white py-12 text-center">
          <Wrench size={36} className="mx-auto text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-700">No hay solicitudes que coincidan</p>
          <p className="text-xs text-slate-500">Prueba ajustando los filtros o espera nuevas solicitudes de socios.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tickets.map((t) => (
            <div
              key={t.id}
              onClick={() => setTicketSeleccionado(t)}
              className="cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-2xs transition hover:border-cyan-400 hover:shadow-md flex flex-col justify-between"
            >
              <div>
                {/* Cabecera de la tarjeta */}
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-100">
                    {t.codigo}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {t.urgencia === "urgente" && (
                      <span className="inline-flex items-center gap-1 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">
                        <AlertTriangle size={11} /> Urgente
                      </span>
                    )}
                    <EstadoBadge estado={t.estado} />
                  </div>
                </div>

                {/* Datos del Beneficiario */}
                <div className="mt-3">
                  <p className="text-sm font-bold text-slate-900 line-clamp-1">{t.nombre}</p>
                  <p className="text-xs text-slate-500">RUT: {t.rut}</p>
                  {(t.comite_nombre || t.vivienda_direccion) && (
                    <p className="mt-0.5 text-xs text-slate-600 line-clamp-1 flex items-center gap-1">
                      <Home size={12} className="text-slate-400 shrink-0" />
                      {t.comite_nombre ? `${t.comite_nombre} · ` : ""}
                      {t.vivienda_direccion || "Sin dirección"}
                    </p>
                  )}
                </div>

                {/* Recinto y Descripción */}
                <div className="mt-3 rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                  {t.recinto && (
                    <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block mb-1">
                      📍 {t.recinto}
                    </span>
                  )}
                  <p className="text-xs text-slate-700 line-clamp-3 italic">"{t.descripcion}"</p>
                </div>

                {/* Si ya tiene respuesta técnica */}
                {t.respuesta_tecnica && (
                  <div className="mt-2.5 rounded-lg bg-emerald-50/70 p-2 border border-emerald-200">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                      ✓ Solución Devuelta:
                    </p>
                    <p className="text-xs text-emerald-950 line-clamp-2 mt-0.5">{t.respuesta_tecnica}</p>
                  </div>
                )}
              </div>

              {/* Pie de tarjeta */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock size={12} /> {formatearFecha(t.creado_en)}
                </span>
                <span className="text-cyan-700 font-semibold text-xs hover:underline">
                  Ver y Gestionar →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Detalle y Resolución */}
      {ticketSeleccionado && (
        <ModalGestionTicket
          ticket={ticketSeleccionado}
          onClose={() => setTicketSeleccionado(null)}
          onGuardado={(ticketActualizado) => {
            setTickets((prev) =>
              prev.map((t) => (t.id === ticketActualizado.id ? ticketActualizado : t))
            );
            setTicketSeleccionado(ticketActualizado);
            cargarDatos();
          }}
        />
      )}
    </div>
  );
}

/* =========================================================================
   2. MODAL DE RESOLUCIÓN TÉCNICA (HUMANA Y DIRECTA)
   ========================================================================= */
function ModalGestionTicket({ ticket, onClose, onGuardado }) {
  const [estado, setEstado] = useState(ticket.estado || "recibida");
  const [urgencia, setUrgencia] = useState(ticket.urgencia || "normal");
  const [respuesta, setRespuesta] = useState(ticket.respuesta_tecnica || "");
  const [tecnico, setTecnico] = useState(ticket.tecnico_responsable || "");
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState("");

  const handleGuardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setMensajeExito("");
    try {
      const res = await api.patch(`/postventa/tickets/${ticket.id}/`, {
        estado,
        urgencia,
        respuesta_tecnica: respuesta,
        tecnico_responsable: tecnico,
      });

      setMensajeExito("¡Solicitud actualizada con éxito!");
      if (onGuardado) onGuardado(res.data);
      setTimeout(() => {
        setMensajeExito("");
      }, 3000);
    } catch (err) {
      console.error("Error guardando ticket:", err);
      alert("No fue posible guardar la solicitud. Intenta nuevamente.");
    } finally {
      setGuardando(false);
    }
  };

  const numeroLimpio = ticket.telefono ? ticket.telefono.replace(/[^0-9]/g, "") : "";
  const whatsappUrl = numeroLimpio
    ? `https://wa.me/${numeroLimpio.startsWith("56") ? numeroLimpio : "56" + numeroLimpio}?text=Hola%20${encodeURIComponent(
        ticket.nombre
      )},%20te%20escribimos%20desde%20la%20Entidad%20Patrocinante%20por%20tu%20solicitud%20de%20postventa%20${ticket.codigo}.`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
        {/* Cabecera */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                {ticket.codigo}
              </span>
              <EstadoBadge estado={estado} />
              {urgencia === "urgente" && (
                <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                  ⚠️ Urgente
                </span>
              )}
            </div>
            <h2 className="mt-2 text-xl font-bold text-slate-900">{ticket.nombre}</h2>
            <p className="text-xs text-slate-500">RUT: {ticket.rut} · Ingresado el {formatearFecha(ticket.creado_en)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Datos de Contacto y Vivienda */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 rounded-xl bg-slate-50 p-3.5 border border-slate-200">
          <div>
            <p className="text-xs font-bold uppercase text-slate-500">Ubicación / Vivienda</p>
            <p className="text-sm font-medium text-slate-800 mt-0.5">
              {ticket.comite_nombre ? `${ticket.comite_nombre} · ` : ""}
              {ticket.vivienda_direccion || "Sin dirección registrada"}
            </p>
            {ticket.recinto && (
              <p className="text-xs text-slate-600 mt-1">
                <span className="font-semibold">Recinto:</span> {ticket.recinto}
              </p>
            )}
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-slate-500">Contacto Directo</p>
            <p className="text-sm font-medium text-slate-800 mt-0.5 flex items-center gap-1.5">
              <Phone size={14} className="text-slate-400" />
              {ticket.telefono || "Sin teléfono"}
            </p>
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:underline"
              >
                <MessageCircle size={14} /> Abrir WhatsApp con el vecino
              </a>
            )}
          </div>
        </div>

        {/* Descripción de la solicitud */}
        <div className="mt-4">
          <label className="text-xs font-bold uppercase text-slate-500">Problema Reportado por el Beneficiario</label>
          <div className="mt-1 rounded-xl border border-slate-200 bg-white p-3.5 text-sm text-slate-800">
            {ticket.descripcion}
          </div>
        </div>

        {/* Foto adjunta */}
        {ticket.foto && (
          <div className="mt-4">
            <label className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1.5">
              <ImageIcon size={14} /> Fotografía Adjunta de Respaldo
            </label>
            <div className="mt-1.5 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 max-h-64 flex items-center justify-center">
              <img
                src={ticket.foto}
                alt="Foto del problema"
                className="max-h-64 object-contain w-full cursor-pointer hover:opacity-95"
                onClick={() => window.open(ticket.foto, "_blank")}
                title="Haz clic para ver en tamaño completo"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">Haz clic en la foto para abrirla en alta resolución.</p>
          </div>
        )}

        {/* FORMULARIO DE RESOLUCIÓN TÉCNICA */}
        <form onSubmit={handleGuardar} className="mt-6 border-t border-slate-200 pt-5 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-800 flex items-center gap-2">
            <Wrench size={16} /> Gestión y Resolución Técnica del Equipo
          </h3>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700">Estado de la Solicitud</label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 font-medium focus:border-cyan-600 focus:outline-hidden"
              >
                <option value="recibida">🟡 Recibida (Pendiente)</option>
                <option value="en_gestion">🔵 En gestión (Cuadrilla / Visita)</option>
                <option value="resuelta">🟢 Resuelta (Devuelta al socio)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">Nivel de Prioridad</label>
              <select
                value={urgencia}
                onChange={(e) => setUrgencia(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 font-medium focus:border-cyan-600 focus:outline-hidden"
              >
                <option value="normal">Normal</option>
                <option value="urgente">⚠️ Urgente</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700">
              Técnico o Responsable a Cargo (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ej: Cuadrilla Constructora / Juan Técnico EP"
              value={tecnico}
              onChange={(e) => setTecnico(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-cyan-600 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700">
              Respuesta o Solución Oficial de la EP{" "}
              <span className="text-slate-400 font-normal">(Esta respuesta la verá el beneficiario)</span>
            </label>
            <textarea
              rows={4}
              placeholder="Escribe aquí la solución o estado formal. Ej: Se coordinó visita con el técnico para el jueves 15. Se cambió empaquetadura de lavamanos y se verificó que no existen fugas."
              value={respuesta}
              onChange={(e) => setRespuesta(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-800 focus:border-cyan-600 focus:outline-hidden placeholder-slate-400"
            />
          </div>

          {mensajeExito && (
            <div className="rounded-lg bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600" />
              {mensajeExito}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cerrar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-cyan-800 disabled:opacity-50"
            >
              {guardando ? (
                <>
                  <RefreshCw size={15} className="animate-spin" /> Guardando...
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} /> Guardar y Visar Solución
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* =========================================================================
   COMPONENTES AUXILIARES
   ========================================================================= */
function EstadoBadge({ estado }) {
  if (estado === "resuelta") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
        <CheckCircle2 size={11} /> Resuelta
      </span>
    );
  }
  if (estado === "en_gestion") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-800">
        <Clock size={11} /> En gestión
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
      <Clock size={11} /> Recibida
    </span>
  );
}

function formatearFecha(isoString) {
  if (!isoString) return "-";
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}
