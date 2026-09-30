import { useEffect, useState } from "react";
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Filter,
  Home,
  MessageCircle,
  Phone,
  RefreshCw,
  Search,
  Wrench,
  X,
} from "lucide-react";
import { api, listFromResponse } from "../api/client.js";

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
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Área Técnica
          </span>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 tracking-tight">
            Bandeja de Postventa Habitacional
          </h1>
          <p className="text-xs text-slate-500 sm:text-sm">
            Control de requerimientos de beneficiarios, gestión técnica y visación de soluciones.
          </p>
        </div>

        {/* Acceso y copiado de enlace para vecinos */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copiarEnlacePublico}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            {copiado ? "Enlace copiado al portapapeles" : "Copiar enlace del portal"}
          </button>
          <a
            href="/postventa/solicitud"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition"
          >
            <ExternalLink size={13} /> Ver portal de vecinos
          </a>
        </div>
      </div>

      <BandejaEP />
    </div>
  );
}

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
      {/* Tarjetas de Métricas Sobrias */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Solicitudes</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{metricas.total || 0}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Pendientes</p>
            {metricas.urgentes > 0 && (
              <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">
                {metricas.urgentes} urgentes
              </span>
            )}
          </div>
          <p className="mt-1 text-2xl font-bold text-slate-900">{metricas.recibidas || 0}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">En Atención</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{metricas.en_gestion || 0}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Finalizadas</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{metricas.resueltas || 0}</p>
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3.5 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleBuscar} className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Buscar por RUT, nombre, código, casa o problema..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full rounded-md border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-slate-700 focus:bg-white focus:outline-hidden"
          />
        </form>

        <div className="flex items-center gap-2">
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-slate-700 focus:outline-hidden"
          >
            <option value="">Todos los Estados</option>
            <option value="recibida">Pendiente</option>
            <option value="en_gestion">En atención</option>
            <option value="resuelta">Finalizada</option>
          </select>

          <select
            value={filtroUrgencia}
            onChange={(e) => setFiltroUrgencia(e.target.value)}
            className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-slate-700 focus:outline-hidden"
          >
            <option value="">Todas las prioridades</option>
            <option value="urgente">Solo urgentes</option>
            <option value="normal">Normal</option>
          </select>

          <button
            type="button"
            onClick={cargarDatos}
            title="Recargar listado"
            className="rounded-md border border-slate-200 bg-slate-50 p-1.5 text-slate-600 hover:bg-slate-100"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Listado */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-800 border-t-transparent"></div>
        </div>
      ) : tickets.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white py-12 text-center">
          <FileText size={32} className="mx-auto text-slate-300" />
          <p className="mt-2 text-sm font-semibold text-slate-700">Sin registros</p>
          <p className="text-xs text-slate-500">No existen solicitudes bajo los filtros seleccionados.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tickets.map((t) => (
            <div
              key={t.id}
              onClick={() => setTicketSeleccionado(t)}
              className="cursor-pointer rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-400 hover:shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <span className="font-mono text-xs font-bold text-slate-900">
                    {t.codigo}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {t.urgencia === "urgente" && (
                      <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">
                        Urgente
                      </span>
                    )}
                    <EstadoBadge estado={t.estado} />
                  </div>
                </div>

                <div className="mt-3">
                  <p className="text-sm font-bold text-slate-900 line-clamp-1">{t.nombre}</p>
                  <p className="text-xs text-slate-500">RUT: {t.rut}</p>
                  {(t.comite_nombre || t.vivienda_direccion) && (
                    <p className="mt-0.5 text-xs text-slate-600 line-clamp-1">
                      {t.comite_nombre ? `${t.comite_nombre} · ` : ""}
                      {t.vivienda_direccion || "Sin dirección"}
                    </p>
                  )}
                </div>

                <div className="mt-3 rounded border border-slate-100 bg-slate-50 p-2.5">
                  {t.recinto && (
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                      Recinto: {t.recinto}
                    </span>
                  )}
                  <p className="text-xs text-slate-700 line-clamp-2">{t.descripcion}</p>
                </div>

                {t.respuesta_tecnica && (
                  <div className="mt-2.5 rounded border border-emerald-200 bg-emerald-50/50 p-2 text-xs">
                    <p className="text-[10px] font-bold uppercase text-emerald-800">
                      Resolución Registrada:
                    </p>
                    <p className="text-slate-800 line-clamp-2 mt-0.5">{t.respuesta_tecnica}</p>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>{formatearFecha(t.creado_en)}</span>
                <span className="text-slate-800 font-semibold hover:underline">
                  Abrir ficha →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Detalle */}
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

      setMensajeExito("Registro actualizado correctamente.");
      if (onGuardado) onGuardado(res.data);
      setTimeout(() => {
        setMensajeExito("");
      }, 3000);
    } catch (err) {
      console.error("Error guardando ticket:", err);
      alert("No fue posible guardar la solicitud.");
    } finally {
      setGuardando(false);
    }
  };

  const numeroLimpio = ticket.telefono ? ticket.telefono.replace(/[^0-9]/g, "") : "";
  const whatsappUrl = numeroLimpio
    ? `https://wa.me/${numeroLimpio.startsWith("56") ? numeroLimpio : "56" + numeroLimpio}?text=Estimado(a)%20${encodeURIComponent(
        ticket.nombre
      )},%20le%20escribimos%20desde%20la%20Entidad%20Patrocinante%20respecto%20a%20su%20solicitud%20de%20postventa%20${ticket.codigo}.`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl my-6 max-h-[90vh] overflow-y-auto border border-slate-200">
        <div className="flex items-start justify-between border-b border-slate-200 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-800">
                {ticket.codigo}
              </span>
              <EstadoBadge estado={estado} />
              {urgencia === "urgente" && (
                <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">
                  Urgente
                </span>
              )}
            </div>
            <h2 className="mt-1 text-lg font-bold text-slate-900">{ticket.nombre}</h2>
            <p className="text-xs text-slate-500">RUT: {ticket.rut} · Ingreso: {formatearFecha(ticket.creado_en)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 rounded border border-slate-200 bg-slate-50 p-3 text-xs">
          <div>
            <p className="font-semibold text-slate-600 uppercase">Ubicación</p>
            <p className="text-slate-900 mt-0.5">
              {ticket.comite_nombre ? `${ticket.comite_nombre} · ` : ""}
              {ticket.vivienda_direccion || "Sin dirección"}
            </p>
            {ticket.recinto && (
              <p className="text-slate-600 mt-1">
                Recinto: <span className="font-medium text-slate-800">{ticket.recinto}</span>
              </p>
            )}
          </div>
          <div>
            <p className="font-semibold text-slate-600 uppercase">Contacto</p>
            <p className="text-slate-900 mt-0.5">{ticket.telefono || "Sin teléfono"}</p>
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:underline"
              >
                Abrir conversación WhatsApp
              </a>
            )}
          </div>
        </div>

        <div className="mt-4">
          <label className="text-xs font-semibold text-slate-600 uppercase">Descripción Informada</label>
          <div className="mt-1 rounded border border-slate-200 bg-white p-3 text-xs text-slate-900">
            {ticket.descripcion}
          </div>
        </div>

        {ticket.foto && (
          <div className="mt-4">
            <label className="text-xs font-semibold text-slate-600 uppercase">Fotografía Adjunta</label>
            <div className="mt-1 overflow-hidden rounded border border-slate-200 bg-slate-50 max-h-64 flex items-center justify-center">
              <img
                src={ticket.foto}
                alt="Foto de la falla"
                className="max-h-64 object-contain w-full cursor-pointer"
                onClick={() => window.open(ticket.foto, "_blank")}
              />
            </div>
          </div>
        )}

        <form onSubmit={handleGuardar} className="mt-5 border-t border-slate-200 pt-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Registro y Resolución Técnica
          </h3>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Estado</label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="mt-1 w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-slate-800 focus:outline-hidden"
              >
                <option value="recibida">Pendiente</option>
                <option value="en_gestion">En atención</option>
                <option value="resuelta">Finalizada</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Prioridad</label>
              <select
                value={urgencia}
                onChange={(e) => setUrgencia(e.target.value)}
                className="mt-1 w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-slate-800 focus:outline-hidden"
              >
                <option value="normal">Normal</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Profesional o Cuadrilla a Cargo
            </label>
            <input
              type="text"
              placeholder="Ej: Cuadrilla Constructora / Técnico Inspector EP"
              value={tecnico}
              onChange={(e) => setTecnico(e.target.value)}
              className="mt-1 w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-slate-800 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Resolución Técnica Formal (Visible para el Beneficiario)
            </label>
            <textarea
              rows={3}
              placeholder="Indique los antecedentes de la inspección o trabajo ejecutado en la vivienda..."
              value={respuesta}
              onChange={(e) => setRespuesta(e.target.value)}
              className="mt-1 w-full rounded border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:border-slate-800 focus:outline-hidden placeholder-slate-400"
            />
          </div>

          {mensajeExito && (
            <div className="rounded border border-emerald-200 bg-emerald-50 p-2 text-xs font-medium text-emerald-800">
              {mensajeExito}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Cerrar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="rounded bg-slate-900 px-4 py-1.5 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {guardando ? "Guardando..." : "Guardar y Visar Resolución"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EstadoBadge({ estado }) {
  if (estado === "resuelta") {
    return (
      <span className="rounded border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
        Finalizada
      </span>
    );
  }
  if (estado === "en_gestion") {
    return (
      <span className="rounded border border-blue-300 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-800">
        En atención
      </span>
    );
  }
  return (
    <span className="rounded border border-slate-300 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
      Pendiente
    </span>
  );
}

function formatearFecha(isoString) {
  if (!isoString) return "-";
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}
