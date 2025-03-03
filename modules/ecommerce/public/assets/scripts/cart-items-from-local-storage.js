let shoppingCartItemsWrap = document.getElementById('shopping-cart-items-wrap');
let orderSummaryWrap = document.getElementById('order-summary-cart-wrap');
let proceedToCheckout = document.getElementById('proceed-to-checkout');    

//Prices
let summary_subtotal = document.getElementById('summary_subtotal');
let summary_delivery = document.getElementById('summary_delivery');
let summary_processing_fee = document.getElementById('summary_processing_fee');
let summary_tax_label = document.getElementById('summary_tax_label');
let summary_tax = document.getElementById('summary_tax');
let summary_total = document.getElementById('summary_total');    
let summary_subtotal_amount = 0;
let summary_delivery_amount = 0;
let summary_discount_amount = 0;
let summary_processing_fee_amount = 0;
let summary_tax_amount = 0;
let tax_included_in_price = 0;
let summary_total_amount = 0;

let cartItems = localStorage.getItem('carts');
let products = [];
let cartData = [];

let page_url = window.location.pathname;

// Check if cartItems is not null and not an empty string
if (cartItems) {
    try {
        cartItems = JSON.parse(cartItems);
    } catch (e) {
        console.error("Error parsing JSON from localStorage:", e);
        cartItems = []; 
    }
} else {
    cartItems = []; 
}

let productUUIDs = cartItems.map(item => JSON.parse(item).product_uuid);

if (cartItems.length > 0) {
    listCartItems(cartItems, productUUIDs);                               
} else {
    renderEmptyCartMessage();
}

function renderEmptyCartMessage() {
    const shoppingCartItemsWrap = document.querySelector('#shopping-cart-items-wrap'); 
    // HTML content for empty cart
    const emptyCartHtml = `
        <div id="shopping-cart-list" class="shopping-cart grid-x grid-padding-x grid-padding-y">
            <div class="small-12 cell">
                <ins-card steady class="empty-state">
                    <span>Your cart is empty.</span>
                </ins-card>
            </div>
        </div>
    `;

    // Insert the empty cart message if the shopping cart container exists
    if (shoppingCartItemsWrap) {
        shoppingCartItemsWrap.innerHTML = emptyCartHtml;
        // Empty the order summary
        summary_subtotal.textContent = '$0.00';
        summary_delivery.textContent = '$0.00';
        summary_processing_fee.textContent = '$0.00';
        summary_tax.textContent = '$0.00';
        summary_total.textContent = '$0.00';
    }
};

async function listCartItems(carts, productUUIDs){
    let url = `/get-cart-products.json?product_uuids=`+ productUUIDs;
    let response = await apiServices.processRequest("get", url); 

    if(response.state && response.data) {
        products = response.data
        let shoppingCartHtml = "";
        let orderSummaryHtml = "";

        for (let i = 0; i < carts.length; i++) {  
            cart = JSON.parse(carts[i]); //convert string to object     
            cartData.push(cart);
            product = products.find(item => item.uuid === cart.product_uuid);
            is_variant = false;

            //Set null values to '' to prevent false comparisons.
            cart.product_sku = cart.product_sku ?? "";
            product.product_sku = product.product_sku ?? "";
                
            //Check if the cart item is a product or a variant of the product        
            if( cart.product_sku == product.product_sku ){
                selected_prop = product;
            } else {
                // product is a variant 
                for (let variant of product.variants) {
                    if( cart.product_sku == variant.product_sku ){
                        selected_prop = variant;
                        is_variant = true;
                    }
                }        
            }                              

            if(selected_prop?.product_image?.url){
                img = `<img  src="${ selected_prop?.product_image?.url }" alt="${ cart.product_name }" >`;
            } else {
                img = placeholderImage;
            }

            preorder = ( selected_prop.stock_level < 1 )? `<ins-tag label="Pre-Order" class='preorder-tag body-x-small' ></ins-tag>`: "";

            // Get variant info
            if(is_variant == true){
                variant_option = "";
                for (let j = 0; j < selected_prop.product_options.length; j++) { 
                    option = JSON.parse(selected_prop.product_options[j]); //convert string to object 
                    variant_option = variant_option + `<p>
                        <span class="body-x-small-bold">${ option.product_option_label }:</span>
                        <span class="body-x-small">${ option.product_option_value }</span>
                    </p>`;
                }
            } else {
                variant_option = "";
            }                

            // Prices
            if( selected_prop.is_on_sale == true ){
                price = selected_prop.sale_price;
                price_strikethrough = `<span class="body-x-small strikethrough">$${ formatNumber(selected_prop.regular_price) }</span>`;
            } else {
                price = selected_prop.regular_price;
                price_strikethrough = '';
            }
            item_total_price = price * cart.quantity
            summary_subtotal_amount += item_total_price;

            //Shipping Fee
            is_free_shipping = selected_prop.is_free_shipping;
            freight_amount = (selected_prop.is_free_shipping == true)? 0 : selected_prop.freight_amount;
            freight_amount = (freight_amount == undefined)? 0 : freight_amount;
            summary_delivery_amount += freight_amount;

            //Tax
            tax_amount = selected_prop.tax_amount;
            if(selected_prop.is_fixed_tax_amount == true){
                tax = tax_amount * cart.quantity;
            } else {
                if(selected_prop.is_tax_included == true){
                    // tax = (Price x Tax Rate​) / (1 + Tax Rate​)
                    tax_rate = tax_amount / 100;
                    tax = ( price * tax_rate ) / ( 1 + tax_rate ) * cart.quantity;
                } else {
                    tax = price * tax_amount / 100 * cart.quantity;
                }
            }

            summary_tax_amount += tax;

            if( selected_prop.is_tax_included == true ){                    
                //save the tax that is already included in the price of the product 
                //we will use this to subtract in the total amount
                tax_included_in_price += tax;                    
                tax_label = 'Includes Tax';
            } else if( tax_included_in_price > 0 ) {
                tax_label = 'Includes Tax';
            } else {
                tax_label = 'Tax';
            }

            let data = {
                "cart": cart,
                "is_variant": is_variant,
                "selected_prop": selected_prop,
                "img": img,
                "preorder": preorder,
                "variant_option": variant_option,
                "price": price,
                "price_strikethrough": price_strikethrough,
                "item_total_price": item_total_price,
                "summary_subtotal_amount": summary_subtotal_amount
            }
                
            if(shoppingCartItemsWrap) shoppingCartHtml += createShoppingCartHtml(data, i);  
            //if(page_url !=='/shopping-cart' && orderSummaryWrap) orderSummaryHtml += createOrderSummaryHtml(data, i); 
        };

            
        // for page /shopping-cart
        if(shoppingCartItemsWrap) {
            shoppingCartHeading = `<h2>Cart Items</h2>
                <div class="spacer x-large"></div>
                <div id="shopping-cart-list">
                <div class="wrap shopping-cart grid-y">`;
            shoppingCartHtml = shoppingCartHeading + shoppingCartHtml + '</div></div>';
            shoppingCartItemsWrap.insertAdjacentHTML('afterbegin', shoppingCartHtml);
        }

        // for checkout pages - Order Summary
        if(page_url !=='/shopping-cart' && orderSummaryWrap) {                
            orderSummaryHtml +=  `<hr><div class="spacer"></div>`;
            orderSummaryWrap.insertAdjacentHTML('afterbegin', orderSummaryHtml);                
        }
            
        saveCheckoutSessionForGuest(products);
    }
}
    
var placeholderImage = `<div class="placeholder-img vertical-align-middle">
        <div>
            <div class="spacer x-large"></div>    
            <i class="icon-panorame"></i>
            <div class="spacer x-large"></div>   
        </div>
    </div>`;


//This template is for /shopping-cart page
function createShoppingCartHtml(data, i){   
    let content = `<div id="cart-item-${data.selected_prop.id}" class="cart-item-wrap cell">`;

    if( i > 0 ) content = content + `<hr><div class="spacer x-large"></div>`;                                    

        // Check if stock level is less than 1
    let stepperMax = data.selected_prop.stock_level < 1 ? '' : `max="${data.selected_prop.stock_level}"`;

    content = content + `
        <div class="grid-x" >
            <div class="img-wrap">
                ${data.img}
            </div>
            <div class="text-wrap">
                <h6>
                    ${ data.cart.product_name }
                    ${ data.preorder }
                </h6> 
                <p class="body-small">SKU: ${ data.cart.product_sku }</p>
                <div class="spacer small"></div>
                ${ data.variant_option }
                <p>
                    <span class="body-x-small-bold">Price:</span>
                    <span class="body-x-small item-price">$${ formatNumber(data.price) }</span>
                    ${ data.price_strikethrough }
                </p>
            </div>
            <div class="btn-wrap grid-y">
                <p class="cart-price compute-price">$${ formatNumber(data.item_total_price) }</p>
                <div class="spacer small"></div>
                <ins-input-stepper
                    class="cart-stepper" 
                    data-id="${ data.cart.id }"
                    data-product_uuid="${ data.cart.product_uuid }"
                    data-product_sku="${ data.cart.product_sku }"
                    data-product_name="${ data.cart.product_name }"
                    value="${ data.cart.quantity }" 
                    step="1" min="1" 
                    ${stepperMax}
                    small>
                </ins-input-stepper>
                <div class="spacer small"></div>
                <div class="text-right" >
                    <ins-button label="Remove" icon="icon-trash-2" size="small" class="cart-remove-btn" data='{"product_uuid":"${data.cart.product_uuid}","product_sku":"${data.cart.product_sku}"}' ></ins-button>                            
                </div> 
            </div>        
        </div>                   
        <div class="spacer x-large"></div>
    </div>`;    

    return content;
}

function createOrderSummaryHtml(data){
    let content = `<div class="grid-x grid-padding-x body-large">
                <div class="product-name large-6 medium-8 small-6 cell">
                    <p class="font-color-sub">${ data.cart.product_name }</p>
                </div>
                <div class="text-right large-3 medium-4 small-6 cell">                        
                    <p>${ data.cart.quantity }x</p>
                </div>
                <div class="text-right large-3 medium-12 small-12 cell">                        
                    <p class="font-color-sub">$${ data.price.toFixed(2) }</p>
                </div>
            </div>
            <div class="spacer small"></div>`;
        
    return content;
}

let formatter = new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});
   
// Push the cart from local storage into the database.
if( is_new_user && is_new_user == true && user_uuid != ""){
    pushLocalCartToDB({carts:cartItems, user_uuid: user_uuid});
}    

async function pushLocalCartToDB(data){        
    let response = await apiServices.processRequest("post", "/push-local-cart-to-db.json", data);
              
    if(response.state && response.data.items.id) {
        // Empty the carts in the local storage
        localStorage.setItem('carts', []); 
    }
} 
