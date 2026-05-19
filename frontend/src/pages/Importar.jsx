import { CheckCircle2, Upload } from "lucide-react";
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

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase text-cyan-700">Carga de datos</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-950">Importar Excel</h1>
      </div>

      <Section title="Archivo Excel">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Comite</span>
              <input
                value={comiteNombre}
                onChange={(event) => setComiteNombre(event.target.value)}
                className="mt-1 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none ring-cyan-700 transition focus:border-cyan-700 focus:ring-2"
                placeholder="Nombre del comite"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Comuna</span>
              <input
                value={comuna}
                onChange={(event) => setComuna(event.target.value)}
                className="mt-1 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none ring-cyan-700 transition focus:border-cyan-700 focus:ring-2"
                placeholder="Comuna"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Ahorro referencia UF</span>
              <input
                value={ahorroMinimo}
                onChange={(event) => setAhorroMinimo(event.target.value)}
                type="number"
                min="0"
                step="0.01"
                className="mt-1 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none ring-cyan-700 transition focus:border-cyan-700 focus:ring-2"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Archivo</span>
              <input
                onChange={(event) => setArchivo(event.target.files?.[0] || null)}
                type="file"
                accept=".xlsx,.xls"
                className="mt-1 block h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-950 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white"
              />
            </label>
          </div>
          {error ? <ErrorState message={error} /> : null}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-cyan-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            <Upload size={18} />
            {loading ? "Importando" : "Importar"}
          </button>
        </form>
      </Section>

      {resultado ? (
        <Section title="Resultado">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-emerald-800">
            <CheckCircle2 size={18} />
            Importacion {resultado.estado}
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
