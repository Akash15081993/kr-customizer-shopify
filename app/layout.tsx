"use client";

import "./globals.css";
import { ShopProvider } from "./contexts/ShopContext";
import NextProgressBar from "./components/nextProgress";
import "@shopify/polaris/build/esm/styles.css";
import { AppProvider } from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
import AppBridgeProvider from "./providers/AppBridgeProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NextProgressBar />
        <AppProvider i18n={enTranslations}>
          <AppBridgeProvider>
            <ShopProvider>{children}</ShopProvider>
          </AppBridgeProvider>
        </AppProvider>
      </body>
    </html>
  );
}