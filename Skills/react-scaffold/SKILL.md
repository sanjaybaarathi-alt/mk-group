---
name: "react-scaffold"
description: "Generate React feature code inside an existing project — screens, screen services, domain services, platform services, reusable components, and forms. Use when asked to create, add, generate, or build a new screen, page, view, service, component, form, or feature following MVVM conventions. Do NOT use for creating a new project from scratch — use react-init for that."

metadata:
  reference-name: ReactScaffold
---

# React Scaffold Skill

## Purpose

Generate production-ready React feature code following the MVVM architecture inside an existing project. Use this skill when an engineer asks to create a new screen, service, component, or form.

For bootstrapping a new project from scratch, use the `react-init` skill instead.

---

## How to Use This Skill

When this skill is invoked, ask the engineer what they want to build if not already stated. Then generate all required files with complete, working code. Never produce stubs or placeholders.

---

## What to Build

| Request | Where | Files |
|---|---|---|
| New full-page view | `ui/screens/{ScreenName}/` | `{ScreenName}.tsx`, `{ScreenName}.vm.ts` |
| New Screen Service (BFF read) | `services/screens/{screenName}ScreenService/` | Interface, implementation, mock |
| New Domain Service (BFF write) | `services/domains/{entity}DomainService/` | Interface, implementation, mock |
| New Platform Service (no BFF) | `services/platform/{name}Service/` | Interface, implementation, mock |
| New stateless reusable | `ui/reusables/{ComponentName}/` | `{ComponentName}.tsx` |
| New self-contained reusable | `ui/reusables/{ComponentName}/` | `{ComponentName}.tsx`, `{ComponentName}.vm.ts` |

---

## File Naming Conventions

- Screen folders: PascalCase matching screen name → `UserProfileScreen/`, `DashboardScreen/`
- Service folders: camelCase → `userProfileScreenService/`, `paymentDomainService/`, `storageService/`
- Schema file: `{ScreenName}.tsx` (View), `{ScreenName}.vm.ts` (ViewModel)
- Service files: `I{Name}Service.ts` (interface), `{Name}Service.ts` (implementation), `Mock{Name}Service.ts` (mock)

---

## Screen Template

### `{ScreenName}.tsx`
```typescript
import { use{ScreenName}ViewModel } from './{ScreenName}.vm.ts';

export const {ScreenName}Screen = () => {
  const vm = use{ScreenName}ViewModel();

  // Inline components go here (inside main function)

  if (vm.loading) return <div aria-live="polite">Loading...</div>;
  if (vm.error) return <div role="alert">{vm.error}</div>;

  return (
    <main>
      <h1>Screen Title</h1>
      {/* Screen content */}
    </main>
  );
};
```

### `{ScreenName}.vm.ts`
```typescript
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ServiceResultStatusENUM } from '@/helpers/serviceResult/serviceResultHelpers.ts';
import { Logger } from '@/helpers/logging/Logger.ts';

export const use{ScreenName}ViewModel = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const result = await someScreenService.getData();
      if (result.statusCode === ServiceResultStatusENUM.OK) {
        // setData(result.data);
      } else {
        setError(result.message);
      }
    } catch (e) {
      Logger.error('use{ScreenName}ViewModel: unexpected error', { error: (e as Error).message });
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, loadData };
};
```

Screen rules:
- ViewModel owns all state, navigation, and service calls
- View is JSX + event bindings only — no business logic
- Inline components defined inside the main function, not outside
- `useNavigate()` called in ViewModel, not in View
- Loading state uses `aria-live="polite"`, errors use `role="alert"`

---

## Screen Service Template

Three files in `services/screens/{screenName}ScreenService/`:

### `I{ScreenName}ScreenService.ts`
```typescript
import type { ServiceResult } from '@/helpers/serviceResult/serviceResultHelpers.ts';
import type { components } from '@/services/generated/bff.types.gen.ts';

type {ScreenName}ResponseDTO = components['schemas']['{SchemaName}'];

export interface I{ScreenName}ScreenService {
  get{ScreenName}(id: string): Promise<ServiceResult<{ScreenName}ResponseDTO>>;
}
```

### `{ScreenName}ScreenService.ts`
```typescript
import { bffAdapter } from '@/services/bff/BffAdapter.ts';
import type { ServiceResult } from '@/helpers/serviceResult/serviceResultHelpers.ts';
import type { components } from '@/services/generated/bff.types.gen.ts';
import type { I{ScreenName}ScreenService } from './I{ScreenName}ScreenService.ts';

type {ScreenName}ResponseDTO = components['schemas']['{SchemaName}'];

class {ScreenName}ScreenServiceImpl implements I{ScreenName}ScreenService {
  async get{ScreenName}(id: string): Promise<ServiceResult<{ScreenName}ResponseDTO>> {
    return bffAdapter.get<{ScreenName}ResponseDTO>(`/api/screens/{screen-name}/${id}`);
  }
}

export const {screenName}ScreenService = new {ScreenName}ScreenServiceImpl();
```

### `Mock{ScreenName}ScreenService.ts`
```typescript
import { adaptApiResponse } from '@/helpers/serviceResult/serviceResultHelpers.ts';
import type { ServiceResult } from '@/helpers/serviceResult/serviceResultHelpers.ts';
import type { components } from '@/services/generated/bff.types.gen.ts';
import type { I{ScreenName}ScreenService } from './I{ScreenName}ScreenService.ts';

type {ScreenName}ResponseDTO = components['schemas']['{SchemaName}'];

class Mock{ScreenName}ScreenServiceImpl implements I{ScreenName}ScreenService {
  async get{ScreenName}(id: string): Promise<ServiceResult<{ScreenName}ResponseDTO>> {
    return adaptApiResponse<{ScreenName}ResponseDTO>({
      // Mock data matching the generated DTO shape
    } as {ScreenName}ResponseDTO);
  }
}

export const mock{ScreenName}ScreenService = new Mock{ScreenName}ScreenServiceImpl();
```

Screen Service rules:
- Read-only: `bffAdapter.get()` only — never post/put/delete
- Types from `bff.types.gen.ts` — never hand-written DTOs
- Three-file contract: interface + implementation + mock
- Exported as singleton

---

## Domain Service Template

Three files in `services/domains/{entity}DomainService/`:

### `I{Entity}DomainService.ts`
```typescript
import type { ServiceResult } from '@/helpers/serviceResult/serviceResultHelpers.ts';
import type { components } from '@/services/generated/bff.types.gen.ts';

type Create{Entity}RequestDTO = components['schemas']['{CreateSchemaName}'];
type {Entity}MutationResponseDTO = components['schemas']['{MutationResponseSchemaName}'];

export interface I{Entity}DomainService {
  create{Entity}(data: Create{Entity}RequestDTO): Promise<ServiceResult<{Entity}MutationResponseDTO>>;
  update{Entity}(id: string, data: Partial<Create{Entity}RequestDTO>): Promise<ServiceResult<{Entity}MutationResponseDTO>>;
  delete{Entity}(id: string): Promise<ServiceResult<{Entity}MutationResponseDTO>>;
}
```

### `{Entity}DomainService.ts`
```typescript
import { bffAdapter } from '@/services/bff/BffAdapter.ts';
import type { ServiceResult } from '@/helpers/serviceResult/serviceResultHelpers.ts';
import type { components } from '@/services/generated/bff.types.gen.ts';
import type { I{Entity}DomainService } from './I{Entity}DomainService.ts';

type Create{Entity}RequestDTO = components['schemas']['{CreateSchemaName}'];
type {Entity}MutationResponseDTO = components['schemas']['{MutationResponseSchemaName}'];

class {Entity}DomainServiceImpl implements I{Entity}DomainService {
  async create{Entity}(data: Create{Entity}RequestDTO): Promise<ServiceResult<{Entity}MutationResponseDTO>> {
    return bffAdapter.post<{Entity}MutationResponseDTO>('/api/domains/{entities}', data);
  }

  async update{Entity}(id: string, data: Partial<Create{Entity}RequestDTO>): Promise<ServiceResult<{Entity}MutationResponseDTO>> {
    return bffAdapter.put<{Entity}MutationResponseDTO>(`/api/domains/{entities}/${id}`, data);
  }

  async delete{Entity}(id: string): Promise<ServiceResult<{Entity}MutationResponseDTO>> {
    return bffAdapter.delete<{Entity}MutationResponseDTO>(`/api/domains/{entities}/${id}`);
  }
}

export const {entity}DomainService = new {Entity}DomainServiceImpl();
```

### `Mock{Entity}DomainService.ts`
```typescript
import { adaptApiResponse } from '@/helpers/serviceResult/serviceResultHelpers.ts';
import type { ServiceResult } from '@/helpers/serviceResult/serviceResultHelpers.ts';
import type { I{Entity}DomainService } from './I{Entity}DomainService.ts';

// ... implements interface, returns mock confirmation data
```

Domain Service rules:
- Write-only: `bffAdapter.post/put/delete()` only — never get for display data
- Types from `bff.types.gen.ts`
- Three-file contract: interface + implementation + mock
- Invalidate related Screen Service caches after successful mutations

---

## Platform Service Template

Three files in `services/platform/{name}Service/`:

### `I{Name}Service.ts`
```typescript
import type { ServiceResult } from '@/helpers/serviceResult/serviceResultHelpers.ts';

// Types defined inline — no BFF types for platform services
interface {Name}Data {
  // Define the shape
}

export interface I{Name}Service {
  get{Name}(): Promise<ServiceResult<{Name}Data>>;
}
```

### `{Name}Service.ts`
```typescript
import { adaptApiResponse, serviceFailureResponse } from '@/helpers/serviceResult/serviceResultHelpers.ts';
import { Logger } from '@/helpers/logging/Logger.ts';
import type { ServiceResult } from '@/helpers/serviceResult/serviceResultHelpers.ts';
import type { I{Name}Service } from './I{Name}Service.ts';

class {Name}ServiceImpl implements I{Name}Service {
  async get{Name}(): Promise<ServiceResult<{Name}Data>> {
    try {
      // Call browser/OS API directly — NO bffAdapter
      const data = await someNativeAPI();
      return adaptApiResponse(data);
    } catch (error) {
      Logger.error('{Name}Service.get{Name} failed', { error: (error as Error).message });
      return serviceFailureResponse();
    }
  }
}

export const {name}Service = new {Name}ServiceImpl();
```

Platform Service rules:
- No BFF: does NOT import or use `bffAdapter`
- Types defined inline — not from `bff.types.gen.ts`
- Manual try-catch in every async method
- `serviceFailureResponse()` in catch blocks
- Three-file contract: interface + implementation + mock

---

## Reusable Component Template

### Stateless reusable — `ui/reusables/{ComponentName}/{ComponentName}.tsx`
```typescript
interface {ComponentName}Props {
  // Define props
}

export const {ComponentName} = ({ ...props }: {ComponentName}Props) => (
  <div>
    {/* Component content */}
  </div>
);
```

### Self-contained reusable (with ViewModel) — add `{ComponentName}.vm.ts`
```typescript
import { useState } from 'react';

export const use{ComponentName}ViewModel = () => {
  // Internal state and logic
  return { /* exposed state and handlers */ };
};
```

Only add a ViewModel when the component has its own internal state or logic. Pure display components stay as single `.tsx` files.

---

## Form ViewModel Pattern

```typescript
export const use{FormName}ViewModel = () => {
  const navigate = useNavigate();
  const [fieldName, setFieldName] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (): Promise<void> => {
    const errors: Record<string, string> = {};
    if (!fieldName.trim()) errors.fieldName = 'Field is required';
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }

    setFieldErrors({});
    setIsLoading(true);
    try {
      const result = await domainService.create({ fieldName });
      if (result.statusCode === ServiceResultStatusENUM.OK) {
        navigate('/success');
      } else {
        setError(result.message);
      }
    } catch (e) {
      Logger.error('useFormViewModel: unexpected error', { error: (e as Error).message });
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return { fieldName, setFieldName, fieldErrors, isLoading, error, handleSubmit };
};
```

Form rules:
- Validation logic in ViewModel — not in View
- Field errors stored in `Record<string, string>` state
- View uses `role="alert"` on error spans
- `isLoading` prevents double-submission
- `finally` resets `isLoading`

---

## After Generating Code

Remind the engineer to:
1. Register new screens in `Router.tsx`
2. Run `npm run generate:bff-types` if BFF schema changed
3. Create tests (use the `react-test` skill)
4. Run `npm run lint` and `npm run typecheck`
