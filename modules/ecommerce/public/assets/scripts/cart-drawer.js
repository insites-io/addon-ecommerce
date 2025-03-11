
//let page = "{{ context.params.slug }}";
//let user_uuid = "{{ user_uuid }}";
let cartCounts = document.querySelectorAll('.cart-count')
let cartDrawer = document.getElementById('cartDrawer');
let cartItemsWrap = document.getElementById('cart-items-wrap');
let emptyCartWrap = document.getElementById('empty-cart-wrap');
let bottomWrap = document.getElementById('bottom-wrap');
let cartSubtotal = document.getElementById('cart-subtotal');
let cartQuantity = 1;

//product detailed page          
let variantID = 0;
let variantPrice = 0;
let productSKU = document.getElementById("product-sku");
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

// Remove the 'hide' class from the cart drawer when it has loaded
cartDrawer.addEventListener('didLoad', () => {
    cartDrawer.classList.remove('hide');
});


/* Add to Cart */
let addToCartBtn = document.querySelectorAll(".add-to-cart-btn");
addToCartBtn.forEach(btn => {
    btn.addEventListener('insClick', event => {  
        addToCartPreProcess(event);
    });
});

function addToCartPreProcess(event, type){
    //show hide
    emptyCartWrap.classList.add("hide");
    bottomWrap.classList.remove("hide");

    //show cart drawer
    if(event.detail.label == "Add to Cart"){
        cartDrawer.setDrawerState(true); 
    } 

    if(type == "reorder"){
        data = event.detail.data;
        all_items = event.detail.all_items;        
        reorder_iteration = event.detail.iteration;
    } else {
        data = JSON.parse(event.detail.data);
        data.quantity = cartQuantity;
        //used for reorder only
        all_items = []; 
        reorder_iteration = 0;
        type = event.detail.label
    }         
        
    //used for product with variants in product details page
    if (productSKU && variantID != 0) {
        if (productSKU.textContent == data.product_sku){
            data.id = variantID;
            data.price = variantPrice;
            data.product_sku = productSKU.textContent;
        }     
    }
       
    let cartItem = document.getElementById(`cart-item-${data.id}`);
 
    if(cartItem == null){
      
        if(addToCart(data, type, all_items, reorder_iteration)){        

            if (!emptyCartWrap.classList.contains('hide')) {
                emptyCartWrap.classList.add('hide');
                bottomWrap.classList.remove('hide');
            }          
                                
            cartItemsWrap.insertAdjacentHTML('afterbegin', cartItemHtml(data));

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
    else if(type.toLowerCase() == 'buy now'){
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

        if (user_uuid != '') {
            if (shoppingCartListEl && shoppingCartLoaderEl) {
                shoppingCartListEl.style.display = 'none';  
                shoppingCartLoaderEl.classList.remove("hide");
            }
        } else {
            const shoppingCartListQuery = document.querySelector("#shopping-cart-list");
            const shoppingGuestCartLoaderQuery = document.querySelector("#shopping-guest-cart-loader");

            if (shoppingCartListQuery && shoppingGuestCartLoaderQuery) {
                shoppingCartListQuery.style.display = 'none';  
                shoppingGuestCartLoaderQuery.classList.remove("hide");
            }
        }

        let itemWrap = event.target.closest(".cart-item-wrap");            
        let stepperData = event.target.closest("ins-input-stepper").dataset;

        // Calculate the total price for the item
        let priceData = computeItemTotal(itemWrap, event.detail);

        let data = {
            "id": stepperData.id,
            "product_name": stepperData.product_name,
            "product_uuid": stepperData.product_uuid,
            "product_sku": stepperData.product_sku,
            "price": priceData.price,  
            "item_total_price": priceData.item_total_price,
            "quantity": event.detail
        };   

        if(addToCart(data, 'stepper')){                
            computeSubTotal();
        }       
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
                "Remove Item?", 
                "Are you sure you want to remove this item from your cart?", 
                "Remove");

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


/* Add cart to Database or to localStorage */
async function addToCart(data, type, all_items, reorder_iteration){        
    data["type"] = type;
    // Reset the cartQuantity
    cartQuantity = 1;

    if (type.toLowerCase() == 'buy now'){
        setButtonLoadingState(data.id, true)
    }

    if(user_uuid != ""){
        data["contact_uuid"] = user_uuid;          
     
        if (type == "reorder") {
            if(reorder_iteration > 0){
                return true;
            }
            for (const item of all_items) {
                let response = await apiServices.processRequest("post", "/add-to-cart.json", item);
                is_added = (response.state && response.data.items)? true : false;
            }
            return is_added;
        } else {
            goToCartButtonDisabled();
            let response = await apiServices.processRequest("post", "/add-to-cart.json", data);     

            if(response.state) {
                goToCartButtonEnabled();
                if (page == 'shopping-cart') {
                    location.reload();
                } 

                handleShoppingCartRedirect(type, data)

                return true;          
            } else {
                goToCartButtonEnabled();
                App.events.notyf("error", "Something went wrong. Please try again.");
            }
         
        }
    } else {
        addCartToLocalStorage(data);    
        handleShoppingCartRedirect(type, data)        
    }
}      

/* Redirects the user to the shopping cart page if the type is not "Add to Cart" or "stepper",
    and handles additional logic when the type is "Buy Now". */
function handleShoppingCartRedirect(type, data) {
    if (type != "Add to Cart" && type != "stepper") {
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
    // - Reload the page if the user is Trade Customer
    // - Go to /shopping-cart if the user is a guest to allow the session to take effect first.
    if(page == 'checkout'){
        user_uuid === '' ? (window.location.href = '/shopping-cart') : location.reload();
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

/* Remove cart from Database or from localStorage */
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

    if(user_uuid != ""){
        goToCartButtonDisabled();       
        data["contact_uuid"] = user_uuid;
        let response = await apiServices.processRequest("post", "/remove-to-cart.json", data);

        if(response.state && response.data.items) {
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
    } else {
        removeCartFromLocalStorage(data);            
    }

    reloadIfShoppingCartPage();
}       

function cartItemHtml(data){
    const item_price = formatNumber(data.price);
    const item_total_price = formatNumber(data.item_total_price || data.price);

    return ` <div id="cart-item-${data.id}" class="cart-item-wrap">
            <div class="grid-x" >
                <div class="cell grid-y large-7 medium-7 small-7">
                    <h6>${ data.product_name }</h6>
                    <p class="body-x-small">SKU ${ data.product_sku }</p>
                    <div class="spacer x-small"></div>
                    <p>
                        <span class="body-x-small-bold">Price:</span>
                        <span class="body-x-small item-price">$${ item_price }</span>
                    </p>
                </div>
                <div class="cell grid-y large-5 medium-5 small-5 text-right">
                    <p class="cart-price compute-price">$${ item_total_price }</p>
                    <div class="spacer x-small"></div>
                    <ins-input-stepper
                        class="cart-stepper" 
                        data-id="${ data.id }"
                        data-product_uuid="${ data.product_uuid }"
                        data-product_sku="${ data.product_sku }"
                        data-product_name="${ data.product_name }"
                        value="${ data.quantity }"
                        step="1" min="1" 
                        small>
                    </ins-input-stepper>
                </div>        
            </div>
            <div class="text-right" >
                <ins-button label="Remove" icon="icon-trash-2" size="small" class="cart-remove-btn" data='{"product_uuid":"${data.product_uuid}","product_sku":"${data.product_sku}"}' ></ins-button>
            </div>    
            <div class="spacer x-large"></div>
        </div>`;    
}


/* Guest user - Get cart from local storage */
if (user_uuid === "") {
    const carts = getCartFromLocalStorage();

    if (carts.length > 0) {
        carts.forEach(cart => {
            const cartData = JSON.parse(cart);
            cartItemsWrap.insertAdjacentHTML('afterbegin', cartItemHtml(cartData));

            const newItemAdded = document.getElementById(`cart-item-${cartData.id}`);
            if (window.location.pathname !== "/shopping-cart") {
                if (newItemAdded) {
                    // Handle cart item outside the shopping cart page
                    const cartStepper = newItemAdded.querySelector(".cart-stepper");
                    if (cartStepper) cartStepperEventListener(cartStepper);
                    const removeCartBtn = newItemAdded.querySelector(".cart-remove-btn");
                    if (removeCartBtn) removeCartEventListener(removeCartBtn);
                }
            }
        });

        computeSubTotal();

        // Handle cart item on the shopping cart page
        if (window.location.pathname === "/shopping-cart") {
            // Poll for cart stepper elements every 1 second for a maximum of 15 seconds
            let retryCount = 0;
            const maxRetries = 15;
            const pollInterval = 1000; // 1 second

            const pollForCartSteppers = setInterval(() => {
                const cartSteppers = document.querySelectorAll(".cart-stepper");
                const removeCartBtn = document.querySelectorAll(".cart-remove-btn");

                if (cartSteppers.length > 0) {
                    // Attach event listener to each stepper
                    cartSteppers.forEach(cartStepperEventListener);
                    removeCartBtn.forEach(removeCartEventListener);
                    clearInterval(pollForCartSteppers);  // Stop polling once we have the elements
                }
                retryCount++;
                if (retryCount >= maxRetries) {
                    console.warn("Max retries reached. Could not find cart steppers.");
                    clearInterval(pollForCartSteppers); // Stop polling after max retries
                }
            }, pollInterval);
        }
    } else {
        emptyCartWrap.classList.remove('hide');
    }
}


function getCartFromLocalStorage(){
    let carts = localStorage.getItem('carts');
    if (carts) {
        carts = JSON.parse(carts);
    }
    return carts;     
}

function addCartToLocalStorage(data){ 
    let carts = getCartFromLocalStorage();

    if(carts){
        /* Update Cart */
        let is_item_exist = false
        let item_exist_index = -1
        for (let i = 0; i < carts.length; i++) {    
            item = JSON.parse(carts[i]); //convert string to object
            if(item.product_uuid == data.product_uuid && item.product_sku == data.product_sku){
                is_item_exist = true;
                item_exist_index = i;                                        
            }
        }
        if(is_item_exist == true){                
            carts[item_exist_index] = JSON.stringify(data);
        } else {
            carts.push(JSON.stringify(data));
        }
    } else {
        /* Add Cart */
        carts = [(JSON.stringify(data))];
    }

    localStorage.setItem('carts', JSON.stringify(carts));    

    goToCartButtonEnabled();   
    reloadIfShoppingCartPage();
}

function reloadIfShoppingCartPage() {
    if (window.location.pathname === "/shopping-cart") {
        if( user_uuid == ""){
            // Guest user
            if (saveCheckoutSessionForGuest()) {
                setTimeout(() => {
                    location.reload();
                }, 1000); // add delay to allow the session to be saved
            }
        } else {
            // Logged in user
            location.reload();
        }
    } else if(user_uuid == "" ){
        // Save session data for guest user
        saveCheckoutSessionForGuest();
    }
}

function removeCartFromLocalStorage(data){
    let carts = getCartFromLocalStorage();
    if(carts){
        /* Find the item to be removed */
        for (let i = 0; i < carts.length; i++) {    
            item = JSON.parse(carts[i]); //convert string to object
            if(item.product_uuid == data.product_uuid && item.product_sku == data.product_sku){       
                carts.splice(i, 1); //remove this item from array                       
            }
        }
    }
    localStorage.setItem('carts', JSON.stringify(carts));
}

function formatNumber(num) {
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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


/**
 * Saves the checkout session data for a guest user by sending the payload to the server.
 * It includes details like subtotal, shipping, processing fees, taxes, and total amount.
 * A success or error notification is triggered based on the response.
 */
 async function saveCheckoutSessionForGuest(products) {
    // Get cart items from localStorage and parse them
    const localStorageCarts = localStorage.getItem('carts');
    let cart = [];
        
    if (localStorageCarts) {
        try {
            // Parse the JSON string from localStorage
            const cartArray = JSON.parse(localStorageCarts);                
            // Convert each item to object if it's a string
            cart = cartArray.map(item => {
                if (typeof item === 'string') {
                    return JSON.parse(item);
                }
                return item;
            });
        } catch (e) {
            console.error("Error parsing cart data:", e);
            cart = [];
        }
    }

    // Create payload for the checkout session
    const payload = {
        guest_user: true,
        products: products,
        cart: cart,
        type: 'cart_drawer'
    };

    // Send request to save the session data
    const url = '/save-checkout-session.json';
    const response = await apiServices.processRequest('post', url, payload);

    if (response.state && response.data) {            
        return true;
    } else {
        App.events.notyf("error", "An error occurred while saving the order summary.");
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
