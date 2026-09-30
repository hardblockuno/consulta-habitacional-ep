import { Filter, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api, listFromResponse } from "../api/client.js";
import StatusBadge from "../components/StatusBadge.jsx";
import { EmptyState, ErrorState, LoadingState } from "../components/StateViews.jsx";

export default function Alertas() {
  const [query, setQuery] = useState("");
  const [severidad, setSeveridad] = useState("");
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    api
      .get("/alertas/", {
        params: { q: query || undefined, severidad: severidad || undefined },
        signal: controller.signal,
      })
      .then((response) => {
        setAlertas(listFromResponse(response.data));
        setError("");
      })
      .catch((err) => {
        if (err.name !== "CanceledError") setError("No fue posible cargar las alertas.");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [query, severidad]);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Plan Social · Monitoreo</p>
        <h1 className="text-lg font-semibold text-slate-900 tracking-tight">Alertas Normativas</h1>
      </div>

      <section className="rounded-lg border border-slate-200/80 bg-white p-3 shadow-2xs">
        <div className="grid gap-2.5 md:grid-cols-[1fr_200px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar alerta, persona, RUT o comité"
              className="h-9 w-full rounded-md border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none transition"
            />
          </label>
          <label className="relative block">
            <Filter className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <select
              value={severidad}
              onChange={(event) => setSeveridad(event.target.value)}
              className="h-9 w-full rounded-md border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-700 focus:border-slate-400 focus:outline-none transition"
            >
              <option value="">Todas las severidades</option>
              <option value="critica">Críticas</option>
              <option value="preventiva">Preventivas</option>
            </select>
          </label>
        </div>
      </section>

      {loading ? <LoadingState label="Cargando alertas" /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!loading && !error && alertas.length === 0 ? <EmptyState label="No hay alertas activas" /> : null}
      {!loading && !error && alertas.length > 0 ? (
        <section className="overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-2xs">
          <div className="divide-y divide-slate-100">
            {alertas.map((alerta) => (
              <div key={alerta.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge value={alerta.severidad} />
                    <span className="text-[11px] font-mono uppercase text-slate-400">{alerta.tipo_display}</span>
                  </div>
                  <h2 className="text-xs font-semibold text-slate-900">{alerta.titulo}</h2>
                  <p className="text-xs text-slate-600">{alerta.detalle}</p>
                  <p className="text-[11px] font-mono text-slate-400">
                    {alerta.persona_nombre} · {alerta.persona_rut} · {alerta.comite}
                  </p>
                </div>
                <Link
                  to={`/personas/${alerta.persona_id}`}
                  className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-2xs transition"
                >
                  Ver ficha
                </Link>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
