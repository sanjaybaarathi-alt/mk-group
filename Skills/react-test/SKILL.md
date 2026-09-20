---
name: "react-test"
description: "Generate, create, write, or add tests for React code — ViewModels, components, screens, services, forms, and hooks. Use when asked to add test coverage, write unit tests, create integration tests, scaffold test files, test a component, test a service, add specs, or ensure something is tested. Covers Vitest, React Testing Library, MSW, and jest-axe patterns."

metadata:
  reference-name: ReactTest
---

# React Test Scaffold Skill

## Purpose

Generate complete, production-ready test files for ViewModels, components, and services. Use this skill when an engineer asks to create tests, add test coverage, or scaffold test files. Always generate tests that follow the project's testing conventions — never produce stubs or empty test blocks.

---

## What to Build

| Request | Test File Location | Key Patterns |
|---|---|---|
| ViewModel test | Same folder as `.vm.ts` | `vi.mock()` services at module level, `renderHook`, `act` |
| Screen/Component test | Same folder as `.tsx` | RTL `render`, `getByRole` priority, `userEvent` |
| Screen Service test | Same folder as service | MSW for HTTP interception |
| Domain Service test | Same folder as service | MSW for HTTP interception |
| Platform Service test | Same folder as service | Mock browser/OS APIs directly |

---

## ViewModel Test Template

Services are singletons — mock them at the module level with `vi.mock()`. Never mock `bffAdapter` directly.

```typescript
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ServiceResultStatusENUM } from '@/helpers/serviceResult/serviceResultHelpers.ts';
import { {screenName}ScreenService } from '@/services/screens/{screenName}ScreenService/{ScreenName}ScreenService.ts';
import { use{ScreenName}ViewModel } from './{ScreenName}.vm.ts';

// Mock the service at module level — singleton pattern
vi.mock('@/services/screens/{screenName}ScreenService/{ScreenName}ScreenService.ts', () => ({
  {screenName}ScreenService: {
    get{ScreenName}: vi.fn(),
  },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

describe('use{ScreenName}ViewModel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => use{ScreenName}ViewModel());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.data).toBeNull(); // or [] for lists
  });

  it('should load data and update state on success', async () => {
    const mockData = { id: '1', name: 'Test Item' };

    vi.mocked({screenName}ScreenService.get{ScreenName}).mockResolvedValue({
      statusCode: ServiceResultStatusENUM.OK,
      data: mockData,
      message: 'OK',
    });

    const { result } = renderHook(() => use{ScreenName}ViewModel());

    await act(async () => {
      await result.current.loadData('1');
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should set error message when service returns non-OK status', async () => {
    vi.mocked({screenName}ScreenService.get{ScreenName}).mockResolvedValue({
      statusCode: ServiceResultStatusENUM.NOT_FOUND,
      data: null,
      message: 'Item not found',
    });

    const { result } = renderHook(() => use{ScreenName}ViewModel());

    await act(async () => {
      await result.current.loadData('999');
    });

    expect(result.current.error).toBe('Item not found');
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('should set generic error on unexpected exception', async () => {
    vi.mocked({screenName}ScreenService.get{ScreenName}).mockRejectedValue(
      new Error('Network failure')
    );

    const { result } = renderHook(() => use{ScreenName}ViewModel());

    await act(async () => {
      await result.current.loadData('1');
    });

    expect(result.current.error).toBe('Something went wrong. Please try again.');
    expect(result.current.loading).toBe(false);
  });

  it('should reset loading state in finally block', async () => {
    vi.mocked({screenName}ScreenService.get{ScreenName}).mockRejectedValue(
      new Error('fail')
    );

    const { result } = renderHook(() => use{ScreenName}ViewModel());

    await act(async () => {
      await result.current.loadData('1');
    });

    // Loading must be false regardless of success or failure
    expect(result.current.loading).toBe(false);
  });
});
```

### ViewModel Test Rules
- Mock services with `vi.mock()` at module level — never mock `bffAdapter`
- Use `vi.mocked(service.method).mockResolvedValue()` per test
- Mock `useNavigate` from `react-router-dom` when testing navigation
- Always test: success path, service error path (non-OK statusCode), unexpected exception, loading state reset
- Use `renderHook` + `act` for async operations
- Call `vi.clearAllMocks()` in `beforeEach`

---

## Component Test Template

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { {ComponentName} } from './{ComponentName}.tsx';

describe('{ComponentName}', () => {
  const defaultProps = {
    // ... default test props
  };

  it('should render with provided data', () => {
    render(<{ComponentName} {...defaultProps} />);

    // Query priority: getByRole → getByLabelText → getByText → getByTestId
    expect(screen.getByRole('heading', { name: 'Expected Title' })).toBeInTheDocument();
    expect(screen.getByText('Expected content')).toBeInTheDocument();
  });

  it('should call handler when action button is clicked', async () => {
    const user = userEvent.setup();
    const mockHandler = vi.fn();

    render(<{ComponentName} {...defaultProps} onAction={mockHandler} />);

    // Always use userEvent — never fireEvent
    await user.click(screen.getByRole('button', { name: 'Action' }));

    expect(mockHandler).toHaveBeenCalledOnce();
  });

  it('should display error state', () => {
    render(<{ComponentName} {...defaultProps} error="Something went wrong" />);

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
  });

  it('should display loading state', () => {
    render(<{ComponentName} {...defaultProps} loading={true} />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
```

### Component Test Rules
- Query priority: `getByRole` → `getByLabelText` → `getByText` → `getByTestId` (last resort)
- Always use `@testing-library/user-event` — never `fireEvent`
- Call `userEvent.setup()` before render
- Test user-observable behaviour — not implementation details
- Test error and loading states
- Do not assert on internal state or component structure

---

## Screen Service Test Template (MSW)

```typescript
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { ServiceResultStatusENUM } from '@/helpers/serviceResult/serviceResultHelpers.ts';
import { {screenName}ScreenService } from './{ScreenName}ScreenService.ts';

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('{ScreenName}ScreenService', () => {
  it('should return data on successful GET', async () => {
    const mockResponse = { id: '1', name: 'Test' };

    server.use(
      http.get('*/api/screens/{screen-name}/1', () =>
        HttpResponse.json(mockResponse)
      )
    );

    const result = await {screenName}ScreenService.get{ScreenName}('1');

    expect(result.statusCode).toBe(ServiceResultStatusENUM.OK);
    expect(result.data).toEqual(mockResponse);
  });

  it('should return error on server failure', async () => {
    server.use(
      http.get('*/api/screens/{screen-name}/1', () =>
        new HttpResponse(null, { status: 500 })
      )
    );

    const result = await {screenName}ScreenService.get{ScreenName}('1');

    expect(result.statusCode).not.toBe(ServiceResultStatusENUM.OK);
    expect(result.data).toBeNull();
  });

  it('should return not found for missing resource', async () => {
    server.use(
      http.get('*/api/screens/{screen-name}/999', () =>
        new HttpResponse(null, { status: 404 })
      )
    );

    const result = await {screenName}ScreenService.get{ScreenName}('999');

    expect(result.statusCode).not.toBe(ServiceResultStatusENUM.OK);
  });
});
```

### Service Test Rules
- Use MSW (`msw`) to intercept HTTP at the network level — never mock axios directly
- Use `setupServer` from `msw/node` for Vitest
- Test success, server error (500), and not found (404) paths
- Verify the `ServiceResult<T>` structure: `data`, `message`, `statusCode`
- Reset handlers between tests with `server.resetHandlers()`

---

## Domain Service Test Template (MSW)

```typescript
describe('{Entity}DomainService', () => {
  it('should return confirmation on successful POST', async () => {
    const mockConfirmation = { success: true, id: '42' };

    server.use(
      http.post('*/api/domains/{entities}', () =>
        HttpResponse.json(mockConfirmation)
      )
    );

    const result = await {entity}DomainService.create{Entity}({ name: 'New Item' });

    expect(result.statusCode).toBe(ServiceResultStatusENUM.OK);
    expect(result.data).toEqual(mockConfirmation);
  });

  it('should return error on validation failure', async () => {
    server.use(
      http.post('*/api/domains/{entities}', () =>
        new HttpResponse(null, { status: 400 })
      )
    );

    const result = await {entity}DomainService.create{Entity}({ name: '' });

    expect(result.statusCode).not.toBe(ServiceResultStatusENUM.OK);
  });
});
```

---

## Platform Service Test Template

Platform services don't use MSW — mock the browser/OS APIs directly:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ServiceResultStatusENUM } from '@/helpers/serviceResult/serviceResultHelpers.ts';
import { {name}Service } from './{Name}Service.ts';

// Mock the browser API or SDK the service depends on
vi.mock('react-secure-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

describe('{Name}Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return data on success', async () => {
    const SecureStorage = (await import('react-secure-storage')).default;
    vi.mocked(SecureStorage.getItem).mockReturnValue('mock-token');

    const result = await {name}Service.get{Name}();

    expect(result.statusCode).toBe(ServiceResultStatusENUM.OK);
    expect(result.data).toBeDefined();
  });

  it('should return failure when underlying API throws', async () => {
    const SecureStorage = (await import('react-secure-storage')).default;
    vi.mocked(SecureStorage.getItem).mockImplementation(() => {
      throw new Error('Storage unavailable');
    });

    const result = await {name}Service.get{Name}();

    expect(result.statusCode).toBe(ServiceResultStatusENUM.SERVICE_EXCEPTION);
    expect(result.data).toBeNull();
  });
});
```

---

## Accessibility Test Pattern

Add to any component test file:

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

it('should have no accessibility violations', async () => {
  const { container } = render(<{ComponentName} {...defaultProps} />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

---

## Form ViewModel Test Pattern

```typescript
it('should set field errors when validation fails', async () => {
  const { result } = renderHook(() => useCreateItemViewModel());

  // Submit with empty fields
  await act(async () => {
    await result.current.handleSubmit();
  });

  expect(result.current.fieldErrors.name).toBe('Name is required');
  expect(result.current.fieldErrors.email).toBe('Enter a valid email');
  // Service should NOT have been called
  expect({entity}DomainService.create{Entity}).not.toHaveBeenCalled();
});

it('should clear field errors and submit when validation passes', async () => {
  vi.mocked({entity}DomainService.create{Entity}).mockResolvedValue({
    statusCode: ServiceResultStatusENUM.OK,
    data: { success: true, id: '1' },
    message: 'OK',
  });

  const { result } = renderHook(() => useCreateItemViewModel());

  // Fill in valid data
  act(() => {
    result.current.setName('Valid Name');
    result.current.setEmail('valid@example.com');
  });

  await act(async () => {
    await result.current.handleSubmit();
  });

  expect(result.current.fieldErrors).toEqual({});
  expect({entity}DomainService.create{Entity}).toHaveBeenCalledWith({
    name: 'Valid Name',
    email: 'valid@example.com',
  });
  expect(mockNavigate).toHaveBeenCalledWith('/success-route');
});
```

---

## After Generating Tests

Remind the engineer to:
1. Run `npx vitest run` to verify all tests pass
2. Check coverage with `npx vitest run --coverage`
3. Ensure both success and error paths are covered
4. Verify loading state resets in `finally` are tested
