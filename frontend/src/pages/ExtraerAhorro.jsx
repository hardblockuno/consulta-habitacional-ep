import {
  AlertCircle,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  Download,
  FileSpreadsheet,
  Filter,
  PiggyBank,
  RefreshCw,
  Search,
  Upload,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { api, money } from "../api/client.js";
import { EmptyState, ErrorState, LoadingState } from "../components/StateViews.jsx";
import { useDebounce } from "../hooks/useDebounce.js";

export default function ExtraerAhorro() {
  const [searchParams, setSearchParams] = useSearchParams();
  const comiteParam = searchParams.get("comite") || "";

  // Listado de comités disponibles
  const [comites, setComites] = useState([]);
  const [comiteSeleccionado, setComiteSeleccionado] = useState(comiteParam);
  const [loadingComites, setLoadingComites] = useState(true);

  // Datos de la nómina de ahorro del comité
  const [nominaData, setNominaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filtros de búsqueda
  const [queryInput, setQueryInput] = useState("");
  const debouncedQuery = useDebounce(queryInput, 300);
  const [bancoFiltro, setBancoFiltro] = useState("todos");
  const [estadoFiltro, setEstadoFiltro] = useState("todos");

  // Feedback de copiado
  const [cuentaCopiadaId, setCuentaCopiadaId] = useState(null);
  const [nominaCopiada, setNominaCopiada] = useState(false);

  // Carga de planilla / cartola de ahorro
  const [mostrarSubida, setMostrarSubida] = useState(false);
  const [archivoAhorro, setArchivoAhorro] = useState(null);
  const [subiendoAhorro, setSubiendoAhorro] = useState(false);
  const [mensajeSubida, setMensajeSubida] = useState("");

  // 1. Cargar comités existentes
  useEffect(() => {
    async function loadComites() {
      setLoadingComites(true);
      try {
        const resp = await api.get("/comites/");
        const list = Array.isArray(resp.data) ? resp.data : resp.data?.results || [];
        setComites(list);

        // Si no hay comité en el URL, preseleccionar el primero si existe
        if (!comiteParam && list.length > 0) {
          setComiteSeleccionado(list[0].nombre);
          const p = new URLSearchParams(searchParams);
          p.set("comite", list[0].nombre);
          setSearchParams(p);
        }
      } catch (e) {
        console.error("Error al cargar comités:", e);
      } finally {
        setLoadingComites(false);
      }
    }
    loadComites();
  }, []);

  // 2. Sincronizar parámetro de URL si cambia
  useEffect(() => {
    const currentParam = searchParams.get("comite") || "";
    if (currentParam && currentParam !== comiteSeleccionado) {
      setComiteSeleccionado(currentParam);
    }
  }, [searchParams]);

  // 3. Cargar nómina de ahorro para el comité seleccionado
  useEffect(() => {
    if (!comiteSeleccionado && comites.length > 0) return;

    const controller = new AbortController();
    fetchNomina(controller.signal);

    return () => controller.abort();
  }, [comiteSeleccionado, debouncedQuery, bancoFiltro, estadoFiltro]);

  async function fetchNomina(signal) {
    setLoading(true);
    setError("");
    try {
      const resp = await api.get("/ahorro/nomina/", {
        params: {
          comite: comiteSeleccionado || undefined,
          q: debouncedQuery || undefined,
          banco: bancoFiltro !== "todos" ? bancoFiltro : undefined,
          estado: estadoFiltro !== "todos" ? estadoFiltro : undefined,
        },
        signal,
      });
      setNominaData(resp.data);
    } catch (err) {
      if (err.name !== "CanceledError") {
        setError(err.userFriendlyMessage || "No fue posible cargar la nómina de ahorro.");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleSelectComite(nombre) {
    setComiteSeleccionado(nombre);
    setQueryInput("");
    setBancoFiltro("todos");
    setEstadoFiltro("todos");

    const p = new URLSearchParams(searchParams);
    if (nombre && nombre !== "todos") {
      p.set("comite", nombre);
    } else {
      p.delete("comite");
    }
    setSearchParams(p);
  }

  // Copiar número de cuenta al portapapeles
  function handleCopiarCuenta(id, numeroCuenta) {
    if (!numeroCuenta) return;
    navigator.clipboard.writeText(numeroCuenta);
    setCuentaCopiadaId(id);
    setTimeout(() => setCuentaCopiadaId(null), 2000);
  }

  // Copiar nómina completa tabulada para Excel
  function handleCopiarNominaCompleta() {
    if (!nominaData?.socios?.length) return;
    const header = "RUT\tNOMBRE\tN_CUENTA\tBANCO\tMONTO_UF\n";
    const rows = nominaData.socios
      .map(
        (s) =>
          `${s.rut}\t${s.nombre}\t${s.numero_cuenta || "SIN DATO"}\t${s.banco || "SIN DATO"}\t${
            s.monto_actual || "0"
          }`
      )
      .join("\n");

    navigator.clipboard.writeText(header + rows);
    setNominaCopiada(true);
    setTimeout(() => setNominaCopiada(false), 2500);
  }

  // Descargar CSV con las 4 columnas clave
  function handleDescargarCSV() {
    if (!nominaData?.socios?.length) return;
    const header = ["RUT", "NOMBRE COMPLETO", "NRO CUENTA AHORRO", "BANCO", "SALDO UF", "COMITE"];
    const rows = nominaData.socios.map((s) => [
      `"${s.rut}"`,
      `"${s.nombre.replace(/"/g, '""')}"`,
      `"${s.numero_cuenta || ""}"`,
      `"${s.banco || ""}"`,
      `"${s.monto_actual || ""}"`,
      `"${s.comite_nombre || ""}"`,
    ]);

    const csvContent =
      "\uFEFF" + [header.join(";"), ...rows.map((r) => r.join(";"))].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const sanitizedComite = (comiteSeleccionado || "GENERAL")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .toUpperCase();
    const hoy = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.setAttribute("download", `NOMINA_AHORRO_${sanitizedComite}_${hoy}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Subir planilla de saldos o cartolas
  async function handleSubirPlanillaAhorro(e) {
    e.preventDefault();
    if (!archivoAhorro) return;

    setSubiendoAhorro(true);
    setMensajeSubida("");
    try {
      const formData = new FormData();
      formData.append("archivo", archivoAhorro);
      const res = await api.post("/importar/observaciones/", formData, {
        timeout: 300000,
      });
      setMensajeSubida(
        `Planilla procesada con éxito: ${res.data?.filas_procesadas ?? "varias"} filas cruzadas y actualizadas.`
      );
      setArchivoAhorro(null);
      await fetchNomina();
    } catch (err) {
      setMensajeSubida(
        err.response?.data?.detail || "Error al procesar la planilla de ahorro. Verifica el formato."
      );
    } finally {
      setSubiendoAhorro(false);
    }
  }

  const resumen = nominaData?.resumen || {
    total_socios: 0,
    con_cuenta: 0,
    sin_cuenta: 0,
    bancos: [],
  };

  const socios = nominaData?.socios || [];
  const comiteActual = nominaData?.comite;

  return (
    <div className="space-y-6">
      {/* Header y Selector de Comité */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium tracking-wider uppercase text-slate-400">
              SIGEP · Área Social
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-[11px] font-medium text-slate-500">Módulo Flagship</span>
          </div>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
            Extraer Ahorro Habitacional
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Consulta y extracción de cuentas de ahorro por comité para certificación SERVIU y cruce bancario.
          </p>
        </div>

        {/* Selector de Comité */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 shadow-2xs">
            <Building2 size={15} className="text-slate-500 shrink-0" />
            <span className="text-xs font-medium text-slate-500">Comité:</span>
            <select
              value={comiteSeleccionado}
              onChange={(e) => handleSelectComite(e.target.value)}
              disabled={loadingComites}
              className="bg-transparent text-xs font-semibold text-slate-900 focus:outline-none cursor-pointer"
            >
              {comites.map((c) => (
                <option key={c.id} value={c.nombre}>
                  {c.nombre} {c.decreto ? `(${c.decreto})` : ""} · {c.comuna || "Sin comuna"}
                </option>
              ))}
              <option value="todos">Todos los comités (Consolidado)</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => fetchNomina()}
            disabled={loading}
            title="Recargar datos"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Tarjetas de Métricas Clave de Ahorro */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Socios */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Total Socios
            </span>
            <Building2 size={16} className="text-slate-400" />
          </div>
          <p className="mt-2 text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {resumen.total_socios}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            {comiteActual ? `${comiteActual.nombre} · ${comiteActual.comuna}` : "Total en nómina"}
          </p>
        </div>

        {/* Cuentas Informadas */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Cuentas Registradas
            </span>
            <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </div>
          <p className="mt-2 text-2xl font-bold font-mono text-emerald-600 tabular-nums">
            {resumen.con_cuenta}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            {resumen.total_socios > 0
              ? `${Math.round((resumen.con_cuenta / resumen.total_socios) * 100)}% con N° cuenta`
              : "0%"}
          </p>
        </div>

        {/* Cuentas Pendientes */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Sin Cuenta Informada
            </span>
            <span className="flex h-2 w-2 rounded-full bg-amber-500"></span>
          </div>
          <p className="mt-2 text-2xl font-bold font-mono text-amber-600 tabular-nums">
            {resumen.sin_cuenta}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">Requieren libreta bancaria</p>
        </div>

        {/* Banco Principal */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Banco Predominante
            </span>
            <Wallet size={16} className="text-slate-400" />
          </div>
          <p className="mt-2 text-base font-bold text-slate-900 truncate">
            {resumen.bancos?.[0]?.banco || "Sin bancos"}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            {resumen.bancos?.[0]
              ? `${resumen.bancos[0].total} cuentas asociadas`
              : "Pendiente"}
          </p>
        </div>
      </div>

      {/* Barra de Acciones y Descarga de Nómina */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          {/* Buscador */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="Buscar por RUT, Nombre o N° Cuenta..."
              className="h-9 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-none transition-all"
            />
          </div>

          {/* Filtro Banco */}
          <select
            value={bancoFiltro}
            onChange={(e) => setBancoFiltro(e.target.value)}
            className="h-9 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:border-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="todos">Todos los bancos</option>
            {resumen.bancos.map((b) => (
              <option key={b.banco} value={b.banco}>
                {b.banco} ({b.total})
              </option>
            ))}
          </select>

          {/* Filtro Estado de Cuenta */}
          <select
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
            className="h-9 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:border-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="todos">Todos los estados</option>
            <option value="con_cuenta">Con cuenta informada ({resumen.con_cuenta})</option>
            <option value="sin_cuenta">Sin cuenta ({resumen.sin_cuenta})</option>
          </select>
        </div>

        {/* Botones de Exportación / Copia */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopiarNominaCompleta}
            disabled={socios.length === 0}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors disabled:opacity-40 cursor-pointer"
            title="Copiar datos tabulados para pegar en Excel"
          >
            {nominaCopiada ? (
              <>
                <Check size={13} className="text-emerald-600" />
                <span className="text-emerald-700">¡Nómina copiada!</span>
              </>
            ) : (
              <>
                <Copy size={13} />
                <span>Copiar nómina</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDescargarCSV}
            disabled={socios.length === 0}
            className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-slate-800 shadow-2xs transition-colors disabled:opacity-40 cursor-pointer"
            title="Descargar archivo CSV listo para certificación bancaria"
          >
            <Download size={13} />
            <span>Descargar Nómina (.CSV)</span>
          </button>
        </div>
      </div>

      {/* Mensaje de error si falla la carga */}
      {error && <ErrorState message={error} />}

      {/* Tabla Principal: Nombre, RUT, N° Cuenta, Banco */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
        <div className="border-b border-slate-200/80 bg-slate-50/70 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet size={15} className="text-slate-600" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Nómina de Cuentas de Ahorro · {comiteActual ? comiteActual.nombre : "General"}
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {socios.length} {socios.length === 1 ? "socio" : "socios"} listados
          </span>
        </div>

        {loading ? (
          <div className="py-12">
            <LoadingState label="Cargando nómina de ahorro del comité..." />
          </div>
        ) : socios.length === 0 ? (
          <div className="py-12">
            <EmptyState label="No se encontraron socios con los filtros seleccionados." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50/90 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3">RUT</th>
                  <th className="px-4 py-3">Nombre Titular</th>
                  <th className="px-4 py-3">N° Cuenta de Ahorro</th>
                  <th className="px-4 py-3">Banco</th>
                  <th className="px-4 py-3 text-right">Saldo Actual</th>
                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {socios.map((s) => {
                  const tieneCuenta = Boolean(s.numero_cuenta);
                  const tieneSaldo = s.monto_actual !== null && s.monto_actual !== undefined;

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* RUT */}
                      <td className="px-4 py-3.5 font-mono font-medium text-slate-900 whitespace-nowrap">
                        <Link
                          to={`/personas/${s.id}`}
                          className="hover:text-blue-600 hover:underline"
                          title="Ver ficha socio"
                        >
                          {s.rut}
                        </Link>
                      </td>

                      {/* Nombre Completo */}
                      <td className="px-4 py-3.5 font-medium text-slate-900">
                        {s.nombre}
                        {s.comite_nombre && s.comite_nombre !== comiteSeleccionado && (
                          <span className="block text-[11px] text-slate-400 font-normal">
                            {s.comite_nombre}
                          </span>
                        )}
                      </td>

                      {/* N° Cuenta de Ahorro */}
                      <td className="px-4 py-3.5">
                        {tieneCuenta ? (
                          <div className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50/90 px-2 py-1 font-mono text-xs font-semibold text-slate-800 tracking-wider">
                            <span>{s.numero_cuenta}</span>
                            <button
                              type="button"
                              onClick={() => handleCopiarCuenta(s.id, s.numero_cuenta)}
                              className="text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
                              title="Copiar N° cuenta"
                            >
                              {cuentaCopiadaId === s.id ? (
                                <Check size={12} className="text-emerald-600" />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                            Sin cuenta registrada
                          </span>
                        )}
                      </td>

                      {/* Banco */}
                      <td className="px-4 py-3.5">
                        {s.banco ? (
                          <span
                            className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${
                              s.banco.toUpperCase().includes("ESTADO")
                                ? "bg-indigo-50 text-indigo-700 border-indigo-200/80"
                                : s.banco.toUpperCase().includes("SANTANDER")
                                ? "bg-rose-50 text-rose-700 border-rose-200/80"
                                : s.banco.toUpperCase().includes("EXENTO")
                                ? "bg-amber-50 text-amber-700 border-amber-200/80"
                                : "bg-slate-100 text-slate-700 border-slate-200"
                            }`}
                          >
                            {s.banco}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">No informado</span>
                        )}
                      </td>

                      {/* Saldo Actual */}
                      <td className="px-4 py-3.5 text-right font-medium tabular-nums text-slate-900">
                        {tieneSaldo ? (
                          <span className="font-semibold text-emerald-700">
                            {money(s.monto_actual)}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">
                            Pendiente de cartola
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="px-4 py-3.5 text-center">
                        <Link
                          to={`/personas/${s.id}`}
                          className="inline-flex items-center rounded border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                        >
                          Ver ficha
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Acordeón / Sección para Cruce de Cartola Bancaria */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
        <button
          type="button"
          onClick={() => setMostrarSubida(!mostrarSubida)}
          className="flex w-full items-center justify-between text-left text-xs font-semibold text-slate-800 hover:text-slate-950 transition cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Upload size={14} className="text-slate-500" />
            <span>Cruce masivo: Actualizar saldos desde cartola bancaria (.xlsx)</span>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {mostrarSubida ? "Ocultar panel ▲" : "Abrir cargador ▼"}
          </span>
        </button>

        {mostrarSubida && (
          <div className="mt-3.5 border-t border-slate-100 pt-3 animate-in fade-in">
            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
              Sube la planilla provista por BancoEstado o la entidad financiera. El motor cruzará por RUT o N° de cuenta y actualizará automáticamente los saldos certificados para postulación.
            </p>
            <form
              onSubmit={handleSubirPlanillaAhorro}
              className="flex flex-col gap-2.5 sm:flex-row sm:items-center"
            >
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setArchivoAhorro(e.target.files?.[0] || null)}
                className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-2.5 file:py-1.5 file:text-xs file:font-medium file:text-slate-700 hover:file:bg-slate-200 transition cursor-pointer"
              />
              <button
                type="submit"
                disabled={!archivoAhorro || subiendoAhorro}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-xs font-medium text-white shadow-2xs hover:bg-slate-800 disabled:opacity-50 transition whitespace-nowrap cursor-pointer"
              >
                {subiendoAhorro ? "Cruzando saldos..." : "Procesar y actualizar"}
              </button>
            </form>
            {mensajeSubida && (
              <p className="mt-2.5 rounded-md bg-slate-50 p-2.5 text-xs text-slate-700 border border-slate-200">
                {mensajeSubida}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
