
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

// Open the cart drawer modal after reordering items from Order History.
document.addEventListener('DOMContentLoaded', () => {
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
   
    //show hide
    emptyCartWrap.classList.add("hide");
    bottomWrap.classList.remove("hide");

    //show cart drawer
    if(event.detail.label.toLowerCase() == "add to cart"){
        cartDrawer.setDrawerState(true); 
    } 

    data = JSON.parse(event.detail.data);
    
    if(type != "reorder"){
        data.quantity = cartQuantity;    
        type = event.detail.label 
    }            
        
    //used for product with variants in product details page
    if(data.variant_product){
        data.id = variant_data.id;
        data.product_uuid = variant_data.product_uuid;
        data.price = variant_data.price;
        data.product_name = variant_data.product_name;
        data.variant_uuid = variant_data.variant_uuid; 
        data.product_sku = variant_data.sku;  
    }
   
    let cartItem = document.getElementById(`cart-item-${data.id}`);
 
    // Clicking the Add-to-cart button will add the item only if it is not already in the cart.
    if(cartItem == null){
      
        let cart_item = await addToCart(data, type);
        if(cart_item){        

            if (!emptyCartWrap.classList.contains('hide')) {
                emptyCartWrap.classList.add('hide');
                bottomWrap.classList.remove('hide');
            }          
                                
            cartItemsWrap.insertAdjacentHTML('afterbegin', cartItemHtml(data, cart_item.data.items));

            let newItemAdded = document.getElementById(`cart-item-${data.id}`);
            if (newItemAdded) {                   
                let cartStepper = document.querySelector(`#cart-item-${data.id} .cart-stepper`);                        
                cartStepperEventListener(cartStepper);

                let removeCartBtn = document.querySelector(`#cart-item-${data.id} .cart-remove-btn`);
                removeCartEventListener(removeCartBtn);
            } 

            computeSubTotal();
        }
    }
    else if(type.toLowerCase() == 'buy now' || type.toLowerCase() == 'pre-order'){
        //The item is already added in the cart, go to /shopping-cart
        window.location.href = "/shopping-cart";
    }
}
    
/* Increment / Decrement Cart in Drawer */
let cartStepper = document.querySelectorAll(".cart-stepper");
cartStepper.forEach(step => {
    cartStepperEventListener(step);
}); 


function cartStepperEventListener(step){
    step.addEventListener('insValueChange', event => {   
        goToCartButtonDisabled();
        clearTimeout(stepperDebounceTimer);

        //Add debounce timer to allow multiple click in + or - before calling the api/add-to-cart.json
        stepperDebounceTimer = setTimeout(() => {

            if (shoppingCartListEl && shoppingCartLoaderEl) {
                shoppingCartListEl.style.display = 'none';  
                shoppingCartLoaderEl.classList.remove("hide");
            }

            let itemWrap = event.target.closest(".cart-item-wrap");            
            let stepperData = event.target.closest("ins-input-stepper").dataset;

            // Calculate the total price for the item
            let priceData = computeItemTotal(itemWrap, event.detail);

            let data = {
                "id": stepperData.id,
                "product_name": stepperData.product_name,
                "product_uuid": stepperData.product_uuid,
                "variant_uuid": stepperData.variant_uuid,
                "price": priceData.price,  
                "item_total_price": priceData.item_total_price,
                "quantity": event.detail
            };   

            if(addToCart(data, 'stepper')){                
                computeSubTotal();
            }                  
            
        }, 1000); 
    });
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

function cartItemHtml(data, cart_item){
    const item_price = formatNumber(data.price);
    const item_total_price = formatNumber(data.item_total_price || data.price);
    const img = data.image && data.image.trim() !== ''
        ? `<img src="${encodeURI(data.image)}" width="66px" height="66px">`
        : placeholderImage;

    return ` <div id="cart-item-${data.id}" class="cart-item-wrap">
            <div class="grid-x" >
                <div class="image_wrap">
                    ${ img }
                </div>
                <div class="grid-y cart-details flex-child-auto">
                    <h6>${ data.product_name }</h6>
                    <p class="body-x-small">SKU ${ data.product_sku }</p>
                    <div class="spacer x-small"></div>
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
                        name="cart-stepper"
                        class="cart-stepper" 
                        data-id="${ data.id }"
                        data-product_uuid="${ data.product_uuid }"
                        data-variant_uuid="${ data.variant_uuid }"
                        data-product_name="${ data.product_name }"
                        value="${ data.quantity }"
                        step="1" min="1" 
                        small>
                    </ins-input-stepper>
                    <div class="spacer small"></div>
                    <div class="text-right" >
                        <ins-button label="Remove" icon="icon-trash-2" size="small" class="cart-remove-btn" data='{"id":"${cart_item.id}","uuid":"${cart_item.uuid}","cart_uuid":"${cart_item.cart_uuid}"}' ></ins-button>
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
    let prices = document.querySelectorAll(".compute-price");

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
});

function openDrawer(){
    cartDrawer.setDrawerState(true);
}
