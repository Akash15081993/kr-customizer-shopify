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
import DashboardUI from "./components/dashboard";

function InnerProviders({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const host = searchParams.get("host");
  const shop = searchParams.get("shop");

  // if (!host || !shop) {
  //   return <div>Loading Shopify context...</div>;
  // }

  //When app opened directly (no Shopify context)
  if (!host || !shop) {
    return (
      <ShopProvider>
        <DashboardUI />
      </ShopProvider>
    );
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
        <meta name="shopify-api-key" content={process.env.NEXT_PUBLIC_SHOPIFY_API_KEY} />
        <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js" async></script>
      </head>
      <body>
        <NextProgressBar />
        <AppProvider i18n={enTranslations}>
          <Suspense fallback={<div>Loading Shopify app...</div>}>
            <InnerProviders>
              <div className="container">{children}</div>
            </InnerProviders>
          </Suspense>
        </AppProvider>
      </body>
    </html>
  );
}
