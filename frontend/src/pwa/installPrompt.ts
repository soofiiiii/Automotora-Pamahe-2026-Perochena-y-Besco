export type PwaInstallStatus =
  | "checking"
  | "ready"
  | "prompting"
  | "installed"
  | "unsupported"
  | "dismissed";

export interface PwaInstallSnapshot {
  status: PwaInstallStatus;
}

type InstallPromptOutcome = "accepted" | "dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<{ outcome: InstallPromptOutcome }>;
}

let initialized = false;
let deferredPrompt: BeforeInstallPromptEvent | null = null;
let unsupportedTimer: number | null = null;
let snapshot: PwaInstallSnapshot = { status: "checking" };
const listeners = new Set<() => void>();

function isStandaloneMode() {
  return window.matchMedia("(display-mode: standalone)").matches;
}

function publish(status: PwaInstallStatus) {
  snapshot = { status };
  listeners.forEach((listener) => listener());
}

function clearUnsupportedTimer() {
  if (unsupportedTimer === null) return;
  window.clearTimeout(unsupportedTimer);
  unsupportedTimer = null;
}

function scheduleUnsupportedFallback() {
  clearUnsupportedTimer();
  unsupportedTimer = window.setTimeout(() => {
    if (!deferredPrompt && snapshot.status === "checking") {
      publish("unsupported");
    }
  }, 2500);
}

function handleBeforeInstallPrompt(event: Event) {
  event.preventDefault();
  clearUnsupportedTimer();
  deferredPrompt = event as BeforeInstallPromptEvent;
  publish("ready");
}

function handleAppInstalled() {
  clearUnsupportedTimer();
  deferredPrompt = null;
  publish("installed");
}

export function initializePwaInstallPrompt() {
  if (initialized) return;
  initialized = true;

  window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  window.addEventListener("appinstalled", handleAppInstalled);

  if (isStandaloneMode()) {
    publish("installed");
    return;
  }

  scheduleUnsupportedFallback();
}

export function subscribePwaInstall(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getPwaInstallSnapshot() {
  return snapshot;
}

export async function promptPwaInstall(): Promise<InstallPromptOutcome | "unavailable"> {
  if (!deferredPrompt) return "unavailable";

  const promptEvent = deferredPrompt;
  deferredPrompt = null;
  publish("prompting");

  try {
    const { outcome } = await promptEvent.prompt();

    if (outcome === "dismissed") {
      publish("dismissed");
      return outcome;
    }

    // `appinstalled` confirma la instalación efectiva. Mientras llega ese evento,
    // mantenemos el control deshabilitado para evitar reutilizar el mismo prompt.
    publish("checking");
    scheduleUnsupportedFallback();
    return outcome;
  } catch {
    publish("unsupported");
    return "unavailable";
  }
}
