import {
  AlertCircle,
  ArrowUpDown,
  CheckCircle2,
  Download,
  Filter,
  PiggyBank,
  Search,
  Upload,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { api, listFromResponse, money } from "../api/client.js";
import { ErrorState, LoadingState } from "../components/StateViews.jsx";

export default function ExtraerAhorro() {
  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ahorroMinimo, setAhorroMinimo] = useState(10);
  const [query, setQuery] = useState("");
  const [filtroCumplimiento, setFiltroCumplimiento] = useState("todos");

  // Carga de planilla de ahorro
  const [archivoAhorro, setArchivoAhorro] = useState(null);
  const [subiendoAhorro, setSubiendoAhorro] = useState(false);
  const [mensajeSubida, setMensajeSubida] = useState("");

  useEffect(() => {
    fetchPersonas();
  }, []);

  async function fetchPersonas() {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/personas/");
      setPersonas(listFromResponse(response.data));
    } catch {
      setError("No fue posible cargar el listado de personas para análisis de ahorro.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubirPlanillaAhorro(e) {
    e.preventDefault();
    if (!archivoAhorro) return;

    setSubiendoAhorro(true);
    setMensajeSubida("");
    try {
      const formData = new FormData();
      formData.append("archivo", archivoAhorro);
      const res = await api.post("/importar/observaciones/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMensajeSubida(
        `Planilla procesada con éxito: ${res.data?.filas_procesadas ?? "varias"} filas actualizadas.`
      );
      setArchivoAhorro(null);
      await fetchPersonas();
    } catch (err) {
      setMensajeSubida(
        err.response?.data?.detail || "Error al procesar la planilla de ahorro. Verifica el formato."
      );
    } finally {
      setSubiendoAhorro(false);
    }
  }

  // Métricas de ahorro calculadas en base a las personas y el ahorroMinimo seleccionado
  const metricas = useMemo(() => {
    let cumplen = 0;
    let pendientes = 0;
    let sinDato = 0;
    let totalAhorroUf = 0;

    personas.forEach((p) => {
      const ahorro = Number(p.ahorro_uf);
      if (isNaN(ahorro) || ahorro === 0 || p.ahorro_uf === null) {
        sinDato++;
      } else {
        totalAhorroUf += ahorro;
        if (ahorro >= ahorroMinimo) {
          cumplen++;
        } else {
          pendientes++;
        }
      }
    });

    return { cumplen, pendientes, sinDato, totalAhorroUf, total: personas.length };
  }, [personas, ahorroMinimo]);

  // Filtrado de la tabla
  const personasFiltradas = useMemo(() => {
    const q = query.trim().toLowerCase();
    return personas.filter((p) => {
      const ahorro = Number(p.ahorro_uf) || 0;
      const cumple = ahorro >= ahorroMinimo;
      const sinInfo = p.ahorro_uf === null || p.ahorro_uf === undefined || isNaN(Number(p.ahorro_uf));

      if (filtroCumplimiento === "cumple" && !cumple) return false;
      if (filtroCumplimiento === "pendiente" && (cumple || sinInfo)) return false;
      if (filtroCumplimiento === "sin_dato" && !sinInfo) return false;

      if (!q) return true;
      const matchRut = p.rut?.toLowerCase().includes(q);
      const matchNombre = p.nombre_completo?.toLowerCase().includes(q);
      const matchComite = p.comite_nombre?.toLowerCase().includes(q);
      return matchRut || matchNombre || matchComite;
    });
  }, [personas, ahorroMinimo, query, filtroCumplimiento]);

  if (loading) return <LoadingState label="Cargando datos de ahorro habitacional..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium tracking-wider uppercase text-slate-400">
              Área Social
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-[11px] font-medium text-slate-500">Ahorro para la vivienda</span>
          </div>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
            Ahorro Habitacional
          </h1>
        </div>

        {/* Selector de ahorro mínimo */}
        <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 shadow-2xs">
          <label htmlFor="ahorroMin" className="text-[11px] font-medium text-slate-500 whitespace-nowrap">
            Ahorro exigido:
          </label>
          <select
            id="ahorroMin"
            value={ahorroMinimo}
            onChange={(e) => setAhorroMinimo(Number(e.target.value))}
            className="bg-transparent text-xs font-medium text-slate-900 focus:outline-none cursor-pointer"
          >
            <option value={10}>10 UF (DS49 Tramo vulnerable)</option>
            <option value={15}>15 UF (DS49 Vulnerable con bonificación)</option>
            <option value={30}>30 UF (DS1 Tramo 1)</option>
            <option value={35}>35 UF (RSH {">"} 40%)</option>
            <option value={40}>40 UF (DS1 Tramo 2)</option>
            <option value={80}>80 UF (DS1 Tramo 3)</option>
          </select>
        </div>
      </div>

      {/* Tarjetas de métricas de ahorro */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-200/80 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Ahorro Acreditado</span>
            <Wallet size={14} className="text-slate-400" />
          </div>
          <p className="mt-1.5 text-lg font-semibold font-mono text-slate-900">
            {metricas.totalAhorroUf.toLocaleString("es-CL", { maximumFractionDigits: 1 })} UF
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">{metricas.total} socios registrados</p>
        </div>

        <div className="rounded-lg border border-slate-200/80 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Cumplen Mínimo</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
          </div>
          <p className="mt-1.5 text-lg font-semibold font-mono text-emerald-600">{metricas.cumplen}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">≥ {ahorroMinimo} UF requeridas</p>
        </div>

        <div className="rounded-lg border border-slate-200/80 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Insuficiente</span>
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
          </div>
          <p className="mt-1.5 text-lg font-semibold font-mono text-amber-600">{metricas.pendientes}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">Saldo menor a {ahorroMinimo} UF</p>
        </div>

        <div className="rounded-lg border border-slate-200/80 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Sin Saldo</span>
            <span className="h-1.5 w-1.5 rounded-full bg-slate-300"></span>
          </div>
          <p className="mt-1.5 text-lg font-semibold font-mono text-slate-900">{metricas.sinDato}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">Pendiente de cartola</p>
        </div>
      </div>

      {/* Sección para cargar cartolas o planillas de ahorro */}
      <div className="rounded-lg border border-slate-200/80 bg-white p-4 shadow-2xs">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
          <Upload size={15} className="text-slate-500" />
          <h2 className="text-xs font-semibold text-slate-900">
            Actualizar saldos de ahorro desde planilla Excel o cartola
          </h2>
        </div>
        <form onSubmit={handleSubirPlanillaAhorro} className="mt-3 flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setArchivoAhorro(e.target.files?.[0] || null)}
            className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-2.5 file:py-1.5 file:text-xs file:font-medium file:text-slate-700 hover:file:bg-slate-200 transition"
          />
          <button
            type="submit"
            disabled={!archivoAhorro || subiendoAhorro}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-white shadow-2xs hover:bg-slate-800 disabled:opacity-50 transition whitespace-nowrap"
          >
            {subiendoAhorro ? "Procesando..." : "Cruzar y actualizar ahorro"}
          </button>
        </form>
        {mensajeSubida && (
          <p className="mt-2.5 rounded-md bg-slate-50 p-2 text-xs text-slate-700 border border-slate-200">
            {mensajeSubida}
          </p>
        )}
      </div>

      {/* Buscador y Tabla de Socios con estado de ahorro */}
      <div className="rounded-lg border border-slate-200/80 bg-white shadow-2xs">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por RUT, nombre o comité..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 w-full rounded-md border border-slate-200 py-1.5 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none transition"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={13} className="text-slate-400" />
            <span className="text-xs text-slate-500">Filtrar:</span>
            <select
              value={filtroCumplimiento}
              onChange={(e) => setFiltroCumplimiento(e.target.value)}
              className="h-9 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 focus:border-slate-400 focus:outline-none transition"
            >
              <option value="todos">Todos ({personas.length})</option>
              <option value="cumple">Cumplen ({metricas.cumplen})</option>
              <option value="pendiente">Insuficiente ({metricas.pendientes})</option>
              <option value="sin_dato">Sin dato ({metricas.sinDato})</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold">RUT</th>
                <th className="px-4 py-3 font-semibold">Nombre Socio / Titular</th>
                <th className="px-4 py-3 font-semibold">Comité</th>
                <th className="px-4 py-3 font-semibold">Ahorro Registrado</th>
                <th className="px-4 py-3 font-semibold">Exigido</th>
                <th className="px-4 py-3 font-semibold">Brecha / Faltante</th>
                <th className="px-4 py-3 font-semibold">Estado de Ahorro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {personasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No se encontraron registros de ahorro con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                personasFiltradas.map((p) => {
                  const ahorro = Number(p.ahorro_uf) || 0;
                  const cumple = ahorro >= ahorroMinimo;
                  const sinDato = p.ahorro_uf === null || p.ahorro_uf === undefined;
                  const brecha = Math.max(0, ahorroMinimo - ahorro);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/75 transition">
                      <td className="px-4 py-3 font-mono font-medium text-slate-900">
                        <Link to={`/personas/${p.id}`} className="hover:text-slate-600 hover:underline">
                          {p.rut}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">{p.nombre_completo}</td>
                      <td className="px-4 py-3 text-slate-600">{p.comite_nombre || "Sin comité"}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {sinDato ? (
                          <span className="text-slate-400 italic">Sin informar</span>
                        ) : (
                          `${ahorro.toLocaleString("es-CL", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} UF`
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{ahorroMinimo} UF</td>
                      <td className="px-4 py-3 text-slate-700">
                        {sinDato ? (
                          <span className="text-slate-400">-</span>
                        ) : brecha === 0 ? (
                          <span className="text-emerald-600 font-semibold">Completo</span>
                        ) : (
                          <span className="text-amber-700">-{brecha.toFixed(1)} UF</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {sinDato ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 shadow-2xs">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                            Pendiente
                          </span>
                        ) : cumple ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 shadow-2xs">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Cumple ({ahorro.toFixed(1)} UF)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 shadow-2xs">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            Faltan {brecha.toFixed(1)} UF
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
