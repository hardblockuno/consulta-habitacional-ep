import {
  Accessibility,
  ArrowRight,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  Filter,
  Leaf,
  ShieldAlert,
  UserCheck,
  UserRound,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../api/client.js";
import StatCard from "../components/StatCard.jsx";
import { ErrorState, LoadingState } from "../components/StateViews.jsx";

export default function OrganizacionDemanda() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/dashboard/resumen/")
      .then((response) => setData(response.data))
      .catch(() => setError("No fue posible cargar la información de organización de la demanda."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState label="Cargando organización de la demanda..." />;
  if (error) return <ErrorState message={error} />;

  const total = Number(data.total_personas || 0);
  const rshPreferente = total > 0 ? Math.round(((total - (data.rsh_tramo_alto || 0)) / total) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-cyan-100 px-2 py-0.5 text-xs font-semibold text-cyan-800">
              ÁREA SOCIAL
            </span>
            <span className="text-xs font-medium text-slate-500">Gestión de Comités Habitacionales</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Organización de la Demanda
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Diagnóstico, caracterización y avance social de los comités de vivienda de la Entidad Patrocinante.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/bases-datos"
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-cyan-800 transition"
          >
            <Users size={16} />
            Ver padrón de socios
          </Link>
        </div>
      </div>

      {/* Métricas Principales de Postulación */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/bases-datos" className="block transition hover:-translate-y-0.5">
          <StatCard
            label="Total socios / familias"
            value={data.total_personas}
            icon={Users}
            tone="slate"
          />
        </Link>
        <Link to="/alertas?severidad=critica" className="block transition hover:-translate-y-0.5">
          <StatCard
            label="Cédulas por revisar"
            value={data.cedulas_revision}
            icon={FileText}
            tone="rose"
          />
        </Link>
        <Link to="/bases-datos?filtro=adultos_mayores" className="block transition hover:-translate-y-0.5">
          <StatCard
            label="Adultos mayores (60+)"
            value={data.personas_mayores}
            icon={UserCheck}
            tone="cyan"
          />
        </Link>
        <Link to="/bases-datos?filtro=discapacidad" className="block transition hover:-translate-y-0.5">
          <StatCard
            label="Discapacidad acreditada"
            value={data.discapacidad}
            icon={Accessibility}
            tone="indigo"
          />
        </Link>
      </div>

      {/* Bloque de Caracterización y Vulnerabilidad Social */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Priorizaciones sociales */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Caracterización de la Demanda</h2>
              <p className="text-xs text-slate-500">Criterios de prioridad y factores de vulnerabilidad</p>
            </div>
            <Link
              to="/bases-datos"
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
                    {total - (data.rsh_tramo_alto || 0)} <span className="text-xs font-normal text-slate-500">({rshPreferente}%)</span>
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
              <Link to="/alertas" className="text-xs font-medium text-cyan-700 hover:underline">
                Revisar
              </Link>
            </div>
          </div>
        </div>

        {/* Acciones directas del Área Social */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Módulos del Área Social</h2>
            <p className="text-xs text-slate-500">Herramientas operativas para la gestión de comités</p>

            <div className="mt-4 space-y-2.5">
              <Link
                to="/bases-datos"
                className="flex items-center justify-between rounded-lg border border-slate-200 p-3 hover:border-cyan-500 hover:bg-cyan-50/50 transition"
              >
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet size={18} className="text-cyan-700" />
                  <span className="text-sm font-medium text-slate-800">Bases de datos Excel</span>
                </div>
                <ArrowRight size={16} className="text-slate-400" />
              </Link>

              <Link
                to="/extraer-ahorro"
                className="flex items-center justify-between rounded-lg border border-slate-200 p-3 hover:border-cyan-500 hover:bg-cyan-50/50 transition"
              >
                <div className="flex items-center gap-2.5">
                  <Filter size={18} className="text-emerald-700" />
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
            <strong>Criterio EP:</strong> Los socios con cédula vigente, RSH al día y ahorro acreditado quedan en estado <em>Apto</em> para postulación colectiva DS49.
          </div>
        </div>
      </div>
    </div>
  );
}
