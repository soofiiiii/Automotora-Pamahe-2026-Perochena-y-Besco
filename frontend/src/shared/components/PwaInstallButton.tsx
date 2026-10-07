import { CheckCircle2, Download, Info, LoaderCircle } from "lucide-react";
import { useSyncExternalStore } from "react";
import {
  getPwaInstallSnapshot,
  promptPwaInstall,
  subscribePwaInstall,
  type PwaInstallStatus,
} from "../../pwa/installPrompt";
import { useToast } from "../feedback/useToast";

interface ButtonPresentation {
  label: string;
  ariaLabel: string;
  title: string;
  disabled: boolean;
  icon: "download" | "loading" | "installed" | "info";
}

const presentation: Record<PwaInstallStatus, ButtonPresentation> = {
  checking: {
    label: "Instalar app",
    ariaLabel: "Instalar aplicación Pamahe",
    title: "El navegador está verificando si la aplicación puede instalarse.",
    disabled: true,
    icon: "loading",
  },
  ready: {
    label: "Instalar app",
    ariaLabel: "Instalar aplicación Pamahe",
    title: "Instalar Pamahe en este dispositivo",
    disabled: false,
    icon: "download",
  },
  prompting: {
    label: "Instalando…",
    ariaLabel: "Instalación de Pamahe en curso",
    title: "Completá la instalación desde el diálogo del navegador.",
    disabled: true,
    icon: "loading",
  },
  installed: {
    label: "App instalada",
    ariaLabel: "Pamahe ya está instalada",
    title: "Pamahe ya está instalada en este dispositivo.",
    disabled: true,
    icon: "installed",
  },
  unsupported: {
    label: "Cómo instalar",
    ariaLabel: "Ver instrucciones para instalar Pamahe",
    title: "Ver alternativas de instalación disponibles en este navegador.",
    disabled: false,
    icon: "info",
  },
  dismissed: {
    label: "Cómo instalar",
    ariaLabel: "Ver instrucciones para instalar Pamahe",
    title: "La instalación automática fue cancelada. Ver alternativas.",
    disabled: false,
    icon: "info",
  },
};

function InstallIcon({ icon }: { icon: ButtonPresentation["icon"] }) {
  if (icon === "installed") return <CheckCircle2 className="size-[18px]" />;
  if (icon === "info") return <Info className="size-[18px]" />;
  if (icon === "loading") {
    return <LoaderCircle className="size-[18px] animate-spin" />;
  }
  return <Download className="size-[18px]" />;
}

export function PwaInstallButton() {
  const { show } = useToast();
  const { status } = useSyncExternalStore(
    subscribePwaInstall,
    getPwaInstallSnapshot,
    getPwaInstallSnapshot,
  );
  const button = presentation[status];

  const handleClick = async () => {
    if (status !== "ready") {
      show(
        "Este navegador no ofrece el instalador automático en este momento. En Chrome o Edge podés usar la opción ‘Instalar aplicación’ del menú; en iPhone o iPad, Compartir → Añadir a pantalla de inicio.",
        "info",
      );
      return;
    }

    const outcome = await promptPwaInstall();
    if (outcome === "dismissed") {
      show("La instalación fue cancelada. Podés volver a intentarlo desde el menú del navegador.", "info");
    } else if (outcome === "unavailable") {
      show("El instalador no está disponible en este momento.", "info");
    }
  };

  return (
    <button
      type="button"
      className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-extrabold text-brand-deep shadow-sm transition-colors hover:border-brand/20 hover:bg-brand/[0.04] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 disabled:shadow-none"
      aria-label={button.ariaLabel}
      title={button.title}
      disabled={button.disabled}
      onClick={() => void handleClick()}
    >
      <InstallIcon icon={button.icon} />
      <span className="hidden md:inline">{button.label}</span>
    </button>
  );
}
