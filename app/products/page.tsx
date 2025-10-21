//app\products\page.tsx
"use client";
import {
  Button,
  Flex,
  FlexItem,
  Input,
  Message,
  Panel,
  Table,
} from "@bigcommerce/big-design";
import { AddIcon } from "@bigcommerce/big-design-icons";
import { useEffect, useState } from "react";
import ProductActionDropdown from "../components/products/productAction";
import Header from "../components/header";
import Link from "next/link";
import { useShop } from "../contexts/ShopContext";
import Loading from "../components/loading";
import { useRouter } from "next/navigation";

const Products = () => {
  const { shop } = useShop();
   const router = useRouter();

  const encodedContext = "";
  const [pageLoading, setpageLoading] = useState(true);
  const [pageSuccess, setPageSuccess] = useState("");
  const [pageError, setPageError] = useState("");
  const [pageRender, setPageRender] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPageOptions] = useState([15, 35, 50, 80]);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [currentItems, setCurrentItems] = useState<[]>([]);

  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchProductId, setSearchProductId] = useState("");

  const [paginationData, setPaginationData] = useState({
    total: 0,
    current_page: 1,
    per_page: 15,
  });

  useEffect(() => {
    if (!shop) { router.push('/'); return; }
  }, [shop]);

  const onPageChange = (page: any) => {
    setCurrentPage(page);
    getProduct(page, itemsPerPage);
  };

  const onItemsPerPageChange = (perPage: any) => {
    setItemsPerPage(perPage);
    setCurrentPage(1);
    getProduct(1, perPage);
  };

  const getProduct = async (
    page = 1,
    perPage = itemsPerPage,
    searchTerm = ""
  ) => {
    setpageLoading(true);
    setPageError("");

    try {
      const getProducts = await fetch(`/api/products/list`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop, page, limit: perPage, searchTerm }),
      });

      const productRes = await getProducts.json();
      const productData = productRes.data;

      if (productData?.message) {
        setPageError(productData?.message);
      }

      const products = productData?.products || [];
      const pagination = productData?.pagination || {};

      setCurrentItems(products);
      setPaginationData({
        total: pagination?.total || products.length,
        current_page: pagination?.page || page,
        per_page: pagination?.limit || perPage,
      });

      setpageLoading(false);
    } catch (error) {
      setpageLoading(false);
      setPageError((error as any)?.message);
    }
  };

  useEffect(() => {
    getProduct();
  }, [encodedContext, pageRender]);

  const renderImage = (images: any) => {
    const thumbnail = images;
    const fallback = "/assets/coming-soon-img.gif";

    return (
      <img
        src={thumbnail || fallback}
        width={40}
        height={40}
        alt="Product"
        style={{ objectFit: "contain" }}
      />
    );
  };

  //handle search
  const handleSearch = async () => {
    if (!searchProductId.trim()) {
      return;
    }
    setIsSearchActive(true);
    setCurrentPage(1);
    await getProduct(1, itemsPerPage, searchProductId.trim());
  };

  return (
    <>
      <Header />
      <Panel id="products">
        <Flex justifyContent="space-between" style={{ marginBottom: "20px" }}>
          {/* Search box */}
          <Flex marginBottom="medium" alignItems="center">
            <Input
              maxLength={80}
              placeholder="Search Name & SKU"
              value={searchProductId}
              onChange={(e) => setSearchProductId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
            />
            <Button
              variant="secondary"
              marginLeft="small"
              onClick={handleSearch}
            >
              Search
            </Button>
            {isSearchActive && (
              <Button
                variant="secondary"
                marginLeft="small"
                onClick={() => {
                  getProduct();
                  setSearchProductId("");
                  setIsSearchActive(false);
                }}
              >
                Clear
              </Button>
            )}
          </Flex>

          <FlexItem>
            <Link href="/product-add">
              <Button actionType="normal" isLoading={false} variant="primary">
                <AddIcon /> Add product for design
              </Button>
            </Link>
          </FlexItem>
        </Flex>

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

        {!pageLoading && currentItems?.length > 0 && (
          <Table
            columns={[
              {
                header: "Image",
                hash: "images",
                render: ({ productImage }: any) => renderImage(productImage),
                width: "80",
              },
              {
                header: "Name",
                hash: "name",
                render: ({ productName }: any) => productName,
              },
              {
                header: "Action",
                hash: "action",
                render: ({ productId, id }: any) => (
                  <ProductActionDropdown
                    {...{
                      pageRender: setPageRender,
                      pageLoading: setpageLoading,
                      pageSuccess: setPageSuccess,
                      productId,
                      id,
                      shop
                    }}
                  />
                ),
                align: "left",
                width: 80,
              },
            ]}
            items={currentItems}
            itemName="Products"
            stickyHeader
            pagination={{
              currentPage,
              totalItems: paginationData.total,
              itemsPerPage,
              onPageChange,
              onItemsPerPageChange,
              itemsPerPageOptions,
            }}
          />
        )}

        {!pageLoading && currentItems?.length == 0 && (
          <Flex justifyContent="center" style={{ padding: "40px 0" }}>
            <FlexItem>
              <center>
                You have no any product for design. Kindly include a new product
                in the design.
              </center>
            </FlexItem>
          </Flex>
        )}

        {pageLoading && <Loading />}
      </Panel>
    </>
  );
};

export default Products;
