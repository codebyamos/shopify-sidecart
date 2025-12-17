=== Shopify Sidecart ===
Contributors: thebrandsmen
Donate link: https://thebrandsmen.com/
Tags: shopify, cart, ecommerce, sidecart, shopping cart, storefront api
Requires at least: 5.0
Tested up to: 6.5
Requires PHP: 7.4
Stable tag: 2.1.0
License: GPL v2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

A custom Shopify sidecart plugin for WordPress that integrates with Shopify's Storefront API to provide a seamless shopping cart experience.

== Description ==

Shopify Sidecart is a powerful WordPress plugin that brings Shopify's ecommerce functionality to your WordPress site. It integrates directly with Shopify's Storefront API using GraphQL to provide a modern, responsive sidecart experience.

= Key Features =

* **Shopify Storefront API Integration**: Connect to your Shopify store using GraphQL
* **Custom Sidecart UI**: Modern, responsive sidecart with smooth animations
* **Product Buy Boxes**: Render Shopify product buy boxes anywhere on your site
* **Real-time Cart Updates**: Add, remove, and update quantities without page reloads
* **Free Shipping Progress Bar**: Visual indicator for free shipping thresholds
* **Product Recommendations**: Smart product suggestions based on cart contents
* **Mobile Responsive**: Fully responsive design for all devices
* **Customizable Styling**: CSS styles that can be easily customized to match your theme
* **GA4 Tracking Integration**: Built-in Google Analytics 4 event tracking

= Use Cases =

* WordPress sites that want to sell Shopify products
* Content sites with embedded Shopify products
* Blogs with product recommendations
* Any WordPress site needing a modern cart experience

== Installation ==

= Automatic Installation =

1. Go to Plugins → Add New in your WordPress admin
2. Search for "Shopify Sidecart"
3. Click "Install Now" and then "Activate"

= Manual Installation =

1. Download the plugin ZIP file
2. Go to WordPress Admin → Plugins → Add New → Upload Plugin
3. Upload the ZIP file and click "Install Now"
4. Activate the plugin

= FTP Installation =

1. Upload the `shopify-sidecart` folder to `/wp-content/plugins/`
2. Activate the plugin through the 'Plugins' menu in WordPress

== Configuration ==

### 1. Shopify API Settings

After activation, you need to configure your Shopify API credentials. Update these in `shopify-sidecart.php`:

```php
wp_localize_script('shopify-sidecart', 'shopifySettings', [
    'storefrontToken' => 'YOUR_STOREFRONT_ACCESS_TOKEN',
    'storeUrl' => 'https://YOUR-STORE.myshopify.com/api/2025-01/graphql.json',
    'freeShippingThreshold' => 15000 // Amount in cents
]);
```

### 2. Displaying Product Buy Boxes

Use the following PHP code in your templates to render Shopify product buy boxes:

```php
global $shopify_product_buy_box_data;
$shopify_product_buy_box_data[] = [
    'product_id' => 'SHOPIFY_PRODUCT_ID',
    'container_id' => 'unique-container-id',
    'has_shirt_promo' => false, // Set to true for shirt promotions
    // Optional shirt promo config
    'shirt_product_id' => 'SHIRT_PRODUCT_ID',
    'shirt_image' => 'URL_TO_SHIRT_IMAGE',
    'shirt_promo_text' => 'Get a free t-shirt with purchase!',
    'shirt_promo_disclaimer' => 'Limited time offer'
];
?>
<div id="unique-container-id"></div>
```

== Frequently Asked Questions ==

= How do I get my Shopify Storefront API token? =

1. Go to your Shopify admin
2. Navigate to Settings → Apps and sales channels → Develop apps
3. Create a new app or select an existing one
4. Go to Configuration → Storefront API
5. Generate a storefront access token

= The sidecart is not appearing on my site =

Check the browser console for JavaScript errors. Common issues include:
* Missing Shopify API credentials
* JavaScript conflicts with your theme
* Incorrect product IDs

Make sure `shopifySettings` is properly localized in the plugin.

= Can I customize the sidecart design? =

Yes! All styles are in `css/sidecart.css`. You can modify this file to match your site's design. The CSS is well-commented and organized for easy customization.

= Does this plugin work with page builders? =

Yes, you can use the plugin with page builders by adding the product buy box code to custom HTML blocks or using shortcodes (if implemented).

= Is there a shortcode available? =

Currently, the plugin requires manual PHP integration. Future versions may include shortcode support.

== Screenshots ==

1. Sidecart open on desktop
2. Mobile responsive sidecart
3. Product buy box with options
4. Free shipping progress bar
5. Product recommendations slider

== Changelog ==

= 2.1.0 =
* Initial public release
* Shopify Storefront API integration
* Custom sidecart UI
* Product buy boxes
* Free shipping progress bar
* Product recommendations

= 1.0.0 =
* Initial development version

== Upgrade Notice ==

= 2.1.0 =
First public release. Requires Shopify Storefront API credentials.

== Arbitrary section ==

You may add arbitrary sections here, though WordPress.org may not display them on the plugin page.

== A brief Markdown example ==

You can use Markdown in your readme.txt file, though note that WordPress.org only supports a subset of Markdown syntax.

Ordered list:

1. Item 1
2. Item 2
3. Item 3

Unordered list:

* Item
* Item
* Item