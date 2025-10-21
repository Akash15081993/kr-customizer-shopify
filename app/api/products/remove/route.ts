import { NextRequest, NextResponse } from "next/server";
import { shopifyGraphQLFetch } from "@/lib/shopifyGraphQLFetch";
import { getValidSession } from "@/lib/session";
import langEng from "@/lang/en";
import { ShopInfo } from "@/lib/shopInfo";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shop, rowId, productId, metafield } = body;

    const session = await getValidSession(shop);
    if (!session) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const accessToken = session?.accessToken

    // Validate required fields
    if (!shop || !rowId || !metafield || !productId) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: shop, accessToken, rowId, and metafield are required",
        },
        { status: 400 }
      );
    }

    if (
      !metafield.namespace ||
      !metafield.key ||
      metafield.value === undefined
    ) {
      return NextResponse.json(
        { error: "Metafield must include namespace, key, and value" },
        { status: 400 }
      );
    }

    // Use metafieldsSet (plural) instead of metafieldSet
    const mutation = `
      mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields {
            id
            namespace
            key
            value
            type
            owner {
              ... on Product {
                id
                title
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const variables = {
      metafields: [
        {
          ownerId: productId,
          namespace: metafield.namespace,
          key: metafield.key,
          value: String(metafield.value),
          type: metafield.type || "single_line_text_field",
        },
      ],
    };

    const result = await shopifyGraphQLFetch(
      shop,
      accessToken,
      mutation,
      variables
    );

    if (result?.errors) {
      return NextResponse.json(
        { error: "GraphQL query failed", details: result.errors },
        { status: 500 }
      );
    }

    const metafieldsSet = result?.data?.metafieldsSet;

    if (metafieldsSet?.userErrors?.length > 0) {
      return NextResponse.json(
        {
          error: "Metafield update failed",
          userErrors: metafieldsSet.userErrors,
        },
        { status: 400 }
      );
    }

    //Fetch store info from Shopify API
    const shopInfo = await ShopInfo(shop, accessToken);

    //Add recode in main table
    const payload = {
      "storeHash" : (shopInfo as any)?.id?.toString(),
      "id":rowId,
      apiToken: langEng?.storeApi?.token + "-product-delete",
    }

    await fetch(`${langEng?.storeApi?.endPoint}product/remove`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return NextResponse.json({
      success: true,
      metafields: metafieldsSet.metafields,
    });
  } catch (error) {
    console.error("Metafield update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
