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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-cyan-100 px-2 py-0.5 text-xs font-semibold text-cyan-800">
              ÁREA SOCIAL
            </span>
            <span className="text-xs font-medium text-slate-500">Ahorro para la vivienda</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Extraer y Gestionar Ahorro
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Control de cuentas de ahorro para la vivienda, validación de montos mínimos en UF y cruce de nóminas.
          </p>
        </div>

        {/* Selector de ahorro mínimo */}
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm">
          <label htmlFor="ahorroMin" className="text-xs font-semibold text-slate-700 whitespace-nowrap">
            Ahorro exigido (UF):
          </label>
          <select
            id="ahorroMin"
            value={ahorroMinimo}
            onChange={(e) => setAhorroMinimo(Number(e.target.value))}
            className="rounded-md border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-900 focus:border-cyan-600 focus:outline-none"
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">Ahorro Total Acreditado</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
              <Wallet size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-950">
            {metricas.totalAhorroUf.toLocaleString("es-CL", { maximumFractionDigits: 1 })} UF
          </p>
          <p className="mt-1 text-xs text-slate-500">Entre {metricas.total} socios registrados</p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-emerald-800">Cumplen Ahorro Mínimo</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-950">{metricas.cumplen}</p>
          <p className="mt-1 text-xs text-emerald-700">≥ {ahorroMinimo} UF requeridas</p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-amber-800">Ahorro Insuficiente</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <AlertCircle size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-950">{metricas.pendientes}</p>
          <p className="mt-1 text-xs text-amber-700">Tienen saldo pero menor a {ahorroMinimo} UF</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">Sin Saldo Informado</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <PiggyBank size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{metricas.sinDato}</p>
          <p className="mt-1 text-xs text-slate-500">Pendiente de cartola o libreta</p>
        </div>
      </div>

      {/* Sección para cargar cartolas o planillas de ahorro */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Upload size={18} className="text-cyan-700" />
          <h2 className="text-sm font-semibold text-slate-900">
            Actualizar saldos de ahorro desde planilla Excel / Cartola
          </h2>
        </div>
        <form onSubmit={handleSubirPlanillaAhorro} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setArchivoAhorro(e.target.files?.[0] || null)}
            className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-cyan-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-cyan-700 hover:file:bg-cyan-100"
          />
          <button
            type="submit"
            disabled={!archivoAhorro || subiendoAhorro}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-cyan-800 disabled:opacity-50 transition whitespace-nowrap"
          >
            {subiendoAhorro ? "Procesando..." : "Cruzar y actualizar ahorro"}
          </button>
        </form>
        {mensajeSubida && (
          <p className="mt-3 rounded-lg bg-slate-50 p-2.5 text-xs text-slate-700 border border-slate-200">
            {mensajeSubida}
          </p>
        )}
      </div>

      {/* Buscador y Tabla de Socios con estado de ahorro */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por RUT, nombre o comité..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-300 py-1.5 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-cyan-600 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-500" />
            <span className="text-xs text-slate-500">Filtrar:</span>
            <select
              value={filtroCumplimiento}
              onChange={(e) => setFiltroCumplimiento(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 focus:border-cyan-600 focus:outline-none"
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
                        <Link to={`/personas/${p.id}`} className="hover:text-cyan-700 hover:underline">
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
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                            Pendiente acreditación
                          </span>
                        ) : cumple ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                            ✓ Cumple ({ahorro.toFixed(1)} UF)
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
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
