# Testing Seams — One Template per Layer (React)

> Every layer has exactly one mock boundary. Use these templates when generating tests.

---

## The Seam Map

| Layer tested | Real | Mocked |
|---|---|---|
| View | View + mock VM hook | The VM |
| ViewModel | VM + mock services + mock store | Services, selectors, navigate |
| Service | Service + mock adapter | The adapter client |
| Adapter | (skip unit tests — integration only) | n/a |

Each layer's test never crosses into the layer two steps away. VM tests never hit HTTP.
Service tests never render a view.

---

## ViewModel Tests (`renderHook`)

```typescript
// Checkout.vm.test.ts
import { renderHook, act } from '@testing-library/react';
import { useCheckoutVM } from './Checkout.vm';

jest.mock('@services/checkout.screen.service');
jest.mock('@services/order.domain.service');

import { checkoutScreenService } from '@services/checkout.screen.service';
import { orderDomainService } from '@services/order.domain.service';

describe('useCheckoutVM', () => {
  it('transitions to ready after load succeeds', async () => {
    (checkoutScreenService as any).loadSummary = async () =>
      ({ ok: true, value: { totalCents: 1999, currency: 'USD' } });

    const { result } = renderHook(() => useCheckoutVM());

    await act(() => result.current.load());

    expect(result.current.state.kind).toBe('ready');
    expect(result.current.summary).not.toBeNull();
  });

  it('surfaces error state when service fails', async () => {
    (checkoutScreenService as any).loadSummary = async () =>
      ({ ok: false, message: 'nope' });

    const { result } = renderHook(() => useCheckoutVM());
    await act(() => result.current.load());

    expect(result.current.state).toEqual({ kind: 'error', message: 'nope' });
  });

  it('dispatches order on confirm success', async () => {
    (orderDomainService as any).placeOrder = async () =>
      ({ ok: true, value: { id: 'o_1' } });

    const { result } = renderHook(() => useCheckoutVM());
    act(() => result.current.onSelectAddress('addr_1'));
    await act(() => result.current.onConfirm());

    // assert dispatched, assert navigate called
  });
});
```

**What to assert:**
- State transitions (idle → loading → ready / error)
- Derived values (`canSubmit`) after state changes
- That handlers call the right service method with the right args

**What NOT to assert:**
- Rendered output (that's a View test)
- HTTP behaviour (that's an integration test)

**Mocking the navigator and redux:**

```typescript
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

jest.mock('react-redux', () => ({
  useSelector: (sel: any) => sel(mockStore),
  useDispatch: () => jest.fn(),
}));
```

---

## Service Tests

```typescript
// order.domain.service.test.ts
import { orderDomainService } from './order.domain.service';
import { bffAdapter } from '@helpers/adapters/bff/bff.client';

jest.mock('@helpers/adapters/bff/bff.client');

describe('OrderDomainService', () => {
  it('maps DTO to Order BO on success', async () => {
    (bffAdapter.delete as jest.Mock).mockResolvedValue({
      data: { id: 'o_1', status: 'cancelled', total_cents: 0, placed_at: '2026-01-01' },
    });

    const result = await orderDomainService.cancelOrder('o_1');

    expect(result.ok).toBe(true);
    expect(result.ok && result.value.id).toBe('o_1');
    expect(result.ok && result.value.placedAt).toBeInstanceOf(Date);
  });

  it('returns ServiceResult.failure when adapter throws', async () => {
    (bffAdapter.delete as jest.Mock).mockRejectedValue(new Error('500'));

    const result = await orderDomainService.cancelOrder('o_1');

    expect(result.ok).toBe(false);
    expect(result.ok || result.message).toMatch(/Could not cancel/);
  });
});
```

**What to assert:**
- DTO → BO mapping is correct (types, date parsing, camelCase conversion)
- Error path returns `ServiceResult.failure` with a user-safe message (not the raw error)
- Logger was called with the real error on failure

---

## View Tests (`@testing-library/react`)

Views are thin — a VM-mock + a render is usually enough. Focus on the branching (loading
spinner vs error banner vs content), not on full interaction flows (those belong in the VM test).

```tsx
// Checkout.test.tsx
import { render, screen } from '@testing-library/react';
import { Checkout } from './Checkout';

jest.mock('./Checkout.vm', () => ({
  useCheckoutVM: jest.fn(),
}));

import { useCheckoutVM } from './Checkout.vm';

describe('<Checkout />', () => {
  it('renders spinner when loading', () => {
    (useCheckoutVM as jest.Mock).mockReturnValue({ state: { kind: 'loading' } });
    render(<Checkout />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders error message', () => {
    (useCheckoutVM as jest.Mock).mockReturnValue({
      state: { kind: 'error', message: 'Could not load' },
      load: jest.fn(),
    });
    render(<Checkout />);
    expect(screen.getByText('Could not load')).toBeInTheDocument();
  });
});
```

---

## Feature Reusable Tests

Same pattern as a Screen:
- VM test: unit-test the hook with mocked dependencies (`renderHook`)
- View test: render with a mock VM, assert the branch

Base reusables don't need unit tests unless they have meaningful props logic (e.g. variants).
They're validated by the screens that use them.

---

## Mediator Tests

Test each sub-VM independently with mock shared state. Test the mediator only for the wiring
(that changes in one sub-VM's output reach the next sub-VM's input).

```typescript
it('table reloads when filter changes', async () => {
  const { result } = renderHook(() => useReportsVM());

  act(() => result.current.filter.onChange({ status: 'paid' }));

  // The table sub-VM's effect should have fired
  await waitFor(() => {
    expect(result.current.table.state.kind).toBe('ready');
  });
});
```

---

## Adapter Tests

Skip unit tests. Adapters are thin HTTP wrappers — unit-testing them with mocked `axios` tests
that the mock was called, which has no value.

Instead:
- One integration test per adapter with `msw` (Mock Service Worker) or recorded cassettes
- Regenerate `*.types.gen.ts` on every backend change; if generation breaks, the schema moved —
  that's signal enough

---

## Coverage Targets (guidance, not rule)

| Layer | Target | Why |
|---|---|---|
| ViewModel | High (80%+) | Most business logic lives here; easiest to test |
| Service | High (80%+) | DTO→BO mapping is where silent bugs hide |
| View | Branches only | Full render tests are slow and brittle |
| Adapter | Integration only | Unit tests add no value |
| Base reusable | Low — visual regression instead | Props in, JSX out |

---

## Test Seam Checklist (per generated file)

After generating, confirm:

- [ ] The file under test depends only on its direct neighbour layer (VM → Service, not VM → Adapter)
- [ ] The mock for that neighbour exists and is imported in the test
- [ ] At least one success path and one failure path are covered
- [ ] No real HTTP, no real router, no real store in a unit test
- [ ] Test asserts on observable output (state, returned value) — not implementation (which private method ran)
