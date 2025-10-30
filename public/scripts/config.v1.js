// ======================================================
// App Script Init
// ======================================================

// ---------- Get shop data from script URL ----------
function getShopDataFromURL() {
  const scriptSrc = document.currentScript?.src;
  if (!scriptSrc) return null;

  const scriptUrl = new URL(scriptSrc);
  const scriptParams = new URLSearchParams(scriptUrl.search);

  return {
    shopId: scriptParams.get("shop_id"),
    shop: scriptParams.get("shop"),
    productId: window.meta?.product?.id || null,
    productSKU: window.meta?.product?.variants?.[0]?.sku || null,
    productPrice: formattedPrice(window.meta?.product?.variants?.[0]?.price) || null,
  };
}

// ---------- Format price ----------
function formattedPrice(price) {
  return price ? parseFloat((price / 100).toFixed(2)) : 0;
}

// ---------- Get currency symbol ----------
function getCurrencySymbol(code) {
  try {
    if (!code || typeof code !== "string" || code.length !== 3) return "$";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .format(0)
      .replace(/[0-9]/g, "")
      .trim();
  } catch {
    return "$";
  }
}

// ---------- Detect page type ----------
function getPageType() {
  const path = window.location.pathname;
  const patterns = [
    { pattern: /^\/$/, type: "home" },
    { pattern: /^\/cart\/?$/, type: "cart" },
    { pattern: /^\/search\/?$/, type: "search" },
    { pattern: /^\/checkout\/?$/, type: "checkout" },
    { pattern: /^\/products\/[^\/]+$/, type: "product" },
    { pattern: /^\/collections\/[^\/]+\/products\/[^\/]+$/, type: "product" },
    { pattern: /^\/collections\/[^\/]+$/, type: "collection" },
    { pattern: /^\/pages\/[^\/]+$/, type: "page" },
    { pattern: /^\/blogs\/[^\/]+\/articles\/[^\/]+$/, type: "article" },
    { pattern: /^\/blogs\/[^\/]+$/, type: "blog" },
    { pattern: /^\/account\/?/, type: "account" },
  ];

  for (const { pattern, type } of patterns) {
    if (pattern.test(path)) return type;
  }
  return "other";
}

// ---------- Get active product form ----------
function getProductForm() {
  const selectors = [
    'form[action*="/cart/add"]',
    "form.product-form",
    'form[name="add"]',
    ".product-form form",
    "#product-form",
  ];

  for (const selector of selectors) {
    const form = document.querySelector(selector);
    if (form && form.querySelector('[type="submit"]')) return form;
  }

  // fallback
  return document.querySelector("product-form form");
}

// ---------- Get selected variant ----------
function getCurrentVariant() {
  const productData = window.meta?.product;
  if (!productData) return null;

  const currentVariantId = document.querySelector('form [name="id"]')?.value;
  return productData.variants?.find((v) => v.id == currentVariantId) || null;
}

// ======================================================
// Global Config Initialization
// ======================================================
var shopData = getShopDataFromURL();
if (shopData?.shopId) window.krcustomizer_config = shopData;

var krAppConfig = window?.krcustomizer_config;
console.log("krAppConfig", krAppConfig);

var kr_endpoint = "https://app.krcustomizer.com/";
var kr_endpoint_app = "https://apps.krcustomizer.com/";
var kr_store_hash = krAppConfig?.shopId;
var kr_shop = krAppConfig?.shop;
var kr_page_type = getPageType();
var kr_product_id = `gid://shopify/Product/${krAppConfig?.productId}`;
var kr_root_app_id = "kr-customizer-root";
var ele_product_form = getProductForm();
var ele_product_form_addtocart = null;

if(kr_page_type == "product"){
    console.log("%c KR Customizer Init ", "display:inline-block;font-size:14px;background:linear-gradient(to right,#455eee,#985dd0,#b62286);padding:5px;border-radius:4px;");
}

// ======================================================
// DOM Setup & Initialization
// ======================================================
function initializeApp() {
  if (kr_page_type !== "product") return;

  if (!document.getElementById(kr_root_app_id)) {
    document.body.insertAdjacentHTML(
      "beforeend",
      `<div id="${kr_root_app_id}" style="display:none;position:fixed;top:0;left:0;width:100%;z-index:9999999999;"></div>`
    );
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}

// ======================================================
// Helpers
// ======================================================

function appendCSS(cssCode) {
  if (!cssCode) return;
  const style = document.createElement("style");
  style.innerHTML = cssCode;
  document.head.appendChild(style);
}

function appModelVisibility(action) {
  const root = document.getElementById(kr_root_app_id);
  if (!root) return;
  root.style.display = action === "show" ? "block" : "none";
}

// ======================================================
// Mount Customizer App
// ======================================================
function mountCustomizerApp(productData) {
  if (typeof window.mountProductCustomizer !== "function") {
    console.error("Customizer function not found.");
    return;
  }

  appModelVisibility("show");

  window.mountProductCustomizer(`#${kr_root_app_id}`, {
    currencyCode: productData?.currencyCode,
    productId: kr_product_id,
    productPrice: parseFloat(productData?.productPrice),
    storeHash: kr_store_hash,
    pageLoading: false,
    productQuantity: parseInt(productData?.productQuantity),
  });
}

// ======================================================
// Form Validation
// ======================================================
function validateForm(formNew) {
  
  if (!formNew) return false;

  //Handle both CSS selector strings and form elements
  const form = typeof formNew === 'string' ? document?.querySelector(formNew) : formNew;
  
  if (!form) {
    console.error('Form not found');
    return false;
  }

  const variantInput = form.querySelector('[name="id"]');

  // Ensure variant selection - FIXED: Handle both cases
  if (variantInput) {
    // Variant input exists but has no value
    if (!variantInput.value) {
      alert("Please select all required options (size, color, etc.) before proceeding");
      return false;
    }
  } else {
    // Variant input is null - return false
    console.error('Variant input not found');
    alert("Please select all required options (size, color, etc.) before proceeding");
    return false;
  }

  // Check if add to cart button disabled
  const addToCartBtn = form.querySelector('[type="submit"], .btn-add-to-cart');
  if (addToCartBtn?.disabled) {
    alert("Selected options are unavailable. Please choose different options.");
    return false;
  }

  // Native HTML validation
  if (form.checkValidity && !form.checkValidity()) {
    form.reportValidity?.() ?? alert("Please fill out all required fields.");
    return false;
  }

  return true;
}

// ======================================================
// Hidden Design Fields
// ======================================================
function setDesignFields() {
  if (
    document.querySelector('input[name="properties[Design Id]"]') &&
    document.querySelector('input[name="properties[View Design]"]') &&
    document.querySelector('textarea[name="properties[Design Area]"]')
  )
    return;

  const fields = [
    { tag: "input", type: "text", name: "properties[Design Id]" },
    { tag: "input", type: "text", name: "properties[View Design]" },
    { tag: "textarea", id: "design-area", name: "properties[Design Area]" },
  ];

  const form = ele_product_form;
  if (!form) return;

  fields.forEach(({ tag, ...attrs }) => {
    const el = document.createElement(tag);
    Object.assign(el, attrs);
    el.style.display = "none";
    form.appendChild(el);
  });
}

// ======================================================
// Authentication & Button Mount
// ======================================================
async function appAuthentication() {
  try {
    const bodyPayload = { storeHash: kr_store_hash, productId: kr_product_id };
    const res = await fetch(`${kr_endpoint}api/stores/authentication`, {
      headers: { "Content-Type": "application/json" },
      method: "POST",
      body: JSON.stringify(bodyPayload),
    });

    const result = await res.json();
    if (!result?.status) {
      console.log(
        "%cYour subscription is not valid. Please contact 'KR Customizer' administrator",
        "background:#79d000;color:#1d1d1d;padding:5px;border-radius:5px"
      );
      return;
    }

    const { appSettings } = result;
    const cssCode = appSettings?.cssCode;
    const designerButton = appSettings?.designerButton;
    const addtocartForm = appSettings?.addtocartForm;
    const designerButtonName = appSettings?.designerButtonName || "Customize";


    ele_product_form_addtocart = addtocartForm != "" && typeof addtocartForm != "undefined" && typeof addtocartForm != null ? addtocartForm : getProductForm();

    if (cssCode) appendCSS(cssCode);

    const buttonHTML = `<button type="button" class="button button--primary kr-customize-handel" data-kr-customize-handel>${designerButtonName}</button>`;
    if (!document.querySelector(".kr-customize-handel")) {
      const target =  designerButton != "" && typeof designerButton != "undefined" ? document.querySelector(designerButton) : ele_product_form || ele_product_form;
      target?.insertAdjacentHTML("beforeend", buttonHTML);
    }
  } catch (err) {
    console.error("Authentication failed:", err);
  }
}

if (kr_page_type === "product") { appAuthentication(); }

// ======================================================
// Event Listeners
// ======================================================

// ---------- Close modal ----------
document.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-kr-close-handle]");
  if (btn) appModelVisibility("hide");
});

// ---------- Customize button ----------
document.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-kr-customize-handel]");
  if (!btn) return;

  appModelVisibility("hide");
  if (!validateForm(ele_product_form_addtocart)) return;

  btn.disabled = true;
  const originalText = btn.innerText;
  btn.innerText = "Loading...";
  window?.localStorage?.removeItem("krDesignData")
  window?.localStorage?.removeItem("krDesigns")

  try {
    const scriptAppUrl = "https://front.krcustomizer.com/bc-app/bc-customiser-app.umd.js";
    const variant = getCurrentVariant();
    const currencyCode = window.Shopify?.currency?.active || window.Shopify?.Checkout?.currency || "USD";
    const productQuantity = document.querySelector('form [name="quantity"]')?.value || 1;

    const productData = {
      currencyCode: getCurrencySymbol(currencyCode),
      productId: kr_product_id,
      storeHash: kr_store_hash,
      pageLoading: false,
      productQuantity,
      productPrice: formattedPrice(variant?.price),
    };

    if (!document.querySelector(`script[src="${scriptAppUrl}"]`)) {
      const script = document.createElement("script");
      script.src = scriptAppUrl;
      script.async = true;
      script.onload = () => mountCustomizerApp(productData);
      document.head.appendChild(script);
    } else {
      mountCustomizerApp(productData);
    }

    btn.disabled = false;
    btn.innerText = originalText;

  } catch (err) {
    console.error(err);
    btn.disabled = false;
    btn.innerText = originalText;

  } finally {
    setTimeout(() => {
      btn.disabled = false;
      btn.innerText = originalText;
    }, 2000);
  }
});

// ---------- Add to Cart ----------
document.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-kr-addtocart-handel]");
  if (!btn) return;
  
  if (!validateForm(ele_product_form_addtocart)) return;

  const krDesignData = JSON.parse(localStorage.getItem("krDesignData") || "{}");
  const kr_design_id = krDesignData?.krDesignId;

  if (!kr_design_id) {
    window?.setCustomizerLoading(false);
    appModelVisibility("show");
    alert("Something went wrong. Please try again.");
    return;
  }

  try {
    window?.setCustomizerLoading(true);
    const variant = getCurrentVariant();
    const variantId = `gid://shopify/ProductVariant/${variant?.id}`;
    const quantity = document.querySelector('form [name="quantity"]')?.value || 1;

    if (!variantId) throw new Error("Variant not found.");

    const payload = { kr_shop, variantId, quantity, kr_design_id };
    const res = await fetch(`${kr_endpoint_app}api/cart/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      window.location.href = data.checkoutUrl;
      setTimeout(() => {
        window?.setCustomizerLoading(false);
        appModelVisibility("hide");
      }, 4000);
    } else {
      throw new Error(data.error || "Failed to add to cart");
    }
  } catch (err) {
    window?.setCustomizerLoading(false);
    appModelVisibility("show");
    alert(err.message || "Something went wrong. Please try again.");
  }
});
