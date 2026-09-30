import { Navigate, Route, Routes } from "react-router-dom";

import Layout from "./components/Layout.jsx";
import Alertas from "./pages/Alertas.jsx";
import AreaTecnica from "./pages/AreaTecnica.jsx";
import BasesDatos from "./pages/BasesDatos.jsx";
import ExtraerAhorro from "./pages/ExtraerAhorro.jsx";
import ExtraerRukan from "./pages/ExtraerRukan.jsx";
import OrganizacionDemanda from "./pages/OrganizacionDemanda.jsx";
import PersonaDetail from "./pages/PersonaDetail.jsx";
import PortalPostventaPublico from "./pages/PortalPostventaPublico.jsx";
import Postventa from "./pages/Postventa.jsx";
import Reportes from "./pages/Reportes.jsx";

export default function App() {
  return (
    <Routes>
      {/* RUTA PÚBLICA PARA VECINOS Y BENEFICIARIOS: Aislada, sin menú ni paneles de gestión */}
      <Route path="/postventa/solicitud" element={<PortalPostventaPublico />} />

      {/* PLATAFORMA INTERNA DE LA EP: Con menú lateral y todos los módulos de gestión */}
      <Route element={<Layout />}>
        {/* Redirección inicial */}
        <Route path="/" element={<Navigate to="/demanda" replace />} />

        {/* ÁREA SOCIAL */}
        <Route path="/demanda" element={<OrganizacionDemanda />} />
        <Route path="/dashboard" element={<Navigate to="/demanda" replace />} />
        <Route path="/bases-datos" element={<BasesDatos />} />
        <Route path="/personas" element={<Navigate to="/bases-datos" replace />} />
        <Route path="/personas/:id" element={<PersonaDetail />} />
        <Route path="/extraer-ahorro" element={<ExtraerAhorro />} />
        <Route path="/extraer-rukan" element={<ExtraerRukan />} />
        <Route path="/importar" element={<Navigate to="/bases-datos?tab=importar" replace />} />

        {/* ÁREA TÉCNICA */}
        <Route path="/tecnica" element={<AreaTecnica />} />
        <Route path="/postventa" element={<Postventa />} />

        {/* SEGUIMIENTO */}
        <Route path="/alertas" element={<Alertas />} />
        <Route path="/reportes" element={<Reportes />} />
      </Route>
    </Routes>
  );
}
