import {
  AlertCircle,
  Building2,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import { api } from "../api/client.js";
import Section from "../components/Section.jsx";
import { ErrorState } from "../components/StateViews.jsx";

export default function Importar({ onVerPadron }) {
  const [archivo, setArchivo] = useState(null);
  const [comiteNombre, setComiteNombre] = useState("");
  const [comuna, setComuna] = useState("");
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

    setLoading(true);
    setError("");
    setResultado(null);
    try {
      const response = await api.post("/importar/excel/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResultado(response.data);
      // Actualizar comités disponibles
      api.get("/comites/").then((res) => {
        const list = Array.isArray(res.data) ? res.data : res.data?.results || [];
        setComitesExistentes(list);
      }).catch(() => {});
    } catch (err) {
      setError(err.response?.data?.detail || "No se pudo importar la planilla Excel.");
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
      const response = await api.post("/importar/observaciones/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResultadoObservaciones(response.data);
    } catch (err) {
      setErrorObservaciones(
        err.response?.data?.detail || "No se pudieron cargar las observaciones."
      );
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

  return (
    <div className="space-y-6">
      {/* Carga principal de base de socios */}
      <Section title="Carga de Planilla de Socios (Excel)">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block">
                <span className="text-[11px] font-medium text-slate-700">Comité</span>
                <input
                  list="lista-comites"
                  value={comiteNombre}
                  onChange={(e) => setComiteNombre(e.target.value)}
                  placeholder="Seleccionar o escribir nombre de comité..."
                  className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none transition-all"
                />
                <datalist id="lista-comites">
                  {comitesExistentes.map((c) => (
                    <option key={c.id} value={c.nombre}>
                      {c.comuna ? `(${c.comuna})` : ""}
                    </option>
                  ))}
                </datalist>
              </label>
              <p className="mt-1 text-[11px] text-slate-400">
                Puedes seleccionar un comité existente o ingresar un nuevo nombre.
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
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
              <CheckCircle2 size={18} className="text-emerald-600" />
              Proceso finalizado ({resultado.estado})
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
