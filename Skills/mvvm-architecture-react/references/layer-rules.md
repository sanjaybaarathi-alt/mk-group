# Layer Rules — The Four-Layer Contract (React)

> The canonical definition of each layer, its responsibilities, and what it must never do.
> Read this before placing any file. Rules are numbered so audits can cite them.

---

## Layer 1 — View

**Role:** Render UI. Bind to ViewModel state. Dispatch user events to the ViewModel.

**File:** `{Name}.tsx`

**Owns:**
- JSX tree
- UI-only conditionals (`if (isLoading) return <Spinner/>`)
- Inline styles, `className`, layout
- Inline components defined inside the main function (not exported)
- `useEffect` for DOM subscriptions tied to the visual lifecycle (e.g. scroll listener)

**Forbidden:**
- `fetch`, `axios`, any HTTP
- `useState` for anything other than pure UI state (hover, focus, collapse) — business state is in the VM
- `useNavigate` — navigation is a VM concern
- `useSelector` / `useDispatch` — the VM reads and dispatches
- Imports from `store/`, `services/`, `helpers/adapters/`
- Async functions, `try/catch`
- Business `if` branches (pricing rules, permission checks)
- Mapping DTOs to display strings (that's the VM's job)

**Binding pattern:**

```tsx
export function Checkout() {
  const vm = useCheckoutVM();
  if (vm.state.kind === 'loading') return <Spinner />;
  if (vm.state.kind === 'error')   return <ErrorBanner message={vm.state.message} />;
  return <CheckoutForm vm={vm} />;
}
```

---

## Layer 2 — ViewModel

**Role:** Own the screen's state, event handlers, and the orchestration of services + store.

**File:** `{Name}.vm.ts` — exports a hook `use{Name}VM`.

**Owns:**
- Local state (`useState` / `useReducer` for form values, selected tab, loading/error/data)
- Event handlers (`onSubmit`, `onSelect`, `onChangeQuantity`)
- Derived values (`useMemo`) exposed to the View (`canSubmit`, `totalLabel`)
- Service calls (await `ServiceResult`, branch on success/failure)
- Store reads (`useSelector`) and dispatches (`useDispatch`)
- Navigation (`useNavigate`) — called inside handlers as a side-effect of success

**Forbidden:**
- JSX (even conditionally)
- Importing other ViewModel hooks
- Importing adapters directly — always go through a service
- Storing state in the VM that belongs in the store (cross-screen state)
- Throwing from a handler — catch inside, surface through error state

**Size limit:** 500 lines. Past that, split with Mediator (see `viewmodel-patterns.md`).

---

## Layer 3 — Services

**Role:** Express the app's intent against data. Return `ServiceResult<T>`.

**Files:**
- `src/services/{name}.{kind}.service.ts` — interface + implementation + singleton export
- `src/services/{name}.{kind}.service.mock.ts` — mock factory

**Three kinds — pick one per service:**

| Kind | Job | Calls | Mirrors |
|---|---|---|---|
| Screen Service | Read-only data for a screen | BFF adapter `.get()` | BFF `api/screens/` |
| Domain Service | Mutations on a domain entity | BFF adapter `.post/put/delete()` | BFF `api/domains/` |
| Platform Service | Browser capability | `window.*`, `navigator.*` | n/a |

**Owns:**
- Business intent method names (`loadCheckoutSummary`, `completePurchase`)
- Mapping generated DTOs → domain BOs
- `ServiceResult` wrapping, error logging via `Logger`, user-safe message generation
- Retry policy decisions (the *what*; adapter handles the *how*)

**Forbidden:**
- Returning raw DTOs — always mapped BO
- Throwing to the caller — always catch, always return `ServiceResult`
- HTTP config (base URL, headers, interceptors) — that's the adapter's job
- Importing adapters from other downstreams unless the service genuinely spans them

**Singleton:** services are singletons — import directly in VMs. No DI container.

---

## Layer 4 — Adapters (inside `helpers/`)

**Role:** Infrastructure glue to a single external system. Exactly one per downstream.

**Folder:** `src/helpers/adapters/{downstream}/`

**Owns:**
- Axios singleton with base URL, timeout, headers, auth injection via interceptors
- Error normalisation (map HTTP status → app's error enum)
- Auto-generated types from OpenAPI/Swagger (`*.types.gen.ts`)

**Forbidden:**
- Business decisions (discount rules, eligibility, retry *policy* — policy lives in services)
- Mapping DTO → BO (that's the service's job)
- Caching (that's the service's job or a Proxy layer)
- Hand-written DTO types (always generated)

**Why `helpers/` not `services/`:** adapters are infrastructure — they describe *how to talk*
to a system. Services describe *what the app wants from* that system. Keeping them separate
means swapping the backend (v1 → v2, REST → gRPC) touches the adapter, not the services.

---

## Layer 0 — Store (Redux Toolkit slices) — crosscut

**Role:** Cross-screen state. Single source of truth for anything > one screen cares about.

**Files:** `src/store/slices/{feature}.slice.ts` (RTK) + registered in `src/store/index.ts`.

**Owns:**
- Auth state, current user, feature flags
- Any entity cached across screens (cart, current organisation, theme)
- Persisted data restored on app load

**Forbidden in the store:**
- Screen-local state (current tab, form values that don't outlive the screen)
- Derived values (compute with `useMemo` in the VM)
- Anything only one ViewModel reads — if one VM owns it, keep it in the VM

**Access rules:**
- ViewModels read via `useSelector(selector)`, mutate via `useDispatch()(action)`
- Views NEVER `useSelector` / `useDispatch` directly — always through the VM

---

## Data Flow — Canonical Path

```
User clicks button
   └─> View calls vm.onConfirmPurchase()
         └─> VM setState({ kind: 'submitting' })
         └─> VM awaits checkoutService.completePurchase(payload)
               └─> Service calls bffAdapter.post('/checkout/complete', payload)
                     └─> Adapter does HTTP, returns raw DTO or normalised error
               └─> Service maps DTO → OrderConfirmation BO
               └─> Service returns ServiceResult.success(order) | .failure(msg)
         └─> VM branches on result:
               ├─ success: VM dispatch(orderSlice.actions.add(order))
               │          VM navigate('/orders/' + order.id)
               └─ failure: VM setState({ kind: 'error', message: result.message })
   └─> View re-renders from new VM state
```

Every arrow is one-way. If a layer has to call upward, the architecture is wrong.

---

## Folder Mapping — React (Vite)

| Layer | Path |
|---|---|
| View | `src/ui/screens/{Name}/{Name}.tsx` |
| ViewModel | `src/ui/screens/{Name}/{Name}.vm.ts` |
| Base reusable | `src/ui/reusables/base/{Name}/{Name}.tsx` |
| Feature reusable | `src/ui/reusables/feature/{Name}/` (with `.tsx` + `.vm.ts`) |
| Screen Service | `src/services/{name}.screen.service.ts` |
| Domain Service | `src/services/{name}.domain.service.ts` |
| Platform Service | `src/services/{name}.platform.service.ts` |
| Adapter | `src/helpers/adapters/{downstream}/` |
| Generated DTO types | `src/helpers/adapters/{downstream}/{downstream}.types.gen.ts` |
| Store slice | `src/store/slices/{feature}.slice.ts` |
| Shared types | `src/types/` |
| Router | `src/Router.tsx` |
| Tokens | `src/assets/styles/tokens.css` |

Path aliases (from `tsconfig.json` + `vite.config.ts`):

| Alias | Resolves to |
|---|---|
| `@/` | `src/` |
| `@ui/` | `src/ui/` |
| `@services/` | `src/services/` |
| `@types/` | `src/types/` |
| `@helpers/` | `src/helpers/` |
| `@store/` | `src/store/` |
| `@assets/` | `src/assets/` |

---

## Quick Rule Reference (for audits)

1. Views contain no logic.
2. ViewModels never import other ViewModel hooks.
3. ViewModels never call adapters directly.
4. Services always return `ServiceResult<T>` — never throw.
5. Adapters contain no business logic.
6. Generated types live in `helpers/adapters/{downstream}/` — never `types/`.
7. Business types co-located until shared across 2+ places.
8. Every service: interface + implementation + mock.
9. ViewModel > 500 lines → Mediator split.
