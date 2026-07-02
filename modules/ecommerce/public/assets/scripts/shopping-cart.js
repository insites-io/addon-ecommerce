let isDeleting = false;

let shoppingCart = (function () {
    return {
        methods: {
            async removeDiscountCode(ev) {
                let discountEl = ev.target.parentElement;
                let uuid = discountEl.getAttribute('data-uuid');
                if(uuid && !isDeleting) {
                    isDeleting = true;
                    let payload = {
                        "uuid": uuid
                    };
                    let response = await apiServices.removeDiscountCode({ payload });
                    if(response.state) {
                        discountEl.remove();
                        App.events.notyf("success", "Discount code has been removed from your cart.");
                        location.reload();
                    }
                }
            },
            async validateDiscountCode(payload, formEl) {                                                    
                let response = await apiServices.validateDiscountCode({ 'payload': payload });
                this.discountCodeResponseHandler(response, formEl);
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