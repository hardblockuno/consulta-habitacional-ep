import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { LoadingState } from "./StateViews.jsx";

export function getHomeRouteForRole(rol, esAdmin = false) {
  if (esAdmin || rol === "admin") return "/admin-soporte";
  if (rol === "coordinador") return "/coordinacion";
  if (rol === "tecnico") return "/tecnica";
  return "/demanda"; // social por defecto
}

export default function ProtectedRoute({ allowedRoles }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <LoadingState label="Verificando credenciales..." />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user.rol) && !user.es_admin) {
    const fallback = getHomeRouteForRole(user.rol, user.es_admin);
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
}
