import { getCurrentShopifyVersion } from "./shopifyVersion";

export async function RegisterOrderWebhook(shop: string, accessToken: string) {
  const apiVersion = getCurrentShopifyVersion();
  const webhookUrl = `${process.env.SHOPIFY_APP_URL}/api/webhooks/orders`;
  const topic = "orders/create";

  //1 Get all existing webhooks
  const getResponse = await fetch(`https://${shop}/admin/api/${apiVersion}/webhooks.json`, {
    headers: {
      "X-Shopify-Access-Token": accessToken,
      "Content-Type": "application/json",
    },
  });

  const existingData = await getResponse.json();

  if (!getResponse.ok) {
    console.error("Failed to fetch existing webhooks:", existingData);
    throw new Error(existingData.errors || "Fetching webhooks failed");
  }

  //2 Check if a webhook already exists with the same topic AND address
  const existingWebhook = existingData.webhooks.find(
    (wh: any) => wh.topic === topic && wh.address === webhookUrl
  );

  if (existingWebhook) {
    console.log("Webhook already exists with the same URL:", existingWebhook);
    return existingWebhook;
  }

  //3️ If webhook exists with same topic but different URL → update it
  const topicWebhook = existingData.webhooks.find((wh: any) => wh.topic === topic);

  if (topicWebhook) {
    const updateResponse = await fetch(
      `https://${shop}/admin/api/${apiVersion}/webhooks/${topicWebhook.id}.json`,
      {
        method: "PUT",
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          webhook: {
            id: topicWebhook.id,
            address: webhookUrl,
            format: "json",
          },
        }),
      }
    );

    const updateData = await updateResponse.json();
    if (!updateResponse.ok) {
      console.error("Failed to update webhook:", updateData);
      throw new Error(updateData.errors || "Webhook update failed");
    }

    console.log("Webhook updated:", updateData);
    return updateData;
  }

  //4 Create new webhook if none exists
  const createResponse = await fetch(`https://${shop}/admin/api/${apiVersion}/webhooks.json`, {
    method: "POST",
    headers: {
      "X-Shopify-Access-Token": accessToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      webhook: {
        topic,
        address: webhookUrl,
        format: "json",
      },
    }),
  });

  const createData = await createResponse.json();
  if (!createResponse.ok) {
    console.error("Failed to create webhook:", createData);
    throw new Error(createData.errors || "Webhook creation failed");
  }

  console.log("Webhook created:", createData);
  return createData;
}
