import { Navigate, Route, Routes } from "react-router-dom";
import {
  COMMERCIAL_ROLES,
  INTERNAL_ROLES,
  MANAGEMENT_ROLES,
  WORKSHOP_ROLES,
} from "../config/permissions";
import PublicLayout from "../layouts/PublicLayout/PublicLayout";
import AuthLayout from "../layouts/AuthLayout/AuthLayout";
import TallerLayout from "../layouts/TallerLayout/TallerLayout";
import PrivateRoute from "./PrivateRoute";
import PublicRoute from "./PublicRoute";
import NotFoundPage from "./NotFoundPage";
import HomePage from "../modules/catalogo/pages/HomePage";
import CatalogoPage from "../modules/catalogo/pages/CatalogoPage";
import CatalogoDetailPage from "../modules/catalogo/pages/CatalogoDetailPage";
import QuieroVenderPage from "../modules/catalogo/pages/QuieroVenderPage";
import ChatbotWidget from "../modules/chatbot/components/ChatbotWidget";
import LoginPage from "../modules/auth/pages/LoginPage";
import RoleLandingPage from "../modules/dashboard/pages/RoleLandingPage";
import DashboardPage from "../modules/dashboard/pages/DashboardPage";
import UsuariosPage from "../modules/usuarios/pages/UsuariosPage";
import UsuarioFormPage from "../modules/usuarios/pages/UsuarioFormPage";
import ClientesPage from "../modules/clientes/pages/ClientesPage";
import ClienteFormPage from "../modules/clientes/pages/ClienteFormPage";
import VehiculosPage from "../modules/vehiculos/pages/VehiculosPage";
import VehiculoFormPage from "../modules/vehiculos/pages/VehiculoFormPage";
import VehiculoDetailPage from "../modules/vehiculos/pages/VehiculoDetailPage";
import ComprasPage from "../modules/compras/pages/ComprasPage";
import CompraFormPage from "../modules/compras/pages/CompraFormPage";
import VentasPage from "../modules/ventas/pages/VentasPage";
import VentaFormPage from "../modules/ventas/pages/VentaFormPage";
import VentaDetailPage from "../modules/ventas/pages/VentaDetailPage";
import SolicitudesVentaPage from "../modules/solicitudesventa/pages/SolicitudesVentaPage";
import SolicitudVentaDetailPage from "../modules/solicitudesventa/pages/SolicitudVentaDetailPage";
import TallerPage from "../modules/taller/pages/TallerPage";
import RefaccionDetailPage from "../modules/taller/pages/RefaccionDetailPage";
import RefaccionFormPage from "../modules/taller/pages/RefaccionFormPage";
import OfflineQueuePage from "../modules/taller/pages/OfflineQueuePage";
import CostosPage from "../modules/costos/pages/CostosPage";
import AuditoriaPage from "../modules/auditoria/pages/AuditoriaPage";
import ReportesPage from "../modules/reportes/pages/ReportesPage";
import ParametrosPage from "../modules/parametros/pages/ParametrosPage";
import PrivacyPage from "../modules/legal/pages/PrivacyPage";
import LegalNoticePage from "../modules/legal/pages/LegalNoticePage";
import ChangePasswordPage from "../modules/auth/pages/ChangePasswordPage";
import ResetPasswordPage from "../modules/usuarios/pages/ResetPasswordPage";


export default function AppRouter() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route
          index
          element={
            <>
              <HomePage />
              <ChatbotWidget />
            </>
          }
        />
        <Route
          path="catalogo"
          element={
            <>
              <CatalogoPage />
              <ChatbotWidget />
            </>
          }
        />
        <Route
          path="catalogo/:id"
          element={
            <>
              <CatalogoDetailPage />
              <ChatbotWidget />
            </>
          }
        />
        <Route path="quiero-vender-mi-vehiculo" element={<QuieroVenderPage />} />
        <Route path="privacidad" element={<PrivacyPage />} />
        <Route path="informacion-legal" element={<LegalNoticePage />} />
      </Route>
      <Route element={<PublicRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="login" element={<LoginPage />} />
        </Route>
      </Route>
      <Route element={<PrivateRoute roles={INTERNAL_ROLES} />}>
        {" "}
        <Route element={<TallerLayout />}>
          <Route path="app" element={<RoleLandingPage />} />
          <Route path="app/mi-cuenta/password" element={<ChangePasswordPage />} />
          <Route element={<PrivateRoute roles={MANAGEMENT_ROLES} />}>
            <Route path="app/dashboard" element={<DashboardPage />} />
            <Route path="app/usuarios" element={<UsuariosPage />} />
            <Route path="app/usuarios/nuevo" element={<UsuarioFormPage />} />
            <Route path="app/usuarios/:id/password" element={<ResetPasswordPage />} />
            <Route
              path="app/usuarios/:id/editar"
              element={<UsuarioFormPage />}
            />
            <Route path="app/compras" element={<ComprasPage />} />
            <Route path="app/costos" element={<CostosPage />} />
            <Route path="app/auditoria" element={<AuditoriaPage />} />
            <Route path="app/reportes" element={<ReportesPage />} />
            <Route path="app/parametros" element={<ParametrosPage />} />
          </Route>
          <Route path="app/vehiculos" element={<VehiculosPage />} />
          <Route path="app/vehiculos/:id" element={<VehiculoDetailPage />} />
          <Route element={<PrivateRoute roles={COMMERCIAL_ROLES} />}>
            <Route path="app/vehiculos/nuevo" element={<VehiculoFormPage />} />
            <Route
              path="app/vehiculos/:id/editar"
              element={<VehiculoFormPage />}
            />
            <Route path="app/clientes" element={<ClientesPage />} />
            <Route path="app/clientes/nuevo" element={<ClienteFormPage />} />
            <Route
              path="app/clientes/:id/editar"
              element={<ClienteFormPage />}
            />
            <Route path="app/compras/nueva" element={<CompraFormPage />} />
            <Route path="app/ventas" element={<VentasPage />} />
            <Route path="app/ventas/nueva" element={<VentaFormPage />} />
            <Route path="app/ventas/:id" element={<VentaDetailPage />} />
            <Route path="app/solicitudes-venta" element={<SolicitudesVentaPage />} />
            <Route path="app/solicitudes-venta/:id" element={<SolicitudVentaDetailPage />} />
          </Route>
          <Route element={<PrivateRoute roles={WORKSHOP_ROLES} />}>
            <Route path="app/taller" element={<TallerPage />} />
            <Route path="app/taller/nueva" element={<RefaccionFormPage />} />
            <Route path="app/taller/:id" element={<RefaccionDetailPage />} />
            <Route
              path="app/taller/:id/editar"
              element={<RefaccionFormPage />}
            />
            <Route path="app/taller/offline" element={<OfflineQueuePage />} />
          </Route>
        </Route>
      </Route>
      <Route
        path="vehiculos"
        element={<Navigate to="/app/vehiculos" replace />}
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}