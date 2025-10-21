"use client"
import { Button, Dropdown, Flex, FlexItem } from "@bigcommerce/big-design";
import { MoreHorizIcon } from "@bigcommerce/big-design-icons";

const ProductActionDropdown = (props:any) => {

    const {pageRender, pageSuccess, pageLoading, id, productId, shop } = props;

    const handleProductSync = (id:any, productId:any) => {
        if(productId != ""){
            setTimeout(async () => {
                pageLoading(true);

                await fetch(`/api/products/sync`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ 
                        shop, 
                        rowId:id, 
                        productId,
                        metafield: {
                            namespace: "custom",
                            key: "krcConfig",
                            value: 'selected',
                            type: "single_line_text_field",
                        },
                    }),
                });

                pageLoading(false);
                pageSuccess(`Product sync successfully.`);
                pageRender((prev:any) => !prev);
            }, 100);
        }
    };

    const handleRemove = (id:any, productId:any) => {
        if(productId != ""){
            setTimeout(async () => {
                pageLoading(true);
                await fetch(`/api/products/remove`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ 
                        shop, 
                        rowId:id, 
                        productId,
                        metafield: {
                            namespace: "custom",
                            key: "krcConfig",
                            value: 0,
                            type: "single_line_text_field",
                        },
                    }),
                });
                pageSuccess(`Product remove successfully for customization.`);
                pageRender((prev:any) => !prev);
            }, 100);
        }
    };

    return (
         <Flex justifyContent="center">
            <FlexItem>
                <Dropdown
                items={[
                    {
                        hash: '1',
                        content: 'Sync Product',
                        description: 'Sync products with your BigCommerce Admin panel.',
                        onItemClick: () => { handleProductSync(id, productId) },
                    },
                    {
                        actionType: 'destructive',
                        hash: '2',
                        content: 'Remove',
                        description: 'Remove product for design',
                        onItemClick: () => { handleRemove(id, productId) },
                    }
                ]}
                toggle={<Button variant="subtle"><MoreHorizIcon color="#000" /></Button>}
                placement="right-start"
                style={{textAlign:"left"}}
                />
            </FlexItem>
        </Flex>
    );
};

export default ProductActionDropdown;
