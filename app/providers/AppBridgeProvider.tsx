"use client";
import React, { createContext, useContext, useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const AppBridgeReactContext = createContext<any>(null);

export const useAppBridge = () => {
  const context = useContext(AppBridgeReactContext);
  if (!context) {
    throw new Error("useAppBridge must be used within <AppBridgeProvider>");
  }
  return context;
};

function AppBridgeInner({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const [app, setApp] = useState<any>(null);

  useEffect(() => {
    const host = searchParams.get("host");
    if (!host) return;

    // Check if App Bridge script already exists
    if (!document.querySelector('script[src*="shopifycloud/app-bridge.js"]')) {
      const script = document.createElement("script");
      script.src = "https://cdn.shopify.com/shopifycloud/app-bridge.js";
      script.async = true;
      script.onload = () => {
        initAppBridge(host);
      };
      document.head.appendChild(script);
    } else {
      initAppBridge(host);
    }

    function initAppBridge(host: string) {
      const appBridgeGlobal = (window as any).appBridge;
      if (appBridgeGlobal?.createApp) {
        const appInstance = appBridgeGlobal.createApp({
          apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY!,
          host,
          forceRedirect: true,
        });
        setApp(appInstance);
      }
    }
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
