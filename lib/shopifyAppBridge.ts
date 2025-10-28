// lib/shopifyAppBridge.ts
import createApp, { AppConfig } from "@shopify/app-bridge";
import { getSessionToken } from "@shopify/app-bridge-utils";

let appBridgeInstance: ReturnType<typeof createApp> | null = null;

export function initAppBridge(): ReturnType<typeof createApp> | null {
  if (typeof window === "undefined") return null;

  // Shopify host parameter required
  const host = new URLSearchParams(window.location.search).get("host");
  const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY;

  if (!host || !apiKey) {
    console.warn("Missing Shopify host or API key");
    return null;
  }

  if (!appBridgeInstance) {
    const config: AppConfig = {
      apiKey,
      host,
      forceRedirect: true,
    };
    appBridgeInstance = createApp(config);
    (window as any).appBridge = appBridgeInstance; // 👈 make it globally accessible
  }

  return appBridgeInstance;
}

export async function getAppBridgeToken(): Promise<string | null> {
  const app = initAppBridge();
  if (!app) return null;

  try {
    const token = await getSessionToken(app);
    return token;
  } catch (err) {
    console.error("Error fetching session token", err);
    return null;
  }
}
