import { Accessibility, FileText, Leaf, UserRound, Users, UserRoundCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../api/client.js";
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
    { label: "Total personas", value: data.total_personas, icon: Users, tone: "slate", to: "/personas" },
    {
      label: "Cédulas vencidas o por vencer",
      value: data.cedulas_revision,
      icon: FileText,
      tone: "rose",
      to: "/personas?filtro=cedulas_revision",
    },
    {
      label: "Adultos mayores",
      value: data.personas_mayores,
      icon: UserRoundCheck,
      tone: "cyan",
      to: "/personas?filtro=adultos_mayores",
    },
    {
      label: "Discapacidad",
      value: data.discapacidad,
      icon: Accessibility,
      tone: "indigo",
      to: "/personas?filtro=discapacidad",
    },
    {
      label: "Etnia / pueblo originario",
      value: data.etnia,
      icon: Leaf,
      tone: "emerald",
      to: "/personas?filtro=etnia",
    },
    {
      label: "Postulación unipersonal",
      value: data.unipersonales,
      icon: UserRound,
      tone: "amber",
      to: "/personas?filtro=unipersonal",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase text-cyan-700">Panel operativo</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-950">Dashboard</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <Link key={stat.label} to={stat.to} className="block transition hover:-translate-y-0.5">
            <StatCard {...stat} />
          </Link>
        ))}
      </div>
    </div>
  );
}
