"use client";

import "./globals.css";
import { Suspense } from "react";
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
