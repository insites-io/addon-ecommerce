let emailInputInfo =  {
    status: 'clean',
    id: null
}

let LoginScript = (function () {
    return {
        methods: {
            validateTelField() {
                //Function to validate telephone input fields
                let isTel = /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/g;
                let telFields = document.querySelectorAll("[field='tel']");
                telFields.forEach(field => {
                    if (field.required) {
                        if (field.value && isTel.test(field.value) === true) {
                            field.hasError = false;
                        } else
                            field.hasError = true;
                    } else {
                        if (field.value.trim() === "") {
                            field.hasError = false;
                        } else {
                            field.hasError = !isTel.test(field.value) === true;
                        }
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
            },
            async validateForm(event) {
                event ? event.preventDefault(): '';
                //Get id and element to identify the kind of form submitted
                let formId = event.target.id;
                let formElem = document.getElementById(formId);
                // Check what form is being validated...
                if(formId == 'sign-up-form'){
                    //Validation for Sign Up Form
                    this.validateTelField();
                    if(await this.validationForm(formElem)){
                        switch(emailInputInfo.status){
                            case 'clean':{ //email is clean
                                formElem.submit();
                            }break;
                            case 'update':{ //email 'update'
                                this.changeFormToAppend(formElem, emailInputInfo.id);
                                formElem.submit();
                            }break;
                            case 'error':{ //email is used
                                let emailElem = document.getElementById('email');
                                emailElem.hasError = true;
                                emailElem.errorMessage = "Email has already been used.";    
                            }break;
                        }
                    }
                } else if (formId == 'password-reset-form'){
                    if(await this.validationForm(formElem)){
                        formElem.submit();
                    }

                } else {
                    //Validation for other forms
                    if(await App.validation.validateForm(formElem)){
                        formElem.submit();
                    }
                }
            },
            async checkSignUpUserEmail(event){ 
                // Attached to the eventlistener
                let emailInput = document.getElementById('email');
                let varEmail = document.getElementById('email').value
                if(App.validation.validateEmail(emailInput)){
                    let url = '/check_user_email_signup.json?'+ 'email='+ varEmail ;
                    let response = await apiServices.processRequest('get', url);
                    if(response.state && response.data.items) {
                        //Check / Handle if user exist
                        LoginScript.methods.checkUserEmail(emailInput, response.data.items);
                    } 
                }
            },
            checkUserEmail(emailElem, data){
                if(data.total_entries > 0){
                    if(data.results[0].profiles){
                        let ind = null;
                        let lengProfile = data.results[0].profiles.length;
                        //For loop lighter than findIndex
                        for(let a = 0; a < lengProfile; a++){
                            if(data.results[0].profiles[a].profile_type == "modules/ecommerce/customer"){
                                ind = a;
                                break;
                            }
                        }
                        if(ind != null){
                            //Profile in account is already existing (Active / Inactive)
                            emailElem.hasError = true;
                            emailElem.errorMessage = "Email has already been used.";
                            this.updateEmailInputInfo('error');
                        } else {
                            emailElem.hasError = false;
                            this.updateEmailInputInfo('update', data.results[0].id);
                        }
                    } else {
                        emailElem.hasError = false;
                        this.updateEmailInputInfo('update', data.results[0].id);
                    }
                } else {
                    // New email
                    emailElem.hasError = false;
                    this.updateEmailInputInfo('clean');
                }
            },
            changeFormToAppend(formElement, id){
                let tmpInput = document.createElement("input");
                tmpInput.name = "_method";
                tmpInput.type = "hidden";
                tmpInput.value = "patch"
                formElement.appendChild(tmpInput);
                let tmpSrc = formElement.querySelector('input[name="resource_id"]');
                tmpSrc.value = id;
                formElement.action = '/api/users/' + id;
            },
            updateEmailInputInfo(status, id = null){
                emailInputInfo.status = status;
                emailInputInfo.id = id;
            }
        },
        init: {
            //Initialise form if signup (only applies to sign up)
            initSignUp() {
                let elem = document.getElementById('sign-up-form');
                if(elem){
                    let emailInput = document.getElementById('email');
                    emailInput.addEventListener('insBlur', LoginScript.methods.checkSignUpUserEmail);
                } 
            }
        }
    }
})();

setTimeout(() => {
    LoginScript.init.initSignUp();
}, 200);