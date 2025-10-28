"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  Suspense,
} from "react";
import { useSearchParams } from "next/navigation";

const AppBridgeReactContext = createContext<any>(null);

export const useAppBridge = () => {
  const context = useContext(AppBridgeReactContext);
  if (!context)
    throw new Error("useAppBridge must be used within <AppBridgeProvider>");
  return context;
};

function AppBridgeInner({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const [app, setApp] = useState<any>(null);

  useEffect(() => {
    const host = searchParams.get("host");
    if (!host || typeof window === "undefined") return;

    // 🕒 Wait until App Bridge script is actually available on window
    const initAppBridge = () => {
      const globalAppBridge = (window as any).appBridge;

      if (globalAppBridge?.createApp) {
        console.log("✅ Shopify App Bridge initializing...");

        const appInstance = globalAppBridge.createApp({
          apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY!,
          host,
          forceRedirect: true,
        });

        setApp(appInstance);
        console.log("✅ Shopify App Bridge initialized successfully");
        return true;
      }

      return false;
    };

    // ⏳ Try to initialize immediately, or retry every 300ms until available
    if (!initAppBridge()) {
      const interval = setInterval(() => {
        if (initAppBridge()) clearInterval(interval);
      }, 300);
      return () => clearInterval(interval);
    }
  }, [searchParams]);

  if (!app) {
    return <div>Loading Shopify App Bridge...</div>;
  }

  return (
    <AppBridgeReactContext.Provider value={app}>
      {children}
    </AppBridgeReactContext.Provider>
  );
}

export default function AppBridgeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div>Loading Shopify App...</div>}>
      <AppBridgeInner>{children}</AppBridgeInner>
    </Suspense>
  );
}
