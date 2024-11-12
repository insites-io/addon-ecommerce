// Account Creation Variable ------------------------------------------
let emailIsClean = true;

// Account Information Elements------------------------------------------
const accountPhone = {
    inputTelAccount: document.getElementById('account-phone'),
    accountMobilePhone: document.getElementById('hidden-account-phone'),
    accountMobileCountryCode: document.getElementById('hidden-account-phone-country-code')
}
const accountSubmitBtn = document.getElementById('account-submit');

// Shipping Address Elements------------------------------------------
const shippingPhone = {
    inputTelAccount: document.getElementById('shipping-phone'),
    shippingMobilePhone: document.getElementById('hidden-shipping-phone'),
    shippingMobileCountryCode: document.getElementById('hidden-shipping-phone-country-code')
}
let sameShippingDetailsBtn = document.getElementById('same-shipping');
let shippingSubmitBtn = document.getElementById("shipping-submit-button");

// Billing Address Elements------------------------------------------
let sameAddressBtn = document.getElementById('same-billing');
let billingSubmitBtn = document.getElementById("billing-submit-button");

// Payment Information Elements------------------------------------------
let addCardBtn = document.getElementById('add-card-btn');
let cardModal = document.getElementById('stripe-modal');
let checkoutSubmitBtn = document.getElementById('checkout-submit-btn');


let Checkout = (function () {
    return {
        methods: {
            // Update Shipping Detail 
            updateShippingDetails(checkState) {
                let accountDetails = document.querySelectorAll('[shipping-details-field]');
                accountDetails.forEach((field) => {
                    let idValue = field.getAttribute('id');
                    if(idValue) {
                        if(checkState){
                            if(idValue == "shipping-phone"){
                                let countryCodeEl = document.getElementById('hidden-country-code');
                                let mobileEl = document.getElementById('hidden-mobile-number');
                                if(mobileEl && countryCodeEl){
                                    document.getElementById(idValue).setAttribute('phonenum-value', mobileEl.value);
                                    document.getElementById(idValue).setCountryCode(countryCodeEl.value);
                                }
                            } else {
                                let hiddenFieldId = idValue.replace(/shipping-/g, "hidden-");
                                let hiddenField = document.getElementById(hiddenFieldId);
                                if(hiddenField){
                                    document.getElementById(idValue).value = hiddenField.value;
                                }
                            }
                            document.getElementById(idValue).setAttribute('has-error',false);
                            document.getElementById(idValue).setAttribute('readonly',true);
                        } else {
                            document.getElementById(idValue).removeAttribute('readonly');
                        }
                    }
                });
            },
            async checkSignUpUserEmail(field){ 
                // Attached to the eventlistener
                let varEmail = field.value;
                if(App.validation.validateEmail(field)){
                    let url = '/check_user_email_signup.json?'+ 'email='+ varEmail ;
                    let response = await apiServices.processRequest('get', url);
                    if(response.state && response.data) {
                        //Check / Handle if user exist
                        Checkout.methods.checkUserEmail(field, response.data);
                    } 
                }
            },
            checkUserEmail(emailElem, data){
                if(data.email_status == "invalid" || data.email_status == "no-profile"){
                    //Profile in account is already existing (Active / Inactive)
                    emailElem.hasError = true;
                    emailElem.errorMessage = "Email has already been used.";
                    emailIsClean = false
                } else {
                    // New email
                    emailElem.hasError = false;
                    emailIsClean = true;
                }
            }
        },
        validation: {
            validateCreditCard(currentStep) {
                let cardValid = currentStep.querySelectorAll(".card-fields[required] .is-invalid");
                let container = currentStep.querySelector('.validate-credit-card');
                if (container) {
                    if (cardValid && cardValid.length > 0) {
                        container.querySelector('.error-message').classList.remove('hide');
                        Checkout.validation.creditCardsHasError(container, true);
                    } else {
                        container.querySelector('.error-message').classList.add('hide');
                        Checkout.validation.creditCardsHasError(container, false);
                    }
                }
            },
            creditCardsHasError(step, error) {
                step.querySelectorAll('.card-options ins-credit-card')
                    .forEach(element => {
                        error
                            ? element.classList.add('is-invalid')
                            : element.classList.remove('is-invalid')
                    });
            },
            validateAddress(currentStep) {
                let container = currentStep.querySelectorAll('.validate-address');
                if(container) {
                    container.forEach(block => {
                        let addressValid = block.querySelectorAll(".address-fields[required] .is-invalid");
                        if (addressValid.length > 0) {
                            block.querySelector('.error-message').classList.remove('hide');
                            Checkout.validation.addressCardsHasError(block, true);
                        } else {
                            block.querySelector('.error-message').classList.add('hide');
                            Checkout.validation.addressCardsHasError(block, false);
                        }
                    });
                }
            },
            addressCardsHasError(step, error) {
                step.querySelectorAll('.address-options ins-checkbox-card')
                    .forEach(element => {
                        error 
                            ? element.classList.add('is-invalid')
                            : element.classList.remove('is-invalid')
                    });
            }

        },
        events: {
            // Account Information submission
            async accountSubmit(event){
                event.preventDefault();
                accountSubmitBtn.loading = true;
                let form = event.srcElement;
                let account = await accountPhone.inputTelAccount.getValues();
                if(account){
                    accountPhone.accountMobilePhone.value = account.phone_number;
                    accountPhone.accountMobileCountryCode.value = account.country_code;
                }
                let isValid = await App.validation.validateForm(form);

                if(isValid && emailIsClean) {
                    form.submit();
                } else {
                    App.events.notyf("error", "Please check missing fields");
                    accountSubmitBtn.loading = false;
                }
                return false;
            },
            async shippingSubmit(event){
                event.preventDefault();
                shippingSubmitBtn.loading = true;
                let form = event.srcElement;
                let phone = await shippingPhone.inputTelAccount.getValues();
                if(phone){
                    shippingPhone.shippingMobilePhone.value = phone.phone_number;
                    shippingPhone.shippingMobileCountryCode.value = phone.country_code;
                }
                let isValid = await App.validation.validateForm(form);

                if(isValid) {
                    form.submit();
                } else {
                    this.setAddressCardError();
                    App.events.notyf("error", "Please check missing fields");
                    shippingSubmitBtn.loading = false;
                }
                return false;
            },
            selectAddressCard(addressCard) {
                let name = addressCard.getAttribute('name');

                // Remove State of address field cards
                document.getElementsByName(name).forEach(el => {
                    el.classList.remove('is-invalid');
                    el.removeAttribute('selected');
                    el.selected = false;
                });
                // set selected state
                addressCard.setAttribute('selected', true);
                addressCard.selected = true;
                //Show the add new address button
                document.getElementsByClassName('add-address-btn')[0].classList.remove('hide');
                //Modify fields and form
                this.fillAddressField(addressCard);
                this.setFormAsPatch(addressCard);
            },
            fillAddressField(addressCard) {
                let name = addressCard.getAttribute('name');
                let type = name.split('-')[0];
                
                document.getElementById('address-uuid').value = addressCard.dataset.uuid;
                document.getElementById(`${type}-address-search`).value = addressCard.dataset.address;
                document.getElementById(`${type}_address_id`).value = addressCard.value || "";
                document.getElementById(`${type}_address_1`).value = addressCard.dataset.address_1 || "";
                document.getElementById(`${type}_address_2`).value = addressCard.dataset.address_2 || "";
                document.getElementById(`${type}_city`).value = addressCard.dataset.city || "";
                document.getElementById(`${type}_state`).value = addressCard.dataset.state || "";
                document.getElementById(`${type}_postcode`).value = addressCard.dataset.postcode || "";
                document.getElementById(`${type}_country`).value = addressCard.dataset.country || "";
            },
            setFormAsPatch(addressCard){
                let name = addressCard.getAttribute('name');

                let formId = name.split('-')[0] + "-address-form";
                let formEl = document.getElementById(formId);
                //Set the action of the form
                formEl.action = "/api/customizations/" + addressCard.value;
                //Set resource id of the form
                let namelist = formEl.querySelectorAll('[name=resource_id]');
                namelist[0].value = addressCard.value;
                //Set the method of the form
                let namelistMethod = formEl.querySelectorAll('[name=_method]');
                if(namelistMethod.length <= 0){
                    // Add the patch input
                    var input = document.createElement("input");
                    input.type = "hidden";
                    input.name = "_method";
                    input.value = "patch";
                    formEl.appendChild(input);
                }
                //Update button label
                let submitBtn = document.getElementById(name.split('-')[0] + "-submit-button");
                if(submitBtn){
                    if(name.split('-')[0] == 'shipping'){
                        submitBtn.setAttribute('label','Proceed to Billing')
                    } else {
                        submitBtn.setAttribute('label','Proceed to Payment')
                    }
                }
                //This function is to be run for billing only
                if(name.split('-')[0] == 'billing'){
                    this.billingShippingStatusCheck(addressCard);
                }
                //Hide the form fields
                let containerId = name.split('-')[0] + "-address-fields";
                let containerEl = document.getElementById(containerId);
                containerEl.classList.add("hide");
            },
            addNewAddress(button){
                //Use the initial generated uuid
                document.getElementById('address-uuid').value = document.getElementById('temp-address-uuid').value;

                let name = button.getAttribute('name');
                //Hide New Address Button
                document.getElementsByClassName('add-address-btn')[0].classList.add('hide');
                //Clean the form and the fields
                this.clearAddressField(button);
                this.setFormAsNew(button);
                this.uncheckAddressCard();
                //Scroll field
                let fieldGroup = document.getElementById(name);
                fieldGroup.classList.remove('hide');
                fieldGroup.scrollIntoView({
                    behavior: "smooth",
                    block: "center", // vertical position
                    inline: "start" // horizontal position
                });
            },
            uncheckAddressCard(){
                let addressCards = Array.from(document.querySelectorAll('ins-checkbox-card'));
                addressCards.forEach(address => {
                    address.setAttribute('selected', false);
                    address.selected = false;
                });
            },
            clearAddressField(btnAddress){
                let name = btnAddress.getAttribute('name');
                let type = name.split('-')[0];

                document.getElementById(`${type}-address-search`).value = "";
                document.getElementById(`${type}_address_id`).value = "";
                document.getElementById(`${type}_address_1`).value = "";
                document.getElementById(`${type}_address_2`).value = "";
                document.getElementById(`${type}_city`).value = "";
                document.getElementById(`${type}_state`).value = "";
                document.getElementById(`${type}_postcode`).value = "";
                document.getElementById(`${type}_country`).value = "";
            },
            setFormAsNew(btnAddress){
                let name = btnAddress.getAttribute('name');

                let formId = name.split('-')[0] + "-address-form";
                let formEl = document.getElementById(formId);
                //Update form action
                formEl.action = "/api/customizations";
                //Remove patch element
                let namelistMethod = formEl.querySelectorAll('[name=_method]');
                if(namelistMethod.length > 0){
                    namelistMethod[0].remove();
                }   
                //change form to empty
                let namelist = formEl.querySelectorAll('[name=resource_id]');
                namelist[0].value = "new"
                //Update button label
                let submitBtn = document.getElementById(name.split('-')[0] + "-submit-button");
                if(submitBtn){
                    submitBtn.setAttribute('label','Save and Proceed')
                }
                //If the item is billing , check the status 
                if(name.split('-')[0] == 'billing'){
                    this.billingShippingStatusCheck();
                }
                //Show the form fields
                let containerId = name.split('-')[0] + "-address-fields";
                let containerEl = document.getElementById(containerId);
                containerEl.classList.remove("hide");
            },
            setAddressCardError(){
                let addressCards = Array.from(document.querySelectorAll('ins-checkbox-card'));
                addressCards.forEach(address => {
                    address.classList.add('is-invalid');
                });
            },
            async billingSubmit(event){
                event.preventDefault();
                billingSubmitBtn.loading = true;
                let form = event.srcElement;
                
                let isValid = await App.validation.validateForm(form);

                if(isValid) {
                    form.submit();
                } else {
                    this.setAddressCardError();
                    App.events.notyf("error", "Please check missing fields");
                    billingSubmitBtn.loading = false;
                }
                return false;
            },
            //Check the status of Billing = Shipping
            billingShippingStatusCheck(addressCard){
                let sameShippingEl = document.getElementById("status-same-shipping");
                if(addressCard){
                    let shippingSelectedEl = document.getElementById("hidden-selected-shipping");
                    if(addressCard.value == shippingSelectedEl.value){
                        sameShippingEl.classList.remove("hide");
                    } else {
                        sameShippingEl.classList.add("hide");
                    }   
                } else {
                    sameShippingEl.classList.add("hide");
                }
            },
            async paymentFormSubmit(event){
                event.preventDefault();
                checkoutSubmitBtn.loading = true;
                let form = event.srcElement;
                let isValid = await App.validation.validateForm(form);
                
                Checkout.validation.validateCreditCard(form);

                if(isValid) {
                    form.submit();
                } else {
                    App.events.notyf("error", "Please check missing fields");
                    checkoutSubmitBtn.loading = false
                }
                return false;
            }
            
        },
        init: {
            initEventListener() {
                this.initShippingDetailsListener();
                this.initAddressCardListener();
                this.initAddressBtnListener();
                if(addCardBtn) {
                    addCardBtn.addEventListener('insClick',() => cardModal.open());
                }
                this.initCardsEventListener();
                this.initCheckNavigation();
                this.initEmailAccountChecker();
            },
            initShippingDetailsListener() {
                let shipCont = document.getElementsByClassName("shipping-contact-person");
                if (sameShippingDetailsBtn) {
                    sameShippingDetailsBtn.addEventListener('insCheck', (event) => {
                        let isChecked = event.detail.checked;
                        Checkout.methods.updateShippingDetails(isChecked);
                        if (isChecked){
                            for (var i = 0; i < shipCont.length; i++) { shipCont[i].classList.add('hide'); }
                        }else{
                            for (var i = 0; i < shipCont.length; i++) { shipCont[i].classList.remove('hide'); }
                        }
                    });
                }
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
                        Checkout.events.addNewAddress(btn);
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
            },
            initEmailAccountChecker(){
                let emailField = Array.from(document.getElementsByClassName('new-user-email'));
                emailField.forEach(field => {
                    field.addEventListener('insBlur', () => {
                        Checkout.methods.checkSignUpUserEmail(field);
                    });
                });
            },
            initCheckNavigation(){
                let navigation_list = performance.getEntriesByType("navigation");
                if(navigation_list.length > 0){
                    if(navigation_list[0].type == "back_forward"){
                        window.location.reload();
                    }
                }
            }
            
        }
    }
})();

setTimeout(() => {
    Checkout.init.initEventListener();
}, 200);
