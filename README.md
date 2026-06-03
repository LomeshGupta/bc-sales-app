# BC Sales — Business Central PWA

> Enterprise-grade Progressive Web Application for Microsoft Dynamics 365 Business Central

---

## Quick Start

```bash
npm install
cp .env.local.example .env.local   # fill in your BC credentials
npm run dev                          # http://localhost:3000
npm run build                        # production build
```

---

## Authentication Flow

```
Step 1 → POST /token            OAuth 2.0 client_credentials
Step 2 → GET  /authenticate     Validate username + password against BC custom table
Step 3 → Store auth state       Zustand + sessionStorage (30-min session)
```

## Session Management

- Session duration: **30 minutes** idle
- Token refresh: **5 min before expiry**, automatic and silent
- On expiry: auto-redirect to `/login`
- Activity events (click, keydown, scroll) reset the idle timer

---

## Folder Structure

```
src/
├── app/
│   ├── (auth)/login/          Login page
│   ├── (dashboard)/           Protected layout + 4 pages
│   │   ├── dashboard/         KPI cards, charts, activity feed
│   │   ├── sales-orders/      Table (desktop) + cards (mobile)
│   │   ├── customers/         Grid cards + detail drawer
│   │   └── reports/           Report cards + generate action
│   ├── offline/               PWA offline fallback
│   └── layout.tsx             Root layout with all providers
├── components/                Reusable UI components
├── services/api/              Axios client + BC API services
├── services/auth/             OAuth token + login logic
├── store/                     Zustand stores (auth, theme, app)
├── hooks/                     React Query hooks + PWA hook
├── providers/                 Theme, Query, Auth, Snackbar
├── theme/                     MUI v9 theme configuration
├── types/                     TypeScript interfaces
└── utils/                     Formatters and helpers
public/
├── manifest.json              PWA manifest
└── service-worker.js          Offline caching strategies
```

---

## Tech Stack

| Layer | Package |
|-------|---------|
| Framework | Next.js 15 App Router |
| UI | MUI v9 |
| State | Zustand 5 |
| API Cache | React Query 5 |
| HTTP | Axios |
| Animation | Framer Motion |
| Charts | Recharts |
| Types | TypeScript 5 |
| PWA | Custom Service Worker |

---

## Environment Variables

```env
NEXT_PUBLIC_BC_TENANT_ID=        # Azure AD Tenant ID
NEXT_PUBLIC_BC_CLIENT_ID=        # App Registration Client ID
NEXT_PUBLIC_BC_CLIENT_SECRET=    # Client Secret
NEXT_PUBLIC_BC_API_BASE_URL=https://api.businesscentral.dynamics.com/v2.0
NEXT_PUBLIC_BC_COMPANY_ID=       # BC Company ID
NEXT_PUBLIC_BC_SCOPE=https://api.businesscentral.dynamics.com/.default
```

---

## PWA Installation

- **Android**: Chrome menu → Add to Home Screen
- **iOS**: Safari Share → Add to Home Screen
- **Desktop**: Address bar install icon (Chrome/Edge)

---

## Phase 2 Roadmap

- Sales order / customer creation forms
- Item catalog and inventory module
- Purchase orders
- Offline CRUD with background sync
- Push notifications
- Power BI embedded reports
- Custom report builder
- Multi-company support
