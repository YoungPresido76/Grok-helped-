import { useEffect } from "react";

export function OfflineRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // Offline support is progressive; a blocked registration must not affect the editor.
    });
  }, []);

  return null;
}
