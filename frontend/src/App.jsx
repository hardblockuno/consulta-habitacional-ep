import { Navigate, Route, Routes } from "react-router-dom";

import Layout from "./components/Layout.jsx";
import ProtectedRoute, { getHomeRouteForRole } from "./components/ProtectedRoute.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import AdminSoporte from "./pages/AdminSoporte.jsx";
import Alertas from "./pages/Alertas.jsx";
import AreaTecnica from "./pages/AreaTecnica.jsx";
import BasesDatos from "./pages/BasesDatos.jsx";
import DashboardCoordinacion from "./pages/DashboardCoordinacion.jsx";
import ExtraerAhorro from "./pages/ExtraerAhorro.jsx";
import ExtraerRukan from "./pages/ExtraerRukan.jsx";
import Login from "./pages/Login.jsx";
import OrganizacionDemanda from "./pages/OrganizacionDemanda.jsx";
import PersonaDetail from "./pages/PersonaDetail.jsx";
import PortalPostventaPublico from "./pages/PortalPostventaPublico.jsx";
import Postventa from "./pages/Postventa.jsx";
import Registro from "./pages/Registro.jsx";
import Reportes from "./pages/Reportes.jsx";

function IndexRedirect() {
  const { user } = useAuth();
  const target = getHomeRouteForRole(user?.rol, user?.es_admin);
  return <Navigate to={target} replace />;
}

export default function App() {
  return (
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
  );
}
