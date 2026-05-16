import { Navigate, Route, Routes } from "react-router-dom";

import Layout from "./components/Layout.jsx";
import Alertas from "./pages/Alertas.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Importar from "./pages/Importar.jsx";
import PersonaDetail from "./pages/PersonaDetail.jsx";
import Personas from "./pages/Personas.jsx";
import Reportes from "./pages/Reportes.jsx";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/personas" element={<Personas />} />
        <Route path="/personas/:id" element={<PersonaDetail />} />
        <Route path="/importar" element={<Importar />} />
        <Route path="/alertas" element={<Alertas />} />
        <Route path="/reportes" element={<Reportes />} />
      </Routes>
    </Layout>
  );
}
