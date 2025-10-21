// app/layout.tsx
import "./globals.css";
import { ShopProvider } from "./contexts/ShopContext";
import NextProgressBar from "./components/nextProgress";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <NextProgressBar />
        <ShopProvider>
          <div className="container">{children}</div>
        </ShopProvider>
      </body>
    </html>
  );
}