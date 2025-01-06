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
// const shippingPhone = {
//     inputTelAccount: document.getElementById('shipping-phone'),
//     shippingMobilePhone: document.getElementById('hidden-shipping-phone'),
//     shippingMobileCountryCode: document.getElementById('hidden-shipping-phone-country-code')
// }
// let shippingSubmitBtn = document.getElementById("shipping-submit-button");

// Billing Address Elements------------------------------------------
// const billingPhone = {
//     inputTelAccount: document.getElementById('billing-phone'),
//     billingPhoneNumber: document.getElementById('hidden-billing_contact_phone_number'),
//     billingCountryCode: document.getElementById('hidden-billing_contact_phone_country_code')
// }
// let sameAddressBtn = document.getElementById('same-billing');
// let billingSubmitBtn = document.getElementById("billing-submit-button");
// let billingSameWithShipping = document.getElementById("billing-same-with-shipping"); 
// let billingContactFields = document.getElementById("billing-contact-fields");
// let billingAddressFields = document.getElementById("billing-address-fields");

// Payment Information Elements------------------------------------------
let addCardBtn = document.getElementById('add-card-btn');
let cardModal = document.getElementById('stripe-modal');
let checkoutSubmitBtn = document.getElementById('checkout-submit-btn');

let existingAddressCards = [];
let addAddressBtn = Array.from(document.getElementsByClassName('add-address-btn'));
let newAddressFlag = false;
let selectedCardId = null;
let shippingSamewithAccountFlag = false;
let billingSamewithShippingFlag = false;
let guestUserFlag = false;

const inputIds = [
    "shipping_address_1",
    "shipping_address_2",
    "shipping_state",
    "shipping_postcode",
    "shipping_country",
    "billing_address_1",
    "billing_address_2",
    "billing_state",
    "billing_postcode",
    "billing_country"
];

// BILLING ELEMENTS ------------------------------------------

// Get references to relevant elements
const billingSameWithShippingEl = document.getElementById('billing-same-with-shipping');
const billingFirstNameEl = document.getElementById('billing_contact_first_name');
const billingLastNameEl = document.getElementById('billing_contact_last_name');
const billingEmailEl = document.getElementById('billing_contact_email');
const billingCompanyNameEl = document.getElementById('billing_company_name');
const billingSubmitBtn = document.getElementById("billing-submit-button");
const billingContactFields = document.getElementById("billing-contact-fields");
const billingAddressFields = document.getElementById("billing-address-fields");
const addressCards = document.getElementById("address-cards");

const billingAddress1El = document.getElementById('billing_address_1');
const billingAddress2El = document.getElementById('billing_address_2');
const billingCityEl = document.getElementById('billing_city');
const billingStateEl = document.getElementById('billing_state');
const billingPostCodeEl = document.getElementById('billing_postcode');
const billingCountryEl = document.getElementById('billing_country');

// Billing hidden details
const hiddenBillingShippingFirstNameEl = document.getElementById('hidden-shipping-first-name');
const hiddenBillingShippingLastNameEl = document.getElementById('hidden-shipping-last-name');
const hiddenBillingShippingEmailEl = document.getElementById('hidden-shipping-email');
const hiddenBillingShippingCompanyNameEl = document.getElementById('hidden-shipping-company-name');
const hiddenBillingShippingAddress1El = document.getElementById('hidden-shipping-address-1');
const hiddenBillingShippingddress2El = document.getElementById('hidden-shipping-address-2');
const hiddenBillingShippingCityEl = document.getElementById('hidden-shipping-city');
const hiddenBillingShippingStateEl = document.getElementById('hidden-shipping-state');
const hiddenBillingShippingPostCodeEl = document.getElementById('hidden-shipping-postcode');
const hiddenBillingShippingCountryEl = document.getElementById('hidden-shipping-country')

const hiddenBillingFirstNameEl = document.getElementById('hidden-billing_contact_first_name');
const hiddenBillingLastNameEl = document.getElementById('hidden-billing_contact_last_name');
const hiddenBillingEmailEl = document.getElementById('hidden-billing_contact_email');
const hiddenBillingCompanyNameEl = document.getElementById('hidden-billing_company_name');
const hiddenSelectedShippingAddressId = document.getElementById('hidden-selected-shipping') ;

// Billing Phone details
const billingPhone = {
    inputTelAccount: document.getElementById('billing-phone'),
    billingMobileCountryCode: document.getElementById('hidden-billing_contact_phone_country_code'),
    billingMobilePhone: document.getElementById('hidden-billing_contact_phone_number'),
    shippingMobilePhone: document.getElementById('hidden-shipping-mobile-number'),
    shippingMobileCountryCode: document.getElementById('hidden-shipping-country-code'),
};  


// SHIPPING ELEMENTS ------------------------------------------

// Get references to relevant elements
const shippingSameWithAccountEl = document.getElementById('same-shipping');
const shippingFirstNameEl = document.getElementById('shipping-first-name');
const shippingLastNameEl = document.getElementById('shipping-last-name');
const shippingEmailEl = document.getElementById('shipping-email');
const shippingCompanyNameEl = document.getElementById('shipping-company-name');
const shippingSubmitBtn = document.getElementById("shipping-submit-button");
const shipCont = document.getElementsByClassName("shipping-contact-person");

// Account and shipping hidden details
const hiddenAccountFirstNameEl = document.getElementById('hidden-account-first-name');
const hiddenAccountLastNameEl = document.getElementById('hidden-account-last-name');
const hiddenAccountEmailEl = document.getElementById('hidden-account-email');
const hiddenAccountCompanyNameEl = document.getElementById('hidden-company-name');
const hiddenShippingFirstNameEl = document.getElementById('hidden-first-name');
const hiddenShippingLastNameEl = document.getElementById('hidden-last-name');
const hiddenShippingEmailEl = document.getElementById('hidden-email');
const hiddenShippingCompanyNameEl = document.getElementById('hidden-shipping-company-name');
const hiddenCurrentUserId = document.getElementById('hidden-current-user-id');

// Shipping Phone details
const shippingPhone = {
    inputTelAccount: document.getElementById('shipping-phone'),
    accountMobilePhone: document.getElementById('hidden-mobile-number'),
    accountMobileCountryCode: document.getElementById('hidden-country-code'),
    shippingMobilePhone: document.getElementById('hidden-shipping-mobile-number'),
    shippingMobileCountryCode: document.getElementById('hidden-shipping-country-code')
};

let Checkout = (function () {
    return {
        methods: {
            // Function to update phone details
            updatePhone(sameAddress = false, page = '') {
                const setPhoneDetails = (telPhone, countryCodeValue, phoneValueValue) => {
                    telPhone.setCountryCode(countryCodeValue);
                    telPhone.setAttribute('phonenum-value', phoneValueValue);
                };

                let countryCode = '';
                let phoneValue = '';

                const getPhoneDetails = (pageType) => {
                    if (pageType === 'billing') {
                        // Use billing phone details
                        countryCode = billingPhone[`${sameAddress ? 'shipping' : 'billing'}MobileCountryCode`].value;
                        phoneValue = billingPhone[`${sameAddress ? 'shipping' : 'billing'}MobilePhone`].value || '';
                        countryCode = countryCode ? `+${countryCode}` : '+61'; 
                    } else if (pageType === 'shipping') {
                        // Use shipping phone details
                        countryCode = shippingPhone[`${sameAddress ? 'account' : 'shipping'}MobileCountryCode`].value;
                        phoneValue = shippingPhone[`${sameAddress ? 'account' : 'shipping'}MobilePhone`].value || '';
                        countryCode = countryCode ? `+${countryCode}` : '+61'; 
                    }
                };

                if (page === 'billing' || page === 'shipping') {
                    getPhoneDetails(page);
                    const telPhone = (page === 'billing') ? billingPhone.inputTelAccount : shippingPhone.inputTelAccount;
                    setPhoneDetails(telPhone, `+${countryCode}`, phoneValue);
                }
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
            },
            checkSelectedCard(){
                const cards = document.querySelectorAll('ins-checkbox-card');
        
                cards.forEach(card => {
                    const isSelected = card.hasAttribute('selected');

                    // If a selected card is found, stop further processing
                    if (isSelected) {
                        selectedCardId = card.value;
                        Checkout.methods.removeAddressRequiredAttribute();
                        return; 
                    }
                });
            },
            removeAddressRequiredAttribute() {
                console.info('removeAddressRequiredAttribute function triggered. Removing required and validate attributes.');
                // Remove the 'required' and 'validate' attributes
                inputIds.forEach(id => {
                    const inputElement = document.getElementById(id);
                    if (inputElement) {
                        inputElement.removeAttribute('required');
                        inputElement.removeAttribute('validate');
                    }
                });
            },
            addAddressRequiredAttribute() {
                console.info('addAddressRequiredAttribute function triggered. Add required and validate attributes.');
            
                // List of input IDs to exclude
                const excludedIds = ['shipping_address_2', 'billing_address_2'];
            
                // Add the 'required' and 'validate' attributes to all inputs except excluded ones
                inputIds.forEach(id => {
                    if (!excludedIds.includes(id)) {
                        const inputElement = document.getElementById(id);
                        if (inputElement) {
                            inputElement.setAttribute('required', '');
                            inputElement.setAttribute('validate', '');
                        }
                    }
                });
            },
            /**
             * Checks if the current user is logged in by evaluating the value of `hiddenCurrentUserId`.
             * Updates the `guestUserFlag` accordingly, and logs the result.
             */
            checkIfLoggedInUser() {
                if (hiddenCurrentUserId) {
                    const userId = hiddenCurrentUserId.value;
                    guestUserFlag = !userId || userId === '';

                    // If guestUserFlag is true, set newAddressFlag to true
                    if (guestUserFlag) {
                        newAddressFlag = true;
                    }
                }
            },
            // Function to hide the new address fields based on specific flags and conditions
            hideNewAddress() {
                // Check if the user is a guest and a new address is being added
                if (guestUserFlag && newAddressFlag) {
                    
                    if (!billingSamewithShippingFlag) {
                        Checkout.methods.addAddressRequiredAttribute();
                    } else {
                        if (billingAddressFields) {
                            billingAddressFields.classList.add('hide');
                        }
                    }
                }
            },
            // Validate address conditions for non-guest users
            validateAddress(isValid){
                if (!guestUserFlag) {
                    if (!selectedCardId && !newAddressFlag && existingAddressCards.length > 1) {
                        isValid = false;
                        Checkout.events.setAddressCardError();
                    } 
                }

                return isValid;
            },
            // Update shipping details based on whether shipping info is the same as account info
            updateShippingDetails(sameDetails){
                shippingSamewithAccountFlag = sameDetails;
                if (sameDetails){
                    for (var i = 0; i < shipCont.length; i++) { shipCont[i].classList.add('hide'); }

                    shippingFirstNameEl.value = hiddenAccountFirstNameEl.value;
                    shippingLastNameEl.value = hiddenAccountLastNameEl.value;
                    shippingEmailEl.value = hiddenAccountEmailEl.value;
                    shippingCompanyNameEl.value = hiddenAccountCompanyNameEl.value;
                    Checkout.methods.updatePhone(true, 'shipping');  
                } else {
                    for (var i = 0; i < shipCont.length; i++) { shipCont[i].classList.remove('hide'); }

                    shippingFirstNameEl.value = hiddenShippingFirstNameEl.value || '';
                    shippingLastNameEl.value = hiddenShippingLastNameEl.value || '';
                    shippingEmailEl.value = hiddenShippingEmailEl.value || '';
                    shippingCompanyNameEl.value = hiddenShippingCompanyNameEl.value || '',
                    Checkout.methods.updatePhone(false, 'shipping');  
                }
            },
            // Update billing details based on whether billing info is the same as shipping info
            updateBillingDetails(sameDetails) {
                billingSamewithShippingFlag = sameDetails;
                Checkout.methods.hideNewAddress();

                if (sameDetails) {
                    Checkout.methods.removeAddressRequiredAttribute();
            
                    billingFirstNameEl.value = hiddenBillingShippingFirstNameEl.value;
                    billingLastNameEl.value = hiddenBillingShippingLastNameEl.value;
                    billingEmailEl.value = hiddenBillingShippingEmailEl.value;
                    billingCompanyNameEl.value = hiddenBillingShippingCompanyNameEl.value;
                    selectedCardId = hiddenSelectedShippingAddressId.value;
            
                    Checkout.methods.updatePhone(true, 'billing');
            
                    if (guestUserFlag) {
                        billingAddress1El.value = hiddenBillingShippingAddress1El.value;
                        billingAddress2El.value = hiddenBillingShippingddress2El.value;
                        billingCityEl.value = hiddenBillingShippingCityEl.value;
                        billingStateEl.value = hiddenBillingShippingStateEl.value;
                        billingPostCodeEl.value = hiddenBillingShippingPostCodeEl.value;
                        billingCountryEl.value = hiddenBillingShippingCountryEl.value;
                    }

                } else {
                    Checkout.methods.addAddressRequiredAttribute();
            
                    // Handle guest user flag logic for billing address visibility
                    if (!guestUserFlag) {
                        if (billingAddressFields) billingAddressFields.classList.add('hide');
                    } else {
                        if (addAddressBtn[0]) addAddressBtn[0].classList.add('hide');
                        if (billingAddressFields) billingAddressFields.classList.remove('hide');
                    }
            
                    if (guestUserFlag) {
                        billingFirstNameEl.value = ''
                        billingLastNameEl.value =  '';
                        billingEmailEl.value = '';
                        billingCompanyNameEl.value = '';
                        billingAddress1El.value = '';
                        billingAddress2El.value = '';
                        billingCityEl.value = '';
                        billingStateEl.value = '';
                        billingPostCodeEl.value = '';
                        billingCountryEl.value = '';

                        billingPhone.inputTelAccount.setCountryCode('61');
                        billingPhone.inputTelAccount.setAttribute('phonenum-value', '');
                    } else {
                        billingFirstNameEl.value = hiddenBillingFirstNameEl.value || '';
                        billingLastNameEl.value = hiddenBillingLastNameEl.value || '';
                        billingEmailEl.value = hiddenBillingEmailEl.value || '';
                        billingCompanyNameEl.value = hiddenBillingCompanyNameEl.value || '';
                        billingCompanyNameEl.value = hiddenBillingCompanyNameEl.value || '';

                        Checkout.methods.updatePhone(false, 'billing');
                    }
                }
            },
            // Helper function to toggle visibility of fields
            toggleFieldsVisibility(checked) {
                const visibilityAction = checked ? 'add' : 'remove';

                if (addressCards) addressCards.classList[visibilityAction]('hide');
                if (addAddressBtn[0]) addAddressBtn[0].classList[visibilityAction]('hide');
                if (billingContactFields) billingContactFields.classList[visibilityAction]('hide');
                if (billingAddressFields) billingAddressFields.classList[visibilityAction]('hide');
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
                let isValid = await App.validation.validateForm(form);

                // Validate address based on the flags
                isValid = Checkout.methods.validateAddress(isValid);

                if (isValid) {
                    if (!guestUserFlag && newAddressFlag) {
                        form.submit();
                    } else {
                        Checkout.events.saveSessionApi(true);
                    }
                } else {
                    App.events.notyf("error", "Please check missing fields");
                    shippingSubmitBtn.loading = false;
                }
                return false;
            },
            async saveSessionApi(shipping = false) {
                let phoneNumber = null;
                let phoneCountryCode = null;
                let address = 'shipping';
            
                // Determine if we are saving shipping or billing information
                let phone;
                if (shipping) {
                    phone = await shippingPhone.inputTelAccount.getValues();
                } else {
                    phone = await billingPhone.inputTelAccount.getValues();
                }
            
                // Extract phone details if available
                if (phone) {
                    phoneNumber = phone.phone_number;
                    phoneCountryCode = phone.country_code;
                }

                // Prepare payload based on whether it's shipping or billing
                let payload = {};
                if (shipping) {
                    payload = {
                        same_shipping: `${shippingSamewithAccountFlag}`,
                        address_id: selectedCardId,
                        shipping_instructions: document.getElementById('shipping_instructions').value,
                        shipping_company_name: shippingCompanyNameEl.value,
                        shipping_contact_first_name: shippingFirstNameEl.value,
                        shipping_contact_last_name: shippingLastNameEl.value,
                        shipping_contact_email: shippingEmailEl.value,
                        shipping_contact_phone_number: phoneNumber,
                        shipping_contact_phone_country_code: phoneCountryCode,
                        latest_step: 3,
                        guest_user: guestUserFlag
                    };
                } else {
                    address = 'billing';
                    payload = {
                        billing_same_with_shipping: `${billingSamewithShippingFlag}`,
                        address_id: selectedCardId,
                        billing_company_name: billingCompanyNameEl.value,
                        billing_contact_first_name: billingFirstNameEl.value,
                        billing_contact_last_name: billingLastNameEl.value,
                        billing_contact_email: billingEmailEl.value,
                        billing_contact_phone_number: phoneNumber,
                        billing_contact_phone_country_code: phoneCountryCode,
                        latest_step: 4,
                        guest_user: guestUserFlag
                    };
                }

                if (guestUserFlag) {
                    // Create guestPayload with address details
                    const guestPayload = {
                        [`${address}_address_1`]: document.getElementById(`${address}_address_1`).value,
                        [`${address}_address_2`]: document.getElementById(`${address}_address_2`).value,
                        [`${address}_city`]: document.getElementById(`${address}_city`).value,
                        [`${address}_state`]: document.getElementById(`${address}_state`).value,
                        [`${address}_postcode`]: document.getElementById(`${address}_postcode`).value,
                        [`${address}_country`]: document.getElementById(`${address}_country`).value,
                    };
                
                    // Merge AddressPayload into the main payload
                    payload = { ...payload, ...guestPayload };
                }
                
                // Send request to save session data
                const url = '/save-checkout-session.json';
                const response = await apiServices.processRequest('post', url, payload);
            
                // Handle successful response
                if (response.state && response.data) {
                    window.location.href = shipping ? "/checkout/billing" : "/checkout/payment";
                    newAddressFlag = false;
                }
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
                selectedCardId = addressCard.value;
                console.info('selected card', selectedCardId);
                //Show the add new address button
                document.getElementsByClassName('add-address-btn')[0]?.classList.remove('hide');
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
                Checkout.methods.addAddressRequiredAttribute();
                //Use the initial generated uuid
                document.getElementById('address-uuid').value = document.getElementById('temp-address-uuid').value;

                let name = button.getAttribute('name');
                //Hide New Address Button
                document.getElementsByClassName('add-address-btn')[0]?.classList.add('hide');
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
                selectedCardId = null;
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
                // let addressCards = Array.from(document.querySelectorAll('ins-checkbox-card'));
                let addressCardsWrap = Array.from(document.querySelectorAll('.ins-checkbox-card-wrap'));

                addressCardsWrap.forEach(address => {
                    address.style.borderColor = '';
                    address.style.borderColor = 'red';
                });
            },
            // Function to remove 'is-invalid' class from all form elements
            removeInvalidClassFromForm() {
                const invalidElements = document.querySelectorAll('.is-invalid');
                invalidElements.forEach((element) => {
                    element.classList.remove('is-invalid');
                });
                console.info('Removed "is-invalid" class from all elements.');
            },
            async billingSubmit(event){
                event.preventDefault();
                billingSubmitBtn.loading = true;

                let form = event.srcElement; 

                let isValid = await App.validation.validateForm(form);
      
                // Validate address based on the flags
                if (!billingSamewithShippingFlag){
                    isValid = Checkout.methods.validateAddress(isValid);
                }

                if (isValid) {
                    if (!guestUserFlag && newAddressFlag) {
                        form.submit();
                    } else {
                        Checkout.events.saveSessionApi();
                    }
                } else {
                    App.events.notyf("error", "Please check missing fields");
                    billingSubmitBtn.loading = false;
                }
                return false;
            },
            //Check the status of Billing = Shipping
            billingShippingStatusCheck(addressCard){
                // let sameShippingEl = document.getElementById("status-same-shipping");
                // if(addressCard){
                //     let shippingSelectedEl = document.getElementById("hidden-selected-shipping");
                //     if(addressCard.value == shippingSelectedEl.value){
                //         sameShippingEl.classList.remove("hide");
                //     } else {
                //         sameShippingEl.classList.add("hide");
                //     }   
                // } else {
                //     sameShippingEl.classList.add("hide");
                // }
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
                Checkout.methods.checkIfLoggedInUser();
                this.initShippingDetailsListener();
                this.initBillingDetailsListener();
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
                if (shippingSameWithAccountEl) {
                    shippingSameWithAccountEl.addEventListener('insCheck', (event) => {
                        let isChecked = event.detail.checked;
                        Checkout.methods.updateShippingDetails(isChecked);
                    });
                }
            },
            initBillingDetailsListener(){                    
                if (billingSameWithShippingEl) {
                    let billingSameWithShipping = billingSameWithShippingEl.value;
                    if (billingSameWithShipping) {
                        Checkout.methods.updateBillingDetails(billingSameWithShipping);
                    }

                    billingSameWithShippingEl.addEventListener('insCheck', (event) => {
                        let isChecked = event.detail.checked;       
                        Checkout.methods.updateBillingDetails(isChecked);
                        Checkout.methods.toggleFieldsVisibility(isChecked);
                    });
                }
            },
            initAddressCardListener() {
                existingAddressCards = Array.from(document.querySelectorAll('ins-checkbox-card'));
                existingAddressCards.forEach(address => {
                    address.addEventListener('insClick', () => {
                        Checkout.events.selectAddressCard(address);
                        Checkout.methods.removeAddressRequiredAttribute();
                        newAddressFlag = false;
                    });
                });

                Checkout.methods.checkSelectedCard();
            },
            initAddressBtnListener() {
                addAddressBtn.forEach(btn => {
                    btn.addEventListener('insClick', () => {
                        Checkout.events.addNewAddress(btn);
                        selectedCardId = null;
                        newAddressFlag = true;
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
