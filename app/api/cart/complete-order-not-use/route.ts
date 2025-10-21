
import { NextRequest, NextResponse } from "next/server";
import { shopifyGraphQLFetch } from "@/lib/shopifyGraphQLFetch";
import { getValidSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shop, draftOrderId } = body;

    const session = await getValidSession(shop);
    if (!session) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const accessToken = session?.accessToken;

    const mutation = `
      mutation draftOrderComplete($id: ID!) {
        draftOrderComplete(id: $id) {
          draftOrder {
            id
            order {
              id
              name
              totalPriceSet {
                shopMoney {
                  amount
                  currencyCode
                }
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

    const response = await shopifyGraphQLFetch(
      shop,
      accessToken,
      mutation,
      { id: draftOrderId }
    );

    if (response.data?.draftOrderComplete?.userErrors?.length > 0) {
      const error = response.data.draftOrderComplete.userErrors[0];
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      order: response.data.draftOrderComplete.draftOrder.order,
    });
  } catch (error: any) {
    console.error("Error completing order:", error);
    return NextResponse.json(
      { error: "Failed to complete order", details: error.message },
      { status: 500 }
    );
  }
}
