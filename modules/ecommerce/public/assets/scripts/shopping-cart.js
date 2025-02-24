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
                let uuid = discountEl.getAttribute('data-uuid');
                if(uuid && !isDeleting) {
                    isDeleting = true;
                    let response = await apiServices.removeDiscountCode({ uuid });
                    if(response.state) {
                        discountEl.remove();
                        App.events.notyf("success", "Discount code has been removed from your cart.");                        
                        if(response.data.type == 'localStorage') {
                            let discountUuids = JSON.parse(localStorage.getItem('discount_uuids')) || [];
                            // Remove the specific UUID from the array
                            discountUuids = discountUuids.filter(id => id !== response.data.discount_uuid);
                            // Save the updated array back to localStorage or remove if empty
                            if (discountUuids.length > 0) {
                                localStorage.setItem('discount_uuids', JSON.stringify(discountUuids));
                            } else {
                                localStorage.removeItem('discount_uuids');
                            }
                        }
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
            async validateDiscountCode(payload, formEl) {                                                    
                let response = await apiServices.validateDiscountCode({ 'payload': payload });
                this.discountCodeResponseHandler(response, formEl);

                // Guest user: Save discount code to local storage
                if(payload.contact_uuid == '' && response.data.is_valid == 'true') {
                    localStorage.setItem('discount_uuids', JSON.stringify(response.data.local_discount_uuids));                   
                }
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
                        window.location.reload();
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
            }            
        },
        init: {
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
    shoppingCart.init.initDiscountCodeEvents();
}, 200);