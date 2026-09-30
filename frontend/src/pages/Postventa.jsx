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

export default function Postventa({ defaultTab = "bandeja" }) {
  const [tab, setTab] = useState(defaultTab); // "bandeja" | "beneficiario"

  return (
    <div className="space-y-6">
      {/* Encabezado y Navegación de Modo */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-800 border border-cyan-200">
              <Wrench size={13} /> Postventa Habitacional
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 tracking-tight">
            Gestión y Respuesta a Solicitudes
          </h1>
          <p className="text-sm text-slate-500">
            Recepción directa de solicitudes de beneficiarios, gestión del equipo EP y devolución de respuestas resueltas.
          </p>
        </div>

        {/* Selector de Vista: Bandeja EP vs Portal Beneficiario */}
        <div className="flex items-center rounded-lg bg-slate-100 p-1 border border-slate-200">
          <button
            type="button"
            onClick={() => setTab("bandeja")}
            className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-semibold transition ${
              tab === "bandeja"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileText size={15} />
            Bandeja Equipo EP
          </button>
          <button
            type="button"
            onClick={() => setTab("beneficiario")}
            className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-semibold transition ${
              tab === "beneficiario"
                ? "bg-cyan-700 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <User size={15} />
            Portal Beneficiario
          </button>
        </div>
      </div>

      {tab === "bandeja" ? <BandejaEP /> : <PortalBeneficiario />}
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
   3. PORTAL PÚBLICO DEL BENEFICIARIO (Móvil / Consultas e Ingreso)
   ========================================================================= */
function PortalBeneficiario() {
  const [submodo, setSubmodo] = useState("ingresar"); // "ingresar" | "consultar"

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        {/* Toggle interno: Ingresar o Consultar */}
        <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 mb-6">
          <button
            type="button"
            onClick={() => setSubmodo("ingresar")}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition text-center ${
              submodo === "ingresar"
                ? "bg-white text-cyan-800 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Ingresar Solicitud
          </button>
          <button
            type="button"
            onClick={() => setSubmodo("consultar")}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition text-center ${
              submodo === "consultar"
                ? "bg-white text-cyan-800 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Consultar Estado de mi Solicitud
          </button>
        </div>

        {submodo === "ingresar" ? <FormularioIngresoBeneficiario /> : <ConsultaBeneficiario />}
      </div>
    </div>
  );
}

function FormularioIngresoBeneficiario() {
  const [rut, setRut] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [comite, setComite] = useState("");
  const [vivienda, setVivienda] = useState("");
  const [recinto, setRecinto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [esUrgente, setEsUrgente] = useState(false);
  const [foto, setFoto] = useState(null);

  const [enviando, setEnviando] = useState(false);
  const [ticketCreado, setTicketCreado] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rut.trim() || !nombre.trim() || !descripcion.trim()) {
      alert("Por favor completa tu RUT, Nombre y la descripción del problema.");
      return;
    }

    setEnviando(true);
    try {
      const formData = new FormData();
      formData.append("rut", rut.trim());
      formData.append("nombre", nombre.trim());
      formData.append("telefono", telefono.trim());
      formData.append("comite_nombre", comite.trim());
      formData.append("vivienda_direccion", vivienda.trim());
      formData.append("recinto", recinto);
      formData.append("descripcion", descripcion.trim());
      formData.append("urgencia", esUrgente ? "urgente" : "normal");
      if (foto) {
        formData.append("foto", foto);
      }

      const res = await api.post("/postventa/tickets/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setTicketCreado(res.data);
    } catch (err) {
      console.error("Error al ingresar solicitud:", err);
      alert("Ocurrió un error al enviar tu solicitud. Intenta nuevamente.");
    } finally {
      setEnviando(false);
    }
  };

  if (ticketCreado) {
    return (
      <div className="py-6 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 size={32} />
        </div>
        <h3 className="text-xl font-bold text-slate-900">¡Solicitud Ingresada con Éxito!</h3>
        <p className="text-sm text-slate-600">
          Tu reporte ha quedado registrado directamente en el sistema de la Entidad Patrocinante.
        </p>
        <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
          <p className="text-xs uppercase font-bold text-slate-500">Tu Código de Seguimiento</p>
          <p className="mt-1 font-mono text-2xl font-extrabold text-cyan-800">{ticketCreado.codigo}</p>
          <p className="mt-1 text-xs text-slate-500">
            Guarda este código para consultar el avance o respuesta de tu caso.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setTicketCreado(null);
            setDescripcion("");
            setFoto(null);
          }}
          className="mt-4 rounded-lg bg-cyan-700 px-5 py-2 text-xs font-semibold text-white hover:bg-cyan-800"
        >
          Ingresar otra solicitud
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Ingreso de Solicitud de Postventa</h2>
        <p className="text-xs text-slate-500">
          Completa tus datos para que el equipo técnico pueda revisar tu caso y devolverte una solución.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-bold text-slate-700">RUT del Beneficiario *</label>
          <input
            type="text"
            required
            placeholder="Ej: 12.345.678-9"
            value={rut}
            onChange={(e) => setRut(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-cyan-600 focus:bg-white focus:outline-hidden"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700">Nombre Completo *</label>
          <input
            type="text"
            required
            placeholder="Ej: Juan Pérez"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-cyan-600 focus:bg-white focus:outline-hidden"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-bold text-slate-700">Teléfono de Contacto</label>
          <input
            type="tel"
            placeholder="+56 9 1234 5678"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-cyan-600 focus:bg-white focus:outline-hidden"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700">Comité / Proyecto</label>
          <input
            type="text"
            placeholder="Ej: Los Robles"
            value={comite}
            onChange={(e) => setComite(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-cyan-600 focus:bg-white focus:outline-hidden"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700">Dirección / N° de Casa o Depto</label>
        <input
          type="text"
          placeholder="Ej: Pasaje Las Flores 123 o Casa 4 Mz B"
          value={vivienda}
          onChange={(e) => setVivienda(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-cyan-600 focus:bg-white focus:outline-hidden"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700">Recinto Afectado</label>
        <select
          value={recinto}
          onChange={(e) => setRecinto(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-cyan-600 focus:bg-white focus:outline-hidden"
        >
          <option value="">Selecciona el recinto...</option>
          {RECINTOS_PREDEFINIDOS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700">Descripción del Problema *</label>
        <textarea
          rows={3}
          required
          placeholder="Explica qué está sucediendo (ej: filtración en lavamanos, ventana descuadrada, humedad en cielo raso)..."
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 focus:border-cyan-600 focus:bg-white focus:outline-hidden placeholder-slate-400"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700">Foto del Problema (Opcional)</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFoto(e.target.files[0] || null)}
          className="mt-1 block w-full text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-cyan-800 hover:file:bg-cyan-100"
        />
        <p className="mt-1 text-[11px] text-slate-400">Puedes tomar la foto directamente con la cámara del celular.</p>
      </div>

      <div className="rounded-lg bg-red-50 p-3 border border-red-200">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={esUrgente}
            onChange={(e) => setEsUrgente(e.target.checked)}
            className="rounded text-red-600 focus:ring-red-500"
          />
          <span className="text-xs font-bold text-red-900">
            ⚠️ ¿Es una urgencia crítica? (Ej: fuga activa de agua o gas)
          </span>
        </label>
      </div>

      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded-xl bg-cyan-700 py-3 text-sm font-bold text-white shadow-sm hover:bg-cyan-800 disabled:opacity-50"
      >
        {enviando ? "Enviando Solicitud..." : "Enviar Solicitud a la EP"}
      </button>
    </form>
  );
}

function ConsultaBeneficiario() {
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState(null);
  const [cargando, setCargando] = useState(false);

  const handleConsultar = async (e) => {
    e.preventDefault();
    if (!busqueda.trim()) return;

    setCargando(true);
    try {
      const isCodigo = busqueda.toUpperCase().startsWith("PV-");
      const params = isCodigo ? { codigo: busqueda.trim() } : { rut: busqueda.trim() };
      const res = await api.get("/postventa/tickets/consultar/", { params });
      setResultados(res.data || []);
    } catch (err) {
      console.error("Error al consultar:", err);
      alert("No fue posible consultar la solicitud. Verifica el dato ingresado.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Consulta de Estado de Solicitud</h2>
        <p className="text-xs text-slate-500">
          Ingresa tu RUT o tu Código de Solicitud para revisar el avance y la solución de la EP.
        </p>
      </div>

      <form onSubmit={handleConsultar} className="flex gap-2">
        <input
          type="text"
          placeholder="Ingresa tu RUT o Código (ej: PV-2026-0001)"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-cyan-600 focus:bg-white focus:outline-hidden"
        />
        <button
          type="submit"
          disabled={cargando}
          className="rounded-lg bg-cyan-700 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-800 disabled:opacity-50"
        >
          {cargando ? "Buscando..." : "Consultar"}
        </button>
      </form>

      {/* Resultados */}
      {resultados !== null && (
        <div className="mt-6 space-y-3">
          {resultados.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">
              No se encontraron solicitudes registradas con ese RUT o código.
            </div>
          ) : (
            resultados.map((t) => (
              <div key={t.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <span className="font-mono text-xs font-bold text-cyan-800">{t.codigo}</span>
                  <EstadoBadge estado={t.estado} />
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Problema reportado:</p>
                  <p className="text-sm text-slate-800 mt-0.5">"{t.descripcion}"</p>
                  <p className="text-[11px] text-slate-400 mt-1">Ingresado el {formatearFecha(t.creado_en)}</p>
                </div>

                {/* Explicación del estado */}
                {t.estado === "recibida" && (
                  <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900 border border-amber-200 flex items-start gap-2">
                    <Clock size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Tu solicitud fue recibida</p>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        Está en espera de revisión por el equipo técnico de la EP. Te contactaremos si se requiere inspección.
                      </p>
                    </div>
                  </div>
                )}

                {t.estado === "en_gestion" && (
                  <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-900 border border-blue-200 flex items-start gap-2">
                    <Wrench size={16} className="text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Solicitud en gestión</p>
                      <p className="text-[11px] text-blue-800 mt-0.5">
                        El equipo técnico está coordinando la revisión en terreno o los trabajos correspondientes.
                      </p>
                    </div>
                  </div>
                )}

                {t.estado === "resuelta" && (
                  <div className="rounded-xl bg-emerald-50 p-4 text-xs text-emerald-950 border border-emerald-200 space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-800 text-sm">
                      <CheckCircle2 size={18} className="text-emerald-600" />
                      Solicitud Resuelta por la EP
                    </div>
                    <div className="bg-white/80 rounded-lg p-3 border border-emerald-100 text-sm">
                      <p className="font-bold text-xs uppercase text-emerald-700">Respuesta Oficial:</p>
                      <p className="mt-1 text-slate-800 font-medium">
                        {t.respuesta_tecnica || "Trabajos ejecutados y conformes."}
                      </p>
                    </div>
                    {t.tecnico_responsable && (
                      <p className="text-[11px] text-emerald-800">
                        <span className="font-semibold">Responsable técnico:</span> {t.tecnico_responsable}
                      </p>
                    )}
                    {t.fecha_resolucion && (
                      <p className="text-[10px] text-emerald-700">
                        Fecha de resolución: {formatearFecha(t.fecha_resolucion)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
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
