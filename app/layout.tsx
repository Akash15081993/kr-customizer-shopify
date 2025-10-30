"use client";

import "./globals.css";
import { Suspense } from "react";
import { AppProvider } from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";
import enTranslations from "@shopify/polaris/locales/en.json";
import NextProgressBar from "./components/nextProgress";
import Head from "next/head";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <Head>
        {/* ✅ Inject Shopify App Bridge as a raw non-async tag */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (!window.ShopifyAppBridge) {
                  var s = document.createElement('script');
                  s.src = "https://cdn.shopify.com/shopifycloud/app-bridge.js";
                  s.type = "text/javascript";
                  document.head.insertBefore(s, document.head.firstChild);
                }
              })();
            `,
          }}
        />
      </Head>

      <body>
        <NextProgressBar />
        <AppProvider i18n={enTranslations}>
          <Suspense fallback={<div>Loading Shopify app...</div>}>
            <div>{children}</div>
          </Suspense>
        </AppProvider>
      </body>
    </html>
  );
}