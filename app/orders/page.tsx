"use client";
import { useEffect, useState } from "react";
import OrderActionDropdown from "../components/orders/orderAction";
import Loading from "../components/loading";
import { useShop } from "../contexts/ShopContext";
import { Button, Flex, FlexItem, Input, Message, Panel, Table } from "@bigcommerce/big-design";
import Header from "../components/header";
import { useRouter } from "next/navigation";

const Orders = () => {
  const { shop } = useShop();
  const router = useRouter();

  useEffect(() => {
    if (!shop) { router.push('/'); return; }
  }, [shop]);

  const [pageLoading, setPageLoading] = useState(true);
  const [pageSuccess, setPageSuccess] = useState("");
  const [pageError, setPageError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPageOptions] = useState([15, 35, 50, 80]);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [currentItems, setCurrentItems] = useState<any[]>([]);

  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [paginationData, setPaginationData] = useState({
    total: 0,
    current_page: 1,
    per_page: 15,
    totalPages: 0,
  });

  const onPageChange = (page: number) => {
    setCurrentPage(page);
    getOrders(page, itemsPerPage, searchTerm);
  };

  const onItemsPerPageChange = (perPage: number) => {
    setItemsPerPage(perPage);
    setCurrentPage(1);
    getOrders(1, perPage, searchTerm);
  };

  const getOrders = async (page = 1, perPage = itemsPerPage, search = "") => {
    setPageLoading(true);
    setPageError("");

    try {
      const response = await fetch(`/api/orders/list`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          shop, 
          page, 
          limit: perPage, 
          searchTerm: search 
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch orders");
      }

      if (!result.success) {
        throw new Error(result.error || "Failed to load orders");
      }

      const orders = result?.data?.orders || [];
      const pagination = result?.data?.pagination || {
        total: 0,
        page: page,
        limit: perPage,
        totalPages: 0
      };

      setCurrentItems(orders);
      setPaginationData({
        total: pagination.total || 0,
        current_page: pagination.page || page,
        per_page: pagination.limit || perPage,
        totalPages: pagination.totalPages || Math.ceil((pagination.total || 0) / perPage),
      });

    } catch (error: any) {
      console.error("Fetch orders error:", error);
      setPageError(error.message || "Failed to load orders");
      setCurrentItems([]);
      setPaginationData({
        total: 0,
        current_page: 1,
        per_page: perPage,
        totalPages: 0,
      });
    } finally {
      setPageLoading(false);
    }
  };

  // Handle search
  const handleSearch = () => {
    if (searchTerm.trim() === "") {
      // If search is empty, reset to normal list
      setIsSearchActive(false);
      setSearchTerm("");
      getOrders(1, itemsPerPage, "");
    } else {
      // Perform search
      setIsSearchActive(true);
      getOrders(1, itemsPerPage, searchTerm.trim());
    }
  };

  // Handle clear search
  const handleClearSearch = () => {
    setIsSearchActive(false);
    setSearchTerm("");
    getOrders(1, itemsPerPage, "");
  };

  // Handle Enter key in search
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  useEffect(() => {
    getOrders();
  }, []);

  return (
    <>
      <Header />

      <Panel id="orders">
        {pageSuccess && (
          <Message
            header={pageSuccess.split("|@|")[0]}
            marginVertical="medium"
            messages={[{ text: "" }]}
            onClose={() => setPageSuccess("")}
            type="success"
            style={{ marginBottom: "20px" }}
          />
        )}

        {pageError && (
          <Message
            marginVertical="medium"
            messages={[{ text: pageError }]}
            onClose={() => setPageError("")}
            type="error"
            style={{ marginBottom: "20px" }}
          />
        )}

        {!pageLoading && currentItems.length > 0 && (
          <p style={{ marginBottom: "25px" }}>
            You will only see orders for customized products in this list.
          </p>
        )}

        {/* Search box */}
        <Flex marginBottom="medium" alignItems="center">
          <div style={{minWidth:260}}>
            <Input
              placeholder="Search by Order ID & Number"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}            
            />
          </div>
          <Button variant="secondary" marginLeft="small" onClick={handleSearch}>
            Search
          </Button>
          {isSearchActive && (
            <Button
              variant="secondary"
              marginLeft="small"
              onClick={handleClearSearch}
            >
              Clear
            </Button>
          )}
        </Flex>

        {!pageLoading && currentItems.length > 0 && (
          <Table
            columns={[
              {
                header: "Order Number",
                hash: "orderNumber",
                render: ({ orderNumber }: any) => `#${orderNumber}`,
                isSortable: true,
              },
              {
                header: "Total Items",
                hash: "totalItems",
                render: ({ order_items_total }: any) => order_items_total,
              },
              {
                header: "Total",
                hash: "totalIncTax",
                render: ({ order_total_inc_tax }: any) => `$${order_total_inc_tax}`,
                isSortable: true,
              },
              {
                header: "Action",
                hash: "action",
                render: ({ id, orderId, orderNumber }: any) => (
                  <OrderActionDropdown
                    id={id}
                    orderId={orderId}
                    orderNumber={orderNumber}
                    shop={shop}
                  />
                ),
                align: "center",
                width: 100,
              },
            ]}
            items={currentItems}
            itemName="Orders"
            stickyHeader
            pagination={{
              currentPage: paginationData.current_page,
              totalItems: paginationData.total,
              itemsPerPage: paginationData.per_page,
              onPageChange,
              onItemsPerPageChange,
              itemsPerPageOptions,
            }}
          />
        )}

        {!pageLoading && currentItems.length === 0 && (
          <Flex justifyContent="center" style={{ padding: "40px 0" }}>
            <FlexItem>
              <center>
                {isSearchActive 
                  ? "No orders found matching your search criteria." 
                  : "You have no orders yet."
                }
              </center>
            </FlexItem>
          </Flex>
        )}

        {pageLoading && <Loading />}
      </Panel>
    </>
  );
};

export default Orders;