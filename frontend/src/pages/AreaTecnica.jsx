import {
  Building2,
  CheckCircle2,
  Clock,
  Compass,
  FileCheck2,
  HardHat,
  Home,
  Layers,
  MapPin,
  Save,
  Wrench,
} from "lucide-react";
import { useEffect, useState } from "react";

const STORAGE_KEY = "area_tecnica_proyecto_estado";

export default function AreaTecnica() {
  const [tecnica, setTecnica] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved
        ? JSON.parse(saved)
        : {
            coordinador: "Equipo Técnico EP",
            estado: "Formulación de Proyecto",
            nombreProyecto: "Proyecto Habitacional Los Aromos",
            terreno: {
              rol: "1234-56",
              superficie: "12.500 m²",
              estadoLegal: "Promesa de compraventa suscrita",
              topografia: "Topografía regular levantada",
            },
            factibilidades: {
              agua: "Aprobada por empresa sanitaria",
              alcantarillado: "Factibilidad vigente",
              electricidad: "Punto de conexión disponible",
              aguasLluvias: "En estudio de escorrentía",
            },
            arquitectura: {
              tipologias: "Casas 2 pisos (55 m²) y Deptos (62 m²)",
              viviendasAdaptadas: "4 unidades con accesibilidad universal",
              equipamiento: "Sede comunitaria (70 m²) y áreas verdes",
            },
            expediente: {
              mecanicaSuelo: "Informe de calicatas completado",
              calculoEstructural: "En desarrollo",
              permisoEdificacion: "Ingreso programado a DOM",
            },
            observaciones:
              "Se requiere actualizar certificado de factibilidad eléctrica para la presentación final ante SERVIU.",
          };
    } catch {
      return {};
    }
  });

  const [guardado, setGuardado] = useState(false);

  function handleChange(campo, valor) {
    setTecnica((prev) => ({ ...prev, [campo]: valor }));
    setGuardado(false);
  }

  function handleNestedChange(seccion, campo, valor) {
    setTecnica((prev) => ({
      ...prev,
      [seccion]: { ...(prev[seccion] || {}), [campo]: valor },
    }));
    setGuardado(false);
  }

  function handleGuardar(e) {
    e.preventDefault();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tecnica));
    setGuardado(true);
    setTimeout(() => setGuardado(false), 3000);
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">SIGEP · Área Técnica</p>
          <h1 className="text-lg font-semibold text-slate-900 tracking-tight">Proyectos y Terrenos</h1>
        </div>

        <button
          type="button"
          onClick={handleGuardar}
          className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-white shadow-2xs hover:bg-slate-800 transition"
        >
          <Save size={14} />
          {guardado ? "Cambios guardados" : "Guardar avances"}
        </button>
      </div>

      {/* Resumen de Estado Técnico */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-200/80 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Coordinación Técnica</span>
            <HardHat size={14} className="text-slate-400" />
          </div>
          <p className="mt-1.5 text-sm font-semibold text-slate-900">{tecnica.coordinador || "Sin asignar"}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">Responsable asignado</p>
        </div>

        <div className="rounded-lg border border-slate-200/80 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Estado Proyecto</span>
            <Clock size={14} className="text-slate-400" />
          </div>
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            <span className="text-sm font-semibold text-slate-900">{tecnica.estado || "En formulación"}</span>
          </div>
          <p className="mt-0.5 text-[11px] text-slate-400">Fase activa</p>
        </div>

        <div className="rounded-lg border border-slate-200/80 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Superficie Terreno</span>
            <MapPin size={14} className="text-slate-400" />
          </div>
          <p className="mt-1.5 text-sm font-semibold text-slate-900">{tecnica.terreno?.superficie || "Por medir"}</p>
          <p className="mt-0.5 text-[11px] font-mono text-slate-400">Rol {tecnica.terreno?.rol || "S/R"}</p>
        </div>

        <div className="rounded-lg border border-slate-200/80 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Expediente SERVIU</span>
            <FileCheck2 size={14} className="text-slate-400" />
          </div>
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
            <span className="text-sm font-semibold text-slate-900">En preparación</span>
          </div>
          <p className="mt-0.5 text-[11px] text-slate-400">Especialidades</p>
        </div>
      </div>

      {/* Bloques de Datos Técnicos */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* 1. Terreno y Localización */}
        <div className="rounded-lg border border-slate-200/80 bg-white p-4 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <MapPin size={15} className="text-slate-500" />
            <h2 className="text-xs font-semibold text-slate-900">1. Terreno y Localización</h2>
          </div>
          <div className="space-y-2.5 text-xs">
            <div>
              <label className="text-[11px] font-medium text-slate-600 block mb-1">Rol de Avalúo / Lote</label>
              <input
                type="text"
                value={tecnica.terreno?.rol || ""}
                onChange={(e) => handleNestedChange("terreno", "rol", e.target.value)}
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none transition"
                placeholder="Ej: Rol 543-21 Comuna"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 block mb-1">Estado Legal / Dominio</label>
              <input
                type="text"
                value={tecnica.terreno?.estadoLegal || ""}
                onChange={(e) => handleNestedChange("terreno", "estadoLegal", e.target.value)}
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none transition"
                placeholder="Ej: Terreno municipal / Promesa suscrita"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 block mb-1">Superficie y Levantamiento Topográfico</label>
              <input
                type="text"
                value={tecnica.terreno?.superficie || ""}
                onChange={(e) => handleNestedChange("terreno", "superficie", e.target.value)}
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none transition"
                placeholder="Superficie total en m²"
              />
            </div>
          </div>
        </div>

        {/* 2. Factibilidades Sanitarias y Eléctricas */}
        <div className="rounded-lg border border-slate-200/80 bg-white p-4 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <Wrench size={15} className="text-slate-500" />
            <h2 className="text-xs font-semibold text-slate-900">2. Factibilidades de Servicios Básicos</h2>
          </div>
          <div className="space-y-2.5 text-xs">
            <div>
              <label className="text-[11px] font-medium text-slate-600 block mb-1">Agua Potable</label>
              <input
                type="text"
                value={tecnica.factibilidades?.agua || ""}
                onChange={(e) => handleNestedChange("factibilidades", "agua", e.target.value)}
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none transition"
                placeholder="Estado del certificado de factibilidad"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 block mb-1">Alcantarillado / Aguas Servidas</label>
              <input
                type="text"
                value={tecnica.factibilidades?.alcantarillado || ""}
                onChange={(e) => handleNestedChange("factibilidades", "alcantarillado", e.target.value)}
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none transition"
                placeholder="Factibilidad sanitaria o solución particular"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 block mb-1">Electricidad / Alumbrado</label>
              <input
                type="text"
                value={tecnica.factibilidades?.electricidad || ""}
                onChange={(e) => handleNestedChange("factibilidades", "electricidad", e.target.value)}
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none transition"
                placeholder="Punto de empalme o postación"
              />
            </div>
          </div>
        </div>

        {/* 3. Arquitectura y Tipologías de Vivienda */}
        <div className="rounded-lg border border-slate-200/80 bg-white p-4 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <Home size={15} className="text-slate-500" />
            <h2 className="text-xs font-semibold text-slate-900">3. Arquitectura y Tipologías</h2>
          </div>
          <div className="space-y-2.5 text-xs">
            <div>
              <label className="text-[11px] font-medium text-slate-600 block mb-1">Tipología de Viviendas</label>
              <input
                type="text"
                value={tecnica.arquitectura?.tipologias || ""}
                onChange={(e) => handleNestedChange("arquitectura", "tipologias", e.target.value)}
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none transition"
                placeholder="Ej: Casas pareadas 2 pisos / Deptos 3D"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 block mb-1">Viviendas Adaptadas (Movilidad Reducida)</label>
              <input
                type="text"
                value={tecnica.arquitectura?.viviendasAdaptadas || ""}
                onChange={(e) => handleNestedChange("arquitectura", "viviendasAdaptadas", e.target.value)}
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none transition"
                placeholder="Cantidad de unidades con accesibilidad universal"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 block mb-1">Equipamiento Comunitario y Áreas Verdes</label>
              <input
                type="text"
                value={tecnica.arquitectura?.equipamiento || ""}
                onChange={(e) => handleNestedChange("arquitectura", "equipamiento", e.target.value)}
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none transition"
                placeholder="Sede social, juegos infantiles, etc."
              />
            </div>
          </div>
        </div>

        {/* 4. Bitácora u Observaciones Técnicas */}
        <div className="rounded-lg border border-slate-200/80 bg-white p-4 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <Layers size={15} className="text-slate-500" />
            <h2 className="text-xs font-semibold text-slate-900">4. Bitácora Técnica</h2>
          </div>
          <div className="space-y-2.5 text-xs">
            <div>
              <label className="text-[11px] font-medium text-slate-600 block mb-1">Notas y Acuerdos Técnicos</label>
              <textarea
                rows={4}
                value={tecnica.observaciones || ""}
                onChange={(e) => handleChange("observaciones", e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none transition"
                placeholder="Hitos de avance, observaciones pendientes ante SERVIU..."
              />
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleGuardar}
                className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow-2xs hover:bg-slate-800 transition"
              >
                <Save size={13} />
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
