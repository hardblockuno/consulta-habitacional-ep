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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
              ÁREA TÉCNICA
            </span>
            <span className="text-xs font-medium text-slate-500">Gestión de Proyectos e Ingeniería</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Proyectos y Terrenos
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Control de factibilidades técnicas, arquitectura, cabida de viviendas y estado del expediente SERVIU.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGuardar}
          className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-cyan-800 transition"
        >
          <Save size={16} />
          {guardado ? "¡Guardado con éxito!" : "Guardar avances técnicos"}
        </button>
      </div>

      {/* Resumen de Estado Técnico */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">Coordinación Técnica</p>
            <HardHat size={18} className="text-amber-600" />
          </div>
          <p className="mt-2 text-base font-bold text-slate-900">{tecnica.coordinador || "Sin asignar"}</p>
          <p className="mt-1 text-xs text-slate-500">Arquitecto / Ingeniero responsable</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">Estado del Proyecto</p>
            <Clock size={18} className="text-cyan-700" />
          </div>
          <p className="mt-2 text-base font-bold text-cyan-800">{tecnica.estado || "En formulación"}</p>
          <p className="mt-1 text-xs text-slate-500">Fase técnico-habitacional</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">Superficie Terreno</p>
            <MapPin size={18} className="text-emerald-600" />
          </div>
          <p className="mt-2 text-base font-bold text-slate-900">{tecnica.terreno?.superficie || "Por medir"}</p>
          <p className="mt-1 text-xs text-slate-500">Rol: {tecnica.terreno?.rol || "S/R"}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">Expediente SERVIU</p>
            <FileCheck2 size={18} className="text-indigo-600" />
          </div>
          <p className="mt-2 text-base font-bold text-slate-900">En preparación</p>
          <p className="mt-1 text-xs text-slate-500">Revisión de especialidades</p>
        </div>
      </div>

      {/* Bloques de Datos Técnicos */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 1. Terreno y Localización */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <MapPin size={18} className="text-cyan-700" />
            <h2 className="text-sm font-bold text-slate-900">1. Terreno y Localización</h2>
          </div>
          <div className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700">Rol de Avalúo / Lote:</label>
              <input
                type="text"
                value={tecnica.terreno?.rol || ""}
                onChange={(e) => handleNestedChange("terreno", "rol", e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 p-2 text-xs text-slate-900 focus:border-cyan-600 focus:outline-none"
                placeholder="Ej: Rol 543-21 Comuna"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700">Estado Legal / Dominio:</label>
              <input
                type="text"
                value={tecnica.terreno?.estadoLegal || ""}
                onChange={(e) => handleNestedChange("terreno", "estadoLegal", e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 p-2 text-xs text-slate-900 focus:border-cyan-600 focus:outline-none"
                placeholder="Ej: Terreno municipal / Promesa de compraventa"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700">Superficie y Levantamiento Topográfico:</label>
              <input
                type="text"
                value={tecnica.terreno?.superficie || ""}
                onChange={(e) => handleNestedChange("terreno", "superficie", e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 p-2 text-xs text-slate-900 focus:border-cyan-600 focus:outline-none"
                placeholder="Superficie total en m²"
              />
            </div>
          </div>
        </div>

        {/* 2. Factibilidades Sanitarias y Eléctricas */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Wrench size={18} className="text-cyan-700" />
            <h2 className="text-sm font-bold text-slate-900">2. Factibilidades de Servicios Básicos</h2>
          </div>
          <div className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700">Agua Potable:</label>
              <input
                type="text"
                value={tecnica.factibilidades?.agua || ""}
                onChange={(e) => handleNestedChange("factibilidades", "agua", e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 p-2 text-xs text-slate-900 focus:border-cyan-600 focus:outline-none"
                placeholder="Estado del certificado de factibilidad"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700">Alcantarillado / Aguas Servidas:</label>
              <input
                type="text"
                value={tecnica.factibilidades?.alcantarillado || ""}
                onChange={(e) => handleNestedChange("factibilidades", "alcantarillado", e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 p-2 text-xs text-slate-900 focus:border-cyan-600 focus:outline-none"
                placeholder="Factibilidad sanitaria o solución particular"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700">Electricidad / Alumbrado:</label>
              <input
                type="text"
                value={tecnica.factibilidades?.electricidad || ""}
                onChange={(e) => handleNestedChange("factibilidades", "electricidad", e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 p-2 text-xs text-slate-900 focus:border-cyan-600 focus:outline-none"
                placeholder="Punto de empalme o postación"
              />
            </div>
          </div>
        </div>

        {/* 3. Arquitectura y Tipologías de Vivienda */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Home size={18} className="text-cyan-700" />
            <h2 className="text-sm font-bold text-slate-900">3. Arquitectura y Tipologías Habitacionales</h2>
          </div>
          <div className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700">Tipología de Viviendas del Proyecto:</label>
              <input
                type="text"
                value={tecnica.arquitectura?.tipologias || ""}
                onChange={(e) => handleNestedChange("arquitectura", "tipologias", e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 p-2 text-xs text-slate-900 focus:border-cyan-600 focus:outline-none"
                placeholder="Ej: Casas pareadas 2 pisos / Deptos 3D"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700">Viviendas Adaptadas (Discapacidad / Movilidad Reducida):</label>
              <input
                type="text"
                value={tecnica.arquitectura?.viviendasAdaptadas || ""}
                onChange={(e) => handleNestedChange("arquitectura", "viviendasAdaptadas", e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 p-2 text-xs text-slate-900 focus:border-cyan-600 focus:outline-none"
                placeholder="Cantidad de unidades con accesibilidad universal"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700">Equipamiento Comunitario y Áreas Verdes:</label>
              <input
                type="text"
                value={tecnica.arquitectura?.equipamiento || ""}
                onChange={(e) => handleNestedChange("arquitectura", "equipamiento", e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 p-2 text-xs text-slate-900 focus:border-cyan-600 focus:outline-none"
                placeholder="Sede social, juegos infantiles, etc."
              />
            </div>
          </div>
        </div>

        {/* 4. Bitácora u Observaciones Técnicas */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Layers size={18} className="text-cyan-700" />
            <h2 className="text-sm font-bold text-slate-900">4. Observaciones y Bitácora Técnica</h2>
          </div>
          <div className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700">Notas técnicas del proyecto:</label>
              <textarea
                rows={5}
                value={tecnica.observaciones || ""}
                onChange={(e) => handleChange("observaciones", e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-cyan-600 focus:outline-none"
                placeholder="Registra hitos, acuerdos de asamblea técnica o requerimientos pendientes con SERVIU..."
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleGuardar}
                className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition"
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
