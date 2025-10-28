import createApp, { AppConfig } from "@shopify/app-bridge";

let appBridgeInstance: any = null;

export function initAppBridge(host?: string) {
  if (typeof window === "undefined") return null;

  if (!appBridgeInstance) {
    const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY;
    if (!apiKey) {
      console.error("Missing NEXT_PUBLIC_SHOPIFY_API_KEY");
      return null;
    }

    // ✅ If host not passed, try reading from URL
    const urlHost = host || new URLSearchParams(window.location.search).get("host");
    if (!urlHost) {
      console.error("Missing host parameter for App Bridge initialization");
      return null;
    }

    const appConfig: AppConfig = {
      apiKey,
      host: urlHost,
      forceRedirect: true,
    };

    appBridgeInstance = createApp(appConfig);
    (window as any).appBridge = appBridgeInstance; // optional for debugging
  }

  return appBridgeInstance;
}
