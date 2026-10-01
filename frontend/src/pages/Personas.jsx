import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { api, listFromResponse, money, percent } from "../api/client.js";
import StatusBadge from "../components/StatusBadge.jsx";
import { EmptyState, ErrorState, LoadingState } from "../components/StateViews.jsx";

export default function Personas() {
  const searchInputRef = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [estado, setEstado] = useState(searchParams.get("estado") || "");
  const [filtro, setFiltro] = useState(searchParams.get("filtro") || "");
  const [comite, setComite] = useState(searchParams.get("comite") || "");
  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    api
      .get(query ? "/personas/buscar/" : "/personas/", {
        params: {
          q: query || undefined,
          estado: estado || undefined,
          filtro: filtro || undefined,
          comite: comite || undefined,
        },
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
  }, [query, estado, filtro, comite]);

  useEffect(() => {
    if (window.matchMedia("(min-width: 700px)").matches) {
      searchInputRef.current?.focus();
    }
  }, []);

  useEffect(() => {
    setFiltro(searchParams.get("filtro") || "");
    setEstado(searchParams.get("estado") || "");
    setComite(searchParams.get("comite") || "");
  }, [searchParams]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">SIGEP · Área Social</p>
          <h1 className="mt-0.5 text-lg font-semibold tracking-tight text-slate-900">
            {comite ? `Padrón de socios: ${comite}` : "Padrón de Familias y Postulantes"}
          </h1>
          {comite && (
            <div className="mt-1.5 flex items-center gap-2">
              <span className="rounded border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                Comité: {comite}
              </span>
              <button
                type="button"
                onClick={() => {
                  setComite("");
                  const p = new URLSearchParams(searchParams);
                  p.delete("comite");
                  setSearchParams(p);
                }}
                className="text-[11px] font-medium text-slate-500 hover:text-slate-800"
              >
                (Quitar filtro)
              </button>
              <Link
                to="/bases-datos?tab=comites"
                className="text-[11px] font-medium text-slate-500 hover:text-slate-800"
              >
                · Gestionar comités
              </Link>
            </div>
          )}
        </div>
      </div>

      <section className="rounded-lg border border-slate-200/80 bg-white p-3.5 shadow-2xs">
        <div className="grid gap-2.5 md:grid-cols-[1fr_180px_200px_160px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              ref={searchInputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="RUT, nombre o comité"
              autoComplete="off"
              className="h-9 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none transition-all"
            />
          </label>
          <input
            type="text"
            value={comite}
            onChange={(event) => {
              const val = event.target.value;
              setComite(val);
              const p = new URLSearchParams(searchParams);
              if (val) p.set("comite", val);
              else p.delete("comite");
              setSearchParams(p);
            }}
            placeholder="Filtrar comité..."
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none transition-all"
          />
          <select
            value={estado}
            onChange={(event) => {
              const val = event.target.value;
              setEstado(val);
              const p = new URLSearchParams(searchParams);
              if (val) p.set("estado", val);
              else p.delete("estado");
              setSearchParams(p);
            }}
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-[13px] text-slate-900 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none transition-all"
          >
            <option value="">Todos los estados</option>
            <option value="apta">Aptas</option>
            <option value="observada">Observadas</option>
            <option value="bloqueada">Bloqueadas</option>
          </select>
          <select
            value={filtro}
            onChange={(event) => {
              const value = event.target.value;
              setFiltro(value);
              const p = new URLSearchParams(searchParams);
              if (value) p.set("filtro", value);
              else p.delete("filtro");
              setSearchParams(p);
            }}
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-[13px] text-slate-900 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none transition-all"
          >
            <option value="">Todos los factores</option>
            <option value="cedulas_revision">Cédulas por vencer</option>
            <option value="adultos_mayores">Adultos mayores</option>
            <option value="discapacidad">Discapacidad</option>
            <option value="etnia">Pueblo originario</option>
            <option value="unipersonal">Unipersonal</option>
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
                  <th className="px-4 py-3">Comité</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">RSH</th>
                  <th className="px-4 py-3">Ahorro</th>
                  <th className="px-4 py-3">Alertas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {personas.map((persona) => (
                  <tr key={persona.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3">
                      <Link to={`/personas/${persona.id}`} className="font-medium text-slate-900 hover:underline">
                        {persona.nombre}
                      </Link>
                      <PersonFlags persona={persona} />
                      <div className="mt-1 font-mono text-[11px] text-slate-400">
                        {persona.rut} · {persona.telefono || "Sin teléfono"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <div className="font-medium text-slate-800">{persona.comite_nombre}</div>
                      <div className="text-[11px] text-slate-400">{persona.comite_comuna || "Sin comuna"}</div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge value={persona.estado_general} />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">{percent(persona.rsh_porcentaje)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">{money(persona.ahorro_monto)}</td>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-900">{persona.alertas_activas}</td>
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
  if (hasEtnia(persona)) flags.push({ label: "ETN", title: `Etnia o pueblo originario: ${persona.etnia}` });
  if (persona.postulacion_unipersonal) flags.push({ label: "UNI", title: "Postulación unipersonal" });
  if (!flags.length) return null;

  return (
    <div className="mt-1.5 flex flex-wrap gap-1">
      {flags.map((flag) => (
        <span
          key={flag.label}
          title={flag.title}
          className="inline-flex rounded border border-slate-200/70 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-600"
        >
          {flag.label}
        </span>
      ))}
    </div>
  );
}

function hasEtnia(persona) {
  const text = String(persona.etnia || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return Boolean(
    text &&
      ![
        "no",
        "n",
        "ninguna",
        "ninguno",
        "sin dato",
        "sindato",
        "no aplica",
        "noaplica",
        "no informado",
        "noinformado",
        "no informada",
        "noinformada",
      ].includes(text)
  );
}
