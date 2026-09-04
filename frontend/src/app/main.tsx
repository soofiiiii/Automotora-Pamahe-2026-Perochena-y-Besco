import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "../contexts/AuthProvider";
import { ToastProvider } from "../shared/feedback/ToastProvider";
import { AppErrorBoundary } from "../shared/feedback/AppErrorBoundary";
import { registerPwa } from "../pwa/registerSW";
import "../styles/global.css";
import "../styles/responsive.css";

registerPwa();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </AppErrorBoundary>
  </React.StrictMode>,
);
