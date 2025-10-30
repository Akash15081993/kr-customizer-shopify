// app/dashboard/page.tsx
import { redirect } from "next/navigation";
import { getValidSession } from "@/lib/session";
import { shopifyFetch } from "@/lib/shopifyFetch";
import ClientCheckShop from "../components/clientCheckShop";
import DashboardUI from "../components/dashboard";

export default async function Dashboard(props: {
  searchParams?: Promise<Record<string, string>>;
}) {
  const searchParams = await props.searchParams;
  const shopParam = searchParams?.shop;
  const shop = typeof shopParam === "string" ? shopParam : undefined;
  
  if (!shop) {
    return <ClientCheckShop />;
  }

  //Check if token exists
  const session = await getValidSession(shop);
  if (!session) {
    // Token missing or failed → redirect to install
    return redirect(`/api/auth/install?shop=${encodeURIComponent(shop)}`);
  }

  //  Example API call to Shopify REST
  let shopData;
  try {
    shopData = await shopifyFetch(shop, session.accessToken, "shop.json");
  } catch (err) {
    console.error("Shopify fetch error:", err);
    return <div>Failed to load shop data</div>;
  }

  return (
    <DashboardUI />
  );
}
