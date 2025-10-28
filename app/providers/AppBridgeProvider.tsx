"use client";

import React, { createContext, useContext, useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import createApp from "@shopify/app-bridge"; // ✅ Import directly

const AppBridgeReactContext = createContext<any>(null);

export const useAppBridge = () => {
  const context = useContext(AppBridgeReactContext);
  if (!context) throw new Error("useAppBridge must be used within <AppBridgeProvider>");
  return context;
};

function AppBridgeInner({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const [app, setApp] = useState<any>(null);

  useEffect(() => {
    const host = searchParams.get("host");
    if (!host) return;

    try {
      const appInstance = createApp({
        apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY!,
        host,
        forceRedirect: true,
      });

      // ✅ Attach globally for debugging
      if (typeof window !== "undefined") {
        (window as any).__APP_BRIDGE__ = appInstance;
        console.info("✅ Shopify AppBridge initialized:", appInstance);
      }

      appInstance.subscribe("*", (event) => {
        console.log("🟢 AppBridge event:", event);
      });

      setApp(appInstance);
    } catch (err) {
      console.error("❌ Failed to initialize Shopify AppBridge:", err);
    }
  }, [searchParams]);

  if (!app) return <div>Loading Shopify AppBridge...</div>;

  return (
    <AppBridgeReactContext.Provider value={app}>
      {children}
    </AppBridgeReactContext.Provider>
  );
}

export default function AppBridgeProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div>Loading Shopify App...</div>}>
      <AppBridgeInner>{children}</AppBridgeInner>
    </Suspense>
  );
}
