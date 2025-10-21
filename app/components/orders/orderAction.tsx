import {
  Box,
  Dropdown,
  Flex,
  FlexItem,
  Grid,
  Modal,
  Button,
  Message,
} from "@bigcommerce/big-design";
import { MoreHorizIcon } from "@bigcommerce/big-design-icons";
import { useState } from "react";
import DesignDetails from "./designDetails";
import Loading from "../loading";

interface OrderItem {
  id: number;
  productName: string;
  productSku: string;
  previewUrl: string | null;
  designId: number | null;
  designArea: string | null;
  productJson: string;
}

interface OrderActionDropdownProps {
  id: number;
  orderId: string;
  orderNumber: string;
  shop: any;
}

const OrderActionDropdown = (props: OrderActionDropdownProps) => {
  const { shop, id, orderId, orderNumber } = props;
  
  const [isOpen, setIsOpen] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleOrderView = async () => {
    if (!shop) {
      setError("Shop information is missing");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const response = await fetch(`/api/orders/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop, orderId }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to fetch order items");
      }

      setOrderItems(result.orders || []);
      setIsOpen(true);
    } catch (err: any) {
      console.error("Error fetching order items:", err);
      setError(err.message || "Failed to load order items");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsOpen(false);
    setOrderItems([]);
    setError("");
  };

  const parseProductJson = (productJson: string) => {
    try {
      return JSON.parse(productJson);
    } catch {
      return { quantity: 1, price: "0.00" };
    }
  };

  return (
    <>
      <Flex justifyContent="center">
        <FlexItem>
          <Dropdown
            items={[
              {
                hash: "view-items",
                content: "View Order Items",
                onItemClick: handleOrderView,
              },
            ]}
            toggle={
              <Button variant="subtle" disabled={loading}>
                {loading ? "Wait" : <MoreHorizIcon color="#000" />}
              </Button>
            }
            placement="right-start"
            style={{ textAlign: "left" }}
          />
        </FlexItem>
      </Flex>

      <Modal
        actions={[
          {
            text: "Close",
            variant: "subtle",
            onClick: handleCloseModal,
          },
        ]}
        closeOnClickOutside={true}
        closeOnEscKey={true}
        header={`Order Items - #${orderNumber}`}
        isOpen={isOpen}
        onClose={handleCloseModal}
        variant="dialog"
      >
        {loading && (
          <Flex justifyContent="center" alignItems="center" style={{ padding: "40px" }}>
            <Loading />
          </Flex>
        )}

        {error && (
          <Message
            marginVertical="medium"
            messages={[{ text: error }]}
            type="error"
          />
        )}

        {!loading && !error && orderItems.length === 0 && (
          <Flex justifyContent="center" style={{ padding: "40px" }}>
            <Box>No items found for this order.</Box>
          </Flex>
        )}

        {!loading && !error && orderItems.length > 0 && (
          <Grid style={{
            maxHeight: 'calc(100vh - 250px)',
            overflowY: 'auto',
            padding: '10px'
          }}>
            {orderItems.map((product, index) => {
              const productData = parseProductJson(product.productJson);
              
              return (
                <Flex 
                  key={product.id || index}
                  flexGap="25px" 
                  alignItems="flex-start" 
                  style={{
                    borderBottom: '1px solid #e0e0e0', 
                    paddingBottom: '25px', 
                    marginBottom: '25px',
                    width: '100%'
                  }}
                >
                  <Box style={{
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    flexShrink: 0
                  }}>
                    {product.previewUrl ? (
                      <img 
                        src={product.previewUrl} 
                        alt={product.productName}
                        width={120}
                        height={90}
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <img 
                        src="/assets/coming-soon-img.gif" 
                        alt="No preview"
                        width={120}
                        height={90}
                        style={{ objectFit: 'contain', padding: '10px' }}
                      />
                    )}
                  </Box>
                  
                  <Flex flexGap="10px" flexDirection="column" style={{ flex: 1 }}>
                    <Box>
                      <strong>{product.productName}</strong>
                    </Box>
                    
                    <Box>
                      <strong>SKU:</strong> {product.productSku || 'N/A'}
                    </Box>
                    
                    <Box>
                      <strong>Quantity:</strong> {productData.quantity || 1}
                    </Box>
                    
                    <Box>
                      <strong>Price:</strong> ${parseFloat(productData.price || '0').toFixed(2)}
                    </Box>
                    
                    {product.designId && product.designId > 0 && (
                      <>
                        <Box>
                          <strong>Design ID:</strong> {product.designId}
                        </Box>

                        {product.designArea && (
                          <Box style={{ wordBreak: "break-word" }} marginTop="medium">
                            <strong>Design Details:</strong> 
                            <Box marginTop="small">
                              <DesignDetails data={JSON.parse(product.designArea)} />
                            </Box>
                          </Box>
                        )}
                      </>
                    )}
                    
                    {!product.designId && (
                      <Box style={{ fontStyle: 'italic', color: '#666' }}>
                        Custom charge item
                      </Box>
                    )}
                  </Flex>
                </Flex>
              );
            })}
          </Grid>
        )}
      </Modal>
    </>
  );
};

export default OrderActionDropdown;