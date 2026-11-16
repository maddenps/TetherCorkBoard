"use client";

import { useEffect } from "react";

/** Registers the offline cache (production builds only, to keep dev HMR sane). */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((e) => console.warn("SW registration failed", e));
    }
  }, []);
  return null;
}
