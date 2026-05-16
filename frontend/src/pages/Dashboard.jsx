import {
  Accessibility,
  AlertTriangle,
  BadgeCheck,
  Banknote,
  FileWarning,
  ShieldAlert,
  Users,
  UserRoundCheck,
} from "lucide-react";
import { useEffect, useState } from "react";

import { api } from "../api/client.js";
import Section from "../components/Section.jsx";
import StatCard from "../components/StatCard.jsx";
import { ErrorState, LoadingState } from "../components/StateViews.jsx";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/dashboard/resumen/")
      .then((response) => setData(response.data))
      .catch(() => setError("No fue posible cargar el resumen."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState label="Cargando dashboard" />;
  if (error) return <ErrorState message={error} />;

  const stats = [
    { label: "Total personas", value: data.total_personas, icon: Users, tone: "slate" },
    { label: "Aptas", value: data.personas_aptas, icon: BadgeCheck, tone: "emerald" },
    { label: "Observadas", value: data.observadas, icon: AlertTriangle, tone: "amber" },
    { label: "Bloqueadas", value: data.bloqueadas, icon: ShieldAlert, tone: "rose" },
    { label: "Personas mayores", value: data.personas_mayores, icon: UserRoundCheck, tone: "cyan" },
    { label: "Discapacidad", value: data.discapacidad, icon: Accessibility, tone: "indigo" },
    { label: "RSH sobre 40%", value: data.rsh_sobre_40, icon: FileWarning, tone: "violet" },
    { label: "Ahorro insuficiente", value: data.ahorro_insuficiente, icon: Banknote, tone: "amber" },
  ];

  const maxComite = Math.max(...(data.por_comite || []).map((item) => item.total), 1);
  const maxEstado = Math.max(...(data.por_estado || []).map((item) => item.total), 1);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase text-cyan-700">Panel operativo</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-950">Dashboard</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="Personas por estado">
          <div className="space-y-3">
            {(data.por_estado || []).map((item) => (
              <Bar
                key={item.estado_general}
                label={item.estado_general}
                value={item.total}
                max={maxEstado}
              />
            ))}
          </div>
        </Section>

        <Section title="Comites con mas personas">
          <div className="space-y-3">
            {(data.por_comite || []).map((item) => (
              <Bar
                key={item.comite__nombre}
                label={item.comite__nombre || "Sin comite"}
                value={item.total}
                max={maxComite}
              />
            ))}
          </div>
        </Section>
      </div>

      <Section title="Alertas documentales">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Cedulas vencidas" value={data.cedulas_vencidas} icon={ShieldAlert} tone="rose" />
          <StatCard label="Criticas" value={data.alertas_criticas} icon={ShieldAlert} tone="rose" />
          <StatCard label="Preventivas" value={data.alertas_preventivas} icon={AlertTriangle} tone="amber" />
        </div>
      </Section>
    </div>
  );
}

function Bar({ label, value, max }) {
  const width = `${Math.max((value / max) * 100, 4)}%`;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3 text-sm">
        <span className="truncate font-medium capitalize text-slate-700">{label}</span>
        <span className="font-semibold text-slate-950">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-cyan-700" style={{ width }} />
      </div>
    </div>
  );
}
