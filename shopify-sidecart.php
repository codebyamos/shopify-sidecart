<?php
/**
 * Plugin Name: Shopify Sidecart
 * Plugin URI: https://github.com/codebyamos/shopify-sidecart
 * Description: Custom Shopify sidecart with Storefront API integration for WordPress
 * Version: 2.1.0
 * Requires at least: 5.0
 * Requires PHP: 7.4
 * Author: The Brandsmen
 * Author URI: https://thebrandsmen.com/
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: shopify-sidecart
 * Domain Path: /languages
 */

// CRITICAL: Initialize global array at the very top, outside any function.
global $shopify_product_buy_box_data;
$shopify_product_buy_box_data = [];

function shopify_sidecart_enqueue_scripts() {
    error_log('Shopify Sidecart: Enqueue scripts triggered at ' . date('Y-m-d H:i:s'));
    $plugin_dir = plugin_dir_path(__FILE__);

    // Define paths for all your JS and CSS files
    $css_path = plugin_dir_url(__FILE__) . 'css/sidecart.css';
    $js_path = plugin_dir_url(__FILE__) . 'js/sidecart.js'; // Main sidecart logic, defines handleShopifyAddToCart
    $product_buy_box_js_path = plugin_dir_url(__FILE__) . 'js/product-buy-box.js'; // Defines renderShopifyBuyBox
    $init_buy_boxes_js_path = plugin_dir_url(__FILE__) . 'js/init-buy-boxes.js'; // Initializes buy boxes on the page

    error_log('Shopify Sidecart: CSS Path: ' . $css_path);
    error_log('Shopify Sidecart: JS Path: ' . $js_path);
    error_log('Shopify Sidecart: Product Buy Box JS Path: ' . $product_buy_box_js_path);
    error_log('Shopify Sidecart: Initializer JS Path: ' . $init_buy_boxes_js_path);
    error_log('Shopify Sidecart: Plugin Directory: ' . $plugin_dir);

    // 1. Enqueue your custom CSS
    if (file_exists($plugin_dir . 'css/sidecart.css')) {
        wp_enqueue_style('shopify-sidecart-style', $css_path, [], '2.16.' . time(), 'all');
        error_log('Shopify Sidecart: CSS file exists and enqueued.');
    } else {
        error_log('Shopify Sidecart: CSS file not found at ' . $plugin_dir . 'css/sidecart.css');
    }

    // 2. Enqueue the main sidecart script (js/sidecart.js) first, with no dependencies itself
    if (file_exists($plugin_dir . 'js/sidecart.js')) {
        wp_enqueue_script('shopify-sidecart', $js_path, [], '3.28.' . time(), true);
        error_log('Shopify Sidecart: js/sidecart.js enqueued.');
    } else {
        error_log('Shopify Sidecart: js/sidecart.js not found at ' . $plugin_dir . 'js/sidecart.js');
    }

    // Localize shopifySettings to 'shopify-sidecart' handle (this seems to work or isn't causing issues)
    wp_localize_script('shopify-sidecart', 'shopifySettings', [
        'storefrontToken' => '452dd6a671de9bb625f7ed16df0ac474',
        'storeUrl' => 'https://a67497-c1.myshopify.com/api/2025-01/graphql.json',
        'freeShippingThreshold' => 15000
    ]);
    error_log('Shopify Sidecart: shopifySettings localized to shopify-sidecart.');

    // Preload all ACF data (localized to 'shopify-sidecart' as well)
    global $wpdb;
    $products = $wpdb->get_results("SELECT post_id, meta_value FROM $wpdb->postmeta WHERE meta_key = 'shopify_product_id'");
    $acf_data = [];
    foreach ($products as $product) {
        $subcategory = get_post_meta($product->post_id, 'product_subcategory', true);
        if ($subcategory) {
            $acf_data[$product->meta_value] = ['product_subcategory' => $subcategory];
        }
    }
    error_log('Shopify Sidecart: Preloaded ACF data: ' . print_r($acf_data, true));
    wp_localize_script('shopify-sidecart', 'acfProductData', $acf_data);


    // 3. Enqueue product-buy-box.js (defines renderShopifyBuyBox)
    // This script needs `shopifySettings` (localized to `shopify-sidecart`).
    // So, it MUST depend on 'shopify-sidecart'.
    if (file_exists($plugin_dir . 'js/product-buy-box.js')) {
        wp_enqueue_script(
            'shopify-product-buy-box', // Unique handle
            $product_buy_box_js_path,
            ['shopify-sidecart'], // DEPENDS ON 'shopify-sidecart'
            '2.0.0.' . filemtime($plugin_dir . 'js/product-buy-box.js'), // Force cache bust with file modification time
            true
        );
        error_log('Shopify Sidecart: js/product-buy-box.js enqueued with dependency on sidecart.');
    } else {
        error_log('Shopify Sidecart: js/product-buy-box.js not found at ' . $plugin_dir . 'js/product-buy-box.js');
    }

    // 4. Enqueue init-buy-boxes.js (initializes buy boxes on the page)
    // This script needs `window.handleShopifyAddToCart` (from `sidecart.js`)
    // AND `renderShopifyBuyBox` (from `product-buy-box.js`).
    // So, it MUST depend on BOTH 'shopify-sidecart' and 'shopify-product-buy-box'.
    // The data for this script (`shopifyProductBuyBoxData`) will be printed manually in wp_footer.
    if (file_exists($plugin_dir . 'js/init-buy-boxes.js')) {
        wp_enqueue_script(
            'shopify-sidecart-initializer', // Unique handle
            $init_buy_boxes_js_path,
            ['shopify-sidecart', 'shopify-product-buy-box'], // DEPENDS ON BOTH
            '1.1.0.' . time(), // Force cache bust with timestamp
            true
        );
        error_log('Shopify Sidecart: js/init-buy-boxes.js enqueued with dependencies.');
    } else {
        error_log('Shopify Sidecart: js/init-buy-boxes.js not found at ' . $plugin_dir . 'js/init-buy-boxes.js');
    }
    // IMPORTANT: The wp_localize_script for 'shopifyProductBuyBoxData' is REMOVED from here.
    // It will be handled by the new `shopify_sidecart_print_buy_box_data` function in wp_footer.
}
add_action('wp_enqueue_scripts', 'shopify_sidecart_enqueue_scripts');

// This function RENDERS the sidecart HTML structure in the footer.
function shopify_sidecart_render() {
    error_log('Shopify Sidecart: Render function triggered at ' . date('Y-m-d H:i:s'));
    ?>
    <div id="shopify-sidecart" class="sidecart">
        <div class="sidecart-content"></div>
    </div>
    <?php
}
add_action('wp_footer', 'shopify_sidecart_render');

// NEW FUNCTION: Manually print the shopifyProductBuyBoxData in the footer.
// This bypasses wp_localize_script for this variable, ensuring it appears.
function shopify_sidecart_print_buy_box_data() {
    global $shopify_product_buy_box_data; // Access the global array populated by your templates

    // Ensure the global array is set and is an array, even if no buy boxes were rendered.
    if (!isset($shopify_product_buy_box_data) || !is_array($shopify_product_buy_box_data)) {
        $shopify_product_buy_box_data = [];
    }

    // Print the data as a global JS variable directly into the footer HTML.
    // Use JSON_UNESCAPED_SLASHES for cleaner URLs and JSON_PRETTY_PRINT for readability in source.
    echo '<script type="text/javascript">' . "\n";
    echo '    window.shopifyProductBuyBoxData = ' . wp_json_encode($shopify_product_buy_box_data, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) . ";\n";
    echo '    console.log("[Shopify Sidecart] Manual Localization: shopifyProductBuyBoxData has been set.", window.shopifyProductBuyBoxData);' . "\n";
    
    // Add script to fetch and log product titles
    echo '    // Fetch and log product titles from Shopify' . "\n";
    echo '    if (window.shopifyProductBuyBoxData && window.shopifyProductBuyBoxData.length > 0) {' . "\n";
    echo '        const productIds = window.shopifyProductBuyBoxData.map(item => item.product_id).filter((id, index, self) => self.indexOf(id) === index);' . "\n";
    echo '        console.log("[Shopify Sidecart] Found product IDs:", productIds);' . "\n";
    echo '        ' . "\n";
    echo '        // Function to fetch product titles' . "\n";
    echo '        async function fetchProductTitles() {' . "\n";
    echo '            if (!window.shopifySettings || !window.shopifySettings.storefrontToken || !window.shopifySettings.storeUrl) {' . "\n";
    echo '                console.error("[Shopify Sidecart] Cannot fetch product titles - shopifySettings not available");' . "\n";
    echo '                return;' . "\n";
    echo '            }' . "\n";
    echo '            ' . "\n";
    echo '            const productTitles = [];' . "\n";
    echo '            ' . "\n";
    echo '            for (const productId of productIds) {' . "\n";
    echo '                try {' . "\n";
    echo '                    const query = `' . "\n";
    echo '                        query getProduct($id: ID!) {' . "\n";
    echo '                            node(id: $id) {' . "\n";
    echo '                                ... on Product {' . "\n";
    echo '                                    id' . "\n";
    echo '                                    title' . "\n";
    echo '                                    handle' . "\n";
    echo '                                }' . "\n";
    echo '                            }' . "\n";
    echo '                        }' . "\n";
    echo '                    `;' . "\n";
    echo '                    ' . "\n";
    echo '                    const response = await fetch(window.shopifySettings.storeUrl, {' . "\n";
    echo '                        method: "POST",' . "\n";
    echo '                        headers: {' . "\n";
    echo '                            "Content-Type": "application/json",' . "\n";
    echo '                            "X-Shopify-Storefront-Access-Token": window.shopifySettings.storefrontToken' . "\n";
    echo '                        },' . "\n";
    echo '                        body: JSON.stringify({' . "\n";
    echo '                            query: query,' . "\n";
    echo '                            variables: { id: `gid://shopify/Product/${productId}` }' . "\n";
    echo '                        })' . "\n";
    echo '                    });' . "\n";
    echo '                    ' . "\n";
    echo '                    const data = await response.json();' . "\n";
    echo '                    ' . "\n";
    echo '                    if (data.errors) {' . "\n";
    echo '                        console.error(`[Shopify Sidecart] Error fetching product ${productId}:`, data.errors);' . "\n";
    echo '                    } else if (data.data && data.data.node) {' . "\n";
    echo '                        productTitles.push({' . "\n";
    echo '                            id: productId,' . "\n";
    echo '                            title: data.data.node.title,' . "\n";
    echo '                            handle: data.data.node.handle' . "\n";
    echo '                        });' . "\n";
    echo '                    } else {' . "\n";
    echo '                        console.warn(`[Shopify Sidecart] Product ${productId} not found`);' . "\n";
    echo '                    }' . "\n";
    echo '                } catch (error) {' . "\n";
    echo '                    console.error(`[Shopify Sidecart] Failed to fetch product ${productId}:`, error);' . "\n";
    echo '                }' . "\n";
    echo '            }' . "\n";
    echo '            ' . "\n";
    echo '            console.log("[Shopify Sidecart] === SCANNED PRODUCT TITLES ===");' . "\n";
    echo '            productTitles.forEach((product, index) => {' . "\n";
    echo '                console.log(`${index + 1}. ${product.title} (ID: ${product.id}, Handle: ${product.handle})`);' . "\n";
    echo '            });' . "\n";
    echo '            console.log(`[Shopify Sidecart] Total products scanned: ${productTitles.length}`);' . "\n";
    echo '        }' . "\n";
    echo '        ' . "\n";
    echo '        // Wait a bit for shopifySettings to be available, then fetch titles' . "\n";
    echo '        setTimeout(fetchProductTitles, 1000);' . "\n";
    echo '    } else {' . "\n";
    echo '        console.log("[Shopify Sidecart] No products found to scan");' . "\n";
    echo '    }' . "\n";
    
    echo '</script>' . "\n";

    error_log('Shopify Sidecart: shopifyProductBuyBoxData manually printed. Content: ' . print_r($shopify_product_buy_box_data, true));
}
add_action('wp_footer', 'shopify_sidecart_print_buy_box_data', 99); // Priority 99 to ensure it runs late in the footer, after most scripts.

// Initialize GitHub updater
add_action('init', function() {
    // Only load updater in admin area
    if (!is_admin()) {
        return;
    }
    
    // Include updater class
    $updater_file = plugin_dir_path(__FILE__) . 'includes/updater.php';
    if (file_exists($updater_file)) {
        require_once $updater_file;
        
        // Get plugin data
        $plugin_data = get_file_data(__FILE__, array('Version' => 'Version'));
        $plugin_version = $plugin_data['Version'] ?? '2.1.0';
        
        // Initialize updater
        new Shopify_Sidecart_Updater(__FILE__, $plugin_version);
    }
});