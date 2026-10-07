export const REPAIR_SYNC_TAG = "pamahe-repairs-v2";
export const QUEUE_CHANGED_EVENT = "pamahe:queue-changed";

interface SyncRegistration extends ServiceWorkerRegistration {
  sync?: { register: (tag: string) => Promise<void> };
}

export async function requestBackgroundSync(): Promise<boolean> {
  if (!("serviceWorker" in navigator)) return false;
  try {
    const registration: SyncRegistration | undefined = await navigator.serviceWorker.getRegistration();
    if (!registration?.sync) return false;
    await registration.sync.register(REPAIR_SYNC_TAG);
    return true;
  } catch { return false; }
}

export function announceQueueChange() {
  window.dispatchEvent(new Event(QUEUE_CHANGED_EVENT));
}
