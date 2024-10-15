
let pageBaseUrl = "";
let selectCatergory = "";
let productFilter = {
    "page": "1",
    "per_page": "9",
    "keyword": "",
    "sub_category": "",
    "sort": ""
};

let subCatContElem = document.getElementById("sub-categories");
let keywordInput = document.getElementById("filter-keyword");

let productList = (function () {
    return {
        methods: {
            initBaseURL(){
                pageBaseUrl = "/products";
                //pageBaseUrl = window.location.pathname;
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
            initSubCategoryFilter(){
                //Add click event on sub-category when subcategory are present
                let subElem = subCatContElem.getElementsByClassName("sub-cat");
                for (var i = 0; i < subElem.length; i++) {
                    subElem[i].addEventListener('click', productList.methods.changeSubCategory, false);
                }
            },
            initSearchInterface(){

                let catSelect = document.getElementById('categorySelect');
                if(catSelect){
                    catSelect.addEventListener('insValueChange', productList.methods.categoryValueSelected);
                }

                if(keywordInput){
                    keywordInput.addEventListener('insInput', productList.methods.keywordInputEvent);
                    keywordInput.addEventListener('insIconClick', productList.methods.keywordInputEvent);
                }

            },
            categoryValueSelected(event){
                //just place selected category of search
                selectCatergory = event.detail;                
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
                    } else {
                        prodContainer.classList.remove('medium-up-3');
                        prodContainer.classList.remove('small-up-1');
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
            changeSubCategory(event){
                //When a sub category is clicked
                let subElem = subCatContElem.getElementsByClassName("sub-cat");
                let targetId = event.target.id;
                let subCatTmp = targetId.replace('sub-', '');

                if(!productFilter.sub_category.includes(subCatTmp)){
                    for(let a = 0; a < subElem.length; a++){
                        subElem[a].classList.remove('active');
                    };
                    document.getElementById(targetId).classList.add('active');
                    productFilter.sub_category = subCatTmp;

                    window.location.href = productList.methods.buildURLLink();
                }
            },
            clearFilterToList(){
                productFilter.page = "1";

                productFilter.keyword = "";
                productFilter.sub_category = "";
                productFilter.sort = "";

                //keywordInput.value = "";
                
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
            previousButtonClick(event){
                //Function for pagination previous button click event
                let tmpPage = Number(productFilter.page);
                tmpPage--;
                productFilter.page = tmpPage.toString();

                window.location.href = productList.methods.buildURLLink();
            },
            nextButtonClick(event){
                //Function for pagination next button click event
                let tmpPage = Number(productFilter.page);
                tmpPage++;
                productFilter.page = tmpPage.toString();
                
                window.location.href = productList.methods.buildURLLink();
            },
            pageSizeValueSelected(event){
                //Function for pagination page size selected event
                let tmpVal = event.detail;
                productFilter.per_page = tmpVal;
                productFilter.page = 1;

                window.location.href = productList.methods.buildURLLink();
            },
            openMobileFilterDrawer(event){
                let mobileFilterDrawer = document.getElementById('mobile-filter-drawer');
                if(mobileFilterDrawer){
                    mobileFilterDrawer.setDrawerState(true);
                }
            },
            closeMobileFilterDrawer(event){
                let mobileFilterDrawer = document.getElementById('mobile-filter-drawer');
                if(mobileFilterDrawer){
                    mobileFilterDrawer.setDrawerState(false);
                }
            },
            keywordInputEvent(event){
                if (event.detail.keyCode === 13){
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
                //notyf.success('Your changes have been successfully saved!');
            },
            initFilterListeners(){
                //Initialize category and search interface
                if(subCatContElem){
                    productList.methods.initSubCategoryFilter();
                }
                productList.methods.initSearchInterface();
            },
            initProductListInterface() {
                let viewGridBtn = document.getElementById('view-grid-btn');
                let viewListBtn = document.getElementById('view-list-btn');
                if(viewListBtn && viewGridBtn){
                    //let emailInput = document.getElementById('email');
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

                let previousBtn = document.getElementById('previousPage');
                if(previousBtn){
                    previousBtn.addEventListener('insClick', productList.methods.previousButtonClick);
                }
                let nextBtn = document.getElementById('nextPage');
                if(nextBtn){
                    nextBtn.addEventListener('insClick', productList.methods.nextButtonClick);
                }

                let pageSizeSelect = document.getElementById('page-size-select');
                if(pageSizeSelect){
                    pageSizeSelect.addEventListener('insValueChange', productList.methods.pageSizeValueSelected);
                }

                let mobileFilterToggle = document.getElementById('mobile-filter-button');
                if(mobileFilterToggle){
                    mobileFilterToggle.addEventListener('insClick', productList.methods.openMobileFilterDrawer);
                }
                let mobileFilterClose = document.getElementById('mobile-filter-cls');
                if(mobileFilterClose){
                    mobileFilterClose.addEventListener('insClick', productList.methods.closeMobileFilterDrawer);
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