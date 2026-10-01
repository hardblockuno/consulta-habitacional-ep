import { Lock, Mail, Shield, User } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getHomeRouteForRole } from "../components/ProtectedRoute.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Registro() {
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState("social");
  const [cargo, setCargo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { registro } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!nombreCompleto.trim() || !email.trim() || !password) {
      setError("Completa todos los campos obligatorios.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const usuario = await registro({
        email: email.trim(),
        password,
        nombre_completo: nombreCompleto.trim(),
        rol,
        cargo: cargo.trim(),
      });
      const target = getHomeRouteForRole(usuario.rol, usuario.es_admin);
      navigate(target, { replace: true });
    } catch (err) {
      const data = err.response?.data;
      let msg = "No fue posible registrar la cuenta.";
      if (typeof data === "object") {
        const firstKey = Object.keys(data)[0];
        const val = data[firstKey];
        msg = Array.isArray(val) ? `${firstKey}: ${val[0]}` : String(val);
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50/80 px-4 py-8 antialiased">
      <div className="w-full max-w-md space-y-5">
        {/* Marca Institucional */}
        <div className="text-center space-y-1.5">
          <img
            src="/sigep-logo-transparent.png"
            alt="SIGEP - Sistema de Información y Gestión de Entidades Patrocinantes"
            className="mx-auto h-24 w-auto object-contain"
          />
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
            Crear cuenta
          </p>
        </div>

        {/* Tarjeta de Formulario */}
        <div className="rounded-lg border border-slate-200/80 bg-white p-5 shadow-2xs">
          <h2 className="text-xs font-semibold text-slate-900 mb-3.5">Registro de profesional</h2>

          {error && (
            <div className="mb-3.5 rounded-md border border-rose-200 bg-rose-50/75 p-2.5 text-xs text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Nombre y apellido
              </label>
              <div className="relative">
                <User size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={nombreCompleto}
                  onChange={(e) => setNombreCompleto(e.target.value)}
                  placeholder="Carolina Morales"
                  className="h-9 w-full rounded-md border border-slate-200 bg-white pl-8 pr-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Correo electrónico institucional
              </label>
              <div className="relative">
                <Mail size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@plansocial.cl"
                  className="h-9 w-full rounded-md border border-slate-200 bg-white pl-8 pr-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <Lock size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="h-9 w-full rounded-md border border-slate-200 bg-white pl-8 pr-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none transition"
                  required
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Rol / Área de trabajo
                </label>
                <div className="relative">
                  <Shield size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    value={rol}
                    onChange={(e) => setRol(e.target.value)}
                    className="h-9 w-full rounded-md border border-slate-200 bg-white pl-8 pr-2.5 text-xs text-slate-700 focus:border-slate-400 focus:outline-none transition"
                  >
                    <option value="social">Área Social</option>
                    <option value="tecnico">Área Técnica</option>
                    <option value="coordinador">Coordinador General / Gerencia</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Cargo / Especialidad
                </label>
                <input
                  type="text"
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  placeholder="Ej: Trabajadora Social / Ing. Civil"
                  className="h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-9 w-full items-center justify-center rounded-md bg-slate-900 text-xs font-medium text-white shadow-2xs hover:bg-slate-800 disabled:opacity-50 transition"
            >
              {loading ? "Creando cuenta..." : "Crear cuenta e ingresar"}
            </button>
          </form>

          <div className="mt-4 pt-3 border-t border-slate-100 text-center text-[11px]">
            <span className="text-slate-500">¿Ya tienes una cuenta registrada? </span>
            <Link to="/login" className="font-medium text-slate-900 hover:underline">
              Iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
