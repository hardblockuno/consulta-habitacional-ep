import { useEffect, useState } from "react";
import {
  AlertCircle,
  Building2,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Home,
  Image as ImageIcon,
  Info,
  Paperclip,
  Phone,
  Search,
  Send,
  Trash2,
  Upload,
  User,
  Wrench,
  X,
} from "lucide-react";
import { api } from "../api/client.js";

const RECINTOS_PREDEFINIDOS = [
  "Baño",
  "Cocina",
  "Techumbre / Cubierta",
  "Dormitorio Principal",
  "Dormitorio Secundario",
  "Living - Comedor",
  "Fachada / Muros Exteriores",
  "Instalación Eléctrica",
  "Instalación Sanitaria / Gas",
  "Patio / Cierros / Acceso",
];

export default function PortalPostventaPublico() {
  const [tab, setTab] = useState("ingresar"); // "ingresar" | "consultar"
  const [rutConsultaDirecta, setRutConsultaDirecta] = useState("");

  const handleIrAConsulta = (rutParaConsultar = "") => {
    if (rutParaConsultar) {
      setRutConsultaDirecta(rutParaConsultar);
    }
    setTab("consultar");
  };

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-800 antialiased">
      {/* Encabezado Institucional */}
      <header className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <img
              src="/sigep-symbol.png"
              alt="SIGEP"
              className="h-9 w-9 object-contain shrink-0"
            />
            <div>
              <p className="text-[10px] font-medium tracking-wider uppercase text-slate-400">
                Plan Social · Entidad Patrocinante
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
        {/* Pestañas de Navegación Segmentadas */}
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
              Consultar Estado por RUT
            </button>
          </div>
        </div>

        {/* Contenido de la Acción */}
        <div className="rounded-lg border border-slate-200/80 bg-white p-6 shadow-2xs">
          {tab === "ingresar" ? (
            <FormularioPublico onIrAConsulta={handleIrAConsulta} />
          ) : (
            <ConsultaPublica rutInicial={rutConsultaDirecta} />
          )}
        </div>
      </main>

      {/* Pie Institucional */}
      <footer className="mt-12 border-t border-slate-200/70 py-6 text-center text-xs text-slate-400">
        Plan Social · Entidad Patrocinante Habitacional
      </footer>
    </div>
  );
}

/* =========================================================================
   FORMULARIO DE INGRESO
   ========================================================================= */
function FormularioPublico({ onIrAConsulta }) {
  const [rut, setRut] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [comite, setComite] = useState("");
  const [vivienda, setVivienda] = useState("");

  // Recintos múltiples
  const [recintosSeleccionados, setRecintosSeleccionados] = useState([]);
  const [incluirOtro, setIncluirOtro] = useState(false);
  const [otroRecinto, setOtroRecinto] = useState("");

  const [descripcion, setDescripcion] = useState("");
  const [esUrgente, setEsUrgente] = useState(false);

  // Foto obligatoria y preview
  const [foto, setFoto] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);

  const [enviando, setEnviando] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState("");
  const [ticketCreado, setTicketCreado] = useState(null);

  const toggleRecinto = (nombreRecinto) => {
    setRecintosSeleccionados((prev) =>
      prev.includes(nombreRecinto)
        ? prev.filter((r) => r !== nombreRecinto)
        : [...prev, nombreRecinto]
    );
  };

  const handleFotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Por favor seleccione un archivo de imagen válido (JPG, PNG, WEBP).");
        return;
      }
      setFoto(file);
      setFotoPreview(URL.createObjectURL(file));
      setErrorValidacion("");
    }
  };

  const eliminarFoto = () => {
    setFoto(null);
    if (fotoPreview) {
      URL.revokeObjectURL(fotoPreview);
      setFotoPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorValidacion("");

    // 1. Validación de RUT Obligatorio
    const rutLimpio = rut.trim();
    if (!rutLimpio) {
      setErrorValidacion("El RUT del beneficiario es obligatorio para registrar y consultar su solicitud.");
      return;
    }

    // 2. Validación de Nombre
    if (!nombre.trim()) {
      setErrorValidacion("Por favor ingrese su Nombre Completo.");
      return;
    }

    // 3. Validación de Teléfono
    if (!telefono.trim()) {
      setErrorValidacion("Por favor ingrese su Teléfono de Contacto.");
      return;
    }

    // 4. Validación de Recintos Afectados
    const listaFinalRecintos = [...recintosSeleccionados];
    if (incluirOtro && otroRecinto.trim()) {
      listaFinalRecintos.push(otroRecinto.trim());
    }

    if (listaFinalRecintos.length === 0) {
      setErrorValidacion("Debe seleccionar al menos un recinto afectado en su vivienda.");
      return;
    }

    // 5. Validación de Descripción
    if (!descripcion.trim()) {
      setErrorValidacion("Por favor detalle la falla u observación técnica.");
      return;
    }

    // 6. Validación de Foto Obligatoria
    if (!foto) {
      setErrorValidacion("Es obligatorio adjuntar al menos una fotografía clara del lugar afectado para que el equipo técnico evalúe la solución.");
      return;
    }

    setEnviando(true);
    try {
      const formData = new FormData();
      formData.append("rut", rutLimpio);
      formData.append("nombre", nombre.trim());
      formData.append("telefono", telefono.trim());
      formData.append("comite_nombre", comite.trim());
      formData.append("vivienda_direccion", vivienda.trim());

      // Múltiples recintos: se envía tanto el texto consolidado como el array JSON
      formData.append("recinto", listaFinalRecintos.join(", "));
      formData.append("recintos", JSON.stringify(listaFinalRecintos));

      formData.append("descripcion", descripcion.trim());
      formData.append("urgencia", esUrgente ? "urgente" : "normal");
      formData.append("foto", foto);

      const res = await api.post("/postventa/tickets/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000,
      });

      setTicketCreado({ ...res.data, recintosLista: listaFinalRecintos });
    } catch (err) {
      console.error("Error al ingresar solicitud:", err);
      const msg = err.response?.data?.detail || "Ocurrió un error al registrar la solicitud. Intente nuevamente.";
      setErrorValidacion(msg);
    } finally {
      setEnviando(false);
    }
  };

  if (ticketCreado) {
    return (
      <div className="py-2 space-y-4">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-600" />
            <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
              Solicitud Registrada Exitosamente
            </p>
          </div>
          <h3 className="mt-1 text-sm font-semibold text-slate-900">
            Estimado(a) {ticketCreado.nombre}, su caso ha sido ingresado al sistema.
          </h3>
          <p className="mt-1 text-xs text-slate-700 leading-relaxed">
            Nuestro equipo técnico revisará los antecedentes y la fotografía enviada para coordinar la inspección o reparación correspondiente.
          </p>
        </div>

        {/* Resumen del Ticket */}
        <div className="rounded-lg border border-slate-200/90 bg-slate-50/40 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/70 pb-2.5">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                Código de Referencia
              </p>
              <p className="font-mono text-base font-bold text-slate-900">
                {ticketCreado.codigo}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                RUT Registrado
              </p>
              <p className="font-mono text-base font-bold text-slate-900">
                {ticketCreado.rut}
              </p>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 mb-1">
              Recintos Reportados
            </p>
            <div className="flex flex-wrap gap-1">
              {(ticketCreado.recintos || ticketCreado.recintosLista || [ticketCreado.recinto]).map((rec, i) => (
                <span
                  key={i}
                  className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[11px] font-medium text-slate-700"
                >
                  {rec}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-md bg-indigo-50/80 border border-indigo-200/70 p-3 text-xs text-indigo-950 flex items-start gap-2.5">
            <Info size={16} className="text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">¡Consulta simple solo con su RUT!</p>
              <p className="text-indigo-800 text-[11px] mt-0.5 leading-normal">
                No necesita memorizar ningún código complicado. Para ver los avances, la visita técnica o la resolución, simplemente ingrese a la pestaña <strong>"Consultar Estado por RUT"</strong> y escriba su RUT.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <button
            type="button"
            onClick={() => onIrAConsulta && onIrAConsulta(ticketCreado.rut)}
            className="flex-1 rounded-md bg-slate-900 py-2 px-3 text-center text-xs font-semibold text-white hover:bg-slate-800 transition shadow-2xs"
          >
            Ver estado ahora con mi RUT →
          </button>
          <button
            type="button"
            onClick={() => {
              setTicketCreado(null);
              setDescripcion("");
              setRecintosSeleccionados([]);
              setOtroRecinto("");
              setIncluirOtro(false);
              eliminarFoto();
            }}
            className="rounded-md border border-slate-200 bg-white py-2 px-3 text-center text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            Ingresar otra solicitud
          </button>
        </div>
      </div>
    );
  }

  const totalRecintos = recintosSeleccionados.length + (incluirOtro && otroRecinto.trim() ? 1 : 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="border-b border-slate-100 pb-2.5">
        <h3 className="text-sm font-semibold tracking-tight text-slate-900">
          Formulario Oficial de Solicitud de Postventa
        </h3>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Ingrese los antecedentes de la vivienda. Los campos con asterisco (*) son obligatorios.
        </p>
      </div>

      {errorValidacion && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle size={15} className="shrink-0 text-rose-600" />
          <span>{errorValidacion}</span>
        </div>
      )}

      {/* Identificación del Beneficiario */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <div>
          <label className="block text-[11px] font-semibold text-slate-700">
            RUT del Beneficiario <span className="text-rose-600 font-bold">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="Ej: 12.345.678-9 o 12345678-9"
            value={rut}
            onChange={(e) => setRut(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none transition-all font-mono"
          />
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Permitirá consultar el estado directamente.
          </span>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-700">
            Nombre Completo <span className="text-rose-600 font-bold">*</span>
          </label>
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
          <label className="block text-[11px] font-semibold text-slate-700">
            Teléfono de Contacto <span className="text-rose-600 font-bold">*</span>
          </label>
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
          <label className="block text-[11px] font-medium text-slate-600">
            Comité / Proyecto Habitacional (Opcional)
          </label>
          <input
            type="text"
            placeholder="Nombre del comité o conjunto"
            value={comite}
            onChange={(e) => setComite(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-medium text-slate-600">
          N° de Casa, Lote o Dirección de la Vivienda
        </label>
        <input
          type="text"
          placeholder="Ej: Lote 14 Mz D / Pasaje Los Aromos 123"
          value={vivienda}
          onChange={(e) => setVivienda(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none transition-all"
        />
      </div>

      {/* SECCIÓN MÚLTIPLES RECINTOS AFECTADOS */}
      <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-semibold text-slate-800 flex items-center gap-1.5">
            <span>Recintos Afectados en la Vivienda</span>
            <span className="text-rose-600 font-bold">*</span>
          </label>
          <span className="text-[11px] font-medium text-slate-500">
            {totalRecintos === 0
              ? "Seleccione uno o más"
              : `${totalRecintos} recinto(s) seleccionado(s)`}
          </span>
        </div>
        <p className="text-[11px] text-slate-500">
          Puede marcar más de un recinto afectado en la misma solicitud (ej. Baño y Techumbre) sin necesidad de crear tickets separados:
        </p>

        {/* Chips de Selección Múltiple */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {RECINTOS_PREDEFINIDOS.map((rec) => {
            const seleccionado = recintosSeleccionados.includes(rec);
            return (
              <button
                key={rec}
                type="button"
                onClick={() => toggleRecinto(rec)}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  seleccionado
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-100"
                }`}
              >
                {seleccionado && <Check size={12} className="stroke-[3]" />}
                {rec}
              </button>
            );
          })}

          {/* Opción Otro Recinto */}
          <button
            type="button"
            onClick={() => setIncluirOtro(!incluirOtro)}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
              incluirOtro
                ? "bg-slate-900 text-white shadow-2xs"
                : "bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-100"
            }`}
          >
            {incluirOtro && <Check size={12} className="stroke-[3]" />}
            + Otro recinto
          </button>
        </div>

        {incluirOtro && (
          <div className="pt-1">
            <input
              type="text"
              placeholder="Especifique el otro recinto afectado..."
              value={otroRecinto}
              onChange={(e) => setOtroRecinto(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[12px] text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Descripción del Daño */}
      <div>
        <label className="block text-[11px] font-semibold text-slate-700">
          Descripción de la Observación o Falla <span className="text-rose-600 font-bold">*</span>
        </label>
        <textarea
          rows={3}
          required
          placeholder="Describa con la mayor claridad posible la situación técnica observada (ej: filtración de agua en zona de cielo, desprendimiento de sellos, falla en interruptor, etc.)..."
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-200 bg-white p-3 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none transition-all leading-relaxed"
        />
      </div>

      {/* FOTO OBLIGATORIA DEL LUGAR AFECTADO */}
      <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-semibold text-slate-800 flex items-center gap-1.5">
            <Camera size={14} className="text-slate-700" />
            <span>Fotografía del Lugar Afectado</span>
            <span className="text-rose-600 font-bold">* (Obligatoria)</span>
          </label>
          {foto && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <CheckCircle2 size={12} /> Foto adjuntada
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-500">
          Adjunte una imagen clara del daño o recinto afectado para respaldar su solicitud y permitir al equipo técnico planificar los materiales de reparación.
        </p>

        {!fotoPreview ? (
          <label className="mt-2 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-white p-5 text-center cursor-pointer hover:bg-slate-50 hover:border-slate-400 transition">
            <Upload size={24} className="text-slate-400 mb-1.5" />
            <span className="text-xs font-semibold text-slate-700">
              Presione aquí para tomar o subir una fotografía
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">
              Formatos aceptados: JPG, PNG, WEBP (hasta 15 MB)
            </span>
            <input
              type="file"
              accept="image/*"
              required
              onChange={handleFotoChange}
              className="hidden"
            />
          </label>
        ) : (
          <div className="mt-2 rounded-lg border border-slate-200 bg-white p-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={fotoPreview}
                alt="Vista previa del daño"
                className="h-16 w-16 object-cover rounded-md border border-slate-200 shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-800 truncate">
                  {foto.name}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {(foto.size / (1024 * 1024)).toFixed(2)} MB · Imagen lista para enviar
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={eliminarFoto}
              className="inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 transition border border-rose-200"
              title="Cambiar o eliminar fotografía"
            >
              <Trash2 size={13} />
              <span className="hidden sm:inline">Quitar</span>
            </button>
          </div>
        )}
      </div>

      {/* Marcar Urgencia */}
      <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-3">
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={esUrgente}
            onChange={(e) => setEsUrgente(e.target.checked)}
            className="mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-slate-800"
          />
          <span className="text-xs text-slate-600 font-medium">
            Clasificar como urgencia prioritaria (filtración continua de agua potable o red de gas que impida habitar la vivienda)
          </span>
        </label>
      </div>

      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded-md bg-slate-900 py-2.5 text-[13px] font-semibold text-white hover:bg-slate-800 transition-colors shadow-2xs disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <Send size={14} />
        {enviando ? "Registrando Solicitud..." : "Registrar Solicitud Oficial"}
      </button>
    </form>
  );
}

/* =========================================================================
   CONSULTA PÚBLICA 100% POR RUT
   ========================================================================= */
function ConsultaPublica({ rutInicial = "" }) {
  const [busqueda, setBusqueda] = useState(rutInicial);
  const [resultados, setResultados] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const ejecutarConsulta = async (termino) => {
    const valor = termino.trim();
    if (!valor) return;

    setCargando(true);
    setErrorMsg("");
    try {
      const isCodigo = valor.toUpperCase().startsWith("PV-");
      const params = isCodigo ? { codigo: valor } : { rut: valor };
      const res = await api.get("/postventa/tickets/consultar/", { params });
      setResultados(res.data || []);
    } catch (err) {
      console.error("Error al consultar:", err);
      setErrorMsg("No fue posible consultar la solicitud. Por favor verifique el RUT e intente nuevamente.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (rutInicial) {
      setBusqueda(rutInicial);
      ejecutarConsulta(rutInicial);
    }
  }, [rutInicial]);

  const handleConsultar = (e) => {
    e.preventDefault();
    ejecutarConsulta(busqueda);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold tracking-tight text-slate-900">
          Consulta de Estado de Solicitudes
        </h3>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Ingrese su <strong>RUT</strong> para revisar en tiempo real el avance y dictamen de todas las solicitudes que ha registrado.
        </p>
      </div>

      <form onSubmit={handleConsultar} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Ingrese su RUT (ej: 12.345.678-9 o 12345678-9)"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none transition-all font-mono"
          />
        </div>
        <button
          type="submit"
          disabled={cargando || !busqueda.trim()}
          className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-4 py-2 text-[13px] font-medium text-white hover:bg-slate-800 transition-colors shadow-2xs disabled:opacity-50"
        >
          <Search size={14} />
          {cargando ? "Buscando..." : "Consultar"}
        </button>
      </form>

      {errorMsg && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle size={15} className="shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Resultados de la Consulta */}
      {resultados !== null && (
        <div className="mt-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-medium text-slate-600">
              {resultados.length === 0
                ? "Sin resultados"
                : `${resultados.length} solicitud(es) encontrada(s)`}
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Criterio: {busqueda}
            </span>
          </div>

          {resultados.length === 0 ? (
            <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-6 text-center text-xs text-slate-500">
              <FileText size={28} className="mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-slate-700">No se encontraron solicitudes registradas</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Verifique que el RUT esté bien escrito o ingrese una nueva solicitud si aún no la ha registrado.
              </p>
            </div>
          ) : (
            resultados.map((t) => (
              <div
                key={t.id}
                className="rounded-lg border border-slate-200/90 bg-white p-4 space-y-3.5 text-xs shadow-2xs"
              >
                {/* Cabecera del Ticket */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {t.codigo}
                    </span>
                    {t.urgencia === "urgente" && (
                      <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700 border border-rose-200">
                        Urgente
                      </span>
                    )}
                  </div>
                  <BadgeEstado estado={t.estado} />
                </div>

                {/* Datos del Beneficiario y Ubicación */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-medium">Beneficiario</span>
                    <strong className="text-slate-800 font-semibold">{t.nombre}</strong> (RUT: {t.rut})
                  </div>
                  {(t.comite_nombre || t.vivienda_direccion) && (
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-medium">Ubicación</span>
                      <span className="text-slate-700">
                        {t.comite_nombre ? `${t.comite_nombre} · ` : ""}
                        {t.vivienda_direccion || "Sin dirección"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Recintos Afectados */}
                {((t.recintos && t.recintos.length > 0) || t.recinto) && (
                  <div>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block mb-1">
                      Recinto(s) Afectado(s):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {(t.recintos && t.recintos.length > 0
                        ? t.recintos
                        : t.recinto.split(",").map((s) => s.trim())
                      ).map((rec, i) => (
                        <span
                          key={i}
                          className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 border border-slate-200/70"
                        >
                          {rec}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Detalle y Fotografía */}
                <div className="rounded-md border border-slate-100 bg-slate-50/70 p-3 space-y-2">
                  <div>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block">
                      Detalle del Requerimiento:
                    </span>
                    <p className="mt-0.5 text-[12px] text-slate-800 leading-relaxed">
                      {t.descripcion}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-400">
                      Ingresado el {formatearFecha(t.creado_en)}
                    </p>
                  </div>

                  {/* Foto adjunta */}
                  {t.foto && (
                    <div className="pt-2 border-t border-slate-200/60">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block mb-1.5">
                        Fotografía Adjunta de Respaldo:
                      </span>
                      <a
                        href={t.foto}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white p-1.5 hover:bg-slate-50 transition"
                      >
                        <img
                          src={t.foto}
                          alt="Fotografía del lugar afectado"
                          className="h-12 w-12 object-cover rounded shrink-0 border border-slate-200"
                        />
                        <span className="text-[11px] font-medium text-slate-700 flex items-center gap-1">
                          Ver imagen completa <ExternalLink size={11} className="text-slate-400" />
                        </span>
                      </a>
                    </div>
                  )}
                </div>

                {/* Explicación del Estado Actual */}
                {t.estado === "recibida" && (
                  <div className="rounded-md border border-amber-200/80 bg-amber-50/60 p-3 text-amber-950">
                    <p className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
                      <Clock size={13} className="text-amber-700" />
                      Solicitud Recibida · En Espera de Asignación
                    </p>
                    <p className="mt-0.5 text-[11px] text-amber-800 leading-normal">
                      Su requerimiento ha sido registrado en el sistema y se encuentra en cola para ser asignado a un profesional técnico o cuadrilla de obras.
                    </p>
                  </div>
                )}

                {t.estado === "en_gestion" && (
                  <div className="rounded-md border border-blue-200/80 bg-blue-50/60 p-3 text-blue-950">
                    <p className="text-xs font-semibold text-blue-900 flex items-center gap-1.5">
                      <Wrench size={13} className="text-blue-700" />
                      En Proceso de Gestión y Coordinación Técnica
                    </p>
                    <p className="mt-0.5 text-[11px] text-blue-800 leading-normal">
                      El requerimiento se encuentra activo. El equipo técnico o empresa constructora está planificando la visita o coordinando los trabajos en terreno.
                    </p>
                  </div>
                )}

                {t.estado === "resuelta" && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3.5 space-y-2">
                    <p className="font-semibold text-emerald-950 text-xs flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-emerald-600" />
                      Resolución Técnica Conforme (Finalizada)
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
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" /> Resuelta
      </span>
    );
  }
  if (estado === "en_gestion") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-blue-800 bg-blue-50 border border-blue-200">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-600" /> En Gestión
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-600" /> Recibida
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
