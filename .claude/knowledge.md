# CultureMade Knowledge Base
> **Version**: 1.3.0 | **Last Updated**: 2025-07-29 | **Auto-Generated**: ✅  
> **⚠️ IMPORTANT: This file is auto-maintained. Manual changes may be overwritten.**  
> **Database Schema**: 20 tables with product data | **Architecture**: Dual-interface platform | **Documentation**: 8-file synchronized knowledge base  
> **Major Update**: Advanced mobile debugging workflow and senior-level problem-solving methodology added  

## Project Overview
CultureMade is a sophisticated dual-interface e-commerce platform featuring:
- **Customer Interface**: Pixel-perfect iPhone 14 Pro simulation (410×890px) with authentic iOS UI
- **Admin Interface**: Traditional web dashboard for comprehensive business management
- **Unique Architecture**: Complete iOS system simulation with Lock Screen, Home Screen, Dynamic Island

## Complete Technical Stack

### **Core Framework & Build**
- **Next.js 15.3.4** with App Router and React 19.0.0 
- **TypeScript 5** with extremely strict configuration and enhanced type checking
- **Tailwind CSS 3.4.16** with custom mobile-first utilities and safe area support
- **Turbopack** support for optimized development builds

### **State Management & Animation**
- **Redux Toolkit 2.8.2** with interface-slice and notification-slice
- **Framer Motion 12.23.0** with LayoutGroup for shared element transitions
- **iOS-authentic animations** with spring curves and gesture recognition

### **Backend Infrastructure**
- **Supabase** with PostgreSQL, Row Level Security, and real-time subscriptions
- **@supabase/ssr 0.6.1** for seamless server-side rendering
- **Stripe 18.3.0** integrated payment processing
- **JWT authentication** with automatic refresh and role-based access

### **Development & Quality**
- **ESLint 9** with zero-warnings policy (build fails on warnings)
- **Prettier 3.6.2** with consistent formatting across all files
- **Husky 9.1.7** + Commitlint for conventional commits and pre-commit hooks
- **Sentry 9.37.0** for comprehensive error tracking and performance monitoring

### **Enhanced Development Stack (NEWLY DISCOVERED)**
- **React Three Fiber** (`@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`) for 3D graphics support
- **Three.js 0.178.0** for advanced 3D rendering capabilities
- **Leva 0.10.0** for runtime controls and debugging
- **React Spring 10.0.1** for physics-based animations
- **@use-gesture/react 10.3.1** for touch/gesture handling
- **Vercel Speed Insights** for performance monitoring
- **React iOS Icons** for authentic iOS iconography
- **Date-fns 4.1.0** for date manipulation
- **Resend API** for transactional emails
- **Next Logger + Pino** for structured logging
- **UUID 11.1.0** for unique identifier generation

### **Mobile Touch & Gesture System (CRITICAL ARCHITECTURE)**
- **Dual Gesture Architecture**: Framer Motion for desktop + Native Touch Events for mobile
- **iOS Safari Compatibility**: `{ passive: false }` event listeners with `preventDefault()`
- **Feature-Based Detection**: Touch capability, pointer precision, viewport size detection
- **Touch-Action CSS**: Strategic `touch-action: none` for gesture areas
- **Mobile-Specific CSS Classes**: `.mobile-gesture-area`, `.ios-fixed-container`

## iPhone Simulation Architecture (`components/iphone/`)

### **Core Shell Structure**
```
iphone-shell.tsx (Main Container - 410×890px)
├── Interface/SystemLayout/
│   ├── LayoutView.tsx        # System UI coordinator
│   ├── StatusBar.tsx         # Time, battery, signal indicators
│   ├── DynamicIsland.tsx     # iOS 16+ interactive area
│   └── HomeBar.tsx           # Bottom home indicator (DUAL GESTURE SYSTEM)
├── Interface/LockScreen/
│   └── LockScreen.tsx        # iOS lock screen with animations
├── Interface/Home/
│   ├── Home.tsx              # Main home screen coordinator  
│   ├── HomeAppPage.tsx       # App grid container (4×6 layout)
│   ├── HomeAppShortcut.tsx   # Individual app icons with press animations
│   └── Dock.tsx              # Bottom app dock (4 apps max)
├── Interface/AppView/
│   └── AppView.tsx           # Full-screen app container with gesture support
└── apps/                     # Individual iPhone applications
    ├── Calculator/Calculator.tsx  # Functional iOS calculator
    ├── Weather/Weather.tsx        # Weather app with animations
    ├── Components/Components.tsx  # UI component showcase
    ├── CultureMade/               # Main e-commerce app
    └── getApp.ts                  # App registry and dynamic loader
```

### **Device Specifications**
- **Aspect Ratio**: 18:39 (iPhone 14 Pro)
- **Desktop Size**: 410px × 890px
- **Mobile**: Full-screen with safe area support
- **Background**: Shared wallpaper (`/images/wallpaper-cm.jpg`)
- **Font Stack**: SF Pro Display/Text for authentic iOS appearance

### **State Management Architecture** (`store/`)

**Redux Store Structure:**
```typescript
// store/store.ts - Main configuration
export const store = configureStore({
  reducer: {
    interface: interfaceSlice,      // iPhone UI state
    notification: notificationSlice, // iOS notifications system
  },
})
```

**Interface Slice** (`store/interface-slice.ts`):
```typescript
interface Interface {
  appId: string | null;           // Currently active app ID
  inApp: boolean;                 // App vs home screen state
  statusBarColor: 'light' | 'dark'; // Dynamic status bar theming
  isLocked: boolean;              // Lock screen state
}
```

**Key Redux Actions:**
```typescript
changeCurrentApp(appId)    // Navigate to specific app
exitApp()                  // Return to home screen
unlock() / lock()          // Lock screen management
changeStatusBarColor()     // Dynamic status bar theming
```

## Backend Infrastructure

### **Supabase Integration** (`lib/supabase/`)
- **`client.ts`** - Browser-side Supabase client with auth persistence
- **`server.ts`** - Server-side client with cookie-based auth
- **`middleware.ts`** - Route protection and auth middleware
- **`auth.ts`** - Authentication utilities and role management

### **Security Architecture**
- **JWT Authentication** with automatic token refresh
- **Row Level Security (RLS)** policies on all database tables
- **Role-based Access Control** (customer/admin/super_admin)
- **OWASP Security Headers** configured in Next.js
- **Rate Limiting** and request validation
- **Structured Security Logging** with admin action auditing

### **App Router Structure** (`app/`)
```
app/
├── (auth)/                    # Authentication group layout
│   ├── layout.tsx            # Auth-specific wrapper
│   ├── login/page.tsx        # Login with iPhone preview
│   ├── register/page.tsx     # Registration form
│   └── reset-password/page.tsx
├── account/test/             # User account management
├── admin/test/               # Admin dashboard access
├── api/                      # API routes
│   ├── auth/callback/        # Supabase auth callback
│   ├── cart/add|remove|update # Shopping cart operations  
│   ├── products/[id]/        # Product CRUD operations
│   ├── categories/           # Category management
│   └── test-error-tracking/  # Sentry integration testing
├── layout.tsx               # Root layout with global providers
├── page.tsx                 # Main iPhone interface entry
└── test-*/                  # Development testing pages
```

## 🗄️ **SUPABASE-ONLY DATABASE ARCHITECTURE** (20 Tables)

> **⚠️ CRITICAL**: All data lives in Supabase PostgreSQL. No local storage, no mock data, no external databases.

### **✅ EXISTING TABLES IN SUPABASE** (Verified via MCP)
- **addresses** - User billing/shipping addresses
- **admin_logs** - Admin action audit trail  
- **analytics_events** - User behavior tracking
- **cart_items** - Shopping cart persistence
- **categories** - Product categorization
- **collections** - Product collections/groupings
- **discounts** - Promotional codes
- **inventory_movements** - Stock change tracking
- **order_items** - Order line items
- **orders** - Complete order records
- **payments** - Stripe payment records
- **product_categories** - Product-category relationships
- **product_collections** - Product-collection relationships
- **product_images** - Product media URLs (stored in Supabase Storage)
- **product_variants** - Size/color/price variants
- **products** - Main product catalog
- **profiles** - Extended user data (auth.users → profiles)
- **reviews** - Product reviews/ratings
- **shipments** - Order fulfillment tracking
- **shipping_methods** - Available shipping options

### **🔧 MCP SUPABASE INTEGRATION (FOR CLAUDE CONTEXT)**
- **Claude uses MCP tools** to check database state before making changes (not application code)
- **Database context**: Claude uses `mcp__supabasecm__execute_sql` for data inspection
- **Application database operations**: Use standard @supabase/supabase-js client libraries
- **Schema changes**: Generate SQL files, user copies to Supabase dashboard
- **Real-time verification**: Claude checks table existence with `mcp__supabasecm__list_tables`

### **💳 STRIPE PAYMENT PROCESSING**
- **payments table** stores Stripe transaction data
- **Real payments only** - no mock/test data in production
- **Webhook integration** for payment confirmation
- **Apple Pay support** via Stripe

### **📂 SUPABASE STORAGE BUCKETS**
- **product-images** - All product photos/media (public access)
- **user-avatars** - Profile pictures (authenticated access)
- **All images** stored in Supabase Storage, URLs in database tables

### **🛡️ ROW LEVEL SECURITY (RLS)**
- **ALL 20 tables** have RLS policies enabled
- **Role-based access**: customer/admin/super_admin
- **Data isolation** between users automatically enforced

## Development Commands & Workflows

### **Core Development**
- `npm run dev` - Start development server with Turbopack support
- `npm run build` - Production build (automatically runs prebuild checks)
- `npm run start` - Start production server
- `npm run prebuild` - Full quality assurance pipeline (lint, type-check, format check)

### **Code Quality & Formatting**
- `npm run lint` - ESLint with zero warnings policy (build fails on warnings)
- `npm run lint:fix` - Auto-fix ESLint issues where possible
- `npm run lint:strict` - Strict linting with no unmatched patterns flag
- `npm run type-check` - TypeScript compiler strict mode validation
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting without modification
- `npm run format:write` - Format and write changes with logging

### **Git Workflow Integration**
- `npm run prepare` - Initialize Husky git hooks
- **Pre-commit hooks**: Automatic linting, formatting, and type checking
- **Commit message validation**: Conventional commits with custom prompts and emojis
- **Lint-staged integration**: Only process staged files for performance

## Environment Variables & Configuration

### **Required Environment Variables**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL (validated as URL)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key for client-side operations
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key for server-side operations
- `NEXT_PUBLIC_APP_URL` - Application base URL (validated as URL)

### **Stripe Payment Integration**
- `STRIPE_SECRET_KEY` - Stripe secret key (must start with 'sk_')
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (must start with 'pk_')
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret for verification (optional)
- `APPLE_PAY_MERCHANT_ID` - Apple Pay merchant identifier (optional)

### **Email Service (Resend)**
- `RESEND_API_KEY` - Resend API key for email services (must start with 're_')

### **Error Monitoring & Analytics**
- `SENTRY_DSN` - Sentry DSN for error tracking (optional, validated as URL)
- `SENTRY_AUTH_TOKEN` - Sentry authentication token (optional)
- `SENTRY_ORG` - Sentry organization slug (optional)
- `SENTRY_PROJECT` - Sentry project slug (optional)
- `VERCEL_ANALYTICS_ID` - Vercel Analytics ID (optional)

### **Development & Debugging Flags**
- `SITE_LOCKED=true` - Redirect all routes to home page (development lock)
- `BYPASS_AUTH=true` - Skip authentication middleware in development
- `SKIP_ENV_VALIDATION=true` - Skip environment variable validation
- `DEBUG` - Debug mode configuration (optional)

### **Environment Validation System**
- **Zod-based validation** with custom error handling and type safety
- **Client vs Server separation** - only safe variables exposed to client
- **Graceful degradation** - partial fallbacks for non-critical environments
- **Build-time validation** with detailed error messages and formatting

## iPhone Interface Patterns

### State Management
```typescript
// Access iPhone interface state
const { currentApp, isLocked } = useSelector((state: RootState) => state.interface)

// Navigate to app
dispatch(setCurrentApp('weather'))

// Lock/unlock device
dispatch(setLocked(true))
```

### App Structure
Each iPhone app should:
- Export a React component as default
- Handle its own internal navigation
- Use consistent iOS styling patterns
- Integrate with the global notification system

### Animation Patterns
- Use Framer Motion for page transitions
- Follow iOS spring animation curves
- Respect reduced motion preferences
- Maintain 60fps performance on mobile

## Critical Development Guidelines

### **Build & Quality Assurance**
⚠️ **MANDATORY**: Run `npm run prebuild` before any commit
- **Zero warnings policy**: Build fails on any ESLint warnings
- **TypeScript strict mode**: Comprehensive strict flags enabled
  - `noImplicitAny`, `strictNullChecks`, `noUnusedLocals`, `noImplicitReturns`
  - `noFallthroughCasesInSwitch`, `exactOptionalPropertyTypes`
  - `useUnknownInCatchVariables`, `noPropertyAccessFromIndexSignature`
- **Prettier compliance**: Consistent formatting with import sorting
- **Import validation**: Unused imports cause build failures
- **Path mapping**: Clean imports with `@/` prefix for all paths
- **Pre-commit hooks**: Lint-staged processes only changed files for performance

### **Code Quality Standards**
- **ESLint Configuration**: Flat config with Next.js core web vitals
- **Import ordering**: Automatic sorting with grouped imports (React, Next, third-party, internal)
- **Conventional commits**: Enforced with detailed commit message rules
  - Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore
  - Subject: 10-72 characters, sentence case
  - Body/footer: Max 100 chars per line with blank line separation

### **Supabase Database Connection**
- **Free tier auto-pause**: Projects sleep after 7 days inactivity
- **Claude MCP connection timeouts**: Wait for database wake-up (30-60 seconds) when checking context
- **Application connections**: Use Supabase client with connection pooling for app operations
- **Connection pooling**: Use server-side client for heavy operations
- **Row Level Security**: All 20 tables have RLS policies enforced
- **Type safety**: Generated types for all database operations

### **iPhone Interface Development**
- **Shared wallpaper pattern**: All components use `/images/wallpaper-cm.jpg`
- **Redux state architecture**: interface-slice (app state) + notification-slice (iOS notifications)
- **Precise device specifications**: 410×890px desktop, 18:39 aspect ratio
- **Safe area handling**: Custom Tailwind utilities for iOS notch/home bar
- **Font authenticity**: SF Pro Display/Text font stack for iOS accuracy
- **Animation system**: Framer Motion with LayoutGroup for shared element transitions
- **Error boundaries**: Hierarchical error handling at page/section/component levels

### **Security Architecture & Best Practices**
- **Authentication flow**: JWT with automatic refresh and role-based access
- **Middleware protection**: Route-based auth with admin role validation
- **Input validation**: Zod schemas for all user inputs with XSS prevention
- **Rate limiting**: In-memory implementation with configurable limits
- **CSRF protection**: Token generation and validation
- **Redirect validation**: Prevents open redirect vulnerabilities
- **Security logging**: Structured event logging with IP/user agent tracking
- **OWASP headers**: X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- **Client-side security**: No secrets, environment variable separation

## Performance & Monitoring

### **Optimization Features**
- **Webpack source maps**: Enhanced debugging with eval-cheap-module-source-map in development
- **Bundle optimization**: Optimized package imports for Framer Motion and Lucide React
- **Image optimization**: WebP/AVIF support with device-specific sizing (640px-3840px)
- **Turbopack support**: Next.js 15 experimental turbo rules for faster development builds
- **SWC minification**: Enabled for better production performance
- **Code splitting**: Standalone output mode for optimized deployment

### **Error Tracking & Monitoring**
- **Sentry integration**: Complete error tracking with session replay and user feedback
  - 10% session sample rate, 100% error sample rate
  - Source maps, performance monitoring, release tracking
  - Client/server/edge configuration with environment-based filtering
- **Hierarchical error boundaries**: Three-level error handling system
  - Page level: Full-screen error with home/retry options
  - Section level: Contained error with retry functionality  
  - Component level: Minimal inline error display
- **Structured logging**: Pino-based logging with Next-logger integration
- **Performance monitoring**: Vercel Speed Insights integration
- **Development debugging**: Enhanced error details and stack traces

### **Mobile-First Optimization**
- **Dynamic viewport handling**: `100dvh`, `100svh`, `100lvh` support
- **Safe area utilities**: Custom Tailwind classes for iOS notch/home bar
- **Touch optimization**: Disabled tap highlighting and callouts
- **Scroll prevention**: Fixed positioning prevents rubber band scrolling
- **Font smoothing**: `-webkit-font-smoothing` and `-moz-osx-font-smoothing`

## Unique Architectural Decisions

### **Mobile-First iPhone Simulation**
- **Device specifications**: 18:39 aspect ratio, 410×890px desktop
- **Dynamic viewport units**: `100dvh`, `100svh`, `100lvh` support
- **SF Pro font integration**: Apple system fonts for authenticity
- **Safe area utilities**: Custom Tailwind classes for iOS notch/home bar

### **State-Driven UI Architecture**
- **Redux controls everything**: Entire iPhone interface state managed
- **Animation triggers**: Framer Motion responds to state changes
- **Shared element transitions**: LayoutGroup for seamless app switching
- **Error boundary strategy**: Graceful degradation at multiple levels

## Advanced Configuration Details

### **Next.js Configuration Highlights**
- **React Strict Mode**: Enabled for better development experience
- **Environment validation**: Build-time validation with detailed error messages
- **Security headers**: Comprehensive OWASP-compliant headers configuration
- **Image optimization**: Multi-format support with device-specific breakpoints
- **Source maps**: Development-optimized debugging with source-map-loader
- **Standalone output**: Optimized for Docker/serverless deployment

### **Tailwind Configuration Enhancements**
- **iPhone aspect ratio**: Custom `18/39` aspect ratio utility
- **SF Pro font stack**: Complete iOS font family integration
- **Dynamic viewport heights**: Support for all modern viewport units
- **Safe area insets**: Environment-aware padding/margin utilities
- **Shadcn/ui integration**: Complete design system with CSS variables
- **Scrollbar styling**: Custom scrollbar utilities via tailwind-scrollbar

### **TypeScript Configuration Strictness**
- **Maximum type safety**: All possible strict flags enabled
- **Enhanced path mapping**: Comprehensive alias system for clean imports
- **Module resolution**: Bundler resolution with ESNext target
- **Incremental compilation**: Performance optimization for large codebases
- **Isolated modules**: Ensures compatibility with build tools

### **Authentication & Authorization System**
- **Multi-level protection**: Route-based, middleware-based, and component-based auth
- **Role-based access**: customer/admin roles with granular permissions
- **Session management**: Automatic refresh with error handling
- **Development bypass**: Configurable auth skipping for development
- **Admin validation**: Profile-based admin verification with security logging

### **iPhone App Registry System**
```typescript
// App registration pattern
const appsBase: App[] = [
  {
    appId: 'calculator',
    name: 'Calculator', 
    icon: 'calculator',
    element: Calculator,
    statusBarColor: 'light'
  }
]
```
- **Dynamic app loading**: Runtime app resolution with getApp()/getAllApps()
- **Status bar theming**: Per-app status bar color configuration
- **Icon mapping**: Consistent icon system across all apps

---

## 🔬 **ADVANCED MOBILE DEBUGGING METHODOLOGY** (v1.3.0)

### **🎯 SENIOR-LEVEL PROBLEM-SOLVING FRAMEWORK**

#### **Phase 1: Comprehensive Context Research** 
**CRITICAL**: Never attempt fixes without thorough investigation

1. **Multi-Tool Information Gathering**
   ```
   - Read ALL relevant files (components, CSS, configs)
   - WebSearch for known issues with specific technologies
   - Analyze git history for previous implementations
   - Use multiple tool calls in parallel for efficiency
   ```

2. **Technology-Specific Research**
   ```
   - Framer Motion mobile limitations and GitHub issues
   - iOS Safari touch event compatibility 
   - CSS touch-action property browser support
   - Native touch events vs synthetic events
   ```

3. **Architecture Understanding**
   ```
   - Event flow: Container → Component → Handler
   - State management implications
   - CSS inheritance and specificity
   - Mobile vs desktop behavior differences
   ```

#### **Phase 2: Root Cause Analysis**
**Multi-Factor Problem Identification**

1. **Technical Layer Analysis**
   ```
   - Library bugs (Framer Motion onPan mobile issues)
   - Browser limitations (iOS Safari touch-action support)  
   - CSS conflicts (touch-action, pointer-events, z-index)
   - Event handling order (native vs synthetic events)
   ```

2. **Device-Specific Considerations**
   ```
   - Mobile detection reliability (user-agent vs feature detection)
   - Touch target sizing (15px vs 25px minimum)
   - iOS Safari gesture interference
   - Viewport differences (mobile vs desktop)
   ```

3. **Integration Conflicts**
   ```
   - Container event capture blocking
   - CSS specificity overrides
   - Animation library conflicts
   - State management timing
   ```

#### **Phase 3: Strategic Solution Architecture**
**Senior-Level Solution Design**

1. **Dual-System Approach**
   ```
   - Desktop: Use reliable technology (Framer Motion)
   - Mobile: Use workaround for known bugs (Native Events)
   - Feature detection for automatic switching
   - Fallback layers for edge cases
   ```

2. **Progressive Enhancement**
   ```
   - Base functionality with native events
   - Enhanced UX with Framer Motion where supported
   - Graceful degradation for unsupported features
   - Real device testing validation
   ```

3. **CSS Touch Optimization**
   ```css
   .mobile-gesture-area {
     touch-action: none;           /* Prevent default gestures */
     -webkit-user-select: none;    /* Disable text selection */
     user-select: none;
     -webkit-tap-highlight-color: transparent;
   }
   ```

#### **Phase 4: Implementation Best Practices**

1. **Event Listener Strategy**
   ```typescript
   // iOS Safari requires { passive: false } for preventDefault()
   element.addEventListener('touchstart', handler, { passive: false });
   element.addEventListener('touchmove', handler, { passive: false });
   element.addEventListener('touchend', handler, { passive: false });
   ```

2. **Feature-Based Mobile Detection**
   ```typescript
   const checkMobile = () => {
     const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
     const isMobileViewport = window.innerWidth <= 768;
     const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
     return hasTouch && (isMobileViewport || hasCoarsePointer);
   };
   ```

3. **Touch Area Optimization**
   ```typescript
   // Larger touch targets for mobile (25px minimum)
   height: isMobile ? '25px' : '16px'
   
   // Bottom screen gesture detection
   const distanceFromBottom = window.innerHeight - touch.clientY;
   if (distanceFromBottom <= 25) { /* capture gesture */ }
   ```

### **📚 RESEARCH METHODOLOGY FOR COMPLEX ISSUES**

#### **Essential Research Queries**
```
- "[Technology] mobile touch events iOS Safari not working [current year]"
- "[Library] onPan preventDefault stopPropagation mobile [current year]" 
- "CSS touch-action iOS Safari mobile pan-y scroll [current year]"
- "React native web touch events [technology] [current year]"
```

#### **Key Investigation Points**
1. **Library-Specific Issues**: Check GitHub issues for known mobile bugs
2. **Browser Compatibility**: Research iOS Safari limitations and workarounds
3. **CSS Property Support**: Verify touch-action and related property support
4. **Event Timing**: Understand event lifecycle and preventDefault requirements

#### **Documentation Standards**
- **TodoWrite tool**: Track investigation phases and implementation steps  
- **Parallel Research**: Use multiple WebSearch calls for comprehensive context
- **Code Comments**: Document workarounds with links to issues/solutions
- **Version Tracking**: Note library versions where bugs exist

### **🔧 MOBILE GESTURE SYSTEM ARCHITECTURE**

#### **HomeBar.tsx - Dual Gesture Implementation**
```typescript
// Feature-based mobile detection (not user-agent)
const checkMobile = () => {
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isMobileViewport = window.innerWidth <= 768;
  const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  return hasTouch && (isMobileViewport || hasCoarsePointer);
};

// Native touch events for mobile (Framer Motion fallback)
useEffect(() => {
  if (!isMobile || !homeBarRef.current) return;
  
  const handleTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0];
    const distanceFromBottom = window.innerHeight - touch.clientY;
    if (distanceFromBottom <= 25) {
      isNativeCapturing = true;
      e.preventDefault(); // Critical for iOS Safari
    }
  };
  
  // { passive: false } enables preventDefault on iOS Safari
  element.addEventListener('touchstart', handleTouchStart, { passive: false });
}, [isMobile]);

// Conditional Framer Motion (desktop only)
<motion.div
  onPanStart={isMobile ? undefined : desktopHandler}
  onPan={isMobile ? undefined : desktopHandler}
  onPanEnd={isMobile ? undefined : desktopHandler}
>
```

#### **CSS Mobile Optimization**
```css
/* globals.css additions */
.mobile-gesture-area {
  touch-action: none;
  -webkit-user-select: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
}

.ios-fixed-container {
  position: fixed;
  overflow: hidden;
  -webkit-overflow-scrolling: auto;
  overscroll-behavior: none;
  touch-action: manipulation;
}
```

### **⚡ KEY LEARNINGS FOR FUTURE ISSUES**

1. **Context is King**: Deep research prevents wasted implementation time
2. **Library Bugs Exist**: Always check GitHub issues for mobile-specific problems  
3. **Browser Differences**: iOS Safari has unique limitations requiring workarounds
4. **Feature Detection**: More reliable than user-agent sniffing for device capabilities
5. **Dual Systems**: Desktop/mobile different approaches often necessary
6. **CSS Touch Properties**: Critical for mobile gesture handling success
7. **Event Listeners**: `{ passive: false }` required for preventDefault() on iOS Safari

---

## 📋 **COMPREHENSIVE DOCUMENTATION SYSTEM**

### **8-File Synchronized Knowledge Base** (`.claude/` folder)
1. **knowledge.md** - Main technical documentation (434+ lines) - THIS FILE
2. **rules.md** - Development guidelines and coding standards (68 lines)
3. **roadmap.md** - Complete 6-phase implementation plan (480 lines)
4. **progress.md** - Granular task tracking with checkboxes (1,261+ lines)
5. **database-workflow.md** - Claude MCP context checking and SQL generation guide (150 lines)
6. **maintenance.md** - File synchronization strategy and update workflows (300+ lines)
7. **README.md** - Configuration overview and file explanations (51 lines)
8. **settings.local.json** - Local permissions and MCP tool access (17 lines)

### **MANDATORY FILE SYNCHRONIZATION WORKFLOW**

#### **Critical Synchronization Rules**
- **ANY task completion** → ALWAYS mark [✅] in progress.md + update current active task
- **Architectural changes** → Update knowledge.md version + timestamp + related files
- **New development commands** → Update both knowledge.md and rules.md simultaneously
- **Database schema changes** → Update database-workflow.md examples + knowledge.md counts
- **New files added** → Update README.md overview + maintenance.md file list

#### **File Interdependencies (Update Together)**
- **knowledge.md ↔ rules.md**: Technical stack changes, development patterns, quality standards
- **progress.md ↔ roadmap.md**: Task completion status, phase progress, priority updates
- **database-workflow.md ↔ knowledge.md**: Claude MCP context procedures, database architecture, table counts
- **README.md → ALL FILES**: File descriptions, line counts, purpose explanations

#### **Automatic Update Triggers**
**MUST Update knowledge.md When:**
- New iPhone apps added (update app registry section and component structure)
- Database tables modified (update schema count from 20 to N tables)
- New npm scripts added (update development commands section)
- Major dependencies updated (update technical stack versions)
- Architecture patterns changed (update development guidelines and patterns)

**MUST Update progress.md When:**
- ANY task completed (mark as [✅], update "Current Active Task" section)
- New tasks discovered during implementation (add to appropriate phase)
- Blockers encountered (mark as [❌], document issues and resolution)
- Time estimates change (update estimated completion times)

#### **Version Control Strategy**
- **Minor Version (X.Y.1)**: Task completions, small updates, documentation fixes
- **Major Version (X.2.0)**: New phases, architectural changes, major feature additions
- **Always update timestamp** when any change is made to knowledge.md
- **Document all changes** in maintenance.md log with date and description

#### **End-of-Session Mandatory Checklist**
- [ ] All completed tasks marked [✅] in progress.md
- [ ] Current active task updated for next session continuity
- [ ] knowledge.md version incremented if architectural changes made
- [ ] Related files updated based on interdependency rules
- [ ] Maintenance log updated with session changes and accomplishments
- [ ] All 8 files saved and synchronized across the documentation system

### **New File Integration Protocol**
**When ANY new file is added to .claude folder:**
1. **Immediately update README.md** with new file description and purpose
2. **Add to maintenance.md** ALL FILES list (update total count from 8 to N)
3. **Update knowledge.md** reference if file is architecturally relevant
4. **Define synchronization rules** if new file has dependencies with existing files
5. **Update settings.local.json** if new file requires specific permissions

---

## Database Seeding & Product Data

### **Product Database Seeding** ✅ **COMPLETED** (2025-07-25)
**Comprehensive seeding script for real product data in Supabase database**

#### **Seeding Script** (`scripts/seed-products.ts`)
- **Location**: `scripts/seed-products.ts` with full TypeScript types and error handling
- **NPM Commands**: 
  - `npm run seed:products` - Populate database with sample data
  - `npm run clean:products` - Remove all seeded data for cleanup
- **Environment**: Uses dotenv for loading Supabase credentials from `.env.local`
- **Dependencies**: tsx, dotenv, @supabase/supabase-js with Database types

#### **Data Structure Created**
- **20 Products**: Complete clothing catalog across 4 main categories
  - 5 Shirt products (Classic T-Shirt, Denim Jacket, Hoodie, Polo, Henley)
  - 5 Pants products (Slim Jeans, Chinos, Joggers, Dress Pants, Cargo Shorts)
  - 5 Shoe products (Sneakers, Canvas, Running, Boots, Sandals)
  - 5 Accessories (Baseball Cap, Leather Belt, Socks Pack, Watch, Sunglasses)
- **115 Product Variants**: Size/color combinations with unique SKUs and inventory
- **10 Categories**: Main categories and subcategories with proper hierarchy
  - Men's Clothing (with Shirts, Pants, Shoes subcategories)
  - Women's Clothing (with Shirts, Pants, Shoes subcategories)
  - Accessories, Sale categories

#### **Database Tables Populated**
- `categories` - 10 records (main + subcategories)
- `products` - 20 records with realistic pricing and descriptions
- `product_variants` - 115 records with size/color combinations
- `product_categories` - Junction table linking products to categories
- `product_images` - Schema ready for Supabase storage integration

#### **Pricing & Business Logic**
- **Realistic Pricing**: $19.99 (socks) to $149.99 (boots/watch)
- **Compare-at Pricing**: Sale items with original higher prices
- **Cost Tracking**: Cost prices included for margin calculations
- **Featured Products**: Flagged items for homepage/promotional display
- **Inventory Management**: Realistic stock levels (15-50 per variant)

#### **Database Integration Verified**
- **Claude MCP Context**: Database state verified with `mcp__supabasecm__execute_sql` for context
- **Data Integrity**: Foreign key relationships properly maintained
- **Performance Ready**: Indexed columns and optimized queries
- **RLS Compliance**: All data respects existing Row Level Security policies

---

## Strategic Development Workflow Changes

### **⭐ INTELLIGENT ROADMAP REORGANIZATION** (v1.2.2 Update)

#### **Admin Management Strategic Placement**
**Problem Identified**: Original roadmap placed admin dashboard in Phase 4, creating development inefficiency where iPhone app developers would need to manually edit database entries to test product functionality.

**Intelligent Solution Implemented**:
- **Phase 1.1.3**: Basic Admin Product Management (MOVED UP from Phase 4)
  - Essential product CRUD interface for easy content management during development
  - Image upload system for product photos
  - Basic inventory management tools
  
- **Phase 1.3**: Enhanced Admin Management (NEW strategic placement)
  - Order management basics for tracking customer orders
  - Customer management tools for user account administration
  - Available as soon as e-commerce functionality is built

- **Phase 4**: Advanced Admin Features & Analytics (REFINED scope)
  - Complex business intelligence and analytics
  - Advanced automation and integrations
  - Enterprise-level features for mature operations

#### **Development Workflow Benefits**
1. **Immediate Content Management**: Developers can add/edit products without database access
2. **Testing Support**: Admin tools available for creating test scenarios and data
3. **Realistic Development**: Build iPhone interface with real admin-managed content
4. **Efficient Iteration**: No waiting until Phase 4 to manage products and orders
5. **Logical Progression**: Basic → Advanced admin features follow natural development flow

#### **Strategic Timing Rationale**
- **Early Admin Tools**: Support iPhone interface development with real content management
- **Phased Complexity**: Basic admin first, advanced features later when business needs mature
- **Development Dependencies**: Admin tools available when e-commerce functionality needs them
- **User Experience**: Admin won't use complex features until platform is complete anyway

## 🎨 **PREMIUM ADMIN COLOR PALETTE** (Saved for Memory)

### **Charcoal + Deep Violet + Premium Status Color Palette**
> **Added**: 2025-07-26 | **For**: Admin Interface Only | **Style**: Stripe/Vercel/Linear Premium Design

```css
/* Neutrals / Background Layers */
'admin-bg-main': '#0F0F10',      /* App background — ultra black */
'admin-bg-surface': '#1A1A1C',   /* Cards, modals, containers */
'admin-bg-hover': '#232325',     /* Hover/active state layers */

/* Borders / Outlines */
'admin-border': '#2C2C2F',       /* Standard card borders or outlines */
'admin-border-soft': '#3A3A3E',  /* Inner dividers, subtle separation */

/* Text Colors */
'admin-text-primary': '#F5F5F7',   /* High-priority text (not pure white) */
'admin-text-secondary': '#B1B1B4', /* Secondary supporting text */
'admin-text-disabled': '#6F6F72',  /* Disabled UI elements or placeholders */

/* Deep Violet Accent System */
'admin-accent': '#7C3AED',         /* Core brand violet — rich and energetic */
'admin-accent-hover': '#8B5CF6',   /* Hover/active state for buttons/links */
'admin-accent-subtle': '#4C1D95',  /* Muted violet for borders or low-emphasis UI */

/* Status Colors (Premium Tone) */
'admin-success': '#34D399',        /* Emerald Green — calm and reassuring */
'admin-warning': '#FBBF24',        /* Amber Gold — rich yellow with warmth */
'admin-error': '#F43F5E',          /* Crimson Rose — deep cherry/crimson */

/* Custom Shadow System */
'admin-soft': '0 1px 4px rgba(0, 0, 0, 0.35)',
'admin-popover': '0 4px 16px rgba(0, 0, 0, 0.5)',
'admin-glow': '0 0 0 1px #7C3AED',
'admin-glow-hover': '0 0 0 1px #8B5CF6',
```

### **Usage Context**
- **Dark Mode**: Primary palette for all admin interface components
- **Light Mode**: Adapted palette with reduced intensity and proper contrast
- **Applications**: All admin pages (dashboard, products, orders, customers, analytics, settings)
- **Components**: Sidebar navigation, cards, buttons, status indicators, modals

---

**📄 Knowledge Base Maintenance**
> This file is automatically updated when significant architectural changes occur.  
> Manual edits should be made carefully and documented in version control.
> **v1.3.0 Update**: MAJOR - Added advanced mobile debugging methodology and senior-level problem-solving framework with dual gesture system architecture
> **v1.2.3 Update**: Added premium admin color palette to memory for consistent design system
> **v1.2.2 Update**: Intelligent roadmap reorganization - Admin management strategically moved for development efficiency
> **v1.2.1 Update**: Added complete product database seeding system with 20 products and 115 variants
> **v1.2.0 Update**: Added comprehensive 8-file synchronization workflow and mandatory update protocols.
> Last comprehensive update: 2025-07-29 after advanced mobile debugging methodology addition.