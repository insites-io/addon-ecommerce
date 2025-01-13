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
                        contact_uuid: formEl.querySelector('#user-uuid-input').value,
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
                if (type === 'success') {
                    if (response.guest_user) {
                       location.reload();
                    } else {
                        setTimeout(() => {
                            formEl.submit();
                        }, 500);
                    }
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