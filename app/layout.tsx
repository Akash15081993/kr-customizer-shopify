"use client";

import "./globals.css";
import { ShopProvider } from "./contexts/ShopContext";
import NextProgressBar from "./components/nextProgress";
import "@shopify/polaris/build/esm/styles.css";
import { AppProvider } from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
import AppBridgeProvider from "./providers/AppBridgeProvider";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Script from "next/script";

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
         <Script src="https://cdn.shopify.com/shopifycloud/app-bridge.js" strategy="beforeInteractive" />
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
