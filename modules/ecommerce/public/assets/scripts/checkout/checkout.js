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


let selectedCardId = null;
let guestUserFlag = false;

// Address Modal Form
const addressCards = document.getElementById('address-cards');
const addressFormModal = document.getElementById('address-form-modal');
const addAddressBtn = document.getElementById('add-address-btn');
const addressSubmitBtn = document.getElementById('address-submit-btn');
const addressCancelBtn = document.getElementById('address-cancel-btn');

// Shipping Contact
const shippingSameWithAccountEl = document.getElementById('shipping-same-with-account');
const shippingContact = document.getElementById("shipping-contact-inputs");
const shippingFirstNameEl = document.getElementById('shipping-first-name');
const shippingLastNameEl = document.getElementById('shipping-last-name');
const shippingEmailEl = document.getElementById('shipping-email');
const shippingCompanyNameEl = document.getElementById('shipping-company-name');

// Shipping Address
const shippingAddressID = document.getElementById('shipping_address_id');
const shipping_longitude = document.getElementById('shipping_longitude');
const shipping_latitude = document.getElementById('shipping_latitude');
const shipping_address_1 = document.getElementById('shipping_address_1');
const shipping_address_2 = document.getElementById('shipping_address_2');
const shipping_suburb = document.getElementById('shipping_suburb');
const shipping_state = document.getElementById('shipping_state');
const shipping_postcode = document.getElementById('shipping_postcode');
const shipping_country = document.getElementById('shipping_country');
const shippingSubmitBtn = document.getElementById("shipping-submit-button");

// Billing Contact
const billingSameWithShippingEl = document.getElementById('billing-same-with-shipping');
const billingContact = document.getElementById("billing-contact-inputs");
const billingCompanyNameEl = document.getElementById('billing-company-name');
const billingFirstNameEl = document.getElementById('billing-first-name');
const billingLastNameEl = document.getElementById('billing-last-name');
const billingEmailEl = document.getElementById('billing-email');

// Billing Address
const billingAddressID = document.getElementById('billing_address_id');
const billingAddress1El = document.getElementById('billing_address_1');
const billingAddress2El = document.getElementById('billing_address_2');
const billingSuburbEl = document.getElementById('billing_suburb');
const billingStateEl = document.getElementById('billing_state');
const billingPostCodeEl = document.getElementById('billing_postcode');
const billingCountryEl = document.getElementById('billing_country');
const billingSubmitBtn = document.getElementById("billing-submit-button");

// Payment Information
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
                    let url = '/check_user_email_signup.json?'+ 'email='+ varEmail ;
                    let response = await apiServices.processRequest('get', url);
                    console.log('check_user_email_signup', response);
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
            async insitesAPI(method='post', url, payload, api='/core/api'){
                let response = await apiServices.processRequest(method,url,payload,undefined,api);
                if(response.state) {
                    return response;
                } else {
                    App.events.notyf("error", "Something went wrong. Please try again.");
                }
            },
            createAddressCard(data) {
                let cardHtml = `
                <div class="large-6 medium-6 small-12 cell">
                    <ins-checkbox-card data-equalizer-watch="" name="shipping-address-cards" selected-color="blue" value="${data.id}" data-address="${data.properties.address_1}" data-address_1="${data.properties.address_1}" data-address_2="${data.properties.address_2}" data-suburb="${data.properties.suburb}" data-state="${data.properties.state}" data-postcode="${data.properties.postcode}" data-country="${data.properties.country}">                    
                        <div>
                            <p class="form-label">${shipping_address_1.value}, ${shipping_address_2.value}</p>
                            <div class="spacer small"></div>
                            <p>${shipping_state.value} <br>${shipping_postcode.value}</p>
                            <p>${shipping_country.value}</p>
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
                        selectedCardId = card.value;
                        //Checkout.methods.removeAddressRequiredAttribute();
                        return; 
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
            // Update shipping details based on whether shipping info is the same as account info
            updateShippingContact(sameDetails){
                console.log('sameDetails',sameDetails);
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
                contactSubmitBtn.loading = true;

                console.log('contactSubmit');
                
                Checkout.methods.extractPhoneNumbers(contactPhone);

                let form = event.srcElement;
                let isValid = await App.validation.validateForm(form);

                if(isValid) {
                    form.submit();
                } else {
                    App.events.notyf("error", "Please check missing fields.");
                    contactSubmitBtn.loading = false;
                }
                return false;
            },
            async virtualContactSubmit(){
                
                contactSubmitBtn.loading = true;
                console.log('virtualContactSubmit');
                
                Checkout.methods.extractPhoneNumbers(contactPhone);

                // call this line above validateForm
                let emailStatus = await Checkout.methods.checkSignUpUserEmail(document.getElementById('contact-email'));
                console.log('emailStatus',emailStatus);

                let isValid = await App.validation.validateForm(document.getElementById('virtual-form'));

                console.log('isValid',isValid);

                if(isValid) {
                    
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
                        //Update user
                        console.log('existing guest');
                        //Add CRM Company
                        if (contactCompanyNameEl.value) {                              
                            var companies = await Checkout.methods.insitesAPI('post', '/v2/companies', companyPayload, '/crm/api');                        
                            console.log('companies',companies);
                        }

                        //Update CRM Contact
                        if(companies?.data.uuid){
                            contactPayload['company.uuid'] = companies?.data.uuid;
                        }
                        var contacts = await Checkout.methods.insitesAPI('put', `/v2/contacts/${emailStatus.user_uuid}`, contactPayload, '/crm/api');
                        console.log('contacts',contacts);
                        if(contacts?.data?.email){
                            guest_uuid = contacts?.data?.uuid;
                            if(Checkout.events.saveSessionApi('contact')){
                                //Add delay to allow the session to be saved
                                setTimeout(() => {
                                    window.location.href = "/checkout/shipping";
                                }, 1000);       
                            }                         
                        }  

                        contactSubmitBtn.loading = false;
                    } else if(emailStatus.status == 'not exist'){
                        console.log('not exist');
                        //Add CRM Company
                        if (contactCompanyNameEl.value) {                            
                            var companies = await Checkout.methods.insitesAPI('post', '/v2/companies', companyPayload, '/crm/api');                        
                            console.log('companies',companies);
                        }

                        //Add CRM Contact
                        if(companies?.data.uuid){
                            contactPayload['company.uuid'] = companies?.data.uuid;
                        }
                        var contacts = await Checkout.methods.insitesAPI('post', '/v2/contacts', contactPayload, '/crm/api');
                        console.log('contacts',contacts);
                        if(contacts?.data?.email){
                            guest_uuid = contacts?.data?.uuid;
                            if(Checkout.events.saveSessionApi('contact')){
                                //Add delay to allow the session to be saved
                                setTimeout(() => {
                                    window.location.href = "/checkout/shipping";
                                }, 1000);       
                            }                         
                        }                        
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

                if(shippingSamewithAccountFlag){
                    Checkout.methods.updateShippingContact(true);
                }

                Checkout.methods.extractPhoneNumbers(shippingPhone);

                let form = event.srcElement;         
                let isValid = await App.validation.validateForm(form);                                

                if (isValid) {
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

                if(billingSamewithShippingFlag){
                    Checkout.methods.updateBillingContact(true);
                }
                
                Checkout.methods.extractPhoneNumbers(billingPhone);

                let form = event.srcElement;     
                let isValid = await App.validation.validateForm(form); 

                if (isValid) {
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
                if (page == 'contact') {
                    payload = {
                        type: 'contact',  
                        guest_uuid: guest_uuid,                      
                        contact_company_name: contactCompanyNameEl.value,
                        contact_first_name: contactFirstNameEl.value,
                        contact_last_name: contactLastNameEl.value,
                        contact_email: contactEmailEl.value,
                        contact_phone_number: contactPhone.phone.value,
                        contact_phone_country_code: contactPhone.countryCode.value,
                        latest_step: 2
                    };
                } else if (page == 'shipping') {
                    address = 'shipping';
                    payload = {
                        type: 'shipping',
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
                    address = 'billing';
                    payload = {
                        type: 'billing',
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

                if(page == 'shipping' || page == 'billing'){
                    const addressPayload = {
                        [`${address}_address_1`]: document.getElementById(`${address}_address_1`).value,
                        [`${address}_address_2`]: document.getElementById(`${address}_address_2`).value,
                        [`${address}_suburb`]: document.getElementById(`${address}_suburb`).value,
                        [`${address}_state`]: document.getElementById(`${address}_state`).value,
                        [`${address}_postcode`]: document.getElementById(`${address}_postcode`).value,
                        [`${address}_country`]: document.getElementById(`${address}_country`).value,
                    };
                
                    // Merge AddressPayload into the main payload
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
                selectedCardId = addressCard.value;
                console.info('selected card', selectedCardId);

                if(shippingAddressID){
                    shippingAddressID.setValue(selectedCardId);
                }

                if(billingAddressID){
                    billingAddressID.setValue(selectedCardId);
                }                
            },
            fillAddressField(addressCard) {
                let name = addressCard.getAttribute('name');
                let type = name.split('-')[0];
                
                document.getElementById('address-uuid').value = addressCard.dataset.uuid;
                document.getElementById(`${type}-address-search`).value = addressCard.dataset.address;
                document.getElementById(`${type}_address_id`).value = addressCard.value || "";
                document.getElementById(`${type}_address_1`).value = addressCard.dataset.address_1 || "";
                document.getElementById(`${type}_address_2`).value = addressCard.dataset.address_2 || "";
                document.getElementById(`${type}_suburb`).value = addressCard.dataset.suburb || "";
                document.getElementById(`${type}_state`).value = addressCard.dataset.state || "";
                document.getElementById(`${type}_postcode`).value = addressCard.dataset.postcode || "";
                document.getElementById(`${type}_country`).value = addressCard.dataset.country || "";
            },        
            async addressSubmit() {
                let isValid = await App.validation.validateForm(addressFormModal);
                console.log('isValid',isValid);
                if(isValid){
                    let url = '/v1/contacts/addresses' ;
                    let payload = {
                            "contact_uuid": contactUuid, //REQUIRED
                            "address_label": shipping_address_1.value, //REQUIRED
                            "default_address": false,
                            "address_1": shipping_address_1.value,
                            "address_2": shipping_address_2.value,
                            "suburb": shipping_suburb.value,
                            "state": shipping_state.value,
                            "country": shipping_country.value,
                            "postcode": shipping_postcode.value,
                            "geojson": {
                                "type": "Point",
                                "coordinates": [parseFloat(shipping_latitude.value), parseFloat(shipping_longitude.value)]
                            },
                            "latitude": shipping_latitude.value,
                            "longitude": shipping_longitude.value
                        }
                    let response = await apiServices.processRequest('post',url,payload,undefined,'/core/api');
                    if(response.state && response.data.items.id) {            
                        addressFormModal.close();
                        App.events.notyf("success", "Address added successfully.");                        
                        addressCards.insertAdjacentHTML('afterbegin', Checkout.methods.createAddressCard(response.data.items));

                        //Select the newly added card                        
                        Checkout.events.selectAddressCard(
                            document.querySelector(`ins-checkbox-card[value="${response.data.items.id}"]`)
                        );                          

                        // Reset value to blank
                        [
                            'shipping_longitude',
                            'shipping_latitude',
                            'shipping_address_1',
                            'shipping_address_2',
                            'shipping_suburb',
                            'shipping_state',
                            'shipping_postcode',
                            'shipping_country'
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
                selectedCardId = null;
            },
            clearAddressField(btnAddress){
                let name = btnAddress.getAttribute('name');
                let type = name.split('-')[0];

                document.getElementById(`${type}-address-search`).value = "";
                document.getElementById(`${type}_address_id`).value = "";
                document.getElementById(`${type}_address_1`).value = "";
                document.getElementById(`${type}_address_2`).value = "";
                document.getElementById(`${type}_suburb`).value = "";
                document.getElementById(`${type}_state`).value = "";
                document.getElementById(`${type}_postcode`).value = "";
                document.getElementById(`${type}_country`).value = "";
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
            },
            initAddressListener() {
                if(addAddressBtn && addressCancelBtn && addressSubmitBtn) {
                    console.log('initAddressListener');
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
                        console.log('virtualContactSubmitBtn');
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
