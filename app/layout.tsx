"use client";

import "./globals.css";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppProvider } from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";
import enTranslations from "@shopify/polaris/locales/en.json";
import NextProgressBar from "./components/nextProgress";
import { ShopProvider } from "./contexts/ShopContext";
import AppBridgeProvider from "./providers/AppBridgeProvider";

function InnerProviders({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const host = searchParams.get("host");
  const shop = searchParams.get("shop");

  //If not inside Shopify (no shop/host), skip AppBridgeProvider
  if (!host || !shop) {
    return (
      <ShopProvider>
        <div className="container">{children}</div>
      </ShopProvider>
    );
  }

  //Inside Shopify → wrap with AppBridgeProvider
  return (
    <AppBridgeProvider>
      <ShopProvider>
        <div className="container">{children}</div>
      </ShopProvider>
    </AppBridgeProvider>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="shopify-api-key" content={process.env.NEXT_PUBLIC_SHOPIFY_API_KEY} />
        <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js"></script>
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