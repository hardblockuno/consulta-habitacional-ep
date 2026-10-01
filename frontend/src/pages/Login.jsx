import { Lock, Mail } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getHomeRouteForRole } from "../components/ProtectedRoute.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Ingresa tu correo y contraseña.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const usuario = await login(email.trim(), password);
      const from = location.state?.from?.pathname;
      const target = from && from !== "/login" ? from : getHomeRouteForRole(usuario.rol, usuario.es_admin);
      navigate(target, { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        "No fue posible iniciar sesión. Verifica tus credenciales.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50/80 px-4 py-8 antialiased">
      <div className="w-full max-w-sm space-y-5">
        {/* Marca Institucional */}
        <div className="text-center space-y-1.5">
          <img
            src="/sigep-logo-transparent.png"
            alt="SIGEP - Sistema de Información y Gestión de Entidades Patrocinantes"
            className="mx-auto h-24 w-auto object-contain"
          />
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
            Sistema de Información y Gestión EP
          </p>
        </div>

        {/* Tarjeta de Formulario */}
        <div className="rounded-lg border border-slate-200/80 bg-white p-5 shadow-2xs">
          <h2 className="text-xs font-semibold text-slate-900 mb-3.5">Acceso a plataforma</h2>

          {error && (
            <div className="mb-3.5 rounded-md border border-rose-200 bg-rose-50/75 p-2.5 text-xs text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
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
                  placeholder="nombre@plansocial.cl"
                  className="h-9 w-full rounded-md border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none transition"
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
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-9 w-full rounded-md border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none transition"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 flex h-9 w-full items-center justify-center rounded-md bg-slate-900 text-xs font-medium text-white shadow-2xs hover:bg-slate-800 disabled:opacity-50 transition"
            >
              {loading ? "Verificando..." : "Iniciar sesión"}
            </button>
          </form>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <Link to="/registro" className="text-slate-600 hover:text-slate-900 hover:underline">
              Crear cuenta de equipo
            </Link>
            <Link to="/postventa/solicitud" className="text-slate-400 hover:text-slate-600 hover:underline">
              Portal postventa
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
