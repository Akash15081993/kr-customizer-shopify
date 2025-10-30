"use client";

import "./globals.css";
import { Suspense, useEffect } from "react";
import { AppProvider } from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";
import enTranslations from "@shopify/polaris/locales/en.json";
import NextProgressBar from "./components/nextProgress";
import { ShopProvider } from "./contexts/ShopContext";
import AppBridgeProvider from "./providers/AppBridgeProvider";
import { useSearchParams } from "next/navigation";

function InnerProviders({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const host = searchParams.get("host");
  const shop = searchParams.get("shop");

  if (!host || !shop) {
    return <div>Loading Shopify context...</div>;
  }

  return (
    <AppBridgeProvider>
      <ShopProvider>{children}</ShopProvider>
    </AppBridgeProvider>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // ✅ Inject App Bridge manually
  useEffect(() => {
    const existing = document.querySelector('script#shopify-appbridge');
    if (!existing) {
      const meta = document.createElement("meta");
      meta.name = "shopify-api-key";
      meta.content = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY!;
      document.head.appendChild(meta);

      const script = document.createElement("script");
      script.id = "shopify-appbridge";
      script.src = "https://cdn.shopify.com/shopifycloud/app-bridge.js";
      script.type = "text/javascript";
      // ⚠️ Do NOT set async/defer — Shopify requires it synchronous
      document.head.insertBefore(script, document.head.firstChild);

      console.log("✅ App Bridge script injected manually");
    }
  }, []);

  return (
    <html lang="en">
      <body>
        <NextProgressBar />
        <AppProvider i18n={enTranslations}>
          <Suspense fallback={<div>Loading Shopify app...</div>}>
            <InnerProviders>{children}</InnerProviders>
          </Suspense>
        </AppProvider>
      </body>
    </html>
  );
}
