
let pageBaseUrl = "";
let selectCatergory = "";
let productFilter = {
    "page": "1",
    "per_page": "9",
    "keyword": "",
    "sub_category": "",
    "sort": ""
};

let subCatContElem = document.getElementById("sidebar-categories");
let keywordInput = document.getElementById("filter-keyword");

let productList = (function () {
    return {
        methods: {
            initBaseURL(){
                pageBaseUrl = "/products";
            },
            initFilterValues(){
                //Get all params and set params value
                let query = window.location.search.substring(1);
                let vars = query.split("&");
                for(var i=0;i<vars.length;i++){
                    let pair = vars[i].split("=");
                    productFilter[pair[0]] = pair[1];
                }
                let slugs = window.location.pathname.split("/");
                if(slugs.length >= 3){
                    selectCatergory = slugs[2];
                } else {
                    selectCatergory = "";
                }
                productList.methods.putFilterValues();
            },
            initSearchInterface(){
                if(keywordInput){
                    keywordInput.addEventListener('insInput', productList.methods.keywordInputEvent);
                    keywordInput.addEventListener('insIconClick', function(event) {
                        productList.methods.keywordInputEvent(event, 'iconClick');
                    });
                }

            },
            putFilterValues(){
                if(productFilter.keyword != ""){
                    keywordInput.value = decodeURI(productFilter.keyword);
                }
                if(productFilter.sub_category != ""){
                    let tmpId = "sub-" + productFilter.sub_category;
                    document.getElementById(tmpId).classList.add('active');
                }
            },
            toggleProductView(e){
                //Function to toggle view of products
                let btnId = e.target.id;
                let btnElem = document.getElementById(btnId);

                let prodContainer = document.getElementById('product-grid');
                if(prodContainer){
                    document.getElementById('view-grid-btn').classList.remove('active');
                    document.getElementById('view-list-btn').classList.remove('active');
                    btnElem.classList.add('active');
                    if(btnId == 'view-grid-btn'){
                        prodContainer.classList.add('medium-up-3');
                        prodContainer.classList.add('small-up-1');
                        prodContainer.classList.remove('list-view'); 
                    } else {
                        prodContainer.classList.remove('medium-up-3');
                        prodContainer.classList.remove('small-up-1');
                        prodContainer.classList.add('list-view'); 
                    }
                }
            },
            brandValueSelected(event){
                //Filter by brand
                let tmpVal = event.detail;
                productFilter.brand = tmpVal;

                window.location.href = productList.methods.buildURLLink();
            },
            showValueSelected(event){
                //Show: All, Sale, or In-stock
                let tmpVal = event.detail;
                productFilter.show = tmpVal;

                window.location.href = productList.methods.buildURLLink();
            },
            sortValueSelected(event){
                //Function to update sort of products
                let tmpVal = event.detail;
                productFilter.sort = tmpVal;
                window.location.href = productList.methods.buildURLLink();
            },
            clearFilterToList(){
                productFilter.page = "1";
                productFilter.keyword = "";
                productFilter.sub_category = "";
                productFilter.sort = "";                
            },
            buildParamlist(){
                //Get all items on the object and buld them as parameters
                let entries = Object.entries(productFilter);
                let tmpParamArr = [];
                for(let a = 0; a < entries.length; a++){
                    if(entries[a][1] != ""){
                        tmpParamArr.push(entries[a].join('='));
                    }
                }
                let tmpParam = tmpParamArr.join('&');
                return tmpParam;
            },
            buildURLLink(){
                let paramStr = productList.methods.buildParamlist();
                let urlStr = "";
                if(selectCatergory != ''){
                    urlStr = pageBaseUrl + '/' + selectCatergory + "?" + paramStr;
                } else {
                    urlStr = pageBaseUrl + "?" + paramStr;
                }
                return urlStr;
            },
            openMobileFilterDrawer(){
                let mobileFilterDrawer = document.getElementById('mobile-filter-drawer');
                if(mobileFilterDrawer){
                    mobileFilterDrawer.setDrawerState(true);
                }
            },
            keywordInputEvent(event, type){                
                if (event.detail.keyCode === 13 || (type == "iconClick" && event.detail.value != "")){
                    productList.methods.clearFilterToList();
                    productFilter.keyword = event.detail.value;
                    window.location.href = productList.methods.buildURLLink();
                }
            }
        },
        init: {
            initProductList() {
                productList.methods.initBaseURL();
                productList.methods.initFilterValues();
            },
            initFilterListeners(){
                productList.methods.initSearchInterface();
            },
            initProductListInterface() {
                let viewGridBtn = document.getElementById('view-grid-btn');
                let viewListBtn = document.getElementById('view-list-btn');
                if(viewListBtn && viewGridBtn){
                    viewGridBtn.addEventListener('insClick', productList.methods.toggleProductView);
                    viewListBtn.addEventListener('insClick', productList.methods.toggleProductView);
                }

                let brandSelect = document.getElementById('brandSelect');
                if(brandSelect){
                    brandSelect.addEventListener('insChange', productList.methods.brandValueSelected);
                }

                let showSelect = document.getElementById('showSelect');
                if(showSelect){
                    showSelect.addEventListener('insChange', productList.methods.showValueSelected);
                }

                let sortSelect = document.getElementById('sortSelect');
                if(sortSelect){
                    sortSelect.addEventListener('insChange', productList.methods.sortValueSelected);
                }

                
                let mobileCategoryToggle = document.getElementById('mobile-category-button');
                if(mobileCategoryToggle){
                    //let sidebarCategoriesHtml = document.getElementById('sidebar-categories').innerHTML;
                    //console.log("sidebarCategoriesHtml",sidebarCategoriesHtml);
                    // Replace 'id' with 'data'
                    //let modifiedHTML = sidebarCategoriesHtml.replace(/\bid="([^"]+)"/g, 'data="$1"');
                    //console.log("modifiedHTML",modifiedHTML);
                    //let mobileFilterWrap = document.querySelector('#mobile-filter-drawer .wrap');                
                    //mobileFilterWrap.innerHTML = modifiedHTML;
                    mobileCategoryToggle.addEventListener('insClick', productList.methods.openMobileFilterDrawer);
                }
                    
            }
            
        }
    }
})();


setTimeout(() => {
    productList.init.initProductList();
    productList.init.initProductListInterface();
    productList.init.initFilterListeners();
}, 200);