 ## Change Log
 ## App - Add-on Ecommerce V1.2.0

- Predictive Search (Products)
  - Added predictive/typeahead search to the products filter (`#filter-keyword`): suggestions appear as you type, with product thumbnail, name and price
  - Intent-aware matching tolerant of word order, abbreviations, plurals and synonyms (e.g. "extra large" ⟷ "xl", "tee" ⟷ "t-shirt"); closest matches ranked highest
  - Admin-managed synonyms via a new `product_search_synonym` database ("Product Search Synonyms") — terms can be added/edited without code changes; synonyms are bidirectional
  - Keyboard (↑/↓/Enter/Esc) and mouse navigation, load-more on scroll; pressing Enter with no suggestion highlighted runs the standard results-page search
  - New lightweight GraphQL query (`search_products_lite`) and JSON endpoint (`api/products/predictive-search`); ranking is performed client-side

- Product List — Sidebar Filters
  - New advanced sidebar filters: multi-select categories, price range slider, brands, and availability — with a "Refine by" summary showing applied-filter chips and a clear-all
  - Each filter option shows a live count of matching products; filters with no matches are disabled
  - Fixed availability counts to match the results returned: "In Stock" counts products with stock on hand (`stock_level > 0`); "Out of Stock" counts zero and untracked (null) stock
  - New `get_product_facets` GraphQL query providing the catalog data used to build the filter options

- Product List — AJAX Result Loading
  - Filtering, search, sorting and pagination now update only the product grid via AJAX instead of reloading the whole page
  - URL query params are kept in sync so results are shareable and back/forward navigation works
  - Added a total product count below the page heading (e.g. "3 products"), kept up to date as filters change
  - New JSON endpoint (`api/products/list-results`) returns the rendered grid and result count for the current filters

- Product Reviews
  - Customers can write a product review from the product page via a modal form: interactive star rating (1–5), review text, and reviewer details; supports both logged-in users (details pre-filled) and guests
  - Submitted reviews are saved with a "Pending" status and only appear publicly once approved (Pending / Approved / Rejected), giving admins moderation control
  - New "Reviews" tab on the product page shows a rating summary (average score + stars + total count), the list of approved reviews (reviewer, stars, date, comment), and an empty state with a call-to-action when there are none
  - Reviews list paginates via AJAX (with a per-page selector and skeleton loading) so only the list updates, and the view scrolls back to the tab
  - New `reviews` database for storing reviews, with GraphQL queries for the list and summary, and a write-a-review platform form

- Product Card Enhancements
  - Product cards now show the **brand name** above the title, an average **star rating** with review count, and a **units-sold** count
  - **Highlighted tags** (e.g. "New Arrival", "Sale", "Staff Pick", "Limited", "Bestseller") render as coloured chips overlaid on the product image; tag colours follow the design-system semantic colours. Replaces the old hardcoded "SALE" tag (cards and product page)
  - **Stock-level indicator** under the price: "In stock (N)", "Low stock (N)", "Very low stock (N)", or "Out of stock" — driven by a per-product low-stock override; coloured for WCAG AA contrast
  - Tags are admin-managed per product (`tags` + `low_stock_override` custom fields); rating is pulled from approved reviews and sold count from completed orders
  - Enhancements apply everywhere the product card is used: Product List, New Arrivals, What's Hot, and You May Also Like
  - Card data is fetched in batched, per-page queries (keyed by the page's products) to avoid extra per-product lookups

 ## App - Add-on Ecommerce V1.1.1

- Module Updates
  - Ecommerce 5.10.4 → 5.11.2
    - **v5.10.5**: Added `effective_price` field to `product` and `product_variant` schemas
    - **v5.11.0** (breaking): Cart discounts moved out of `cart.discount_code_uuids` into a new `cart_discount` schema; `cart_item.variant_uuid` renamed to `product_variant_uuid`; `cart` schema gained `company_uuid` and `session_id` fields
    - **v5.11.1** (breaking): `order.total_amount` deprecated — use `order_total` instead; 
    - **v5.11.2** (breaking): `cart_item` simplified — computed/denormalized fields removed (`sub_total`, `item_tax`, `line_item_total`, `product_name`, `product_sku`, `product_price`, `product_price_includes_tax`, `tax_type`, `tax_amount`); v2 PUT endpoints changed to PATCH
    - Addon liquid partials renamed to align with schema changes: `cart_items.liquid` → `cart_data.liquid`, `cart_details.liquid` → `cart_item_details.liquid`, `cart_items_export` → `cart_data`
    - Add-to-cart and order computations refactored for updated schemas
  - Controllers
    - Add-to-cart converted from GraphQL to controller
    - Order update converted from API to controller
    - Stream Events updated to controllers
    - API updated to controllers across pages
- Changes in Insites Module prerequisite
  - API v5.2.1
  - CMS 5.7.0
  - CRM 5.13.2
  - Ecommerce 5.11.2

- Guest Checkout
  - Fixed submit button state after adding a credit card
  - Fixed deleting a credit card in guest checkout
  - Use `context.session.contact_email` for both guest and logged-in users
  - Fixed race condition on purchase button after card addition
  - Fixed user detection using `has_profile`

- Cart
  - Carry over guest cart to user account on login
  - Fixed overlapping items with subtotal in cart drawer
  - Cart discount refactored

- Products & Product List
  - Fixed categories displayed in homepage New Arrivals and What's Hot carousels
  - Fixed variant product add-to-cart and variant option selection
  - Fixed product list search (replaced fulltext)
  - Fixed "Out of Stock" display in product list
  - Fixed flicker of subcategories on initial load
  - Use `effective_price` when sorting products by price high–low / low–high
  - Fix category assignment for products

- Checkout & Orders
  - Fixed data passed when creating order items
  - Fixed order summary computation involving discounts
  - Use `order_total` for computing completed order amount
  - Tax is now subtracted from subtotal in order summary
  - Added `processing_fee` and `order_total` fields to orders
  - Fixed duplicate selected address in checkout billing step

- Pre-order & Email
  - Fixed product names in pre-order email
  - Fixed product list filters
  - Design QA: fixed spacing in shipping section

- Mobile Responsiveness
  - Fixed spacing above order summary on mobile
  - Fixed mobile categories & menu height
  - Categories font-family set to DM Sans
  - Fixed `ins-button` height on mobile

- Performance
  - Added `width` and `height` attributes to product list images (Lighthouse)
  - Added `fetchpriority="high"` to first 3 images in product list (Lighthouse)
  - Added caching for order-history and /products pages

- W3C Compliance
  - Fixed heading hierarchy across product, checkout, and cart pages
  - Removed duplicate and unused element IDs
  - Removed unused `<link>` and stray end tags
  - Removed `name` attribute from `ins-input-stepper`

- Code Cleanup
  - Merged `mega-menu-close.js` into `mega_menu.liquid` (deleted standalone file)
  - Merged `checkout-steps.js` into `checkout.js`
  - Cleaned up `shopping-cart.js`, `product-list.js`, `address-lookup.js`, `checkout.js`
  - Deleted unused files


 ## App - Add-on Ecommerce V1.1.0

- Prerequisite module: Ecommerce 5.10.4
- Prerequisite app: Portal v1.3.0
  - Rounded buttons
  - Gradient background color for solid buttons
- Text headings and labels ( except for Product Name )
  - Use sentence case ( Sample title ) instead of title case ( Sample Title )
- New design for loader - https://cbo.d.pr/i/D0lLrp
- Seed data
  - Added seed data for category_custom_field. This will display the featured categories in the Mega Menu
- Mega Menu
  - Added max-width to align with the navbar width
  - Added background to main categories
- Cart Drawer
  - Clickable items in the cart drawer
  - Pre-order tag in the cart drawer
  - Include the variant options when adding the items in the cart
  - Auto delete items in the cart when the product becomes disabled, deleted, or archived.
  - Use the variant image if the item is a variant; if no image is available, use the main product image instead.
- Product carousel (New Arrivals & What's Hot) pagination button - removed border line
- Products page
  - Products page container width
    - To maintenance the product image ratio, set the page wrapper max-width to 1344px.
  - Product with variants
    - Disable the buy-now/pre-order and add-to-cart buttons until the user selects all the available options for the variant.
  - Product item
    - zoom in image on hover
    - image opacity change on hover
    - rounded image
    - rounded product wrapper
    - Pagination style similar to ins-table
    - No result found - add border
    - Filters: rounded select buttons
    - Filter by brand: show only brands that have products.
- Continue Shopping button
  - Close the cart drawer when in /shopping-cart or /products page, else go to /products page
- Shopping Cart
  - Show variant (if there is) in list
- Discounts
  - Consider discount.minimum_cart_value in the validation
  - Validate the discount code twice: first when adding it in /shopping-cart, and second on the /checkout-payment page.
- Taxes
  - variant has is now having its own settings for computing taxes, previously it is dependent to main product settings
- Checkout
  - Contact
    - Add 'Contact information' form steps for guest user
      - save user data in CRM
  - Shipping & Billing
    - Use modal form in adding new address
