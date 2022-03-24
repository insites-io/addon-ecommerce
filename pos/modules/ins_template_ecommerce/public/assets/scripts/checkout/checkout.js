let sameAddressBtn = document.getElementById('same-billing');
let sameShippingDetailsBtn = document.getElementById('same-shipping');

let addCardBtn = document.getElementById('add-card-btn');
let cardModal = document.getElementById('stripe-modal');
let checkoutSubmitBtn = document.getElementById('checkout-submit-btn');
let checkoutForm = document.getElementById('checkout-form');

const billing_phone = {
    inputTelBilling: document.getElementById('billing_phone'),
    billing_mobile_phone: document.getElementById('hidden_billing_phone')
}

const shipping_phone = {
    inputTelShipping: document.getElementById('shipping_phone'),
    shipping_mobile_phone: document.getElementById('hidden_shipping_phone')
}

let Checkout = (function () {
    return {
        methods: {
            updateBillingAddress() {
                this.copyShippingLookupValue();
                this.checkSelectedAddressCard();
                let billingAddressFields = document.querySelectorAll('[billing-address-field]');
                    billingAddressFields.forEach((field) => {
                        Checkout.methods.copyToBillingAddresss(field);
                    });
            },
            updateShippingDetails() {
                let accountDetails = document.querySelectorAll('[account-details-field]');
                    accountDetails.forEach((field) => {
                        let name = field.getAttribute('name');
                        if(name) {
                            let shippingField = name.replace(/billing_/g, "shipping_");
                                shippingField = document.getElementsByName(shippingField)[0];
                                shippingField.value = field.value;  
                        }
                        this.copyToShippingPhone();
                    });
            },
            async copyToShippingPhone() {
                let billing = await billing_phone.inputTelBilling.getValues();
                shipping_phone.inputTelShipping.setCountryCode(`+${billing.country_code}`);
                shipping_phone.inputTelShipping.setAttribute('phonenum-value', billing.phone_number)
            },
            copyShippingLookupValue() {
                document.getElementById('billing-address-search').value 
                    = document.querySelector('#shipping-address-search input').value;
            },
            checkSelectedAddressCard() {
                let shippingAddressCard = document.querySelector('ins-checkbox-card[name="shipping-address-cards"][selected="true"]');
                if (shippingAddressCard) {
                    shippingAddressCard = shippingAddressCard.value;
                    let billingAddressCard = document.querySelector(`ins-checkbox-card[name="billing-address-cards"][value="${shippingAddressCard}"]`);
                        Checkout.events.selectAddressCard(billingAddressCard);
                }
            },
            copyToBillingAddresss(field) {
                let copyShippingField = field.getAttribute('id').split('_').splice(1, 3).join('_');
                if (copyShippingField === 'address_id')
                    field.value = document.getElementById(`shipping_${copyShippingField}`).value || 'copy-billing'
                else
                    field.value = document.getElementById(`shipping_${copyShippingField}`).value;
            }
        },
        events: {
            async payBillsSubmit(event) {
                event.preventDefault();
                checkoutSubmitBtn.loading = true;
                let form = event.srcElement;
                let validAmount = true;
                let billAmountEl = document.getElementById('bill-amount');
                let isValid = await App.validation.validateForm(form);
                let billing = await billing_phone.inputTelBilling.getValues();

                if(billAmountEl) {
                    billAmountEl.hasError = !(billAmountEl.value && Math.sign(parseFloat(billAmountEl.value)) > 0);
                    validAmount = !billAmountEl.hasError;
                }
                
                CheckoutSteps.validation.validateAddress(form);
                CheckoutSteps.validation.validateCreditCard(form);

                if(isValid && validAmount) {
                    let countryCodeBilling = billing.country_code;
                    billing_phone.billing_mobile_phone.value = countryCodeBilling + billing.phone_number;
                    
                    form.submit();
                } else {
                    App.events.notyf("error", "Please check missing fields");
                    checkoutSubmitBtn.loading = false
                }
                return false;
            },
            async checkoutFormSubmit(event) {
                event.preventDefault();
                checkoutSubmitBtn.loading = true;
                let form = event.srcElement;
                let isValid = await App.validation.validateForm(form);
                
                let billing = await billing_phone.inputTelBilling.getValues();
                let shipping = await shipping_phone.inputTelShipping.getValues();

                CheckoutSteps.validation.validateAddress(form);
                CheckoutSteps.validation.validateCreditCard(form);
                CheckoutSteps.validation.validateStepper();

                if(isValid) {
                    let countryCodeBilling, countryCodeShipping;

                    countryCodeBilling = billing.country_code;
                    countryCodeShipping = shipping.country_code;

                    billing_phone.billing_mobile_phone.value = countryCodeBilling + billing.phone_number;
                    shipping_phone.shipping_mobile_phone.value = countryCodeShipping + shipping.phone_number;
                    
                    form.submit();
                } else {
                    App.events.notyf("error", "Please check missing fields");
                    checkoutSubmitBtn.loading = false
                }
                return false;
            },
            selectAddressCard(addressCard) {
                let name = addressCard.getAttribute('name');
                    // remove error state of address cards - by field name
                    document.getElementsByName(name).forEach(el => {
                        el.classList.remove('is-invalid');
                        el.removeAttribute('selected');
                        el.selected = false;
                    });
                    // set selected state
                    addressCard.setAttribute('selected', true);
                    addressCard.selected = true;
                this.fillAddressField(addressCard);
            },
            fillAddressField(addressCard) {
                let name = addressCard.getAttribute('name');
                let type = name.split('-')[0];

                document.getElementById(`${type}-address-search`).value = addressCard.dataset.address;
                document.getElementById(`${type}_address_id`).value = addressCard.value;
                document.getElementById(`${type}_address_1`).value = addressCard.dataset.address_1 || "";
                document.getElementById(`${type}_address_2`).value = addressCard.dataset.address_2 || "";
                document.getElementById(`${type}_city`).value = addressCard.dataset.city || "";
                document.getElementById(`${type}_state`).value = addressCard.dataset.state || "";
                document.getElementById(`${type}_postcode`).value = addressCard.dataset.postcode || "";
                document.getElementById(`${type}_country`).value = addressCard.dataset.country || "";
            },
            addressInputEvent(event) {
                let type = event.target.getAttribute('id').split('_')[0];
                addressValueChanged = true;
                AddressLookup.methods.unselectAddressCards(type);
                if (sameAddressBtn) 
                    sameAddressBtn.checked = false;
            }
        },
        init: {
            initEventListener() {
                if(addCardBtn) 
                    addCardBtn.addEventListener('insClick',() => cardModal.open());
                this.initSameAddressListener();
                this.initShippingDetailsListener();
                this.initAddressFieldInputListener();
                this.initAddressBtnListener();
                this.initAddressCardListener();
                this.initCardsEventListener();
            },
            initSameAddressListener() {
                if (sameAddressBtn) {
                    sameAddressBtn.addEventListener('insCheck', (event) => {
                        let isChecked = event.detail.checked;
                        if(isChecked)
                            Checkout.methods.updateBillingAddress(isChecked);
                    });
                }
            },
            initShippingDetailsListener() {
                if (sameShippingDetailsBtn) {
                    sameShippingDetailsBtn.addEventListener('insCheck', (event) => {
                        let isChecked = event.detail.checked;
                        if (isChecked)
                            Checkout.methods.updateShippingDetails(isChecked);
                    });
                }
            },
            initAddressFieldInputListener() {
                let shippingAddressFields = document.querySelectorAll('[shipping-address-field]');
                    this.bindAddressInputListener(shippingAddressFields);
                let billingAddressFields = document.querySelectorAll('[billing-address-field]');
                    this.bindAddressInputListener(billingAddressFields);
                
            },
            bindAddressInputListener(fields) {
                fields.forEach((field) => {
                    field.addEventListener('insInput', (event) => {
                        Checkout.events.addressInputEvent(event);
                    });
                });
            },
            initAddressCardListener() {
                let addressCards = Array.from(document.querySelectorAll('ins-checkbox-card'));
                    addressCards.forEach(address => {
                        address.addEventListener('insClick', () => {
                            Checkout.events.selectAddressCard(address);
                        });
                    });
            },
            initAddressBtnListener() {
                let buttons = Array.from(document.getElementsByClassName('add-address-btn'));
                    buttons.forEach(btn => {
                        btn.addEventListener('insClick', () => {
                            let name = btn.getAttribute('name');
                            let fieldGroup = document.getElementById(name);
                                fieldGroup.classList.remove('hide');
                                fieldGroup.scrollIntoView({
                                    behavior: "smooth",
                                    block: "center", // vertical position
                                    inline: "start" // horizontal position
                                });
                                fieldGroup.querySelector('ins-input input').focus();
                        });
                    });
            },
            initCardsEventListener() {
                let iterations = 5;
                let setStateInterval = setInterval(() => {
                    let cards = Array.from(document.getElementsByTagName('ins-credit-card'));
                    if(cards) {
                        cards.forEach(element => {
                            element.addEventListener('insClick', () => {
                                StripeElement.events.selectCard(element);
                            });
                            element.addEventListener('insClose', () => {
                                StripeElement.events.removeCard(element);
                            });
                        });
                            clearInterval(setStateInterval);
                    } else {
                        iterations++;
                        if(iterations > 5)
                            clearInterval(setStateInterval);
                    }
                }, 300);
            }
        }
    }
})();

setTimeout(() => {
    Checkout.init.initEventListener();
}, 200);
