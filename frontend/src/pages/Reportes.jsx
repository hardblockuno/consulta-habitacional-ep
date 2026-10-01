import { AlertTriangle, ClipboardList, FileText, Leaf, UserRound, Users } from "lucide-react";
import { useEffect, useState } from "react";

import { api } from "../api/client.js";
import Section from "../components/Section.jsx";
import StatCard from "../components/StatCard.jsx";
import { EmptyState, ErrorState, LoadingState } from "../components/StateViews.jsx";

export default function Reportes() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/reportes/resumen/")
      .then((response) => setData(response.data))
      .catch(() => setError("No fue posible cargar los reportes."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState label="Cargando reportes" />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">SIGEP · Reportes y Auditoría</p>
        <h1 className="text-lg font-semibold text-slate-900 tracking-tight">Reportes y Auditoría</h1>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Personas" value={data.total_personas} icon={Users} tone="slate" />
        <StatCard label="Alertas críticas" value={data.alertas_criticas} icon={AlertTriangle} tone="rose" />
        <StatCard label="Cédulas vencidas" value={data.cedulas_vencidas} icon={FileText} tone="rose" />
        <StatCard label="Hijos rev. 18" value={data.hijos_revision_18} icon={ClipboardList} tone="amber" />
        <StatCard label="Ahorro bajo referencia" value={data.ahorro_insuficiente} icon={ClipboardList} tone="amber" />
        <StatCard label="Etnia / pueblo originario" value={data.etnia} icon={Leaf} tone="emerald" />
        <StatCard label="Postulación unipersonal" value={data.unipersonales} icon={UserRound} tone="amber" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Alertas por tipo">
          {data.alertas_por_tipo?.length ? (
            <Table
              columns={["Tipo", "Severidad", "Total"]}
              rows={data.alertas_por_tipo.map((item) => [item.tipo, item.severidad, item.total])}
            />
          ) : (
            <EmptyState label="Sin alertas" />
          )}
        </Section>

        <Section title="Documentos">
          {data.documentos?.length ? (
            <Table
              columns={["Tipo", "Estado", "Total"]}
              rows={data.documentos.map((item) => [item.tipo, item.estado, item.total])}
            />
          ) : (
            <EmptyState label="Sin documentos" />
          )}
        </Section>
      </div>

      <Section title="Comités">
        {data.por_comite?.length ? (
          <Table
            columns={["Comité", "Personas"]}
            rows={data.por_comite.map((item) => [item.comite__nombre || "Sin comité", item.total])}
          />
        ) : (
          <EmptyState label="Sin comités" />
        )}
      </Section>
    </div>
  );
}

function Table({ columns, rows }) {
  return (
    <div className="overflow-x-auto -mx-4 -mb-4">
      <table className="min-w-full divide-y divide-slate-100 text-xs">
        <thead className="bg-slate-50/60 text-left text-[11px] font-medium uppercase tracking-wider text-slate-400">
          <tr>
            {columns.map((column) => (
              <th key={column} className="px-4 py-2">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, index) => (
            <tr key={index} className="hover:bg-slate-50/50 transition">
              {row.map((cell, cellIndex) => (
                <td key={`${index}-${cellIndex}`} className="px-4 py-2 text-slate-700">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
