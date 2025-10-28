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
    if (!host || typeof window === "undefined") return;

    const appBridgeGlobal = (window as any).appBridge;
    if (!appBridgeGlobal?.createApp) {
      console.warn("App Bridge not found on window");
      return;
    }

    const appInstance = appBridgeGlobal.createApp({
      apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY!,
      host,
      forceRedirect: true,
    });

    setApp(appInstance);
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
