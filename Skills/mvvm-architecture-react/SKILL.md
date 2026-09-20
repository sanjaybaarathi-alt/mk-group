---
name: mvvm-architecture-react
description: >
  MVVM architecture consultant and enforcer for React (Vite) frontend features. Fires when the
  developer is adding a new screen, service, reusable, API request, slice, or adapter — or when
  shared code shows a layer violation (logic in a View, HTTP in a ViewModel, a service throwing).
  Places the right file in the right folder, names it with the right suffix, and generates the
  minimum stubs (View `.tsx`, ViewModel `.vm.ts`, Service, Adapter, Mediator) that match the
  project's existing React scaffold. Core approach: name the layer first, then name the file.
triggers:
  # placement questions
  - "where should I put"
  - "where does this go"
  - "which layer"
  - "which folder"
  - "is this a service or"
  - "should this be in"
  # new feature flows
  - "create a new screen"
  - "add a new screen"
  - "new feature"
  - "new flow"
  - "build a form"
  - "add a page"
  - "add a route"
  # new service flows
  - "add a new service"
  - "create a screen service"
  - "create a domain service"
  - "new platform service"
  - "new API call"
  - "new request"
  - "add a new request"
  - "add an endpoint"
  - "wire up an API"
  - "call the backend"
  - "fetch data"
  # reusable flows
  - "add a reusable"
  - "promote to reusable"
  - "extract this component"
  - "base reusable"
  - "feature reusable"
  # adapter flows
  - "add an adapter"
  - "new downstream"
  - "new BFF"
  - "regenerate types"
  - "openapi"
  - "swagger"
  # store flows
  - "add a slice"
  - "redux slice"
  - "connect to store"
  - "global state"
  # MVVM keywords
  - "mvvm"
  - "view model"
  - "viewmodel"
  - "ServiceResult"
  - "mediator"
  # violations / audits
  - "this ViewModel is too big"
  - "split this ViewModel"
  - "architecture review"
  - "review my structure"
  - "am I doing this right"
  - "refactor this screen"
  - "is this right layer"
  # react-specific
  - ".vm.ts"
  - ".tsx"
  - "vite"
  - "react screen"
reads:
  - scaffold-react/references/folder-structure.md
writes: []
references:
  - references/layer-rules.md
  - references/component-classification.md
  - references/service-classification.md
  - references/viewmodel-patterns.md
  - references/testing-seams.md
---

# MVVM Architecture — React (Vite)

> Read the relevant reference files listed below before generating any code.
> The folder structure is defined by `scaffold-react` — this skill enforces what goes in it.

MVVM fails when placement is a judgment call. The goal of this skill is that every file, every
function, and every line has exactly one correct home — and the developer doesn't have to think
about it. Name the layer, then name the file.

**Platform scope:** React + Vite. Detect before running — confirm `vite` + `react` in
`package.json`. If the project uses `expo` or `react-native`, or has a `pubspec.yaml`,
this skill does not apply.

---

## Core Contract

Four layers, one-way flow. Break this and the architecture stops paying rent.

```
┌──────────────────────────────────────────────────────────┐
│ View  (.tsx)              ← JSX tree only                │
│   ↓ binds, ↑ events                                      │
│ ViewModel  (.vm.ts)       ← hook that owns state/logic   │
│   ↓ calls, ↑ ServiceResult                               │
│ Service  (screen / domain / platform)                    │
│   ↓ calls, ↑ raw DTO                                     │
│ Adapter  (helpers/adapters/{downstream}/)                │
└──────────────────────────────────────────────────────────┘

Store: Redux slices — read by ViewModels via useSelector,
       mutated only via dispatched actions from ViewModels.
```

**Hard rules — violations must be flagged on sight:**

1. Views contain no logic. No `fetch`, no `async`, no business `if`, no `useNavigate`, no store imports.
2. ViewModels contain no JSX and never import other ViewModels.
3. ViewModels never call adapters directly — always via a service.
4. Services always return `ServiceResult<T>` — never throw to caller.
5. Adapters contain no business logic — only HTTP config, headers, error normalisation.
6. Generated types (from OpenAPI) live in `helpers/adapters/{downstream}/*.types.gen.ts` — never `types/`.
7. Business types (BOs, Enums) live co-located until shared across 2+ unrelated places, then `types/`.
8. Every service has three files: interface + implementation + mock.
9. ViewModel over 500 lines → split via Mediator pattern.

---

## Mode Detection

**Consultation mode** — developer asks where something should go, what layer it belongs in, or
how to structure a feature. No code shared yet.

**Generation mode** — developer asks to create a new screen / service / reusable / adapter.
Output is file stubs in the right folders with the right suffixes.

**Audit mode** — developer shares a file path or code. Scan against the hard rules, list
violations with the rule number, and offer the fix.

Detect mode from context. If unsure, ask: "Are you placing a new thing, reviewing existing code,
or just deciding the shape?"

---

## Phase 0 — Context Detection (Silent)

Before any recommendation, establish:

1. **Confirm React.** Check `package.json` for `vite` + `react` (not `react-native`, not `expo`).
   If the project is not a React + Vite app, this skill does not apply.
2. **Folder structure loaded** — read `scaffold-react/references/folder-structure.md`.
   Use that as the source of truth for folder paths and aliases.
3. **Existing conventions** — check one existing screen / service file for naming style,
   `ServiceResult` shape, and import patterns. Match them.

---

## Phase 1 — Placement Diagnosis

Ask at most **one** diagnostic question. Pick the one that resolves the decision.

**For a new thing:**

> "What is it doing — rendering UI, holding screen state, calling the backend, talking to a
> browser API, wrapping an SDK, or sharing state across screens?"

Map answer → layer:

| Answer | Layer | Folder |
|---|---|---|
| Renders UI, reused across screens, stateless | Base reusable | `src/ui/reusables/base/` |
| Renders UI, reused, stateful (own logic/API) | Feature reusable | `src/ui/reusables/feature/` |
| Renders UI, used once inside a screen | Inline component | inside screen's main function |
| Renders a full page/route | Screen | `src/ui/screens/` |
| Holds one screen's state & handlers | ViewModel | `{Name}.vm.ts` beside screen |
| Read-only BFF call (GET) | Screen Service | `src/services/` — mirror BFF `api/screens/` |
| Mutation BFF call (POST/PUT/DELETE) | Domain Service | `src/services/` — mirror BFF `api/domains/` |
| Browser API, no BFF | Platform Service | `src/services/` |
| Low-level HTTP config, auth headers, error shape | Adapter | `src/helpers/adapters/{downstream}/` |
| Cross-screen state | Redux slice | `src/store/slices/` |
| Shared type (2+ unrelated places) | Type | `src/types/` |
| Generated from OpenAPI | Adapter types | `src/helpers/adapters/{downstream}/*.types.gen.ts` |

**For an audit:** skip the question — scan and report.

---

## Phase 2 — Generation

When the layer is confirmed, generate only the minimum required. Do not write implementations
unless asked — **stubs with the right shape** are enough for placement.

### New screen

Read `references/component-classification.md` first.

Create `src/ui/screens/{ScreenName}/` containing:

- `{ScreenName}.tsx` — View stub binding to VM
- `{ScreenName}.vm.ts` — ViewModel hook (`useXxxVM`) with state skeleton, event handlers
- `{ScreenName}.types.ts` — only if screen has non-trivial local types

Register the route in `src/Router.tsx` (never in the screen).

### New service

Read `references/service-classification.md`.

Determine Screen / Domain / Platform first. Then in `src/services/`:

- `{name}.{kind}.service.ts` — interface + implementation class + singleton export
- `{name}.{kind}.service.mock.ts` — mock factory for tests
- Types come from `src/helpers/adapters/bff/bff.types.gen.ts` for Screen/Domain — do not redeclare
- Every async method returns `ServiceResult<T>` — internal try/catch, log real error, return user-safe message

### New request (endpoint call)

1. Confirm the downstream — does an adapter exist in `src/helpers/adapters/{downstream}/`? If not, create one.
2. If the downstream publishes OpenAPI, regenerate types into `*.types.gen.ts`. Never hand-write DTOs.
3. Add the method to the existing Screen Service (GET) or Domain Service (mutation) — do not
   create a new service per endpoint.
4. Wrap in `ServiceResult<T>`.
5. Update the `.mock.ts` file.

### New reusable

Read `references/component-classification.md`. Promotion rules:

- **Inline → Base:** used in 2+ screens, stateless → move to `src/ui/reusables/base/{Name}/`
- **Base → Feature:** needs own state, API calls, or its own VM → move to `src/ui/reusables/feature/{Name}/` and add `.vm.ts`
- Base reusables never have a VM. Feature reusables always do.

### New adapter

`src/helpers/adapters/{downstream}/` contains:
- `{downstream}.client.ts` — axios singleton with base URL, interceptors, auth header injection
- `{downstream}.types.gen.ts` — generated from OpenAPI/Swagger (never edit by hand)
- No business logic. Error normalisation only. Services consume; adapters never decide.

### New Redux slice

- `src/store/slices/{feature}.slice.ts` — RTK slice
- Register in `src/store/index.ts`
- ViewModels dispatch via `useDispatch()` and select via `useSelector()` — never the View directly
- If only one ViewModel uses it, the state probably belongs in the VM, not the store

### Mediator (ViewModel > 500 lines)

Read `references/viewmodel-patterns.md`.

Split into:
- `{Screen}.vm.ts` — mediator hook: shared state, sub-VM construction
- `{Screen}.{aspect}.vm.ts` — sub-VMs by aspect (e.g. `.form.vm.ts`, `.table.vm.ts`)
- Sub-VMs receive state and setters via parameter — they never import each other
- View imports only the mediator hook

---

## Phase 3 — Violation Audit

When auditing shared code, scan against the 9 hard rules. Report format:

```
Rule #N violated in {file}:{line}
What's wrong: [one sentence]
Fix: [concrete action — move this, extract that]
```

Common violations with fixes:

| Signal | Rule | Fix |
|---|---|---|
| `fetch(` or `axios.` in `.tsx` | #1 | Move to service, call via VM |
| `useState` for business data in `.tsx` | #1 | Move state to VM |
| `useNavigate()` in `.tsx` | #1 | Call navigation from VM handler |
| `useSelector`/`useDispatch` in `.tsx` | #1 | Read/dispatch from VM |
| `import { useOtherVM }` in a `.vm.ts` | #2 | Lift shared state to store or mediator |
| `axios.get(` in `.vm.ts` | #3 | Wrap in service method returning `ServiceResult` |
| `throw` inside service | #4 | Catch, log, return `ServiceResult.failure(...)` |
| Business logic (discounts, retry policy) in adapter | #5 | Extract to service |
| Hand-written DTO type in `types/` | #6, #7 | Generate from OpenAPI into `helpers/adapters/{downstream}/*.types.gen.ts` |
| Service without `.mock.ts` | #8 | Add `{name}.service.mock.ts` |
| VM > 500 lines | #9 | Apply Mediator pattern |

---

## Phase 4 — Test Seam

After any generation, point to the test boundary:

- **View** — render test with a mocked VM hook; the VM is the only dependency.
- **ViewModel** — `renderHook` unit test; services are the only dependencies; inject the `.mock.ts`.
- **Service** — unit test; adapter is the only dependency; mock the adapter client.
- **Adapter** — integration test (or skip) — pure HTTP wrapper; rarely worth unit-testing.

See `references/testing-seams.md` for templates.

---

## Guiding Principles

1. **Placement is not a judgment call.** Every layer has a decision rule. If two rules compete,
   the one closer to the UI wins for colocation; the one closer to the data wins for sharing.

2. **Co-locate until shared.** A type used by one screen stays next to the screen. It gets
   promoted to `types/` only when a second unrelated caller appears. Same for reusables.

3. **Three-file service contract is non-negotiable.** Interface + implementation + mock. This
   is the seam that makes VMs testable — breaking it breaks the whole architecture's payoff.

4. **ServiceResult is the boundary.** Errors never cross it as exceptions. This is what keeps
   backend shapes and failure modes from leaking into the UI.

5. **Adapters are infrastructure, services are intent.** If the code describes *how* (HTTP,
   headers, retries) it's an adapter. If it describes *what the app wants* (load the user's
   orders, complete the purchase) it's a service.

6. **Start inline. Promote on second use.** Extracting too early creates abstractions for
   imagined futures. Extracting too late creates copy-paste rot. The rule: two screens need it,
   extract it. Needs its own state, add a VM.

7. **The ViewModel is the seam.** It is the only place where the full picture — state,
   navigation, services, store — comes together. Every other layer knows less. Keep it that
   way: Views know only the VM; services know only their adapter.

8. **Consistency beats theoretical purity.** If the codebase already has a slightly different
   version of one of these rules (e.g. `.viewmodel.ts` instead of `.vm.ts`), match what exists
   in this project — and flag it for a separate cleanup pass rather than silently changing it.
