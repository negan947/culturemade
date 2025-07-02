# CultureMade Development Roadmap - Detailed Implementation Guide

## 📋 Development Progress Tracker

**Current Phase**: Not Started  
**Current Step**: 0.0  
**Last Updated**: December 2024  
**Progress Memory File**: `CULTUREMADE_PROGRESS.md`

---

## 🎯 Development Philosophy

1. **Always check existing code** before making changes
2. **Use MCP tool** to verify Supabase database state before modifications
3. **Every code change** must have a clear reason
4. **Update progress file** after each completed step
5. **Test incrementally** - don't wait until the end

---

## Phase 0: Project Setup & Configuration (Day 1)

### 0.1 Initialize Next.js Project

```bash
npx create-next-app@latest culturemade --typescript --tailwind --app --src-dir=false --import-alias="@/*"
```

- [ ] Verify Next.js 15 is installed
- [ ] Ensure TypeScript strict mode is enabled
- [ ] Confirm App Router is configured
- [ ] Test initial build: `npm run build`

### 0.2 Configure Development Environment

- [ ] Create `.env.local` file with structure:

  ```
  # Supabase
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  SUPABASE_SERVICE_ROLE_KEY=

  # Stripe
  STRIPE_SECRET_KEY=
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
  STRIPE_WEBHOOK_SECRET=

  # Resend
  RESEND_API_KEY=

  # App
  NEXT_PUBLIC_APP_URL=http://localhost:3000
  ```

- [ ] Add `.env.local` to `.gitignore`
- [ ] Create `.env.example` with empty values

### 0.3 Install Core Dependencies

```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install stripe @stripe/stripe-js
npm install resend
npm install zod react-hook-form @hookform/resolvers
npm install date-fns
npm install lucide-react
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-toast
npm install class-variance-authority clsx tailwind-merge
npm install --save-dev @types/node
```

### 0.4 Configure Tailwind CSS

- [ ] Update `tailwind.config.ts`:

  ```typescript
  import type { Config } from "tailwindcss";

  const config: Config = {
    darkMode: ["class"],
    content: [
      "./pages/**/*.{ts,tsx}",
      "./components/**/*.{ts,tsx}",
      "./app/**/*.{ts,tsx}",
    ],
    theme: {
      container: {
        center: true,
        padding: "2rem",
        screens: {
          "2xl": "1400px",
        },
      },
      extend: {
        colors: {
          border: "hsl(var(--border))",
          input: "hsl(var(--input))",
          ring: "hsl(var(--ring))",
          background: "hsl(var(--background))",
          foreground: "hsl(var(--foreground))",
          primary: {
            DEFAULT: "hsl(var(--primary))",
            foreground: "hsl(var(--primary-foreground))",
          },
          secondary: {
            DEFAULT: "hsl(var(--secondary))",
            foreground: "hsl(var(--secondary-foreground))",
          },
          destructive: {
            DEFAULT: "hsl(var(--destructive))",
            foreground: "hsl(var(--destructive-foreground))",
          },
          muted: {
            DEFAULT: "hsl(var(--muted))",
            foreground: "hsl(var(--muted-foreground))",
          },
          accent: {
            DEFAULT: "hsl(var(--accent))",
            foreground: "hsl(var(--accent-foreground))",
          },
          popover: {
            DEFAULT: "hsl(var(--popover))",
            foreground: "hsl(var(--popover-foreground))",
          },
          card: {
            DEFAULT: "hsl(var(--card))",
            foreground: "hsl(var(--card-foreground))",
          },
        },
        borderRadius: {
          lg: "var(--radius)",
          md: "calc(var(--radius) - 2px)",
          sm: "calc(var(--radius) - 4px)",
        },
        keyframes: {
          "accordion-down": {
            from: { height: "0" },
            to: { height: "var(--radix-accordion-content-height)" },
          },
          "accordion-up": {
            from: { height: "var(--radix-accordion-content-height)" },
            to: { height: "0" },
          },
        },
        animation: {
          "accordion-down": "accordion-down 0.2s ease-out",
          "accordion-up": "accordion-up 0.2s ease-out",
        },
      },
    },
    plugins: [require("tailwindcss-animate")],
  };
  export default config;
  ```

### 0.5 Set Up CSS Variables

- [ ] Update `app/globals.css`:

  ```css
  @tailwind base;
  @tailwind components;
  @tailwind utilities;

  @layer base {
    :root {
      --background: 0 0% 100%;
      --foreground: 240 10% 3.9%;
      --card: 0 0% 100%;
      --card-foreground: 240 10% 3.9%;
      --popover: 0 0% 100%;
      --popover-foreground: 240 10% 3.9%;
      --primary: 240 5.9% 10%;
      --primary-foreground: 0 0% 98%;
      --secondary: 240 4.8% 95.9%;
      --secondary-foreground: 240 5.9% 10%;
      --muted: 240 4.8% 95.9%;
      --muted-foreground: 240 3.8% 46.1%;
      --accent: 240 4.8% 95.9%;
      --accent-foreground: 240 5.9% 10%;
      --destructive: 0 84.2% 60.2%;
      --destructive-foreground: 0 0% 98%;
      --border: 240 5.9% 90%;
      --input: 240 5.9% 90%;
      --ring: 240 10% 3.9%;
      --radius: 0.5rem;
    }

    .dark {
      --background: 240 10% 3.9%;
      --foreground: 0 0% 98%;
      --card: 240 10% 3.9%;
      --card-foreground: 0 0% 98%;
      --popover: 240 10% 3.9%;
      --popover-foreground: 0 0% 98%;
      --primary: 0 0% 98%;
      --primary-foreground: 240 5.9% 10%;
      --secondary: 240 3.7% 15.9%;
      --secondary-foreground: 0 0% 98%;
      --muted: 240 3.7% 15.9%;
      --muted-foreground: 240 5% 64.9%;
      --accent: 240 3.7% 15.9%;
      --accent-foreground: 0 0% 98%;
      --destructive: 0 62.8% 30.6%;
      --destructive-foreground: 0 0% 98%;
      --border: 240 3.7% 15.9%;
      --input: 240 3.7% 15.9%;
      --ring: 240 4.9% 83.9%;
    }
  }

  @layer base {
    * {
      @apply border-border;
    }
    body {
      @apply bg-background text-foreground;
    }
  }
  ```

### 0.6 Create Utility Functions

- [ ] Create `lib/utils.ts`:

  ```typescript
  import { type ClassValue, clsx } from "clsx";
  import { twMerge } from "tailwind-merge";

  export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
  }
  ```

### 0.7 Set Up Supabase Client

- [ ] Create `lib/supabase/client.ts`:

  ```typescript
  import { createBrowserClient } from "@supabase/ssr";

  export function createClient() {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  ```

- [ ] Create `lib/supabase/server.ts`:

  ```typescript
  import { createServerClient, type CookieOptions } from "@supabase/ssr";
  import { cookies } from "next/headers";

  export async function createClient() {
    const cookieStore = await cookies();

    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              // Handle error
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value: "", ...options });
            } catch (error) {
              // Handle error
            }
          },
        },
      }
    );
  }
  ```

### 0.8 Configure TypeScript

- [ ] Update `tsconfig.json`:
  ```json
  {
    "compilerOptions": {
      "target": "es5",
      "lib": ["dom", "dom.iterable", "esnext"],
      "allowJs": true,
      "skipLibCheck": true,
      "strict": true,
      "forceConsistentCasingInFileNames": true,
      "noEmit": true,
      "esModuleInterop": true,
      "module": "esnext",
      "moduleResolution": "bundler",
      "resolveJsonModule": true,
      "isolatedModules": true,
      "jsx": "preserve",
      "incremental": true,
      "plugins": [
        {
          "name": "next"
        }
      ],
      "paths": {
        "@/*": ["./*"]
      }
    },
    "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
    "exclude": ["node_modules"]
  }
  ```

### 0.9 Initial Git Setup

- [ ] Initialize git repository: `git init`
- [ ] Create `.gitignore` if not exists
- [ ] First commit: `git add . && git commit -m "Initial project setup"`

---

## Phase 1: Database Setup (Day 2)

### 1.1 Connect to Supabase Project

- [ ] Get Supabase credentials from dashboard
- [ ] Update `.env.local` with actual values
- [ ] Test connection with simple query

### 1.2 Create Database Schema

- [ ] Use MCP tool to check existing tables
- [ ] Create SQL migration file: `supabase/migrations/001_initial_schema.sql`
- [ ] Copy all CREATE TABLE statements from roadmap
- [ ] Execute migration via Supabase dashboard

### 1.3 Set Up Row Level Security

- [ ] Create RLS policies migration: `supabase/migrations/002_rls_policies.sql`
- [ ] Enable RLS on all tables
- [ ] Create policies for each table as specified
- [ ] Test policies with different user roles

### 1.4 Create Database Functions

- [ ] Create `supabase/migrations/003_functions.sql`:

  ```sql
  -- Generate order number function
  CREATE OR REPLACE FUNCTION generate_order_number()
  RETURNS TEXT AS $$
  DECLARE
    order_count INTEGER;
    new_order_number TEXT;
  BEGIN
    SELECT COUNT(*) + 1 INTO order_count FROM orders;
    new_order_number := 'ORD-' || LPAD(order_count::TEXT, 6, '0');
    RETURN new_order_number;
  END;
  $$ LANGUAGE plpgsql;

  -- Update updated_at timestamp
  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  -- Create triggers for updated_at
  CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  -- Add triggers for all tables with updated_at...
  ```

### 1.5 Create Database Types

- [ ] Create `types/database.ts`:

  ```typescript
  export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

  export interface Database {
    public: {
      Tables: {
        profiles: {
          Row: {
            id: string;
            role: "customer" | "admin";
            full_name: string | null;
            phone: string | null;
            avatar_url: string | null;
            created_at: string;
            updated_at: string;
          };
          Insert: {
            id: string;
            role?: "customer" | "admin";
            full_name?: string | null;
            phone?: string | null;
            avatar_url?: string | null;
            created_at?: string;
            updated_at?: string;
          };
          Update: {
            id?: string;
            role?: "customer" | "admin";
            full_name?: string | null;
            phone?: string | null;
            avatar_url?: string | null;
            created_at?: string;
            updated_at?: string;
          };
        };
        // Add all other table types...
      };
    };
  }
  ```

### 1.6 Test Database Connection

- [ ] Create test script to verify all tables exist
- [ ] Test basic CRUD operations
- [ ] Verify RLS policies work correctly

---

## Phase 2: Authentication System (Day 3)

### 2.1 Set Up Auth Helpers

- [ ] Create `lib/supabase/auth.ts`:

  ```typescript
  import { createClient } from "./server";
  import { redirect } from "next/navigation";

  export async function getUser() {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    return { user, error };
  }

  export async function requireAuth() {
    const { user, error } = await getUser();
    if (error || !user) {
      redirect("/login");
    }
    return user;
  }

  export async function requireAdmin() {
    const supabase = await createClient();
    const { user } = await requireAuth();

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      redirect("/");
    }

    return user;
  }
  ```

### 2.2 Create Auth Components

- [ ] Create `components/auth/login-form.tsx`
- [ ] Create `components/auth/register-form.tsx`
- [ ] Create `components/auth/reset-password-form.tsx`
- [ ] Add form validation with zod
- [ ] Implement error handling

### 2.3 Implement Auth Routes

- [ ] Create `app/(auth)/login/page.tsx`
- [ ] Create `app/(auth)/register/page.tsx`
- [ ] Create `app/(auth)/reset-password/page.tsx`
- [ ] Create `app/api/auth/callback/route.ts` for OAuth

### 2.4 Create Auth Middleware

- [ ] Create `middleware.ts`:

  ```typescript
  import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
  import { NextResponse } from "next/server";
  import type { NextRequest } from "next/server";

  export async function middleware(req: NextRequest) {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req, res });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Protected routes
    if (req.nextUrl.pathname.startsWith("/account") && !user) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (req.nextUrl.pathname.startsWith("/admin")) {
      if (!user) {
        return NextResponse.redirect(new URL("/login", req.url));
      }

      // Check admin role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin") {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    return res;
  }

  export const config = {
    matcher: ["/account/:path*", "/admin/:path*"],
  };
  ```

### 2.5 Test Authentication Flow

- [ ] Test registration with email/password
- [ ] Test login/logout
- [ ] Test password reset
- [ ] Test protected route access
- [ ] Test admin role restrictions

---

## Phase 3: Product Management System (Days 4-5)

### 3.1 Create Product Types

- [ ] Define TypeScript interfaces for products
- [ ] Create Zod schemas for validation
- [ ] Set up form types

### 3.2 Build Product API Routes

- [ ] Create `app/api/products/route.ts` (GET, POST)
- [ ] Create `app/api/products/[id]/route.ts` (GET, PUT, DELETE)
- [ ] Implement pagination and filtering
- [ ] Add search functionality

### 3.3 Create Admin Product Management

- [ ] Create `app/admin/products/page.tsx` (list view)
- [ ] Create `app/admin/products/new/page.tsx` (create form)
- [ ] Create `app/admin/products/[id]/page.tsx` (edit form)
- [ ] Implement image upload to Supabase Storage
- [ ] Add variant management

### 3.4 Build Customer Product Pages

- [ ] Create `app/(customer)/products/page.tsx` (listing)
- [ ] Create `app/(customer)/products/[slug]/page.tsx` (detail)
- [ ] Implement filtering and sorting
- [ ] Add search functionality
- [ ] Create product card component

### 3.5 Implement Product Features

- [ ] Category management
- [ ] Collection management
- [ ] Inventory tracking
- [ ] Product reviews
- [ ] Related products

---

## Phase 4: Shopping Cart System (Day 6)

### 4.1 Create Cart Context

- [ ] Create `contexts/cart-context.tsx`
- [ ] Implement cart state management
- [ ] Handle anonymous vs authenticated users
- [ ] Sync with database

### 4.2 Build Cart API

- [ ] Create `app/api/cart/route.ts`
- [ ] Implement add/update/remove items
- [ ] Handle cart merging on login
- [ ] Add inventory validation

### 4.3 Create Cart Components

- [ ] Create `components/cart/cart-drawer.tsx`
- [ ] Create `components/cart/cart-item.tsx`
- [ ] Create `components/cart/cart-summary.tsx`
- [ ] Add animations and transitions

### 4.4 Build Cart Page

- [ ] Create `app/(customer)/cart/page.tsx`
- [ ] Implement quantity updates
- [ ] Add remove functionality
- [ ] Show recommendations

---

## Phase 5: Checkout & Payments (Days 7-8)

### 5.1 Set Up Stripe

- [ ] Create `lib/stripe/client.ts`
- [ ] Create `lib/stripe/server.ts`
- [ ] Configure webhook handling
- [ ] Set up payment methods

### 5.2 Build Checkout Flow

- [ ] Create `app/(customer)/checkout/information/page.tsx`
- [ ] Create `app/(customer)/checkout/shipping/page.tsx`
- [ ] Create `app/(customer)/checkout/payment/page.tsx`
- [ ] Implement step validation

### 5.3 Create Order Processing

- [ ] Create `app/api/checkout/session/route.ts`
- [ ] Create `app/api/checkout/webhook/route.ts`
- [ ] Handle order creation
- [ ] Send confirmation emails

### 5.4 Implement Order Management

- [ ] Create order confirmation page
- [ ] Build order tracking
- [ ] Add invoice generation
- [ ] Handle refunds

---

## Phase 6: Customer Account Area (Day 9)

### 6.1 Create Account Dashboard

- [ ] Create `app/(customer)/account/page.tsx`
- [ ] Show recent orders
- [ ] Display account info
- [ ] Add quick actions

### 6.2 Build Account Features

- [ ] Create `app/(customer)/account/orders/page.tsx`
- [ ] Create `app/(customer)/account/addresses/page.tsx`
- [ ] Create `app/(customer)/account/settings/page.tsx`
- [ ] Implement profile updates

### 6.3 Add Customer Features

- [ ] Wishlist functionality
- [ ] Order history with filters
- [ ] Download invoices
- [ ] Review products

---

## Phase 7: Admin Dashboard (Days 10-12)

### 7.1 Create Admin Layout

- [ ] Create `app/admin/layout.tsx`
- [ ] Build admin navigation
- [ ] Add breadcrumbs
- [ ] Implement admin theme

### 7.2 Build Dashboard Home

- [ ] Create `app/admin/page.tsx`
- [ ] Add revenue charts
- [ ] Show order statistics
- [ ] Display recent activity

### 7.3 Implement Order Management

- [ ] Create `app/admin/orders/page.tsx`
- [ ] Create `app/admin/orders/[id]/page.tsx`
- [ ] Add status updates
- [ ] Implement fulfillment

### 7.4 Build Customer Management

- [ ] Create `app/admin/customers/page.tsx`
- [ ] Create `app/admin/customers/[id]/page.tsx`
- [ ] Add customer search
- [ ] Show purchase history

### 7.5 Create Analytics Dashboard

- [ ] Create `app/admin/analytics/page.tsx`
- [ ] Implement sales reports
- [ ] Add product performance
- [ ] Create custom date ranges

### 7.6 Build Settings Pages

- [ ] Create `app/admin/settings/page.tsx`
- [ ] Create `app/admin/settings/shipping/page.tsx`
- [ ] Create `app/admin/settings/taxes/page.tsx`
- [ ] Create `app/admin/settings/emails/page.tsx`

---

## Phase 8: Performance & Optimization (Day 13)

### 8.1 Image Optimization

- [ ] Configure next/image properly
- [ ] Set up image transformations
- [ ] Implement lazy loading
- [ ] Add loading placeholders

### 8.2 Code Optimization

- [ ] Implement code splitting
- [ ] Add dynamic imports
- [ ] Optimize bundle size
- [ ] Remove unused dependencies

### 8.3 Database Optimization

- [ ] Add database indexes
- [ ] Optimize queries
- [ ] Implement caching
- [ ] Add connection pooling

### 8.4 SEO Implementation

- [ ] Add meta tags
- [ ] Create sitemap.xml
- [ ] Implement structured data
- [ ] Add Open Graph tags

---

## Phase 9: Testing & Deployment (Day 14)

### 9.1 Write Tests

- [ ] Unit tests for utilities
- [ ] Integration tests for API
- [ ] Component tests
- [ ] E2E tests for critical paths

### 9.2 Security Hardening

- [ ] Implement rate limiting
- [ ] Add CSRF protection
- [ ] Configure CSP headers
- [ ] Audit dependencies

### 9.3 Deployment Setup

- [ ] Configure Vercel project
- [ ] Set up environment variables
- [ ] Configure custom domain
- [ ] Set up monitoring

### 9.4 Launch Preparation

- [ ] Clean test data
- [ ] Final testing
- [ ] Performance audit
- [ ] Create backup plan

---

## 📝 Progress Update Template

After completing each step, update the progress file with:

```markdown
## Step X.X Completed

- **Date**: YYYY-MM-DD
- **Time Spent**: X hours
- **Issues Encountered**:
- **Solutions Applied**:
- **Next Step**: X.X
```

---

## 🚨 Critical Checkpoints

1. **After Phase 0**: Ensure build passes without errors
2. **After Phase 1**: Verify all database operations work
3. **After Phase 2**: Test full auth flow
4. **After Phase 4**: Cart persists across sessions
5. **After Phase 5**: Complete test purchase
6. **After Phase 7**: Admin can manage all aspects
7. **Before Phase 9**: Full backup of everything

---

## 🛠️ Development Commands

```bash
# Development
npm run dev

# Build
npm run build

# Production
npm start

# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

---

## 📚 Reference Documentation

- [Next.js 15 Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Stripe Docs](https://stripe.com/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

---

Remember: **Check existing code, verify with MCP, update progress tracker!**
