
let pageBaseUrl = "";
let selectCatergory = "";
let productFilter = {
    "page": "1",
    "per_page": "9",
    "keyword": "",
    "sub_category": "",
    "sort": ""
};

let keywordInput = document.getElementById("filter-keyword");

// Guards against re-entrancy while product-list.js programmatically (re)sets ins-checkbox states.
let isSyncing = false;

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
                    productList.methods.initSearchClear();

                    // Predictive (typeahead) suggestions dropdown
                    if (window.PredictiveSearch) {
                        window.PredictiveSearch.init(keywordInput);
                    }
                }
            },
            initSearchClear(){
                const initClear = () => {
                    const inputEl   = keywordInput.getElementsByTagName('input')[0];
                    const inputWrap = keywordInput.querySelector('.input-wrap');
                    const iconEl    = keywordInput.querySelector('.icon-search1') || keywordInput.querySelector('.icon-search-1') || keywordInput.querySelector('.icon-search');

                    if (!inputEl || !inputWrap) return false;

                    let closeIcon = null;

                    const showClose = () => {
                        if (closeIcon) return;
                        closeIcon = document.createElement('i');
                        closeIcon.classList.add('icon-close-1', 'icon-wrap', 'icon-close-active', 'icon-close-style');
                        inputWrap.insertBefore(closeIcon, iconEl || null);
                    };

                    const hideClose = () => {
                        if (!closeIcon) return;
                        closeIcon.remove();
                        closeIcon = null;
                    };

                    if (inputEl.value.trim()) showClose();

                    inputEl.addEventListener('input', () => {
                        inputEl.value.trim() ? showClose() : hideClose();
                    });

                    keywordInput.addEventListener('click', (e) => {
                        if (!e.target.classList.contains('icon-close-1')) return;
                        inputEl.value = '';
                        hideClose();
                        if (window.PredictiveSearch) window.PredictiveSearch.close();
                        if (productFilter.keyword) {
                            productList.methods.clearFilterToList();
                            productList.methods.applyFilters();
                        }
                    });

                    return true;
                };

                if (!initClear()) {
                    const observer = new MutationObserver(() => {
                        if (initClear()) observer.disconnect();
                    });
                    observer.observe(keywordInput, { childList: true, subtree: true });
                }
            },
            putFilterValues(){
                if(productFilter.keyword != ""){
                    keywordInput.value = decodeURI(productFilter.keyword);
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

                // Reset to page 1
                productFilter.page = "1";

                productList.methods.applyFilters();
            },
            showValueSelected(event){
                //Show: All, Sale, or In-stock
                let tmpVal = event.detail;
                productFilter.show = tmpVal;

                // Reset to page 1
                productFilter.page = "1";

                productList.methods.applyFilters();
            },
            sortValueSelected(event){
                //Function to update sort of products
                let tmpVal = event.detail;
                productFilter.sort = tmpVal;

                // Reset to page 1
                productFilter.page = "1";
                
                productList.methods.applyFilters();
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
                    if(entries[a][0] != "" && entries[a][1] != ""){
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
            // ---------- AJAX list (load only the grid, not the whole page) ----------
            buildSkeleton(count){
                let card = '<div class="cell">'
                    + '<div class="product-card-skeleton">'
                    + '<div class="sk-image"></div>'
                    + '<div class="sk-line sk-title"></div>'
                    + '<div class="sk-line sk-cat"></div>'
                    + '<div class="sk-line sk-price"></div>'
                    + '<div class="sk-btn"></div>'
                    + '</div></div>';
                let cells = '';
                for(let i = 0; i < count; i++){ cells += card; }
                return cells;
            },
            applyFilters(){
                let grid = document.getElementById('product-grid');
                // Pretty URL for the address bar (path-based category + query params).
                let listUrl = productList.methods.buildURLLink();

                // Re-derive sidebar controls + the Applied filters panel from current state.
                productList.methods.syncSidebarState();

                // No grid on the page (or fetch unsupported) — fall back to a full navigation.
                if(!grid || typeof fetch === 'undefined'){
                    window.location.href = listUrl;
                    return;
                }

                // The API reads the same params the page does; the path category is sent as ?slug2=.
                let query = productList.methods.buildParamlist();
                if(selectCatergory){
                    query += (query ? '&' : '') + 'slug2=' + encodeURIComponent(selectCatergory);
                }

                let count = parseInt(productFilter.per_page, 10) || 9;
                let scrollTarget = grid.getBoundingClientRect().top + window.pageYOffset - 120;
                grid.innerHTML = productList.methods.buildSkeleton(count);
                window.scrollTo({ top: scrollTarget < 0 ? 0 : scrollTarget, behavior: 'smooth' });

                fetch('/api/products/list-results?' + query)
                    .then(function(response){ return response.json(); })
                    .then(function(data){
                        grid.innerHTML = data.html;

                        let table = document.getElementById('insBaseTable');
                        if(table){
                            table.totalCount = data.totalCount;
                            table.pageNumber = data.pageNumber;
                            table.pageSize = data.pageSize;
                        }

                        let countEl = document.querySelector('[data-product-count]');
                        if(countEl){
                            countEl.textContent = data.totalCount + (data.totalCount === 1 ? ' product' : ' products');
                        }

                        history.pushState({ ajax: true }, '', listUrl);

                        // Re-bind add-to-cart / card-click on the freshly injected cards.
                        if(window.initProductCardInteractions){ window.initProductCardInteractions(); }
                    })
                    .catch(function(){
                        // On any failure, fall back to a normal page load so the user still gets results.
                        window.location.href = listUrl;
                    });
            },
            initPagination(){
                let table = document.getElementById('insBaseTable');
                if(!table) return;
                table.addEventListener('insPaginationChange', function(event){
                    productFilter.page = event.detail.pageNumber;
                    productFilter.per_page = event.detail.pageSize;
                    productList.methods.applyFilters();
                });
            },
            // ---------- Advanced sidebar filters (multi-select) ----------
            getList(key){
                let raw = productFilter[key];
                if(!raw) return [];
                return raw.split(',').filter(Boolean).map(function(v){ return decodeURIComponent(v); });
            },
            setList(key, arr){
                if(!arr || arr.length === 0){
                    productFilter[key] = "";
                } else {
                    productFilter[key] = arr.map(function(v){ return encodeURIComponent(v); }).join(',');
                }
            },
            toggleFilterValue(key, value){
                let list = productList.methods.getList(key);
                let idx = list.indexOf(value);
                if(idx >= 0){ list.splice(idx, 1); } else { list.push(value); }
                productList.methods.setList(key, list);
                productFilter.page = "1";
                productList.methods.applyFilters();
            },
            toggleCategorySelection(el, checked){
                let list = productList.methods.getList('categories');
                let add = function(v){ if(list.indexOf(v) < 0){ list.push(v); } };
                let remove = function(v){ let i = list.indexOf(v); if(i >= 0){ list.splice(i, 1); } };
                let item = el.closest('.filter-cat-item');

                if(el.hasAttribute('data-cat-parent')){
                    // Parent cascades to all of its subcategories.
                    let values = [el.getAttribute('value')];
                    if(item){
                        item.querySelectorAll('.filter-subcats [data-filter="categories"]').forEach(function(child){
                            values.push(child.getAttribute('value'));
                        });
                    }
                    values.forEach(checked ? add : remove);
                } else {
                    // Subcategory toggles itself, then keeps its parent's state in sync:
                    // parent is selected only when every subcategory is selected.
                    checked ? add(el.getAttribute('value')) : remove(el.getAttribute('value'));
                    let parent = item ? item.querySelector('[data-cat-parent]') : null;
                    if(parent){
                        let children = item.querySelectorAll('.filter-subcats [data-filter="categories"]');
                        let allSelected = children.length > 0 && Array.prototype.every.call(children, function(child){
                            return list.indexOf(child.getAttribute('value')) >= 0;
                        });
                        allSelected ? add(parent.getAttribute('value')) : remove(parent.getAttribute('value'));
                    }
                }

                productList.methods.setList('categories', list);
                productFilter.page = "1";
                productList.methods.applyFilters();
            },
            removeCategoryValue(value){
                // Removing a category chip mirrors the sidebar cascade: a parent also clears its
                // subcategories; a subcategory also clears its (no-longer-complete) parent.
                let list = productList.methods.getList('categories');
                let remove = function(v){ let i = list.indexOf(v); if(i >= 0){ list.splice(i, 1); } };
                let el = null;
                document.querySelectorAll('.sidebar-filter [data-filter="categories"]').forEach(function(b){
                    if(!el && b.getAttribute('value') === value){ el = b; }
                });
                remove(value);
                if(el){
                    let item = el.closest('.filter-cat-item');
                    if(el.hasAttribute('data-cat-parent')){
                        if(item){
                            item.querySelectorAll('.filter-subcats [data-filter="categories"]').forEach(function(child){
                                remove(child.getAttribute('value'));
                            });
                        }
                    } else {
                        let parent = item ? item.querySelector('[data-cat-parent]') : null;
                        if(parent){ remove(parent.getAttribute('value')); }
                    }
                }
                productList.methods.setList('categories', list);
                productFilter.page = "1";
                productList.methods.applyFilters();
            },
            removeFilterValue(key, value){
                let list = productList.methods.getList(key);
                let idx = list.indexOf(value);
                if(idx >= 0){ list.splice(idx, 1); }
                productList.methods.setList(key, list);
                productFilter.page = "1";
                productList.methods.applyFilters();
            },
            removeCategoryFilter(){
                delete productFilter.category;
                selectCatergory = "";
                productFilter.page = "1";
                productList.methods.applyFilters();
            },
            clearAllFilters(){
                // Reset every filter/search/category, then reload just the list.
                selectCatergory = "";
                productFilter = {
                    "page": "1",
                    "per_page": productFilter.per_page || "9",
                    "keyword": "",
                    "sub_category": "",
                    "sort": ""
                };
                productList.methods.applyFilters();
            },
            clearGroup(group){
                // Clear only one filter group's selection (its "Clear" link).
                if(group === 'categories'){
                    productList.methods.selectAllCategories();
                    return;
                }
                productList.methods.setList(group, []);
                productFilter.page = "1";
                productList.methods.applyFilters();
            },
            setInsChecked(el, val){
                // ins-checkbox keeps state on a property + an inner <input>; set both (and the
                // attribute) so the visual updates without re-rendering the sidebar. Skip when
                // already in the desired state to avoid spurious component events.
                if(!el) return;
                if(el.checked !== val){ el.checked = val; }
                let inner = el.querySelector('input');
                if(inner && inner.checked !== val){ inner.checked = val; }
                if(val){
                    if(!el.hasAttribute('checked')){ el.setAttribute('checked', ''); }
                } else if(el.hasAttribute('checked')){
                    el.removeAttribute('checked');
                }
            },
            syncAllCategoryCheckbox(){
                // "All products" is ticked only when no category is active.
                let hasCategory = productList.methods.getList('categories').length > 0
                    || (selectCatergory && selectCatergory !== '')
                    || (productFilter.category && productFilter.category !== '');
                document.querySelectorAll('.sidebar-filter [data-cat-all]').forEach(function(box){
                    productList.methods.setInsChecked(box, !hasCategory);
                });
            },
            selectAllCategories(){
                // Clear every category selection (path, single and multi). Checkbox states are
                // re-derived centrally in syncSidebarState() (via applyFilters).
                selectCatergory = "";
                delete productFilter.category;
                productList.methods.setList('categories', []);
                productFilter.page = "1";
                productList.methods.applyFilters();
            },
            // ---------- Live sidebar state (Applied filters + control sync) ----------
            escHtml(s){
                return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            },
            escAttr(s){
                return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
            },
            categoryLabelMap(){
                // Read value->label and child->[parent values] from the (static) sidebar DOM.
                let labelOf = {};
                let parentsOf = {};
                let sb = document.querySelector('.sidebar-filter');
                if(sb){
                    sb.querySelectorAll('[data-filter="categories"]:not([data-cat-all])').forEach(function(box){
                        let v = box.getAttribute('value');
                        if(!v) return;
                        if(!labelOf[v]){ labelOf[v] = box.getAttribute('label') || v; }
                        if(!box.hasAttribute('data-cat-parent')){
                            let item = box.closest('.filter-cat-item');
                            let p = item ? item.querySelector('[data-cat-parent]') : null;
                            if(p){
                                if(!parentsOf[v]){ parentsOf[v] = []; }
                                parentsOf[v].push(p.getAttribute('value'));
                            }
                        }
                    });
                }
                return { labelOf: labelOf, parentsOf: parentsOf };
            },
            buildAppliedChips(){
                // Mirrors the server-rendered chip order: categories, path/single category,
                // brands, price, availability.
                let chips = [];
                let maps = productList.methods.categoryLabelMap();
                let labelOf = maps.labelOf;
                let parentsOf = maps.parentsOf;

                let cats = productList.methods.getList('categories');
                let selected = {};
                cats.forEach(function(s){ selected[s] = true; });
                cats.forEach(function(slug){
                    // Hide a subcategory chip when its parent is also selected.
                    let parents = parentsOf[slug] || [];
                    let covered = parents.some(function(pv){ return selected[pv]; });
                    if(covered){ return; }
                    chips.push({ group: 'categories', value: slug, text: labelOf[slug] || slug });
                });

                if(productFilter.category){
                    chips.push({ group: 'category', value: productFilter.category, text: labelOf[productFilter.category] || productFilter.category });
                } else if(selectCatergory){
                    chips.push({ group: 'category', value: selectCatergory, text: labelOf[selectCatergory] || selectCatergory });
                }

                productList.methods.getList('brands').forEach(function(b){
                    chips.push({ group: 'brands', value: b, text: b });
                });

                if((productFilter.min_price != null && productFilter.min_price !== '') ||
                   (productFilter.max_price != null && productFilter.max_price !== '')){
                    let sb = document.querySelector('.sidebar-filter');
                    let floor = sb ? (sb.getAttribute('data-price-floor') || '') : '';
                    let ceil = sb ? (sb.getAttribute('data-price-ceil') || '') : '';
                    let lo = (productFilter.min_price != null && productFilter.min_price !== '') ? productFilter.min_price : floor;
                    let hi = (productFilter.max_price != null && productFilter.max_price !== '') ? productFilter.max_price : ceil;
                    chips.push({ group: 'price', value: 'price', text: '$' + lo + ' - $' + hi });
                }

                productList.methods.getList('availability').forEach(function(a){
                    chips.push({ group: 'availability', value: a, text: a === 'in-stock' ? 'In Stock' : 'Out of Stock' });
                });

                return chips;
            },
            renderAppliedFilters(){
                let chips = productList.methods.buildAppliedChips();
                let html = '';
                chips.forEach(function(c){
                    html += '<button type="button" class="filter-chip" data-filter-remove="' + c.group + '" data-value="' + productList.methods.escAttr(c.value) + '">'
                        + '<span class="filter-chip__text">' + productList.methods.escHtml(c.text) + '</span>'
                        + '<i class="icon-close-1" aria-hidden="true"></i>'
                        + '</button>';
                });
                document.querySelectorAll('.sidebar-filter [data-applied-panel]').forEach(function(panel){
                    let chipsWrap = panel.querySelector('[data-applied-chips]');
                    let item = panel.querySelector('[data-applied-item]');
                    if(chipsWrap){ chipsWrap.innerHTML = html; }
                    if(item){ item.setAttribute('heading', 'Applied filters (' + chips.length + ')'); }
                    if(chips.length > 0){ panel.classList.remove('hide'); } else { panel.classList.add('hide'); }
                });
            },
            syncSidebarState(){
                // Re-derive every sidebar control from the current filter state so the sidebar
                // stays correct without being reloaded. Guarded so programmatic ticks don't
                // re-trigger the insCheck handler.
                isSyncing = true;
                try {
                    let catSet = {};
                    productList.methods.getList('categories').forEach(function(v){ catSet[v] = true; });
                    document.querySelectorAll('.sidebar-filter [data-filter="categories"]:not([data-cat-all])').forEach(function(box){
                        let v = box.getAttribute('value');
                        let on = !!catSet[v] || v === selectCatergory || v === productFilter.category;
                        productList.methods.setInsChecked(box, on);
                    });
                    productList.methods.syncAllCategoryCheckbox();

                    let brandSet = {};
                    productList.methods.getList('brands').forEach(function(v){ brandSet[v] = true; });
                    document.querySelectorAll('.sidebar-filter [data-filter="brands"]').forEach(function(box){
                        productList.methods.setInsChecked(box, !!brandSet[box.getAttribute('value')]);
                    });

                    let availSet = {};
                    productList.methods.getList('availability').forEach(function(v){ availSet[v] = true; });
                    document.querySelectorAll('.sidebar-filter [data-filter="availability"]').forEach(function(box){
                        productList.methods.setInsChecked(box, !!availSet[box.getAttribute('value')]);
                    });
                } finally {
                    isSyncing = false;
                }

                // Price inputs + sliders (native inputs — setting .value doesn't fire events).
                let hasMin = productFilter.min_price != null && productFilter.min_price !== '';
                let hasMax = productFilter.max_price != null && productFilter.max_price !== '';
                document.querySelectorAll('.sidebar-filter').forEach(function(c){
                    let floor = parseFloat(c.getAttribute('data-price-floor')) || 0;
                    let ceil = parseFloat(c.getAttribute('data-price-ceil')) || 0;
                    let minI = c.querySelector('.filter-price__input[data-price="min"]');
                    let maxI = c.querySelector('.filter-price__input[data-price="max"]');
                    let minS = c.querySelector('.filter-price__handle[data-price="min"]');
                    let maxS = c.querySelector('.filter-price__handle[data-price="max"]');
                    let range = c.querySelector('[data-price-range]');
                    let lo = hasMin ? parseFloat(productFilter.min_price) : floor;
                    let hi = hasMax ? parseFloat(productFilter.max_price) : ceil;
                    if(minI){ productList.methods.writeInput(minI, hasMin ? productFilter.min_price : ''); }
                    if(maxI){ productList.methods.writeInput(maxI, hasMax ? productFilter.max_price : ''); }
                    if(minS){ minS.value = lo; }
                    if(maxS){ maxS.value = hi; }
                    if(range && ceil > floor){
                        range.style.left = (((lo - floor) / (ceil - floor)) * 100) + '%';
                        range.style.right = (100 - ((hi - floor) / (ceil - floor)) * 100) + '%';
                    }
                });

                // Per-group "Clear" link (+ its separator) — visible only when that group has a selection.
                document.querySelectorAll('.sidebar-filter [data-filter-clear]').forEach(function(btn){
                    let group = btn.getAttribute('data-filter-clear');
                    let hasSel;
                    if(group === 'categories'){
                        hasSel = productList.methods.getList('categories').length > 0
                            || (selectCatergory && selectCatergory !== '')
                            || (productFilter.category && productFilter.category !== '');
                    } else {
                        hasSel = productList.methods.getList(group).length > 0;
                    }
                    btn.classList.toggle('hide', !hasSel);
                    let footer = btn.parentElement;
                    let sep = footer ? footer.querySelector('[data-foot-sep]') : null;
                    if(sep){ sep.classList.toggle('hide', !hasSel); }
                });

                productList.methods.renderAppliedFilters();
            },
            initSidebarFilters(){
                // Multi-select ins-checkboxes (categories, brands, availability)
                document.querySelectorAll('.sidebar-filter [data-filter]').forEach(function(el){
                    el.addEventListener('insCheck', function(event){
                        // Ignore events fired while we programmatically re-sync checkbox states.
                        if(isSyncing) return;
                        let checked = event.detail.checked;
                        // "All products" clears the category filter entirely.
                        if(el.hasAttribute('data-cat-all')){
                            if(checked){
                                productList.methods.selectAllCategories();
                            } else {
                                // "All" can't be unchecked directly — re-tick it; pick a category to narrow.
                                productList.methods.setInsChecked(el, true);
                            }
                            return;
                        }
                        // A category coming from the path-based route (/products/{slug2} or ?category=)
                        // isn't in the `categories` param, so unchecking it must clear the path instead.
                        if(el.hasAttribute('data-path-category') && !checked){
                            productList.methods.removeCategoryFilter();
                            return;
                        }
                        // Categories cascade: toggling a parent also toggles all its subcategories.
                        if(el.getAttribute('data-filter') === 'categories'){
                            productList.methods.toggleCategorySelection(el, checked);
                            return;
                        }
                        productList.methods.toggleFilterValue(el.getAttribute('data-filter'), el.getAttribute('value'));
                    });
                });
                // Applied-filter chips — delegated so it keeps working after the chips are rebuilt.
                document.querySelectorAll('.sidebar-filter').forEach(function(sidebar){
                    sidebar.addEventListener('click', function(event){
                        let el = event.target.closest('[data-filter-remove]');
                        if(el && sidebar.contains(el)){
                            let group = el.getAttribute('data-filter-remove');
                            let value = el.getAttribute('data-value');
                            if(group === 'price'){
                                delete productFilter.min_price;
                                delete productFilter.max_price;
                                productFilter.page = "1";
                                productList.methods.applyFilters();
                            } else if(group === 'category'){
                                productList.methods.removeCategoryFilter();
                            } else if(group === 'categories'){
                                productList.methods.removeCategoryValue(value);
                            } else {
                                productList.methods.removeFilterValue(group, value);
                            }
                            return;
                        }
                        // Per-group "Clear" link (clears only that group's selection).
                        let clearEl = event.target.closest('[data-filter-clear]');
                        if(clearEl && sidebar.contains(clearEl)){
                            productList.methods.clearGroup(clearEl.getAttribute('data-filter-clear'));
                        }
                    });
                });
                // Clear all
                document.querySelectorAll('.sidebar-filter [data-filter-clear-all]').forEach(function(el){
                    el.addEventListener('click', productList.methods.clearAllFilters);
                });
                // Show more / less
                document.querySelectorAll('.sidebar-filter [data-show-more]').forEach(function(el){
                    el.addEventListener('click', function(){
                        let body = el.closest('.filter-group__body');
                        if(!body) return;
                        body.classList.toggle('show-all');
                        el.textContent = body.classList.contains('show-all') ? 'Show less' : 'Show more';
                    });
                });
                // Price inputs + range sliders
                productList.methods.initPriceControls();
            },
            readInput(el){
                // ins-input exposes its value via the inner <input>; fall back to the host property.
                if(!el) return '';
                let inner = el.querySelector ? el.querySelector('input') : null;
                if(inner) return inner.value;
                return el.value || '';
            },
            writeInput(el, v){
                if(!el) return;
                el.value = v;
                let inner = el.querySelector ? el.querySelector('input') : null;
                if(inner){ inner.value = v; }
            },
            initPriceControls(){
                document.querySelectorAll('.sidebar-filter').forEach(function(container){
                    let floor = parseFloat(container.getAttribute('data-price-floor')) || 0;
                    let ceil = parseFloat(container.getAttribute('data-price-ceil')) || 0;
                    let minInput = container.querySelector('.filter-price__input[data-price="min"]');
                    let maxInput = container.querySelector('.filter-price__input[data-price="max"]');
                    let minSlider = container.querySelector('.filter-price__handle[data-price="min"]');
                    let maxSlider = container.querySelector('.filter-price__handle[data-price="max"]');
                    let rangeEl = container.querySelector('[data-price-range]');

                    let paintRange = function(){
                        if(!rangeEl || !minSlider || !maxSlider || ceil <= floor) return;
                        let lo = parseFloat(minSlider.value);
                        let hi = parseFloat(maxSlider.value);
                        rangeEl.style.left = (((lo - floor) / (ceil - floor)) * 100) + '%';
                        rangeEl.style.right = (100 - ((hi - floor) / (ceil - floor)) * 100) + '%';
                    };
                    paintRange();

                    let commit = function(){
                        let lo = parseInt(productList.methods.readInput(minInput), 10);
                        let hi = parseInt(productList.methods.readInput(maxInput), 10);
                        let newMin = (!isNaN(lo) && lo > floor) ? lo : undefined;
                        let newMax = (!isNaN(hi) && hi < ceil) ? hi : undefined;
                        let curMin = (productFilter.min_price !== undefined && productFilter.min_price !== '') ? parseInt(productFilter.min_price, 10) : undefined;
                        let curMax = (productFilter.max_price !== undefined && productFilter.max_price !== '') ? parseInt(productFilter.max_price, 10) : undefined;
                        // Nothing actually changed (e.g. blur without edit) — don't refetch.
                        if(newMin === curMin && newMax === curMax){ return; }
                        if(newMin !== undefined){ productFilter.min_price = newMin; } else { delete productFilter.min_price; }
                        if(newMax !== undefined){ productFilter.max_price = newMax; } else { delete productFilter.max_price; }
                        productFilter.page = "1";
                        productList.methods.applyFilters();
                    };

                    let commitFromInput = function(input, slider){
                        let v = productList.methods.readInput(input);
                        if(slider && v !== ''){ slider.value = v; }
                        paintRange();
                        commit();
                    };

                    if(minSlider && maxSlider){
                        minSlider.addEventListener('input', function(){
                            if(parseFloat(minSlider.value) > parseFloat(maxSlider.value)){ minSlider.value = maxSlider.value; }
                            productList.methods.writeInput(minInput, minSlider.value);
                            paintRange();
                        });
                        maxSlider.addEventListener('input', function(){
                            if(parseFloat(maxSlider.value) < parseFloat(minSlider.value)){ maxSlider.value = minSlider.value; }
                            productList.methods.writeInput(maxInput, maxSlider.value);
                            paintRange();
                        });
                        minSlider.addEventListener('change', commit);
                        maxSlider.addEventListener('change', commit);
                    }

                    // ins-input: commit on blur and on Enter (matches the old native 'change').
                    let isEnter = function(e){ return e.detail && (e.detail.keyCode === 13 || e.detail.keycode === 13); };
                    if(minInput){
                        minInput.addEventListener('insBlur', function(){ commitFromInput(minInput, minSlider); });
                        minInput.addEventListener('insInput', function(e){ if(isEnter(e)){ commitFromInput(minInput, minSlider); } });
                    }
                    if(maxInput){
                        maxInput.addEventListener('insBlur', function(){ commitFromInput(maxInput, maxSlider); });
                        maxInput.addEventListener('insInput', function(e){ if(isEnter(e)){ commitFromInput(maxInput, maxSlider); } });
                    }
                });
            },
            keywordInputEvent(event, type){
                let isEnter = event.detail.keyCode === 13;
                let isIconClick = type == "iconClick" && event.detail.value != "";

                if (isEnter || isIconClick){
                    // If a predictive suggestion is highlighted, open that product instead of running a full search.
                    if (isEnter && window.PredictiveSearch) {
                        let activeSlug = window.PredictiveSearch.getActiveSlug();
                        if (activeSlug) {
                            window.PredictiveSearch.go(activeSlug);
                            return;
                        }
                    }
                    productList.methods.clearFilterToList();
                    productFilter.keyword = event.detail.value;
                    productList.methods.applyFilters();
                    return;
                }

                // Typing: drive the predictive dropdown.
                if (window.PredictiveSearch) {
                    window.PredictiveSearch.onInput(event.detail.value);
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
                    mobileCategoryToggle.addEventListener('insClick', productList.methods.openMobileFilterDrawer);
                }

                productList.methods.initSidebarFilters();
                productList.methods.initPagination();

                // Back/forward should restore the listing for that URL.
                window.addEventListener('popstate', function(){ window.location.reload(); });
            }

        }
    }
})();


setTimeout(() => {
    productList.init.initProductList();
    productList.init.initProductListInterface();
    productList.init.initFilterListeners();
}, 200);


// ---- Reveal the filter sidebar only once its web components have hydrated ----
// The ins-checkbox / ins-filter / ins-accordion labels render on hydration, so an
// un-hydrated sidebar paints blank rows (CSS hides .sidebar-filter until ready).
// Poll each frame until every component reports .hydrated, then fade it in.
(function () {
    function watchSidebar(sb) {
        if (sb.classList.contains('is-ready')) return;
        var tries = 0;
        var maxTries = 180; // ~3s safety net so it can never stay hidden
        function check() {
            tries++;
            var comps = sb.querySelectorAll('ins-checkbox, ins-filter, ins-accordion-item');
            var ready = comps.length === 0 || Array.prototype.every.call(comps, function (c) {
                return c.classList.contains('hydrated');
            });
            if (ready || tries >= maxTries) {
                sb.classList.add('is-ready');
                return;
            }
            requestAnimationFrame(check);
        }
        requestAnimationFrame(check);
    }
    function revealSidebars() {
        var sidebars = document.querySelectorAll('.sidebar-filter');
        Array.prototype.forEach.call(sidebars, watchSidebar);
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', revealSidebars);
    } else {
        revealSidebars();
    }
})();