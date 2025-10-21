// // Shopify Add to Cart API with Authentication

// import { getValidSession } from "./session";

// const SHOPIFY_STORE = 'store-001-8737.myshopify.com';
// const session = await getValidSession(SHOPIFY_STORE);
// var ACCESS_TOKEN = session?.accessToken;

// // Add item to cart
// async function addToCart(variantId:any, quantity = 1) {
//   const url = `https://${SHOPIFY_STORE}/api/2025-10/graphql.json`;

//   const mutation = `
//     mutation cartCreate($input: CartInput!) {
//       cartCreate(input: $input) {
//         cart {
//           id
//           checkoutUrl
//           lines(first: 10) {
//             edges {
//               node {
//                 id
//                 quantity
//                 merchandise {
//                   ... on ProductVariant {
//                     id
//                     title
//                     priceV2 {
//                       amount
//                       currencyCode
//                     }
//                   }
//                 }
//               }
//             }
//           }
//           estimatedCost {
//             totalAmount {
//               amount
//               currencyCode
//             }
//           }
//         }
//         userErrors {
//           field
//           message
//         }
//       }
//     }
//   `;

//   const variables = {
//     input: {
//       lines: [
//         {
//           merchandiseId: variantId,
//           quantity: quantity
//         }
//       ]
//     }
//   };

  



//   try {
//     const response = await fetch(url, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'X-Shopify-Storefront-Access-Token': ACCESS_TOKEN
//       },
//       body: JSON.stringify({
//         query: mutation,
//         variables: variables
//       })
//     });

//     const data = await response.json();

//     if (data.errors) {
//       console.error('GraphQL Errors:', data.errors);
//       return null;
//     }

//     if (data.data.cartCreate.userErrors.length > 0) {
//       console.error('User Errors:', data.data.cartCreate.userErrors);
//       return null;
//     }

//     return data.data.cartCreate.cart;
//   } catch (error) {
//     console.error('Error adding to cart:', error);
//     return null;
//   }
// }

// // Add items to existing cart
// async function addItemsToExistingCart(cartId:any, lines:any) {
//   const url = `https://${SHOPIFY_STORE}/api/2024-01/graphql.json`;
  
//   const mutation = `
//     mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
//       cartLinesAdd(cartId: $cartId, lines: $lines) {
//         cart {
//           id
//           checkoutUrl
//           lines(first: 10) {
//             edges {
//               node {
//                 id
//                 quantity
//                 merchandise {
//                   ... on ProductVariant {
//                     id
//                     title
//                     priceV2 {
//                       amount
//                       currencyCode
//                     }
//                   }
//                 }
//               }
//             }
//           }
//         }
//         userErrors {
//           field
//           message
//         }
//       }
//     }
//   `;

//   const variables = {
//     cartId: cartId,
//     lines: lines
//   };

//   try {
//     const response = await fetch(url, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'X-Shopify-Storefront-Access-Token': ACCESS_TOKEN
//       },
//       body: JSON.stringify({
//         query: mutation,
//         variables: variables
//       })
//     });

//     const data = await response.json();
//     return data.data.cartLinesAdd.cart;
//   } catch (error) {
//     console.error('Error adding items to cart:', error);
//     return null;
//   }
// }

// // Get cart by ID
// async function getCart(cartId:any) {
//   const url = `https://${SHOPIFY_STORE}/api/2024-01/graphql.json`;
  
//   const query = `
//     query getCart($cartId: ID!) {
//       cart(id: $cartId) {
//         id
//         checkoutUrl
//         lines(first: 10) {
//           edges {
//             node {
//               id
//               quantity
//               merchandise {
//                 ... on ProductVariant {
//                   id
//                   title
//                   priceV2 {
//                     amount
//                     currencyCode
//                   }
//                 }
//               }
//             }
//           }
//         }
//         estimatedCost {
//           totalAmount {
//             amount
//             currencyCode
//           }
//         }
//       }
//     }
//   `;

//   try {
//     const response = await fetch(url, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'X-Shopify-Storefront-Access-Token': ACCESS_TOKEN
//       },
//       body: JSON.stringify({
//         query: query,
//         variables: { cartId }
//       })
//     });

//     const data = await response.json();
//     return data.data.cart;
//   } catch (error) {
//     console.error('Error fetching cart:', error);
//     return null;
//   }
// }

// // Example usage:
// // const cart = await addToCart('gid://shopify/ProductVariant/12345678', 1);
// // console.log('Cart created:', cart);
// // console.log('Checkout URL:', cart.checkoutUrl);

// // Add more items to existing cart:
// // const updatedCart = await addItemsToExistingCart(
// //   cart.id,
// //   [
// //     { merchandiseId: 'gid://shopify/ProductVariant/87654321', quantity: 2 }
// //   ]
// // );

// export { addToCart, addItemsToExistingCart, getCart };