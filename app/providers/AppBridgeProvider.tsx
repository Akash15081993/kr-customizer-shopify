"use client";
import React, { createContext, useContext, useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { initAppBridge } from "@/lib/shopifyAppBridge";

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

    const appInstance = initAppBridge(host);
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
