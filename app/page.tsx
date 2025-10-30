// app/page.tsx
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Header from "./components/header";
import stylesPage from "../assets/css/dashboard.module.css";
import Image from "next/image";
import langEng from "@/lang/en";

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
              <p style={{ marginTop: "20px", fontSize: "18px" }}>
                Easily personalize, visualize, and manage your store’s products
                with <b>{langEng?.appDetails?.name}</b>.
              </p>
            </div>
          </div>

          <div className={stylesPage.contact_info}>
            <h2>{langEng?.appDetails?.name}</h2>
            <p>
              A variety of packages are offered. Please contact your{" "}
              <b>{langEng?.appDetails?.name}</b> Account Manager or <br />
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

  // 🧭 If `shop` param exists → check installation status
  const existingSession = await prisma?.session?.findUnique({ where: { shop } });

  if (existingSession) {
    // Shop already installed → go to dashboard
    return redirect(`/dashboard?shop=${encodeURIComponent(shop)}&host=${host}`);
  }

  // Shop not installed → go to install flow
  return redirect(`/api/auth/install?shop=${encodeURIComponent(shop)}&host=${host}`);
}
