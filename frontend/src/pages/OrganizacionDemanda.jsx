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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium tracking-wider uppercase text-slate-400">
              SIGEP · Área Social
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-[11px] font-medium text-slate-500">
              {comiteActivo ? `Comité ${comiteActivo}` : "Plan Social · Consolidado General"}
            </span>
          </div>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
            Organización de la Demanda
          </h1>
        </div>

        {/* Selector de Comité */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 shadow-2xs">
            <Building size={14} className="text-slate-500" />
            <span className="text-[11px] font-medium text-slate-500">Comité:</span>
            <select
              value={comiteActivo}
              onChange={(e) => handleSelectComite(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="">Todos los comités (Consolidado)</option>
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
              className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              Ver todos
            </button>
          )}

          <Link
            to={comiteActivo ? `/bases-datos?comite=${encodeURIComponent(comiteActivo)}` : "/bases-datos"}
            className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-slate-800 transition-colors shadow-2xs"
          >
            <Users size={14} />
            Padrón del comité
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
            tone="emerald"
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
              <h2 className="text-base font-semibold tracking-tight text-slate-900 flex items-center gap-2">
                <Building size={16} className="text-slate-700" />
                Comités Activos ({comitesResumen.length})
              </h2>
            </div>
          </div>

          {/* Grid de Comités */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {comitesResumen.map((comite) => (
              <div
                key={comite.id}
                className="flex flex-col justify-between rounded-lg border border-slate-200/80 bg-white p-4 shadow-2xs hover:border-slate-300 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="inline-block rounded border border-slate-200/60 bg-slate-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-500">
                        {comite.comuna || "Comuna informada"}
                      </span>
                      <h3 className="mt-1 text-sm font-semibold text-slate-900">{comite.nombre}</h3>
                    </div>
                    <span className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-slate-50 font-mono text-xs font-semibold text-slate-800">
                      {comite.total_personas}
                    </span>
                  </div>

                  {/* Barra de progreso de Aptos */}
                  <div className="mt-3.5 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-[11px] font-medium text-slate-500">Aptitud de postulación</span>
                      <span className="font-mono text-xs font-semibold text-slate-900">{comite.porcentaje_aptos}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-slate-900"
                        style={{ width: `${Math.min(comite.porcentaje_aptos, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Métricas del Comité */}
                  <div className="mt-3.5 grid grid-cols-3 gap-2 rounded-md border border-slate-100 bg-slate-50/60 p-2 text-center text-xs">
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium uppercase">Aptos</p>
                      <p className="font-mono text-xs font-semibold text-emerald-700">{comite.aptas}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium uppercase">Observados</p>
                      <p className="font-mono text-xs font-semibold text-amber-700">{comite.observadas}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium uppercase">Bloqueados</p>
                      <p className="font-mono text-xs font-semibold text-rose-700">{comite.bloqueadas}</p>
                    </div>
                  </div>

                  {/* Factores sociales */}
                  <div className="mt-2.5 flex flex-wrap gap-1 text-[11px] text-slate-600">
                    <span className="rounded border border-slate-200/60 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600">
                      {comite.personas_mayores} adultos mayores
                    </span>
                    <span className="rounded border border-slate-200/60 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600">
                      {comite.discapacidad} discapacidad
                    </span>
                    <span className="rounded border border-slate-200/60 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600">
                      {comite.etnia} etnia
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-2.5">
                  <span className="text-[11px] font-medium text-slate-500">
                    Ahorro prom: <strong className="font-mono font-semibold text-slate-900">{comite.ahorro_promedio_uf} UF</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSelectComite(comite.nombre)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900 transition-colors"
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
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2 py-0.5 font-mono text-[11px] font-medium text-slate-800">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
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
                          className="rounded border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
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

      {/* Bloque de Caracterización y Vulnerabilidad Social */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-200/80 bg-white p-5 shadow-2xs lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-slate-900">
                Caracterización Social {comiteActivo ? `· ${comiteActivo}` : "(Consolidado)"}
              </h2>
            </div>
            <Link
              to={comiteActivo ? `/bases-datos?comite=${encodeURIComponent(comiteActivo)}` : "/bases-datos"}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              Ver nómina <ArrowRight size={14} />
            </Link>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50/60 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-emerald-700">
                  <Leaf size={16} />
                </div>
                <div>
                  <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Pueblos originarios</p>
                  <p className="font-mono text-lg font-semibold text-slate-900">{data.etnia ?? 0}</p>
                </div>
              </div>
              <span className="text-[10px] font-medium text-slate-400">CONADI</span>
            </div>

            <div className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50/60 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-amber-700">
                  <UserRound size={16} />
                </div>
                <div>
                  <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Unipersonal</p>
                  <p className="font-mono text-lg font-semibold text-slate-900">{data.unipersonales ?? 0}</p>
                </div>
              </div>
              <span className="text-[10px] font-medium text-slate-400">Persona sola</span>
            </div>

            <div className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50/60 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">RSH Tramo Preferente (≤ 40%)</p>
                  <p className="font-mono text-lg font-semibold text-slate-900">
                    {total - (data.rsh_sobre_40 || 0)}{" "}
                    <span className="text-xs font-normal text-slate-400">({rshPreferente}%)</span>
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-white px-2 py-0.5 text-[10px] font-medium text-emerald-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Prioridad
              </span>
            </div>

            <div className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50/60 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-rose-700">
                  <ShieldAlert size={16} />
                </div>
                <div>
                  <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Alertas críticas vigentes</p>
                  <p className="font-mono text-lg font-semibold text-slate-900">{data.alertas_criticas ?? 0}</p>
                </div>
              </div>
              <Link
                to={comiteActivo ? `/alertas?comite=${encodeURIComponent(comiteActivo)}` : "/alertas"}
                className="text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                Revisar
              </Link>
            </div>
          </div>
        </div>

        {/* Acciones directas */}
        <div className="rounded-lg border border-slate-200/80 bg-white p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-slate-900">Módulos del Área Social</h2>

            <div className="mt-4 space-y-2">
              <Link
                to={comiteActivo ? `/bases-datos?comite=${encodeURIComponent(comiteActivo)}` : "/bases-datos"}
                className="flex items-center justify-between rounded-md border border-slate-200/70 p-2.5 hover:border-slate-300 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet size={16} className="text-slate-600" />
                  <span className="text-xs font-medium text-slate-800">Bases de datos y nóminas</span>
                </div>
                <ArrowRight size={14} className="text-slate-400" />
              </Link>

              <Link
                to={comiteActivo ? `/extraer-ahorro?comite=${encodeURIComponent(comiteActivo)}` : "/extraer-ahorro"}
                className="flex items-center justify-between rounded-md border border-slate-200/70 p-2.5 hover:border-slate-300 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Wallet size={16} className="text-slate-600" />
                  <span className="text-xs font-medium text-slate-800">Extraer y cruzar ahorro</span>
                </div>
                <ArrowRight size={14} className="text-slate-400" />
              </Link>

              <Link
                to="/extraer-rukan"
                className="flex items-center justify-between rounded-md border border-slate-200/70 p-2.5 hover:border-slate-300 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <FileText size={16} className="text-slate-600" />
                  <span className="text-xs font-medium text-slate-800">Extraer Ficha RUKAN</span>
                </div>
                <ArrowRight size={14} className="text-slate-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
