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
  const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY!;

  return (
    <html lang="en">
      <head>
        {/* ✅ Load Shopify App Bridge synchronously */}
        <script
          id="shopify-app-bridge"
          src="https://unpkg.com/@shopify/app-bridge@3"
          data-api-key={apiKey}
        ></script>

        {/* Optional: confirm when it’s ready */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              document.addEventListener('DOMContentLoaded', function() {
                if (window.__SHOPIFY_APP_BRIDGE__) {
                  console.log("✅ Shopify App Bridge loaded successfully");
                } else {
                  console.warn("⚠️ App Bridge still missing");
                }
              });
            `,
          }}
        />
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
