import {
  ArrowRight,
  CheckCircle2,
  FileSpreadsheet,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import { api } from "../api/client.js";
import { ErrorState } from "../components/StateViews.jsx";

const DECRETOS = [
  { id: "DS49", label: "DS49 · Fondo Solidario" },
  { id: "DS01", label: "DS01 · Sectores Medios" },
  { id: "DS19", label: "DS19 · Integración Social" },
  { id: "DS27", label: "DS27 · Mejoramiento" },
  { id: "DS10", label: "DS10 · Rural" },
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
      setError("Selecciona una planilla Excel (.xlsx o .xls).");
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
      api
        .get("/comites/")
        .then((res) => {
          const list = Array.isArray(res.data) ? res.data : res.data?.results || [];
          setComitesExistentes(list);
        })
        .catch(() => {});
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        (err.response?.data?.errores && err.response?.data?.errores[0]?.error) ||
        err.message ||
        "No se pudo importar la planilla.";
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
        setError("Solo se admiten archivos Excel (.xlsx o .xls).");
      }
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-2xs">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Decreto
              </label>
              <select
                value={decreto}
                onChange={(e) => setDecreto(e.target.value)}
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:border-slate-800 focus:outline-none cursor-pointer"
              >
                {DECRETOS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Comité
              </label>
              <input
                list="lista-comites"
                value={comiteNombre}
                onChange={(e) => handleSelectComiteInput(e.target.value)}
                placeholder="Nombre del comité"
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-none"
              />
              <datalist id="lista-comites">
                {comitesExistentes.map((c) => (
                  <option key={c.id} value={c.nombre}>
                    {c.decreto ? `[${c.decreto}] ` : ""}{c.comuna ? `(${c.comuna})` : ""}
                  </option>
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Comuna
              </label>
              <input
                value={comuna}
                onChange={(e) => setComuna(e.target.value)}
                placeholder="Comuna"
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-none"
              />
            </div>
          </div>

          {/* Zona Drag & Drop */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleFileDrop}
            className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-all ${
              isDragOver
                ? "border-slate-800 bg-slate-50"
                : archivo
                ? "border-emerald-300 bg-emerald-50/40"
                : "border-slate-200 hover:border-slate-300 bg-slate-50/20"
            }`}
          >
            {archivo ? (
              <div className="flex items-center gap-3">
                <FileSpreadsheet size={20} className="text-emerald-700 shrink-0" />
                <div className="text-left">
                  <p className="text-xs font-medium text-slate-900">{archivo.name}</p>
                  <p className="text-[11px] text-slate-400">
                    {(archivo.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setArchivo(null)}
                  className="ml-3 rounded p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div>
                <Upload size={18} className="mx-auto text-slate-400 mb-1.5" />
                <p className="text-xs text-slate-600">
                  Arrastra una planilla o <span className="font-medium text-slate-900 underline cursor-pointer">selecciona un archivo</span>
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">.xlsx o .xls</p>
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

          {error && <ErrorState message={error} />}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={loading || !archivo}
              className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed shadow-2xs"
            >
              <Upload size={13} />
              {loading ? "Importando..." : "Importar planilla"}
            </button>
          </div>
        </form>
      </div>

      {/* Resumen al terminar */}
      {resultado && (
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-800">
              <CheckCircle2 size={15} className="text-emerald-600" />
              Planilla procesada ({resultado.decreto || decreto})
            </div>
            {comiteNombre && onVerPadron && (
              <button
                type="button"
                onClick={() => onVerPadron(comiteNombre)}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-950 hover:underline cursor-pointer"
              >
                Ver padrón <ArrowRight size={13} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="Filas" value={resultado.total_filas} />
            <Metric label="Nuevos" value={resultado.creados} color="emerald" />
            <Metric label="Actualizados" value={resultado.actualizados} />
            <Metric label="Omitidos" value={resultado.omitidos} />
          </div>

          {resultado.errores?.length > 0 && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <p className="font-medium mb-1">Filas omitidas:</p>
              <div className="max-h-32 overflow-y-auto space-y-0.5 text-[11px] font-mono">
                {resultado.errores.slice(0, 10).map((item, idx) => (
                  <p key={idx}>Fila {item.fila || "-"}: {item.error}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, color }) {
  return (
    <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200/60">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-0.5 text-lg font-bold tracking-tight ${color === "emerald" ? "text-emerald-700" : "text-slate-900"}`}>
        {Number(value || 0).toLocaleString("es-CL")}
      </p>
    </div>
  );
}
