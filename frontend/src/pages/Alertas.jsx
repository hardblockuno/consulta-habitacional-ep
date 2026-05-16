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
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase text-cyan-700">Seguimiento</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-950">Alertas</h1>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar alerta, persona, RUT o comite"
              className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none ring-cyan-700 transition focus:border-cyan-700 focus:ring-2"
            />
          </label>
          <label className="relative block">
            <Filter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select
              value={severidad}
              onChange={(event) => setSeveridad(event.target.value)}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none ring-cyan-700 transition focus:border-cyan-700 focus:ring-2"
            >
              <option value="">Todas</option>
              <option value="critica">Criticas</option>
              <option value="preventiva">Preventivas</option>
            </select>
          </label>
        </div>
      </section>

      {loading ? <LoadingState label="Cargando alertas" /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!loading && !error && alertas.length === 0 ? <EmptyState label="No hay alertas activas" /> : null}
      {!loading && !error && alertas.length > 0 ? (
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="divide-y divide-slate-100">
            {alertas.map((alerta) => (
              <div key={alerta.id} className="grid gap-3 px-4 py-4 md:grid-cols-[1fr_auto]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge value={alerta.severidad} />
                    <span className="text-xs font-semibold uppercase text-slate-500">{alerta.tipo_display}</span>
                  </div>
                  <h2 className="mt-2 font-semibold text-slate-950">{alerta.titulo}</h2>
                  <p className="mt-1 text-sm text-slate-600">{alerta.detalle}</p>
                  <p className="mt-2 text-sm text-slate-500">
                    {alerta.persona_nombre} · {alerta.persona_rut} · {alerta.comite}
                  </p>
                </div>
                <Link
                  to={`/personas/${alerta.persona_id}`}
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
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
