//app\product-add\page.tsx
"use client";
import {
  Button,
  Flex,
  FlexItem,
  FormGroup,
  Input,
  Message,
  Panel,
  Table,
} from "@bigcommerce/big-design";
import { useEffect, useState } from "react";
import SwitchDesigner from "../components/products/switchDesigner";
import Header from "../components/header";
import Loading from "../components/loading";
import { useShop } from "../contexts/ShopContext";
import { useRouter } from "next/navigation";

const FormErrors = {
  name: "Product name is required",
  price: "Default price is required",
};

const ProductForm = () => {
  const { shop } = useShop();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [serachButtonLoading, setSerachButtonLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [pageError, setPageError] = useState("");
  const [pageSuccess, setPageSuccess] = useState("");
  const [pageLoading, setpageLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentItems, setCurrentItems] = useState<[]>([]);

  const [pageRender, setPageRender] = useState(false);

  useEffect(() => {
    if (!shop) { router.push('/'); return; }
  }, [shop]);


  const searchProduct = async (page = 1, perPage = itemsPerPage) => {
    
    setSerachButtonLoading(true);
    setpageLoading(false);

    const res = await fetch(`/api/products/search?shop=${shop}&q=${searchTerm}`);
    const productRes = await res.json();
    if (productRes?.message) {
      setPageError(productRes?.message);
    }

    const products = productRes;
    
    setCurrentItems(products);

    setSerachButtonLoading(false);
  };

  const handleSearch = async () => {
    if (searchTerm === "") {
      setErrors({ name: FormErrors.name });

      return;
    }
    setCurrentPage(1);
    searchProduct(1, itemsPerPage);
  };

  const handleKeyDown = (e: any) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };


  const renderImage = (images:any) => {
    const thumbnail = images?.url;
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

  const renderImageUrl = (images:any) => {
    const thumbnail = images?.url;
    const fallback = "/assets/coming-soon-img.gif";
    return thumbnail || fallback;
  };


  useEffect(() => {
    if (searchTerm) {
      searchProduct(currentPage, itemsPerPage);
    }
    //}, [currentPage, itemsPerPage, pageRender]);
  }, [pageRender]);

  //if(pageLoading) return <Loading />;

  return (
    <>
       <Header 
        isActiveMenu="products" 
        backRoute="/products" 
      />
      <Panel>
        {pageError && (
          <Message
            marginVertical="medium"
            messages={[{ text: pageError }]}
            onClose={() => setPageError("")}
            type="error"
          />
        )}

        <FormGroup>
          <Input
            error={(errors as any).name}
            label="Product Search"
            name="name"
            required
            value={searchTerm}
            placeholder="Search by Name or SKU"
            width="small"
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setErrors({ name: "" });
              setPageError("");
            }}
            onKeyDown={handleKeyDown}
            disabled={Boolean(serachButtonLoading)}
          />
        </FormGroup>
        <Button
          variant="secondary"
          isLoading={serachButtonLoading}
          onClick={handleSearch}
        >
          Search
        </Button>
      </Panel>

      {pageSuccess && (
        <Message
          header={pageSuccess.split("|@|")[0]}
          marginVertical="medium"
          messages={[{ text: pageSuccess.split("|@|")[1] }]}
          onClose={() => setPageSuccess("")}
          type="success"
        />
      )}


      {!pageLoading && currentItems?.length > 0 && (
        <Panel>
          <h4 className="success50" style={{ marginTop: "0" }}>
            Results for <b>{searchTerm}</b>
          </h4>

          <Table
            columns={[
              {
                header: "Image",
                hash: "images",
                render: ({ featuredImage }: any) => renderImage(featuredImage),
                width: "80",
              },
              { header: "Name", hash: "name", render: ({ title }: any) => title },
              {
                header: "Designer",
                hash: "designer",
                render: ({ id, title, options, featuredImage, krcConfig }: any) => (
                  <SwitchDesigner
                    {...{
                      pageLoading: setpageLoading,
                      pageSuccess: setPageSuccess,
                      serachButtonLoading: setSerachButtonLoading,
                      pageRender: setPageRender,
                      productId: id,
                      productName: title,
                      options,
                      shop: shop,
                      krcConfig:krcConfig,
                      defaultImage: renderImageUrl(featuredImage),
                    }}
                  />
                ),
                isSortable: false,
                width: "120",
                align: "center",
              },
            ]}
            items={currentItems}
            itemName="Products"
            stickyHeader
          />
        </Panel>
      )}

      {currentItems?.length == 0 && (
        <Panel>
          <Flex justifyContent="center">
            <FlexItem>No Data</FlexItem>
          </Flex>
        </Panel>
      )}

      {pageLoading && <Loading />}
    </>
  );
};

export default ProductForm;
