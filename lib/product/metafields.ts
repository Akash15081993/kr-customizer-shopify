import { NextResponse } from "next/server";
import langEng from "@/lang/en";
import { getCurrentShopifyVersion } from "../shopifyVersion";

export async function AddMetafieldProduct(shop: string, accessToken: string) {
  try {

    const apiVersion = getCurrentShopifyVersion();

    // GraphQL mutation to create metafield definitions
    const createMetafieldDefinition = async (definition: any) => {
      const mutation = `
        mutation CreateMetafieldDefinition($definition: MetafieldDefinitionInput!) {
          metafieldDefinitionCreate(definition: $definition) {
            createdDefinition {
              id
              name
              namespace
              key
              type {
                name
              }
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const response = await fetch(
        `https://${shop}/admin/api/${apiVersion}/graphql.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": accessToken,
          },
          body: JSON.stringify({
            query: mutation,
            variables: { definition },
          }),
        }
      );

      return response.json();
    };

    // Define the three metafields
    const metafieldDefinitions = [
      {
        name: langEng?.modifierDisplayNames?.config,
        namespace: "custom",
        key: "krcConfig",
        description: "Unique identifier for the design",
        type: "single_line_text_field",
        ownerType: "PRODUCT"
      }
      // {
      //   name: langEng?.modifierDisplayNames?.designId,
      //   namespace: "custom",
      //   key: "design_id",
      //   description: "Unique identifier for the design",
      //   type: "single_line_text_field",
      //   ownerType: "PRODUCT"
      // },
      // {
      //   name: langEng?.modifierDisplayNames?.viewDesign,
      //   namespace: "custom",
      //   key: "view_design",
      //   description: "URL to view or preview the design",
      //   type: "single_line_text_field",
      //   ownerType: "PRODUCT"
      // },
      // {
      //   name: langEng?.modifierDisplayNames?.designArea,
      //   namespace: "custom",
      //   key: "design_area",
      //   description: "Area where the design should be placed",
      //   type: "single_line_text_field",
      //   ownerType: "PRODUCT"
      // },
    ];

    // Create all metafield definitions
    const results = [];
    for (const definition of metafieldDefinitions) {
      const result = await createMetafieldDefinition(definition);
      results.push(result);
    }

    // Check for errors
    //const errors = results.filter( r => r.data?.metafieldDefinitionCreate?.userErrors?.length > 0 );

    return {
      success: true,
      message: "Metafield definitions created successfully!",
      definitions: results.map(
        (r) => r.data?.metafieldDefinitionCreate?.createdDefinition
      ),
    };
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
