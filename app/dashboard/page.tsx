// app/dashboard/page.tsx
import { redirect } from "next/navigation";
import { getValidSession } from "@/lib/session";
import { shopifyFetch } from "@/lib/shopifyFetch";
import Header from "../components/header";
import stylesPage from "../../assets/css/dashboard.module.css";
import langEng from "@/lang/en";
import Image from "next/image";
import ClientCheckShop from "../components/clientCheckShop";

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

  // ✅ Example API call to Shopify REST
  let shopData;
  try {
    shopData = await shopifyFetch(shop, session.accessToken, "shop.json");
  } catch (err) {
    console.error("Shopify fetch error:", err);
    return <div>Failed to load shop data</div>;
  }

  return (
    <div>
      <Header />
      <div className={stylesPage.dashboard}>
        <div className={stylesPage.inner_content}>
          <div className={stylesPage.ic_right}>
            <Image
              src="/assets/app-default-dashboard.png"
              alt="default-dashboard"
              width={500}
              height="454"
              style={{ objectFit: "contain" }}
            />
          </div>

          <div className={stylesPage.ic_left}>
            <h1>
              Bring your Guns, T-Shirts & Mugs portfolio to life with our
              powerful 3D product customizers.
            </h1>
          </div>
        </div>

        <div className={stylesPage.contact_info}>
          <h2>{langEng?.appDetails?.name}</h2>
          <p>
            A variety of packages are offered. Please contact your{" "}
            <b>{langEng?.appDetails?.name}</b> Account Manager or <br />{" "}
            <a href={`mailto:${langEng?.appDetails?.email}`}>
              {langEng?.appDetails?.email}
            </a>{" "}
            for more information
          </p>
        </div>
      </div>
    </div>
  );
}
