
//let page, user_uuid;  <-- already declared at cart_drawer.liquid
let cartCounts = document.querySelectorAll('.cart-count')
let cartDrawer = document.getElementById('cartDrawer');
let cartItemsWrap = document.getElementById('cart-items-wrap');
let emptyCartWrap = document.getElementById('empty-cart-wrap');
let bottomWrap = document.getElementById('bottom-wrap');
let cartSubtotal = document.getElementById('cart-subtotal');
let cartQuantity = 1;
let stepperDebounceTimer;

//product detailed page   
let cartQuantityInput = document.getElementById('cart-quantity');  
if(cartQuantityInput){  
    cartQuantityInput.addEventListener('insValueChange', event => {
        cartQuantity = event.detail; 
    });
}

let goToCartBtn = document.getElementById("go-to-cart");
let shoppingCartListEl = document.getElementById("shopping-cart-list");
let shoppingCartLoaderEl = document.getElementById("shopping-cart-loader");
let proceedToCheckoutBtns = document.querySelectorAll(".proceed-to-checkout-btn");

const placeholderImage = `<div class="placeholder-img vertical-align-middle">
        <div>
            <div class="spacer x-large"></div>    
            <i class="icon-panorame"></i>
            <div class="spacer x-large"></div>   
        </div>
    </div>`;

// Remove the 'hide' class from the cart drawer when it has loaded
cartDrawer.addEventListener('didLoad', () => {
    cartDrawer.classList.remove('hide');
});


document.addEventListener('DOMContentLoaded', () => {    
    // Update the cart count in the menu when an item from the cart is automatically deleted
    // probably because the product for that item has been archived, disabled, or deleted.
    if(recount_cart === true) {
        cartCounts.forEach( el => { 
            el.textContent = recount_total_items;            
        });
        cartDrawer.label = `Cart (${recount_total_items})`;
    }

    // Open the cart drawer modal after reordering items from Order History.
    if (sessionStorage.getItem('openCartDrawer') === 'true') {
        cartDrawer.setDrawerState(true);  // Open modal
        sessionStorage.removeItem('openCartDrawer'); // Clean up
    }
});

/* Add to cart */
let addToCartBtn = document.querySelectorAll(".add-to-cart-btn");
addToCartBtn.forEach(btn => {
    btn.addEventListener('insClick', event => {  
        addToCartPreProcess(event);
    });
});

async function addToCartPreProcess(event, type){
    
    // Show the loader and hide the cart items and shopping cart list
    if (shoppingCartLoaderEl) { shoppingCartLoaderEl.classList.remove("hide"); }
    if (cartItemsWrap) { cartItemsWrap.classList.add("hide"); }
    if (shoppingCartListEl) { shoppingCartListEl.classList.add('hide'); }
     
    // Show the empty cart wrap and remove the bottom wrap
    emptyCartWrap.classList.add("hide");
    bottomWrap.classList.remove("hide");

    // Get the data from connected event
    data = JSON.parse(event.detail.data);
    
    if(type != "reorder"){
        data.quantity = cartQuantity;    
        type = event.detail.label 
    }            
    if(data.detail_page === true && typeof selected_variant !== 'undefined' && selected_variant.id){
        data.product_variant_uuid = selected_variant.product_variant_uuid; 
    }
    
    cartDrawer.setDrawerState(true);
    await submitAddCart(data, type);

    // If the type is 'buy now' or 'pre-order', go to /shopping-cart page
    if(type.toLowerCase() == 'buy now' || type.toLowerCase() == 'pre-order'){
        // It is either 'buy now' or 'pre-order', go to /shopping-cart page
        window.location.href = "/shopping-cart";
    } 
    
}

async function submitAddCart(data, type){
    let cart_item = await addToCart(data, type);
    if(cart_item){ 
        let returnData = cart_item.data;
        // Check if Cart window has 'Empty' signage
        if (!emptyCartWrap.classList.contains('hide')) {
            emptyCartWrap.classList.add('hide');
            bottomWrap.classList.remove('hide');
        }          

        //Check if there is already an entry in the cart drawer
        let checkItemOnCart = document.getElementById(`cart-item-${returnData.items.id}`);
        if (checkItemOnCart){
            checkItemOnCart.remove();  
        } 
        
        // Add new item on the cart and set the needed event listener
        cartItemsWrap.insertAdjacentHTML('afterbegin', cartItemHtml(data, returnData)); 
        let newItemAdded = document.getElementById(`cart-item-${returnData.items.id}`);
        if (newItemAdded) {                   
            let cartStepper = document.querySelector(`#cart-item-${returnData.items.id} .cart-stepper`);
            cartStepper.addEventListener('insValueChange', event => {
                cartStepperEventListener(event);
            }); 
            //cartStepperEventListener(cartStepper);
            let removeCartBtn = document.querySelector(`#cart-item-${returnData.items.id} .cart-remove-btn`);
            removeCartEventListener(removeCartBtn);
        }         
        computeSubTotal();
    } 

    if (page == 'shopping-cart') {

    } else {
        // Hide the loader and show the cart items and shopping cart list
        if (shoppingCartLoaderEl) { shoppingCartLoaderEl.classList.add("hide"); }
        if (cartItemsWrap) { cartItemsWrap.classList.remove("hide"); }
        if (shoppingCartListEl) { shoppingCartListEl.classList.remove('hide'); }
    }

}

    
/* Increment / Decrement Cart in Drawer */
let cartStepper = document.querySelectorAll(".cart-stepper");
cartStepper.forEach(step => {
    step.addEventListener('insValueChange', event => {
        cartStepperEventListener(event);
    });   
}); 

let debounceTimer = null;
function cartStepperEventListener(event){ 
    // Disable the 'Go to Cart' button
    goToCartButtonDisabled();
    if (debounceTimer) {
        clearTimeout(debounceTimer);
    }

    // Set a timeout to call the API after 500ms
    debounceTimer = setTimeout(async () => {
        try {
            await processStepperCall(event);
        } catch (err) {
            console.error("API call failed:", err);
        } finally {
            debounceTimer = null;
        }
      }, 500);
}    

async function processStepperCall(event){
    // Show the loader and hide the cart items and shopping cart list
    if (shoppingCartLoaderEl) { shoppingCartLoaderEl.classList.remove("hide"); }
    if (cartItemsWrap) { cartItemsWrap.classList.add("hide"); }
    if (shoppingCartListEl) { shoppingCartListEl.classList.add('hide'); }
    
    // Get the data from the stepper
    let stepperData = event.target.closest("ins-input-stepper").dataset;
    let data = {        
        "product_uuid": stepperData.product_uuid,
        "product_variant_uuid": stepperData.product_variant_uuid,
        "quantity": event.detail,
    };
    
    await submitAddCart(data, 'stepper');

}


/* Remove from Cart */
let removeCartBtn = document.querySelectorAll(".cart-remove-btn");
removeCartBtn.forEach(btn => {
    removeCartEventListener(btn);
});             

function removeCartEventListener(btn){ 

    btn.addEventListener('insClick', async event => {
        let confirm = await App.events.swal("warning", 
                "Remove item?", 
                "Are you sure you want to remove this item from your cart?", 
                "Remove",
                undefined,
                "icon-trash");

        if (confirm) {
            if(removeToCart(JSON.parse(event.detail.data))){
                let cartItem = btn.closest('.cart-item-wrap');
                if (cartItem) {
                    cartItem.remove();
                    computeSubTotal();
                }
            }
        }                        
    });
}    


/* Add to cart */
async function addToCart(data, type){        
    data["type"] = type;
    // Reset the cartQuantity
    cartQuantity = 1;

    if (type.toLowerCase() == 'buy now'){
        setButtonLoadingState(data.id, true)
    }

    if (type == "reorder") {
        // Add items to the cart using the Reorder button from Order History.
        // Each item from the selected order will be added individually by calling the API.
        // A delay is applied to prevent simultaneous API requests.
        const responses = [];
        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        for (const item of data) {
            item["contact_uuid"] = user_uuid;
            await delay(1000); 
            const response = await apiServices.processRequest("post", "/add-to-cart.json", item);
            responses.push(response);
        }

        // Save the session before reloading the page. 
        // This will open the Cart Drawer modal after the reload.
        sessionStorage.setItem('openCartDrawer', 'true');

        // Reload the page to reflect the added items in the cart drawer.            
        location.reload();           
    } else {
        data["contact_uuid"] = user_uuid;
        goToCartButtonDisabled();
        let response = await apiServices.processRequest("post", "/add-to-cart.json", data);
        if(response.state) {
            goToCartButtonEnabled();
            if (page == 'shopping-cart') {
                location.reload();
            } 
            handleShoppingCartRedirect(type, data)
            return response;          
        } else {
            goToCartButtonEnabled();
            App.events.notyf("error", "Something went wrong. Please try again.");
        }         
    }
    
}      

/* Redirect the user to the shopping cart page if the type is neither 'Add to cart' nor 'stepper',
    and handles additional logic when the type is "Buy Now". */
function handleShoppingCartRedirect(type, data) {
    if (type.toLowerCase() != "add to cart" && type != "stepper") {
        window.location.href = "/shopping-cart";
        if (type.toLowerCase() === "buy now") {
            setButtonLoadingState(data.id, false);
        }
    }
}

/* Sets the loading property of the 'add to cart' button based on its ID and the desired state */
function setButtonLoadingState(id, isLoading) {
    const detailButton = document.getElementById(`add-to-cart-btn-${id}`);
        
    // Check if the button exists
    if (detailButton) {
        detailButton.loading = isLoading;  // Set the loading property to the desired state
    }
}

/* Redirects the user to the shopping cart page if the button is not disabled. */
function goToShoppingCartPage() {
    !goToCartBtn.disabled ? window.location.href = '/shopping-cart' : '';
}

/* Enables the 'Go to Cart' button and sets its loading state to false. */
function goToCartButtonEnabled() {

    //if the user is on the checkout page and adds, removes, or updates an item using the cart drawer.
    if(page == 'checkout'){
        location.reload();
    }

    goToCartBtn.disabled = false;
    goToCartBtn.loading = false;
    if(proceedToCheckoutBtns){
        proceedToCheckoutBtns.forEach(btn => {
            btn.disabled = false;
        });
    }
}

/* Disables the 'Go to Cart' button and sets its loading state to true. */
function goToCartButtonDisabled() {
    goToCartBtn.disabled = true;
    goToCartBtn.loading = true;
    if(proceedToCheckoutBtns){
        proceedToCheckoutBtns.forEach(btn => {
            btn.disabled = true;
        });
    }
}

/* Remove cart from Database */
async function removeToCart(data){   
    const shoppingCartListQuery = document.querySelector("#shopping-cart-list");
    const shoppingGuestCartLoaderQuery = document.querySelector("#shopping-guest-cart-loader");

    if (shoppingCartListEl && shoppingCartLoaderEl) {
        shoppingCartListEl.style.display = 'none';  
        shoppingCartLoaderEl.classList.remove("hide");
    } else if (shoppingCartListQuery && shoppingGuestCartLoaderQuery) {
        shoppingCartListQuery.style.display = "none";
        shoppingGuestCartLoaderQuery.classList.remove("hide");
    }
    
    goToCartButtonDisabled();
    let response = await apiServices.processRequest("post", "/remove-to-cart.json", data);
    if(response.state && response.data.id) {
        if (page == 'shopping-cart') {
            shoppingCartListEl.style.display = 'flex';
            shoppingCartListEl.style.display = 'none';
            location.reload();
        } 
        goToCartButtonEnabled();
        return true;          
    } else {
        goToCartButtonEnabled();
        App.events.notyf("error", "Something went wrong. Please try again.");
    }
    
    reloadIfShoppingCartPage();
}       

function titleize(str) {
    if (typeof str !== 'string' || !str) return '';
    return str.toLowerCase().replace(/(?:^|\s|-)\S/g, function (c) {
      return c.toUpperCase();
    });
}

function cartItemHtml(data, cart_item){
    let cartItemDetail = cart_item.items;
    let prodItemDetail = cart_item.prod_details;
    const item_price = formatNumber(cartItemDetail.product_price);
    const item_total_price = formatNumber(cartItemDetail.product_price * cartItemDetail.quantity || cartItemDetail.product_price);
    const img = prodItemDetail?.product_image?.url && prodItemDetail?.product_image?.url !== '' && prodItemDetail?.product_image?.url !== null
        ? `<img src="${prodItemDetail.product_image.url}" width="66px" height="66px">`
        : placeholderImage;
    
    // Pre-order tag
    const stockLevel = parseFloat(prodItemDetail.stock_level);
    const quantity = parseFloat(cartItemDetail.quantity);    
    const preorder_tag = (
        !isNaN(stockLevel) &&
        !isNaN(quantity) &&
        stockLevel < quantity
    ) 
        ? `<p><ins-tag label="Pre-order" class="preorder-tag body-x-small"></ins-tag></p>`
        : '';

    // Variant Options - To be constructed
    let optionsHtml = '';
    if (cartItemDetail.product_variant_uuid != '' && cartItemDetail.product_variant_uuid != null && prodItemDetail.product_options.length > 0) {
        for (const optionStr of prodItemDetail.product_options) {
            const option = JSON.parse(optionStr);
            optionsHtml += `
                <p>
                    <span class="body-x-small-bold">${titleize(option.product_option_label)}:</span>
                    <span class="body-x-small">${titleize(option.product_option_value)}</span>
                </p>
            `;
        }
    }
         

    return ` <div id="cart-item-${cartItemDetail.id}" class="cart-item-wrap">
            <div class="grid-x" >
                <div class="image_wrap">
                    <a href="/products/${prodItemDetail.slug}">${ img }</a>
                </div>
                <div class="grid-y cart-details flex-child-auto">
                    <a href="/products/${prodItemDetail.slug}"><span class="heading-6">${ cartItemDetail.product_name }</span></a>
                    ${preorder_tag}
                    <p class="body-x-small">SKU ${ cartItemDetail.product_sku }</p>
                    <div class="spacer x-small"></div>
                    ${optionsHtml}
                    <p>
                        <span class="body-x-small-bold">Price:</span>
                        <span class="body-x-small item-price">$${ item_price }</span>
                    </p>
                </div>
                <div class="cell spacer small show-for-small-only"></div>
                <div class="grid-y flex-child-auto text-right">
                    <p class="cart-price compute-price">$${ item_total_price }</p>
                    <div class="spacer x-small"></div>
                    <ins-input-stepper
                        class="cart-stepper" 
                        data-product_uuid="${ prodItemDetail.product_uuid }"
                        data-variant_uuid="${ prodItemDetail.product_variant_uuid }"
                        data-product_name="${ cartItemDetail.product_name }"
                        value="${ cartItemDetail.quantity }"
                        step="1" min="1" 
                        small>
                    </ins-input-stepper>
                    <div class="spacer small"></div>
                    <div class="text-right" >
                        <ins-button label="Remove" icon="icon-trash-2" size="small" class="cart-remove-btn" data='{"id":"${cartItemDetail.id}","uuid":"${cartItemDetail.uuid}","cart_uuid":"${cartItemDetail.cart_uuid}"}' ></ins-button>
                    </div>   
                </div>        
            </div>    
            <div class="spacer x-large"></div>
        </div>`;    
}


function reloadIfShoppingCartPage() {
    if (window.location.pathname === "/shopping-cart") {
        location.reload();
    }
}


function formatNumber(num) {
    const value = typeof num === "number" ? num : parseFloat(num);
    if (isNaN(value)) return "0.00"; // fallback
    return value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function computeItemTotal(itemWrap, qty) {
    let itemPrice = itemWrap.querySelector(".item-price").textContent;
    let parseItemPrice = parseFloat(itemPrice.replace(/[^0-9.]/g, ''));
    let computePrice = itemWrap.querySelector(".compute-price");
    let itemTotalPrice = parseItemPrice * qty;
    computePrice.textContent = "$" + formatNumber(itemTotalPrice);

    return {
        price: parseItemPrice,
        item_total_price: itemTotalPrice
    };
}

function computeSubTotal(){    
    let subTotal = 0;
    let prices = document.querySelectorAll("#cartDrawer .compute-price");

    prices.forEach(price => {
        subTotal += parseFloat(price.textContent.replace(/[^0-9.]/g, ''));
    });

    // Redirect to /products page if the current page is 'checkout' and there is no item in the cart
    if(page == 'checkout' && subTotal <= 0){
        window.location.href = '/products';
    }

    cartSubtotal.textContent = "$" + formatNumber(subTotal);
    cartDrawer.label = `Cart (${prices.length})`;

    //Update total in the cart icon
    if(cartCounts){
        cartCounts.forEach(cartCount => {
            cartCount.textContent = prices.length;
            if(prices.length > 0){
                cartCount.classList.remove('hide');
                emptyCartWrap.classList.add('hide');
                bottomWrap.classList.remove('hide');
            } else{
                cartCount.classList.add('hide');
                emptyCartWrap.classList.remove('hide');
                bottomWrap.classList.add('hide');
            }
        });
    }

    if(prices.length == 0){
        bottomWrap.classList.add('hide');
        emptyCartWrap.classList.remove('hide');            
    }
}        


/* Close the cart drawer */
let contShoppingBtn = document.getElementById("continue-shopping-btn");
contShoppingBtn.addEventListener('insClick', event => {                 
    cartDrawer.setDrawerState(false); 
    if(page != 'shopping-cart' && page != 'products') {
        window.location.href = "/products";
    }
});

function openDrawer(){
    cartDrawer.setDrawerState(true);
}


//Trigger a click event on a child <a> element when clicking anywhere inside an element '.product-cards .cell' 
//(except for ins-button.add-to-cart-btn element and its children)
const productWrappers = document.querySelectorAll('.product-cards .cell');
if(productWrappers){
    productWrappers.forEach(wrapper => {
        wrapper.addEventListener('click', function (event) {
            if (!event.target.closest('ins-button.add-to-cart-btn')) {
                const link = this.querySelector('a');
                if (link) {
                    link.click();
                }
            }
        });
    });
}