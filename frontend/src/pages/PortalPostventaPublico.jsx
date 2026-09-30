import { useState } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  HardHat,
  Home,
  Image as ImageIcon,
  Phone,
  Search,
  Send,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { api } from "../api/client.js";

const RECINTOS = [
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

export default function PortalPostventaPublico() {
  const [tab, setTab] = useState("ingresar"); // "ingresar" | "consultar"

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800">
      {/* Encabezado Público Oficial */}
      <header className="border-b border-slate-200 bg-white shadow-2xs">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-700 text-white shadow-xs">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-700">
                Entidad Patrocinante
              </p>
              <h1 className="text-base font-bold text-slate-900 leading-tight sm:text-lg">
                Atención de Postventa Habitacional
              </h1>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 border border-slate-200">
            <ShieldCheck size={14} className="text-cyan-700" /> Canal Oficial
          </span>
        </div>
      </header>

      {/* Contenedor Principal */}
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        {/* Banner Explicativo */}
        <div className="mb-6 rounded-2xl bg-gradient-to-br from-cyan-800 to-slate-900 p-6 text-white shadow-md">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-white/15 px-2.5 py-1 text-xs font-semibold text-cyan-100 backdrop-blur-xs">
            <Wrench size={13} /> Portal para Socios y Familias
          </span>
          <h2 className="mt-3 text-xl font-extrabold sm:text-2xl">
            Ingreso y Seguimiento de Solicitudes
          </h2>
          <p className="mt-1.5 text-xs text-cyan-100 sm:text-sm leading-relaxed">
            Reporta cualquier inconveniente o falla en tu vivienda para que el equipo técnico de la EP lo evalúe y devuelva una solución oficial.
          </p>
        </div>

        {/* Selector de Acción */}
        <div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-200/80 p-1 border border-slate-300/80">
          <button
            type="button"
            onClick={() => setTab("ingresar")}
            className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition sm:text-sm ${
              tab === "ingresar"
                ? "bg-white text-cyan-800 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Send size={15} />
            Ingresar Solicitud
          </button>
          <button
            type="button"
            onClick={() => setTab("consultar")}
            className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition sm:text-sm ${
              tab === "consultar"
                ? "bg-white text-cyan-800 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Search size={15} />
            Consultar Estado
          </button>
        </div>

        {/* Tarjeta del Formulario o Consulta */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {tab === "ingresar" ? <FormularioPublico /> : <ConsultaPublica />}
        </div>
      </main>

      {/* Pie de Página Aislado */}
      <footer className="mt-12 border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <p className="font-semibold text-slate-700">Entidad Patrocinante · Plataforma de Consulta Habitacional</p>
        <p className="mt-1 text-[11px] text-slate-400">
          Tus datos son tratados de forma confidencial y utilizados exclusivamente para la gestión técnica de tu vivienda.
        </p>
      </footer>
    </div>
  );
}

/* =========================================================================
   FORMULARIO DE INGRESO PÚBLICO
   ========================================================================= */
function FormularioPublico() {
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
      alert("Por favor completa los campos requeridos: RUT, Nombre y Descripción.");
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
      <div className="py-6 text-center space-y-5">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-inner">
          <CheckCircle2 size={36} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">¡Tu Solicitud Fue Recibida!</h3>
          <p className="mt-1 text-sm text-slate-600">
            El equipo técnico de la Entidad Patrocinante ya tiene tu solicitud en su bandeja de trabajo.
          </p>
        </div>

        <div className="rounded-2xl bg-cyan-50/70 p-5 border border-cyan-200">
          <p className="text-xs font-bold uppercase tracking-wider text-cyan-800">
            Tu Código de Seguimiento
          </p>
          <p className="mt-2 font-mono text-3xl font-extrabold text-cyan-900 tracking-wider">
            {ticketCreado.codigo}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Guarda o anota este código. Con él o con tu RUT podrás consultar la respuesta de la EP en cualquier momento.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setTicketCreado(null);
            setDescripcion("");
            setFoto(null);
          }}
          className="rounded-xl bg-cyan-700 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-cyan-800"
        >
          Ingresar otra solicitud
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h3 className="text-base font-bold text-slate-900 sm:text-lg">
          Datos de la Solicitud
        </h3>
        <p className="text-xs text-slate-500">
          Los campos con asterisco (*) son obligatorios.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-bold text-slate-700">RUT del Beneficiario *</label>
          <input
            type="text"
            required
            placeholder="Ej: 12.345.678-9"
            value={rut}
            onChange={(e) => setRut(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 focus:border-cyan-600 focus:bg-white focus:outline-hidden"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700">Nombre Completo *</label>
          <input
            type="text"
            required
            placeholder="Ej: María González"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 focus:border-cyan-600 focus:bg-white focus:outline-hidden"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-bold text-slate-700">Teléfono Celular *</label>
          <input
            type="tel"
            required
            placeholder="+56 9 1234 5678"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 focus:border-cyan-600 focus:bg-white focus:outline-hidden"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700">Comité / Proyecto</label>
          <input
            type="text"
            placeholder="Ej: Villa Los Aromos"
            value={comite}
            onChange={(e) => setComite(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 focus:border-cyan-600 focus:bg-white focus:outline-hidden"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-bold text-slate-700">N° de Casa / Lote o Depto</label>
          <input
            type="text"
            placeholder="Ej: Casa 14 Mz D o Depto 302"
            value={vivienda}
            onChange={(e) => setVivienda(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 focus:border-cyan-600 focus:bg-white focus:outline-hidden"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700">Recinto del Problema</label>
          <select
            value={recinto}
            onChange={(e) => setRecinto(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 focus:border-cyan-600 focus:bg-white focus:outline-hidden"
          >
            <option value="">Selecciona el lugar...</option>
            {RECINTOS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700">¿Qué problema ocurre? *</label>
        <textarea
          rows={3}
          required
          placeholder="Describe con claridad lo que sucede (ej: filtración en lavamanos, ventana descuadrada, humedad en el cielo raso, etc.)..."
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm text-slate-800 focus:border-cyan-600 focus:bg-white focus:outline-hidden placeholder-slate-400"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700">Fotografía de Respaldo (Opcional)</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFoto(e.target.files[0] || null)}
          className="mt-1 block w-full text-xs text-slate-500 file:mr-3 file:rounded-xl file:border-0 file:bg-cyan-50 file:px-4 file:py-2 file:text-xs file:font-bold file:text-cyan-800 hover:file:bg-cyan-100"
        />
        <p className="mt-1 text-[11px] text-slate-400">Puedes tomar la foto directamente con la cámara de tu celular.</p>
      </div>

      {/* Casilla de Urgencia */}
      <div className="rounded-xl bg-red-50/70 p-3.5 border border-red-200">
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={esUrgente}
            onChange={(e) => setEsUrgente(e.target.checked)}
            className="h-4 w-4 rounded text-red-600 focus:ring-red-500"
          />
          <span className="text-xs font-bold text-red-900">
            ⚠️ ¿Es una urgencia crítica? (Ej: fuga continua de agua o escape de gas)
          </span>
        </label>
      </div>

      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded-xl bg-cyan-700 py-3.5 text-sm font-bold text-white shadow-md hover:bg-cyan-800 transition disabled:opacity-50"
      >
        {enviando ? "Enviando Solicitud..." : "Enviar Solicitud a la EP"}
      </button>
    </form>
  );
}

/* =========================================================================
   CONSULTA PÚBLICA DE ESTADO
   ========================================================================= */
function ConsultaPublica() {
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
      alert("No fue posible consultar tu solicitud. Por favor verifica los datos ingresados.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-bold text-slate-900 sm:text-lg">
          Consultar Estado de mi Solicitud
        </h3>
        <p className="text-xs text-slate-500">
          Ingresa tu RUT o tu Código de Solicitud (ej: PV-2026-0001).
        </p>
      </div>

      <form onSubmit={handleConsultar} className="flex gap-2">
        <input
          type="text"
          placeholder="Ej: 12.345.678-9 o PV-2026-0001"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 focus:border-cyan-600 focus:bg-white focus:outline-hidden"
        />
        <button
          type="submit"
          disabled={cargando}
          className="rounded-xl bg-cyan-700 px-5 py-2.5 text-xs font-bold text-white hover:bg-cyan-800 transition disabled:opacity-50"
        >
          {cargando ? "Buscando..." : "Consultar"}
        </button>
      </form>

      {/* Resultados de la Consulta */}
      {resultados !== null && (
        <div className="mt-6 space-y-4">
          {resultados.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500">
              No se encontraron solicitudes registradas con ese RUT o código. Verifica haberlo escrito correctamente.
            </div>
          ) : (
            resultados.map((t) => (
              <div
                key={t.id}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-3.5 shadow-2xs"
              >
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <span className="font-mono text-xs font-extrabold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-100">
                    {t.codigo}
                  </span>
                  <BadgeEstado estado={t.estado} />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Problema Reportado
                  </p>
                  <p className="text-sm text-slate-800 mt-1 font-medium">"{t.descripcion}"</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Ingresado el {formatearFecha(t.creado_en)}
                  </p>
                </div>

                {/* Explicación de Estado según avance */}
                {t.estado === "recibida" && (
                  <div className="rounded-xl bg-amber-50 p-4 text-xs text-amber-900 border border-amber-200 flex items-start gap-2.5">
                    <Clock size={18} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-sm">Tu solicitud fue recibida</p>
                      <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                        Está en espera de revisión por el equipo técnico de la EP. Si se requiere inspección en terreno, te contactaremos al teléfono registrado.
                      </p>
                    </div>
                  </div>
                )}

                {t.estado === "en_gestion" && (
                  <div className="rounded-xl bg-blue-50 p-4 text-xs text-blue-900 border border-blue-200 flex items-start gap-2.5">
                    <Wrench size={18} className="text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-sm">Solicitud en gestión</p>
                      <p className="text-xs text-blue-800 mt-1 leading-relaxed">
                        El equipo técnico de la EP se encuentra coordinando la revisión en terreno o los trabajos correspondientes con la cuadrilla.
                      </p>
                    </div>
                  </div>
                )}

                {t.estado === "resuelta" && (
                  <div className="rounded-2xl bg-emerald-50 p-5 text-xs text-emerald-950 border border-emerald-200 space-y-3">
                    <div className="flex items-center gap-2 font-bold text-emerald-800 text-sm sm:text-base">
                      <CheckCircle2 size={20} className="text-emerald-600" />
                      Solicitud Resuelta por la Entidad Patrocinante
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-emerald-100 text-sm shadow-2xs">
                      <p className="font-bold text-xs uppercase tracking-wider text-emerald-700">
                        Respuesta Oficial de la EP:
                      </p>
                      <p className="mt-1.5 text-slate-800 font-medium leading-relaxed">
                        {t.respuesta_tecnica || "Trabajos ejecutados y conformes."}
                      </p>
                    </div>
                    {t.tecnico_responsable && (
                      <p className="text-xs text-emerald-800">
                        <span className="font-semibold">Responsable técnico:</span> {t.tecnico_responsable}
                      </p>
                    )}
                    {t.fecha_resolucion && (
                      <p className="text-[11px] text-emerald-700">
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

function BadgeEstado({ estado }) {
  if (estado === "resuelta") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
        <CheckCircle2 size={12} /> Resuelta
      </span>
    );
  }
  if (estado === "en_gestion") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-800">
        <Clock size={12} /> En gestión
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
      <Clock size={12} /> Recibida
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
