"use client";
import React, { createContext, useContext, useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import createApp from "@shopify/app-bridge";

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
    const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY;

    if (!host || !apiKey) {
      console.warn("Missing Shopify host or API key");
      return;
    }

    const appInstance = createApp({
      apiKey,
      host,
      forceRedirect: true,
    });

    // 👇 store globally if you want access in console
    (window as any).appBridge = appInstance;

    setApp(appInstance);
  }, [searchParams]);

  if (!app) return <>{children}</>; // avoid breaking SSR

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
