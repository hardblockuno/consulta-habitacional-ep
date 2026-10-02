import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import Layout from "./components/Layout.jsx";
import ProtectedRoute, { getHomeRouteForRole } from "./components/ProtectedRoute.jsx";
import { useAuth } from "./context/AuthContext.jsx";

// Carga perezosa (Code Splitting) por ruta
const Login = lazy(() => import("./pages/Login.jsx"));
const Registro = lazy(() => import("./pages/Registro.jsx"));
const PortalPostventaPublico = lazy(() => import("./pages/PortalPostventaPublico.jsx"));
const AdminSoporte = lazy(() => import("./pages/AdminSoporte.jsx"));
const Alertas = lazy(() => import("./pages/Alertas.jsx"));
const AreaTecnica = lazy(() => import("./pages/AreaTecnica.jsx"));
const BasesDatos = lazy(() => import("./pages/BasesDatos.jsx"));
const DashboardCoordinacion = lazy(() => import("./pages/DashboardCoordinacion.jsx"));
const ExtraerAhorro = lazy(() => import("./pages/ExtraerAhorro.jsx"));
const ExtraerRukan = lazy(() => import("./pages/ExtraerRukan.jsx"));
const OrganizacionDemanda = lazy(() => import("./pages/OrganizacionDemanda.jsx"));
const PersonaDetail = lazy(() => import("./pages/PersonaDetail.jsx"));
const Postventa = lazy(() => import("./pages/Postventa.jsx"));
const Reportes = lazy(() => import("./pages/Reportes.jsx"));

function PageLoadingFallback() {
  return (
    <div className="flex h-64 w-full items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-800" />
    </div>
  );
}

function IndexRedirect() {
  const { user } = useAuth();
  const target = getHomeRouteForRole(user?.rol, user?.es_admin);
  return <Navigate to={target} replace />;
}

export default function App() {
  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <Routes>
        {/* 1. RUTAS PÚBLICAS */}
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/postventa/solicitud" element={<PortalPostventaPublico />} />

        {/* 2. PLATAFORMA INTERNA SIGEP: Protegida con autenticación */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            {/* Redirección dinámica según el rol del usuario logueado */}
            <Route path="/" element={<IndexRedirect />} />

            {/* PANEL EXCLUSIVO: Administrador / Soporte Técnico (Dev) */}
            <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
              <Route path="/admin-soporte" element={<AdminSoporte />} />
            </Route>

            {/* PANEL EXCLUSIVO: Coordinador General / Gerencia */}
            <Route element={<ProtectedRoute allowedRoles={["coordinador", "admin"]} />}>
              <Route path="/coordinacion" element={<DashboardCoordinacion />} />
              <Route path="/reportes" element={<Reportes />} />
            </Route>

            {/* ÁREA SOCIAL (Habilitación social, comités, RSH, familias) */}
            <Route element={<ProtectedRoute allowedRoles={["social", "coordinador", "admin"]} />}>
              <Route path="/demanda" element={<OrganizacionDemanda />} />
              <Route path="/dashboard" element={<Navigate to="/demanda" replace />} />
              <Route path="/bases-datos" element={<BasesDatos />} />
              <Route path="/personas" element={<Navigate to="/bases-datos" replace />} />
              <Route path="/personas/:id" element={<PersonaDetail />} />
              <Route path="/extraer-ahorro" element={<ExtraerAhorro />} />
              <Route path="/extraer-rukan" element={<ExtraerRukan />} />
              <Route path="/importar" element={<Navigate to="/bases-datos?tab=importar" replace />} />
            </Route>

            {/* ÁREA TÉCNICA (Ingeniería, arquitectura, terrenos, DOM/SERVIU, postventa) */}
            <Route element={<ProtectedRoute allowedRoles={["tecnico", "coordinador", "admin"]} />}>
              <Route path="/tecnica" element={<AreaTecnica />} />
              <Route path="/postventa" element={<Postventa />} />
            </Route>

            {/* SEGUIMIENTO COMÚN */}
            <Route path="/alertas" element={<Alertas />} />
          </Route>
        </Route>

        {/* 3. Ruta comodín */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
