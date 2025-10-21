"use client";
import { Flex, FlexItem, Switch } from "@bigcommerce/big-design";
import { useState } from "react";

const SwitchDesigner = (props: any) => {
  const {
    shop,
    pageLoading,
    serachButtonLoading,
    pageSuccess,
    pageRender,
    productId,
    productName,
    defaultImage,
    krcConfig,
  } = props;

  let alreadyDesigner = false;
  if (krcConfig?.value == "selected") {
    alreadyDesigner = true;
  }

  const [checked, setChecked] = useState(alreadyDesigner);

  const handleChange = (e: any) => {
    pageSuccess("");
    const productId = e?.target?.value;

    pageLoading(true);
    serachButtonLoading(true);
    setChecked(!checked);
    setTimeout(async () => {
      const response = await fetch("/api/products/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shop,
          productId,
          productName,
          defaultImage,
          metafield: {
            namespace: "custom",
            key: "krcConfig",
            value: `selected`,
            type: "single_line_text_field",
          },
        }),
      });

      await response.json();
      pageSuccess(`Product ( ${productName} ) added successfully for customization.|@|Please go to the admin portal to update the design of the add-on.`);
      serachButtonLoading(false);
      pageLoading(false);
      pageRender((prev: any) => !prev);
    }, 100);
  };

  return (
    <Flex justifyContent="center">
      <FlexItem>
        <Switch
          checked={checked}
          onChange={handleChange}
          value={alreadyDesigner ? 0 : productId}
          key={productId}
          disabled={Boolean(alreadyDesigner)}
        />
      </FlexItem>
    </Flex>
  );
};

export default SwitchDesigner;
