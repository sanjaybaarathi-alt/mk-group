# Component Classification — Inline → Base → Feature (React)

> The decision tree for where a piece of UI lives.

---

## Four Kinds of Component

| Kind | Location | Has VM? | Reused? | Stateful? |
|---|---|---|---|---|
| **Inline** | Inside the screen's main function | No | No | No |
| **Screen** | `src/ui/screens/{Name}/` | Always | No (it IS a screen) | Yes |
| **Base reusable** | `src/ui/reusables/base/{Name}/` | Never | Yes | No (stateless) |
| **Feature reusable** | `src/ui/reusables/feature/{Name}/` | Always | Yes | Yes |

---

## Decision Tree

```
Is it a full page / route?
├─ Yes → SCREEN
│         src/ui/screens/{Name}/ + {Name}.tsx + {Name}.vm.ts
│
└─ No → Is it reused across multiple screens?
         ├─ No → INLINE
         │        Declared inside the screen's main component function.
         │        No separate file. Not exported.
         │
         └─ Yes → Does it need its own state, API calls, or logic?
                   ├─ No → BASE REUSABLE
                   │        src/ui/reusables/base/{Name}/
                   │        {Name}.tsx + {Name}.types.ts
                   │        Pure props in → JSX out. No VM.
                   │
                   └─ Yes → FEATURE REUSABLE
                            src/ui/reusables/feature/{Name}/
                            {Name}.tsx + {Name}.vm.ts
                            Has its own VM. Can call services.
```

---

## Inline Components

Defined inside the screen's main component function:

```tsx
// src/ui/screens/Checkout/Checkout.tsx
export function Checkout() {
  const vm = useCheckoutVM();

  // Inline — only used here, not worth extracting
  const OrderRow = ({ item }: { item: OrderItem }) => (
    <div className="flex justify-between">
      <span>{item.label}</span>
      <span>{item.price}</span>
    </div>
  );

  return (
    <div>
      {vm.items.map(item => <OrderRow key={item.id} item={item} />)}
    </div>
  );
}
```

**When to promote out of inline:**
- Used by a second screen → Base reusable
- Grows past ~30 lines of JSX → Base reusable (file-level readability)
- Needs its own state that isn't part of the parent VM → Feature reusable

---

## Base Reusables

Stateless building blocks. Props go in, UI comes out. No `useState` beyond pure UI concerns
(hover, collapsed, focused). No `useEffect` for data. No services.

Examples: `Button`, `Input`, `Badge`, `Card`, `Modal`, `Skeleton`, `Divider`, `Avatar`.

```tsx
// src/ui/reusables/base/Badge/Badge.tsx
import { BadgeProps } from './Badge.types';

export function Badge({ variant = 'neutral', children }: BadgeProps) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}
```

```tsx
// src/ui/reusables/base/Badge/Badge.types.ts
export type BadgeVariant = 'neutral' | 'success' | 'warning' | 'danger';

export interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
}
```

**Red flags that mean it's no longer a base reusable:**
- Starts fetching data
- Needs a `useEffect` that isn't for DOM subscriptions
- Takes a service as a prop
- → Promote to Feature reusable

---

## Feature Reusables

Stateful components with their own ViewModel. Can call services. Can have their own loading/error state.

Examples: `SearchableDropdown`, `DataTable`, `FileUploader`, `CommentThread`, `AddressAutocomplete`.

```tsx
// src/ui/reusables/feature/SearchableDropdown/SearchableDropdown.tsx
import { useSearchableDropdownVM } from './SearchableDropdown.vm';

export function SearchableDropdown({ onSelect, loadOptions }: Props) {
  const vm = useSearchableDropdownVM({ loadOptions });
  return (/* ... */);
}
```

```tsx
// src/ui/reusables/feature/SearchableDropdown/SearchableDropdown.vm.ts
export function useSearchableDropdownVM({ loadOptions }: Deps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Option[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const search = useDebouncedCallback(async (q: string) => {
    setIsLoading(true);
    const result = await loadOptions(q);
    if (result.ok) setResults(result.value);
    setIsLoading(false);
  }, 300);

  return { query, setQuery, results, isLoading, onChange: search };
}
```

**Contract with the parent:**
- Parent passes in the data source as a function (`loadOptions`), not a service directly
- Parent subscribes to results via `onSelect` callback
- The feature reusable's VM never reaches into the parent's state

---

## Promotion Path

The default path. Start small, promote when justified:

```
1. Write inline inside the screen.
2. Second screen needs it? → Move to src/ui/reusables/base/{Name}/.
3. Needs its own state/data? → Add {Name}.vm.ts, move to src/ui/reusables/feature/{Name}/.
4. Becomes a full page? → Move to src/ui/screens/{Name}/ and register in Router.tsx.
```

**Never skip steps forward.** A component that starts as a Base reusable on day 1 without
being inline first usually has imagined requirements baked in. Extract when the second use
appears — not before.

**Demote is OK.** If a Feature reusable's VM shrinks to nothing (state moved to a shared store,
logic extracted to a service), demote it to a Base reusable by deleting the VM.

---

## Common Mistakes

| Mistake | Symptom | Fix |
|---|---|---|
| Base reusable imports a service | `import { productService }` in `Button.tsx` | This is actually a Feature reusable — move it |
| Feature reusable without VM | State scattered in component body | Extract to `{Name}.vm.ts` |
| Inline extracted too early | File with one 5-line component used once | Inline it back into the parent |
| Screen without VM | `useState` + `fetch` in the screen `.tsx` | Extract to `{Screen}.vm.ts` |
| Inline component grows past 50 lines | Screen `.tsx` becomes unreadable | Promote to base reusable |
| Props drilling through 3+ levels | Passing same prop through wrappers | Either lift state to VM, or use a feature reusable with its own data source |

---

## Implementation Notes

- Base reusables: accept props, optionally `children`. Use `forwardRef` only when the parent
  needs the DOM node (focus management, measurements).
- Feature reusables: expose a hook `use{Name}VM` alongside the component. The hook is the VM.
- Default export nothing — always named exports so import-site grep works reliably.

---

## Quick Classification Prompt

When uncertain, ask:

1. **Is it used in more than one screen today?** No → inline.
2. **Does it own any state that changes over time?** No → base reusable.
3. **Does that state come from an API or persist across remounts?** Yes → feature reusable with VM.
4. **Is it addressable as a URL?** Yes → screen.
