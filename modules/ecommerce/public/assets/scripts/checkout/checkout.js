// Phone Numbers
const contactPhone = {
    insInput: document.getElementById('contact-phone'),
    phone: document.getElementById('phone-number'),
    countryCode: document.getElementById('phone-country-code')
};
const shippingPhone = {
    insInput: document.getElementById('shipping-phone'),
    phone: document.getElementById('phone-number'),
    countryCode: document.getElementById('phone-country-code')
};
const billingPhone = {
    insInput: document.getElementById('billing-phone'),
    phone: document.getElementById('phone-number'),
    countryCode: document.getElementById('phone-country-code')
};


// Contact Information
var guest_uuid = '';
const contactCompanyNameEl = document.getElementById('contact-company-name');
const contactFirstNameEl = document.getElementById('contact-first-name');
const contactLastNameEl = document.getElementById('contact-last-name');
const contactEmailEl = document.getElementById('contact-email');
const contactSubmitBtn = document.getElementById('contact-submit');

// Virtual form for Contact Information (Guest user)
const virtualContactSubmitBtn = document.querySelector('#virtual-form #contact-submit');


let guestUserFlag = false;

// Address Modal Form
const addressFormModal = document.getElementById('address-form-modal');
const addAddressBtn = document.getElementById('add-address-btn');
const addressSubmitBtn = document.getElementById('address-submit-btn');
const addressCancelBtn = document.getElementById('address-cancel-btn');

// Modal Address
const modalLongitudeEl = document.getElementById('modal_longitude');
const modalLatitudeEl = document.getElementById('modal_latitude');
const modalAddress1El = document.getElementById('modal_address_1');
const modalAddress2El = document.getElementById('modal_address_2');
const modalSuburbEl = document.getElementById('modal_suburb');
const modalStateEl = document.getElementById('modal_state');
const modalPostcodeEl = document.getElementById('modal_postcode');
const modalCountryEl = document.getElementById('modal_country');

// Addresses
const addressCards = document.getElementById('address-cards');
let selectedAddressId = null;
let selectedAddress = {
    "address_1": "",
    "address_2": "",
    "suburb": "",
    "state": "",
    "postcode": "",
    "country": ""    
}

// Shipping
const shippingSameWithAccountEl = document.getElementById('shipping-same-with-account');
const shippingContact = document.getElementById("shipping-contact-inputs");
const shippingFirstNameEl = document.getElementById('shipping-first-name');
const shippingLastNameEl = document.getElementById('shipping-last-name');
const shippingEmailEl = document.getElementById('shipping-email');
const shippingCompanyNameEl = document.getElementById('shipping-company-name');
const shippingAddressID = document.getElementById('shipping_address_id');
const shippingSubmitBtn = document.getElementById("shipping-submit-button");


// Billing 
const billingSameWithShippingEl = document.getElementById('billing-same-with-shipping');
const billingContact = document.getElementById("billing-contact-inputs");
const billingCompanyNameEl = document.getElementById('billing-company-name');
const billingFirstNameEl = document.getElementById('billing-first-name');
const billingLastNameEl = document.getElementById('billing-last-name');
const billingEmailEl = document.getElementById('billing-email');
const billingAddressID = document.getElementById('billing_address_id');
const billingSubmitBtn = document.getElementById("billing-submit-button");

// Payment Information
let addCardBtn = document.getElementById('add-card-btn');
let cardModal = document.getElementById('stripe-modal');
let checkoutSubmitBtn = document.getElementById('checkout-submit-btn');


let Checkout = (function () {
    return {
        methods: {
            async extractPhoneNumbers(phoneEl){
                let phoneValues = await phoneEl.insInput.getValues();
                if(phoneValues){
                    phoneEl.phone.value = phoneValues.phone_number;
                    phoneEl.countryCode.value = phoneValues.country_code;
                }
            },
            async checkSignUpUserEmail(field){ 
                // Attached to the eventlistener
                let varEmail = field.value;
                if(App.validation.validateEmail(field)){
                    let url = '/validate-email.json?'+ 'email='+ varEmail ;
                    let response = await apiServices.processRequest('get', url);
                    if(response.state && response.data) {
                        //Check / Handle if user exist
                        return Checkout.methods.checkUserEmail(field, response.data);
                    } 
                }
            },
            checkUserEmail(emailElem, data){
                if(data.items.total_entries > 0){
                    // If the existing email has a 'guest' note, allow it to update the data
                    if(data.items.results[0]?.profiles[0]?.properties.notes == 'guest'){
                        emailElem.hasError = false;
                        emailElem.errorMessage = "";
                        return {
                            status: 'existing guest',
                            user_uuid: data.items.results[0].external_id
                        };
                    } else {
                        //Profile in account is already existing (Active / Inactive)
                        emailElem.hasError = true;
                        emailElem.errorMessage = "Email has already been used.";
                        return {
                            status: 'existing user'
                        };
                    }
                } else {
                    // New email
                    emailElem.hasError = false;
                    emailElem.errorMessage = "";
                    return {
                        status: 'not exist'
                    };
                }
            },
            createAddressCard(data) {
                let cardHtml = `
                <div class="large-6 medium-6 small-12 cell">
                    <ins-checkbox-card data-equalizer-watch="" name="shipping-address-cards" selected-color="blue" value="${data.id}" data-address="${data.address_1}" data-address_1="${data.address_1}" data-address_2="${data.address_2}" data-suburb="${data.suburb}" data-state="${data.state}" data-postcode="${data.postcode}" data-country="${data.country}">                    
                        <div>
                            <p class="form-label">${data.address_1}, ${data.address_2}</p>
                            <div class="spacer small"></div>
                            <p>${data.state} <br>${data.postcode}</p>
                            <p>${data.country}</p>
                        </div>
                    </ins-checkbox-card>                       
                </div>            
                `;
                return cardHtml;
            },
            checkSelectedCard(){
                const cards = document.querySelectorAll('ins-checkbox-card');
        
                cards.forEach(card => {
                    const isSelected = card.hasAttribute('selected');

                    // If a selected card is found, stop further processing
                    if (isSelected) {
                        selectedAddressId = card.value;
                        //Checkout.methods.removeAddressRequiredAttribute();
                        return; 
                    }
                });
            },
            addAddressRequiredAttribute() {
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
            // Update shipping details based on whether shipping info is the same as account info
            updateShippingContact(sameDetails){
                let requiredInputs = document.querySelectorAll('#shipping-contact-inputs ins-input[required]');
                if(sameDetails){
                    shippingSamewithAccountFlag = true;
                    shippingContact.classList.add('hide');                            
                    requiredInputs.forEach(input => {
                        input.removeAttribute('validate');
                        input.removeAttribute('has-error');
                    });

                } else {
                    shippingSamewithAccountFlag = false;
                    shippingContact.classList.remove('hide');
                    requiredInputs.forEach(input => {
                        input.setAttribute('validate', '');
                    });
                }
            },
            updateBillingContact(sameDetails){
                let requiredInputs = document.querySelectorAll('#billing-contact-inputs ins-input[required]');
                if(sameDetails){
                    billingSamewithShippingFlag = true;
                    billingContact.classList.add('hide');                            
                    requiredInputs.forEach(input => {
                        input.removeAttribute('validate');
                        input.removeAttribute('has-error');
                    });

                } else {
                    billingSamewithShippingFlag = false;
                    billingContact.classList.remove('hide');
                    requiredInputs.forEach(input => {
                        input.setAttribute('validate', '');
                    });
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
            }
        },
        events: {
            // Contact Information submission
            async contactSubmit(event){
                event.preventDefault();
                let form = event.srcElement;
                contactSubmitBtn.loading = true;                
                Checkout.methods.extractPhoneNumbers(contactPhone);
                if(await App.validation.validateForm(form)) {
                    form.submit();
                } else {
                    App.events.notyf("error", "Please check missing fields.");
                    contactSubmitBtn.loading = false;
                }
                return false;
            },
            async virtualContactSubmit(){                
                contactSubmitBtn.loading = true;                
                Checkout.methods.extractPhoneNumbers(contactPhone);
                let emailStatus = await Checkout.methods.checkSignUpUserEmail(contactEmailEl);
                if(await App.validation.validateForm(document.getElementById('virtual-form'))) {                    
                    var companyPayload = {
                        "company_name" : contactCompanyNameEl.value
                    };
                    var contactPayload = {
                        "first_name" : contactFirstNameEl.value,
                        "last_name" : contactLastNameEl.value,
                        "email" : contactEmailEl.value,
                        "mobile_phone_number" : contactPhone.phone.value,
                        "mobile_phone_country_code" : contactPhone.countryCode.value,
                        "notes" : "guest"
                    };                    

                    if(emailStatus.status == 'existing guest'){
                        //Add CRM Company
                        if (contactCompanyNameEl.value) {  
                            var companies = await apiServices.processRequest('post','/create-company.json',companyPayload);
                        }

                        //Update CRM Contact
                        if(companies?.data.uuid){
                            contactPayload['company.uuid'] = companies?.data.uuid;
                        }
                        var contacts = await apiServices.processRequest('put','/update-contact.json',contactPayload);

                        // Submit
                        if(contacts?.data?.email){
                            guest_uuid = contacts?.data?.uuid;
                            if(Checkout.events.saveSessionApi('virtual-contact')){
                                //Add delay to allow the session to be saved
                                setTimeout(() => {
                                    window.location.href = "/checkout/shipping";
                                }, 1000);       
                            }                         
                        } else {
                            App.events.notyf("error", "API response error. Please notify the website administrator.");
                        }
                        contactSubmitBtn.loading = false;
                    } else if(emailStatus.status == 'not exist'){
                        //Add CRM Company
                        if (contactCompanyNameEl.value) {
                            var companies = await apiServices.processRequest('post','/create-company.json',companyPayload);
                        }                        

                        //Add CRM Contact
                        if(companies?.data.uuid){
                            contactPayload['company.uuid'] = companies?.data.uuid;
                        }
                        var contacts = await apiServices.processRequest('post','/create-contact.json',contactPayload);

                        // Submit
                        if(contacts?.data?.email){
                            guest_uuid = contacts?.data?.uuid;
                            if(Checkout.events.saveSessionApi('virtual-contact')){
                                //Add delay to allow the session to be saved
                                setTimeout(() => {
                                    window.location.href = "/checkout/shipping";
                                }, 1000);       
                            }               
                        } else {
                            App.events.notyf("error", "API response error. Please notify the website administrator.");
                        }    
                        contactSubmitBtn.loading = false;           
                    }               
                } else {
                    App.events.notyf("error", "Please check missing fields.");
                    contactSubmitBtn.loading = false;
                }
                return false;
            },
            async shippingSubmit(event){
                event.preventDefault();
                shippingSubmitBtn.loading = true;
                let form = event.srcElement;

                if(shippingSamewithAccountFlag){
                    Checkout.methods.updateShippingContact(true);
                }
                Checkout.methods.extractPhoneNumbers(shippingPhone);
                                                      
                if (await App.validation.validateForm(form)) {
                    if(Checkout.events.saveSessionApi('shipping')){
                        //Add delay to allow the session to be saved
                        setTimeout(() => {
                            form.submit();
                        }, 1000);       
                    }                         
                } else {
                    App.events.notyf("error", "Please check missing fields.");
                    shippingSubmitBtn.loading = false;
                }
                return false;
            },
            async billingSubmit(event){
                event.preventDefault();
                billingSubmitBtn.loading = true;  
                let form = event.srcElement;

                if(billingSamewithShippingFlag){
                    Checkout.methods.updateBillingContact(true);
                }                
                Checkout.methods.extractPhoneNumbers(billingPhone);                                     

                if (await App.validation.validateForm(form)) {
                    if(Checkout.events.saveSessionApi('billing')){
                        //Add delay to allow the session to be saved
                        setTimeout(() => {
                            form.submit();
                        }, 1000);       
                    } 
                } else {                       
                    App.events.notyf("error", "Please check missing fields.");
                    billingSubmitBtn.loading = false;
                }                
                            
                billingSubmitBtn.loading = false;
                return false;
            },
            async saveSessionApi(page) {

                // Prepare payload based on whether it's shipping or billing
                let payload = {};
                if (page == 'contact' || page == 'virtual-contact') {
                    payload = {
                        type: 'contact',
                        contact_company_name: contactCompanyNameEl.value,
                        contact_first_name: contactFirstNameEl.value,
                        contact_last_name: contactLastNameEl.value,
                        contact_email: contactEmailEl.value,
                        contact_phone_number: contactPhone.phone.value,
                        contact_phone_country_code: contactPhone.countryCode.value,
                        latest_step: 2,
                        ...(page === 'virtual-contact' && { guest_uuid: guest_uuid })
                    };
                } else if (page == 'shipping') {
                    payload = {
                        type: 'shipping',
                        //shipping_address_id: shippingAddressID.value,
                        shipping_same_with_account: shippingSamewithAccountFlag,
                        shipping_instructions: document.getElementById('shipping_instructions').value,
                        shipping_company_name: shippingCompanyNameEl.value,
                        shipping_contact_first_name: shippingFirstNameEl.value,
                        shipping_contact_last_name: shippingLastNameEl.value,
                        shipping_contact_email: shippingEmailEl.value,
                        shipping_contact_phone_number: shippingPhone.phone.value,
                        shipping_contact_phone_country_code: shippingPhone.countryCode.value,
                        latest_step: 3,
                        guest_user: guestUserFlag
                    };
                } else if (page == 'billing') {
                    payload = {
                        type: 'billing',
                        //billing_address_id: billingAddressID.value,
                        billing_same_with_shipping: billingSamewithShippingFlag,
                        billing_company_name: billingCompanyNameEl.value,
                        billing_contact_first_name: billingFirstNameEl.value,
                        billing_contact_last_name: billingLastNameEl.value,
                        billing_contact_email: billingEmailEl.value,
                        billing_contact_phone_number: billingPhone.phone.value,
                        billing_contact_phone_country_code: billingPhone.countryCode.value,
                        latest_step: 4,
                        guest_user: guestUserFlag
                    };
                }

                if (page === 'shipping' || page === 'billing') {
                    let addressPayload = {};
                  
                    const isMemberCheckout = document.getElementById(`${page}_address_id`);
                  
                    if (isMemberCheckout) {
                      // Member checkout: use selected address object
                      addressPayload = {
                        [`${page}_address_1`]: selectedAddress.address_1,
                        [`${page}_address_2`]: selectedAddress.address_2,
                        [`${page}_suburb`]: selectedAddress.suburb,
                        [`${page}_state`]: selectedAddress.state,
                        [`${page}_postcode`]: selectedAddress.postcode,
                        [`${page}_country`]: selectedAddress.country
                      };
                    } else {
                      // Guest checkout: get values from form inputs
                      addressPayload[`${page}_address_1`] = document.getElementById(`${page}_address_1`).value;
                      addressPayload[`${page}_address_2`] = document.getElementById(`${page}_address_2`).value;
                      addressPayload[`${page}_suburb`] = document.getElementById(`${page}_suburb`).value;
                      addressPayload[`${page}_state`] = document.getElementById(`${page}_state`).value;
                      addressPayload[`${page}_postcode`] = document.getElementById(`${page}_postcode`).value;
                      addressPayload[`${page}_country`] = document.getElementById(`${page}_country`).value;
                    }
                  
                    // Merge into main payload
                    payload = { ...payload, ...addressPayload };
                }                  
                
                
                // Send request to save session data
                const url = '/save-checkout-session.json';
                const response = await apiServices.processRequest('post', url, payload);
            
                // Handle successful response
                if (response.state && response.data) {
                    return true;
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
                selectedAddressId = addressCard.value;

                selectedAddress = {
                    "address_1": addressCard.getAttribute('data-address_1'),
                    "address_2": addressCard.getAttribute('data-address_2'),
                    "suburb": addressCard.getAttribute('data-suburb'),
                    "state": addressCard.getAttribute('data-state'),
                    "postcode": addressCard.getAttribute('data-postcode'),
                    "country": addressCard.getAttribute('data-country')   
                };

                if(shippingAddressID){
                    shippingAddressID.setValue(selectedAddressId);
                }

                if(billingAddressID){
                    billingAddressID.setValue(selectedAddressId);
                }                
            },      
            async addressSubmit() {
                let isValid = await App.validation.validateForm(addressFormModal);
                if(isValid){
                    let url = '/create-contact-address.json' ;
                    let payload = {
                            "related_uuid": contactUuid, //REQUIRED
                            "address_label": modalAddress1El.value, //REQUIRED
                            "default_address": false,
                            "address_1": modalAddress1El.value,
                            "address_2": modalAddress2El.value,
                            "suburb": modalSuburbEl.value,
                            "state": modalStateEl.value,
                            "country": modalCountryEl.value,
                            "postcode": modalPostcodeEl.value,
                            "geojson": {
                                "type": "Point",
                                "coordinates": [parseFloat(modalLatitudeEl.value), parseFloat(modalLongitudeEl.value)]
                            },
                            "latitude": modalLatitudeEl.value,
                            "longitude": modalLongitudeEl.value
                        }
                    let response = await apiServices.processRequest('post',url,payload);
                    if(response.state && response.data.id) {            
                        addressFormModal.close();
                        App.events.notyf("success", "Address added successfully.");                        
                        addressCards.insertAdjacentHTML('afterbegin', Checkout.methods.createAddressCard(response.data));

                        //Select the newly added card                        
                        Checkout.events.selectAddressCard(
                            document.querySelector(`ins-checkbox-card[value="${response.data.id}"]`)
                        );                          

                        // Reset value to blank
                        [
                            'modal_longitude',
                            'modal_latitude',
                            'modal_address_1',
                            'modal_address_2',
                            'modal_suburb',
                            'modal_state',
                            'modal_postcode',
                            'modal_country'
                        ].forEach(id => {
                            const el = document.getElementById(id);
                            if (el) el.value = '';
                        });
                    } else {
                        App.events.notyf("error", "Something went wrong. Please try again.");
                    }
                }
            },
            uncheckAddressCard(){
                let addressCards = Array.from(document.querySelectorAll('ins-checkbox-card'));
                addressCards.forEach(address => {
                    address.setAttribute('selected', false);
                    address.selected = false;
                });
                selectedAddressId = null;
            },
            // Function to remove 'is-invalid' class from all form elements
            removeInvalidClassFromForm() {
                const invalidElements = document.querySelectorAll('.is-invalid');
                invalidElements.forEach((element) => {
                    element.classList.remove('is-invalid');
                });
            },
            async paymentFormSubmit(event){
                event.preventDefault();
                checkoutSubmitBtn.loading = true;
                let form = event.srcElement;
                let isValid = await App.validation.validateForm(form);
                
                Checkout.validation.validateCreditCard(form);

                if(isValid) {
                    localStorage.removeItem('discount_uuids');
                    form.submit();
                } else {
                    App.events.notyf("error", "Please check missing fields.");
                    checkoutSubmitBtn.loading = false
                }
                return false;
            }            
        },
        init: {
            initEventListener() {
                this.initVitualContactFormListener();
                this.initShippingDetailsListener();
                this.initBillingDetailsListener();
                this.initAddressCardListener();
                this.initCardsEventListener();
                this.initCheckNavigation();
                this.initAddressListener();    
                if(addCardBtn) {
                    addCardBtn.addEventListener('insClick',() => cardModal.open());
                }            
            },
            initAddressListener() {
                if(addAddressBtn && addressCancelBtn && addressSubmitBtn) {
                    addAddressBtn.addEventListener('insClick', () => {        
                        addressFormModal.open(); 
                    });
            
                    addressCancelBtn.addEventListener('insClick', () => {        
                        addressFormModal.close(); 
                    });     

                    addressSubmitBtn.addEventListener('insClick', () => {
                        Checkout.events.addressSubmit();
                    });
                }
            },
            initVitualContactFormListener() {
                if (virtualContactSubmitBtn) {
                    virtualContactSubmitBtn.addEventListener('insClick', (event) => {                        
                        Checkout.events.virtualContactSubmit(event);
                    });                    
                }
            },
            initShippingDetailsListener() {
                if (shippingSameWithAccountEl) {
                    shippingSameWithAccountEl.addEventListener('insCheck', (event) => {                        
                        Checkout.methods.updateShippingContact(event.detail.checked);
                    });                    
                }
            },
            initBillingDetailsListener() {
                if (billingSameWithShippingEl) {
                    billingSameWithShippingEl.addEventListener('insCheck', (event) => {                        
                        Checkout.methods.updateBillingContact(event.detail.checked);
                    });                    
                }
            },            
            initAddressCardListener() {
                if(addressCards){
                    addressCards.addEventListener('click', function (e) {
                        if (e.target.closest('ins-checkbox-card')) {                      
                            Checkout.events.selectAddressCard(e.target.closest('ins-checkbox-card'));
                        }
                    });
                }                  
                Checkout.methods.checkSelectedCard();
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
