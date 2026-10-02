import { Building2, Search, Upload } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";

import GestionComites from "../components/GestionComites.jsx";
import Importar from "./Importar.jsx";
import Personas from "./Personas.jsx";

export default function BasesDatos() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTabParam = searchParams.get("tab");
  const tab =
    currentTabParam === "importar"
      ? "importar"
      : currentTabParam === "comites"
      ? "comites"
      : "personas";

  function handleTabChange(nextTab) {
    const newParams = new URLSearchParams(searchParams);
    if (nextTab === "personas") {
      newParams.delete("tab");
    } else {
      newParams.set("tab", nextTab);
    }
    setSearchParams(newParams);
  }

  function handleFiltrarPorComite(nombreComite) {
    const newParams = new URLSearchParams();
    if (nombreComite) newParams.set("comite", nombreComite);
    setSearchParams(newParams);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <span className="text-[10px] font-medium tracking-wider uppercase text-slate-400">
            SIGEP · Área Social
          </span>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
            Bases de Datos
          </h1>
        </div>

        {/* Pestañas internas estilo Linear */}
        <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200/70">
          <button
            type="button"
            onClick={() => handleTabChange("personas")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              tab === "personas"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Search size={13} />
            Padrón
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("comites")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              tab === "comites"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Building2 size={13} />
            Comités
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("importar")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              tab === "importar"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Upload size={13} />
            Importar
          </button>
        </div>
      </div>

      {/* Contenido según pestaña activa */}
      <div>
        {tab === "personas" && <Personas />}
        {tab === "comites" && (
          <GestionComites onSelectComite={handleFiltrarPorComite} />
        )}
        {tab === "importar" && (
          <Importar onVerPadron={handleFiltrarPorComite} />
        )}
      </div>
    </div>
  );
}
