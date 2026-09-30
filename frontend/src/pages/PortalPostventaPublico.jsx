import { useState } from "react";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  FileText,
  Home,
  Paperclip,
  Phone,
  Search,
  Send,
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
    <div className="min-h-screen bg-slate-50/60 text-slate-800 antialiased">
      {/* Encabezado Institucional */}
      <header className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-900 text-white shadow-2xs">
              <Building2 size={18} />
            </div>
            <div>
              <p className="text-[10px] font-medium tracking-wider uppercase text-slate-400">
                Entidad Patrocinante
              </p>
              <h1 className="text-sm font-semibold tracking-tight text-slate-900 leading-tight">
                Atención y Postventa Habitacional
              </h1>
            </div>
          </div>
          <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200/70">
            Canal Oficial
          </span>
        </div>
      </header>

      {/* Contenedor Principal */}
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        {/* Ficha Informativa Institucional (Sobria, estilo Linear) */}
        <div className="mb-6 rounded-lg border border-slate-200/80 bg-white p-4 shadow-2xs">
          <h2 className="text-sm font-semibold tracking-tight text-slate-900">
            Recepción y Seguimiento de Requerimientos Técnicos
          </h2>
          <p className="mt-1 text-[13px] text-slate-600 leading-relaxed">
            Plataforma para el ingreso de observaciones de postventa y consulta del estado de atención asignado por el equipo técnico.
          </p>
        </div>

        {/* Pestañas de Navegación Segmentadas (Linear / Apple style) */}
        <div className="mb-6 flex justify-center">
          <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200/70 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setTab("ingresar")}
              className={`flex-1 sm:flex-initial rounded-md px-4 py-1.5 text-[13px] font-medium transition-all ${
                tab === "ingresar"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Ingresar Solicitud
            </button>
            <button
              type="button"
              onClick={() => setTab("consultar")}
              className={`flex-1 sm:flex-initial rounded-md px-4 py-1.5 text-[13px] font-medium transition-all ${
                tab === "consultar"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Consultar Estado
            </button>
          </div>
        </div>

        {/* Contenido de la Acción */}
        <div className="rounded-lg border border-slate-200/80 bg-white p-6 shadow-2xs">
          {tab === "ingresar" ? <FormularioPublico /> : <ConsultaPublica />}
        </div>
      </main>

      {/* Pie Institucional */}
      <footer className="mt-12 border-t border-slate-200/70 bg-white py-6 text-center text-xs text-slate-500">
        <p className="font-medium text-slate-700">Entidad Patrocinante · Departamento Técnico y de Postventa</p>
        <p className="mt-1 text-[11px] text-slate-400">
          Información tratada bajo confidencialidad y para fines exclusivos de mantención y fiscalización habitacional.
        </p>
      </footer>
    </div>
  );
}

/* =========================================================================
   FORMULARIO DE INGRESO (SOBRIO Y PROFESIONAL)
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
      alert("Por favor complete los campos obligatorios: RUT, Nombre y Descripción.");
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
      alert("Ocurrió un error al registrar la solicitud. Intente nuevamente.");
    } finally {
      setEnviando(false);
    }
  };

  if (ticketCreado) {
    return (
      <div className="py-4 space-y-4">
        <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-4">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-600">
              Registro Conforme
            </p>
          </div>
          <h3 className="mt-1.5 text-sm font-semibold text-slate-900">
            Solicitud Registrada Exitosamente
          </h3>
          <p className="mt-1 text-xs text-slate-600 leading-relaxed">
            Su requerimiento ha quedado ingresado en la plataforma y fue derivado al equipo técnico para su revisión.
          </p>
        </div>

        <div className="rounded-lg border border-slate-200/80 bg-white p-4">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Código de Seguimiento
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold tracking-tight text-slate-900">
            {ticketCreado.codigo}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Conserve este identificador para consultar el estado o resolución técnica de su caso.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setTicketCreado(null);
            setDescripcion("");
            setFoto(null);
          }}
          className="rounded-md border border-slate-200 bg-white px-3.5 py-1.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
        >
          Ingresar otra solicitud
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="border-b border-slate-100 pb-3">
        <h3 className="text-sm font-semibold tracking-tight text-slate-900">
          Antecedentes del Requerimiento
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Complete los antecedentes para la debida atención por parte del equipo técnico.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <div>
          <label className="block text-[11px] font-medium text-slate-600">RUT del Beneficiario *</label>
          <input
            type="text"
            required
            placeholder="12.345.678-9"
            value={rut}
            onChange={(e) => setRut(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none transition-all"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-600">Nombre Completo *</label>
          <input
            type="text"
            required
            placeholder="Nombres y Apellidos"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <div>
          <label className="block text-[11px] font-medium text-slate-600">Teléfono de Contacto *</label>
          <input
            type="tel"
            required
            placeholder="+56 9 1234 5678"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none transition-all"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-600">Comité / Proyecto Habitacional</label>
          <input
            type="text"
            placeholder="Nombre del comité o conjunto"
            value={comite}
            onChange={(e) => setComite(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <div>
          <label className="block text-[11px] font-medium text-slate-600">N° de Casa, Lote o Departamento</label>
          <input
            type="text"
            placeholder="Ej: Lote 14 Mz D / Depto 302"
            value={vivienda}
            onChange={(e) => setVivienda(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none transition-all"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-600">Recinto Afectado</label>
          <select
            value={recinto}
            onChange={(e) => setRecinto(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[13px] text-slate-900 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none transition-all"
          >
            <option value="">Seleccione recinto...</option>
            {RECINTOS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-medium text-slate-600">Descripción de la Observación o Falla *</label>
        <textarea
          rows={3}
          required
          placeholder="Describa puntualmente la situación técnica observada en la vivienda..."
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-200 bg-white p-3 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none transition-all leading-relaxed"
        />
      </div>

      <div>
        <label className="block text-[11px] font-medium text-slate-600">Fotografía de Respaldo (Opcional)</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFoto(e.target.files[0] || null)}
          className="mt-1 block w-full text-xs text-slate-500 file:mr-3 file:rounded-md file:border file:border-slate-200 file:bg-slate-50 file:px-3 file:py-1 file:text-xs file:font-medium file:text-slate-700 hover:file:bg-slate-100 cursor-pointer"
        />
      </div>

      <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-3">
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={esUrgente}
            onChange={(e) => setEsUrgente(e.target.checked)}
            className="mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-slate-800"
          />
          <span className="text-xs text-slate-600 font-medium">
            Clasificar como urgencia prioritaria (filtración continua de agua potable o red de gas)
          </span>
        </label>
      </div>

      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded-md bg-slate-900 py-2 text-[13px] font-medium text-white hover:bg-slate-800 transition-colors shadow-2xs disabled:opacity-50"
      >
        {enviando ? "Registrando..." : "Registrar Solicitud"}
      </button>
    </form>
  );
}

/* =========================================================================
   CONSULTA PÚBLICA (SOBRIA)
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
      alert("No fue posible consultar la solicitud. Verifique los antecedentes ingresados.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold tracking-tight text-slate-900">
          Consulta de Estado y Respuesta Técnica
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Ingrese el RUT del beneficiario o el código de seguimiento asignado (ej: PV-2026-0001).
        </p>
      </div>

      <form onSubmit={handleConsultar} className="flex gap-2">
        <input
          type="text"
          placeholder="RUT (12.345.678-9) o Código de seguimiento"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="flex-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none transition-all"
        />
        <button
          type="submit"
          disabled={cargando}
          className="rounded-md bg-slate-900 px-3.5 py-1.5 text-[13px] font-medium text-white hover:bg-slate-800 transition-colors shadow-2xs disabled:opacity-50"
        >
          {cargando ? "Consultando..." : "Consultar"}
        </button>
      </form>

      {/* Resultados */}
      {resultados !== null && (
        <div className="mt-5 space-y-3">
          {resultados.length === 0 ? (
            <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-6 text-center text-xs text-slate-500">
              No existen solicitudes registradas para el criterio ingresado.
            </div>
          ) : (
            resultados.map((t) => (
              <div
                key={t.id}
                className="rounded-lg border border-slate-200/80 bg-white p-4 space-y-3 text-xs shadow-2xs"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span className="font-mono text-xs font-semibold text-slate-900">
                    {t.codigo}
                  </span>
                  <BadgeEstado estado={t.estado} />
                </div>

                <div>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                    Detalle del Requerimiento
                  </p>
                  <p className="mt-1 text-[13px] text-slate-800 leading-relaxed">{t.descripcion}</p>
                  <p className="mt-1.5 text-[11px] text-slate-400">
                    Ingresado el {formatearFecha(t.creado_en)}
                  </p>
                </div>

                {t.estado === "recibida" && (
                  <div className="rounded-md border border-slate-200 bg-slate-50/60 p-3 text-slate-700">
                    <p className="text-xs font-medium text-slate-800">Solicitud en Espera de Asignación</p>
                    <p className="mt-0.5 text-[11px] text-slate-500 leading-normal">
                      El requerimiento está registrado y pendiente de evaluación técnica por el equipo responsable.
                    </p>
                  </div>
                )}

                {t.estado === "en_gestion" && (
                  <div className="rounded-md border border-blue-200/70 bg-blue-50/40 p-3 text-blue-900">
                    <p className="text-xs font-medium text-blue-900">En Proceso de Atención Técnica</p>
                    <p className="mt-0.5 text-[11px] text-blue-700 leading-normal">
                      El requerimiento se encuentra en coordinación con la cuadrilla técnica o empresa constructora.
                    </p>
                  </div>
                )}

                {t.estado === "resuelta" && (
                  <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/30 p-3.5 space-y-2">
                    <p className="font-semibold text-emerald-950 text-xs flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Resolución Técnica Conforme
                    </p>
                    <div className="rounded-md border border-emerald-100 bg-white p-3 shadow-2xs">
                      <p className="text-[10px] font-medium text-emerald-800 uppercase tracking-wider">
                        Constatación y Dictamen del Profesional:
                      </p>
                      <p className="mt-1 text-slate-800 text-[13px] leading-relaxed">
                        {t.respuesta_tecnica || "Trabajo concluido conforme a especificaciones."}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5 text-[11px] text-slate-500">
                      {t.tecnico_responsable && (
                        <span>Profesional responsable: <strong className="font-medium text-slate-700">{t.tecnico_responsable}</strong></span>
                      )}
                      {t.fecha_resolucion && (
                        <span className="text-[10px] text-slate-400">
                          Visado el {formatearFecha(t.fecha_resolucion)}
                        </span>
                      )}
                    </div>
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
      <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium text-slate-700 border border-slate-200 bg-white">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Finalizada
      </span>
    );
  }
  if (estado === "en_gestion") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium text-slate-700 border border-slate-200 bg-white">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" /> En atención
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium text-slate-700 border border-slate-200 bg-white">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Pendiente
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
