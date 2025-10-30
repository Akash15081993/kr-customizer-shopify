// app/page.tsx
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import DashboardUI from "./components/dashboard";

export default async function Home({
  searchParams,
}: {
  searchParams?: Record<string, string>;
}) {
  const shop = searchParams?.shop;
  const host = searchParams?.host;

  // 🧭 If no `shop` param → show static default dashboard page
  if (!shop) {
    return (
      <DashboardUI />
    );
  }

  // 🧭 If `shop` param exists → check installation status
  const existingSession = await prisma?.session?.findUnique({ where: { shop } });

  if (existingSession) {
    // Shop already installed → go to dashboard
    return redirect(`/dashboard?shop=${encodeURIComponent(shop)}&host=${host}`);
  }

  // Shop not installed → go to install flow
  return redirect(`/api/auth/install?shop=${encodeURIComponent(shop)}&host=${host}`);
}
