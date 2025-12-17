// YOUR_PLUGIN_DIRECTORY/js/product-buy-box.js

// Ensure shopifySettings is available (from wp_localize_script)
if (typeof shopifySettings === 'undefined') {
    console.error('Shopify Sidecart: shopifySettings not found. Make sure wp_localize_script is correctly set up.');
}

/**
 * Fetches Shopify product data via Storefront API and renders Buy Box.
 * It will automatically show variant dropdowns if the product has multiple options.
 * @param {string} shopifyProductId - The numeric Shopify Product ID.
 * @param {HTMLElement} containerElement - The DOM element where the buy box should be rendered.
 * @param {function} addToCartCallback - A callback function for when the "Add to Cart" button is clicked.
 * It will be called with (variantId, quantity).
 * @param {object|null} promoConfig - Optional promo configuration for shirt popup.
 */
function renderShopifyBuyBox(shopifyProductId, containerElement, addToCartCallback, promoConfig = null) {
    if (!shopifyProductId || !containerElement || !shopifySettings || !shopifySettings.storefrontToken || !shopifySettings.storeUrl) {
        console.error('Shopify Sidecart: Missing required parameters for renderShopifyBuyBox or shopifySettings are incomplete.', {
            shopifyProductId,
            containerElement,
            shopifySettings
        });
        if (containerElement) {
            containerElement.innerHTML = '<p style="color: red;">Product data missing or API not configured.</p>';
        }
        return;
    }

    containerElement.innerHTML = '<p class="loading-message">Loading product options...</p>'; // Show loading message

    const storefrontApiUrl = shopifySettings.storeUrl;
    const storefrontAccessToken = shopifySettings.storefrontToken;

    const productGid = `gid://shopify/Product/${shopifyProductId}`;

    const query = `
        query getProduct($id: ID!) {
            node(id: $id) {
                ... on Product {
                    id
                    title
                    descriptionHtml
                    onlineStoreUrl
                    options(first: 10) {
                        id
                        name
                        values
                    }
                    variants(first: 20) {
                        nodes {
                            id
                            title
                            availableForSale
                            price {
                                amount
                                currencyCode
                            }
                            selectedOptions {
                                name
                                value
                            }
                        }
                    }
                }
            }
        }
    `;

    fetch(storefrontApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Storefront-Access-Token': storefrontAccessToken,
            },
            body: JSON.stringify({
                query: query,
                variables: {
                    id: productGid
                }
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Shopify Sidecart: GraphQL Response for product ID', shopifyProductId, data);

            if (data.errors) {
                console.error('Shopify Sidecart: GraphQL Errors:', data.errors);
                containerElement.innerHTML = '<p style="color: red;">Error fetching product data.</p>';
                return;
            }

            const product = data.data.node;

            if (!product) {
                console.warn('Shopify Sidecart: Product not found (node: null) for ID', shopifyProductId);
                containerElement.innerHTML = '<p>Product not found or unavailable.</p>';
                return;
            }

            containerElement.innerHTML = ''; // Clear loading message

            const variants = product.variants.nodes;
            const options = product.options;

            // If there are no variants at all, handle as unavailable.
            if (!variants || variants.length === 0) {
                containerElement.innerHTML = '<p>No variants found for this product.</p>';
                return;
            }

            let selectedVariant; // This will be set by updateVariantSelection()

            // Create main buy box wrapper
            const buyBoxWrapper = document.createElement('div');
            buyBoxWrapper.classList.add('custom-shopify-buy-box');

            const hasMultipleOptions = options && options.length > 0 && options.some(option => option.values.length > 1);

            // Render Options/Dropdowns if product has them
            if (hasMultipleOptions) {
                console.log(`Shopify Sidecart: Product ID ${shopifyProductId} has options with multiple values. Attempting to render dropdowns.`);
                options.forEach((option, index) => {
                    if (option.values.length > 1) { // Ensure the option itself has multiple values
                        // --- REMOVED LABEL CREATION ---
                        // const optionLabel = document.createElement('label');
                        // optionLabel.textContent = option.name + ':';
                        // optionLabel.style.display = 'block';
                        // buyBoxWrapper.appendChild(optionLabel);

                        const select = document.createElement('select');
                        select.classList.add('product-option-select');
                        select.setAttribute('data-option-name', option.name);

                        option.values.forEach(value => {
                            const optionElem = document.createElement('option');
                            optionElem.value = value;
                            optionElem.textContent = value;
                            select.appendChild(optionElem);
                        });

                        select.addEventListener('change', () => {
                            updateVariantSelection();
                        });
                        buyBoxWrapper.appendChild(select);
                    }
                });
            } else {
                console.log(`Shopify Sidecart: Product ID ${shopifyProductId} has no options with multiple values. Will render simple button.`);
                selectedVariant = variants[0]; // If no dropdowns, selectedVariant is just the first one
            }

            // --- REMOVED PRICE DISPLAY CREATION ---


            const addToCartBtn = document.createElement('button');
            addToCartBtn.classList.add('btn', 'btn-primary', 'add-to-custom-cart');
            addToCartBtn.textContent = 'Add to Cart';
            buyBoxWrapper.appendChild(addToCartBtn); // Append before setting text/state

            containerElement.appendChild(buyBoxWrapper);

            // Function to update button availability based on selected options
            function updateVariantSelection() {
                let currentSelectedOptions = {};
                let foundVariant = null;

                if (hasMultipleOptions) { // Only attempt to get selected options if dropdowns were rendered
                    buyBoxWrapper.querySelectorAll('.product-option-select').forEach(select => {
                        const optionName = select.getAttribute('data-option-name');
                        currentSelectedOptions[optionName] = select.value;
                    });
                    // Find the matching variant based on selected options
                    foundVariant = variants.find(variant => {
                        return variant.selectedOptions.every(selectedOpt => {
                            return currentSelectedOptions[selectedOpt.name] === selectedOpt.value;
                        });
                    });
                } else {
                    // If no dropdowns, just use the first (and only) variant
                    foundVariant = variants[0];
                }

                // If a variant is found (either by selection or default)
                if (foundVariant) {
                    selectedVariant = foundVariant; // Update the globally scoped selectedVariant
                    
                    // --- REMOVED PRICE DISPLAY UPDATE ---

                    addToCartBtn.setAttribute('data-variant-id', selectedVariant.id);

                    if (selectedVariant.availableForSale) {
                        addToCartBtn.disabled = false;
                        addToCartBtn.textContent = 'Add to Cart';
                    } else {
                        addToCartBtn.disabled = true;
                        addToCartBtn.textContent = 'Out of Stock'; // More specific message
                    }
                    console.log('Shopify Sidecart: Current Selected Variant:', selectedVariant);
                } else {
                    // --- REMOVED PRICE DISPLAY UPDATE ---

                    addToCartBtn.disabled = true;
                    addToCartBtn.textContent = 'Not Available';
                    console.warn('Shopify Sidecart: No matching variant found for selected options (or no suitable default).');
                }
            }

            // Initial variant selection and UI update
            updateVariantSelection();

            // Add event listener for the "Add to Cart" button
            addToCartBtn.addEventListener('click', () => {
                const variantId = addToCartBtn.getAttribute('data-variant-id');
                if (variantId && typeof addToCartCallback === 'function' && !addToCartBtn.disabled) {
                    // Check if this product has a shirt promo
                    if (promoConfig && promoConfig.shirtProductId) {
                        showShirtPromoModal(promoConfig, variantId, addToCartCallback);
                    } else {
                        addToCartCallback(variantId, 1); // Assuming quantity is always 1 for now
                        console.log(`Shopify Sidecart: Add to Cart clicked for variant ID: ${variantId}`);
                    }
                } else {
                    console.error('Shopify Sidecart: Cannot add to cart, variant ID missing, callback not provided, or button is disabled.');
                }
            });

        })
        .catch(error => {
            console.error('Shopify Sidecart: Error during fetch for product ID', shopifyProductId, error);
            containerElement.innerHTML = `<p style="color: red;">Failed to load product data: ${error.message}</p>`;
        });
}

/**
 * Shows a modal popup for shirt size selection when adding bourbon to cart
 * @param {object} promoConfig - The promo configuration with shirt details
 * @param {string} bourbonVariantId - The variant ID of the bourbon being added
 * @param {function} addToCartCallback - The callback to add items to cart
 */
function showShirtPromoModal(promoConfig, bourbonVariantId, addToCartCallback) {
    // Remove existing modal if present
    const existingModal = document.getElementById('shirt-promo-modal');
    if (existingModal) existingModal.remove();

    // Create modal HTML
    const modal = document.createElement('div');
    modal.id = 'shirt-promo-modal';
    modal.innerHTML = `
        <style>
            #shirt-promo-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                z-index: 999999;
                display: flex;
                justify-content: center;
                align-items: center;
                opacity: 0;
                transition: opacity 0.3s ease;
                padding: 15px;
                box-sizing: border-box;
            }
            #shirt-promo-modal.active {
                opacity: 1;
            }
            .shirt-modal-content {
                background: #f5f5f0;
                padding: 50px;
                max-width: 700px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                position: relative;
                border-radius: 0;
                box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                transform: translateY(-20px);
                transition: transform 0.3s ease;
            }
            #shirt-promo-modal.active .shirt-modal-content {
                transform: translateY(0);
            }
            .shirt-modal-close {
                position: absolute;
                top: 15px;
                right: 20px;
                background: none;
                border: none;
                font-size: 36px;
                cursor: pointer;
                color: #333;
                line-height: 1;
                padding: 0;
            }
            .shirt-modal-close:hover {
                color: #000;
            }
            .shirt-modal-image {
                text-align: center;
                margin-bottom: 25px;
            }
            .shirt-modal-image img {
                width: 140px;
                height: 140px;
                border-radius: 50%;
                object-fit: cover;
                border: none;
            }
            .shirt-modal-free-badge {
                font-size: 40px;
                font-weight: bold;
                color: #8B6914;
                display: block;
                text-align: center;
                margin-bottom: 15px;
            }
            .shirt-modal-text {
                font-size: 22px;
                line-height: 1.4;
                text-align: center;
                margin-bottom: 15px;
                color: #333;
            }
            .shirt-modal-disclaimer {
                color: #cc0000;
                font-size: 16px;
                line-height: 1.3;
                text-align: center;
                margin-bottom: 30px;
            }
            .shirt-modal-size-container {
                margin-bottom: 30px;
            }
            .shirt-modal-size-container label {
                display: block;
                font-weight: bold;
                margin-bottom: 12px;
                text-align: center;
                font-size: 20px;
            }
            .shirt-modal-size-select {
                width: 100%;
                padding: 16px;
                font-size: 18px;
                border: 2px solid #ccc;
                border-radius: 10px;
                background: #fff;
            }
            .shirt-modal-buttons {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            .shirt-modal-btn {
                padding: 18px 28px;
                font-size: 18px;
                border: none;
                border-radius: 10px;
                cursor: pointer;
                text-transform: uppercase;
                letter-spacing: 1px;
                font-weight: bold;
                transition: background 0.2s;
            }
            .shirt-modal-btn-primary {
                background: #8B6914;
                color: #fff;
            }
            .shirt-modal-btn-primary:hover {
                background: #6d5310;
            }
            .shirt-modal-btn-primary:disabled {
                background: #ccc;
                cursor: not-allowed;
            }
            @media (max-width: 768px) {
                .shirt-modal-content {
                    padding: 30px 20px;
                    width: 95%;
                    max-height: 85vh;
                    border-radius: 0;
                }
                .shirt-modal-image img {
                    width: 120px;
                    height: 120px;
                }
                .shirt-modal-free-badge {
                    font-size: 30px;
                }
                .shirt-modal-text {
                    font-size: 17px;
                }
                .shirt-modal-disclaimer {
                    font-size: 14px;
                }
                .shirt-modal-size-container label {
                    font-size: 17px;
                }
                .shirt-modal-size-select {
                    padding: 14px;
                    font-size: 16px;
                }
                .shirt-modal-btn {
                    padding: 15px 20px;
                    font-size: 16px;
                }
            }
            @media (max-width: 400px) {
                .shirt-modal-content {
                    padding: 25px 15px;
                    border-radius: 0;
                }
                .shirt-modal-image img {
                    width: 100px;
                    height: 100px;
                }
                .shirt-modal-free-badge {
                    font-size: 26px;
                }
                .shirt-modal-text {
                    font-size: 15px;
                }
                .shirt-modal-disclaimer {
                    font-size: 13px;
                }
                .shirt-modal-btn {
                    padding: 14px 16px;
                    font-size: 14px;
                }
            }
        </style>
        <div class="shirt-modal-content">
            <button type="button" class="shirt-modal-close">&times;</button>
            <div class="shirt-modal-image">
                <img src="${promoConfig.shirtImage}" alt="Free T-Shirt">
            </div>
            <span class="shirt-modal-free-badge">🎁 FREE</span>
            <p class="shirt-modal-text">${promoConfig.shirtPromoText}</p>
            <p class="shirt-modal-disclaimer">${promoConfig.shirtPromoDisclaimer}</p>
            <div class="shirt-modal-size-container">
                <label for="shirt-size-select">Select Your Shirt Size:</label>
                <select id="shirt-size-select" class="shirt-modal-size-select">
                    <option value="">-- Choose Size --</option>
                </select>
                <p class="shirt-loading-msg" style="text-align:center; color:#666;">Loading sizes...</p>
            </div>
            <div class="shirt-modal-buttons">
                <button type="button" class="shirt-modal-btn shirt-modal-btn-primary" id="shirt-add-with-shirt" disabled>Add Both to Cart</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    // Trigger animation
    requestAnimationFrame(() => {
        modal.classList.add('active');
    });

    const closeModal = () => {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
            document.body.style.overflow = '';
        }, 300);
    };

    // Close button
    modal.querySelector('.shirt-modal-close').addEventListener('click', closeModal);

    // Click outside to close
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Escape key to close
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);

    // Fetch shirt variants and populate dropdown
    const shirtSelect = document.getElementById('shirt-size-select');
    const addWithShirtBtn = document.getElementById('shirt-add-with-shirt');
    const loadingMsg = modal.querySelector('.shirt-loading-msg');

    const shirtGid = `gid://shopify/Product/${promoConfig.shirtProductId}`;
    const query = `
        query getProduct($id: ID!) {
            node(id: $id) {
                ... on Product {
                    variants(first: 20) {
                        nodes {
                            id
                            title
                            availableForSale
                        }
                    }
                }
            }
        }
    `;

    fetch(shopifySettings.storeUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Storefront-Access-Token': shopifySettings.storefrontToken,
        },
        body: JSON.stringify({ query, variables: { id: shirtGid } })
    })
    .then(res => res.json())
    .then(data => {
        loadingMsg.style.display = 'none';
        const variants = data.data?.node?.variants?.nodes || [];
        
        if (variants.length === 0) {
            shirtSelect.innerHTML = '<option value="">No sizes available</option>';
            return;
        }

        variants.forEach(variant => {
            if (variant.availableForSale) {
                const option = document.createElement('option');
                option.value = variant.id;
                option.textContent = variant.title;
                shirtSelect.appendChild(option);
            }
        });

        shirtSelect.addEventListener('change', () => {
            addWithShirtBtn.disabled = !shirtSelect.value;
        });
    })
    .catch(err => {
        console.error('Failed to load shirt variants:', err);
        loadingMsg.textContent = 'Failed to load sizes';
    });

    // Add both button
    addWithShirtBtn.addEventListener('click', () => {
        const shirtVariantId = shirtSelect.value;
        if (shirtVariantId) {
            // Add bourbon first, then shirt
            addToCartCallback(bourbonVariantId, 1);
            addToCartCallback(shirtVariantId, 1);
            console.log('Shopify Sidecart: Added bourbon and shirt to cart');
            closeModal();
        }
    });
}