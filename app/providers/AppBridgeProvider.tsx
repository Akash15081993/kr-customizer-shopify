//app\providers\AppBridgeProvider.tsx
"use client";
import React, { createContext, useContext, useMemo, Suspense } from "react";
import createApp, { AppConfig } from "@shopify/app-bridge";
import { useSearchParams } from "next/navigation";

// Create our own context
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

  const appBridgeConfig: AppConfig | null = useMemo(() => {
    if (typeof window === "undefined") return null;
    const host = searchParams.get("host");
    if (!host) return null;

    return {
      apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY!,
      host,
      forceRedirect: true,
    };
  }, [searchParams]);

  const app = useMemo(() => {
    if (!appBridgeConfig) return null;
    return createApp(appBridgeConfig);
  }, [appBridgeConfig]);

  if (!app) return <>{children}</>;

  return (
    <AppBridgeReactContext.Provider value={app}>
      {children}
    </AppBridgeReactContext.Provider>
  );
}

export default function AppBridgeProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div>Loading app...</div>}>
      <AppBridgeInner>{children}</AppBridgeInner>
    </Suspense>
  );
}
