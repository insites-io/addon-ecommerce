/** 
 * Checkout - Scripts / Functions
 * */
const checkoutNavigationEl = document.getElementById('checkout-nav');
const checkoutBtnNavigation = Array.from(document.getElementsByClassName('checkout-step-btn'));

let CheckoutSteps = (function () {
    return {
        validation: {
            validateAddress(currentStep) {
                let container = currentStep.querySelectorAll('.validate-address');
                if(container) {
                    container.forEach(block => {
                        let addressValid = block.querySelectorAll(".address-fields[required] .is-invalid");
                        if (addressValid.length > 0) {
                            block.querySelector('.error-message').classList.remove('hide');
                            CheckoutSteps.events.addressCardsHasError(block, true);
                        } else {
                            block.querySelector('.error-message').classList.add('hide');
                            CheckoutSteps.events.addressCardsHasError(block, false);
                        }
                    });
                }
            },
            validateCreditCard(currentStep) {
                let cardValid = currentStep.querySelectorAll(".card-fields[required] .is-invalid");
                let container = currentStep.querySelector('.validate-credit-card');
                if (container) {
                    if (cardValid && cardValid.length > 0) {
                        container.querySelector('.error-message').classList.remove('hide');
                        CheckoutSteps.events.creditCardsHasError(container, true);
                    } else {
                        container.querySelector('.error-message').classList.add('hide');
                        CheckoutSteps.events.creditCardsHasError(container, false);
                    }
                }
            },
            validateStepper() {
                let steps = document.querySelectorAll("[id$=-details]");
                    steps.forEach(step => {
                        let hasError = step.querySelectorAll('.is-invalid').length;
                        let selector = step.getAttribute('id');
                        checkoutNavigationEl.querySelector(`[content=${selector}]`)
                            .hasError = hasError > 0;
                    })
            },
            validateTelField(currentStep) {
                let isTel = /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/g;
                let telFields = currentStep.querySelectorAll("[field='tel']");
                    telFields.forEach(field => {
                        if(field.required) {
                            if (field.value && isTel.test(field.value) === true) {
                                field.hasError = false;
                            } else
                                field.hasError = true;
                        } else {
                            if(field.value.trim() === "") 
                                field.hasError = false;
                            else 
                                field.hasError = !isTel.test(field.value) === true;
                        }
                    });
            },
            validatePasswordField(field){
                if (field.value) {
                    if((field.value.length >= 6)){
                        field.hasError = false;
                    } else {
                        field.hasError = true;
                        field.errorMessage = "Minimum of 6 characters";
                    }
                } else {
                    field.hasError = true;
                    field.errorMessage = "Password is required";
                }
            },
            validatePasswordConfirm(field){
                let passFields = document.getElementById('password');
                if(passFields){
                    if(passFields.value === field.value){
                        field.hasError = false;
                    } else {                        
                        field.hasError = true;
                        field.errorMessage = "Password doesn't match";
                    }
                } 
            },
            async validationForm(containerEl) {
                for (let index = 0; index < containerEl.querySelectorAll('[validate]').length; index++) {
                    let field = containerEl.querySelectorAll('[validate]')[index];
                    let type = field.tagName.toLowerCase();
                    switch (type) {
                        case 'div':
                            App.validation.validateRadio(field);
                            break;
                        case 'ins-input-file':
                            App.validation.validateFile(field);
                            break;
                        case 'ins-textarea':
                            App.validation.validateInput(field.querySelector('textarea'));
                            break
                        case 'ins-input':
                        default:
                            if(field.field === 'password'){
                                if(field.id === 'password_confirmation'){
                                    this.validatePasswordConfirm(field);
                                } else {
                                    this.validatePasswordField(field);
                                }
                            } else if(field.field === 'email'){
                                App.validation.validateEmail(field);
                            } else{
                                App.validation.validateInput(field);
                            }
                            break;
                    }
                }
                return App.validation.checkInvalidFields(containerEl);
            }
        },
        methods: {
            validateStep(event) {
                if(event) {
                    let currentStep = event.currentStep.description.split(' ')[0].toLowerCase() + '-details';
                        currentStep = document.getElementById(currentStep);
                    if(event.currentStep.dataset.step > event.nextStep.dataset.step) {
                        // go back to previous step
                        let nextStep = event.nextStep.description.split(' ')[0].toLowerCase() + '-details';
                            nextStep = document.getElementById(nextStep);
                        CheckoutSteps.events.goToPreviousStep(event, currentStep, nextStep);
                    } else {
                        // validate fields before navigate to next step
                        this.nextStepHandler(event, currentStep)
                        
                    }
                }
            },
            nextStepHandler(event, currentStep) {
                let nextStep = checkoutNavigationEl
                    .querySelector(`ins-step[data-step="${parseInt(event.currentStep.dataset.step)+1}"]`);
                    event.nextStep = nextStep; // change event "next step"
                    nextStep = nextStep.description.split(' ')[0].toLowerCase() + '-details';
                    if(nextStep === 'shipping-details' && 
                        sameShippingDetailsBtn && sameShippingDetailsBtn.checked) {
                        Checkout.methods.updateShippingDetails(true); 
                    }
                    nextStep = document.getElementById(nextStep);
                
                CheckoutSteps.events.validateStepFields(event, currentStep, nextStep);
            }
        },
        events: {
            async validateStepFields(event, currentStep, nextStep) {
                CheckoutSteps.validation.validateTelField(currentStep);
                let valid = await App.validation.validateForm(currentStep);
                CheckoutSteps.validation.validateAddress(currentStep);
                CheckoutSteps.validation.validateCreditCard(currentStep);
                if (valid) {
                    CheckoutSteps.events.goToNextStep(event, currentStep, nextStep);
                } else {
                    CheckoutSteps.events.incompleteStep(event);
                }
            },
            btnNavigateStep(event) {
                let step = parseInt(event) ;
                if (typeof step === 'number' && step >=0 && step <= 2) {
                    checkoutNavigationEl.querySelectorAll('.ins-step')[step].click();
                    window.scrollTo({ top: 130, behavior: 'smooth'});
                }
            },
            goToPreviousStep(event, currentStep, nextStep) {
                event.currentStep.active = false;
                event.currentStep.hasError = event.currentStep.hasError;
                event.currentStep.complete = event.currentStep.complete;
                event.nextStep.active = true;
                currentStep.classList.add('hide');
                nextStep.classList.remove('hide');
            },
            goToNextStep(event, currentStep, nextStep) {
                event.currentStep.active = false;
                event.currentStep.hasError = false;
                event.currentStep.complete = true;
                event.nextStep.active = true;
                currentStep.classList.add('hide');
                nextStep.classList.remove('hide');
            },
            incompleteStep(event) {
                event.currentStep.hasError = true;
                App.events.notyf("error", "Please check missing fields");
            },
            addressCardsHasError(step, error) {
                step.querySelectorAll('.address-options ins-checkbox-card')
                    .forEach(element => {
                        error 
                            ? element.classList.add('is-invalid')
                            : element.classList.remove('is-invalid')
                    });
            },
            creditCardsHasError(step, error) {
                step.querySelectorAll('.card-options ins-credit-card')
                    .forEach(element => {
                        error
                            ? element.classList.add('is-invalid')
                            : element.classList.remove('is-invalid')
                    });
            },
            async validateOrderPassword(event){
                event ? event.preventDefault(): '';
                //Get id and element to identify the kind of form submitted
                let formId = event.target.id;
                let formElem = document.getElementById(formId);
                // Check what form is being validated...
                if(await CheckoutSteps.validation.validationForm(formElem)){
                    formElem.submit();
                } else {
                    let setPWBtn = document.getElementById('checkout-set-pw');
                    setPWBtn.loading = false;
                }
            }
        },
        init: {
            initNavigation() {
                if (checkoutNavigationEl) {
                    checkoutNavigationEl.addEventListener('insClick', (event) => {
                        CheckoutSteps.methods.validateStep(event.detail);
                    });
                }
                if (checkoutBtnNavigation && checkoutNavigationEl) {
                    checkoutBtnNavigation.forEach(btn => {
                        btn.addEventListener('insClick', (event) => {
                            CheckoutSteps.events.btnNavigateStep(event.detail.data);
                        })
                    });
                }
            }
        }
    }
})();

// Initialize on window load
//window.CheckoutSteps = CheckoutSteps;

// Set timeout, make sure INS components has been loaded
setTimeout(() => {
    CheckoutSteps.init.initNavigation();
}, 200);