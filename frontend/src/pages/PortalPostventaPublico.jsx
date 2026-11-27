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
  Plus,
  Search,
  Send,
  Trash2,
  Upload,
  User,
  Wrench,
  X,
} from "lucide-react";
import { api } from "../api/client.js";
import FooterLegal from "../components/FooterLegal.jsx";

const OPCIONES_RECINTOS = [
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
  "Otro",
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
      <FooterLegal
        subtitle="Plan Social · Entidad Patrocinante Habitacional"
        className="mt-12 py-6"
      />
    </div>
  );
}

/* =========================================================================
   FORMULARIO DE INGRESO DINÁMICO POR RECINTO
   Cada recinto tiene su propio tipo, observación y foto
   ========================================================================= */
function FormularioPublico({ onIrAConsulta }) {
  const [rut, setRut] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [comite, setComite] = useState("");
  const [vivienda, setVivienda] = useState("");
  const [esUrgente, setEsUrgente] = useState(false);

  // Lista dinámica de recintos afectados
  const [recintosItems, setRecintosItems] = useState([
    {
      id: "item-1",
      recinto: "Baño",
      otroRecinto: "",
      observaciones: "",
      foto: null,
      fotoPreview: null,
    },
  ]);

  const [enviando, setEnviando] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState("");
  const [ticketCreado, setTicketCreado] = useState(null);

  // Agregar nuevo recinto
  const agregarRecinto = () => {
    // Sugerir un recinto que aún no esté en la lista si es posible
    const usados = recintosItems.map((r) => r.recinto);
    const siguienteSugerido =
      OPCIONES_RECINTOS.find((op) => op !== "Otro" && !usados.includes(op)) ||
      "Cocina";

    setRecintosItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        recinto: siguienteSugerido,
        otroRecinto: "",
        observaciones: "",
        foto: null,
        fotoPreview: null,
      },
    ]);
  };

  // Eliminar recinto
  const eliminarRecinto = (id) => {
    if (recintosItems.length <= 1) return;
    const itemABorrar = recintosItems.find((r) => r.id === id);
    if (itemABorrar?.fotoPreview) {
      URL.revokeObjectURL(itemABorrar.fotoPreview);
    }
    setRecintosItems((prev) => prev.filter((r) => r.id !== id));
  };

  // Modificar campo de un recinto
  const actualizarRecinto = (id, campo, valor) => {
    setRecintosItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [campo]: valor } : item))
    );
  };

  // Manejar cambio de foto en un recinto
  const handleFotoRecinto = (id, file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Por favor seleccione un archivo de imagen válido (JPG, PNG, WEBP).");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setRecintosItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          if (item.fotoPreview) URL.revokeObjectURL(item.fotoPreview);
          return { ...item, foto: file, fotoPreview: previewUrl };
        }
        return item;
      })
    );
    setErrorValidacion("");
  };

  // Quitar foto de un recinto
  const quitarFotoRecinto = (id) => {
    setRecintosItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          if (item.fotoPreview) URL.revokeObjectURL(item.fotoPreview);
          return { ...item, foto: null, fotoPreview: null };
        }
        return item;
      })
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorValidacion("");

    // 1. Validaciones generales
    const rutLimpio = rut.trim();
    if (!rutLimpio) {
      setErrorValidacion("El RUT del beneficiario es obligatorio.");
      return;
    }
    if (!nombre.trim()) {
      setErrorValidacion("Por favor ingrese su Nombre Completo.");
      return;
    }
    if (!telefono.trim()) {
      setErrorValidacion("Por favor ingrese su Teléfono de Contacto.");
      return;
    }

    // 2. Validación de cada recinto
    if (recintosItems.length === 0) {
      setErrorValidacion("Debe registrar al menos un recinto afectado.");
      return;
    }

    for (let i = 0; i < recintosItems.length; i++) {
      const it = recintosItems[i];
      const nombreRecinto =
        it.recinto === "Otro" ? it.otroRecinto.trim() : it.recinto;

      if (!nombreRecinto) {
        setErrorValidacion(`Por favor indique el nombre del Recinto #${i + 1}.`);
        return;
      }
      if (!it.observaciones.trim()) {
        setErrorValidacion(
          `Por favor escriba las observaciones o descripción de la falla para el Recinto #${i + 1} (${nombreRecinto}).`
        );
        return;
      }
      if (!it.foto) {
        setErrorValidacion(
          `Es obligatorio adjuntar la fotografía del lugar afectado para el Recinto #${i + 1} (${nombreRecinto}).`
        );
        return;
      }
    }

    setEnviando(true);
    try {
      const formData = new FormData();
      formData.append("rut", rutLimpio);
      formData.append("nombre", nombre.trim());
      formData.append("telefono", telefono.trim());
      formData.append("email", email.trim());
      formData.append("comite_nombre", comite.trim());
      formData.append("vivienda_direccion", vivienda.trim());
      formData.append("urgencia", esUrgente ? "urgente" : "normal");

      // Construir payload de items estructurados
      const itemsPayload = recintosItems.map((it, idx) => ({
        recinto: it.recinto === "Otro" ? it.otroRecinto.trim() : it.recinto,
        observaciones: it.observaciones.trim(),
        foto_key: `item_foto_${idx}`,
      }));

      formData.append("items", JSON.stringify(itemsPayload));

      // Adjuntar cada archivo de foto con su clave respectiva
      recintosItems.forEach((it, idx) => {
        if (it.foto) {
          formData.append(`item_foto_${idx}`, it.foto);
        }
      });

      const res = await api.post("/postventa/tickets/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000,
      });

      setTicketCreado(res.data);
    } catch (err) {
      console.error("Error al ingresar solicitud:", err);
      const msg =
        err.response?.data?.detail ||
        "Ocurrió un error al registrar la solicitud. Intente nuevamente.";
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
            Estimado(a) {ticketCreado.nombre}, su solicitud ha sido ingresada al sistema.
          </h3>
          <p className="mt-1 text-xs text-slate-700 leading-relaxed">
            Hemos recibido el registro de {ticketCreado.items?.length || 1} recinto(s) con sus respectivas observaciones y fotografías de respaldo.
          </p>
        </div>

        {/* Resumen del Ticket Creado */}
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
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 mb-2">
              Recintos Registrados ({ticketCreado.items?.length || 1})
            </p>
            <div className="space-y-2">
              {ticketCreado.items && ticketCreado.items.length > 0 ? (
                ticketCreado.items.map((it, idx) => (
                  <div
                    key={it.id || idx}
                    className="flex items-center gap-3 rounded-md border border-slate-200 bg-white p-2.5 text-xs"
                  >
                    {it.foto && (
                      <img
                        src={it.foto}
                        alt={it.recinto}
                        className="h-12 w-12 rounded object-cover border border-slate-200 shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-slate-900 block">
                        {it.recinto}
                      </span>
                      <p className="text-slate-600 line-clamp-1 text-[11px]">
                        {it.observaciones}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded bg-white p-2 text-xs text-slate-700 border border-slate-200">
                  {ticketCreado.recinto || "Recinto registrado"}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-md bg-indigo-50/80 border border-indigo-200/70 p-3 text-xs text-indigo-950 flex items-start gap-2.5">
            <Info size={16} className="text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">¡Consulte el avance solo con su RUT!</p>
              <p className="text-indigo-800 text-[11px] mt-0.5 leading-normal">
                No necesita memorizar ningún código. Puede consultar las visitas o resoluciones técnicas ingresando su RUT en la pestaña <strong>"Consultar Estado por RUT"</strong>.
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
              setEmail("");
              setRecintosItems([
                {
                  id: "item-1",
                  recinto: "Baño",
                  otroRecinto: "",
                  observaciones: "",
                  foto: null,
                  fotoPreview: null,
                },
              ]);
            }}
            className="rounded-md border border-slate-200 bg-white py-2 px-3 text-center text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            Ingresar otra solicitud
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="border-b border-slate-100 pb-2.5">
        <h3 className="text-sm font-semibold tracking-tight text-slate-900">
          Formulario Oficial de Solicitud de Postventa
        </h3>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Ingrese los datos del beneficiario y agregue cada recinto afectado con su observación y fotografía.
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
          <label className="block text-[11px] font-semibold text-slate-700">
            Correo Electrónico (Opcional)
          </label>
          <input
            type="email"
            placeholder="ejemplo@correo.cl"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none transition-all"
          />
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Para recibir copia y avisos de resolución.
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
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

        <div>
          <label className="block text-[11px] font-medium text-slate-600">
            Dirección de la Vivienda
          </label>
          <input
            type="text"
            placeholder="Ej: Pasaje Los Aromos 123 (o sector / lote)"
            value={vivienda}
            onChange={(e) => setVivienda(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* SECCIÓN DINÁMICA: RECINTOS AFECTADOS */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-800">
              Recintos Afectados en la Vivienda ({recintosItems.length})
            </h4>
            <p className="text-[11px] text-slate-500">
              Cada recinto debe llevar su observación específica y su fotografía de respaldo.
            </p>
          </div>
          <span className="text-[11px] font-medium text-slate-500">
            {recintosItems.length === 1 ? "1 recinto" : `${recintosItems.length} recintos`}
          </span>
        </div>

        {/* Tarjetas de Cada Recinto */}
        <div className="space-y-3.5">
          {recintosItems.map((item, index) => (
            <div
              key={item.id}
              className="rounded-lg border border-slate-200/90 bg-slate-50/40 p-3.5 space-y-3 transition-all"
            >
              {/* Encabezado del Recinto */}
              <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] font-semibold text-white">
                    {index + 1}
                  </span>
                  Recinto Afectado #{index + 1}
                </span>

                {recintosItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => eliminarRecinto(item.id)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600 hover:text-rose-800 transition"
                    title="Eliminar este recinto"
                  >
                    <Trash2 size={13} />
                    <span>Eliminar</span>
                  </button>
                )}
              </div>

              {/* Selector de Recinto */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700">
                    Tipo de Recinto <span className="text-rose-600 font-bold">*</span>
                  </label>
                  <select
                    value={item.recinto}
                    onChange={(e) => actualizarRecinto(item.id, "recinto", e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[13px] text-slate-900 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none"
                  >
                    {OPCIONES_RECINTOS.map((op) => (
                      <option key={op} value={op}>
                        {op}
                      </option>
                    ))}
                  </select>
                </div>

                {item.recinto === "Otro" && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700">
                      Especifique el Recinto <span className="text-rose-600 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Logia, Bodega exterior, Pasillo"
                      value={item.otroRecinto}
                      onChange={(e) =>
                        actualizarRecinto(item.id, "otroRecinto", e.target.value)
                      }
                      className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Observación / Falla de este recinto */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700">
                  Observaciones o Falla en este Recinto <span className="text-rose-600 font-bold">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder={`Describa qué problema presenta ${
                    item.recinto === "Otro" ? item.otroRecinto || "este recinto" : item.recinto
                  } (ej: filtración de agua, fisura en muro, desprendimiento de sellos, etc.)...`}
                  value={item.observaciones}
                  onChange={(e) =>
                    actualizarRecinto(item.id, "observaciones", e.target.value)
                  }
                  className="mt-1 w-full rounded-md border border-slate-200 bg-white p-2.5 text-[12px] text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Fotografía específica de este recinto */}
              <div className="rounded-md border border-slate-200 bg-white p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-800 flex items-center gap-1.5">
                    <Camera size={13} className="text-slate-600" />
                    <span>Fotografía de {item.recinto === "Otro" ? item.otroRecinto || "este recinto" : item.recinto}</span>
                    <span className="text-rose-600 font-bold">* (Obligatoria)</span>
                  </label>
                  {item.foto && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <CheckCircle2 size={11} /> Foto adjuntada
                    </span>
                  )}
                </div>

                {!item.fotoPreview ? (
                  <label className="flex flex-col items-center justify-center rounded-md border-2 border-dashed border-slate-300 bg-slate-50/50 p-4 text-center cursor-pointer hover:bg-slate-50 hover:border-slate-400 transition">
                    <Upload size={20} className="text-slate-400 mb-1" />
                    <span className="text-xs font-semibold text-slate-700">
                      Subir foto de {item.recinto === "Otro" ? item.otroRecinto || "este recinto" : item.recinto}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      JPG, PNG, WEBP (hasta 15 MB)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFotoRecinto(item.id, e.target.files?.[0])}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="flex items-center justify-between gap-3 rounded border border-slate-200 bg-slate-50/40 p-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={item.fotoPreview}
                        alt="Vista previa"
                        className="h-14 w-14 object-cover rounded border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-800 truncate">
                          {item.foto.name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {(item.foto.size / (1024 * 1024)).toFixed(2)} MB · Lista
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => quitarFotoRecinto(item.id)}
                      className="inline-flex items-center gap-1 rounded border border-rose-200 bg-white px-2 py-1 text-[11px] text-rose-600 hover:bg-rose-50 transition"
                      title="Quitar foto"
                    >
                      <Trash2 size={12} />
                      <span>Quitar</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Botón para Agregar Otro Recinto */}
        <button
          type="button"
          onClick={agregarRecinto}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-white py-2.5 px-4 text-xs font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900 transition shadow-2xs"
        >
          <Plus size={15} className="text-emerald-600 stroke-[2.5]" />
          <span>+ Agregar otro recinto afectado (ej. Cocina, Techumbre, Dormitorio...)</span>
        </button>
      </div>

      {/* Marcar Urgencia */}
      <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-3 mt-4">
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
        {enviando ? "Registrando Solicitud..." : `Registrar Solicitud Oficial (${recintosItems.length} recinto${recintosItems.length > 1 ? "s" : ""})`}
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
                    {t.email && (
                      <span className="text-slate-500 block text-[10px] truncate">Correo: {t.email}</span>
                    )}
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

                {/* DETALLE ESTRUCTURADO POR RECINTOS (con sus observaciones y fotos) */}
                {t.items && t.items.length > 0 ? (
                  <div className="space-y-2">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block">
                      Recintos Afectados ({t.items.length}):
                    </span>
                    <div className="grid grid-cols-1 gap-2.5">
                      {t.items.map((it, idx) => (
                        <div
                          key={it.id || idx}
                          className="rounded-md border border-slate-200/80 bg-slate-50/70 p-3 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-800 text-[9px] font-semibold text-white">
                                {idx + 1}
                              </span>
                              {it.recinto}
                            </span>
                          </div>

                          <p className="text-[12px] text-slate-700 leading-relaxed">
                            {it.observaciones || "Sin observaciones específicas"}
                          </p>

                          {it.foto && (
                            <div className="pt-1">
                              <a
                                href={it.foto}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 rounded border border-slate-200 bg-white p-1 hover:bg-slate-50 transition"
                              >
                                <img
                                  src={it.foto}
                                  alt={it.recinto}
                                  className="h-14 w-14 object-cover rounded border border-slate-200 shrink-0"
                                />
                                <span className="text-[11px] font-medium text-slate-700 flex items-center gap-1">
                                  Ver foto de {it.recinto} <ExternalLink size={11} className="text-slate-400" />
                                </span>
                              </a>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  // Fallback para tickets anteriores
                  <div className="rounded-md border border-slate-100 bg-slate-50/70 p-3 space-y-2">
                    {t.recinto && (
                      <span className="text-[11px] font-semibold text-slate-800 block">
                        Recinto: {t.recinto}
                      </span>
                    )}
                    <p className="text-[12px] text-slate-800 leading-relaxed">
                      {t.descripcion}
                    </p>
                    {t.foto && (
                      <div className="pt-1">
                        <a
                          href={t.foto}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded border border-slate-200 bg-white p-1 hover:bg-slate-50 transition"
                        >
                          <img
                            src={t.foto}
                            alt="Foto adjunta"
                            className="h-14 w-14 object-cover rounded border border-slate-200 shrink-0"
                          />
                          <span className="text-[11px] font-medium text-slate-700 flex items-center gap-1">
                            Ver imagen completa <ExternalLink size={11} className="text-slate-400" />
                          </span>
                        </a>
                      </div>
                    )}
                  </div>
                )}

                <p className="text-[10px] text-slate-400">
                  Ingresado el {formatearFecha(t.creado_en)}
                </p>

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
