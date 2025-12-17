// YOUR_PLUGIN_DIRECTORY/js/init-buy-boxes.js

console.log('[Shopify Sidecart Initializer] Script loaded.');

document.addEventListener('DOMContentLoaded', function() {
    console.log('[Shopify Sidecart Initializer] DOMContentLoaded fired. Initializing product buy boxes.');

    // Ensure our required global functions exist
    if (typeof window.handleShopifyAddToCart !== 'function') {
        console.error('Shopify Sidecart Initializer: ERROR - window.handleShopifyAddToCart is not defined. Cannot initialize buy boxes.');
        return;
    }
    if (typeof window.renderShopifyBuyBox !== 'function') {
        console.error('Shopify Sidecart Initializer: ERROR - window.renderShopifyBuyBox is not defined. Cannot initialize buy boxes.');
        return;
    }

    // Access shopifyProductBuyBoxData directly.
    // It should now be set by the manual output in wp_footer.
    // If it's an empty array, the forEach loop below will simply not run, which is desired behavior.
    const productDataToInitialize = Array.isArray(window.shopifyProductBuyBoxData) ? window.shopifyProductBuyBoxData : [];

    if (productDataToInitialize.length === 0) {
        console.warn('Shopify Sidecart Initializer: No product buy box data found to initialize. (Array is empty).');
        return; // Exit if no products need initialization
    }

    const myAddToCartFunction = window.handleShopifyAddToCart; // Get the globally defined cart function

    // Loop through all collected product data and initialize each buy box
    productDataToInitialize.forEach(productData => {
        const containerElement = document.getElementById(productData.container_id);

        if (containerElement) {
            console.log(`[Shopify Sidecart Initializer] Initializing buy box for product ID: ${productData.product_id} in container: ${productData.container_id}`);
            console.log(`[Shopify Sidecart Initializer] Product data:`, productData);
            
            // Build promo config if this product has a shirt promo
            const promoConfig = productData.has_shirt_promo ? {
                shirtProductId: productData.shirt_product_id,
                shirtImage: productData.shirt_image,
                shirtPromoText: productData.shirt_promo_text,
                shirtPromoDisclaimer: productData.shirt_promo_disclaimer
            } : null;
            
            console.log(`[Shopify Sidecart Initializer] Promo config:`, promoConfig);

            renderShopifyBuyBox(
                productData.product_id,
                containerElement,
                myAddToCartFunction,
                promoConfig
            );
        } else {
            console.warn(`[Shopify Sidecart Initializer] Container element not found for ID: ${productData.container_id} (Product ID: ${productData.product_id}).`);
        }
    });

    console.log('[Shopify Sidecart Initializer] All product buy box initializations attempted.');
});