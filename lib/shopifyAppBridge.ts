import createApp, { AppConfig } from "@shopify/app-bridge";

let appBridgeInstance: ReturnType<typeof createApp> | null = null;

export function initAppBridge(host?: string) {
  if (typeof window === "undefined") return null;

  if (!appBridgeInstance) {
    const finalHost =
      host || new URLSearchParams(window.location.search).get("host");

    if (!finalHost) return null;

    const appConfig: AppConfig = {
      apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY!,
      host: finalHost,
      forceRedirect: true,
    };

    appBridgeInstance = createApp(appConfig);
  }

  return appBridgeInstance;
}
