import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Header from "./components/header";
import stylesPage from "../assets/css/dashboard.module.css";
import Image from "next/image";
import langEng from "@/lang/en";

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const shopParam = params?.shop;
  const hostParam = params?.host;
  const shop = typeof shopParam === "string" ? shopParam : undefined;
  const host = typeof hostParam === "string" ? hostParam : undefined;

  // ✅ 1. No shop param → show default dashboard (public view)
  if (!shop) {
    return (
      <div>
        <Header isActiveMenu="dashboard" />

        <div className={stylesPage.dashboard}>
          <div className={stylesPage.inner_content}>
            <div className={stylesPage.ic_right}>
              <Image
                src="/assets/app-default-dashboard.png"
                alt="default-dashboard"
                width={500}
                height={454}
                style={{ objectFit: "contain" }}
              />
            </div>

            <div className={stylesPage.ic_left}>
              <h1>
                Bring your Guns, T-Shirts & Mugs portfolio to life with our
                powerful 3D product customizers.
              </h1>
              <p>
                Empower your Shopify store with real-time, interactive
                customization tools that drive engagement and boost sales.
              </p>
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
              for more information.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ✅ 2. Shop param present → check installation state
  const existingSession = await prisma?.session?.findUnique({ where: { shop } });

  if (existingSession) {
    // Shop already installed → go to dashboard
    return redirect(`/dashboard?shop=${encodeURIComponent(shop)}&host=${host}`);
  } else {
    // Shop not installed → go to install route
    return redirect(`/api/auth/install?shop=${encodeURIComponent(shop)}&host=${host}`);
  }
}
