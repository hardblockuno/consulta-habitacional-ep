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
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Encabezado Institucional */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-800 text-white">
              <Building2 size={20} />
            </div>
            <div>
              <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                Entidad Patrocinante
              </p>
              <h1 className="text-base font-bold text-slate-900 leading-tight">
                Atención y Postventa Habitacional
              </h1>
            </div>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Canal de Atención Directa
          </span>
        </div>
      </header>

      {/* Contenedor Principal */}
      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        {/* Ficha Informativa Institucional (Sobria, sin degradados) */}
        <div className="mb-6 rounded-lg border-l-4 border-slate-700 border border-slate-200 bg-white p-5">
          <h2 className="text-base font-bold text-slate-900">
            Recepción de Solicitudes Técnicas
          </h2>
          <p className="mt-1 text-xs text-slate-600 leading-relaxed">
            Plataforma para el ingreso formal de requerimientos de postventa y consulta del estado de avance atendido por el equipo técnico.
          </p>
        </div>

        {/* Pestañas de Navegación */}
        <div className="mb-6 flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => setTab("ingresar")}
            className={`border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
              tab === "ingresar"
                ? "border-slate-900 text-slate-900 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Ingresar Nueva Solicitud
          </button>
          <button
            type="button"
            onClick={() => setTab("consultar")}
            className={`border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
              tab === "consultar"
                ? "border-slate-900 text-slate-900 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Consultar Estado de Solicitud
          </button>
        </div>

        {/* Contenido de la Acción */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-2xs">
          {tab === "ingresar" ? <FormularioPublico /> : <ConsultaPublica />}
        </div>
      </main>

      {/* Pie Institucional */}
      <footer className="mt-12 border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
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
      <div className="py-6 space-y-4">
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Registro Conforme
          </p>
          <h3 className="mt-1 text-base font-bold text-slate-900">
            Solicitud Registrada en la Plataforma
          </h3>
          <p className="mt-1 text-xs text-slate-600">
            El requerimiento fue derivado al equipo técnico para su revisión.
          </p>
        </div>

        <div className="rounded-md border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Código de Seguimiento
          </p>
          <p className="mt-1 font-mono text-2xl font-bold text-slate-900">
            {ticketCreado.codigo}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Conserve este número para consultar el estado o resolución de su caso.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setTicketCreado(null);
            setDescripcion("");
            setFoto(null);
          }}
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          Ingresar otra solicitud
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="border-b border-slate-100 pb-2">
        <h3 className="text-sm font-bold text-slate-900">
          Antecedentes del Requerimiento
        </h3>
        <p className="text-xs text-slate-500">
          Los campos con asterisco (*) son obligatorios.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold text-slate-700">RUT del Beneficiario *</label>
          <input
            type="text"
            required
            placeholder="12.345.678-9"
            value={rut}
            onChange={(e) => setRut(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-slate-800 focus:outline-hidden"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700">Nombre Completo *</label>
          <input
            type="text"
            required
            placeholder="Nombres y Apellidos"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-slate-800 focus:outline-hidden"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold text-slate-700">Teléfono de Contacto *</label>
          <input
            type="tel"
            required
            placeholder="+56 9 1234 5678"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-slate-800 focus:outline-hidden"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700">Comité / Proyecto Habitacional</label>
          <input
            type="text"
            placeholder="Nombre del comité o conjunto"
            value={comite}
            onChange={(e) => setComite(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-slate-800 focus:outline-hidden"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold text-slate-700">N° de Casa, Lote o Departamento</label>
          <input
            type="text"
            placeholder="Ej: Lote 14 Mz D / Depto 302"
            value={vivienda}
            onChange={(e) => setVivienda(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-slate-800 focus:outline-hidden"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700">Recinto Afectado</label>
          <select
            value={recinto}
            onChange={(e) => setRecinto(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-slate-800 focus:outline-hidden"
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
        <label className="block text-xs font-semibold text-slate-700">Descripción de la Observación o Falla *</label>
        <textarea
          rows={3}
          required
          placeholder="Describa brevemente la situación técnica observada en la vivienda..."
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 bg-white p-3 text-xs text-slate-900 focus:border-slate-800 focus:outline-hidden placeholder-slate-400"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700">Fotografía de Respaldo (Opcional)</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFoto(e.target.files[0] || null)}
          className="mt-1 block w-full text-xs text-slate-500 file:mr-3 file:rounded-md file:border file:border-slate-300 file:bg-slate-50 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-700 hover:file:bg-slate-100"
        />
      </div>

      <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={esUrgente}
            onChange={(e) => setEsUrgente(e.target.checked)}
            className="mt-0.5 rounded border-slate-300 text-slate-800 focus:ring-slate-700"
          />
          <span className="text-xs text-slate-700 font-medium">
            Clasificar como urgencia prioritaria (filtración continua de agua potable o red de gas)
          </span>
        </label>
      </div>

      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded-md bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition disabled:opacity-50"
      >
        {enviando ? "Registrando Solicitud..." : "Registrar Solicitud"}
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
        <h3 className="text-sm font-bold text-slate-900">
          Consulta de Estado y Respuesta Técnica
        </h3>
        <p className="text-xs text-slate-500">
          Ingrese el RUT del beneficiario o el código de solicitud asignado (ej: PV-2026-0001).
        </p>
      </div>

      <form onSubmit={handleConsultar} className="flex gap-2">
        <input
          type="text"
          placeholder="RUT (12.345.678-9) o Código"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-slate-800 focus:outline-hidden"
        />
        <button
          type="submit"
          disabled={cargando}
          className="rounded-md bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition disabled:opacity-50"
        >
          {cargando ? "Buscando..." : "Consultar"}
        </button>
      </form>

      {/* Resultados */}
      {resultados !== null && (
        <div className="mt-5 space-y-3">
          {resultados.length === 0 ? (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-500">
              No existen solicitudes registradas para el criterio ingresado.
            </div>
          ) : (
            resultados.map((t) => (
              <div
                key={t.id}
                className="rounded-md border border-slate-200 bg-white p-4 space-y-3 text-xs"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-mono font-bold text-slate-800">
                    {t.codigo}
                  </span>
                  <BadgeEstado estado={t.estado} />
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase">
                    Detalle del Requerimiento
                  </p>
                  <p className="mt-0.5 text-slate-800">{t.descripcion}</p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Fecha de ingreso: {formatearFecha(t.creado_en)}
                  </p>
                </div>

                {t.estado === "recibida" && (
                  <div className="rounded border border-slate-200 bg-slate-50 p-3 text-slate-700">
                    <p className="font-semibold text-slate-800">Estado: Solicitud Recibida</p>
                    <p className="mt-0.5 text-[11px] text-slate-600">
                      En espera de revisión y asignación por parte del equipo técnico de la EP.
                    </p>
                  </div>
                )}

                {t.estado === "en_gestion" && (
                  <div className="rounded border border-blue-200 bg-blue-50/50 p-3 text-blue-900">
                    <p className="font-semibold text-blue-900">Estado: En Atención Técnica</p>
                    <p className="mt-0.5 text-[11px] text-blue-800">
                      El requerimiento se encuentra en proceso de coordinación con la cuadrilla técnica o constructora.
                    </p>
                  </div>
                )}

                {t.estado === "resuelta" && (
                  <div className="rounded border border-emerald-200 bg-emerald-50/40 p-3.5 space-y-2">
                    <p className="font-bold text-emerald-900 text-xs">
                      Estado: Solicitud Finalizada
                    </p>
                    <div className="rounded border border-emerald-100 bg-white p-2.5">
                      <p className="text-[10px] font-bold text-emerald-800 uppercase">
                        Resolución Técnica del Profesional a Cargo:
                      </p>
                      <p className="mt-1 text-slate-800 text-xs leading-relaxed">
                        {t.respuesta_tecnica || "Trabajo concluido conforme."}
                      </p>
                    </div>
                    {t.tecnico_responsable && (
                      <p className="text-[11px] text-slate-600">
                        Profesional a cargo: {t.tecnico_responsable}
                      </p>
                    )}
                    {t.fecha_resolucion && (
                      <p className="text-[10px] text-slate-400">
                        Fecha de cierre: {formatearFecha(t.fecha_resolucion)}
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
