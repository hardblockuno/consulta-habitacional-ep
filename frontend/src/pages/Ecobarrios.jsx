import {
  AlertCircle,
  ArrowDownToLine,
  CheckCircle2,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Filter,
  FolderArchive,
  FolderOpen,
  Home,
  Layers,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  TreePine,
  Upload,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../api/client.js";

const STREAMLIT_URL = "http://127.0.0.1:8501/?embed=true";
const STREAMLIT_EXTERNAL = "http://127.0.0.1:8501";

export default function Ecobarrios() {
  const [tabActiva, setTabActiva] = useState("web"); // 'web' o 'streamlit'

  // Estados del Generador Web
  const [archivo, setArchivo] = useState(null);
  const [analizando, setAnalizando] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [analisis, setAnalisis] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [busqueda, setBusqueda] = useState("");

  // Metadatos del Proyecto
  const [comiteNombre, setComiteNombre] = useState("COMITÉ DE VIVIENDA ECOBARRIOS DE PERQUENCO");
  const [codigoExpediente, setCodigoExpediente] = useState("42005");
  const [comuna, setComuna] = useState("Perquenco");
  const [egrNombre, setEgrNombre] = useState("CONSULTORA PLAN SOCIAL LIMITADA");
  const [egrRut, setEgrRut] = useState("77.235.354-5");
  const [arquitecto, setArquitecto] = useState("Vanessa Ximena Schneider Martínez");
  const [trabajadorSocial, setTrabajadorSocial] = useState("Erica Esther Reyes Peña");
  const [abogado, setAbogado] = useState("Rodrigo Pedreros");

  // Estados de la Consola Streamlit
  const [motorStreamlitActivo, setMotorStreamlitActivo] = useState(false);
  const [iframeKey, setIframeKey] = useState(Date.now());

  // Verificar estado local de Streamlit
  const verificarMotorStreamlit = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      await fetch("http://127.0.0.1:8501/_stcore/health", {
        signal: controller.signal,
        mode: "no-cors",
      });
      clearTimeout(timeoutId);
      setMotorStreamlitActivo(true);
    } catch {
      setMotorStreamlitActivo(false);
    }
  };

  useEffect(() => {
    if (tabActiva === "streamlit") {
      verificarMotorStreamlit();
    }
  }, [tabActiva]);

  // Manejar subida y análisis de archivo Excel
  const handleArchivoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setArchivo(file);
    setErrorMsg("");
    setAnalizando(true);
    setAnalisis(null);

    const formData = new FormData();
    formData.append("archivo", file);

    try {
      const res = await api.post("/ecobarrios/analizar/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAnalisis(res.data);
    } catch (err) {
      console.error("Error al analizar Excel:", err);
      setErrorMsg(
        err.response?.data?.error || "No se pudo procesar la planilla Excel. Verifica que tenga una hoja con los postulantes."
      );
    } finally {
      setAnalizando(false);
    }
  };

  // Manejar generación del ZIP completo
  const handleGenerarExpediente = async () => {
    if (!archivo) return;
    setGenerando(true);
    setErrorMsg("");

    const formData = new FormData();
    formData.append("archivo", archivo);
    formData.append("comite_nombre", comiteNombre);
    formData.append("codigo_expediente", codigoExpediente);
    formData.append("comuna", comuna);
    formData.append("egr_nombre", egrNombre);
    formData.append("egr_rut", egrRut);
    formData.append("arquitecto", arquitecto);
    formData.append("trabajador_social", trabajadorSocial);
    formData.append("abogado", abogado);

    try {
      const res = await api.post("/ecobarrios/generar/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        responseType: "blob",
      });

      // Crear descarga en navegador
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      const slug = comiteNombre.replace(/[^a-zA-Z0-9]/g, "_");
      link.setAttribute("download", `Expediente_${slug}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error al generar expediente:", err);
      setErrorMsg("Ocurrió un error al compilar los documentos. Revisa la consola o intenta nuevamente.");
    } finally {
      setGenerando(false);
    }
  };

  const postulantesFiltrados = (analisis?.postulantes || []).filter((p) => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return (
      p.nombre?.toLowerCase().includes(q) ||
      p.rut?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      {/* Encabezado Principal */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 shadow-2xs">
            <TreePine size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                SIGEP · Habitabilidad Rural
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-600/20">
                D.S. N° 10 / Res. 3131
              </span>
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">
              Ecobarrios · Generador Oficial de Expedientes
            </h1>
          </div>
        </div>

        {/* Selector de Modo */}
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-2xs">
          <button
            type="button"
            onClick={() => setTabActiva("web")}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
              tabActiva === "web"
                ? "bg-slate-900 text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FolderArchive size={14} />
            Generador Web (Oficina)
          </button>
          <button
            type="button"
            onClick={() => setTabActiva("streamlit")}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
              tabActiva === "streamlit"
                ? "bg-slate-900 text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sparkles size={14} />
            Consola Interactiva
          </button>
        </div>
      </div>

      {/* PESTAÑA 1: GENERADOR WEB NATIVO (PARA RENDER / OFICINA) */}
      {tabActiva === "web" && (
        <div className="space-y-5">
          {/* Parámetros del Proyecto */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              1. Identificación del Proyecto y Equipo Profesional
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Nombre del Comité / Proyecto</label>
                <input
                  type="text"
                  value={comiteNombre}
                  onChange={(e) => setComiteNombre(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:border-slate-800 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Comuna</label>
                <input
                  type="text"
                  value={comuna}
                  onChange={(e) => setComuna(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:border-slate-800 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Código Expediente RUKAN</label>
                <input
                  type="text"
                  value={codigoExpediente}
                  onChange={(e) => setCodigoExpediente(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:border-slate-800 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Entidad de Gestión Rural (EGR)</label>
                <input
                  type="text"
                  value={egrNombre}
                  onChange={(e) => setEgrNombre(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:border-slate-800 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">RUT Entidad EGR</label>
                <input
                  type="text"
                  value={egrRut}
                  onChange={(e) => setEgrRut(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:border-slate-800 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Arquitecta Responsable</label>
                <input
                  type="text"
                  value={arquitecto}
                  onChange={(e) => setArquitecto(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:border-slate-800 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Trabajadora Social Responsable</label>
                <input
                  type="text"
                  value={trabajadorSocial}
                  onChange={(e) => setTrabajadorSocial(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:border-slate-800 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Abogado Responsable</label>
                <input
                  type="text"
                  value={abogado}
                  onChange={(e) => setAbogado(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:border-slate-800 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Zona de Carga de Planilla Excel */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              2. Carga de Base Excel de Postulantes
            </h2>
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50/50 p-6 text-center hover:bg-slate-50 transition">
              <FileSpreadsheet size={36} className="text-emerald-600 mb-2" />
              <p className="text-xs font-medium text-slate-800">
                {archivo ? archivo.name : "Arrastra aquí la planilla Excel (.xlsx) del nuevo comité o selecciónala"}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Detecta automáticamente RUTs, edades, parentescos, RSH, CONADI, discapacidad y 3D.
              </p>
              <label className="mt-3 inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-white shadow-2xs hover:bg-slate-800">
                <Upload size={13} />
                Seleccionar Excel
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleArchivoChange}
                  className="hidden"
                />
              </label>
            </div>

            {analizando && (
              <div className="flex items-center justify-center gap-2 py-4 text-xs font-medium text-slate-600">
                <Loader2 size={16} className="animate-spin text-emerald-600" />
                Analizando base de postulantes y calculando métricas D.S. 10...
              </div>
            )}

            {errorMsg && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 ring-1 ring-rose-200">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Tarjetas de Métricas Cuadradas */}
          {analisis && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                    <span>Familias / Postulantes</span>
                    <Users size={16} className="text-emerald-600" />
                  </div>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{analisis.total_familias}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Total personas: <strong className="text-slate-800">{analisis.total_personas}</strong> ({analisis.hombres} H / {analisis.mujeres} M)
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                    <span>Viviendas 3er Dormitorio</span>
                    <Home size={16} className="text-indigo-600" />
                  </div>
                  <p className="mt-1 text-2xl font-bold text-indigo-700">{analisis.viviendas_3d}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Viviendas Base: <strong className="text-slate-800">{analisis.viviendas_base}</strong>
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                    <span>Pueblos Originarios</span>
                    <TreePine size={16} className="text-amber-600" />
                  </div>
                  <p className="mt-1 text-2xl font-bold text-amber-700">{analisis.conadi}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Familias CONADI: <strong className="text-slate-800">{analisis.familias_conadi}</strong>
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                    <span>Adultos Mayores / Discap.</span>
                    <CheckCircle2 size={16} className="text-teal-600" />
                  </div>
                  <p className="mt-1 text-2xl font-bold text-teal-700">{analisis.adultos_mayores}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Discapacidad: <strong className="text-slate-800">{analisis.discapacidad}</strong> ({analisis.familias_discapacidad} familias)
                  </p>
                </div>
              </div>

              {/* Botonera de Descarga */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl bg-slate-900 p-5 text-white shadow-md">
                <div>
                  <h3 className="text-sm font-semibold">¿Todo cuadrado? Descarga el Expediente Oficial</h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Genera el archivo ZIP con todos los Formularios 6.1 individuales (.docx), el Informe AT-6 (.docx), la Nómina (.docx) y el Compromiso (.docx).
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleGenerarExpediente}
                  disabled={generando}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-xs font-semibold text-slate-950 shadow-sm hover:bg-emerald-400 disabled:opacity-50 transition"
                >
                  {generando ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Compilando Expediente...
                    </>
                  ) : (
                    <>
                      <Download size={16} /> Descargar Expediente Completo (ZIP)
                    </>
                  )}
                </button>
              </div>

              {/* Listado Previo de Familias */}
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
                <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100">
                  <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                    Padrón de Postulantes ({postulantesFiltrados.length} de {analisis.total_familias})
                  </h3>
                  <div className="relative w-full sm:w-64">
                    <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre o RUT..."
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      className="w-full rounded-md border border-slate-200 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-slate-800 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[11px] font-semibold text-slate-600 sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 w-12 text-center">N°</th>
                        <th className="py-2.5 px-3">Postulante Titular</th>
                        <th className="py-2.5 px-3">RUT</th>
                        <th className="py-2.5 px-3">Estado Civil</th>
                        <th className="py-2.5 px-3">Tipología Asignada</th>
                        <th className="py-2.5 px-3 text-center">Atributos Especiales</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {postulantesFiltrados.map((p, idx) => (
                        <tr key={p.rut || idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">{p.n || idx + 1}</td>
                          <td className="py-2 px-3 font-medium text-slate-900">{p.nombre}</td>
                          <td className="py-2 px-3 font-mono text-slate-600 text-[11px]">{p.rut}</td>
                          <td className="py-2 px-3 text-slate-600">{p.estado_civil}</td>
                          <td className="py-2 px-3">
                            <span
                              className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                                p.tercer_dormitorio
                                  ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {p.tipo_vivienda || (p.tercer_dormitorio ? "3ER DORMITORIO" : "VIVIENDA BASE")}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {p.adulto_mayor && (
                                <span className="rounded bg-teal-50 px-1 py-0.5 text-[9px] font-semibold text-teal-700 ring-1 ring-teal-600/20" title="Adulto Mayor >= 60">
                                  +60
                                </span>
                              )}
                              {p.conadi && (
                                <span className="rounded bg-amber-50 px-1 py-0.5 text-[9px] font-semibold text-amber-700 ring-1 ring-amber-600/20" title="Pueblo Originario CONADI">
                                  CONADI
                                </span>
                              )}
                              {p.discapacidad && (
                                <span className="rounded bg-rose-50 px-1 py-0.5 text-[9px] font-semibold text-rose-700 ring-1 ring-rose-600/20" title="Discapacidad acreditada">
                                  DISC
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA 2: CONSOLA INTERACTIVA STREAMLIT EMBEBIDA */}
      {tabActiva === "streamlit" && (
        <div className="flex flex-col h-[calc(100vh-10rem)] space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  motorStreamlitActivo
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                    : "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    motorStreamlitActivo ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                  }`}
                />
                {motorStreamlitActivo ? "Motor Streamlit Conectado (Puerto 8501)" : "Comprobando servidor local..."}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIframeKey(Date.now());
                  verificarMotorStreamlit();
                }}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-50"
              >
                <RefreshCw size={12} /> Recargar
              </button>
              <a
                href={STREAMLIT_EXTERNAL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-3 py-1 text-xs text-white hover:bg-slate-800"
              >
                <ExternalLink size={12} /> Ventana Completa
              </a>
            </div>
          </div>

          <div className="flex-1 w-full rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
            <iframe
              key={iframeKey}
              src={STREAMLIT_URL}
              title="Consola Ecobarrios D.S. 10"
              className="h-full w-full border-0"
              allow="clipboard-write"
            />
          </div>
        </div>
      )}
    </div>
  );
}
