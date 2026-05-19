import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { api, listFromResponse, money, percent } from "../api/client.js";
import StatusBadge from "../components/StatusBadge.jsx";
import { EmptyState, ErrorState, LoadingState } from "../components/StateViews.jsx";

export default function Personas() {
  const searchInputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [estado, setEstado] = useState("");
  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    api
      .get(query ? "/personas/buscar/" : "/personas/", {
        params: { q: query || undefined, estado: estado || undefined },
        signal: controller.signal,
      })
      .then((response) => {
        setPersonas(listFromResponse(response.data));
        setError("");
      })
      .catch((err) => {
        if (err.name !== "CanceledError") setError("No se pudo ejecutar la busqueda.");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [query, estado]);

  useEffect(() => {
    if (window.matchMedia("(min-width: 700px)").matches) {
      searchInputRef.current?.focus();
    }
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase text-cyan-700">Consulta</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">Buscar persona</h1>
        </div>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              ref={searchInputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="RUT o nombre"
              autoComplete="off"
              className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none ring-cyan-700 transition focus:border-cyan-700 focus:ring-2"
            />
          </label>
          <select
            value={estado}
            onChange={(event) => setEstado(event.target.value)}
            className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none ring-cyan-700 transition focus:border-cyan-700 focus:ring-2"
          >
            <option value="">Todos los estados</option>
            <option value="apta">Aptas</option>
            <option value="observada">Observadas</option>
            <option value="bloqueada">Bloqueadas</option>
          </select>
        </div>
      </section>

      {loading ? <LoadingState label="Cargando personas" /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!loading && !error && personas.length === 0 ? <EmptyState label="No hay personas para mostrar" /> : null}
      {!loading && !error && personas.length > 0 ? (
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Persona</th>
                  <th className="px-4 py-3">Comite</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">RSH</th>
                  <th className="px-4 py-3">Ahorro</th>
                  <th className="px-4 py-3">Alertas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {personas.map((persona) => (
                  <tr key={persona.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link to={`/personas/${persona.id}`} className="font-semibold text-cyan-800 hover:text-cyan-950">
                        {persona.nombre}
                      </Link>
                      <PersonFlags persona={persona} />
                      <div className="mt-1 text-xs text-slate-500">
                        {persona.rut} - {persona.telefono || "Sin telefono"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <div>{persona.comite_nombre}</div>
                      <div className="text-xs text-slate-500">{persona.comite_comuna || "Sin comuna"}</div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge value={persona.estado_general} />
                    </td>
                    <td className="px-4 py-3 text-slate-700">{percent(persona.rsh_porcentaje)}</td>
                    <td className="px-4 py-3 text-slate-700">{money(persona.ahorro_monto)}</td>
                    <td className="px-4 py-3 font-semibold text-slate-950">{persona.alertas_activas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function PersonFlags({ persona }) {
  const flags = [];
  if (persona.persona_mayor) flags.push({ label: "60+", title: "Persona mayor" });
  if (persona.discapacidad) flags.push({ label: "DIS", title: "Persona con discapacidad" });
  if (!flags.length) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {flags.map((flag) => (
        <span
          key={flag.label}
          title={flag.title}
          className="inline-flex rounded-md bg-cyan-50 px-2 py-0.5 text-[11px] font-semibold text-cyan-900 ring-1 ring-cyan-100"
        >
          {flag.label}
        </span>
      ))}
    </div>
  );
}
