"use client";
import React, { createContext, useContext, useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const AppBridgeReactContext = createContext<any>(null);

export const useAppBridge = () => {
  const ctx = useContext(AppBridgeReactContext);
  if (!ctx) throw new Error("useAppBridge must be used within AppBridgeProvider");
  return ctx;
};

function AppBridgeInner({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const [app, setApp] = useState<any>(null);

  useEffect(() => {
    const host = searchParams.get("host");
    if (!host) return;

    console.log("🕒 Waiting for Shopify App Bridge...");

    const checkAndInit = () => {
      const appBridge = (window as any).appBridge;
      if (appBridge?.createApp) {
        console.log("✅ Shopify App Bridge found, initializing...");
        const appInstance = appBridge.createApp({
          apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY!,
          host,
          forceRedirect: true,
        });
        setApp(appInstance);
        console.log("✅ Shopify App Bridge initialized!");
        return true;
      }
      return false;
    };

    if (!checkAndInit()) {
      const timer = setInterval(() => {
        if (checkAndInit()) clearInterval(timer);
      }, 250);
      return () => clearInterval(timer);
    }
  }, [searchParams]);

  if (!app) return <div>Loading Shopify App Bridge...</div>;

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
