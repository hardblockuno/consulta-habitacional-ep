import {
  AlertCircle,
  Building2,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import { api } from "../api/client.js";
import Section from "../components/Section.jsx";
import { ErrorState } from "../components/StateViews.jsx";

const DECRETOS = [
  {
    id: "DS49",
    sigla: "DS49",
    nombre: "Fondo Solidario de Elección de Vivienda",
    subtitulo: "Sin deuda hipotecaria · Vulnerabilidad RSH ≤ 40% · Exige causal legal para unipersonales",
    ahorroSugerido: "10 a 15 UF",
    unipersonalDetalle: "Exige excepción estricta: Adulto Mayor (≥60), Discapacidad o Indígena (CONADI)",
    colorBadge: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  {
    id: "DS01",
    sigla: "DS01",
    nombre: "Sectores Medios (Tramos 1, 2 y 3)",
    subtitulo: "Ahorro previo + crédito complementario · RSH hasta 60%, 80% o 90% · Unipersonales admitidos",
    ahorroSugerido: "30 a 80 UF",
    unipersonalDetalle: "Admitidos por tramo (Tramo 1, 2 y 3) con acreditación de ahorro y crédito",
    colorBadge: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    id: "DS19",
    sigla: "DS19",
    nombre: "Integración Social y Territorial",
    subtitulo: "Conjuntos inmobiliarios mixtos con cupos para familias vulnerables y sectores medios",
    ahorroSugerido: "10 a 30 UF",
    unipersonalDetalle: "Admitidos según tipología de vivienda y cupo del proyecto",
    colorBadge: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    id: "DS27",
    sigla: "DS27",
    nombre: "Mejoramiento de Vivienda y Barrios",
    subtitulo: "Obras comunitarias, envolventes térmicas PDA, techumbres y ampliación · Propietarios actuales",
    ahorroSugerido: "1 a 5 UF",
    unipersonalDetalle: "Admitidos sin restricción familiar para propietarios o asignatarios residentes",
    colorBadge: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    id: "DS10",
    sigla: "DS10",
    nombre: "Habitabilidad Rural",
    subtitulo: "Construcción o mejora en zonas rurales y localidades aisladas · Terreno propio o cesión",
    ahorroSugerido: "10 UF",
    unipersonalDetalle: "Admitidos acreditando tenencia legal de terreno rural y arraigo territorial",
    colorBadge: "bg-teal-50 text-teal-700 border-teal-200",
  },
];

export default function Importar({ onVerPadron }) {
  const [archivo, setArchivo] = useState(null);
  const [comiteNombre, setComiteNombre] = useState("");
  const [comuna, setComuna] = useState("");
  const [decreto, setDecreto] = useState("DS49");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState("");

  const [archivoObservaciones, setArchivoObservaciones] = useState(null);
  const [comiteObservaciones, setComiteObservaciones] = useState("");
  const [loadingObservaciones, setLoadingObservaciones] = useState(false);
  const [resultadoObservaciones, setResultadoObservaciones] = useState(null);
  const [errorObservaciones, setErrorObservaciones] = useState("");

  const [comitesExistentes, setComitesExistentes] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    api
      .get("/comites/")
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : res.data?.results || [];
        setComitesExistentes(list);
      })
      .catch(() => {});
  }, []);

  function handleSelectComiteInput(nombre) {
    setComiteNombre(nombre);
    const encontrado = comitesExistentes.find(
      (c) => c.nombre?.toLowerCase().trim() === nombre?.toLowerCase().trim()
    );
    if (encontrado) {
      if (encontrado.comuna && !comuna) setComuna(encontrado.comuna);
      if (encontrado.decreto) setDecreto(encontrado.decreto);
    }
  }

  async function onSubmit(event) {
    event.preventDefault();
    if (!archivo) {
      setError("Selecciona o arrastra un archivo Excel (.xlsx o .xls).");
      return;
    }
    const formData = new FormData();
    formData.append("archivo", archivo);
    formData.append("comite_nombre", comiteNombre);
    formData.append("comuna", comuna);
    formData.append("decreto", decreto);

    setLoading(true);
    setError("");
    setResultado(null);
    try {
      const response = await api.post("/importar/excel/", formData);
      setResultado(response.data);
      // Actualizar comités disponibles
      api.get("/comites/").then((res) => {
        const list = Array.isArray(res.data) ? res.data : res.data?.results || [];
        setComitesExistentes(list);
      }).catch(() => {});
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        (err.response?.data?.errores && err.response?.data?.errores[0]?.error) ||
        err.message ||
        "No se pudo importar la planilla Excel.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function onSubmitObservaciones(event) {
    event.preventDefault();
    if (!archivoObservaciones) {
      setErrorObservaciones("Selecciona un archivo Excel con observaciones o correcciones.");
      return;
    }
    const formData = new FormData();
    formData.append("archivo", archivoObservaciones);
    formData.append("comite_nombre", comiteObservaciones);

    setLoadingObservaciones(true);
    setErrorObservaciones("");
    setResultadoObservaciones(null);
    try {
      const response = await api.post("/importar/observaciones/", formData);
      setResultadoObservaciones(response.data);
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        (err.response?.data?.errores && err.response?.data?.errores[0]?.error) ||
        err.message ||
        "No se pudieron cargar las observaciones.";
      setErrorObservaciones(msg);
    } finally {
      setLoadingObservaciones(false);
    }
  }

  function handleFileDrop(e) {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const f = files[0];
      if (f.name.endsWith(".xlsx") || f.name.endsWith(".xls")) {
        setArchivo(f);
        setError("");
      } else {
        setError("Solo se admiten archivos Excel con extensión .xlsx o .xls.");
      }
    }
  }

  const decretoActual = DECRETOS.find((d) => d.id === decreto) || DECRETOS[0];

  return (
    <div className="space-y-6">
      {/* Banner de Motor Híbrido Inteligente */}
      <div className="rounded-lg border border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-slate-50 to-emerald-50/60 p-4">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-600 text-white shadow-2xs">
              <Sparkles size={16} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-semibold text-slate-900">
                  Motor Híbrido Activo · Gemini AI + Validador SERVIU {decretoActual.sigla}
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-800">
                  <ShieldCheck size={11} />
                  Modo Cuota Cero
                </span>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${decretoActual.colorBadge}`}>
                  {decretoActual.sigla}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                {decretoActual.subtitulo}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5 pt-2 border-t border-indigo-100/60 text-[10px] text-slate-600">
          <span className="rounded bg-white px-2 py-0.5 border border-slate-200/80">RUT y Nombres</span>
          <span className="rounded bg-white px-2 py-0.5 border border-slate-200/80">Edad / Adulto Mayor</span>
          <span className="rounded bg-white px-2 py-0.5 border border-slate-200/80">Discapacidad (Socio e Hijos)</span>
          <span className="rounded bg-white px-2 py-0.5 border border-slate-200/80">Banco y N° Cta. Ahorro</span>
          <span className="rounded bg-white px-2 py-0.5 border border-slate-200/80">% RSH</span>
          <span className="rounded bg-white px-2 py-0.5 border border-slate-200/80">MINVU Conecta</span>
          <span className="rounded bg-white px-2 py-0.5 border border-slate-200/80">Pueblo Originario / Mapuche</span>
          <span className="rounded bg-white px-2 py-0.5 border border-indigo-200 text-indigo-700 font-medium">
            Regla Unipersonales: {decretoActual.unipersonalDetalle}
          </span>
        </div>
      </div>

      {/* Carga principal de base de socios */}
      <Section title="Carga de Planilla de Socios (Excel)">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block">
                <span className="text-[11px] font-medium text-slate-700">Decreto Habitacional MINVU</span>
                <select
                  value={decreto}
                  onChange={(e) => setDecreto(e.target.value)}
                  className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-900 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none transition-all cursor-pointer"
                >
                  {DECRETOS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.sigla} · {d.nombre}
                    </option>
                  ))}
                </select>
              </label>
              <p className="mt-1 text-[11px] text-slate-400">
                Aplica la reglamentación y reglas de negocio del decreto.
              </p>
            </div>

            <div>
              <label className="block">
                <span className="text-[11px] font-medium text-slate-700">Comité</span>
                <input
                  list="lista-comites"
                  value={comiteNombre}
                  onChange={(e) => handleSelectComiteInput(e.target.value)}
                  placeholder="Seleccionar o escribir nombre de comité..."
                  className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none transition-all"
                />
                <datalist id="lista-comites">
                  {comitesExistentes.map((c) => (
                    <option key={c.id} value={c.nombre}>
                      {c.decreto ? `[${c.decreto}] ` : ""}{c.comuna ? `(${c.comuna})` : ""}
                    </option>
                  ))}
                </datalist>
              </label>
              <p className="mt-1 text-[11px] text-slate-400">
                Puedes seleccionar un comité existente o ingresar uno nuevo.
              </p>
            </div>

            <div>
              <label className="block">
                <span className="text-[11px] font-medium text-slate-700">Comuna</span>
                <input
                  value={comuna}
                  onChange={(e) => setComuna(e.target.value)}
                  placeholder="Ej: Temuco, Padre Las Casas, Villarrica..."
                  className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none transition-all"
                />
              </label>
              <p className="mt-1 text-[11px] text-slate-400">
                Comuna territorial del proyecto habitacional (opcional).
              </p>
            </div>
          </div>

          {/* Zona Drag & Drop para Excel */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleFileDrop}
            className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-all ${
              isDragOver
                ? "border-slate-800 bg-slate-50/80"
                : archivo
                ? "border-emerald-300 bg-emerald-50/30"
                : "border-slate-200 hover:border-slate-300 bg-slate-50/40"
            }`}
          >
            {archivo ? (
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                  <FileSpreadsheet size={22} />
                </span>
                <div className="text-left">
                  <p className="text-xs font-semibold text-slate-900">{archivo.name}</p>
                  <p className="text-[11px] text-slate-500">
                    {(archivo.size / 1024).toFixed(1)} KB · Planilla lista para procesar
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setArchivo(null)}
                  className="ml-3 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X size={15} />
                </button>
              </div>
            ) : (
              <div>
                <Upload className="mx-auto text-slate-400" size={24} />
                <p className="mt-2 text-xs font-medium text-slate-700">
                  Arrastra aquí tu planilla Excel o haz clic para examinar
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Formatos compatibles: .xlsx o .xls
                </p>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setArchivo(e.target.files[0]);
                  }}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
              </div>
            )}
          </div>

          {error && <ErrorState message={error} />}

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-400">
              * Detección automática de columnas (RUT, Nombre, RSH, Ahorro, Cargas familiares).
            </span>

            <button
              type="submit"
              disabled={loading || !archivo}
              className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-4 py-2 text-xs font-medium text-white shadow-2xs hover:bg-slate-800 transition-colors disabled:opacity-40"
            >
              <Upload size={14} />
              {loading ? "Procesando planilla..." : "Cargar y procesar planilla"}
            </button>
          </div>
        </form>
      </Section>

      {/* Resultado de la importación */}
      {resultado && (
        <Section title="Resumen de Carga">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
              <CheckCircle2 size={18} className="text-emerald-600" />
              Proceso finalizado ({resultado.estado})
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${decretoActual.colorBadge}`}>
                Decreto {resultado.decreto || decreto}
              </span>
            </div>
            {comiteNombre && onVerPadron && (
              <button
                type="button"
                onClick={() => onVerPadron(comiteNombre)}
                className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100 transition-colors"
              >
                Ver padrón de este comité &rarr;
              </button>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <Metric label="Total Filas" value={resultado.total_filas} />
            <Metric label="Socios Creados" value={resultado.creados} />
            <Metric label="Actualizados" value={resultado.actualizados} />
            <Metric label="Omitidos / Errores" value={resultado.omitidos} />
          </div>

          {resultado.errores?.length > 0 && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-950">
              <p className="font-semibold">Detalle de filas con advertencias:</p>
              <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                {resultado.errores.slice(0, 10).map((item, idx) => (
                  <p key={idx}>
                    Fila {item.fila || "-"}: {item.error}
                  </p>
                ))}
              </div>
            </div>
          )}
        </Section>
      )}

      {/* Módulo secundario: Observaciones y correcciones */}
      <Section title="Cargar Observaciones / Correcciones (Excel)">
        <p className="mb-3 text-xs text-slate-500">
          Permite actualizar observaciones sociales o correcciones masivas asociadas por RUT a socios existentes.
        </p>

        <form onSubmit={onSubmitObservaciones} className="space-y-4">
          <div className="grid gap-3.5 md:grid-cols-2">
            <label className="block">
              <span className="text-[11px] font-medium text-slate-700">Archivo Excel</span>
              <input
                onChange={(e) => setArchivoObservaciones(e.target.files?.[0] || null)}
                type="file"
                accept=".xlsx,.xls"
                className="mt-1 block w-full text-xs text-slate-500 file:mr-3 file:rounded-md file:border file:border-slate-200 file:bg-slate-50 file:px-3 file:py-1 file:text-xs file:font-medium file:text-slate-700 hover:file:bg-slate-100 cursor-pointer"
              />
            </label>
            <label className="block">
              <span className="text-[11px] font-medium text-slate-700">Comité (Opcional)</span>
              <input
                list="lista-comites"
                value={comiteObservaciones}
                onChange={(e) => setComiteObservaciones(e.target.value)}
                className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none transition-all"
                placeholder="Filtrar por comité si aplica"
              />
            </label>
          </div>

          {errorObservaciones && <ErrorState message={errorObservaciones} />}

          <button
            type="submit"
            disabled={loadingObservaciones || !archivoObservaciones}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors disabled:opacity-40"
          >
            <FileText size={14} />
            {loadingObservaciones ? "Procesando observaciones..." : "Cargar observaciones"}
          </button>
        </form>
      </Section>

      {resultadoObservaciones && (
        <Section title="Resultado de Observaciones">
          <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-emerald-800">
            <CheckCircle2 size={18} className="text-emerald-600" />
            Observaciones {resultadoObservaciones.estado}
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <Metric label="Total Filas" value={resultadoObservaciones.total_filas} />
            <Metric label="Actualizados" value={resultadoObservaciones.actualizados} />
            <Metric label="Omitidos" value={resultadoObservaciones.omitidos} />
          </div>
        </Section>
      )}
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
      <p className="text-[11px] font-medium uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold tracking-tight text-slate-900">
        {Number(value || 0).toLocaleString("es-CL")}
      </p>
    </div>
  );
}
