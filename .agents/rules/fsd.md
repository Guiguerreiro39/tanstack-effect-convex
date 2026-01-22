---
trigger: glob
globs: "apps/web/src/**/*.{ts,tsx}"
---

# Feature-Sliced Design (FSD)

Organize code by **business value**, not technical role. FSD makes projects understandable and stable against changing business requirements.

## Core Concepts

### Layer Hierarchy (Top → Bottom)

```
app/          # Routing, providers, global styles, initialization
pages/        # Full page components, nested routing
widgets/      # Large self-contained UI blocks (header, sidebar, complex forms)
features/     # User interactions bringing business value
entities/     # Business entities (user, product, order)
shared/       # Infrastructure detached from business (UI kit, utils, API client)
```

**Import Rule**: Layers can **only import from layers below**. A file in `features/` cannot import from `widgets/` or `pages/`.

### Layer Semantics

| Layer       | Has Slices | Purpose                                       |
| ----------- | ---------- | --------------------------------------------- |
| `app/`      | No         | App initialization, combines all domains      |
| `pages/`    | Yes        | Route entry points, compose widgets/features  |
| `widgets/`  | Yes        | Standalone complex UI delivering use cases    |
| `features/` | Yes        | Reusable business actions (add to cart, auth) |
| `entities/` | Yes        | Business data models (User, Product, Order)   |
| `shared/`   | No         | Technical foundation, no business logic       |

### Segment Types

- `ui/` — Components, formatters, styles
- `model/` — Business logic, state, validation schemas
- `api/` — Backend interactions, request functions
- `lib/` — Internal utilities (focused, not dumping ground)
- `config/` — Feature flags, environment config
- `types/` — TypeScript types/interfaces

## Fundamental Rules

### 1. No Upward Imports

Lower layers cannot import from higher layers.

```typescript
// ❌ entities/user/model.ts importing from features
import { authState } from "@/features/auth/model/state";

// ✅ features/auth uses entities
import { User } from "@/entities/user/types/user-type";
```

### 2. No Cross-Slice Imports (Same Layer)

Slices on the same layer cannot import each other directly.

```typescript
// ❌ features/cart importing from features/checkout
import { useCheckout } from "@/features/checkout/model/use-checkout";

// ✅ Extract shared logic to entities or shared layer
import { CartItem } from "@/entities/cart/types/cart-item";
```

### 3. Direct File Imports (No Barrel Files)

Avoid `index.ts` barrel files to prevent:

- **Circular imports** — Index files create import cycles
- **Broken tree-shaking** — Bundlers pull in unused code
- **Bundler performance** — Slower builds on large projects

```typescript
// ❌ Barrel import
import { useAuth, AuthForm } from "@/features/auth";

// ✅ Direct imports
import { useAuth } from "@/features/auth/model/use-auth";
import { AuthForm } from "@/features/auth/ui/auth-form";
```

### 4. Business Logic in Features/Entities

Keep UI components pure. Business logic belongs in `model/` segments.

```typescript
// ❌ Business logic in component
function CartButton() {
  const addToCart = () => {
    if (inventory > 0 && user.canPurchase) { ... }
  };
}

// ✅ Logic in model, UI just renders
import { useAddToCart } from "@/features/cart/model/use-add-to-cart";
function CartButton() {
  const { addToCart, canAdd } = useAddToCart();
}
```

## Best Practices

### Slice Naming

Name slices by **business domain**, not technical role:

- ✅ `user`, `product`, `order`, `payment`
- ❌ `hooks`, `components`, `utils`, `helpers`

### Widget vs Feature

- **Widget**: Self-contained UI block (Header, Sidebar, CommentSection)
- **Feature**: Reusable action (AddComment, LikePost, ToggleTheme)

Rule: If it's reused across pages, it's likely a feature.

### Entity Relationships (Cross-Import Pattern)

When entities reference each other, use `@x` notation:

```typescript
// entities/song/@x/artist.ts (explicit cross-import API)
export type { Song } from "../model/song";

// entities/artist/model/artist.ts
import type { Song } from "@/entities/song/@x/artist";
export interface Artist {
  songs: Song[];
}
```

### Shared Layer Structure

```
shared/
  ui/       # UI kit (Button, Input, Modal)
  api/      # API client, request helpers
  lib/      # Focused libraries (dates/, colors/, text/)
  config/   # Environment, feature flags
  routes/   # Route constants
```

Each `lib/` subfolder should have **one focus area** with a README.

### Feature Granularity

Not everything needs to be a feature. Create features when:

- Reused across multiple pages
- Complex enough to warrant isolation
- Represents distinct business action

Too many features drowns important ones.

## Common Mistakes

### ❌ Importing from Parent Index

Creates circular imports:

```typescript
// pages/home/ui/home-page.tsx
import { loadData } from "../"; // ❌ imports from pages/home/index.ts
```

**Fix**: Use relative paths to specific files.

### ❌ Wildcard Re-exports

Exposes internals, breaks encapsulation:

```typescript
// ❌ features/auth/index.ts
export * from "./ui/form";
export * from "./model/state";
```

**Fix**: Explicitly export public API or avoid barrel files entirely.

### ❌ Shared as Dumping Ground

`shared/lib/helpers.ts` or `shared/utils/` quickly becomes unmaintainable.
**Fix**: Create focused modules: `shared/lib/dates/`, `shared/lib/currency/`.

### ❌ Business Logic in Shared

Shared layer must be domain-agnostic.

```typescript
// ❌ shared/lib/calculate-order-total.ts
// ✅ entities/order/lib/calculate-total.ts
```

### ❌ Feature Using Another Feature

```typescript
// ❌ features/checkout/model.ts
import { useCart } from "@/features/cart/model/use-cart";
```

**Fix**: Extract to entity or lift composition to widget/page.

### ❌ Fat Entities

Entity slices should contain only:

- Data types/schemas
- API calls for CRUD
- Base UI representation

Complex logic → features. Complex UI → widgets.

## Decision Guide

| Need                         | Layer               |
| ---------------------------- | ------------------- |
| Button, Input, Modal         | `shared/ui/`        |
| User type, Product schema    | `entities/*/types/` |
| Fetch user, Get products     | `entities/*/api/`   |
| Add to cart, Submit review   | `features/`         |
| Product card with buy button | `widgets/`          |
| Full page with layout        | `pages/`            |
| Provider setup, routing      | `app/`              |

## Project-Specific Notes

In this codebase:

- **Import alias**: `@/` maps to `apps/web/src/`
- **API hooks**: Use dedicated files like `use-*.ts` in `api/` segment
- **Types**: Prefer `types/*.ts` over inline definitions

## Reference

https://feature-sliced.design/
