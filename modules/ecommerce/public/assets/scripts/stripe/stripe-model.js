let StripeModel = (() => {
    return {
        creditcard: {
            async createCreditCard(data) {
                let payload = {
                    "email": data.email,
                    "stripe_credit_card": data.creditcard,
                    "card_brand": data.card_brand
                }
                let response = await StripeServices.createCreditCard({ 'payload': payload });
                if(response.state) {                    
                    if(response.data.is_new_user === true){
                        // A new user account is created when a guest user adds a credit card.
                        // Reload the page to reflect the changes on the user's end.
                        let url = new URL(window.location.href);
                        url.searchParams.set("is_new_user", true);
                        window.location.href = url.toString();
                    } 
                    return response;
                } else {
                    App.events.notyf('error', "Failed to create creditcard");
                    return response;
                }
            },
            async removeCreditCard(id) {
                let payload = {
                    id: id,
                    properties: { is_enabled: false }
                }
                let response = await StripeServices.deleteCreditCard({ payload });
                if (response.state) {
                    return response;
                } else {
                    App.events.notyf('error', "Failed to delete creditcard");
                    return response;
                }
            }
        },
        customer: {

        }
    }
})();

window.StripeModel = StripeModel;