# Shopify Sidecart for WordPress

A custom Shopify sidecart plugin for WordPress that integrates with Shopify's Storefront API to provide a seamless shopping cart experience.

## Features

- **Shopify Storefront API Integration**: Connect to your Shopify store using GraphQL
- **Custom Sidecart UI**: Modern, responsive sidecart with smooth animations
- **Product Buy Boxes**: Render Shopify product buy boxes anywhere on your site
- **Real-time Cart Updates**: Add, remove, and update quantities without page reloads
- **Free Shipping Progress Bar**: Visual indicator for free shipping thresholds
- **Product Recommendations**: Smart product suggestions based on cart contents
- **Mobile Responsive**: Fully responsive design for all devices
- **Customizable Styling**: CSS styles that can be easily customized to match your theme
- **GA4 Tracking Integration**: Built-in Google Analytics 4 event tracking

## Requirements

- WordPress 5.0 or higher
- PHP 7.4 or higher
- Shopify store with Storefront API access
- Storefront access token

## Installation

### Method 1: WordPress Admin (Recommended)
1. Download the plugin ZIP file
2. Go to WordPress Admin → Plugins → Add New → Upload Plugin
3. Upload the ZIP file and click "Install Now"
4. Activate the plugin

### Method 2: Manual Installation
1. Upload the `shopify-sidecart` folder to `/wp-content/plugins/`
2. Activate the plugin through the 'Plugins' menu in WordPress

## Configuration

### 1. Shopify API Settings
The plugin requires Shopify Storefront API credentials. Update these in `shopify-sidecart.php`:

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

### 3. Customizing Styles
Edit `css/sidecart.css` to match your site's design. The CSS is well-commented and organized for easy customization.

## Usage

### Automatic Initialization
The sidecart automatically initializes on page load. A cart toggle button appears on the right side of the screen.

### Manual Integration
If you need to trigger the sidecart manually:

```javascript
// Open the sidecart
document.getElementById('shopify-sidecart').classList.add('open');

// Close the sidecart  
document.getElementById('shopify-sidecart').classList.remove('open');

// Add item to cart programmatically
window.handleShopifyAddToCart(variantId, quantity, attributes);
```

## File Structure

```
shopify-sidecart/
├── shopify-sidecart.php          # Main plugin file
├── README.md                     # This file
├── css/
│   └── sidecart.css             # All sidecart styles
└── js/
    ├── sidecart.js              # Main sidecart logic
    ├── product-buy-box.js       # Product buy box rendering
    └── init-buy-boxes.js        # Buy box initialization
```

## API Reference

### JavaScript Functions

- `window.handleShopifyAddToCart(variantId, quantity, attributes)` - Add item to cart
- `window.renderShopifyBuyBox(productId, container, callback, promoConfig)` - Render buy box
- `updateCart()` - Refresh cart UI

### PHP Functions

- `shopify_sidecart_enqueue_scripts()` - Enqueues plugin scripts and styles
- `shopify_sidecart_render()` - Renders sidecart HTML
- `shopify_sidecart_print_buy_box_data()` - Outputs product data for initialization

## Troubleshooting

### Common Issues

1. **Sidecart not appearing**: Check browser console for errors. Ensure `shopifySettings` is properly localized.
2. **Products not loading**: Verify Shopify API credentials and product IDs.
3. **CSS conflicts**: Your theme may override plugin styles. Use more specific CSS selectors.
4. **JavaScript errors**: Ensure jQuery is loaded (if your theme requires it).

### Debug Mode
The plugin includes extensive error logging. Check your WordPress debug log for detailed information.

## Updates

### From WordPress.org
If published on WordPress.org, updates will appear automatically in your WordPress admin.

### Manual Updates
1. Download the latest version
2. Deactivate and delete the old version
3. Install the new version
4. Reactivate the plugin

## Changelog

### 2.1
- Initial public release
- Shopify Storefront API integration
- Custom sidecart UI
- Product buy boxes
- Free shipping progress bar
- Product recommendations

## Support

For support, feature requests, or bug reports:
- Create an issue on GitHub
- Contact the plugin author

## License

GPL v2 or later

## Credits

Developed by The Brandsmen
Website: https://thebrandsmen.com/