"use client";
import React, { createContext, useContext, useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

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

    // ✅ Dynamically load Shopify App Bridge if not already available
    const loadAppBridge = async () => {
      if (typeof window === "undefined") return;

      if (!(window as any).__SHOPIFY_APP_BRIDGE__) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://unpkg.com/@shopify/app-bridge@3";
          script.async = true;
          script.dataset.apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY!;
          script.onload = () => {
            console.log("✅ Shopify App Bridge loaded");
            resolve();
          };
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      const appBridgeGlobal = (window as any).appBridge || (window as any).__SHOPIFY_APP_BRIDGE__;
      if (!appBridgeGlobal?.createApp) {
        console.error("❌ Shopify App Bridge failed to initialize");
        return;
      }

      const appInstance = appBridgeGlobal.createApp({
        apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY!,
        host,
        forceRedirect: true,
      });

      console.log("✅ Shopify App created:", appInstance);
      setApp(appInstance);
    };

    loadAppBridge();
  }, [searchParams]);

  if (!app) return <>{children}</>;

  return (
    <AppBridgeReactContext.Provider value={app}>
      {children}
    </AppBridgeReactContext.Provider>
  );
}

export default function AppBridgeProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div>Loading Shopify app...</div>}>
      <AppBridgeInner>{children}</AppBridgeInner>
    </Suspense>
  );
}
