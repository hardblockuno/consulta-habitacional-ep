import {
  Building2,
  CheckCircle2,
  FileSpreadsheet,
  Upload,
  X,
  AlertCircle,
  ArrowRight,
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
    subtitulo: "Sin deuda hipotecaria · Vulnerabilidad hasta 40% RSH",
  },
  {
    id: "DS01",
    sigla: "DS01",
    nombre: "Sectores Medios (Tramos 1, 2 y 3)",
    subtitulo: "Ahorro previo y crédito complementario (RSH 60% a 90%)",
  },
  {
    id: "DS19",
    sigla: "DS19",
    nombre: "Integración Social y Territorial",
    subtitulo: "Conjuntos inmobiliarios mixtos con cupos vulnerables y medios",
  },
  {
    id: "DS27",
    sigla: "DS27",
    nombre: "Mejoramiento de Vivienda y Barrios",
    subtitulo: "Obras comunitarias, envolventes térmicas PDA y ampliaciones",
  },
  {
    id: "DS10",
    sigla: "DS10",
    nombre: "Habitabilidad Rural",
    subtitulo: "Viviendas en sectores rurales y localidades aisladas",
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
      setError("Por favor selecciona o arrastra una planilla Excel (.xlsx o .xls).");
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
    <div className="space-y-6 max-w-4xl">
      <Section title="Cargar Planilla de Socios">
        <p className="mb-5 text-xs text-slate-500">
          Sube la nómina en formato Excel (.xlsx o .xls). El sistema validará automáticamente los requisitos, RSH, ahorro y composición familiar según el decreto habitacional seleccionado.
        </p>

        <form onSubmit={onSubmit} className="space-y-5">
          {/* 1. Selector de Decreto Habitacional */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              1. Programa o Decreto Habitacional
            </label>
            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {DECRETOS.map((d) => {
                const isSelected = decreto === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDecreto(d.id)}
                    className={`flex flex-col text-left p-3 rounded-lg border transition-all ${
                      isSelected
                        ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/70"
                    }`}
                  >
                    <span className={`text-xs font-bold ${isSelected ? "text-white" : "text-slate-900"}`}>
                      {d.sigla}
                    </span>
                    <span className={`text-[10px] line-clamp-1 mt-0.5 ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                      {d.nombre}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 text-[11px] text-slate-500">
              {decretoActual.nombre} · {decretoActual.subtitulo}
            </p>
          </div>

          {/* 2. Datos del Comité y Comuna */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              2. Identificación del Comité
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block">
                  <span className="text-[11px] font-medium text-slate-600">Nombre del Comité</span>
                  <input
                    list="lista-comites"
                    value={comiteNombre}
                    onChange={(e) => handleSelectComiteInput(e.target.value)}
                    placeholder="Escribe o selecciona un comité..."
                    className="mt-1 h-9.5 w-full rounded-md border border-slate-200 bg-white px-3 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none transition-all shadow-2xs"
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
                  Si ya existe en el sistema, sus datos se sincronizarán automáticamente.
                </p>
              </div>

              <div>
                <label className="block">
                  <span className="text-[11px] font-medium text-slate-600">Comuna del Proyecto</span>
                  <input
                    value={comuna}
                    onChange={(e) => setComuna(e.target.value)}
                    placeholder="Ej: Temuco, Padre Las Casas, Villarrica..."
                    className="mt-1 h-9.5 w-full rounded-md border border-slate-200 bg-white px-3 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none transition-all shadow-2xs"
                  />
                </label>
                <p className="mt-1 text-[11px] text-slate-400">
                  Comuna donde se emplaza el comité habitacional (opcional).
                </p>
              </div>
            </div>
          </div>

          {/* 3. Archivo Excel */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              3. Archivo Excel
            </label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleFileDrop}
              className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-7 text-center transition-all ${
                isDragOver
                  ? "border-slate-900 bg-slate-50/80"
                  : archivo
                  ? "border-emerald-300 bg-emerald-50/40"
                  : "border-slate-200 hover:border-slate-300 bg-slate-50/30"
              }`}
            >
              {archivo ? (
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                    <FileSpreadsheet size={24} />
                  </span>
                  <div className="text-center sm:text-left">
                    <p className="text-sm font-semibold text-slate-900">{archivo.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {(archivo.size / 1024).toFixed(1)} KB · Archivo listo para importar
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setArchivo(null)}
                    className="sm:ml-4 inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-slate-500 hover:bg-slate-200/60 hover:text-slate-800 transition-colors"
                  >
                    <X size={14} /> Cambiar archivo
                  </button>
                </div>
              ) : (
                <div className="py-2">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 mb-2.5">
                    <Upload size={18} />
                  </div>
                  <p className="text-xs font-medium text-slate-800">
                    Arrastra aquí tu planilla Excel o <span className="text-indigo-600 underline cursor-pointer">examina tus archivos</span>
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Formatos compatibles: .xlsx o .xls (detección automática de columnas)
                  </p>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setArchivo(e.target.files[0]);
                        setError("");
                      }
                    }}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                </div>
              )}
            </div>
          </div>

          {error && <ErrorState message={error} />}

          {/* Botón de acción */}
          <div className="pt-2 flex items-center justify-end">
            <button
              type="submit"
              disabled={loading || !archivo}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              <Upload size={14} />
              {loading ? "Procesando planilla..." : "Cargar y procesar nómina"}
            </button>
          </div>
        </form>
      </Section>

      {/* Resumen de Carga (cuando finaliza) */}
      {resultado && (
        <Section title="Resumen de Importación">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-emerald-50/70 border border-emerald-100">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              <span>Nómina procesada con éxito</span>
              <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-800 border border-slate-200">
                {resultado.decreto || decreto}
              </span>
            </div>

            {comiteNombre && onVerPadron && (
              <button
                type="button"
                onClick={() => onVerPadron(comiteNombre)}
                className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 transition-colors shadow-2xs"
              >
                Ver padrón de socios <ArrowRight size={13} />
              </button>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <Metric label="Total Filas" value={resultado.total_filas} />
            <Metric label="Socios Incorporados" value={resultado.creados} color="emerald" />
            <Metric label="Actualizados" value={resultado.actualizados} />
            <Metric label="Filas Omitidas" value={resultado.omitidos} />
          </div>

          {resultado.errores?.length > 0 && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-950">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertCircle size={14} className="text-amber-600" />
                Filas con observaciones o datos incompletos:
              </p>
              <div className="mt-2 space-y-1 max-h-36 overflow-y-auto font-mono text-[11px]">
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
    </div>
  );
}

function Metric({ label, value, color }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/70">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-bold tracking-tight ${color === "emerald" ? "text-emerald-700" : "text-slate-900"}`}>
        {Number(value || 0).toLocaleString("es-CL")}
      </p>
    </div>
  );
}
