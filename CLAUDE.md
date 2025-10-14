# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js Commerce application - a high-performance, server-rendered e-commerce storefront using Next.js 15 App Router with React Server Components. It integrates with Shopify as a headless CMS using the Shopify Storefront API.

## Development Commands

```bash
# Install dependencies (uses npm, though pnpm-lock.yaml exists)
npm install

# Run development server (localhost:3000)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Format code with Prettier
npm run prettier

# Check code formatting
npm run prettier:check

# Run tests (currently just prettier:check)
npm test
```

## Environment Variables

Required environment variables (see `.env.example`):
- `SHOPIFY_STORE_DOMAIN` - Your Shopify store domain (e.g., [store].myshopify.com)
- `SHOPIFY_STOREFRONT_ACCESS_TOKEN` - Shopify Storefront API token
- `SHOPIFY_REVALIDATION_SECRET` - Secret for webhook revalidation
- `SITE_NAME` - Display name for the site
- `COMPANY_NAME` - Company name

**IMPORTANT:** Never commit the `.env` file as it contains sensitive credentials.

## Architecture

### Directory Structure

- **`app/`** - Next.js 15 App Router pages and layouts
  - `app/page.tsx` - Homepage
  - `app/product/[handle]/` - Product detail pages
  - `app/search/` - Search and collection pages
  - `app/search/[collection]/` - Collection-specific pages
  - `app/[page]/` - Dynamic CMS pages
  - `app/api/revalidate/` - Webhook endpoint for Shopify revalidation

- **`components/`** - React components organized by feature
  - `components/cart/` - Cart UI and context (client components)
  - `components/layout/` - Layout components (navbar, footer, grid)
  - `components/product/` - Product display components

- **`lib/`** - Core utilities and integrations
  - `lib/shopify/` - **Primary integration layer** with Shopify Storefront API
  - `lib/constants.ts` - App constants (sorting options, cache tags)
  - `lib/utils.ts` - Utility functions

### Shopify Integration Architecture

The `lib/shopify/` directory is the **core abstraction layer** for all Shopify interactions:

- **`index.ts`** - Main API functions and data reshaping logic
  - `shopifyFetch()` - Base GraphQL fetch function with error handling
  - Exported functions: `getProduct()`, `getProducts()`, `getCollection()`, `getCart()`, `addToCart()`, etc.
  - "Reshape" functions convert Shopify GraphQL responses to app-specific types
  - Uses Next.js 15's `use cache`, `cacheTag()`, and `cacheLife()` for caching

- **`queries/`** - GraphQL query definitions (products, collections, cart, menu, pages)
- **`mutations/`** - GraphQL mutations for cart operations
- **`fragments/`** - Reusable GraphQL fragments (image, product, cart, SEO)
- **`types.ts`** - TypeScript type definitions for Shopify and app data structures

### React Server Components & Caching

This app extensively uses React Server Components (RSC):
- Most data fetching happens in Server Components
- Cache strategy uses Next.js 15's built-in caching with cache tags
- `TAGS` constant defines cache invalidation groups: `collections`, `products`, `cart`
- Webhook at `/api/revalidate` handles cache invalidation from Shopify

### Client-Side State Management

- **Cart Context** (`components/cart/cart-context.tsx`):
  - Uses React `useOptimistic` for optimistic UI updates
  - Cart state is initialized from server-side `getCart()` promise
  - `cartReducer` handles local cart updates before server confirmation
  - Client components are marked with `'use client'` directive

### GraphQL API Pattern

All Shopify API calls follow this pattern:
1. Define GraphQL query/mutation in `lib/shopify/queries/` or `mutations/`
2. Import query into `lib/shopify/index.ts`
3. Create typed fetch function using `shopifyFetch<OperationType>()`
4. Reshape response data to match app types
5. Export function for use in components

### Hidden Products & Collections

- Products tagged with `nextjs-frontend-hidden` (from `HIDDEN_PRODUCT_TAG`) are filtered out
- Collections with handles starting with `hidden-` are excluded from search pages

## Key Patterns

### Adding New Shopify Data Fetching

1. Define GraphQL query/mutation in appropriate `lib/shopify/queries/` or `mutations/` file
2. Add TypeScript operation type in `lib/shopify/types.ts`
3. Create fetch function in `lib/shopify/index.ts` with proper caching tags
4. Add reshape function if response needs transformation

### Cache Invalidation

The revalidation webhook (`app/api/revalidate/route.ts`) listens for Shopify webhooks:
- Product webhooks (`products/create`, `products/update`, `products/delete`) → revalidate `TAGS.products`
- Collection webhooks (`collections/*`) → revalidate `TAGS.collections`
- Validates `SHOPIFY_REVALIDATION_SECRET` for security

### Image Optimization

Next.js Image component is configured in `next.config.ts`:
- Allowed domains: `cdn.shopify.com`
- Formats: AVIF and WebP
- Uses Next.js 15 experimental features: `inlineCss`, `useCache`

## Testing & Formatting

- Prettier is used for code formatting (includes Tailwind CSS plugin)
- Run `npm run prettier` to format all files before committing
- Current test script only runs prettier check

## Deployment

Designed for Vercel deployment with Shopify integration. See README.md for detailed setup instructions including:
- Vercel CLI environment variable setup
- Shopify Storefront API configuration
- Webhook configuration for cache revalidation
