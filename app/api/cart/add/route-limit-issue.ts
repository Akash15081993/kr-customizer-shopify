//app\api\cart\add\route.ts
import { NextRequest, NextResponse } from "next/server";
import { shopifyGraphQLFetch } from "@/lib/shopifyGraphQLFetch";
import { getValidSession } from "@/lib/session";
import { NextApiResponse } from "next";
import langEng from "@/lang/en";
import { ShopInfo } from "@/lib/shopInfo";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function POST(request: NextRequest, res: NextApiResponse) {
  
  try {

    const body = await request.json();
    const { kr_shop, variantId = 0, quantity = 1, kr_design_id = 0 } = body;

    

    // Get valid session
    const session = await getValidSession(kr_shop);
    if (!session) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401, headers: corsHeaders });
    }

    const accessToken = session.accessToken;

    // Step 1: Get variant details and price
    const variantQuery = `
      query getVariant($id: ID!) {
        productVariant(id: $id) {
          id
          title
          price
          product { title }
        }
      }
    `;

    const variantResponse = await shopifyGraphQLFetch(kr_shop, accessToken, variantQuery, { id: variantId });

    if (!variantResponse.data?.productVariant) {
      return NextResponse.json({ error: "Variant not found." }, { status: 200, headers: corsHeaders });
    }

    if(kr_design_id <= 0){
      return NextResponse.json({ error: "Your design is not ready please reload browser and try again." }, { status: 200, headers: corsHeaders });
    }

    const shopInfo = await ShopInfo(kr_shop, accessToken);

    const payloadSaved = { 
      storeHash: (shopInfo as any)?.id?.toString(),
      designId : kr_design_id
    }
    const savedRes = await fetch(`${langEng?.storeApi?.endPoint}product/saved`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payloadSaved),
    });

    const savedData = await savedRes.json();
    
    if(savedData?.status == false){
      return NextResponse.json({ error: "Your design is not ready please reload browser and try again.." }, { status: 200, headers: corsHeaders });
    }

    

    const productSaveResult = JSON.parse(savedData?.data?.product_data);

    //Final product price 
    //krDesign Data
    const finallyCartPrice = parseFloat(productSaveResult?.customizations?.krCustomizedPrice) || 0;
    const desginImage = productSaveResult?.screenshots?.length > 0 ? productSaveResult?.screenshots[0]?.url : 0;
    const designArea = JSON.stringify(productSaveResult);

    const variant = variantResponse.data.productVariant;
    const originalPrice = parseFloat(variant.price);
    const newTotalPrice = parseFloat((originalPrice + finallyCartPrice).toFixed(2));

    // Step 2: Build line items
    const lineItems: any[] = [
      {
        variantId: variantId,
        quantity: quantity,
        customAttributes: [
          { key: "_Design Id", value: kr_design_id },
          { key: "_Design Area", value: designArea },
          { key: "View Design", value: desginImage },
        ],
      },
    ];

    if (finallyCartPrice > 0) {
      lineItems.push({
        title: `Customization addition charges`,
        quantity: quantity,
        originalUnitPrice: finallyCartPrice,
        requiresShipping: false,        
        taxable: false,
        customAttributes: [
          { key: "Linked Product", value: variant?.product?.title },
          { key: "View Design", value: desginImage },
        ],
      });
    }

    const draftOrderInput = {
      input: {
        lineItems: lineItems
      },
    };

    // Step 3: Create Draft Order
    const draftOrderMutation = `
      mutation draftOrderCreate($input: DraftOrderInput!) {
        draftOrderCreate(input: $input) {
          draftOrder {
            id
            invoiceUrl
            totalPrice
            subtotalPrice
            lineItems(first: 10) {
              edges {
                node {
                  id
                  title
                  quantity
                  originalUnitPrice
                  customAttributes { key value }
                }
              }
            }
          }
          userErrors { field message }
        }
      }
    `;

    const draftOrderResponse = await shopifyGraphQLFetch(kr_shop, accessToken, draftOrderMutation, draftOrderInput);

    // Handle errors
    if (draftOrderResponse.data?.draftOrderCreate?.userErrors?.length > 0) {
      const error = draftOrderResponse.data.draftOrderCreate.userErrors[0];
      return NextResponse.json({ error: error.message, field: error.field }, { status: 200, headers: corsHeaders });
    }

    const draftOrder = draftOrderResponse.data.draftOrderCreate.draftOrder;

    // Step 4: Return response
    return NextResponse.json({
      success: true,
      checkoutUrl: draftOrder.invoiceUrl,
      draftOrderId: draftOrder.id,
      totalPrice: draftOrder.totalPrice,
      pricing: {
        originalPrice: originalPrice,
        finallyCartPriceAdded: finallyCartPrice,
        customerPays: newTotalPrice
      },
      product: {
        title: variant.product.title,
        variant: variant.title,
        quantity: quantity,
      },
    },{ status:200, headers: corsHeaders });

  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to create cart", details: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}


// Reject all non-POST methods
export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405, headers: corsHeaders });
}
export async function PUT() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405, headers: corsHeaders });
}
export async function DELETE() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405, headers: corsHeaders });
}
export async function PATCH() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405, headers: corsHeaders });
}