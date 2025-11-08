# LinkShort - Frontend Application

> Modern URL Shortener with Advanced Analytics - Frontend built with Next.js 16, TypeScript, and Tailwind CSS

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8)](https://tailwindcss.com/)

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Features Implemented](#features-implemented)
4. [Tech Stack](#tech-stack)
5. [Project Structure](#project-structure)
6. [Setup & Installation](#setup--installation)
7. [Environment Variables](#environment-variables)
8. [Authentication Flow](#authentication-flow)
9. [API Integration](#api-integration)
10. [Development Progress](#development-progress)

---

## 🎯 Overview

LinkShort Frontend is a modern, responsive web application that provides a beautiful user interface for URL shortening services. It connects to a microservices backend architecture through an API Gateway.

**Key Highlights:**
- 🎨 Beautiful UI with gradient designs and smooth animations
- 🔐 Secure JWT-based authentication with token management
- 📱 Fully responsive design (mobile, tablet, desktop)
- ⚡ Fast performance with Next.js 16 App Router
- 🎭 Dark mode support with system preference detection
- 📊 Real-time analytics dashboard with interactive charts
- 🔄 Auto data refresh when switching browser tabs
- 🗑️ URL deletion with confirmation dialogs

---

## 🏗️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                       │
│                   Port: 3006                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Landing    │  │     Auth     │  │  Dashboard   │     │
│  │     Page     │  │  (Login/Reg) │  │   (Secure)   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────┬────────────────────────────────────┘
                         │
                    API Proxy Routes
                    (/api/auth/*)
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              API Gateway (Express.js)                       │
│                   Port: 4000                                │
│  Routes: /api/auth/*, /api/urls/*, /api/analytics/*       │
└────────┬────────────┬────────────┬────────────┬────────────┘
         │            │            │            │
    ┌────▼───┐   ┌───▼────┐  ┌───▼─────┐  ┌───▼─────┐
    │  Auth  │   │  URL   │  │Redirect │  │Analytics│
    │Service │   │Service │  │Service  │  │Service  │
    │ :3001  │   │ :3002  │  │ :3003   │  │ :3004   │
    └────────┘   └────────┘  └─────────┘  └─────────┘
```

### Frontend Architecture

```
Frontend
├── Pages (Next.js App Router)
│   ├── Landing Page (/)
│   ├── Login (/login)
│   ├── Register (/register)
│   └── Dashboard (/dashboard) - Protected
│
├── Components
│   ├── Landing (Hero, Features, Stats, Footer)
│   ├── Auth (LoginForm, RegisterForm)
│   ├── Dashboard (Sidebar, URLList, Analytics)
│   └── UI (Reusable ShadCN components)
│
├── API Proxy Layer
│   ├── /api/auth/login
│   ├── /api/auth/register
│   └── (Future: /api/urls/*, /api/analytics/*)
│
├── State Management
│   ├── AuthContext (User state, JWT tokens)
│   └── (Future: URLContext, AnalyticsContext)
│
└── Services
    ├── API Client (Axios with interceptors)
    └── Type Definitions (TypeScript interfaces)
```

---

## ✅ Features Implemented

### Milestone 1: Project Setup ✅ COMPLETE
- ✅ Next.js 16 with TypeScript and App Router
- ✅ Tailwind CSS v4 with custom color system
- ✅ ShadCN UI component library (15 components)
- ✅ Project folder structure
- ✅ Environment configuration
- ✅ API client with Axios
- ✅ AuthContext for state management

### Milestone 2: Landing Page ✅ COMPLETE
- ✅ Responsive header with navigation
- ✅ Hero section with gradient backgrounds
- ✅ URL input with validation
- ✅ Sign-up dialog modal
- ✅ Features showcase (6 feature cards)
- ✅ Statistics section
- ✅ Professional footer

### Milestone 3: Authentication ✅ COMPLETE
- ✅ Login page with form validation
- ✅ Register page with form validation
- ✅ Password show/hide toggle
- ✅ Zod schema validation
- ✅ Beautiful split-screen auth layout
- ✅ JWT token management in localStorage
- ✅ API proxy routes to avoid CORS
- ✅ Error handling with toast notifications
- ✅ Automatic redirect after login

### Milestone 4: Dashboard ✅ COMPLETE
- ✅ Dashboard layout with responsive sidebar
- ✅ Protected routes with auth check
- ✅ Overview page with statistics cards
- ✅ URL list component with copy/analytics actions
- ✅ Create URL page with form validation
- ✅ Custom alias support
- ✅ URL expiration date setting
- ✅ Success state with copy functionality
- ✅ Real-time URL fetching and display

### Milestone 5: Analytics ✅ COMPLETE
- ✅ Analytics page with URL details
- ✅ Stats cards (Total, Today, Yesterday clicks)
- ✅ Bar chart with time range selector (7/30/90 days, all time)
- ✅ Interactive chart using Recharts
- ✅ Top referrers list with percentages
- ✅ API proxy route for analytics data
- ✅ Back navigation to dashboard
- ✅ Loading and error states

### Milestone 6: Advanced Features ✅ COMPLETE
- ✅ URL deletion (backend + frontend)
- ✅ Dark mode with system preference detection
- ✅ Theme toggle in sidebar
- ✅ Auto data refresh when switching tabs
- ✅ Fixed delete button hover UI
- ✅ Removed Profile tab (no backend support)

---

## 🛠️ Tech Stack

### Core Technologies
- **Next.js 16** - React framework with App Router
- **TypeScript 5** - Type-safe development
- **Tailwind CSS 4** - Utility-first CSS framework
- **React 19** - UI library

### UI Components & Styling
- **ShadCN UI** - Accessible component library
- **Radix UI** - Headless UI primitives
- **Lucide React** - Icon library
- **OKLCH Colors** - Modern color space

### Form Handling & Validation
- **React Hook Form** - Form state management
- **Zod** - Schema validation
- **@hookform/resolvers** - Form validation integration

### Data Fetching & State
- **Axios** - HTTP client
- **React Context API** - Global state management

### Charts & Visualization
- **Recharts** - Chart library for analytics
- **date-fns** - Date manipulation

### Other Tools
- **Sonner** - Toast notifications
- **next-themes** - Dark mode support (upcoming)

---

## 📁 Project Structure

```
frontend/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Route group for auth pages
│   │   ├── login/
│   │   │   └── page.tsx          # Login page
│   │   ├── register/
│   │   │   └── page.tsx          # Register page
│   │   └── layout.tsx            # Auth layout (split-screen)
│   │
│   ├── dashboard/                # Protected dashboard routes
│   │   ├── analytics/
│   │   ├── create/
│   │   ├── profile/
│   │   └── page.tsx              # Dashboard home
│   │
│   ├── api/                      # API proxy routes
│   │   └── auth/
│   │       ├── login/route.ts    # Login proxy
│   │       └── register/route.ts # Register proxy
│   │
│   ├── layout.tsx                # Root layout with AuthProvider
│   ├── page.tsx                  # Landing page
│   └── globals.css               # Global styles + Tailwind config
│
├── components/                   # React components
│   ├── landing/
│   │   ├── Header.tsx            # Fixed header with nav
│   │   ├── Hero.tsx              # Hero section with input
│   │   ├── Features.tsx          # Feature cards
│   │   ├── Stats.tsx             # Statistics section
│   │   └── Footer.tsx            # Footer
│   │
│   ├── auth/
│   │   ├── LoginForm.tsx         # Login form component
│   │   └── RegisterForm.tsx      # Register form component
│   │
│   ├── dashboard/                # Dashboard components (upcoming)
│   │
│   └── ui/                       # ShadCN UI components
│       ├── button.tsx
│       ├── input.tsx
│       ├── password-input.tsx
│       ├── card.tsx
│       └── ... (15 components)
│
├── lib/                          # Libraries & utilities
│   ├── api/
│   │   └── client.ts             # Axios client with interceptors
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx       # Auth state management
│   │
│   ├── validations/
│   │   └── auth.ts               # Zod validation schemas
│   │
│   └── utils.ts                  # Utility functions
│
├── types/
│   └── index.ts                  # TypeScript type definitions
│
├── utils/
│   └── helpers.ts                # Helper functions
│
├── .env.local                    # Environment variables (gitignored)
├── .env.example                  # Environment template
├── package.json                  # Dependencies
└── README.md                     # This file
```

---

## 🚀 Setup & Installation

### Prerequisites

- **Node.js** 18+
- **npm** or **yarn** or **pnpm**
- **Backend Services** running (API Gateway on port 4000)

### Installation Steps

1. **Navigate to frontend directory**
   ```bash
   cd /home/bhavyaaggarwal/Documents/experimental/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local`:
   ```env
   NEXT_PUBLIC_BASE_URL=http://localhost:4000
   NEXT_PUBLIC_APP_NAME=LinkShort
   NEXT_PUBLIC_APP_DESCRIPTION=Modern URL shortener with analytics
   NEXT_PUBLIC_ENABLE_ANALYTICS=true
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:3006
   ```

### Build for Production

```bash
npm run build
npm start
```

---

## 🌍 Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NEXT_PUBLIC_BASE_URL` | Backend API Gateway URL | `http://localhost:4000` | Yes |
| `NEXT_PUBLIC_APP_NAME` | Application name | `LinkShort` | No |
| `NEXT_PUBLIC_APP_DESCRIPTION` | App description | - | No |
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | Enable analytics features | `true` | No |

**Note:** All variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

---

## 🔐 Authentication Flow

### Registration Flow

```
1. User fills registration form (Full Name, Email, Password)
      ↓
2. Frontend validation (Zod schema)
   - Full name: min 2 chars
   - Email: valid format
   - Password: min 8 chars
   - Confirm password matches
      ↓
3. POST /api/auth/register (Next.js API Route)
   - Transform 'name' → 'fullName'
      ↓
4. Proxy to Backend: POST http://localhost:4000/api/auth/register
      ↓
5. API Gateway → Auth Service (Port 3001)
      ↓
6. Auth Service processes:
   - Validates email format
   - Checks password length (min 8 chars)
   - Checks email not already registered
   - Hashes password (bcrypt)
   - Stores user in MongoDB
   - Generates JWT token
      ↓
7. Response: { success: true, data: { token, user } }
      ↓
8. Frontend stores:
   - localStorage.setItem('auth_token', token)
   - localStorage.setItem('user', JSON.stringify(user))
      ↓
9. AuthContext updates user state
      ↓
10. Redirect to /dashboard
```

### Login Flow

```
1. User enters email & password
      ↓
2. Frontend validation (Zod)
   - Email: valid format
   - Password: min 8 chars
      ↓
3. POST /api/auth/login (Next.js API Route)
      ↓
4. Proxy to Backend: POST http://localhost:4000/api/auth/login
      ↓
5. API Gateway → Auth Service
      ↓
6. Auth Service processes:
   - Finds user by email
   - Verifies password (bcrypt.compare)
   - Checks if account is active
   - Generates JWT token
      ↓
7. Response: { success: true, data: { token, user } }
      ↓
8. Frontend stores token & user
      ↓
9. Redirect to /dashboard
```

### Protected Routes

```
User accesses /dashboard
      ↓
AuthContext checks:
  - Is user logged in? (user state)
  - Is token present? (localStorage)
      ↓
If No:
  - Redirect to /login
      ↓
If Yes:
  - Render dashboard
  - All API calls include Authorization header
```

---

## 🔌 API Integration

### Why API Proxy Pattern?

The frontend uses Next.js API routes as a proxy to avoid CORS errors:

**Without Proxy (CORS Error):**
```
Browser (localhost:3006) → Backend (localhost:4000) ❌ CORS Error
```

**With Proxy (Works):**
```
Browser (localhost:3006) → Next.js API (/api/auth/*) → Backend (localhost:4000) ✅
```

### API Proxy Implementation

```typescript
// app/api/auth/register/route.ts
export async function POST(req: NextRequest) {
  const body = await req.json();

  // Transform 'name' to 'fullName'
  const { name, ...rest } = body;
  const payload = { ...rest, fullName: name };

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/register`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
```

### Backend API Endpoints

| Endpoint | Method | Description | Status |
|----------|--------|-------------|--------|
| `/api/auth/register` | POST | Register new user | ✅ Working |
| `/api/auth/login` | POST | Login user | ✅ Working |
| `/api/auth/logout` | POST | Logout user | 🔄 TODO |
| `/api/urls` | GET | Get user's URLs | ✅ Working |
| `/api/urls` | POST | Create short URL | ✅ Working |
| `/api/urls/:shortCode` | DELETE | Delete URL | ✅ Working |
| `/api/analytics/:shortCode` | GET | Get URL analytics | ✅ Working |
| `/api/urls/:id` | GET | Get URL details | 🔄 TODO |
| `/api/urls/:id` | PUT | Update URL | 🔄 TODO |

---

## 📊 Development Progress

### Overall Progress: 95% Complete

#### ✅ Completed (95%)
- Project setup and configuration
- Landing page with full UI
- Authentication system (login/register)
- API proxy layer (auth + URLs + analytics)
- Form validation (Zod schemas)
- Token management & protected routes
- Error handling & toast notifications
- Dashboard layout with responsive sidebar
- URL creation with custom alias
- URL expiration date setting
- URL list display with actions
- Copy to clipboard functionality
- Real-time URL fetching
- Analytics page with bar charts
- Time range selector (7/30/90 days, all time)
- Top referrers tracking
- **URL deletion with backend support**
- **Dark mode with theme toggle**
- **Auto data refresh on tab switch**

#### 📋 Upcoming (5%)
- QR code generation
- URL editing
- Bulk operations
- Profile management

---

## 🎨 Design System

### Color Palette (OKLCH)

```css
/* Primary Colors */
--color-primary-50: oklch(0.97 0.01 254.5);
--color-primary-500: oklch(0.625 0.213 254.5);  /* Main blue */
--color-primary-600: oklch(0.555 0.213 254.5);

/* Accent Colors */
--color-accent-purple: oklch(0.588 0.253 286.6);
--color-accent-pink: oklch(0.630 0.247 356.5);

/* Gradients */
.bg-gradient-primary { @apply bg-gradient-to-r from-primary-500 to-primary-600; }
.bg-gradient-accent { @apply bg-gradient-to-r from-accent-purple to-accent-pink; }
.text-gradient { @apply bg-gradient-to-r from-accent-purple to-accent-pink bg-clip-text text-transparent; }
```

---

## 🐛 Troubleshooting

### Common Issues

**Port Already in Use**
```bash
# Kill process on port 3006
lsof -ti:3006 | xargs kill -9

# Or change port
npm run dev -- -p 3007
```

**CORS Errors**
- Ensure API Gateway is running on port 4000
- Check `.env.local` has correct `NEXT_PUBLIC_BASE_URL`
- API proxy routes should handle CORS automatically

**Authentication Not Working**
1. Check backend services are running
2. Verify token: `localStorage.getItem('auth_token')`
3. Check browser console for errors
4. Ensure password is at least 8 characters

**Field Mismatch Errors**
- Backend expects `fullName`, frontend sends `name`
- The proxy route transforms this automatically

---

## 📄 License

Private - All Rights Reserved

---

## 👤 Author

**Bhavya Aggarwal**
- Email: bhavya.aggarwal@transformative.in

---

**Last Updated:** 2025-11-07 (Milestone 6 Complete)
**Version:** 0.1.0 (MVP - 95% Complete)
**Status:** ✅ Feature Complete - Ready for Production
