/** Browser online helpers — safe for client components only. */

export function isBrowserOnline() {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}

export function subscribeToOnlineStatus(listener: (online: boolean) => void) {
  if (typeof window === "undefined") return () => {};

  const onOnline = () => listener(true);
  const onOffline = () => listener(false);
  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);
  return () => {
    window.removeEventListener("online", onOnline);
    window.removeEventListener("offline", onOffline);
  };
}
