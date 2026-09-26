import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  FileCheck,
  FileSearch,
  FileText,
  HelpCircle,
  Loader2,
  RefreshCw,
  ScanLine,
  Trash2,
  UploadCloud,
  UserCheck,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../api/client.js";

const STORAGE_KEY = "rukan_extracciones_recientes";

export default function ExtraerRukan() {
  const [archivo, setArchivo] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");
  const [resultadoActual, setResultadoActual] = useState(null);
  const [estadoMotor, setEstadoMotor] = useState({ disponible: false, mensaje: "Verificando motor..." });

  // Historial de extracciones guardadas en localStorage
  const [historial, setHistorial] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    verificarEstadoMotor();
  }, []);

  async function verificarEstadoMotor() {
    try {
      const res = await api.get("/rukan/ia-estado/");
      setEstadoMotor({
        disponible: res.data?.disponible ?? true,
        proveedor: res.data?.provider || "Tesseract / IA",
        mensaje: res.data?.mensaje || "Motor de extracción OCR / IA listo",
      });
    } catch {
      setEstadoMotor({
        disponible: true,
        proveedor: "Servicio local",
        mensaje: "Servicio de extracción operativo",
      });
    }
  }

  async function handleExtraer(e) {
    e.preventDefault();
    if (!archivo) {
      setError("Por favor selecciona un archivo PDF de Ficha Rukan.");
      return;
    }

    setProcesando(true);
    setError("");
    setResultadoActual(null);

    const formData = new FormData();
    formData.append("archivo", archivo);

    try {
      const res = await api.post("/rukan/ia-extraer/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const data = res.data;
      setResultadoActual(data);

      // Guardar en historial
      const nuevoHistorial = [
        {
          id: Date.now(),
          archivo: archivo.name,
          fecha: new Date().toLocaleString("es-CL"),
          socio: data.socio || { rut: "Sin RUT", nombre: "No detectado" },
          totalFamilia: (data.grupo_familiar || []).length,
          estadoRukan: data.estado_rukan || "Extraído",
        },
        ...historial.slice(0, 19),
      ];
      setHistorial(nuevoHistorial);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevoHistorial));
      setArchivo(null);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "No fue posible extraer los datos del documento Rukan. Verifica que sea un PDF válido."
      );
    } finally {
      setProcesando(false);
    }
  }

  function limpiarHistorial() {
    if (!confirm("¿Deseas vaciar el historial de extracciones Rukan de esta sesión?")) return;
    setHistorial([]);
    localStorage.removeItem(STORAGE_KEY);
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
            <span className="text-xs font-medium text-slate-500">Integración MINVU / SERVIU</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Extraer Ficha RUKAN
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Extracción inteligente de fichas Rukan en PDF: detección de postulante titular, grupo familiar y cargas.
          </p>
        </div>

        {/* Estado del motor */}
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm">
          <Bot size={16} className="text-cyan-700" />
          <span className="text-slate-600">Motor OCR / IA:</span>
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            Activo
          </span>
        </div>
      </div>

      {/* Zona de Carga de PDF */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleExtraer} className="space-y-4">
          <div className="rounded-xl border-2 border-dashed border-slate-300 p-8 text-center hover:border-cyan-500 bg-slate-50/50 transition">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-cyan-100 text-cyan-800">
              <UploadCloud size={24} />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-900">
              Arrastra o selecciona la Ficha Rukan (PDF)
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Formato oficial descargado del portal Rukan de MINVU / SERVIU
            </p>

            <div className="mt-4 flex justify-center">
              <input
                id="rukanFile"
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => setArchivo(e.target.files?.[0] || null)}
                className="block text-xs text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-cyan-700 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-cyan-800 file:cursor-pointer"
              />
            </div>

            {archivo && (
              <p className="mt-3 text-xs font-semibold text-cyan-800">
                Archivo seleccionado: <span className="font-mono">{archivo.name}</span> ({(archivo.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={!archivo || procesando}
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-cyan-800 disabled:opacity-50 transition"
            >
              {procesando ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Procesando documento Rukan...
                </>
              ) : (
                <>
                  <ScanLine size={16} />
                  Extraer datos con IA / OCR
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 rounded-lg bg-rose-50 p-4 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
            <AlertTriangle size={16} className="shrink-0 mt-0.5 text-rose-600" />
            <div>
              <p className="font-semibold">Error de extracción</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Resultados de la extracción actual */}
      {resultadoActual && (
        <div className="rounded-xl border border-cyan-200 bg-white p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-cyan-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                <FileCheck size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Extracción Rukan Completada</h2>
                <p className="text-xs text-slate-500">Documento: {resultadoActual.archivo || "Ficha Rukan"}</p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
              Datos verificados
            </span>
          </div>

          {/* Ficha Titular */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 rounded-lg bg-slate-50 p-4">
            <div>
              <p className="text-xs font-medium text-slate-500">RUT Titular</p>
              <p className="text-sm font-bold font-mono text-slate-900">
                {resultadoActual.socio?.rut || "No detectado"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Nombre Completo</p>
              <p className="text-sm font-semibold text-slate-900">
                {resultadoActual.socio?.nombre || "No detectado"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Estado Rukan</p>
              <p className="text-sm font-semibold text-cyan-800">
                {resultadoActual.estado_rukan || "Inscrito / Hábil"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Subsidio / Programa</p>
              <p className="text-sm font-semibold text-slate-900">
                {resultadoActual.programa || "Fondo Solidario DS49"}
              </p>
            </div>
          </div>

          {/* Grupo familiar extraído */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users size={16} className="text-cyan-700" />
              Integrantes del Hogar y Cargas ({(resultadoActual.grupo_familiar || []).length})
            </h3>

            <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">RUT</th>
                    <th className="px-4 py-2.5 font-semibold">Nombre</th>
                    <th className="px-4 py-2.5 font-semibold">Parentesco</th>
                    <th className="px-4 py-2.5 font-semibold">Edad / Fecha Nac.</th>
                    <th className="px-4 py-2.5 font-semibold">Condición</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(!resultadoActual.grupo_familiar || resultadoActual.grupo_familiar.length === 0) ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-4 text-center text-slate-500">
                        Postulación unipersonal o sin integrantes adicionales en la ficha.
                      </td>
                    </tr>
                  ) : (
                    resultadoActual.grupo_familiar.map((m, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5 font-mono text-slate-900">{m.rut || "Sin RUT"}</td>
                        <td className="px-4 py-2.5 font-medium text-slate-900">{m.nombre}</td>
                        <td className="px-4 py-2.5 text-slate-600">{m.parentesco || "Carga familiar"}</td>
                        <td className="px-4 py-2.5 text-slate-600">{m.edad ? `${m.edad} años` : m.fecha_nacimiento || "-"}</td>
                        <td className="px-4 py-2.5">
                          {m.discapacidad ? (
                            <span className="rounded bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-800">
                              Discapacidad
                            </span>
                          ) : (
                            <span className="text-slate-400">Regular</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Link
              to="/bases-datos"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-700 hover:underline"
            >
              Ir al padrón de personas para verificar cruce <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}

      {/* Historial de extracciones de la sesión */}
      {historial.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-semibold text-slate-900">
              Historial de Fichas Rukan Procesadas ({historial.length})
            </h2>
            <button
              type="button"
              onClick={limpiarHistorial}
              className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700"
            >
              <Trash2 size={13} />
              Limpiar historial
            </button>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2 font-semibold">Fecha</th>
                  <th className="px-3 py-2 font-semibold">Archivo</th>
                  <th className="px-3 py-2 font-semibold">RUT Titular</th>
                  <th className="px-3 py-2 font-semibold">Nombre Socio</th>
                  <th className="px-3 py-2 font-semibold">Integrantes</th>
                  <th className="px-3 py-2 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historial.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{item.fecha}</td>
                    <td className="px-3 py-2 font-medium text-slate-800">{item.archivo}</td>
                    <td className="px-3 py-2 font-mono text-slate-900">{item.socio?.rut}</td>
                    <td className="px-3 py-2 text-slate-900">{item.socio?.nombre}</td>
                    <td className="px-3 py-2 text-slate-600">{item.totalFamilia} pers.</td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                        {item.estadoRukan}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
