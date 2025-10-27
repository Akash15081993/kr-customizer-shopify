// // app/page.tsx
// import { redirect } from 'next/navigation';

// export default function Home({ searchParams }: { searchParams?: Record<string, string> }) {
//   const shopParam = searchParams?.shop;
//   const shop = typeof shopParam === 'string' ? shopParam : undefined;
//   if (shop) {
//     // Server-side redirect to install route
//     return redirect(`/api/auth/install?shop=${encodeURIComponent(shop)}`);
//   }
//   return <div>Loading</div>;
// }



import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Header from "./components/header";
import stylesPage from "../assets/css/dashboard.module.css";
import Image from "next/image";
import langEng from "@/lang/en";

export default async function Home(props: { searchParams?: Promise<Record<string, string>> }) {
  
  const searchParams = await props.searchParams;
  const shopParam = searchParams?.shop;
  const hostParam = searchParams?.host;
  const shop = typeof shopParam === "string" ? shopParam : undefined;

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
    )
  };

  // Check if shop is already installed
  const existingSession = await prisma?.session?.findUnique({ where: { shop } });

  if (existingSession) {
    // Shop already installed → go to dashboard
    return redirect(`/dashboard?shop=${encodeURIComponent(shop)}`);
  } else {
    // Shop not installed → go to install route
    return redirect(`/api/auth/install?shop=${encodeURIComponent(shop)}`);
  }
}
