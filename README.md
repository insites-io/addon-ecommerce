# Ecommerce Addon
Latest `v1.1.0`


## Overview
The Ecommerce Add-on is a powerful solution that transforms your website into a full-fledged online store by providing two key components: the public-facing Website for your customers and a secure Portal that serves as your private command center for managing everything behind the scenes.


## Tech Stack
It is assumed that the developers or users have knowledge of using these tech stacks:

 - Insites Components and Modules
 - Liquid
 - GraphQL
 - YAML
 - Javascript
 - CSS / SCSS
 - HTML
 

## Application Dependencies
Please ensure this application is installed from the Insites Marketplace.

 - Website and Portal `v1.3.0`


 ## Module Dependencies
 - API 5.2.1
 - CMS 5.7.0
 - CRM 5.13.2
 - Ecommerce 5.11.1


 ## Features
- Products
- Cart
- Discounts
- Checkout
- Pre-order
- Order History


## Custom Fields
- Ecommerce
-- Categories
--- is_featured


## Constants
- ecommerce_addon = true


## Manual add Constants after installation
- insites_stripe_sk_live_key
- insites_stripe_sk_test_key


## Installation steps
1. Install the `Website and Portal` application from the Marketplace.
2. Install the `Ecommerce` addon from the Marketplace.
3. Login to IIA via console.insites.io SSO
 - Go to Integration -> Google Maps then add the `Google Maps API Key`
 - Go to Integration -> Stripe then set up the Stripe Account ID and keys


## Google Maps API Key
This is used for adding addresses in the shipping and billing address forms.


## Stripe
We use Stripe as a third-party payment gateway to securely handle payments during checkout.


## Documentation
[Click Here](https://docs.google.com/document/d/1PwxzrroQ2Bdqj0nAkevEGdX-gxmB6-kWw_WbUpmFJgE/edit?usp=sharing)
