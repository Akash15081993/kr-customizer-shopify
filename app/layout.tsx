"use client";

import "./globals.css";
import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { AppProvider } from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";
import enTranslations from "@shopify/polaris/locales/en.json";
import NextProgressBar from "./components/nextProgress";
import { ShopProvider } from "./contexts/ShopContext";
import AppBridgeProvider from "./providers/AppBridgeProvider";

function InjectAppBridgeScript() {
  useEffect(() => {
    if (document.getElementById("shopify-app-bridge")) return;

    const script = document.createElement("script");
    script.id = "shopify-app-bridge";
    script.src = "https://unpkg.com/@shopify/app-bridge@3";
    // ⚠️ Must not use async or defer
    script.async = false;
    script.defer = false;
    document.head.prepend(script);

    script.onload = () => {
      console.log("✅ Shopify App Bridge script loaded");
    };

    script.onerror = () => {
      console.error("❌ Failed to load Shopify App Bridge script");
    };
  }, []);

  return null;
}

function InnerProviders({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const host = searchParams.get("host");
  const shop = searchParams.get("shop");

  if (!host || !shop) {
    return <div>Loading Shopify context...</div>;
  }

  return (
    <>
      <InjectAppBridgeScript />
      <AppBridgeProvider>
        <ShopProvider>{children}</ShopProvider>
      </AppBridgeProvider>
    </>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* ✅ This guarantees Shopify App Bridge is first in <head> */}
        <script
          id="shopify-app-bridge"
          src="https://unpkg.com/@shopify/app-bridge@3"
        ></script>
      </head>
      <body>
        <NextProgressBar />
        <AppProvider i18n={enTranslations}>
          <Suspense fallback={<div>Loading app...</div>}>
            <InnerProviders>
              <div className="container">{children}</div>
            </InnerProviders>
          </Suspense>
        </AppProvider>
      </body>
    </html>
  );
}
