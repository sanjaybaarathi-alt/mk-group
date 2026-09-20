# ViewModel Patterns — Contract, Async State, and Mediator (React)

> How ViewModels are structured, what state shape they own, and how to split them when they grow.

---

## The ViewModel Contract

A ViewModel exposes three things to the View:

1. **State** — the values the View binds to
2. **Derived values** — computed from state, not stored
3. **Handlers** — functions the View calls on user events

A React ViewModel is a **hook** (`use{Name}VM`) colocated with the screen. It reads services,
selectors, and the navigator, orchestrates them, and returns a plain object.

### Hook-as-VM pattern

```typescript
// src/ui/screens/Checkout/Checkout.vm.ts
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { checkoutScreenService } from '@services/checkout.screen.service';
import { orderDomainService } from '@services/order.domain.service';

export function useCheckoutVM() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cart = useSelector(selectCart);

  const [summary, setSummary] = useState<CheckoutSummary | null>(null);
  const [state, setState] = useState<AsyncState>({ kind: 'idle' });
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => !!selectedAddressId && state.kind !== 'submitting',
    [selectedAddressId, state.kind],
  );

  async function load() {
    setState({ kind: 'loading' });
    const result = await checkoutScreenService.loadSummary(cart.id);
    if (result.ok) {
      setSummary(result.value);
      setState({ kind: 'ready' });
    } else {
      setState({ kind: 'error', message: result.message });
    }
  }

  async function onConfirm() {
    if (!canSubmit) return;
    setState({ kind: 'submitting' });
    const result = await orderDomainService.placeOrder(cart);
    if (result.ok) {
      dispatch(orderSlice.actions.add(result.value));
      navigate(`/orders/${result.value.id}`);
    } else {
      setState({ kind: 'error', message: result.message });
    }
  }

  return {
    summary, state, selectedAddressId, canSubmit,
    load, onSelectAddress: setSelectedAddressId, onConfirm,
  };
}
```

---

## Async State Shape

The single most common mistake is scattering `isLoading`, `error`, `data` as independent
booleans. They drift. Model async state as a tagged union.

```typescript
type AsyncState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ready' }
  | { kind: 'submitting' }
  | { kind: 'error'; message: string };
```

The View then does an exhaustive switch:

```tsx
switch (vm.state.kind) {
  case 'idle':
  case 'loading': return <Spinner />;
  case 'error':   return <ErrorBanner message={vm.state.message} onRetry={vm.load} />;
  case 'ready':
  case 'submitting': return <CheckoutForm vm={vm} />;
}
```

**Why this matters:** impossible states (`isLoading: true` + `error: 'x'` + `data: [...]`) become
unrepresentable. The View renders one branch, not three flags.

---

## Derived Values

Compute with `useMemo`. Never store derived values as state — they drift from their sources.

```typescript
const totalLabel = useMemo(
  () => formatCurrency(summary?.totalCents ?? 0, summary?.currency ?? 'USD'),
  [summary],
);

const visibleItems = useMemo(
  () => items.filter(i => i.status !== 'archived'),
  [items],
);
```

---

## Navigation

Navigation is a VM concern. Handlers decide when to navigate as a side-effect of success.

```typescript
const navigate = useNavigate();
// inside a handler:
if (result.ok) navigate(`/orders/${result.value.id}`);
```

The View never calls `navigate()` directly.

---

## Store Integration

ViewModels read via `useSelector` and dispatch via `useDispatch`. Views never do either.

```typescript
// VM
const user = useSelector(selectCurrentUser);
const dispatch = useDispatch();
// ...
dispatch(cartSlice.actions.clear());
```

**When to put state in the store vs the VM:**
- Only one screen cares about it → VM (`useState`)
- Survives unmounting and appears elsewhere → store
- Persisted / hydrated on app load → store

---

## Mediator Pattern — Splitting a Big VM

When a ViewModel crosses 500 lines, it usually has multiple independent concerns. Apply Mediator.

### When to apply

- File > 500 lines
- The VM has 3+ unrelated responsibility clusters (e.g. a filter panel, a table, a bulk-action
  toolbar, an export dialog)
- Test setup has grown to hundreds of lines of mock wiring

### Structure

```
src/ui/screens/Reports/
  Reports.tsx                ← View, consumes ONLY the mediator
  Reports.vm.ts              ← Mediator: shared state + sub-VM construction
  Reports.filter.vm.ts       ← Sub-VM: filter panel state + handlers
  Reports.table.vm.ts        ← Sub-VM: table data, pagination, sorting
  Reports.export.vm.ts       ← Sub-VM: export dialog state
```

### Rules

1. **Mediator owns shared state.** Anything two sub-VMs need (e.g. current filter → drives table query).
2. **Sub-VMs receive state + setters by parameter.** They never import each other.
3. **Sub-VMs expose their slice as an object.** Mediator composes: `{ filter, table, export }`.
4. **View imports only the mediator.** `const vm = useReportsVM()` then `vm.filter.onChange(...)`.

### Example

```typescript
// Reports.vm.ts — mediator
export function useReportsVM() {
  const [filter, setFilter] = useState<FilterValue>(defaultFilter);
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);

  const filterVM = useReportsFilterVM({ filter, setFilter });
  const tableVM  = useReportsTableVM({ filter, selectedRowIds, setSelectedRowIds });
  const exportVM = useReportsExportVM({ filter, selectedRowIds });

  return { filter: filterVM, table: tableVM, export: exportVM };
}
```

```typescript
// Reports.table.vm.ts — sub-VM
export function useReportsTableVM({ filter, selectedRowIds, setSelectedRowIds }: Deps) {
  const [rows, setRows] = useState<Row[]>([]);
  const [state, setState] = useState<AsyncState>({ kind: 'idle' });

  useEffect(() => {
    (async () => {
      setState({ kind: 'loading' });
      const result = await reportsScreenService.load(filter);
      if (result.ok) { setRows(result.value); setState({ kind: 'ready' }); }
      else           { setState({ kind: 'error', message: result.message }); }
    })();
  }, [filter]);

  return { rows, state, selectedRowIds, toggleRow: (id: string) => /* ... */ };
}
```

### What the mediator does NOT do

- Transform data for the View — sub-VMs own their own derived values
- Handle events that belong to one sub-VM — pass through to the right sub-VM
- Call services — that's the sub-VM's job

If the mediator starts doing these, the split is wrong.

---

## Common ViewModel Mistakes

| Mistake | Symptom | Fix |
|---|---|---|
| Boolean soup | `isLoading`, `error`, `data` as separate state | Tagged `AsyncState` union |
| Derived values stored | `totalLabel` in `useState` | `useMemo` |
| JSX in the VM | Returns JSX from a handler | Move to View, pass the data via state |
| VM imports another VM hook | `import { useOtherVM } from '../Other/Other.vm'` | Lift state to store or mediator |
| Navigation in View | `navigate()` in `onClick` handler | Handler lives in VM |
| Service choice in View | `if (x) serviceA.foo() else serviceB.bar()` | VM decides, View just calls `vm.onFoo()` |
| `useDispatch` in View | `useDispatch()` in the `.tsx` | Dispatch from VM |
| Global singleton reached at call time | `import { currentUser }` inside a handler | Inject via selector at VM top |
| VM > 500 lines | File hard to navigate | Mediator split |
