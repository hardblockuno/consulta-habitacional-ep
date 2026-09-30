import { CheckCircle2, FileText, Upload } from "lucide-react";
import { useState } from "react";

import { api } from "../api/client.js";
import Section from "../components/Section.jsx";
import { ErrorState } from "../components/StateViews.jsx";

export default function Importar() {
  const [archivo, setArchivo] = useState(null);
  const [comiteNombre, setComiteNombre] = useState("");
  const [comuna, setComuna] = useState("");
  const [ahorroMinimo, setAhorroMinimo] = useState("10");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState("");
  const [archivoObservaciones, setArchivoObservaciones] = useState(null);
  const [comiteObservaciones, setComiteObservaciones] = useState("");
  const [loadingObservaciones, setLoadingObservaciones] = useState(false);
  const [resultadoObservaciones, setResultadoObservaciones] = useState(null);
  const [errorObservaciones, setErrorObservaciones] = useState("");

  async function onSubmit(event) {
    event.preventDefault();
    if (!archivo) {
      setError("Selecciona un archivo Excel.");
      return;
    }
    const formData = new FormData();
    formData.append("archivo", archivo);
    formData.append("comite_nombre", comiteNombre);
    formData.append("comuna", comuna);
    formData.append("ahorro_minimo", ahorroMinimo);

    setLoading(true);
    setError("");
    setResultado(null);
    try {
      const response = await api.post("/importar/excel/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResultado(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || "No se pudo importar el archivo.");
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
      setErrorObservaciones(err.response?.data?.detail || "No se pudieron cargar las observaciones.");
    } finally {
      setLoadingObservaciones(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Carga de datos</p>
        <h1 className="mt-0.5 text-lg font-semibold tracking-tight text-slate-900">Cargar planilla Excel</h1>
      </div>

      <Section title="Padrón de socios (Excel)">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-3.5 md:grid-cols-2">
            <label className="block">
              <span className="text-[11px] font-medium text-slate-600">Comité</span>
              <input
                value={comiteNombre}
                onChange={(event) => setComiteNombre(event.target.value)}
                className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none transition-all"
                placeholder="Nombre del comité"
              />
            </label>
            <label className="block">
              <span className="text-[11px] font-medium text-slate-600">Comuna</span>
              <input
                value={comuna}
                onChange={(event) => setComuna(event.target.value)}
                className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none transition-all"
                placeholder="Comuna"
              />
            </label>
            <label className="block">
              <span className="text-[11px] font-medium text-slate-600">Ahorro referencia UF</span>
              <input
                value={ahorroMinimo}
                onChange={(event) => setAhorroMinimo(event.target.value)}
                type="number"
                min="0"
                step="0.01"
                className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none transition-all"
              />
            </label>
            <label className="block">
              <span className="text-[11px] font-medium text-slate-600">Archivo</span>
              <input
                onChange={(event) => setArchivo(event.target.files?.[0] || null)}
                type="file"
                accept=".xlsx,.xls"
                className="mt-1 block w-full text-xs text-slate-500 file:mr-3 file:rounded-md file:border file:border-slate-200 file:bg-slate-50 file:px-3 file:py-1 file:text-xs file:font-medium file:text-slate-700 hover:file:bg-slate-100 cursor-pointer"
              />
            </label>
          </div>
          {error ? <ErrorState message={error} /> : null}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-white shadow-2xs hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <Upload size={14} />
            {loading ? "Cargando..." : "Cargar base"}
          </button>
        </form>
      </Section>

      <Section title="Observaciones y correcciones">
        <form onSubmit={onSubmitObservaciones} className="space-y-4">
          <div className="grid gap-3.5 md:grid-cols-2">
            <label className="block">
              <span className="text-[11px] font-medium text-slate-600">Archivo Excel</span>
              <input
                onChange={(event) => setArchivoObservaciones(event.target.files?.[0] || null)}
                type="file"
                accept=".xlsx,.xls"
                className="mt-1 block w-full text-xs text-slate-500 file:mr-3 file:rounded-md file:border file:border-slate-200 file:bg-slate-50 file:px-3 file:py-1 file:text-xs file:font-medium file:text-slate-700 hover:file:bg-slate-100 cursor-pointer"
              />
            </label>
            <label className="block">
              <span className="text-[11px] font-medium text-slate-600">Comité</span>
              <input
                value={comiteObservaciones}
                onChange={(event) => setComiteObservaciones(event.target.value)}
                className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none transition-all"
                placeholder="Opcional"
              />
            </label>
          </div>
          {errorObservaciones ? <ErrorState message={errorObservaciones} /> : null}
          <button
            type="submit"
            disabled={loadingObservaciones}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <FileText size={14} />
            {loadingObservaciones ? "Procesando..." : "Cargar observaciones"}
          </button>
        </form>
      </Section>

      {resultado ? (
        <Section title="Resultado">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-emerald-800">
            <CheckCircle2 size={18} />
            Base {resultado.estado}
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <Metric label="Filas" value={resultado.total_filas} />
            <Metric label="Creados" value={resultado.creados} />
            <Metric label="Actualizados" value={resultado.actualizados} />
            <Metric label="Omitidos" value={resultado.omitidos} />
          </div>
          {resultado.errores?.length ? (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
              {resultado.errores.slice(0, 5).map((item) => (
                <p key={`${item.fila}-${item.error}`}>Fila {item.fila || "-"}: {item.error}</p>
              ))}
            </div>
          ) : null}
        </Section>
      ) : null}

      {resultadoObservaciones ? (
        <Section title="Resultado observaciones">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-emerald-800">
            <CheckCircle2 size={18} />
            Observaciones {resultadoObservaciones.estado}
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <Metric label="Filas" value={resultadoObservaciones.total_filas} />
            <Metric label="Creados" value={resultadoObservaciones.creados} />
            <Metric label="Actualizados" value={resultadoObservaciones.actualizados} />
            <Metric label="Omitidos" value={resultadoObservaciones.omitidos} />
          </div>
          {resultadoObservaciones.errores?.length ? (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
              {resultadoObservaciones.errores.slice(0, 5).map((item) => (
                <p key={`${item.fila}-${item.error}`}>Fila {item.fila || "-"}: {item.error}</p>
              ))}
            </div>
          ) : null}
        </Section>
      ) : null}
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-950">{Number(value || 0).toLocaleString("es-CL")}</p>
    </div>
  );
}
