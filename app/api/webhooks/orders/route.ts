import langEng from "@/lang/en";
import { getValidSession } from "@/lib/session";
import { ShopInfo } from "@/lib/shopInfo";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

const SHOPIFY_SECRET = process.env.SHOPIFY_API_SECRET!;

// Timeout helper function
const fetchWithTimeout = (url: string, options: RequestInit = {}, timeout = 10000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  return fetch(url, {
    ...options,
    signal: controller.signal
  }).finally(() => clearTimeout(timeoutId));
};

function verifyHmac(req: NextRequest, rawBody: string): boolean {
  const hmac = req.headers.get("x-shopify-hmac-sha256") || "";
  const digest = crypto
    .createHmac("sha256", SHOPIFY_SECRET)
    .update(rawBody, "utf8")
    .digest("base64");
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(hmac));
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  if (!verifyHmac(req, rawBody)) {
    return NextResponse.json(
      { ok: false, message: "Invalid HMAC" },
      { status: 401 }
    );
  }

  try {
    const orderData = JSON.parse(rawBody);

    // Get shop domain from webhook headers
    let shop = req.headers.get("x-shopify-shop-domain");
    let storeHash = "not_found";
    let accessToken = "not_found";

    // Validate shop exists and get session
    if (shop) {
      const session = await getValidSession(shop);
      if (session?.accessToken) {
        accessToken = session.accessToken;

        // Fetch store info from Shopify API
        try {
          const shopInfo = await ShopInfo(shop, accessToken);
          storeHash = (shopInfo as any)?.id?.toString() || "not_found";
        } catch (shopInfoError) {
          console.warn("Could not fetch shop info:", shopInfoError);
          storeHash = "shop_info_fetch_failed";
        }
      } else {
        console.warn("No valid session found for shop:", shop);
        shop = `${shop}_no_session`;
      }
    } else {
      shop = "not_found_in_headers";
      console.warn("Shop domain not found in webhook headers");
    }

    console.log("Processing order:", {
      shop,
      storeHash,
      orderId: orderData?.id,
      orderNumber: orderData?.order_number
    });

    // Always save the order, even if shop info is missing
    await saveOrderToDatabase({
      shop,
      storeHash,
      orderData,
    });

    console.log("Order processed successfully");
    return NextResponse.json({ ok: true });
    
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { ok: false, error: "Processing failed" },
      { status: 500 }
    );
  }
}

// Enhanced database save function
async function saveOrderToDatabase(params: {
  shop: string;
  storeHash: string;
  orderData: any;
}) {
  try {
    const { shop, storeHash, orderData } = params;

    const orderPayload = {
      storeHash: storeHash,
      orderId: orderData?.id,
      orderNumber: orderData?.order_number,
      order_total_inc_tax: orderData.total_price,
      order_total_ex_tax: orderData.total_price,
      order_items_total: orderData.line_items?.length,
      customerId: orderData.customer?.id,
      order_json: JSON.stringify(orderData),
      apiToken: langEng?.storeApi?.token + "-order-add",
    };

    // Insert order in main table with timeout
    console.log("Saving main order...");
    const orderRes = await fetchWithTimeout(
      `${langEng?.storeApi?.endPoint}order/add`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      },
      10000 // 10 second timeout
    );

    if (!orderRes.ok) {
      throw new Error(`Order API responded with ${orderRes.status}`);
    }

    const orderResult = await orderRes.json();
    if (!orderResult.status) {
      throw new Error(`Order API failed: ${orderResult.message}`);
    }

    console.log("Main order saved:", orderResult.data?.id);

    // Insert order items in main table
    if (orderData?.line_items?.length > 0) {
      console.log(`Processing ${orderData.line_items.length} order items...`);

      // Process items sequentially to avoid overwhelming the API
      for (const [index, item] of orderData.line_items.entries()) {
        try {
          console.log(`Processing item ${index + 1}/${orderData.line_items.length}`);

          // Properties fetch
          let designId = null;
          let viewDesign = null;
          let designArea = null;

          if (item?.properties?.length > 0) {
            item.properties.forEach((pro: any) => {
              if (pro?.name === "_Design Id") {
                designId = pro?.value;
              } else if (pro?.name === "View Design") {
                viewDesign = pro?.value;
              } else if (pro?.name === "_Design Area") {
                designArea = pro?.value;
              }
            });
          }

          const itemPayload = {
            storeHash: storeHash,
            bcOrdersId: orderData?.id,
            orderId: orderData?.id,
            productId: item?.product_id || "custom_product",
            productName: item?.name,
            productSku: item?.variant_id || item?.variant_title,
            designId: designId,
            designArea: designArea ? JSON.stringify(designArea) : null,
            previewUrl: viewDesign,
            productJson: JSON.stringify(item),
            apiToken: langEng?.storeApi?.token + "-order-item-add",
          };

          // Save order item with timeout
          const itemRes = await fetchWithTimeout(
            `${langEng?.storeApi?.endPoint}order/items-add`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(itemPayload),
            },
            8000 // 8 second timeout per item
          );

          if (!itemRes.ok) {
            console.warn(`Item ${index + 1} save failed with status: ${itemRes.status}`);
            continue; // Continue with next item
          }

          const itemResult = await itemRes.json();
          if (itemResult.status) {
            console.log(`Item ${index + 1} saved successfully`);
          } else {
            console.warn(`Item ${index + 1} save failed: ${itemResult.message}`);
          }

        } catch (error: any) {
          if (error.name === 'AbortError') {
            console.error(`Item ${index + 1} save timed out`);
          } else {
            console.error(`Error saving order item ${index + 1}:`, error.message);
          }
          // Continue with next items even if one fails
        }
      }
      
      console.log("All order items processed");
    } else {
      console.log("No line items to process");
    }

  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error("Order save operation timed out");
    } else {
      console.error("Error saving order to database:", error.message);
    }
    throw error; // Re-throw to be handled by the main catch block
  }
}