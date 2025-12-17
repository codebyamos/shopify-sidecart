window.dataLayer = window.dataLayer || [];

console.log('[Shopify Sidecart] Script file loaded at ' + new Date().toISOString());

// Ensure shopifySettings and acfProductData are available globally
if (typeof window.shopifySettings === 'undefined' || !window.shopifySettings.storefrontToken || !window.shopifySettings.storeUrl) {
    console.error('[Shopify Sidecart] Critical Error: shopifySettings is not defined or is incomplete. Sidecart functionality may be limited.');
}
if (typeof window.acfProductData === 'undefined') {
    console.warn('[Shopify Sidecart] Warning: acfProductData is not defined. Product subcategories may not be available for GA4 tracking.');
}

// --- Core GraphQL Query Function ---
async function queryGraphQL(query, variables = {}, retries = 2, delay = 1000) {
    const { storeUrl, storefrontToken } = window.shopifySettings || {};

    if (!storeUrl || !storefrontToken) {
        console.error('[Shopify Sidecart] Missing storeUrl or storefrontToken for GraphQL query.');
        throw new Error('Shopify API credentials missing.');
    }

    console.log('[Shopify Sidecart] Sending GraphQL query:', { query, variables });
    for (let attempt = 1; attempt <= retries + 1; attempt++) {
        try {
            const cacheBust = `nocache=${Date.now()}`;
            const url = `${storeUrl}${storeUrl.includes('?') ? '&' : '?'}${cacheBust}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Shopify-Storefront-Access-Token': storefrontToken
                },
                body: JSON.stringify({ query, variables })
            });
            const text = await response.text();
            const { data, errors } = JSON.parse(text);
            if (errors) {
                console.error('[Shopify Sidecart] GraphQL errors:', errors);
                throw new Error(errors[0].message);
            }
            console.log('[Shopify Sidecart] GraphQL response (parsed):', data);
            return data;
        } catch (error) {
            console.error(`[Shopify Sidecart] GraphQL request failed (attempt ${attempt}/${retries + 1}):`, error.message);
            if (attempt <= retries) {
                console.log(`[Shopify Sidecart] Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                console.error('[Shopify Sidecart] All retry attempts failed');
                throw error;
            }
        }
    }
}

// --- Helper to get ACF Subcategory ---
async function getAcfSubcategory(productId) {
    console.log('[Shopify Sidecart] Fetching subcategory for productId:', productId);
    return new Promise((resolve) => {
        const subcategory = window.acfProductData?.[productId]?.product_subcategory || 'N/A';
        console.log('[Shopify Sidecart] Subcategory result:', subcategory);
        resolve(subcategory);
    });
}

// --- Show Popup for Error Messages ---
function showPopup(message, buttonText, buttonUrl) {
    let popup = document.querySelector('.sidecart-popup');
    let backdrop = document.querySelector('.sidecart-popup-backdrop');

    if (popup) popup.remove();
    if (backdrop) backdrop.remove();

    backdrop = document.createElement('div');
    backdrop.className = 'sidecart-popup-backdrop';
    backdrop.style.position = 'fixed';
    backdrop.style.top = '0';
    backdrop.style.left = '0';
    backdrop.style.width = '100%';
    backdrop.style.height = '100%';
    backdrop.style.backgroundColor = 'rgba(0,0,0,0.5)';
    backdrop.style.zIndex = '999';
    document.body.appendChild(backdrop);

    popup = document.createElement('div');
    popup.className = 'sidecart-popup';
    popup.style.position = 'fixed';
    popup.style.top = '50%';
    popup.style.left = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    popup.style.backgroundColor = 'white';
    popup.style.padding = '20px';
    popup.style.borderRadius = '5px';
    popup.style.zIndex = '1000';
    popup.style.maxWidth = '90%';
    popup.style.width = '400px';
    popup.style.boxShadow = '0 4px 10px rgba(0,0,0,0.3)';
    popup.style.textAlign = 'center';
    popup.style.fontFamily = 'Arial, sans-serif';

    if (window.innerWidth <= 600) {
        popup.style.width = '90%';
        popup.style.padding = '15px';
    }

    popup.innerHTML = `
        <span class="popup-close" style="position: absolute; top: 10px; right: 15px; cursor: pointer; font-size: 20px; color: #82641e;">×</span>
        <p style="margin: 0 0 15px 0; font-size: 16px; color: #333; line-height: 1.5;">${message}</p>
        ${buttonText && buttonUrl ? `<a href="${buttonUrl}" style="display: inline-block; background-color: #82641e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 3px; font-size: 14px; font-weight: bold;">${buttonText}</a>` : ''}
    `;
    document.body.appendChild(popup);

    document.body.style.overflow = 'hidden';

    const timeout = setTimeout(() => {
        popup.remove();
        backdrop.remove();
        document.body.style.overflow = '';
    }, 10000);

    const closePopup = () => {
        popup.remove();
        backdrop.remove();
        document.body.style.overflow = '';
        clearTimeout(timeout);
    };

    backdrop.addEventListener('click', closePopup);
    popup.querySelector('.popup-close').addEventListener('click', closePopup);

    if (buttonText && buttonUrl) {
        popup.querySelector('a').addEventListener('click', closePopup);
    }
}

// --- Render Single Cart Item HTML ---
function renderCartItem(itemNode) {
    const lineId = itemNode.id;
    const productTitle = itemNode.merchandise.product.title;
    const variantImageUrl = itemNode.merchandise.image?.url || itemNode.merchandise.product.images.edges[0]?.node.url || '';
    const quantity = itemNode.quantity;

    // Shopify-driven pricing logic
    const finalLinePrice = parseFloat(itemNode.cost.totalAmount.amount);
    const originalLinePrice = parseFloat(itemNode.merchandise.price.amount) * quantity;
    const hasDiscount = finalLinePrice < originalLinePrice;

    let priceHtml;
    if (hasDiscount) {
        priceHtml = `
            <span class="item-price-final">$${finalLinePrice.toFixed(2)}</span>
            <s class="item-price-original">$${originalLinePrice.toFixed(2)}</s>
        `;
    } else {
        priceHtml = `<span class="item-price-final">$${finalLinePrice.toFixed(2)}</span>`;
    }
    
    const variantOptions = itemNode.merchandise.selectedOptions.filter(opt => opt.value !== 'Default Title');
    const optionsString = variantOptions.map(opt => `<span>${opt.name}: ${opt.value}</span>`).join('');
    
    const customAttributesDisplay = itemNode.attributes
        .filter(attr => !attr.key.startsWith('_')) // Hide internal attributes
        .map(attr => `<div class="item-attribute">${attr.key}: ${attr.value}</div>`)
        .join('');

    const variantClass = optionsString || customAttributesDisplay ? 'has-variant-details' : '';

    return `
        <div class="cart-item ${variantClass}" data-line-id="${lineId}" data-variant-id="${itemNode.merchandise.id}">
            <img src="${variantImageUrl}" alt="${productTitle}" />
            <div class="item-details">
                <span class="item-title">${productTitle}</span>
                ${optionsString ? `<div class="item-variant-detail">${optionsString}</div>` : ''}
                ${customAttributesDisplay ? `<div class="item-custom-attributes">${customAttributesDisplay}</div>` : ''}
                <div class="quantity-controls">
                    <button class="decrease-qty" data-line-id="${lineId}">-</button>
                    <input type="number" class="quantity" value="${quantity}" min="0" data-line-id="${lineId}" />
                    <button class="increase-qty" data-line-id="${lineId}">+</button>
                </div>
            </div>
            <div class="item-price-container">${priceHtml}</div>
        </div>
    `;
}

// --- Update Toggle Button Count ---
function updateToggleCount(items) {
    const toggleButton = document.querySelector('[data-component="toggle"]');
    if (toggleButton) {
        const totalItems = items.reduce((sum, { node }) => sum + node.quantity, 0);
        toggleButton.innerHTML = `${totalItems}<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="white" d="M24 0C10.7 0 0 10.7 0 24S10.7 48 24 48H76.1l60.3 316.5c2.2 11.3 12.1 19.5 23.6 19.5H488c13.3 0 24-10.7 24-24s-10.7-24-24-24H179.9l-9.1-48h317c14.3 0 26.9-9.5 30.8-23.3l54-192C578.3 52.3 563 32 541.8 32H122l-2.4-12.5C117.4 8.2 107.5 0 96 0H24zM176 512c26.5 0 48-21.5 48-48s-21.5-48-48-48s-48 21.5-48 48s21.5 48 48 48zm336-48c0-26.5-21.5-48-48-48s-48 21.5-48 48s21.5 48 48 48s48-21.5 48-48z"></path></svg>`;
    }
}

// --- Initialize Toggle Button ---
function initializeToggleButton() {
    const toggleButton = document.createElement('button');
    toggleButton.setAttribute('role', 'button');
    toggleButton.setAttribute('aria-label', 'Toggle Cart');
    toggleButton.setAttribute('data-component', 'toggle');
    toggleButton.style.zIndex = '10';
    toggleButton.style.backgroundColor = '#82641e';
    toggleButton.style.gap = '5px';
    toggleButton.onmouseover = () => { toggleButton.style.backgroundColor = 'black'; };
    toggleButton.onmouseout = () => { toggleButton.style.backgroundColor = '#82641e'; };
    document.body.appendChild(toggleButton);

    toggleButton.addEventListener('click', () => {
        document.getElementById('shopify-sidecart')?.classList.toggle('open');
    });

    updateToggleCount([]);
}

// --- Initialize Custom Scrollbar ---
function initCustomScrollbar() {
    const wrapper = document.querySelector('.cart-items-wrapper');
    const track = document.querySelector('.custom-scrollbar-track');
    const thumb = document.querySelector('.custom-scrollbar-thumb');
    
    if (!wrapper || !track || !thumb) return;
    
    let isDragging = false;
    let startY = 0;
    let startScrollTop = 0;
    
    function updateThumb() {
        const scrollHeight = wrapper.scrollHeight;
        const clientHeight = wrapper.clientHeight;
        
        if (scrollHeight <= clientHeight) {
            track.style.display = 'none';
            return;
        }
        
        track.style.display = 'block';
        
        // Calculate thumb height (proportional to visible area)
        const thumbHeight = Math.max(30, (clientHeight / scrollHeight) * clientHeight);
        thumb.style.height = thumbHeight + 'px';
        
        // Calculate thumb position
        const scrollRatio = wrapper.scrollTop / (scrollHeight - clientHeight);
        const thumbTop = scrollRatio * (clientHeight - thumbHeight);
        thumb.style.top = thumbTop + 'px';
    }
    
    // Update thumb on scroll
    wrapper.addEventListener('scroll', updateThumb);
    
    // Handle thumb drag
    thumb.addEventListener('mousedown', (e) => {
        isDragging = true;
        startY = e.clientY;
        startScrollTop = wrapper.scrollTop;
        document.body.style.userSelect = 'none';
        e.preventDefault();
    });
    
    // Touch support for mobile
    thumb.addEventListener('touchstart', (e) => {
        isDragging = true;
        startY = e.touches[0].clientY;
        startScrollTop = wrapper.scrollTop;
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const deltaY = e.clientY - startY;
        const scrollHeight = wrapper.scrollHeight;
        const clientHeight = wrapper.clientHeight;
        const thumbHeight = thumb.offsetHeight;
        
        const scrollRatio = deltaY / (clientHeight - thumbHeight);
        wrapper.scrollTop = startScrollTop + scrollRatio * (scrollHeight - clientHeight);
    });
    
    document.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        
        const deltaY = e.touches[0].clientY - startY;
        const scrollHeight = wrapper.scrollHeight;
        const clientHeight = wrapper.clientHeight;
        const thumbHeight = thumb.offsetHeight;
        
        const scrollRatio = deltaY / (clientHeight - thumbHeight);
        wrapper.scrollTop = startScrollTop + scrollRatio * (scrollHeight - clientHeight);
    });
    
    document.addEventListener('mouseup', () => {
        isDragging = false;
        document.body.style.userSelect = '';
    });
    
    document.addEventListener('touchend', () => {
        isDragging = false;
    });
    
    // Click on track to scroll
    track.addEventListener('click', (e) => {
        if (e.target === thumb) return;
        
        const trackRect = track.getBoundingClientRect();
        const clickY = e.clientY - trackRect.top;
        const thumbHeight = thumb.offsetHeight;
        const clientHeight = wrapper.clientHeight;
        const scrollHeight = wrapper.scrollHeight;
        
        const scrollRatio = (clickY - thumbHeight / 2) / (clientHeight - thumbHeight);
        wrapper.scrollTop = scrollRatio * (scrollHeight - clientHeight);
    });
    
    // Initial update with delay to ensure DOM is ready
    updateThumb();
    setTimeout(updateThumb, 100);
    setTimeout(updateThumb, 300);
    setTimeout(updateThumb, 500);
    
    // Update on window resize with debounce
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            updateThumb();
            setTimeout(updateThumb, 100);
        }, 50);
    });
    
    // Also update on orientation change (mobile)
    window.addEventListener('orientationchange', () => {
        setTimeout(updateThumb, 100);
        setTimeout(updateThumb, 300);
        setTimeout(updateThumb, 500);
    });
    
    // Update when sidecart opens (observe class changes)
    const sidecart = document.getElementById('shopify-sidecart');
    if (sidecart) {
        const observer = new MutationObserver(() => {
            if (sidecart.classList.contains('open')) {
                setTimeout(updateThumb, 50);
                setTimeout(updateThumb, 200);
            }
        });
        observer.observe(sidecart, { attributes: true, attributeFilter: ['class'] });
    }
}

// --- Attach Event Listeners for Quantity Controls ---
function attachQuantityEventListeners() {
    document.querySelectorAll('#shopify-sidecart .decrease-qty, #shopify-sidecart .increase-qty').forEach(button => {
        button.addEventListener('click', handleQuantityChange);
    });
}

// --- Handle Quantity Change ---
async function handleQuantityChange(event) {
    const button = event.currentTarget;
    const lineId = button.dataset.lineId;
    const quantityInput = button.parentElement.querySelector('.quantity');
    let newQty = parseInt(quantityInput.value, 10);

    if (button.classList.contains('increase-qty')) newQty++;
    else newQty--;
    
    if (isNaN(newQty) || newQty < 0) return;

    try {
        const cartId = localStorage.getItem('shopifyCartId');
        if (newQty === 0) {
            await queryGraphQL(`mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) { cartLinesRemove(cartId: $cartId, lineIds: $lineIds) { cart { id } } }`, { cartId, lineIds: [lineId] });
        } else {
            await queryGraphQL(`mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) { cartLinesUpdate(cartId: $cartId, lines: $lines) { cart { id } } }`, { cartId, lines: [{ id: lineId, quantity: newQty }] });
        }
        await updateCart();
    } catch (error) {
        console.error('Failed to update quantity:', error);
        showPopup('Error updating cart.');
        await updateCart();
    }
}

// --- Main Cart Update/Render Function ---
async function updateCart() {
    console.log('[Shopify Sidecart] Updating cart UI...');
    const cartId = localStorage.getItem('shopifyCartId');
    const { freeShippingThreshold } = window.shopifySettings || {};
    
    const sidecart = document.getElementById('shopify-sidecart');
    let sidecartContent = sidecart.querySelector('.sidecart-content');

    // Create base structure if it doesn't exist
    if (!sidecartContent) {
        sidecart.innerHTML = '<div class="sidecart-content"></div>';
        sidecartContent = sidecart.querySelector('.sidecart-content');
    }

    if (!cartId) {
        sidecartContent.innerHTML = '<p style="text-align: center; margin: 20px;">Your cart is empty.</p>';
        updateToggleCount([]);
        return;
    }

    try {
        const { cart } = await queryGraphQL(
        `query($cartId: ID!) {
          cart(id: $cartId) {
            id
            checkoutUrl
            cost {
              totalAmount { amount }
            }
            lines(first: 20) {
              edges {
                node {
                  id
                  quantity
                  attributes { key value }
                  cost {
                    totalAmount { amount }
                  }
                  merchandise {
                    ... on ProductVariant {
                      id
                      title
                      image { url }
                      price { amount }
                      selectedOptions { name value }
                      product {
                        id
                        title
                        images(first: 1) { edges { node { url } } }
                      }
                    }
                  }
                }
              }
            }
          }
        }`, { cartId });

        if (!cart) {
            localStorage.removeItem('shopifyCartId');
            return updateCart();
        }

        const newCartItems = cart.lines.edges;
        
        // Re-render the full sidecart structure to ensure consistency
        sidecartContent.innerHTML = `
            <div class="sidecart-header">
                <span>Cart</span>
                <svg data-modal-close-cart="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" width="21px" height="21px" style="cursor: pointer;"><path data-modal-close-cart="true" fill="#000" d="M310.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L160 210.7 54.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L114.7 256 9.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 301.3 265.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L205.3 256 310.6 150.6z"></path></svg>
            </div>
            <div class="progress-container">
                <div data-component="progress-bar"><div data-component="bar" style="background-color: #82641e;"></div></div>
                <span class="shipping-message"></span>
            </div>
            <div class="sidecart-main-content">
                <div class="custom-scrollbar-container">
                    <div class="cart-items-wrapper">
                        ${newCartItems.length > 0 ? newCartItems.map(({ node }) => renderCartItem(node)).join('') : '<p style="text-align: center; margin: auto; font-size: 14px; max-width: 200px;">No Products Added</p>'}
                    </div>
                    <div class="custom-scrollbar-track">
                        <div class="custom-scrollbar-thumb"></div>
                    </div>
                </div>
                <div class="subtotal">
                    <span>Subtotal</span>
                    <span>$${parseFloat(cart.cost.totalAmount.amount).toFixed(2)}</span>
                </div>
            </div>
            <div class="suggestions-and-checkout">
                <div class="product-suggestions"><h3>Recommended Products</h3></div>
                <button class="checkout-button" style="display: block; width: 100%; padding: 0px; background-color: #82641e; color: white; text-align: center; border: none; cursor: pointer; margin-top: 10px; font-size: 16px;">Checkout</button>
            </div>
        `;

        // Initialize custom scrollbar
        initCustomScrollbar();

        // Re-attach event listeners
        sidecartContent.querySelector('[data-modal-close-cart]').addEventListener('click', () => sidecart.classList.remove('open'));
        sidecartContent.querySelector('.checkout-button').addEventListener('click', () => window.location.href = cart.checkoutUrl);
        sidecartContent.querySelector('.checkout-button').onmouseover = (e) => { e.currentTarget.style.backgroundColor = 'black'; };
        sidecartContent.querySelector('.checkout-button').onmouseout = (e) => { e.currentTarget.style.backgroundColor = '#82641e'; };

        // Update progress bar
        const progressContainer = sidecartContent.querySelector('.progress-container');
        progressContainer.style.display = newCartItems.length > 0 ? 'block' : 'none';
        const totalAmount = parseFloat(cart.cost.totalAmount.amount);
        const progress = Math.min((totalAmount / (freeShippingThreshold / 100)) * 100, 100);
        progressContainer.querySelector('[data-component="bar"]').style.width = `${progress}%`;
        progressContainer.querySelector('.shipping-message').textContent = totalAmount * 100 >= freeShippingThreshold ?
            "You've unlocked Free Shipping" :
            `Add $${((freeShippingThreshold / 100) - totalAmount).toFixed(2)} for Free Shipping`;

        updateToggleCount(newCartItems);
        attachQuantityEventListeners();
        updateProductSuggestionsContent();

    } catch (error) {
        console.error('[Shopify Sidecart] Failed to update cart:', error);
        sidecartContent.innerHTML = '<p>Error loading cart. Please try again.</p>';
    }
}

// --- GLOBAL ADD TO CART FUNCTION ---
window.handleShopifyAddToCart = async function(variantId, quantity = 1, attributes = []) {
    console.log('[Shopify Sidecart] Adding to cart:', { variantId, quantity, attributes });
    try {
        let cartId = localStorage.getItem('shopifyCartId');
        const lines = [{ merchandiseId: variantId, quantity, attributes }];

        if (!cartId) {
            const { cartCreate } = await queryGraphQL(
                `mutation cartCreate($lines: [CartLineInput!]) { cartCreate(input: { lines: $lines }) { cart { id } } }`,
                { lines }
            );
            cartId = cartCreate.cart.id;
            localStorage.setItem('shopifyCartId', cartId);
        } else {
            await queryGraphQL(
                `mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) { cartLinesAdd(cartId: $cartId, lines: $lines) { cart { id } } }`,
                { cartId, lines }
            );
        }

        await updateCart();
        document.getElementById('shopify-sidecart').classList.add('open');

    } catch (error) {
        console.error('[Shopify Sidecart] Failed to add item to cart:', error);
        showPopup('Failed to add item to cart. Please try again.');
    }
};

// --- Slider state management ---
let suggestionSliderInterval = null;
let currentSlideIndex = 0;

// --- Update Product Suggestions ---
async function updateProductSuggestionsContent() {
    console.log('[Shopify Sidecart] Updating product suggestions');
    const productSuggestions = document.querySelector('.product-suggestions');
    if (!productSuggestions) {
        return;
    }
    
    // Clear any existing slider interval
    if (suggestionSliderInterval) {
        clearInterval(suggestionSliderInterval);
        suggestionSliderInterval = null;
    }
    
    try {
        // First, get the current cart items to determine categories
        const cartId = localStorage.getItem('shopifyCartId');
        let cartCategories = [];
        let cartProductIds = [];
        
        if (cartId) {
            // Fetch cart with category for each item
            const { cart } = await queryGraphQL(
            `query($cartId: ID!) {
                cart(id: $cartId) {
                    lines(first: 20) {
                        edges {
                            node {
                                merchandise {
                                    ... on ProductVariant {
                                        product {
                                            id
                                            category {
                                                id
                                                name
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }`, { cartId });
            
            if (cart && cart.lines.edges.length > 0) {
                // Extract unique categories and product IDs from cart
                cart.lines.edges.forEach(({ node }) => {
                    const category = node.merchandise.product.category;
                    const productId = node.merchandise.product.id;
                    if (category && category.name && !cartCategories.includes(category.name)) {
                        cartCategories.push(category.name);
                    }
                    if (productId && !cartProductIds.includes(productId)) {
                        cartProductIds.push(productId);
                    }
                });
                console.log('[Shopify Sidecart] Cart categories:', cartCategories);
                console.log('[Shopify Sidecart] Cart product IDs:', cartProductIds);
            }
        }
        
        let suggestions = [];
        const targetSuggestions = 8; // Target 6-8 suggestions for the slider
        
        if (cartCategories.length > 0) {
            // Fetch recommendations based on cart categories
            // Fetch all products and filter by category on our side
            const { products: allProducts } = await queryGraphQL(
            `query {
                products(first: 50, sortKey: BEST_SELLING) {
                    edges {
                        node {
                            id
                            title
                            handle
                            category {
                                id
                                name
                            }
                            priceRange { minVariantPrice { amount } }
                            images(first: 1) { edges { node { url } } }
                        }
                    }
                }
            }`);
            
            // First, add products from cart categories
            cartCategories.forEach((categoryName) => {
                // Filter products that match this category and are not in cart
                const categoryProducts = allProducts.edges.filter(({ node }) => 
                    !cartProductIds.includes(node.id) && 
                    node.category && node.category.name === categoryName &&
                    !suggestions.some(s => s.node.id === node.id)
                );
                
                console.log(`[Shopify Sidecart] Found ${categoryProducts.length} products for category "${categoryName}"`);
                
                // Shuffle and add products from this category
                const shuffled = categoryProducts.sort(() => 0.5 - Math.random());
                suggestions.push(...shuffled.slice(0, Math.ceil(targetSuggestions / cartCategories.length)));
            });
            
            // Fill remaining slots with other best sellers not already included
            if (suggestions.length < targetSuggestions) {
                const additionalProducts = allProducts.edges
                    .filter(({ node }) => !cartProductIds.includes(node.id) && !suggestions.some(s => s.node.id === node.id))
                    .sort(() => 0.5 - Math.random())
                    .slice(0, targetSuggestions - suggestions.length);
                
                suggestions = [...suggestions, ...additionalProducts];
            }
        } else {
            // No cart items or no categories - fall back to random best sellers
            console.log('[Shopify Sidecart] No cart categories, fetching general recommendations...');
            const { products } = await queryGraphQL(
            `query {
                products(first: 20, sortKey: BEST_SELLING) {
                    edges {
                        node {
                            id
                            title
                            handle
                            category {
                                id
                                name
                            }
                            priceRange { minVariantPrice { amount } }
                            images(first: 1) { edges { node { url } } }
                        }
                    }
                }
            }`);
            
            suggestions = products.edges
                .filter(({ node }) => !cartProductIds.includes(node.id))
                .sort(() => 0.5 - Math.random())
                .slice(0, targetSuggestions);
        }
        
        // Shuffle final suggestions
        suggestions = suggestions.sort(() => 0.5 - Math.random()).slice(0, targetSuggestions);

        let suggestionsContainer = productSuggestions.querySelector('.suggestions-container');
        if (!suggestionsContainer) {
            suggestionsContainer = document.createElement('div');
            suggestionsContainer.className = 'suggestions-container';
            productSuggestions.appendChild(suggestionsContainer);
        }
        
        if (suggestions.length > 0) {
            // Create slider HTML with dots navigation
            const dotsHtml = suggestions.map((_, index) => 
                `<span class="slider-dot${index === 0 ? ' active' : ''}" data-slide="${index}"></span>`
            ).join('');
            
            suggestionsContainer.innerHTML = `
                <div class="suggestions-slider">
                    ${suggestions.map(({ node }) => `
                        <a href="/product/${node.handle}" class="suggestion">
                            <img src="${node.images.edges[0]?.node.url || ''}" alt="${node.title}" />
                            <span>${node.title}</span>
                            <span>$${parseFloat(node.priceRange.minVariantPrice.amount).toFixed(2)}</span>
                        </a>
                    `).join('')}
                </div>
                <div class="slider-dots">${dotsHtml}</div>
            `;
            
            // Initialize slider
            currentSlideIndex = 0;
            initSuggestionSlider(suggestions.length);
            
            console.log('[Shopify Sidecart] Rendered slider with suggestions:', suggestions.map(({ node }) => `${node.title} (${node.category?.name || 'N/A'})`));
        } else {
            productSuggestions.style.display = 'none';
        }
    } catch (error) {
        console.error('[Shopify Sidecart] Failed to fetch product suggestions:', error);
        productSuggestions.style.display = 'none';
    }
}

// --- Initialize Suggestion Slider ---
function initSuggestionSlider(totalSlides) {
    const slider = document.querySelector('.suggestions-slider');
    const dots = document.querySelectorAll('.slider-dot');
    
    if (!slider || totalSlides <= 1) return;
    
    // Function to go to a specific slide
    function goToSlide(index) {
        currentSlideIndex = index;
        slider.style.transform = `translateX(-${index * 100}%)`;
        
        // Update dots
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
    }
    
    // Function to go to next slide
    function nextSlide() {
        const nextIndex = (currentSlideIndex + 1) % totalSlides;
        goToSlide(nextIndex);
    }
    
    // Add click handlers to dots
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            goToSlide(index);
            // Reset autoplay timer when manually clicking
            if (suggestionSliderInterval) {
                clearInterval(suggestionSliderInterval);
            }
            suggestionSliderInterval = setInterval(nextSlide, 5000);
        });
    });
    
    // Start autoplay (5 seconds interval)
    suggestionSliderInterval = setInterval(nextSlide, 5000);
    
    console.log('[Shopify Sidecart] Slider initialized with', totalSlides, 'slides');
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    const sidecartElement = document.createElement('div');
    sidecartElement.id = 'shopify-sidecart';
    sidecartElement.innerHTML = '<div class="sidecart-content"><p>Loading Cart...</p></div>';
    document.body.appendChild(sidecartElement);

    initializeToggleButton();
    updateCart();
});