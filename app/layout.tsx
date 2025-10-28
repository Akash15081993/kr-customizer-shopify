export const metadata = {
  title: "Your Shopify App",
  description: "Shopify Embedded App",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* ✅ Load App Bridge first, synchronously */}
        <script
          id="shopify-app-bridge"
          src="https://unpkg.com/@shopify/app-bridge@3"
          data-api-key={process.env.NEXT_PUBLIC_SHOPIFY_API_KEY}
        ></script>
      </head>
      <body>{children}</body>
    </html>
  );
}
