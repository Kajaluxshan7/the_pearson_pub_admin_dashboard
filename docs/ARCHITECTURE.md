# Admin Dashboard (Vite + React) Architecture

This document defines an improved, scalable structure for the React (Vite) admin app.

## Goals

- Feature-first organization for vertical slices (users, menu, events, etc.)
- Shared UI separated from feature-specific components
- Centralized routing, providers, and HTTP client
- Predictable locations for types, hooks, and services

## Target Folder Structure

```
src/
  main.tsx
  app/
    App.tsx
    routes/
      index.tsx            # central route config (react-router)
    providers/
      theme.tsx            # MUI theme provider
      query.tsx            # react-query provider (optional)
    layout/
      DefaultLayout.tsx
    config/
      permissions.ts       # RBAC / role mappings
  features/
    users/
      pages/
      components/
      hooks/
      services/
      types/
      routes.tsx           # feature routes
    menu/
    events/
    auth/
  shared/
    components/
      ui/                  # generic UI (buttons, tables, forms)
    hooks/                 # cross-feature hooks
    utils/
    services/
      httpClient.ts        # axios instance & interceptors
    types/
  assets/
    styles/
  lib/                    # pure helpers (formatting, parsing)
  test/
    unit/
    e2e/
```

## Routing Strategy (react-router)

`src/app/routes/index.tsx`:

```tsx
import { createBrowserRouter } from "react-router-dom";
import DefaultLayout from "../layout/DefaultLayout";
import UsersRoutes from "../../features/users/routes";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <DefaultLayout />,
    children: [...UsersRoutes],
  },
]);
```

## HTTP Client Example

`src/shared/services/httpClient.ts`:

```ts
import axios from "axios";

export const http = axios.create({ baseURL: import.meta.env.VITE_API_BASE });

http.interceptors.request.use((cfg) => {
  // attach token if available
  return cfg;
});

http.interceptors.response.use(
  (r) => r,
  (err) => Promise.reject(err)
);
```

## Migration Steps (PowerShell)

Run from `the_pearson_pub_admin_dashboard/` root.

```powershell
# 1) Create directories
mkdir "src\app\routes" -Force
mkdir "src\app\providers" -Force
mkdir "src\app\layout" -Force
mkdir "src\app\config" -Force
mkdir "src\features\users\components" -Force
mkdir "src\features\users\pages" -Force
mkdir "src\features\users\services" -Force
mkdir "src\features\users\hooks" -Force
mkdir "src\features\users\types" -Force
mkdir "src\shared\components\ui" -Force
mkdir "src\shared\hooks" -Force
mkdir "src\shared\utils" -Force
mkdir "src\shared\services" -Force
mkdir "src\shared\types" -Force
mkdir "src\lib" -Force
mkdir "src\test\unit" -Force
mkdir "src\test\e2e" -Force

# 2) Create HTTP client placeholder if missing
if (!(Test-Path "src\shared\services\httpClient.ts")) { New-Item -ItemType File -Path "src\shared\services\httpClient.ts" | Out-Null }
```

## After the Move

- Update imports in `main.tsx`, `App.tsx`, and feature code as needed.
- Add `router` provider in `main.tsx` using `RouterProvider`.
- Migrate one feature at a time (e.g., users) to the new structure.

## Notes

Perform moves incrementally, verifying build after each batch. Keep commits small for easy rollback.
