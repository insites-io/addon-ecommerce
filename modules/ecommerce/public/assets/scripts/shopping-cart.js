let productInfo = {
    "user_id" : "",
    "quantity" : "",
    "order_id" : "",
    "status" : "",
    "product_id" : "",
    "product_name" : "",
    "product_sku" : "",
    "product_variant" : "",
    "product_price" : "",
    "tax_amount" : "",
    "shipping_amount" : ""
}
let variantList = [];
let isDeleting = false;

let shoppingCart = (function () {
    return {
        methods: {
            async removeDiscountCode(ev) {
                let discountEl = ev.target.parentElement;
                let id = discountEl.getAttribute('data-id');
                if(id && !isDeleting) {
                    isDeleting = true;
                    let response = await apiServices.removeDiscountCode({ id });
                    if(response.state) {
                        discountEl.remove();
                        App.events.notyf("success", "Discount code has been removed from your cart.");
                        location.reload();
                    }
                }
            },
            validateDiscountForm(formEl) {
                let field = formEl.querySelector('#discount-code-input');
                let code = field.value || false;field
                    field.hasError = !code ? true : false;
                return code;
            },
            async validateDiscountCode(event) {
                event ? event.preventDefault(): '';
                let formEl = document.getElementById(event.target.id);
                if(formEl && this.validateDiscountForm(formEl)) {
                    formEl.querySelector('#apply-discount-btn').loading = true;
                    let payload = {
                        user_id: formEl.querySelector('#user-id-input').value,
                        discount_code: formEl.querySelector('#discount-code-input').value,
                        check_duplicates: true
                    }
                    let response = await apiServices.validateDiscountCode({ 'payload': payload });
                    this.discountCodeResponseHandler(response, formEl);
                } else document.querySelector('#apply-discount-btn').loading = false;
            },
            discountCodeResponseHandler(response, formEl) {
                if(response.state && response.data) {
                    this.discountCodeNotifier(response.data, formEl);
                } else {
                    App.events.notyf("error", "Sorry, that discount code is not valid. Please check the code has been entered correctly and is within the validation period.");
                    formEl.querySelector('#apply-discount-btn').loading = false;
                }
            },
            discountCodeNotifier(response, formEl) {
                let type = response.is_valid === true || response.is_valid === 'true'
                    ? "success" : "error";
                App.events.notyf(type, response.message);
                if(type === 'success') {
                    setTimeout(() => {
                        formEl.submit();
                    }, 500);
                } else formEl.querySelector('#apply-discount-btn').loading = false; 
            },
            async validateRemoveForm(event){
                event ? event.preventDefault(): '';
                let formElem = event.srcElement;
                let confirm = await App.events.swal('warning', 
                    'Are you sure?',
                    'This will remove this item/s from your cart.',
                    'Remove');
                if(confirm) {
                    formElem.submit(); 
                }
            },
            async quantityChanged(event){
                //Function attached to when the quantity stepper changed value
                let itemId = event.target.id.replace("qty-cart-","");
                let itemQty = event.detail;

                let payload  ={
                    "id": itemId,
                    "quantity": itemQty
                }

                let response = await apiServices.updateCartItem({ 'payload': payload });
                if(response.state && response.data.items) {
                    //Updating cart success
                    location.reload();
                } else {
                    //Updating cart failed
                    // API error: failed to submit form
                    //this.errorHandler();
                }

            }
        },
        init: {
            initShoppingCartInterface() {
                let cartContainer = document.getElementById('shopping-cart-list');
                let subElem = cartContainer.getElementsByClassName("quantity-cart");
                for (var i = 0; i < subElem.length; i++) {
                    subElem[i].addEventListener('insValueChange', shoppingCart.methods.quantityChanged, false);
                }
                
            },
            initDiscountCodeEvents() {
                let codesList = document.querySelectorAll('.list-discount-codes--item [class^="icon-"]')
                for (var i = 0; i < codesList.length; i++) {
                    codesList[i].addEventListener('click', shoppingCart.methods.removeDiscountCode);
                }
            }
            
        }
    }
})();


setTimeout(() => {
    shoppingCart.init.initShoppingCartInterface();
    shoppingCart.init.initDiscountCodeEvents();
}, 200);