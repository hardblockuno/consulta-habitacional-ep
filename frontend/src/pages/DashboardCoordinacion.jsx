import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  FileCheck2,
  HardHat,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import Section from "../components/Section.jsx";
import StatCard from "../components/StatCard.jsx";
import { ErrorState, LoadingState } from "../components/StateViews.jsx";

export default function DashboardCoordinacion() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/dashboard/coordinacion/")
      .then((res) => setData(res.data))
      .catch(() => setError("No fue posible cargar el cuadro de mando de coordinación."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState label="Cargando consola ejecutiva SIGEP..." />;
  if (error) return <ErrorState message={error} />;

  const metricas = data?.metricas_ejecutivas || {};
  const general = data?.general || {};
  const postventa = data?.postventa || {};
  const comites = data?.comites || [];

  return (
    <div className="space-y-5">
      {/* Encabezado */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
          SIGEP · Coordinación General
        </p>
        <h1 className="text-lg font-semibold tracking-tight text-slate-900">
          Consola Ejecutiva y Gerencia
        </h1>
      </div>

      {/* Métricas Macro de Alto Nivel */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Comités Activos"
          value={metricas.comites_activos}
          icon={Building2}
          tone="slate"
        />
        <StatCard
          label="Total Familias"
          value={metricas.total_familias}
          icon={Users}
          tone="slate"
        />
        <StatCard
          label="Familias Aptas"
          value={metricas.familias_aptas}
          icon={CheckCircle2}
          tone="emerald"
        />
        <StatCard
          label="Alertas Críticas"
          value={metricas.alertas_criticas}
          icon={AlertTriangle}
          tone="rose"
        />
      </div>

      {/* Desempeño Cruzado por Áreas */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Resumen Área Social */}
        <div className="rounded-lg border border-slate-200/80 bg-white p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Users size={15} className="text-slate-500" />
              <h2 className="text-xs font-semibold text-slate-900">Rendimiento Área Social</h2>
            </div>
            <Link
              to="/demanda"
              className="text-[11px] font-medium text-slate-600 hover:text-slate-900 hover:underline"
            >
              Ver demanda →
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1 text-center">
            <div className="rounded-md border border-slate-100 bg-slate-50/60 p-2.5">
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                Aptas
              </span>
              <p className="font-mono text-base font-semibold text-emerald-600">
                {metricas.porcentaje_aptos}%
              </p>
            </div>
            <div className="rounded-md border border-slate-100 bg-slate-50/60 p-2.5">
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                Observadas
              </span>
              <p className="font-mono text-base font-semibold text-amber-600">
                {metricas.observadas}
              </p>
            </div>
            <div className="rounded-md border border-slate-100 bg-slate-50/60 p-2.5">
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                Bloqueadas
              </span>
              <p className="font-mono text-base font-semibold text-rose-600">
                {metricas.bloqueadas}
              </p>
            </div>
          </div>

          <div className="pt-2 text-xs space-y-1.5 text-slate-600">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span>Ahorro bajo exigencia mínima:</span>
              <span className="font-mono font-medium text-slate-900">{metricas.ahorro_insuficiente} familias</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Cédulas por renovar / vencidas:</span>
              <span className="font-mono font-medium text-slate-900">{general.cedulas_revision || 0} casos</span>
            </div>
          </div>
        </div>

        {/* Resumen Área Técnica y Postventa */}
        <div className="rounded-lg border border-slate-200/80 bg-white p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <HardHat size={15} className="text-slate-500" />
              <h2 className="text-xs font-semibold text-slate-900">Rendimiento Área Técnica y Postventa</h2>
            </div>
            <Link
              to="/tecnica"
              className="text-[11px] font-medium text-slate-600 hover:text-slate-900 hover:underline"
            >
              Ver técnica →
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1 text-center">
            <div className="rounded-md border border-slate-100 bg-slate-50/60 p-2.5">
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                Tickets Totales
              </span>
              <p className="font-mono text-base font-semibold text-slate-900">
                {postventa.total || 0}
              </p>
            </div>
            <div className="rounded-md border border-slate-100 bg-slate-50/60 p-2.5">
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                En Gestión
              </span>
              <p className="font-mono text-base font-semibold text-amber-600">
                {postventa.en_gestion || 0}
              </p>
            </div>
            <div className="rounded-md border border-slate-100 bg-slate-50/60 p-2.5">
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                Resueltos
              </span>
              <p className="font-mono text-base font-semibold text-emerald-600">
                {postventa.resueltas || 0}
              </p>
            </div>
          </div>

          <div className="pt-2 text-xs space-y-1.5 text-slate-600">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span>Estado expediente SERVIU:</span>
              <span className="font-medium text-slate-900">En formulación activa</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Atenciones de urgencia reportadas:</span>
              <span className="font-mono font-medium text-rose-600">{postventa.urgentes || 0} casos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Consolidado de Comités y Proyectos */}
      <Section title="Consolidado de Comités y Proyectos Activos">
        {comites.length === 0 ? (
          <p className="text-xs text-slate-500 py-3 text-center">No hay comités registrados aún.</p>
        ) : (
          <div className="overflow-x-auto -mx-4 -mb-4">
            <table className="min-w-full divide-y divide-slate-100 text-xs">
              <thead className="bg-slate-50/60 text-left text-[11px] font-medium uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-2">Comité</th>
                  <th className="px-4 py-2">Comuna</th>
                  <th className="px-4 py-2 text-right">Familias</th>
                  <th className="px-4 py-2 text-right">Aptas (%)</th>
                  <th className="px-4 py-2 text-right">Ahorro Prom. (UF)</th>
                  <th className="px-4 py-2 text-center">Estado SERVIU</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {comites.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-4 py-2.5 font-medium text-slate-900">{c.nombre}</td>
                    <td className="px-4 py-2.5 text-slate-600">{c.comuna || "Sin comuna"}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-slate-700">{c.total_personas}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-medium text-emerald-600">
                      {c.porcentaje_aptos}%
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-slate-700">
                      {c.ahorro_promedio_uf || 0} UF
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 shadow-2xs">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        En Formulación
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}
