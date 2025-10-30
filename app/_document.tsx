import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* ✅ Required for Shopify Partner App Bridge validation */}
        <meta name="shopify-api-key" content={process.env.NEXT_PUBLIC_SHOPIFY_API_KEY} />
        {/* ✅ Must be FIRST script, NO async/defer/type=module */}
        <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js"></script>

        {/* Optional: Debug check */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener("load", function() {
                console.log("🟢 AppBridge loaded?", typeof window.ShopifyAppBridge !== "undefined");
              });
            `,
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
