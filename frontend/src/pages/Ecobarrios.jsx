import {
  AlertCircle,
  ArrowDownToLine,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  FileCheck,
  FileSpreadsheet,
  FileText,
  FolderArchive,
  HelpCircle,
  Home,
  Info,
  Layers,
  Loader2,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  TreePine,
  Upload,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../api/client.js";

// Diccionario de columnas estándar oficiales D.S. N° 10 / RUKAN
const GUIA_COLUMNAS_DATA = [
  {
    col: "N°",
    tipo: "Recomendada",
    formato: "Número entero (1, 2, 3...)",
    desc: "Correlativo de postulación. Ordena la nómina y numera las carpetas de expedientes.",
  },
  {
    col: "NOMBRE COMPLETO",
    tipo: "OBLIGATORIA",
    formato: "Texto (Nombres y Apellidos)",
    desc: "Identificación civil oficial. Se imprime en Carátula PHR 6.1, Nómina Oficial y AT-6.",
  },
  {
    col: "RUT",
    tipo: "OBLIGATORIA",
    formato: "XX.XXX.XXX-X o con DV separado",
    desc: "Clave única nacional. El sistema valida el Módulo 11 y formatea con puntos y guión automáticamente.",
  },
  {
    col: "COMUNA",
    tipo: "OBLIGATORIA",
    formato: "Texto (ej: Loncoche, Perquenco)",
    desc: "Determina la jurisdicción comunal, provincia, región y parámetros de ruralidad del proyecto.",
  },
  {
    col: "TIPO DE VIVIENDA",
    tipo: "OBLIGATORIA",
    formato: "BASE, 3D, AHORRO 35 UF, DISCAPACIDAD",
    desc: "Asigna la tipología habitacional oficial. Define si requiere 3er dormitorio por ahorro, grupo o movilidad.",
  },
  {
    col: "GRUP FAM",
    tipo: "Recomendada",
    formato: "Número entero (ej: 1 a 8)",
    desc: "Total de integrantes en el hogar. Hogares de 5 o más personas califican automáticamente a 3er Dormitorio.",
  },
  {
    col: "TIPO FAM",
    tipo: "Recomendada",
    formato: "MONOPARENTAL, BIPARENTAL, etc.",
    desc: "Clave para caracterización social y deducción matemática de composición en megaproyectos.",
  },
  {
    col: "FEC NAC",
    tipo: "Recomendada",
    formato: "DD/MM/AAAA",
    desc: "Fecha de nacimiento. Si la columna EDAD falta o viene vacía, el sistema la calcula con exactitud.",
  },
  {
    col: "EDAD",
    tipo: "Recomendada",
    formato: "Número entero (ej: 42)",
    desc: "Identifica menores de 18 años y adultos mayores (60+ años) para recintos y subsidios especiales.",
  },
  {
    col: "SEXO",
    tipo: "Recomendada",
    formato: "M / F (o Masculino / Femenino)",
    desc: "Permite calcular la proporción de jefatura de hogar femenina para la Tabla 6 y diagnóstico social.",
  },
  {
    col: "ESTADO CIVIL",
    tipo: "Recomendada",
    formato: "SOLTERO/A, CASADO/A, etc.",
    desc: "Requerido en Tabla 2 del PHR 6.1 y antecedentes de postulación en plataforma MINVU.",
  },
  {
    col: "DIRECCION RSH",
    tipo: "Recomendada",
    formato: "Texto (Calle, N°, Población/Sector)",
    desc: "Domicilio registrado en Registro Social de Hogares. Se inserta en Tabla 1 del Formulario 6.1.",
  },
  {
    col: "DISCAPACIDAD",
    tipo: "Recomendada",
    formato: "NO, SI, o MOVILIDAD REDUCIDA",
    desc: "Acredita subsidio complementario de movilidad reducida y adecuación arquitectónica según D.S. 10.",
  },
  {
    col: "ETNIA",
    tipo: "Recomendada",
    formato: "NO, MAPUCHE, o nombre de pueblo",
    desc: "Acredita pertinencia indígena CONADI. Genera puntaje de priorización regional en comités rurales.",
  },
  {
    col: "FONO",
    tipo: "Recomendada",
    formato: "9 dígitos (ej: 987654321)",
    desc: "Teléfono de contacto de la familia para citaciones, encuestas sociales y verificación SERVIU.",
  },
  {
    col: "RUT CONYUGE",
    tipo: "Opcional",
    formato: "XX.XXX.XXX-X",
    desc: "RUT de cónyuge o conviviente. Requerido para verificar núcleo en RUKAN y evitar duplicidades.",
  },
  {
    col: "NOMBRE CONYUGE",
    tipo: "Opcional",
    formato: "Texto",
    desc: "Nombre de cónyuge o conviviente para Formulario 6.1 y resoluciones.",
  },
  {
    col: "OBSERVACIONES",
    tipo: "Opcional",
    formato: "Texto libre",
    desc: "Notas adicionales de la EGR (solicitud de bodega de resguardo, taller productivo, etc.).",
  },
];

export default function Ecobarrios() {
  // Estados del Generador Web
  const [archivo, setArchivo] = useState(null);
  const [analizando, setAnalizando] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [descargandoDoc, setDescargandoDoc] = useState(null); // 'at6' | 'nomina' | 'compromiso' | rut
  const [descargandoPlantilla, setDescargandoPlantilla] = useState(false);
  const [analisis, setAnalisis] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [busqueda, setBusqueda] = useState("");

  // Modales y Visibilidad
  const [mostrarModalGuia, setMostrarModalGuia] = useState(false);
  const [mostrarParametros, setMostrarParametros] = useState(false);
  const [mostrarSeccionAT6, setMostrarSeccionAT6] = useState(true);

  // Metadatos del Proyecto (inician vacíos para permitir configurar libremente cualquier nuevo Ecobarrio)
  const [comiteNombre, setComiteNombre] = useState("");
  const [codigoExpediente, setCodigoExpediente] = useState("");
  const [comuna, setComuna] = useState("");
  const [egrNombre, setEgrNombre] = useState("");
  const [egrRut, setEgrRut] = useState("");
  const [arquitecto, setArquitecto] = useState("");
  const [trabajadorSocial, setTrabajadorSocial] = useState("");
  const [abogado, setAbogado] = useState("");

  // Preguntas Clave y Configuración Técnica del Predio y AT-6
  const [terrenoCalle, setTerrenoCalle] = useState("");
  const [terrenoRol, setTerrenoRol] = useState("");
  const [terrenoLote, setTerrenoLote] = useState("");
  const [terrenoLocalidad, setTerrenoLocalidad] = useState("");

  const [aguaPotable, setAguaPotable] = useState(
    "Conexión a sistema APR con factibilidad técnica aprobada y red proyectada"
  );
  const [alcantarillado, setAlcantarillado] = useState(
    "Sistema individual de fosa séptica con cámara desgrasadora y drenes de infiltración"
  );
  const [electricidad, setElectricidad] = useState(
    "Conexión a red aérea de distribución eléctrica monofásica con empalme normalizado SEC"
  );
  const [topografia, setTopografia] = useState(
    "terreno plano con pendiente inferior al 3%, apto para fundación"
  );
  const [riesgos, setRiesgos] = useState(
    "libre de riesgos de remoción en masa, derrumbes, aluviones o inundaciones fluviales"
  );
  const [enfoqueSocial, setEnfoqueSocial] = useState(
    "superación de la vulnerabilidad socioeconómica y condiciones de allegamiento rural"
  );

  // Textos Técnicos para Tablas 26, 30 y 31 del AT-6
  const [obsServiciosBasicos, setObsServiciosBasicos] = useState("");
  const [riesgosNaturales, setRiesgosNaturales] = useState("");
  const [opinionProfesional, setOpinionProfesional] = useState("");
  const [redactandoIA, setRedactandoIA] = useState(false);
  const [fuenteRedaccion, setFuenteRedaccion] = useState(null); // 'gemini' | 'experto_local'

  // Reiniciar formulario para trabajar con un nuevo comité / Ecobarrio
  const handleNuevoEcobarrio = () => {
    setArchivo(null);
    setAnalisis(null);
    setErrorMsg("");
    setBusqueda("");
    setComiteNombre("");
    setCodigoExpediente("");
    setComuna("");
    setEgrNombre("");
    setEgrRut("");
    setArquitecto("");
    setTrabajadorSocial("");
    setAbogado("");
    setTerrenoCalle("");
    setTerrenoRol("");
    setTerrenoLote("");
    setTerrenoLocalidad("");
    setObsServiciosBasicos("");
    setRiesgosNaturales("");
    setOpinionProfesional("");
    setFuenteRedaccion(null);
    const fileInput = document.getElementById("input-excel-ecobarrios");
    if (fileInput) fileInput.value = "";
  };

  // Cargar valores de EGR sugeridos (Consultora Plan Social) en 1 clic
  const handleCargarValoresPlanSocial = () => {
    setEgrNombre("CONSULTORA PLAN SOCIAL LIMITADA");
    setEgrRut("77.235.354-5");
    setArquitecto("Vanessa Ximena Schneider Martínez");
    setTrabajadorSocial("Erica Esther Reyes Peña");
    setAbogado("Rodrigo Pedreros");
  };

  // Limpiar únicamente campos de identificación
  const handleLimpiarParametros = () => {
    setComiteNombre("");
    setCodigoExpediente("");
    setComuna("");
    setEgrNombre("");
    setEgrRut("");
    setArquitecto("");
    setTrabajadorSocial("");
    setAbogado("");
  };

  // Descargar Plantilla Modelo Oficial (.xlsx)
  const handleDescargarPlantilla = async () => {
    setDescargandoPlantilla(true);
    try {
      const res = await api.get("/ecobarrios/plantilla-modelo/", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Plantilla_Oficial_Comite_DS10.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error al descargar plantilla modelo:", err);
      setErrorMsg("No se pudo descargar la plantilla modelo. Reintenta en unos momentos.");
    } finally {
      setDescargandoPlantilla(false);
    }
  };

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
      const data = res.data;
      setAnalisis(data);

      if (data?.comite_detectado && !comiteNombre) {
        setComiteNombre(data.comite_detectado);
      }
      if (data?.comuna_detectada && !comuna) {
        setComuna(data.comuna_detectada);
      }
      if (data?.codigo_expediente_detectado && !codigoExpediente) {
        setCodigoExpediente(data.codigo_expediente_detectado);
      }

      // Inicializar datos del predio
      if (data?.terreno_detectado) {
        if (!terrenoCalle) setTerrenoCalle(data.terreno_detectado.calle || "");
        if (!terrenoRol) setTerrenoRol(data.terreno_detectado.rol_sii || "");
        if (!terrenoLote) setTerrenoLote(data.terreno_detectado.lote || "");
        if (!terrenoLocalidad) setTerrenoLocalidad(data.terreno_detectado.localidad || data.comuna_detectada || "");
      }
    } catch (err) {
      console.error("Error al analizar Excel:", err);
      let mensaje = "No se pudo procesar la planilla Excel. Verifica que tenga una hoja con los postulantes.";
      if (err.response?.status === 404) {
        mensaje = "El backend en la nube (Render) se encuentra desplegando la actualización del módulo Ecobarrios. Por favor espera 1 a 2 minutos y vuelve a presionar 'Seleccionar Excel'.";
      } else if (err.response?.status === 502 || err.response?.status === 504) {
        mensaje = "El servidor en la nube de Render está despertando (modo ahorro de energía). Por favor espera 30 segundos y vuelve a presionar 'Seleccionar Excel'.";
      } else if (err.response?.data?.error) {
        mensaje = err.response.data.error;
      } else if (typeof err.response?.data === "string" && err.response.data.includes("502")) {
        mensaje = "El servidor en la nube está despertando. Por favor espera 30 segundos y reintenta.";
      } else if (err.userFriendlyMessage) {
        mensaje = err.userFriendlyMessage;
      } else if (err.message) {
        mensaje = err.message;
      }
      setErrorMsg(mensaje);
    } finally {
      setAnalizando(false);
    }
  };

  // Redactar Textos Técnicos con IA Gemini / Motor Experto
  const handleRedactarConIA = async () => {
    if (!analisis) return;
    setRedactandoIA(true);
    setErrorMsg("");

    const payload = {
      comite_nombre: comiteNombre || analisis.comite_detectado,
      comuna: comuna || analisis.comuna_detectada,
      codigo_expediente: codigoExpediente || analisis.codigo_expediente_detectado,
      total_familias: analisis.total_familias,
      total_personas: analisis.total_personas,
      conadi: analisis.conadi,
      familias_mapuche: analisis.familias_conadi,
      pct_mapuche: analisis.pct_conadi,
      discapacidad: analisis.discapacidad,
      familias_con_discapacidad: analisis.familias_discapacidad,
      viviendas_3d: analisis.viviendas_3d,
      recintos_bodega: analisis.recintos_bodega || 0,
      recintos_productivo: analisis.recintos_productivo || 1,
      // Preguntas y configuración técnica
      agua_potable: aguaPotable,
      alcantarillado: alcantarillado,
      electricidad: electricidad,
      terreno_calle: terrenoCalle || analisis.terreno_detectado?.calle,
      terreno_rol: terrenoRol || analisis.terreno_detectado?.rol_sii,
      terreno_lote: terrenoLote || "Lote Proyecto",
      terreno_localidad: terrenoLocalidad || comuna || analisis.comuna_detectada,
      topografia: topografia,
      riesgos: riesgos,
      enfoque_social: enfoqueSocial,
    };

    try {
      const res = await api.post("/ecobarrios/redactar-at6-ia/", payload);
      setObsServiciosBasicos(res.data.obs_servicios_basicos || "");
      setRiesgosNaturales(res.data.riesgos_naturales || "");
      setOpinionProfesional(res.data.opinion_profesional || "");
      setFuenteRedaccion(res.data.fuente || "experto_local");
    } catch (err) {
      console.error("Error al redactar con IA:", err);
      setErrorMsg("No se pudo generar la redacción automática con IA. Puedes escribir o ajustar los textos manualmente.");
    } finally {
      setRedactandoIA(false);
    }
  };

  // Descarga instantánea de un documento individual (.docx)
  const handleDescargarIndividual = async (tipo, rut = null, defaultName = "documento.docx") => {
    if (!archivo) return;
    const docKey = rut || tipo;
    setDescargandoDoc(docKey);
    setErrorMsg("");

    const formData = new FormData();
    formData.append("archivo", archivo);
    formData.append("tipo", tipo);
    if (rut) formData.append("rut", rut);
    formData.append("comite_nombre", comiteNombre);
    formData.append("codigo_expediente", codigoExpediente);
    formData.append("comuna", comuna);
    formData.append("egr_nombre", egrNombre);
    formData.append("egr_rut", egrRut);
    formData.append("arquitecto", arquitecto);
    formData.append("trabajador_social", trabajadorSocial);
    formData.append("abogado", abogado);

    // Datos del terreno
    formData.append("terreno_calle", terrenoCalle);
    formData.append("terreno_rol", terrenoRol);
    formData.append("terreno_lote", terrenoLote);
    formData.append("terreno_localidad", terrenoLocalidad);

    // Textos personalizados AT-6
    formData.append("obs_servicios_basicos", obsServiciosBasicos);
    formData.append("riesgos_naturales", riesgosNaturales);
    formData.append("opinion_profesional", opinionProfesional);

    try {
      const res = await api.post("/ecobarrios/documento-individual/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        responseType: "blob",
        timeout: 60000,
      });

      let filename = defaultName;
      const disposition = res.headers?.["content-disposition"] || res.headers?.["Content-Disposition"];
      if (disposition && disposition.includes("filename=")) {
        const match = disposition.match(/filename="?([^";]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(`Error al descargar documento (${tipo}):`, err);
      let mensaje = `Error al generar documento ${tipo}. Revisa la consola o intenta nuevamente.`;
      if (err.response?.data?.error) {
        mensaje = err.response.data.error;
      } else if (err.message) {
        mensaje = err.message;
      }
      setErrorMsg(mensaje);
    } finally {
      setDescargandoDoc(null);
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

    // Datos del terreno y textos AT-6
    formData.append("terreno_calle", terrenoCalle);
    formData.append("terreno_rol", terrenoRol);
    formData.append("terreno_lote", terrenoLote);
    formData.append("terreno_localidad", terrenoLocalidad);
    formData.append("obs_servicios_basicos", obsServiciosBasicos);
    formData.append("riesgos_naturales", riesgosNaturales);
    formData.append("opinion_profesional", opinionProfesional);

    try {
      const res = await api.post("/ecobarrios/generar/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        responseType: "blob",
        timeout: 300000,
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      const slug = (comiteNombre || "Comite").replace(/[^a-zA-Z0-9]/g, "_");
      link.setAttribute("download", `Expediente_${slug}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error al generar expediente:", err);
      let mensaje = "Ocurrió un error al compilar los documentos. Revisa la consola o intenta nuevamente.";
      if (err.response?.status === 502 || err.response?.status === 504) {
        mensaje = "La generación del ZIP completo tomó más tiempo que el límite del servidor. Puedes descargar los documentos individuales al instante con los botones de abajo o reintentar.";
      }
      setErrorMsg(mensaje);
    } finally {
      setGenerando(false);
    }
  };

  const postulantesFiltrados = (analisis?.postulantes || []).filter((p) => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return p.nombre?.toLowerCase().includes(q) || p.rut?.toLowerCase().includes(q);
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

        {/* Acciones Rápidas */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDescargarPlantilla}
            disabled={descargandoPlantilla}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 shadow-2xs transition disabled:opacity-50"
            title="Descargar plantilla oficial estandarizada en formato Excel (.xlsx)"
          >
            {descargandoPlantilla ? (
              <Loader2 size={13} className="animate-spin text-emerald-700" />
            ) : (
              <Download size={13} className="text-emerald-700" />
            )}
            Plantilla Modelo (.xlsx)
          </button>

          <button
            type="button"
            onClick={() => setMostrarModalGuia(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-2xs transition"
            title="Ver guía y nombres de columnas oficiales requeridas"
          >
            <BookOpen size={13} className="text-slate-500" />
            Guía de Columnas
          </button>

          <button
            type="button"
            onClick={handleNuevoEcobarrio}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-2xs transition"
            title="Limpiar formulario para procesar un nuevo comité o Ecobarrio"
          >
            <RotateCcw size={13} className="text-slate-500" />
            Nuevo / Limpiar
          </button>
        </div>
      </div>

      {/* ÁREA DE TRABAJO */}
      <div className="space-y-5">
        {/* PASO 1: CARGA DE BASE EXCEL Y DIAGNÓSTICO DE COLUMNAS */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <FileSpreadsheet size={15} className="text-emerald-600" />
              1. Carga de Base Excel de Postulantes (.xlsx, .xlsm)
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMostrarModalGuia(true)}
                className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
              >
                <HelpCircle size={12} /> Ver estructura de columnas requeridas
              </button>
              {archivo && (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-600/20">
                  <CheckCircle2 size={12} /> Archivo cargado
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50/50 p-6 text-center hover:bg-slate-50 transition">
            <FileSpreadsheet size={36} className="text-emerald-600 mb-2" />
            <p className="text-xs font-semibold text-slate-800">
              {archivo
                ? archivo.name
                : "Arrastra aquí la planilla Excel (.xlsx, .xlsm) del nuevo comité o selecciónala"}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5 max-w-md">
              Detecta automáticamente RUTs, nombres, comuna, composición familiar, RSH, CONADI, discapacidad y 3er dormitorio.
            </p>

            <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-slate-900 px-4 py-2 text-xs font-medium text-white shadow-2xs hover:bg-slate-800 transition">
                <Upload size={13} />
                Seleccionar Excel
                <input
                  id="input-excel-ecobarrios"
                  type="file"
                  accept=".xlsx,.xls,.xlsm"
                  onChange={handleArchivoChange}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleDescargarPlantilla}
                disabled={descargandoPlantilla}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 shadow-2xs transition disabled:opacity-50"
              >
                <Download size={13} className="text-emerald-600" />
                Descargar Plantilla Vacía
              </button>
            </div>
          </div>

          {analizando && (
            <div className="flex items-center justify-center gap-2 py-4 text-xs font-medium text-slate-600">
              <Loader2 size={16} className="animate-spin text-emerald-600" />
              Analizando estructura de columnas y calculando métricas D.S. 10...
            </div>
          )}

          {errorMsg && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 ring-1 ring-rose-200">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Panel de Diagnóstico Visual de Columnas Estandarizadas */}
          {analisis?.diagnostico_columnas && (
            <div className="mt-4 pt-4 border-t border-slate-200/80 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${
                      analisis.diagnostico_columnas.es_valida
                        ? "bg-emerald-50 text-emerald-800 ring-emerald-600/30"
                        : "bg-rose-50 text-rose-800 ring-rose-600/30"
                    }`}
                  >
                    {analisis.diagnostico_columnas.es_valida ? (
                      <CheckCircle2 size={13} className="text-emerald-600" />
                    ) : (
                      <AlertCircle size={13} className="text-rose-600" />
                    )}
                    {analisis.diagnostico_columnas.porcentaje_compatibilidad}% Compatibilidad con Estándar D.S. 10
                  </span>
                  <span className="text-[11px] text-slate-500">
                    ({analisis.diagnostico_columnas.total_detectadas} de {analisis.diagnostico_columnas.total_estandar} columnas reconocidas)
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setMostrarModalGuia(true)}
                  className="text-[11px] font-medium text-slate-600 hover:text-slate-900 hover:underline flex items-center gap-1"
                >
                  <Info size={12} /> Ver tabla completa de columnas
                </button>
              </div>

              {/* Chips de Columnas Identificadas */}
              <div className="flex flex-wrap gap-1.5">
                {analisis.diagnostico_columnas.columnas_detectadas?.map((c) => (
                  <span
                    key={c.campo}
                    className="inline-flex items-center gap-1 rounded bg-slate-100 hover:bg-slate-200/80 text-slate-700 px-2 py-0.5 text-[10px] font-mono transition"
                    title={`Columna detectada en el Excel en posición ${c.columna}`}
                  >
                    <Check size={11} className="text-emerald-600 font-bold" />
                    <span className="font-sans font-medium text-slate-800">{c.label}</span>
                    <span className="text-slate-400 font-bold">({c.columna})</span>
                  </span>
                ))}
              </div>

              {/* Sugerencias o Columnas Faltantes */}
              {analisis.diagnostico_columnas.sugerencias?.map((sug, i) => (
                <p key={i} className="text-[11px] text-slate-600 italic">
                  💡 {sug}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* PASO 2: DATOS DEL PROYECTO Y EQUIPO PROFESIONAL (COLAPSABLE / LIMPIO) */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs transition">
          <button
            type="button"
            onClick={() => setMostrarParametros(!mostrarParametros)}
            className="w-full flex items-center justify-between p-4 bg-slate-50/60 hover:bg-slate-50 transition text-left"
          >
            <div className="flex items-center gap-2.5">
              <SlidersHorizontal size={15} className="text-slate-600" />
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-800">
                  2. Identificación del Proyecto y Equipo Profesional (Opcional)
                </h2>
                <p className="text-[11px] text-slate-500">
                  {comiteNombre || comuna
                    ? `Proyecto: ${comiteNombre || "Sin nombre"} · Comuna: ${comuna || "Sin comuna"}`
                    : "Campos limpios para nuevo Ecobarrio · Haz clic para personalizar nombres o autocompletar"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-slate-600 hidden sm:inline">
                {mostrarParametros ? "Ocultar campos" : "Configurar nombres"}
              </span>
              {mostrarParametros ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
            </div>
          </button>

          {mostrarParametros && (
            <div className="p-5 border-t border-slate-200/80 space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <span className="text-[11px] text-slate-500">
                  Configura los datos del comité para las carátulas y firmas de los informes oficiales:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCargarValoresPlanSocial}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 hover:text-emerald-800 hover:underline"
                  >
                    <Sparkles size={12} /> Autocompletar EGR Consultora Plan Social
                  </button>
                  <span className="text-slate-300">·</span>
                  <button
                    type="button"
                    onClick={handleLimpiarParametros}
                    className="text-[11px] font-medium text-slate-500 hover:text-slate-800 hover:underline"
                  >
                    Limpiar campos
                  </button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Nombre del Comité / Proyecto</label>
                  <input
                    type="text"
                    value={comiteNombre}
                    onChange={(e) => setComiteNombre(e.target.value)}
                    placeholder="Ej: Comité de Vivienda Ecobarrio..."
                    className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Comuna</label>
                  <input
                    type="text"
                    value={comuna}
                    onChange={(e) => setComuna(e.target.value)}
                    placeholder="Ej: Loncoche / Perquenco"
                    className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Código Expediente RUKAN</label>
                  <input
                    type="text"
                    value={codigoExpediente}
                    onChange={(e) => setCodigoExpediente(e.target.value)}
                    placeholder="Ej: 42005 o En trámite"
                    className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Entidad de Gestión Rural (EGR)</label>
                  <input
                    type="text"
                    value={egrNombre}
                    onChange={(e) => setEgrNombre(e.target.value)}
                    placeholder="Ej: CONSULTORA PLAN SOCIAL LIMITADA"
                    className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">RUT Entidad EGR</label>
                  <input
                    type="text"
                    value={egrRut}
                    onChange={(e) => setEgrRut(e.target.value)}
                    placeholder="Ej: 77.235.354-5"
                    className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Arquitecta Responsable</label>
                  <input
                    type="text"
                    value={arquitecto}
                    onChange={(e) => setArquitecto(e.target.value)}
                    placeholder="Nombre de la Arquitecta"
                    className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Trabajadora Social Responsable</label>
                  <input
                    type="text"
                    value={trabajadorSocial}
                    onChange={(e) => setTrabajadorSocial(e.target.value)}
                    placeholder="Nombre de la Trabajadora Social"
                    className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Abogado Responsable</label>
                  <input
                    type="text"
                    value={abogado}
                    onChange={(e) => setAbogado(e.target.value)}
                    placeholder="Nombre del Abogado"
                    className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PASO 3: CONFIGURACIÓN TÉCNICA Y PREGUNTAS CLAVE AT-6 CON ASISTENTE IA GEMINI */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs transition">
          <button
            type="button"
            onClick={() => setMostrarSeccionAT6(!mostrarSeccionAT6)}
            className="w-full flex items-center justify-between p-4 bg-slate-50/60 hover:bg-slate-50 transition text-left"
          >
            <div className="flex items-center gap-2.5">
              <Sparkles size={16} className="text-indigo-600" />
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <span>3. Configuración Técnica y Preguntas Clave para el AT-6 (Diagnóstico Social)</span>
                  <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700 ring-1 ring-indigo-600/20">
                    Asistente IA Gemini
                  </span>
                </h2>
                <p className="text-[11px] text-slate-500">
                  Dota de información técnica y social al formulario antes de descargarlo · Genera con 1 clic las Tablas 26, 30 y 31
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-indigo-700 hidden sm:inline">
                {mostrarSeccionAT6 ? "Ocultar preguntas" : "Completar preguntas clave"}
              </span>
              {mostrarSeccionAT6 ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
            </div>
          </button>

          {mostrarSeccionAT6 && (
            <div className="p-5 border-t border-slate-200/80 space-y-5 animate-in fade-in duration-200">
              {/* Bloque 1: Predio y Terreno */}
              <div>
                <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Home size={14} className="text-slate-600" />
                  A. Identificación del Predio / Terreno del Proyecto
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Calle / Camino / Sector</label>
                    <input
                      type="text"
                      value={terrenoCalle}
                      onChange={(e) => setTerrenoCalle(e.target.value)}
                      placeholder="Ej: Sector La Hacienda, Camino Público Km 3"
                      className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">N° Rol de Avalúo SII</label>
                    <input
                      type="text"
                      value={terrenoRol}
                      onChange={(e) => setTerrenoRol(e.target.value)}
                      placeholder="Ej: 154-12 o En trámite"
                      className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Lote / Hijuela</label>
                    <input
                      type="text"
                      value={terrenoLote}
                      onChange={(e) => setTerrenoLote(e.target.value)}
                      placeholder="Ej: Lote A-1 o Lote Proyecto"
                      className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Localidad / Sector</label>
                    <input
                      type="text"
                      value={terrenoLocalidad}
                      onChange={(e) => setTerrenoLocalidad(e.target.value)}
                      placeholder="Ej: Loncoche / Perquenco"
                      className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Bloque 2: Soluciones Sanitarias y Eléctricas (Tabla 26) */}
              <div className="pt-3 border-t border-slate-100">
                <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Wrench size={14} className="text-slate-600" />
                  B. Solución de Servicios Básicos (Tabla 26)
                </h3>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Solución de Agua Potable</label>
                    <select
                      value={aguaPotable}
                      onChange={(e) => setAguaPotable(e.target.value)}
                      className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-slate-800 focus:outline-hidden"
                    >
                      <option value="Conexión a sistema APR con factibilidad técnica aprobada y red proyectada">
                        APR con factibilidad aprobada
                      </option>
                      <option value="Conexión a red pública de agua potable con medidor domiciliario">
                        Red pública de agua potable
                      </option>
                      <option value="Sistema particular normativo de captación y potabilización según NCh 409">
                        Captación propia normada NCh 409
                      </option>
                      <option value="Abastecimiento comunitario rural con cloración y estanque de regulación">
                        Abastecimiento rural comunitario
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Alcantarillado / Aguas Servidas</label>
                    <select
                      value={alcantarillado}
                      onChange={(e) => setAlcantarillado(e.target.value)}
                      className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-slate-800 focus:outline-hidden"
                    >
                      <option value="Sistema individual de fosa séptica con cámara desgrasadora y drenes de absorción">
                        Fosa séptica con drenes de infiltración
                      </option>
                      <option value="Conexión a red pública de alcantarillado con unión domiciliaria">
                        Red pública de alcantarillado
                      </option>
                      <option value="Sistema particular de alcantarillado con planta de tratamiento autorizada por Seremi de Salud">
                        Planta de tratamiento particular Seremi
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Suministro de Electricidad</label>
                    <select
                      value={electricidad}
                      onChange={(e) => setElectricidad(e.target.value)}
                      className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-slate-800 focus:outline-hidden"
                    >
                      <option value="Conexión a red aérea de distribución eléctrica monofásica (empresa concesionaria) con empalme SEC">
                        Red aérea concesionaria (CGE / Frontel)
                      </option>
                      <option value="Ampliación de red de baja tensión existente con empalmes monofásicos individuales certificados SEC">
                        Ampliación de red existente con empalme SEC
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Bloque 3: Topografía, Riesgos y Enfoque Social */}
              <div className="pt-3 border-t border-slate-100">
                <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <TreePine size={14} className="text-slate-600" />
                  C. Topografía, Riesgos Naturales (Tabla 30) y Enfoque Social (Tabla 31)
                </h3>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Topografía y Pendiente</label>
                    <select
                      value={topografia}
                      onChange={(e) => setTopografia(e.target.value)}
                      className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-slate-800 focus:outline-hidden"
                    >
                      <option value="terreno plano con pendiente inferior al 3%, apto para fundación">
                        Terreno plano (0 a 3% pendiente)
                      </option>
                      <option value="terreno con pendiente suave (3% a 8%) y suelo firme estabilizado">
                        Pendiente suave (3% a 8%)
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Riesgos Naturales</label>
                    <select
                      value={riesgos}
                      onChange={(e) => setRiesgos(e.target.value)}
                      className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-slate-800 focus:outline-hidden"
                    >
                      <option value="libre de riesgos de remoción en masa, derrumbes, aluviones o inundaciones fluviales">
                        Libre de inundación y remoción en masa
                      </option>
                      <option value="emplazado en cota segura fuera de áreas de restricción y cauces naturales">
                        Cota segura fuera de cauces naturales
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Enfoque Social Prioritario</label>
                    <select
                      value={enfoqueSocial}
                      onChange={(e) => setEnfoqueSocial(e.target.value)}
                      className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-slate-800 focus:outline-hidden"
                    >
                      <option value="superación de la vulnerabilidad socioeconómica y condiciones de allegamiento rural">
                        Superación de allegamiento y vulnerabilidad
                      </option>
                      <option value="preservación de la identidad comunitaria, pertenencia Mapuche y resguardo productivo rural">
                        Identidad Mapuche y resguardo productivo
                      </option>
                      <option value="atención integral a hogares monoparentales y personas con discapacidad">
                        Hogares monoparentales y discapacidad
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Botón de Generación Asistida con IA */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-indigo-50/50 p-3.5 rounded-lg border border-indigo-100">
                <div>
                  <div className="text-xs font-semibold text-indigo-900 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-indigo-600" />
                    Asistente Inteligente de Redacción SERVIU (Gemini IA)
                  </div>
                  <p className="text-[11px] text-indigo-700/80 mt-0.5">
                    Sintetiza las respuestas técnicas y la demografía del comité en los 3 textos oficiales listos para el Word.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleRedactarConIA}
                  disabled={redactandoIA || !analisis}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition"
                >
                  {redactandoIA ? (
                    <>
                      <Loader2 size={14} className="animate-spin text-white" />
                      Redactando con IA...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} className="text-amber-300" />
                      Redactar Textos Técnicos con IA
                    </>
                  )}
                </button>
              </div>

              {/* Previsualización y Edición de los 3 Textos Oficiales */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Propuestas de Texto para el Informe AT-6 (Editables antes de descargar)
                  </h4>
                  {fuenteRedaccion && (
                    <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded ring-1 ring-emerald-600/20">
                      {fuenteRedaccion === "gemini" ? "✨ Generado con Google Gemini IA" : "⚙️ Motor Experto Institucional SERVIU"}
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1 font-medium">
                      <span>Tabla 26: Observaciones de Servicios Básicos Proyectados</span>
                      <span className="text-slate-400 text-[10px]">Agua potable, alcantarillado y electricidad</span>
                    </div>
                    <textarea
                      rows={3}
                      value={obsServiciosBasicos}
                      onChange={(e) => setObsServiciosBasicos(e.target.value)}
                      placeholder="Presiona 'Redactar Textos Técnicos con IA' o escribe aquí las observaciones de servicios básicos..."
                      className="w-full rounded-md border border-slate-300 p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1 font-medium">
                      <span>Tabla 30: Riesgos Naturales y Emplazamiento Seguro del Predio</span>
                      <span className="text-slate-400 text-[10px]">Topografía, pendiente y ausencia de riesgos</span>
                    </div>
                    <textarea
                      rows={3}
                      value={riesgosNaturales}
                      onChange={(e) => setRiesgosNaturales(e.target.value)}
                      placeholder="Presiona 'Redactar Textos Técnicos con IA' o escribe aquí la certificación de riesgos naturales..."
                      className="w-full rounded-md border border-slate-300 p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1 font-medium">
                      <span>Tabla 31: Opinión Profesional y Conclusión Social de la EGR</span>
                      <span className="text-slate-400 text-[10px]">Diagnóstico social, tipologías 3D y recintos productivos</span>
                    </div>
                    <textarea
                      rows={4}
                      value={opinionProfesional}
                      onChange={(e) => setOpinionProfesional(e.target.value)}
                      placeholder="Presiona 'Redactar Textos Técnicos con IA' o escribe aquí la conclusión profesional y social..."
                      className="w-full rounded-md border border-slate-300 p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PASO 4: MÉTRICAS Y DESCARGA OFICIAL */}
        {analisis && (
          <div className="space-y-5 animate-in fade-in duration-300">
            {/* Tarjetas de Métricas Cuadradas */}
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
                  Familias CONADI: <strong className="text-slate-800">{analisis.familias_conadi}</strong> ({analisis.pct_conadi}%)
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

            {/* Botonera de Descarga Principal y Documentos Individuales */}
            <div className="rounded-xl bg-slate-900 p-5 text-white shadow-md space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Download size={16} className="text-emerald-400" />
                    Descarga de Documentación Oficial D.S. N° 10
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Descarga individual instantánea (&lt; 1 seg) con redacción oficial incorporada o compila el paquete ZIP completo con las carpetas de expedientes.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleGenerarExpediente}
                  disabled={generando || descargandoDoc !== null}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-sm hover:bg-emerald-400 disabled:opacity-50 transition"
                >
                  {generando ? (
                    <>
                      <Loader2 size={15} className="animate-spin" /> Compilando ZIP ({analisis.total_familias} expedientes)...
                    </>
                  ) : (
                    <>
                      <FolderArchive size={15} /> Descargar Expediente Completo (ZIP)
                    </>
                  )}
                </button>
              </div>

              {/* Accesos rápidos individuales */}
              <div className="pt-3 border-t border-slate-800 grid gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => handleDescargarIndividual("at6", null, "14. AT-6_Diagnostico_Social_Consolidado.docx")}
                  disabled={descargandoDoc === "at6" || generando}
                  className="flex items-center justify-between rounded-lg bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 px-3 py-2 text-xs text-slate-200 transition disabled:opacity-50"
                >
                  <div className="flex items-center gap-2 text-left">
                    <FileText size={15} className="text-indigo-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-[11px] text-white">Informe AT-6 (.docx)</div>
                      <div className="text-[10px] text-slate-400">Diagnóstico Social con textos técnicos</div>
                    </div>
                  </div>
                  {descargandoDoc === "at6" ? (
                    <Loader2 size={14} className="animate-spin text-indigo-400" />
                  ) : (
                    <ArrowDownToLine size={14} className="text-slate-400" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleDescargarIndividual("nomina", null, "4. NOMINA_Oficial_Postulantes.docx")}
                  disabled={descargandoDoc === "nomina" || generando}
                  className="flex items-center justify-between rounded-lg bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 px-3 py-2 text-xs text-slate-200 transition disabled:opacity-50"
                >
                  <div className="flex items-center gap-2 text-left">
                    <Users size={15} className="text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-[11px] text-white">Nómina Oficial (.docx)</div>
                      <div className="text-[10px] text-slate-400">Padrón 1 a N alfabético</div>
                    </div>
                  </div>
                  {descargandoDoc === "nomina" ? (
                    <Loader2 size={14} className="animate-spin text-emerald-400" />
                  ) : (
                    <ArrowDownToLine size={14} className="text-slate-400" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleDescargarIndividual("compromiso", null, "3. COMPROMISO_Profesionales.docx")}
                  disabled={descargandoDoc === "compromiso" || generando}
                  className="flex items-center justify-between rounded-lg bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 px-3 py-2 text-xs text-slate-200 transition disabled:opacity-50"
                >
                  <div className="flex items-center gap-2 text-left">
                    <CheckCircle2 size={15} className="text-amber-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-[11px] text-white">Compromiso (.docx)</div>
                      <div className="text-[10px] text-slate-400">Declaración de Profesionales</div>
                    </div>
                  </div>
                  {descargandoDoc === "compromiso" ? (
                    <Loader2 size={14} className="animate-spin text-amber-400" />
                  ) : (
                    <ArrowDownToLine size={14} className="text-slate-400" />
                  )}
                </button>
              </div>
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
                      <th className="py-2.5 px-3 text-right">Formulario 6.1</th>
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
                        <td className="py-2 px-3 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              handleDescargarIndividual(
                                "phr61",
                                p.rut || p.n,
                                `PHR_6.1_${String(p.rut || p.n).replace(/[^a-zA-Z0-9]/g, "_")}.docx`
                              )
                            }
                            disabled={descargandoDoc === (p.rut || p.n) || generando}
                            className="inline-flex items-center gap-1 rounded-md bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-700 transition disabled:opacity-50"
                            title={`Descargar Formulario 6.1 para ${p.nombre}`}
                          >
                            {descargandoDoc === (p.rut || p.n) ? (
                              <>
                                <Loader2 size={11} className="animate-spin text-emerald-600" />
                                <span>Descargando...</span>
                              </>
                            ) : (
                              <>
                                <ArrowDownToLine size={11} className="text-slate-500" />
                                <span>F. 6.1 (.docx)</span>
                              </>
                            )}
                          </button>
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

      {/* MODAL: GUÍA DE COLUMNAS OFICIALES D.S. 10 / RUKAN */}
      {mostrarModalGuia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header del Modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20">
                  <BookOpen size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Guía Oficial de Columnas para Nóminas de Comités D.S. N° 10
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Estandarización requerida por MINVU / SERVIU para reconocimiento automático y generación de expedientes
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDescargarPlantilla}
                  disabled={descargandoPlantilla}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 text-xs font-semibold shadow-2xs transition disabled:opacity-50"
                >
                  <Download size={13} />
                  Descargar Plantilla (.xlsx)
                </button>

                <button
                  type="button"
                  onClick={() => setMostrarModalGuia(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Contenido Tabla */}
            <div className="overflow-y-auto p-6 space-y-4">
              <div className="rounded-lg bg-blue-50/70 p-3 border border-blue-200/60 text-xs text-blue-900 flex items-start gap-2.5">
                <Info size={16} className="text-blue-700 shrink-0 mt-0.5" />
                <div>
                  <strong>Recomendación para el Equipo Humano:</strong> Puedes nombrar las columnas en mayúsculas o minúsculas. El sistema cuenta con inteligencia semántica de alias para reconocer sinónimos (ej: <code>RUN</code> por <code>RUT</code>, o <code>CANT GRUPO FAM</code> por <code>GRUP FAM</code>), pero usar la plantilla modelo garantiza 100% de precisión sin margen de error.
                </div>
              </div>

              <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-100/80 text-[11px] font-semibold text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Columna</th>
                    <th className="py-2.5 px-3 text-center">Obligatoriedad</th>
                    <th className="py-2.5 px-3">Formato / Valores Esperados</th>
                    <th className="py-2.5 px-3">Impacto en RUKAN / D.S. 10</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {GUIA_COLUMNAS_DATA.map((row) => (
                    <tr key={row.col} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-900 text-[11px]">
                        {row.col}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold ${
                            row.tipo === "OBLIGATORIA"
                              ? "bg-rose-50 text-rose-700 ring-1 ring-rose-600/30"
                              : row.tipo === "Recomendada"
                              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/30"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {row.tipo}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 font-mono text-[11px]">
                        {row.formato}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 text-[11px] leading-relaxed">
                        {row.desc}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer del Modal */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-slate-50/70">
              <span className="text-[11px] text-slate-500">
                Basado en Resolución N° 3131 y D.S. N° 10 (V. y U.) de Habitabilidad Rural
              </span>
              <button
                type="button"
                onClick={() => setMostrarModalGuia(false)}
                className="rounded-lg bg-slate-900 hover:bg-slate-800 text-white px-4 py-1.5 text-xs font-semibold shadow-2xs transition"
              >
                Entendido / Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
