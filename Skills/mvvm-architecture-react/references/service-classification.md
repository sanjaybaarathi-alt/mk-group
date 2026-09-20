# Service Classification — Screen / Domain / Platform (React)

> The decision tree for where a service lives, what it wraps, and the `ServiceResult` contract
> every method returns.

---

## The Three Kinds

| Kind | What it does | HTTP verbs | Example |
|---|---|---|---|
| **Screen Service** | Fetches the data a screen needs | GET only | `CheckoutScreenService.loadSummary()` |
| **Domain Service** | Mutates a domain entity | POST / PUT / PATCH / DELETE | `OrderDomainService.cancelOrder(id)` |
| **Platform Service** | Wraps browser / SDK | n/a | `ClipboardService.copy(text)` |

---

## Decision Tree

```
Does the backend own this data?
├─ Yes → It's a BFF call
│        ├─ Read-only (GET) → SCREEN SERVICE
│        │   Mirrors BFF route group: api/screens/{screen-name}
│        │   File: services/{screen-name}.screen.service.ts
│        │
│        └─ Mutation (POST/PUT/DELETE) → DOMAIN SERVICE
│            Mirrors BFF route group: api/domains/{entity}
│            File: services/{entity}.domain.service.ts
│
└─ No → Browser / device capability → PLATFORM SERVICE
         File: services/{capability}.platform.service.ts
         Examples: clipboard, geolocation, notifications,
                   localStorage, shareSheet.
```

---

## The Three-File Contract

Every service has exactly three files:

```
src/services/
  order.domain.service.ts       ← interface + implementation (exported singleton)
  order.domain.service.mock.ts  ← mock factory used in tests
  order.domain.service.types.ts ← optional, only if non-trivial local types
```

This contract is what makes ViewModels testable. Breaking it means VMs can't be unit-tested
without real HTTP.

### Interface + Implementation

```typescript
// src/services/order.domain.service.ts

import { bffAdapter } from '@helpers/adapters/bff/bff.client';
import { Logger } from '@helpers/logger';
import { ServiceResult } from '@helpers/service-result';
import type { components } from '@helpers/adapters/bff/bff.types.gen';

type OrderDto = components['schemas']['Order'];

// Domain BO — what the VM consumes
export interface Order {
  id: string;
  status: OrderStatus;
  totalCents: number;
  placedAt: Date;
}

export interface OrderDomainService {
  cancelOrder(orderId: string): Promise<ServiceResult<Order>>;
  placeOrder(cart: Cart): Promise<ServiceResult<Order>>;
}

class OrderDomainServiceImpl implements OrderDomainService {
  async cancelOrder(orderId: string): Promise<ServiceResult<Order>> {
    try {
      const { data } = await bffAdapter.delete<OrderDto>(`/domains/orders/${orderId}`);
      return ServiceResult.success(this.toBO(data));
    } catch (err) {
      Logger.error('OrderDomainService.cancelOrder', err, { orderId });
      return ServiceResult.failure('Could not cancel this order. Please try again.');
    }
  }

  async placeOrder(cart: Cart): Promise<ServiceResult<Order>> { /* ... */ }

  private toBO(dto: OrderDto): Order {
    return {
      id: dto.id,
      status: dto.status as OrderStatus,
      totalCents: dto.total_cents,
      placedAt: new Date(dto.placed_at),
    };
  }
}

export const orderDomainService: OrderDomainService = new OrderDomainServiceImpl();
```

### Mock

```typescript
// src/services/order.domain.service.mock.ts

import { ServiceResult } from '@helpers/service-result';
import type { OrderDomainService, Order } from './order.domain.service';

export const createOrderDomainServiceMock = (
  overrides: Partial<OrderDomainService> = {},
): OrderDomainService => ({
  cancelOrder: async () =>
    ServiceResult.success({ id: 'o_1', status: 'cancelled', totalCents: 0, placedAt: new Date() }),
  placeOrder: async () =>
    ServiceResult.success({ id: 'o_1', status: 'placed', totalCents: 1999, placedAt: new Date() }),
  ...overrides,
});
```

---

## ServiceResult — The Error Boundary

Services **never throw**. They return a discriminated union.

```typescript
// src/helpers/service-result.ts
export type ServiceResult<T> =
  | { ok: true; value: T }
  | { ok: false; message: string; code?: string };

export const ServiceResult = {
  success: <T>(value: T): ServiceResult<T> => ({ ok: true, value }),
  failure: (message: string, code?: string): ServiceResult<never> =>
    ({ ok: false, message, code }),
};
```

**Rules:**
- Every async service method returns `ServiceResult<T>`
- Errors caught inside, logged with real details (via `Logger`)
- Message returned to the VM is user-safe — never the raw error
- `code` is optional, used when the VM needs to branch on specific failure types

---

## Screen Services

**One-to-one with a BFF route group.** If the BFF has `api/screens/checkout`, you have
`checkout.screen.service.ts`. Methods are GET-only.

```typescript
export interface CheckoutScreenService {
  loadSummary(cartId: string): Promise<ServiceResult<CheckoutSummary>>;
  loadSavedAddresses(): Promise<ServiceResult<Address[]>>;
}
```

**Rules:**
- GET only. If you need a mutation, it belongs in a Domain Service.
- Types: consume generated DTOs from `helpers/adapters/bff/bff.types.gen.ts`, map to BOs.
- A screen can consume multiple screen services — but each screen service mirrors exactly one
  BFF route group.

---

## Domain Services

**One-to-one with a domain entity.** `OrderDomainService`, `UserDomainService`, `CartDomainService`.

```typescript
export interface CartDomainService {
  addItem(cartId: string, item: CartItem): Promise<ServiceResult<Cart>>;
  removeItem(cartId: string, itemId: string): Promise<ServiceResult<Cart>>;
  applyPromoCode(cartId: string, code: string): Promise<ServiceResult<Cart>>;
}
```

**Rules:**
- Mutations only. If a screen just reads cart data, that's a Screen Service call.
- Optimistic updates belong in the VM (set state before calling), not here.
- Retry policy *decisions* live here; retry *execution* is the adapter's job.

---

## Platform Services

**No BFF. Wrap a browser API.** These don't follow the `ServiceResult` pattern as strictly
because many platform APIs are synchronous or event-based — but async ones still use it.

```typescript
// src/services/clipboard.platform.service.ts
export interface ClipboardService {
  copy(text: string): Promise<ServiceResult<void>>;
  read(): Promise<ServiceResult<string>>;
}

class ClipboardServiceImpl implements ClipboardService {
  async copy(text: string): Promise<ServiceResult<void>> {
    try {
      await navigator.clipboard.writeText(text);
      return ServiceResult.success(undefined);
    } catch (err) {
      Logger.error('ClipboardService.copy', err);
      return ServiceResult.failure('Could not copy to clipboard.');
    }
  }
  // ...
}
```

**Rules:**
- One service per platform capability.
- Types defined inline (no BFF to generate from).
- Every async method gets its own try/catch — browser APIs fail in weird ways (permissions,
  user rejection, unsupported browser).

---

## Adding a New Request — Checklist

When the developer says "add a new request" / "new API call":

1. **Is the downstream already wrapped by an adapter?**
   - Yes → continue
   - No → create `src/helpers/adapters/{downstream}/` first: client + generated types

2. **Regenerate types** from the OpenAPI/Swagger spec into `*.types.gen.ts`. Never hand-write.

3. **Which service does this method belong in?**
   - GET + mirrors an `api/screens/` route → Screen Service
   - Mutation + mirrors an `api/domains/` route → Domain Service
   - No BFF → Platform Service

4. **Does the service exist?**
   - Yes → add the method. Do not split into a new service per endpoint.
   - No → create using the three-file contract.

5. **Return `ServiceResult<T>`**. Catch, log, map DTO → BO.

6. **Update the mock.** Every new interface method needs a mock entry.

---

## Anti-Patterns

| Anti-pattern | Why it breaks | Fix |
|---|---|---|
| One service per endpoint | Files proliferate, business grouping lost | Group by BFF route group or domain entity |
| Service throws on 404 | VMs must try/catch every call | Return `ServiceResult.failure` with a code |
| Raw DTO leaked to VM | UI couples to backend field names | Map to BO in the service |
| Business logic in the adapter | Same logic duplicated if backend changes | Move to service |
| No mock file | VM can't be tested without real HTTP | Add `{name}.service.mock.ts` |
| Service calls another service | Dependency tangle | Orchestrate in the VM, or add a use-case layer if it repeats |
| Cross-cutting retry re-implemented per service | Copy-paste | Retry policy in the adapter (infrastructure); service decides *whether* |
