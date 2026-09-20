---
name: "react-init"
description: "Scaffold a new React project from scratch with Vite, TypeScript, MVVM architecture, Redux Toolkit, React Router, BFF adapter, logging, environment validation, Tailwind, testing setup, and pre-commit hooks. Activate when engineers ask to initialise, bootstrap, create, set up, or start a new React project, a new frontend app, a new web app, or say things like 'I want to start fresh', 'set up a new React app', 'create a new project from scratch', 'init a new frontend', or 'spin up a new React project'."

metadata:
  reference-name: ReactInit
---

# React Init Skill

## Purpose

Scaffold a brand-new React project from scratch. This skill creates a minimal, production-ready MVVM project structure with Vite + TypeScript, Redux Toolkit, React Router, BFF adapter, Logger, ServiceResult pattern, Tailwind, testing setup, and pre-commit hooks — so the engineer can `npm run dev` immediately.

---

## How to Use This Skill

When this skill is invoked, ask the engineer for a project name (or use a sensible default). Then execute the steps below to create a fully working React starter project. Every file must be complete and runnable — no stubs, no TODOs.

---

## What Gets Created

```
{project-name}/
├── .env
├── .env.local                            # gitignored
├── .gitignore
├── .prettierrc
├── .prettierignore
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
└── src/
    ├── App.tsx
    ├── app.css
    ├── main.tsx
    ├── vite-env.d.ts
    ├── test/setup.ts
    ├── helpers/
    │   ├── config/envValidation.ts
    │   ├── logging/Logger.ts
    │   ├── logging/IExternalLogger.ts
    │   └── serviceResult/serviceResultHelpers.ts
    ├── services/
    │   ├── bff/BffAdapter.ts
    │   └── generated/                    # empty — populated by generate:bff-types
    ├── store/
    │   ├── store.ts
    │   ├── hooks.ts
    │   └── slices/                       # empty — add slices as needed
    ├── types/                            # empty — add BO/ENUM modules as needed
    └── ui/
        ├── navigations/Router.tsx
        ├── screens/HomeScreen/
        │   ├── HomeScreen.tsx
        │   └── HomeScreen.vm.ts
        └── reusables/PageHeader/
            └── PageHeader.tsx
```

---

## Step-by-Step Scaffold Process

### Step 1: Create and Install

```bash
npm create vite@latest {project-name} -- --template react-ts
cd {project-name}

# Runtime
npm install react-router-dom @reduxjs/toolkit react-redux axios dompurify

# Styling — Tailwind for utilities, sass for last-resort custom styles
npm install -D tailwindcss @tailwindcss/vite sass

# Dev — testing
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom msw jest-axe @types/jest-axe

# Dev — linting, formatting, pre-commit
npm install -D eslint @eslint/js typescript-eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-import eslint-plugin-jsx-a11y prettier eslint-config-prettier eslint-plugin-prettier @trivago/prettier-plugin-sort-imports husky lint-staged

# Dev — BFF type generation
npm install -D openapi-typescript
```

### Step 2: Clean Up Vite Boilerplate

Delete: `src/App.css`, `src/index.css`, `src/assets/react.svg`, `public/vite.svg`.
Replace `src/App.tsx` and `src/main.tsx` with the versions below.

### Step 3: Create Directory Structure + Files

Generate exactly these files — nothing else. Every file has a complete implementation.

### File Contents

#### `src/vite-env.d.ts`
```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BFF_BASE_URL: string;
  readonly VITE_BFF_API_KEY: string;
  readonly VITE_APP_VERSION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

#### `src/helpers/config/envValidation.ts`
```typescript
const REQUIRED_ENV_VARS = ['VITE_BFF_BASE_URL', 'VITE_APP_VERSION'] as const;

export const validateEnvironment = (): void => {
  const missing = REQUIRED_ENV_VARS.filter((key) => !import.meta.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};
```

#### `src/helpers/logging/IExternalLogger.ts`
```typescript
export interface IExternalLogger {
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
  debug(message: string, context?: Record<string, unknown>): void;
}
```

#### `src/helpers/logging/Logger.ts`
```typescript
import type { IExternalLogger } from './IExternalLogger.ts';

class LoggerService {
  private externalLoggers: IExternalLogger[] = [];

  addExternalLogger(logger: IExternalLogger): void {
    this.externalLoggers.push(logger);
  }

  info(message: string, context?: Record<string, unknown>): void {
    console.info(message, context);
    this.forward('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    console.warn(message, context);
    this.forward('warn', message, context);
  }

  error(message: string, context?: Record<string, unknown>): void {
    console.error(message, context);
    this.forward('error', message, context);
  }

  debug(message: string, context?: Record<string, unknown>): void {
    console.debug(message, context);
    this.forward('debug', message, context);
  }

  private forward(level: keyof IExternalLogger, message: string, context?: Record<string, unknown>): void {
    this.externalLoggers.forEach((logger) => {
      try { logger[level](message, context); } catch { /* silent */ }
    });
  }
}

export const Logger = new LoggerService();
```

#### `src/helpers/serviceResult/serviceResultHelpers.ts`
```typescript
export enum ServiceResultStatusENUM {
  OK = 'OK',
  NOT_FOUND = 'NOT_FOUND',
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  SERVICE_EXCEPTION = 'SERVICE_EXCEPTION',
}

export interface ServiceResult<T> {
  data: T | null;
  message: string;
  statusCode: ServiceResultStatusENUM;
}

export const adaptApiResponse = <T>(data: T, message = 'OK'): ServiceResult<T> => ({
  data, message, statusCode: ServiceResultStatusENUM.OK,
});

export const serviceFailureResponse = <T>(
  data: T | null = null,
  message = 'An unexpected error occurred',
  statusCode = ServiceResultStatusENUM.SERVICE_EXCEPTION,
): ServiceResult<T> => ({ data, message, statusCode });
```

#### `src/services/bff/BffAdapter.ts`
```typescript
import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { Logger } from '@/helpers/logging/Logger.ts';
import { adaptApiResponse, serviceFailureResponse } from '@/helpers/serviceResult/serviceResultHelpers.ts';
import type { ServiceResult } from '@/helpers/serviceResult/serviceResultHelpers.ts';

class BffAdapter {
  private readonly client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_BFF_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'x-client-type': 'web',
        'x-client-version': import.meta.env.VITE_APP_VERSION,
      },
    });

    this.client.interceptors.request.use((config) => {
      config.headers = {
        ...config.headers,
        'x-request-id': crypto.randomUUID(),
        'x-correlation-id': crypto.randomUUID(),
        'x-api-key': import.meta.env.VITE_BFF_API_KEY ?? '',
      };
      return config;
    });
  }

  async get<T>(path: string, params?: Record<string, unknown>): Promise<ServiceResult<T>> {
    try {
      const response = await this.client.get<T>(path, { params });
      return adaptApiResponse<T>(response.data);
    } catch (error) {
      Logger.error('BffAdapter.get failed', { path, error: (error as Error).message });
      return serviceFailureResponse<T>();
    }
  }

  async post<T>(path: string, body: unknown): Promise<ServiceResult<T>> {
    try {
      const response = await this.client.post<T>(path, body);
      return adaptApiResponse<T>(response.data);
    } catch (error) {
      Logger.error('BffAdapter.post failed', { path, error: (error as Error).message });
      return serviceFailureResponse<T>();
    }
  }

  async put<T>(path: string, body: unknown): Promise<ServiceResult<T>> {
    try {
      const response = await this.client.put<T>(path, body);
      return adaptApiResponse<T>(response.data);
    } catch (error) {
      Logger.error('BffAdapter.put failed', { path, error: (error as Error).message });
      return serviceFailureResponse<T>();
    }
  }

  async delete<T>(path: string): Promise<ServiceResult<T>> {
    try {
      const response = await this.client.delete<T>(path);
      return adaptApiResponse<T>(response.data);
    } catch (error) {
      Logger.error('BffAdapter.delete failed', { path, error: (error as Error).message });
      return serviceFailureResponse<T>();
    }
  }
}

export const bffAdapter = new BffAdapter();
```

#### `src/store/store.ts`
```typescript
import { configureStore } from '@reduxjs/toolkit';

export const store = configureStore({
  reducer: {
    // Add slices here as needed
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: { ignoredActions: [] } }),
  devTools: import.meta.env.MODE !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

#### `src/store/hooks.ts`
```typescript
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '@/store/store.ts';

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
```

#### `src/ui/navigations/Router.tsx`
```typescript
import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HomeScreen } from '@/ui/screens/HomeScreen/HomeScreen.tsx';

export const Router = (): ReactNode => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<HomeScreen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);
```

#### `src/ui/reusables/PageHeader/PageHeader.tsx`
```typescript
interface PageHeaderProps {
  title: string;
}

export const PageHeader = ({ title }: PageHeaderProps): ReactNode => (
  <header>
    <h1>{title}</h1>
  </header>
);
```

#### `src/ui/screens/HomeScreen/HomeScreen.vm.ts`
```typescript
import { useState } from 'react';

export const useHomeScreenViewModel = () => {
  const [greeting] = useState('Welcome to the app');

  return { greeting };
};
```

#### `src/ui/screens/HomeScreen/HomeScreen.tsx`
```typescript
import { PageHeader } from '@/ui/reusables/PageHeader/PageHeader.tsx';
import { useHomeScreenViewModel } from './HomeScreen.vm.ts';

export const HomeScreen = () => {
  const vm = useHomeScreenViewModel();

  return (
    <main>
      <PageHeader title={vm.greeting} />
      <p>Project scaffolded. Start building screens and services.</p>
    </main>
  );
};
```

#### `src/App.tsx`
```typescript
import { Provider } from 'react-redux';
import { store } from '@/store/store.ts';
import { Router } from '@/ui/navigations/Router.tsx';

export const App = () => (
  <Provider store={store}>
    <Router />
  </Provider>
);
```

#### `src/main.tsx`
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { validateEnvironment } from '@/helpers/config/envValidation.ts';
import { App } from '@/App.tsx';
import './app.css';

validateEnvironment();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

### Step 4: Config Files

#### `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "exactOptionalPropertyTypes": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src"]
}
```

#### `vite.config.ts`
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
});
```

#### `vitest.config.ts`
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  test: { environment: 'jsdom', globals: true, setupFiles: ['./src/test/setup.ts'] },
});
```

#### `src/test/setup.ts`
```typescript
import '@testing-library/jest-dom/vitest';
```

#### `.prettierrc`
```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always",
  "endOfLine": "lf",
  "plugins": ["@trivago/prettier-plugin-sort-imports"],
  "importOrder": ["^react", "^react-router-dom", "<THIRD_PARTY_MODULES>", "^@/(.*)$", "^[./]"],
  "importOrderSeparation": true,
  "importOrderSortSpecifiers": true
}
```

#### `.prettierignore`
```
dist/
node_modules/
src/services/generated/
*.gen.ts
```

#### `src/app.css` (Tailwind base import)
```css
@import "tailwindcss";
```

#### `.env`
```
VITE_APP_VERSION=0.1.0
```

#### `.env.local` (gitignored)
```
VITE_BFF_BASE_URL=http://localhost:3000
VITE_BFF_API_KEY=
```

Add to `.gitignore`:
```
.env.local
.env.*.local
```

#### `package.json` scripts (merge into existing)
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint . --max-warnings=0",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "generate:bff-types": "openapi-typescript $VITE_BFF_BASE_URL/docs/json -o src/services/generated/bff.types.gen.ts"
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix --max-warnings=0", "prettier --write"],
    "*.{json,css,md}": ["prettier --write"]
  }
}
```

### Step 5: Init Pre-commit

```bash
npx husky init
# Then set .husky/pre-commit content to: npx lint-staged
```

### Post-Scaffold

Verify: `npm run dev` starts, `npm run typecheck` passes, `npm run lint` passes. The project is ready — add screens, services, and slices as needed.

---

## Architecture Essentials Demonstrated

The scaffolded project demonstrates these key React MVVM principles:

1. MVVM separation — HomeScreen.tsx (View) + HomeScreen.vm.ts (ViewModel)
2. BffAdapter — centralised HTTP client with interceptors, ServiceResult pattern, Logger integration
3. ServiceResult pattern — typed success/failure responses, no thrown errors from services
4. Logger — structured logging with external logger support (Sentry, Datadog, etc.)
5. Environment validation — fails fast on missing required env vars
6. Redux store — typed hooks (useAppDispatch, useAppSelector), ready for slices
7. Router — centralised route registration
8. Tailwind via Vite plugin — no config file needed for starter
9. Testing setup — Vitest + RTL + jest-dom + MSW ready
10. Pre-commit hooks — Husky + lint-staged, zero-warning policy

---

## After Scaffolding — Next Steps

Suggest these to the engineer:

1. Add screens using the `react-scaffold` skill
2. Add services (Screen, Domain, Platform) using the `react-scaffold` skill
3. Configure ESLint rules using the `react-linter` skill
4. Write tests using the `react-test` skill
5. Run `npm run generate:bff-types` once the BFF is running to generate typed DTOs

---

## Commands Reference

| Command | What it does |
|---|---|
| `npm run dev` | Starts Vite dev server with HMR |
| `npm run build` | Type-checks then builds for production |
| `npm run typecheck` | Type-checks without emitting files |
| `npm run lint` | Lints with zero-warning policy |
| `npm run test` | Runs tests once (no watch) |
| `npm run test:coverage` | Runs tests with coverage report |
| `npm run generate:bff-types` | Generates TypeScript types from BFF OpenAPI spec |
