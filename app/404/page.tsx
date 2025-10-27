"use client";

import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function NotFoundContent() {
  const pathname = usePathname();
  const params = useSearchParams();
  const q = params?.get("q");

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
        color: "#333",
      }}
    >
      <h1>404 - Page Not Found</h1>
      <p>Path: {pathname}</p>
      {q && <p>Query: {q}</p>}
      <a
        href="/"
        style={{ marginTop: "1rem", color: "#0070f3", textDecoration: "underline" }}
      >
        Go back home
      </a>
    </div>
  );
}

export default function NotFoundPage() {
  return (
    <Suspense fallback={<div>Loading 404...</div>}>
      <NotFoundContent />
    </Suspense>
  );
}
