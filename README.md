# Insites Ecommerce Add-on

> Turn an Insites **Website & Portal** deployment into a full-featured online store — product catalogue, cart, checkout, discounts, and customer order history.

**Version:** `v1.2.0` · **Platform:** [PlatformOS](https://www.platformos.com/) · **License:** Proprietary (Insites)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Project Structure](#project-structure)
- [Development](#development)
- [Documentation](#documentation)

---

## Overview

The Ecommerce Add-on layers a storefront on top of an existing Insites app-portal
deployment. It delivers two complementary experiences:

- **Website (storefront)** — public-facing catalogue, search & filtering, shopping
  cart, and a multi-step checkout (shipping → billing → payment → confirmation).
- **Portal (account)** — a signed-in customer area for order history and re-ordering.

The add-on is enabled per-instance via the `ecommerce_addon` constant and does **not**
ship its own layout, header, footer, or base styles — those are inherited from the
host Website & Portal application.

## Features

- **Products** — catalogue with predictive/typeahead search, advanced sidebar filters
  (categories, price range, brands, availability), AJAX result loading, and product reviews.
- **Cart** — slide-out cart drawer and full cart page.
- **Discounts** — admin-managed discount codes applied at checkout.
- **Checkout** — multi-step flow with address lookup; supports guest checkout.
- **Pre-order** — purchase items not yet in stock.
- **Order History** — portal view of past orders with "purchase again".

See [CHANGELOG.md](CHANGELOG.md) for the full release history.

## Tech Stack

Familiarity with the following is assumed:

- Insites Components (web components v2) & Modules
- Liquid (server-side templates)
- GraphQL (data fetching)
- YAML (schemas / form definitions)
- JavaScript (ES5 IIFE, Axios — no build step)
- HTML / CSS

## Prerequisites

This add-on is **layered on top of** an Insites deployment — install the base
application first.

**Application dependency**

| Application          | Version  |
| -------------------- | -------- |
| Website and Portal   | `v1.3.0` |

**Module dependencies**

| Module    |
| --------- |
| API       |
| CMS       |
| CRM       |
| Ecommerce |

## Installation

1. Install the **Website and Portal** application from the Insites Marketplace.
2. Install the **Ecommerce** add-on from the Insites Marketplace.
3. Log in to IIA via `console.insites.io` SSO and configure integrations:
   - **Integration → Google Maps** — add the `Google Maps API Key`.
   - **Integration → Stripe** — set up the Stripe Account ID and keys.

## Configuration

### Constants

Set automatically on install:

| Constant                            | Value  | Purpose                                                                                |
| ----------------------------------- | ------ | -------------------------------------------------------------------------------------- |
| `ecommerce_addon`                   | `true`       | Enables the add-on per-instance                                                        |
| `ecommerce_addon_is_price_round_off` | `true`       | Display prices as whole numbers (no cents) on product-list cards and the cart drawer; set to `false` to show cents |
| `insites_stripe_sk_live_key`        | `sk_live_key` | Stripe live secret key (Stripe Connect) — replace per-site in the admin                |
| `insites_stripe_sk_test_key`        | `sk_test_key` | Stripe test secret key (Stripe Connect) — replace per-site in the admin                |

The Stripe keys are seeded with a placeholder (`sk_live_key` / `sk_test_key`)
rather than an empty value because `constant_set` rejects a blank value. Replace
them with the real keys per-site after installation.

### Custom Fields

| Module    | Entity     | Field                 | Type    |
| --------- | ---------- | --------------------- | ------- |
| Ecommerce | Categories | `is_featured`         | boolean |
| Ecommerce | Products   | `tags`                | array   |
| Ecommerce | Products   | `low_stock_override`  | integer |

### Third-party Integrations

- **Google Maps** — powers address autocomplete in the shipping and billing forms.
- **Stripe** — third-party payment gateway used to securely process payments at checkout.

## Project Structure

All code lives under `modules/`. The primary module is `modules/ecommerce/`:

```
modules/ecommerce/public/
├── assets/
│   ├── scripts/        # JS source (.js only — .min.js auto-built)
│   └── styles/         # ecommerce.css (.css only — .min.css auto-built)
├── views/
│   ├── pages/          # Full page views (shop/, checkout/, orders/, api/)
│   └── partials/       # Reusable components
├── forms/              # Form definitions (checkout/*)
├── schema/             # Data model definitions (.yml)
├── graphql/            # GraphQL queries (products/, carts/, orders/, ...)
├── migrations/
├── emails/
└── authorization_policies/
```

> **No build step** — only edit `.js` / `.css` source files. The `.min.js` / `.min.css`
> versions are generated automatically by the VSCode extension; never hand-edit them.

## Development

- **Indentation:** 2 spaces (see [.editorconfig](.editorconfig)).
- **Components:** prefer Insites web components (`<ins-input>`, `<ins-button>`, etc.)
  over raw HTML elements.
- **Styles:** reuse the host app's base classes before adding to `ecommerce.css`.
- Target instances are configured in [.insites](.insites) (staging/dev environments).

## Documentation

- Full add-on documentation:
  [Google Doc](https://docs.google.com/document/d/1PwxzrroQ2Bdqj0nAkevEGdX-gxmB6-kWw_WbUpmFJgE/edit?usp=sharing)
- Insites web components v2: https://docs.insites.io/web-components/overview-v2
