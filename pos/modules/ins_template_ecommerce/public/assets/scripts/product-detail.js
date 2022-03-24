let productInfo = {
    "user_id" : "",
    "quantity" : "",
    "order_id" : "",
    "status" : "",
    "product_id" : "",
    "product_name" : "",
    "product_sku" : "",
    "product_variant" : "",
    "product_price" : "",
    "tax_amount" : "",
    "shipping_amount" : ""
}
let variantList = [];

let productDetail = (function () {
    return {
        methods: {
            async validateForm(event) {
                event ? event.preventDefault(): '';
                //Get id and element to identify the kind of form submitted
                let formId = event.target.id;
                let formElem = document.getElementById(formId);
                // Check what form is being validated...
                if(formId == 'add-to-cart-form'){
                    //Validation for Adding to cart
                    if(await App.validation.validateForm(formElem)){
                       formElem.submit();
                    }
                    else{
                        let varSelect = document.getElementById('variant-list');
                        if(varSelect){
                            varSelect.setAttribute("has-error", "true");
                        }
                    }

                } else {
                    //Validation for other (account type) forms
                    if(await App.validation.validateForm(formElem)){
                        formElem.submit();
                    }
                }
            },
            async productVariantSelected(event){
                //Only used when there is variant
                let eventElement = document.getElementById('variant-list');
                if(eventElement){
                    eventElement.removeAttribute("has-error");
                }

                let varProdIdInput = document.getElementById('prod-det-variant-id');
                if(varProdIdInput){
                    varProdIdInput.value = event.detail.value;
                }

                let varProdListInput = document.getElementById('prod-det-variant');
                if(varProdListInput){
                    varProdListInput.value = event.detail.label;
                }

                if(prodVarList){
                    let ind;
                    for(let a = 0; a < prodVarList.length; a++ ){
                        if(prodVarList[a].id == event.detail.value){
                            ind = a;
                            break;
                        }
                    }
                    
                    if(ind != null){
                        productDetail.methods.setProductDetailsDisplay(prodVarList[ind]);
                        let hasStockPanel = document.getElementById('has-stock-cont');
                        let noStockPanel = document.getElementById('no-stock-cont');

                        if(prodVarList[ind].properties.stock > 0){
                            hasStockPanel.classList.remove('hide');
                            noStockPanel.classList.add('hide');
                        } else {
                            productDetail.methods.setProductDetailOutOfStock(prodVarList[ind], event.detail.label);
                            hasStockPanel.classList.add('hide');
                            noStockPanel.classList.remove('hide');
                        }

                    }

                }
            },
            setProductDetailsDisplay(prodDetail){
                let skuDisplay = document.getElementById('product-sku');
                if(skuDisplay){
                    skuDisplay.innerText = "SKU:" + prodDetail.properties.sku;
                }
                let quantitySteper = document.getElementById('product-quantity');
                if(quantitySteper){
                    quantitySteper.value = 1;
                    quantitySteper.max = prodDetail.properties.stock;
                }
                let varProdQtyInput = document.getElementById('prod-det-quantity');
                if(varProdQtyInput){
                    varProdQtyInput.value = 1;
                }
                let varProdSkuInput = document.getElementById('prod-det-variant-sku');
                if(varProdSkuInput){
                    varProdSkuInput.value = prodDetail.properties.sku;
                }
                let priceDisplay = document.getElementById('product-price');
                let notPriceDisplay = document.getElementById('not-product-price');
                if(priceDisplay && notPriceDisplay){
                    if(prodDetail.properties.on_sale){
                        priceDisplay.innerText = "$" + prodDetail.properties.sale_price;
                        notPriceDisplay.innerText = "$" + prodDetail.properties.regular_price;
                    } else {
                        priceDisplay.innerText = "$" + prodDetail.properties.regular_price;
                        notPriceDisplay.innerText = "";
                    }
                }

                // let imageVariant = document.getElementById('image-variant');
                // // let imageValue = document.getElementById('imageValue');
                // let imageValue = document.querySelector('.variant-gallery');
                // let mainGallery = document.querySelector('.main-gallery');
                // if (imageVariant) {
                //     // console.log(prodDetail, 'details');
                //     var image = prodDetail.gallery_1[0].file.url;
                //     // imageValue.src = image;
                //     imageValue.setAttribute('thumbnail', image);
                //     imageValue.setAttribute('image', image);
                //     imageVariant.classList.remove('hidden-gallery');
                //     mainGallery.classList.add('hidden-gallery');
                // } else {
                //     imageVariant.classList.add('hidden-gallery');
                //     mainGallery.classList.remove('hidden-gallery');
                // }
            },
            setProductDetailOutOfStock(prodDetail, value){
                let prodVarNotify = document.getElementById('prod-variant');
                if(prodVarNotify){
                    prodVarNotify.value = value;
                }
            },
            productQuantitySelected(event){
                let varProdQtyInput = document.getElementById('prod-det-quantity');
                if(varProdQtyInput){
                    varProdQtyInput.value = event.detail;
                }
            },
            buyNowButtonClicked(event){
                let redirectInput = document.getElementById('redirect-input');
                if(redirectInput){
                    redirectInput.value = "/shopping-cart";
                }

            }

        },
        init: {
            initProductDetailInterface(){
                let variantSelect = document.getElementById('variant-list');
                if(variantSelect){
                    variantSelect.addEventListener('insSelectOptionClicked', productDetail.methods.productVariantSelected);
                }

                let quantitySteper = document.getElementById('product-quantity');
                if(quantitySteper){
                    quantitySteper.addEventListener('insValueChange', productDetail.methods.productQuantitySelected);
                }

                let buyNowBtn = document.getElementById('buy-now-btn');
                if(buyNowBtn){
                    buyNowBtn.addEventListener('insClick', productDetail.methods.buyNowButtonClicked);
                }
            }
            
        }
    }
})();


setTimeout(() => {
    productDetail.init.initProductDetailInterface();
}, 200);