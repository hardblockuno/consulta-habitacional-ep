import {
  Activity,
  CheckCircle2,
  Cpu,
  Database,
  KeyRound,
  RefreshCw,
  Server,
  Shield,
  ShieldAlert,
  UserCheck,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import Section from "../components/Section.jsx";
import StatCard from "../components/StatCard.jsx";
import { ErrorState, LoadingState } from "../components/StateViews.jsx";

export default function AdminSoporte() {
  const [diagnostico, setDiagnostico] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [guardandoUsuarioId, setGuardandoUsuarioId] = useState(null);
  const [mensajeExito, setMensajeExito] = useState("");

  // Modal o formulario de nuevo usuario
  const [mostrarCrear, setMostrarCrear] = useState(false);
  const [nuevoUser, setNuevoUser] = useState({
    email: "",
    password: "",
    nombre_completo: "",
    rol: "social",
    cargo: "",
  });

  // Modal para reseteo de contraseña
  const [resetId, setResetId] = useState(null);
  const [nuevaPassword, setNuevaPassword] = useState("");

  function cargarDatos() {
    setLoading(true);
    Promise.all([api.get("/auth/diagnostico/"), api.get("/auth/usuarios/")])
      .then(([diagRes, usersRes]) => {
        setDiagnostico(diagRes.data);
        setUsuarios(usersRes.data?.results || usersRes.data || []);
        setError("");
      })
      .catch(() => {
        setError("No fue posible cargar la información de administración. Verifica tus permisos.");
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  async function handleCambiarRol(perfilId, nuevoRol) {
    setGuardandoUsuarioId(perfilId);
    try {
      await api.patch(`/auth/usuarios/${perfilId}/`, { rol: nuevoRol });
      setUsuarios((prev) =>
        prev.map((u) => (u.id === perfilId ? { ...u, rol: nuevoRol } : u))
      );
      mostrarFeedback("Rol actualizado correctamente.");
    } catch {
      alert("Error al actualizar el rol.");
    } finally {
      setGuardandoUsuarioId(null);
    }
  }

  async function handleToggleActivo(perfilId, estadoActual) {
    setGuardandoUsuarioId(perfilId);
    try {
      await api.patch(`/auth/usuarios/${perfilId}/`, { activo: !estadoActual });
      setUsuarios((prev) =>
        prev.map((u) => (u.id === perfilId ? { ...u, activo: !estadoActual } : u))
      );
      mostrarFeedback(`Usuario ${!estadoActual ? "activado" : "desactivado"}.`);
    } catch {
      alert("Error al cambiar el estado del usuario.");
    } finally {
      setGuardandoUsuarioId(null);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    if (!resetId || nuevaPassword.length < 6) return;
    try {
      await api.post(`/auth/usuarios/${resetId}/reset_password/`, {
        nueva_password: nuevaPassword,
      });
      mostrarFeedback("Contraseña reseteada con éxito.");
      setResetId(null);
      setNuevaPassword("");
    } catch (err) {
      alert(err.response?.data?.detail || "Error al resetear contraseña.");
    }
  }

  async function handleCrearUsuario(e) {
    e.preventDefault();
    try {
      await api.post("/auth/registro/", {
        email: nuevoUser.email.trim(),
        password: nuevoUser.password,
        nombre_completo: nuevoUser.nombre_completo.trim(),
        rol: nuevoUser.rol,
        cargo: nuevoUser.cargo.trim(),
      });
      mostrarFeedback("Usuario creado con éxito.");
      setMostrarCrear(false);
      setNuevoUser({
        email: "",
        password: "",
        nombre_completo: "",
        rol: "social",
        cargo: "",
      });
      cargarDatos();
    } catch (err) {
      alert("Error al crear usuario. Verifica que el correo institucional sea válido y no esté registrado.");
    }
  }

  function mostrarFeedback(msg) {
    setMensajeExito(msg);
    setTimeout(() => setMensajeExito(""), 3500);
  }

  if (loading) return <LoadingState label="Cargando consola de soporte y administración SIGEP..." />;
  if (error) return <ErrorState message={error} />;

  const sis = diagnostico?.sistema || {};
  const stats = diagnostico?.estadisticas_globales || {};
  const ocr = diagnostico?.motor_ocr_rukan || {};

  return (
    <div className="space-y-5">
      {/* Encabezado */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-900" />
              Consola Exclusiva
            </span>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              SIGEP · Administración
            </p>
          </div>
          <h1 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
            Administración del Sistema y Soporte
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={cargarDatos}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 transition"
          >
            <RefreshCw size={13} />
            Actualizar
          </button>
          <button
            type="button"
            onClick={() => setMostrarCrear(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-white shadow-2xs hover:bg-slate-800 transition"
          >
            <UserPlus size={13} />
            Nuevo usuario
          </button>
        </div>
      </div>

      {mensajeExito && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50/80 p-2.5 text-xs text-emerald-800">
          {mensajeExito}
        </div>
      )}

      {/* Métricas Técnicas y Diagnóstico del Servidor */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-200/80 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Base de Datos</span>
            <Database size={14} className="text-slate-400" />
          </div>
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <p className="text-sm font-semibold font-mono text-slate-900 uppercase">
              {sis.base_datos || "postgres"}
            </p>
          </div>
          <p className="mt-0.5 text-[11px] text-slate-400">Conexión operativa</p>
        </div>

        <div className="rounded-lg border border-slate-200/80 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Usuarios Activos</span>
            <Users size={14} className="text-slate-400" />
          </div>
          <p className="mt-1.5 text-lg font-semibold font-mono text-slate-900">
            {stats.total_usuarios || 0}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">Cuentas registradas</p>
        </div>

        <div className="rounded-lg border border-slate-200/80 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Total Personas</span>
            <UserCheck size={14} className="text-slate-400" />
          </div>
          <p className="mt-1.5 text-lg font-semibold font-mono text-slate-900">
            {Number(stats.total_personas || 0).toLocaleString("es-CL")}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">En {stats.total_comites || 0} comités</p>
        </div>

        <div className="rounded-lg border border-slate-200/80 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Motor OCR RUKAN</span>
            <Cpu size={14} className="text-slate-400" />
          </div>
          <div className="mt-1.5 flex items-center gap-1.5">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                ocr.disponible ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
            <p className="text-xs font-semibold text-slate-900">
              {ocr.disponible ? "Activo" : "Simulación / Respaldo"}
            </p>
          </div>
          <p className="mt-0.5 text-[11px] text-slate-400">{ocr.provider || "tesseract"}</p>
        </div>
      </div>

      {/* Tabla de Gestión de Usuarios y Roles */}
      <Section title="Usuarios Registrados y Control de Roles">
        <div className="overflow-x-auto -mx-4 -mb-4">
          <table className="min-w-full divide-y divide-slate-100 text-xs">
            <thead className="bg-slate-50/60 text-left text-[11px] font-medium uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-2">Usuario</th>
                <th className="px-4 py-2">Nombre / Cargo</th>
                <th className="px-4 py-2">Correo</th>
                <th className="px-4 py-2">Rol Asignado</th>
                <th className="px-4 py-2 text-center">Estado</th>
                <th className="px-4 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usuarios.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-4 py-2.5 font-mono font-medium text-slate-900">
                    {u.username}
                  </td>
                  <td className="px-4 py-2.5 text-slate-800">
                    <div>{u.nombre_completo || "Sin nombre"}</div>
                    <div className="text-[10px] text-slate-400">{u.cargo || "Sin cargo"}</div>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-slate-600">
                    {u.email || "-"}
                  </td>
                  <td className="px-4 py-2.5">
                    <select
                      value={u.rol}
                      disabled={guardandoUsuarioId === u.id}
                      onChange={(e) => handleCambiarRol(u.id, e.target.value)}
                      className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-800 focus:border-slate-400 focus:outline-none transition"
                    >
                      <option value="social">Área Social</option>
                      <option value="tecnico">Área Técnica</option>
                      <option value="coordinador">Coordinador General</option>
                      <option value="admin">Administrador / Soporte</option>
                    </select>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleActivo(u.id, u.activo)}
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition"
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          u.activo ? "bg-emerald-500" : "bg-slate-300"
                        }`}
                      />
                      <span className={u.activo ? "text-slate-800" : "text-slate-400"}>
                        {u.activo ? "Activo" : "Inactivo"}
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setResetId(u.id);
                        setNuevaPassword("");
                      }}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50 transition shadow-2xs"
                    >
                      <KeyRound size={12} />
                      Contraseña
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Modal / Formulario para Crear Usuario */}
      {mostrarCrear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-lg border border-slate-200 bg-white p-5 shadow-lg my-6">
            <h2 className="text-xs font-semibold text-slate-900 mb-3">Registrar Nuevo Usuario</h2>
            <form onSubmit={handleCrearUsuario} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Nombre y apellido
                </label>
                <input
                  type="text"
                  required
                  value={nuevoUser.nombre_completo}
                  onChange={(e) => setNuevoUser({ ...nuevoUser, nombre_completo: e.target.value })}
                  placeholder="Carolina Morales"
                  className="h-9 w-full rounded-md border border-slate-200 px-2.5 text-xs text-slate-900 focus:border-slate-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Correo electrónico institucional
                </label>
                <input
                  type="email"
                  required
                  value={nuevoUser.email}
                  onChange={(e) => setNuevoUser({ ...nuevoUser, email: e.target.value })}
                  placeholder="correo@plansocial.cl"
                  className="h-9 w-full rounded-md border border-slate-200 px-2.5 text-xs text-slate-900 focus:border-slate-400 focus:outline-none"
                />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    required
                    value={nuevoUser.password}
                    onChange={(e) => setNuevoUser({ ...nuevoUser, password: e.target.value })}
                    className="h-9 w-full rounded-md border border-slate-200 px-2.5 text-xs text-slate-900 focus:border-slate-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Rol
                  </label>
                  <select
                    value={nuevoUser.rol}
                    onChange={(e) => setNuevoUser({ ...nuevoUser, rol: e.target.value })}
                    className="h-9 w-full rounded-md border border-slate-200 px-2 text-xs text-slate-800 focus:border-slate-400 focus:outline-none"
                  >
                    <option value="social">Área Social</option>
                    <option value="tecnico">Área Técnica</option>
                    <option value="coordinador">Coordinador General</option>
                    <option value="admin">Administrador / Soporte</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Cargo
                </label>
                <input
                  type="text"
                  value={nuevoUser.cargo}
                  onChange={(e) => setNuevoUser({ ...nuevoUser, cargo: e.target.value })}
                  className="h-9 w-full rounded-md border border-slate-200 px-2.5 text-xs text-slate-900 focus:border-slate-400 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMostrarCrear(false)}
                  className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                >
                  Guardar usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Resetear Contraseña */}
      {resetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-lg border border-slate-200 bg-white p-5 shadow-lg my-6">
            <h2 className="text-xs font-semibold text-slate-900 mb-2">Resetear Contraseña</h2>
            <form onSubmit={handleResetPassword} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Nueva contraseña (mínimo 6 caracteres)
                </label>
                <input
                  type="password"
                  required
                  value={nuevaPassword}
                  onChange={(e) => setNuevaPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-9 w-full rounded-md border border-slate-200 px-2.5 text-xs text-slate-900 focus:border-slate-400 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResetId(null)}
                  className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                >
                  Confirmar reseteo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
