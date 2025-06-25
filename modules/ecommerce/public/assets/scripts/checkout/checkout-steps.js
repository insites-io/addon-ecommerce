/** 
 * Checkout - Scripts / Functions
 * */
const checkoutStepEl = Array.from(document.getElementsByClassName('checkout-step'));

let CheckoutSteps = (function () {
    return {
        init: {
            initNavigation() {                
                if(checkoutStepEl) {
                    checkoutStepEl.forEach(step => {
                        step.addEventListener('insStepClick', async(event) => {
                            window.location.href = event.target.dataset.page;
                        });
                    });
                }
            }
        }
    }
})();

// Set timeout, make sure INS components has been loaded
setTimeout(() => {
    CheckoutSteps.init.initNavigation();
}, 200);