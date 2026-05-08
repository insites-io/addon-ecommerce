# addon-ecommerce

Insites ecommerce addon. Liquid templates, GraphQL, and vanilla JavaScript that provide cart, checkout, and Stripe payment integration on top of the Insites platform. Designed to drop into the Website and Portal application and turn an Insites instance into a full-featured online store with a public storefront and a private admin portal.

Latest release: `v1.1.0`

## Stack

- Insites Components and Modules
- Liquid (PlatformOS)
- GraphQL
- YAML
- JavaScript
- CSS / SCSS
- HTML

## Application Dependencies

- Website and Portal `v1.3.0`

## Module Dependencies

- API `5.2.1`
- CMS `5.7.0`
- CRM `5.13.2`
- Ecommerce `5.11.1`

## Features

- Products
- Cart
- Discounts
- Checkout
- Pre-order
- Order History

## Installation

Two supported paths:

**1. Insites Console marketplace (recommended):**

1. Install the `Website and Portal` application from the Marketplace.
2. Install the `Ecommerce` addon from the Marketplace.
3. Sign in to IIA via `console.insites.io` SSO.

**2. Clone and deploy via CloudShell:**

1. Clone this repository.
2. Install dependencies and deploy the module to a target Insites instance using the CloudShell deploy API.
3. Confirm the addon's constant `ecommerce_addon = true` is present on the instance.

## Configuration

After installation, configure these in the Insites admin (never in code):

- **Google Maps API key** — Integration -> Google Maps. Used for shipping and billing address autocomplete.
- **Stripe** — Integration -> Stripe. Set the Stripe Account ID and the publishable / secret keys. Required constants:
  - `insites_stripe_sk_live_key`
  - `insites_stripe_sk_test_key`

Stripe secret keys must always be stored as instance settings and read at runtime via `modules/portal/stripe/get_stripe_settings`. Never commit live keys to source control or log them in payment payloads.

### Custom fields

- Ecommerce -> Categories -> `is_featured`

### Constants

- `ecommerce_addon = true`

## Documentation

Public documentation is published at `https://docs.insites.io/ecommerce-addon`.

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. All commits must be signed off under the Developer Certificate of Origin (DCO). By participating in this project you agree to abide by the [Code of Conduct](CODE_OF_CONDUCT.md).

## Licence

Licensed under the Apache Licence, Version 2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE) for details.
