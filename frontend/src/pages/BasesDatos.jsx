import { FileSpreadsheet, Search, Upload } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";

import Importar from "./Importar.jsx";
import Personas from "./Personas.jsx";

export default function BasesDatos() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") === "importar" ? "importar" : "personas";
  const [tab, setTab] = useState(initialTab);

  function handleTabChange(nextTab) {
    setTab(nextTab);
    const newParams = new URLSearchParams(searchParams);
    if (nextTab === "importar") {
      newParams.set("tab", "importar");
    } else {
      newParams.delete("tab");
    }
    setSearchParams(newParams);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-cyan-100 px-2 py-0.5 text-xs font-semibold text-cyan-800">
              ÁREA SOCIAL
            </span>
            <span className="text-xs font-medium text-slate-500">Gestión de nóminas</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Bases de Datos
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Padrón unificado de socios de comités, búsqueda por RUT y carga masiva de planillas Excel.
          </p>
        </div>

        {/* Pestañas internas */}
        <div className="flex rounded-lg bg-slate-100 p-1 border border-slate-200">
          <button
            type="button"
            onClick={() => handleTabChange("personas")}
            className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-semibold transition ${
              tab === "personas"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Search size={14} />
            Padrón de personas
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("importar")}
            className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-semibold transition ${
              tab === "importar"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Upload size={14} />
            Cargar / Actualizar base
          </button>
        </div>
      </div>

      {/* Contenido según pestaña */}
      <div>
        {tab === "personas" ? <Personas /> : <Importar />}
      </div>
    </div>
  );
}
