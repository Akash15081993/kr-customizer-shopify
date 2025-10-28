// lib/shopifyAppBridge.ts
import createApp, { AppConfig } from "@shopify/app-bridge";
import { getSessionToken } from "@shopify/app-bridge-utils";

// Type the instance as the return type of createApp()
let appBridgeInstance: ReturnType<typeof createApp> | null = null;

export function initAppBridge(): ReturnType<typeof createApp> | null {
  if (typeof window === "undefined") return null;

  if (!appBridgeInstance) {
    const host = new URLSearchParams(window.location.search).get("host");
    const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY;

    if (!apiKey || !host) {
      console.warn("Missing Shopify host or API key.");
      return null;
    }

    const config: AppConfig = {
      apiKey,
      host,
      forceRedirect: true,
    };

    appBridgeInstance = createApp(config);
  }

  return appBridgeInstance;
}

export async function getAppBridgeToken(): Promise<string | null> {
  const app = initAppBridge();
  if (!app) return null;

  try {
    const token = await getSessionToken(app);
    return token;
  } catch (error) {
    console.error("Failed to get session token:", error);
    return null;
  }
}
