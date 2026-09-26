import {
  Accessibility,
  AlertTriangle,
  ArrowRight,
  Building,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  Filter,
  Leaf,
  Layers,
  ShieldAlert,
  UserCheck,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { api } from "../api/client.js";
import StatCard from "../components/StatCard.jsx";
import { ErrorState, LoadingState } from "../components/StateViews.jsx";

export default function OrganizacionDemanda() {
  const [searchParams, setSearchParams] = useSearchParams();
  const comiteParam = searchParams.get("comite") || "";

  const [comiteActivo, setComiteActivo] = useState(comiteParam);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchResumen(comiteActivo);
  }, [comiteActivo]);

  async function fetchResumen(comiteNombre) {
    setLoading(true);
    setError("");
    try {
      const url = comiteNombre
        ? `/dashboard/resumen/?comite=${encodeURIComponent(comiteNombre)}`
        : "/dashboard/resumen/";
      const response = await api.get(url);
      setData(response.data);
    } catch {
      setError("No fue posible cargar el resumen de organización de la demanda.");
    } finally {
      setLoading(false);
    }
  }

  function handleSelectComite(nombre) {
    setComiteActivo(nombre);
    const newParams = new URLSearchParams(searchParams);
    if (nombre) {
      newParams.set("comite", nombre);
    } else {
      newParams.delete("comite");
    }
    setSearchParams(newParams);
  }

  if (loading && !data) return <LoadingState label="Cargando organización de la demanda..." />;
  if (error && !data) return <ErrorState message={error} />;

  const total = Number(data?.total_personas || 0);
  const rshPreferente =
    total > 0 ? Math.round(((total - (data?.rsh_sobre_40 || 0)) / total) * 100) : 0;
  const comitesResumen = data?.comites_resumen || [];

  return (
    <div className="space-y-8">
      {/* Header y Selector de Comité */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-cyan-100 px-2.5 py-0.5 text-xs font-semibold text-cyan-800">
              ÁREA SOCIAL
            </span>
            <span className="text-xs font-medium text-slate-500">
              {comiteActivo ? `Comité: ${comiteActivo}` : "Consolidado Entidad Patrocinante"}
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Organización de la Demanda
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Diagnóstico, caracterización y avance de postulación elaborado a partir de las bases de datos de cada comité.
          </p>
        </div>

        {/* Selector de Comité */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2 shadow-xs">
            <Building size={16} className="text-cyan-700 ml-1" />
            <span className="text-xs font-semibold text-slate-600">Comité:</span>
            <select
              value={comiteActivo}
              onChange={(e) => handleSelectComite(e.target.value)}
              className="rounded-md border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-900 focus:border-cyan-600 focus:outline-none"
            >
              <option value="">🏢 Todos los Comités (Consolidado General)</option>
              {comitesResumen.map((c) => (
                <option key={c.id} value={c.nombre}>
                  {c.nombre} ({c.total_personas} familias)
                </option>
              ))}
            </select>
          </div>

          {comiteActivo && (
            <button
              type="button"
              onClick={() => handleSelectComite("")}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Ver todos
            </button>
          )}

          <Link
            to={comiteActivo ? `/bases-datos?comite=${encodeURIComponent(comiteActivo)}` : "/bases-datos"}
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-cyan-800 transition"
          >
            <Users size={15} />
            Ver padrón del comité
          </Link>
        </div>
      </div>

      {/* Métricas Principales (Filtradas por el comité activo o consolidadas) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          to={comiteActivo ? `/bases-datos?comite=${encodeURIComponent(comiteActivo)}` : "/bases-datos"}
          className="block transition hover:-translate-y-0.5"
        >
          <StatCard
            label={comiteActivo ? `Socios en ${comiteActivo}` : "Total socios registrados"}
            value={data.total_personas}
            icon={Users}
            tone="slate"
          />
        </Link>
        <Link
          to={
            comiteActivo
              ? `/bases-datos?comite=${encodeURIComponent(comiteActivo)}&estado=apta`
              : "/bases-datos?estado=apta"
          }
          className="block transition hover:-translate-y-0.5"
        >
          <StatCard
            label="Socios aptos (listos postulación)"
            value={data.personas_aptas}
            icon={CheckCircle2}
            tone="cyan"
          />
        </Link>
        <Link
          to={
            comiteActivo
              ? `/bases-datos?comite=${encodeURIComponent(comiteActivo)}&filtro=cedulas_revision`
              : "/alertas"
          }
          className="block transition hover:-translate-y-0.5"
        >
          <StatCard
            label="Cédulas por revisar / vencidas"
            value={data.cedulas_revision}
            icon={FileText}
            tone="rose"
          />
        </Link>
        <Link
          to={
            comiteActivo
              ? `/extraer-ahorro?comite=${encodeURIComponent(comiteActivo)}`
              : "/extraer-ahorro"
          }
          className="block transition hover:-translate-y-0.5"
        >
          <StatCard
            label="Ahorro insuficiente / pendiente"
            value={data.ahorro_insuficiente}
            icon={Wallet}
            tone="amber"
          />
        </Link>
      </div>

      {/* SI NO HAY FILTRO: Mostrar Resumen Individual de Cada Comité */}
      {!comiteActivo && comitesResumen.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Building size={20} className="text-cyan-700" />
                Resumen Elaborado por Cada Comité ({comitesResumen.length})
              </h2>
              <p className="text-xs text-slate-500">
                Comparativa y estado de avance de cada base de datos cargada en la Entidad Patrocinante
              </p>
            </div>
          </div>

          {/* Grid de Comités */}
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {comitesResumen.map((comite) => (
              <div
                key={comite.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-cyan-500 hover:shadow-md transition"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                        {comite.comuna || "Comuna informada"}
                      </span>
                      <h3 className="mt-1.5 text-base font-bold text-slate-950">{comite.nombre}</h3>
                    </div>
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-50 text-cyan-800 font-bold text-xs">
                      {comite.total_personas}
                    </span>
                  </div>

                  {/* Barra de progreso de Aptos */}
                  <div className="mt-4 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-700">Aptitud de postulación:</span>
                      <span className="font-bold text-cyan-800">{comite.porcentaje_aptos}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-cyan-700"
                        style={{ width: `${Math.min(comite.porcentaje_aptos, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Métricas del Comité */}
                  <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-slate-50 p-2.5 text-center text-xs">
                    <div>
                      <p className="text-[10px] text-slate-500 font-medium">Aptos</p>
                      <p className="font-bold text-emerald-700">{comite.aptas}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-medium">Observados</p>
                      <p className="font-bold text-amber-700">{comite.observadas}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-medium">Bloqueados</p>
                      <p className="font-bold text-rose-700">{comite.bloqueadas}</p>
                    </div>
                  </div>

                  {/* Factores sociales */}
                  <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] text-slate-600">
                    <span className="rounded bg-slate-100 px-2 py-0.5">
                      👴 {comite.personas_mayores} adultos mayores
                    </span>
                    <span className="rounded bg-slate-100 px-2 py-0.5">
                      ♿ {comite.discapacidad} discapacidad
                    </span>
                    <span className="rounded bg-slate-100 px-2 py-0.5">
                      🌿 {comite.etnia} etnia
                    </span>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-xs font-semibold text-slate-500">
                    Ahorro prom: <strong className="text-slate-900">{comite.ahorro_promedio_uf} UF</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSelectComite(comite.nombre)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-cyan-700 hover:text-cyan-900 transition"
                  >
                    Diagnóstico <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Tabla Comparativa de Comités */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden mt-6">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Padrón Comparativo de la Demanda por Comité
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Comité</th>
                    <th className="px-4 py-3 font-semibold">Comuna</th>
                    <th className="px-4 py-3 font-semibold">Familias</th>
                    <th className="px-4 py-3 font-semibold">Aptos (%)</th>
                    <th className="px-4 py-3 font-semibold">Observados</th>
                    <th className="px-4 py-3 font-semibold">Bloqueados</th>
                    <th className="px-4 py-3 font-semibold">Adultos Mayores</th>
                    <th className="px-4 py-3 font-semibold">Discapacidad</th>
                    <th className="px-4 py-3 font-semibold">RSH ≤ 40%</th>
                    <th className="px-4 py-3 font-semibold">Ahorro Prom.</th>
                    <th className="px-4 py-3 font-semibold">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {comitesResumen.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 font-bold text-slate-900">{c.nombre}</td>
                      <td className="px-4 py-3 text-slate-600">{c.comuna || "-"}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{c.total_personas}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-cyan-100 px-2 py-0.5 font-bold text-cyan-800">
                          {c.aptas} ({c.porcentaje_aptos}%)
                        </span>
                      </td>
                      <td className="px-4 py-3 text-amber-700 font-medium">{c.observadas}</td>
                      <td className="px-4 py-3 text-rose-700 font-medium">{c.bloqueadas}</td>
                      <td className="px-4 py-3 text-slate-700">{c.personas_mayores}</td>
                      <td className="px-4 py-3 text-slate-700">{c.discapacidad}</td>
                      <td className="px-4 py-3 text-slate-700">{c.rsh_preferente}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{c.ahorro_promedio_uf} UF</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleSelectComite(c.nombre)}
                          className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-cyan-700 hover:bg-cyan-50 hover:text-cyan-900"
                        >
                          Ver comité
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Bloque de Caracterización y Vulnerabilidad Social (del comité seleccionado o general) */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Caracterización Social {comiteActivo ? `· ${comiteActivo}` : "(Consolidado)"}
              </h2>
              <p className="text-xs text-slate-500">Criterios de prioridad y factores de vulnerabilidad en la base</p>
            </div>
            <Link
              to={comiteActivo ? `/bases-datos?comite=${encodeURIComponent(comiteActivo)}` : "/bases-datos"}
              className="inline-flex items-center gap-1 text-xs font-medium text-cyan-700 hover:text-cyan-800"
            >
              Ver nómina <ArrowRight size={14} />
            </Link>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <Leaf size={18} />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Pueblos originarios / Etnia</p>
                  <p className="text-lg font-bold text-slate-900">{data.etnia ?? 0}</p>
                </div>
              </div>
              <span className="text-xs text-slate-500">CONADI</span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                  <UserRound size={18} />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Postulación unipersonal</p>
                  <p className="text-lg font-bold text-slate-900">{data.unipersonales ?? 0}</p>
                </div>
              </div>
              <span className="text-xs text-slate-500">Persona sola</span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-100 text-cyan-700">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">RSH Tramo Preferente (≤ 40%)</p>
                  <p className="text-lg font-bold text-slate-900">
                    {total - (data.rsh_sobre_40 || 0)}{" "}
                    <span className="text-xs font-normal text-slate-500">({rshPreferente}%)</span>
                  </p>
                </div>
              </div>
              <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                Prioridad
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
                  <ShieldAlert size={18} />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Alertas críticas vigentes</p>
                  <p className="text-lg font-bold text-slate-900">{data.alertas_criticas ?? 0}</p>
                </div>
              </div>
              <Link
                to={comiteActivo ? `/alertas?comite=${encodeURIComponent(comiteActivo)}` : "/alertas"}
                className="text-xs font-medium text-cyan-700 hover:underline"
              >
                Revisar
              </Link>
            </div>
          </div>
        </div>

        {/* Acciones directas */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Módulos del Área Social</h2>
            <p className="text-xs text-slate-500">
              Operaciones disponibles para {comiteActivo || "los comités"}
            </p>

            <div className="mt-4 space-y-2.5">
              <Link
                to={comiteActivo ? `/bases-datos?comite=${encodeURIComponent(comiteActivo)}` : "/bases-datos"}
                className="flex items-center justify-between rounded-lg border border-slate-200 p-3 hover:border-cyan-500 hover:bg-cyan-50/50 transition"
              >
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet size={18} className="text-cyan-700" />
                  <span className="text-sm font-medium text-slate-800">Bases de datos y nóminas</span>
                </div>
                <ArrowRight size={16} className="text-slate-400" />
              </Link>

              <Link
                to={comiteActivo ? `/extraer-ahorro?comite=${encodeURIComponent(comiteActivo)}` : "/extraer-ahorro"}
                className="flex items-center justify-between rounded-lg border border-slate-200 p-3 hover:border-cyan-500 hover:bg-cyan-50/50 transition"
              >
                <div className="flex items-center gap-2.5">
                  <Wallet size={18} className="text-emerald-700" />
                  <span className="text-sm font-medium text-slate-800">Extraer y cruzar ahorro</span>
                </div>
                <ArrowRight size={16} className="text-slate-400" />
              </Link>

              <Link
                to="/extraer-rukan"
                className="flex items-center justify-between rounded-lg border border-slate-200 p-3 hover:border-cyan-500 hover:bg-cyan-50/50 transition"
              >
                <div className="flex items-center gap-2.5">
                  <FileText size={18} className="text-indigo-700" />
                  <span className="text-sm font-medium text-slate-800">Extraer Ficha RUKAN</span>
                </div>
                <ArrowRight size={16} className="text-slate-400" />
              </Link>
            </div>
          </div>

          <div className="mt-5 rounded-lg bg-cyan-50 p-3 text-xs text-cyan-950 border border-cyan-100">
            <strong>Gestión multircomité:</strong> Las nóminas cargadas mediante Excel se asignan automáticamente al comité correspondiente, permitiendo balances independientes y consolidados.
          </div>
        </div>
      </div>
    </div>
  );
}
