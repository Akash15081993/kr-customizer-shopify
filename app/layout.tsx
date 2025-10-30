"use client";

import "./globals.css";
import { Suspense } from "react";
import Script from "next/script";
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
  return (
    <html lang="en">
      <head>
        {/* ✅ Required meta for Shopify verification */}
        <meta
          name="shopify-api-key"
          content={process.env.NEXT_PUBLIC_SHOPIFY_API_KEY}
        />

        {/* ✅ Must load before React runs */}
        <Script
          id="shopify-appbridge"
          src="https://cdn.shopify.com/shopifycloud/app-bridge.js"
          strategy="beforeInteractive"
        />

        {/* ✅ Optional debug script to verify load */}
        <Script
          id="verify-appbridge"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              console.log("AppBridge CDN script injected.");
              window.addEventListener("load", function() {
                console.log("ShopifyAppBridge available:", typeof window.ShopifyAppBridge !== "undefined");
              });
            `,
          }}
        />
      </head>

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
