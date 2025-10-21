// app/components/clientCheckShop.tsx
"use client";
import { useEffect } from "react";
import { useShop } from "../contexts/ShopContext";
import { useRouter } from "next/navigation";

const ClientCheckShop = () => {
  const { shop } = useShop();
  const router = useRouter();

  useEffect(() => {
    if (!shop) {
      router.push("/");
    }
  }, [shop, router]);

  // Return null or loading indicator
  return (
    <div style={{ textAlign: "center", padding: "50px" }}>
      <h3>Loading...</h3>
    </div>
  );
};

export default ClientCheckShop;