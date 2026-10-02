import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { api, listFromResponse, money, percent } from "../api/client.js";
import StatusBadge from "../components/StatusBadge.jsx";
import { EmptyState, ErrorState, LoadingState } from "../components/StateViews.jsx";
import { useDebounce } from "../hooks/useDebounce.js";

const PAGE_SIZE = 25;

export default function Personas() {
  const searchInputRef = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();

  // Estados locales para los inputs
  const [queryInput, setQueryInput] = useState("");
  const [comiteInput, setComiteInput] = useState(searchParams.get("comite") || "");
  const [estado, setEstado] = useState(searchParams.get("estado") || "");
  const [filtro, setFiltro] = useState(searchParams.get("filtro") || "");

  // Debouncing a 350ms para evitar spam de peticiones HTTP
  const debouncedQuery = useDebounce(queryInput, 350);
  const debouncedComite = useDebounce(comiteInput, 350);

  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagina, setPagina] = useState(1);

  // Petición con AbortController usando valores debounced
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setPagina(1);

    api
      .get(debouncedQuery ? "/personas/buscar/" : "/personas/", {
        params: {
          q: debouncedQuery || undefined,
          estado: estado || undefined,
          filtro: filtro || undefined,
          comite: debouncedComite || undefined,
        },
        signal: controller.signal,
      })
      .then((response) => {
        setPersonas(listFromResponse(response.data));
        setError("");
      })
      .catch((err) => {
        if (err.name !== "CanceledError") setError("No se pudo ejecutar la búsqueda.");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [debouncedQuery, estado, filtro, debouncedComite]);

  useEffect(() => {
    if (window.matchMedia("(min-width: 700px)").matches) {
      searchInputRef.current?.focus();
    }
  }, []);

  useEffect(() => {
    setComiteInput(searchParams.get("comite") || "");
    setEstado(searchParams.get("estado") || "");
    setFiltro(searchParams.get("filtro") || "");
  }, [searchParams]);

  // Actualizador de URL
  const updateUrlParam = (key, value) => {
    const p = new URLSearchParams(searchParams);
    if (value) p.set(key, value);
    else p.delete(key);
    setSearchParams(p);
  };

  // Paginación en cliente para limitar nodos DOM a < 250
  const totalPaginas = Math.ceil(personas.length / PAGE_SIZE) || 1;
  const personasPaginadas = useMemo(() => {
    const inicio = (pagina - 1) * PAGE_SIZE;
    return personas.slice(inicio, inicio + PAGE_SIZE);
  }, [personas, pagina]);

  return (
    <div className="space-y-4">
      {comiteInput && (
        <div className="flex items-center gap-2">
          <span className="rounded border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
            Comité: {comiteInput}
          </span>
          <button
            type="button"
            onClick={() => {
              setComiteInput("");
              updateUrlParam("comite", "");
            }}
            className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
          >
            Quitar filtro
          </button>
        </div>
      )}

      <section className="rounded-lg border border-slate-200/80 bg-white p-3.5 shadow-2xs">
        <div className="grid gap-2.5 md:grid-cols-[1fr_180px_200px_160px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              ref={searchInputRef}
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="RUT, nombre o comité"
              autoComplete="off"
              className="h-9 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none transition-all"
            />
          </label>
          <input
            type="text"
            value={comiteInput}
            onChange={(e) => {
              setComiteInput(e.target.value);
              updateUrlParam("comite", e.target.value);
            }}
            placeholder="Filtrar comité..."
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none transition-all"
          />
          <select
            value={estado}
            onChange={(e) => {
              setEstado(e.target.value);
              updateUrlParam("estado", e.target.value);
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
            onChange={(e) => {
              setFiltro(e.target.value);
              updateUrlParam("filtro", e.target.value);
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

      {loading ? <LoadingState label="Cargando personas..." /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!loading && !error && personas.length === 0 ? <EmptyState label="No hay personas para mostrar" /> : null}

      {!loading && !error && personas.length > 0 && (
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xs">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Persona</th>
                  <th className="px-4 py-3">Comité</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">RSH</th>
                  <th className="px-4 py-3 text-right">Ahorro</th>
                  <th className="px-4 py-3 text-right">Alertas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {personasPaginadas.map((persona) => (
                  <PersonRow key={persona.id} persona={persona} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Barra de paginación optimizada */}
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-600">
            <span>
              Mostrando <strong>{((pagina - 1) * PAGE_SIZE) + 1}</strong> a <strong>{Math.min(pagina * PAGE_SIZE, personas.length)}</strong> de <strong>{personas.length}</strong> socios
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={pagina <= 1}
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                className="inline-flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer shadow-2xs"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="px-2 font-medium tabular-nums">Página {pagina} de {totalPaginas}</span>
              <button
                type="button"
                disabled={pagina >= totalPaginas}
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                className="inline-flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer shadow-2xs"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

const PersonRow = memo(function PersonRow({ persona }) {
  return (
    <tr className="hover:bg-slate-50/70 transition-colors">
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
      <td className="px-4 py-3 text-right tabular-nums text-xs font-medium text-slate-700">
        {percent(persona.rsh_porcentaje)}
      </td>
      <td className="px-4 py-3 text-right tabular-nums text-xs font-medium text-slate-700">
        {money(persona.ahorro_monto)}
      </td>
      <td className="px-4 py-3 text-right tabular-nums text-xs font-semibold text-slate-900">
        {persona.alertas_activas}
      </td>
    </tr>
  );
});

const PersonFlags = memo(function PersonFlags({ persona }) {
  const flags = useMemo(() => {
    const list = [];
    if (persona.persona_mayor) flags.push({ label: "60+", title: "Persona mayor" });
    if (persona.discapacidad) flags.push({ label: "DIS", title: "Persona con discapacidad" });
    if (hasEtnia(persona)) flags.push({ label: "ETN", title: `Etnia o pueblo originario: ${persona.etnia}` });
    if (persona.postulacion_unipersonal) list.push({ label: "UNI", title: "Postulación unipersonal" });
    return list;
  }, [persona.persona_mayor, persona.discapacidad, persona.etnia, persona.postulacion_unipersonal]);

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
});

function hasEtnia(persona) {
  if (!persona.etnia) return false;
  const text = String(persona.etnia).trim().toLowerCase();
  return !["no", "n", "ninguna", "ninguno", "sin dato", "sindato", "no aplica", "no informado"].includes(text);
}
