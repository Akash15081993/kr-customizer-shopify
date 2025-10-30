"use client";

import React, { createContext, useContext, useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import createApp from "@shopify/app-bridge";
import { getSessionToken } from "@shopify/app-bridge-utils";

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
    const initAppBridge = async () => {
      const host = searchParams.get("host");
      if (!host) return;

      try {
        const appInstance = createApp({
          apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY!,
          host,
          forceRedirect: true,
        });

        if (typeof window !== "undefined") {
          (window as any).__APP_BRIDGE__ = appInstance;
          //console.info(" Shopify AppBridge initialized:", appInstance);
        }

        // 🔐 Fetch and verify token
        const token = await getSessionToken(appInstance);
        //console.log("🟢 Received Session Token:", token);

        await fetch("/api/verify", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });

        appInstance.subscribe("*", (event) => {
          console.log("📡 AppBridge event:", event);
        });

        setApp(appInstance);
      } catch (err) {
        console.error("❌ Failed to initialize Shopify AppBridge:", err);
      }
    };

    initAppBridge();
  }, [searchParams]);

  if (!app) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "#f6f6f7",
          color: "#000000",
          fontSize: "22px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        Initializing KR Customizer...
      </div>
    );
  }

  return <AppBridgeReactContext.Provider value={app}>{children}</AppBridgeReactContext.Provider>;
}

export default function AppBridgeProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div>Loading Shopify App...</div>}>
      <AppBridgeInner>{children}</AppBridgeInner>
    </Suspense>
  );
}
