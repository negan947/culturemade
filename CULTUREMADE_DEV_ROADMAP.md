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

## Phase 2.5: iPhone Interface System (Days 3-4)

### 2.5.1 iPhone Architecture & Core Dependencies

- [ ] Install advanced dependencies:

  ```bash
  npm install three @react-three/fiber @react-three/drei
  npm install framer-motion
  npm install @reduxjs/toolkit react-redux
  npm install react-spring
  npm install @use-gesture/react
  npm install leva (for dev controls)
  npm install @react-three/postprocessing (for visual effects)
  ```

- [ ] Create iPhone architecture foundation:
  - **Three.js Scene**: 3D iPhone hardware with realistic materials and lighting
  - **Framer Motion**: Native iOS-style animations and transitions
  - **Redux Toolkit**: iPhone state management (apps, notifications, settings)
  - **React Spring**: Micro-interactions and gesture animations
  - **Use-Gesture**: Touch gestures (swipe, pinch, long press)

### 2.5.2 3D iPhone Hardware Shell

- [ ] Create `components/iphone/iPhone3D.tsx`:

  ```typescript
  import { Canvas } from '@react-three/fiber';
  import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
  import { Suspense } from 'react';
  import { iPhoneModel } from './iPhoneModel';

  export function iPhone3D({ children }: { children: React.ReactNode }) {
    return (
      <div className="h-screen w-full bg-gradient-to-br from-gray-900 to-black">
        <Canvas
          camera={{ position: [0, 0, 8], fov: 25 }}
          shadows
          gl={{ antialias: true, alpha: true }}
        >
          <Suspense fallback={null}>
            <Environment preset="studio" />
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} castShadow />

            {/* 3D iPhone Model */}
            <iPhoneModel>
              {/* Screen Content Portal */}
              <Html
                position={[0, 0, 0.01]}
                transform
                occlude
                className="w-[375px] h-[812px] pointer-events-auto"
              >
                {children}
              </Html>
            </iPhoneModel>

            <ContactShadows
              position={[0, -4, 0]}
              opacity={0.4}
              scale={15}
              blur={2}
            />
            <OrbitControls
              enableZoom={false}
              enablePan={false}
              maxPolarAngle={Math.PI / 2}
            />
          </Suspense>
        </Canvas>
      </div>
    );
  }
  ```

- [ ] Create `components/iphone/iPhoneModel.tsx`:

  ```typescript
  import { useGLTF } from '@react-three/drei';
  import { useSpring, animated } from '@react-spring/three';

  export function iPhoneModel({ children }: { children: React.ReactNode }) {
    const { nodes, materials } = useGLTF('/models/iphone14pro.gltf');

    const { rotation } = useSpring({
      rotation: [0, 0, 0],
      config: { mass: 1, tension: 120, friction: 40 }
    });

    return (
      <animated.group rotation={rotation}>
        {/* iPhone Body */}
        <mesh
          geometry={nodes.iPhone_Body.geometry}
          material={materials.iPhone_Material}
          castShadow
          receiveShadow
        />

        {/* iPhone Screen */}
        <mesh
          geometry={nodes.iPhone_Screen.geometry}
          material={materials.Screen_Material}
          position={[0, 0, 0.001]}
        >
          {children}
        </mesh>

        {/* iPhone Details (buttons, camera, etc.) */}
        <mesh
          geometry={nodes.iPhone_Details.geometry}
          material={materials.Details_Material}
        />
      </animated.group>
    );
  }

  useGLTF.preload('/models/iphone14pro.gltf');
  ```

- [ ] Source/create high-quality iPhone 14 Pro 3D model (.gltf format)
- [ ] Implement realistic materials (glass, aluminum, camera lenses)
- [ ] Add dynamic lighting that responds to content
- [ ] Create iPhone color variants (Space Black, Deep Purple, Gold, Silver)

### 2.5.3 Advanced Lock Screen with Framer Motion

- [ ] Create `components/iphone/lock-screen.tsx`:

  ```typescript
  import { motion, useAnimation } from 'framer-motion';
  import { useGesture } from '@use-gesture/react';
  import { useSpring, animated } from 'react-spring';
  import { useState, useEffect, useRef } from 'react';
  import { format } from 'date-fns';

  interface LockScreenProps {
    onUnlock: () => void;
    passcode: string;
    wallpaper?: string;
  }

  export function LockScreen({ onUnlock, passcode, wallpaper }: LockScreenProps) {
    const [enteredCode, setEnteredCode] = useState('');
    const [isError, setIsError] = useState(false);
    const [time, setTime] = useState(new Date());
    const controls = useAnimation();
    const ref = useRef<HTMLDivElement>(null);

    // Live time updates
    useEffect(() => {
      const timer = setInterval(() => setTime(new Date()), 1000);
      return () => clearInterval(timer);
    }, []);

    // Haptic feedback simulation
    const hapticFeedback = () => {
      if (navigator.vibrate) navigator.vibrate(10);
    };

    // Passcode shake animation
    const shakeAnimation = async () => {
      await controls.start({
        x: [-10, 10, -10, 10, 0],
        transition: { duration: 0.5 }
      });
    };

    // Swipe up gesture for camera/emergency
    const bind = useGesture({
      onDrag: ({ offset: [, y], velocity: [, vy] }) => {
        if (y < -100 && vy < -0.5) {
          // Quick swipe up - show camera or emergency
          console.log('Swipe up detected');
        }
      }
    });

    const handleNumberPress = async (num: string) => {
      hapticFeedback();

      if (enteredCode.length < 6) {
        const newCode = enteredCode + num;
        setEnteredCode(newCode);

        if (newCode.length === 6) {
          if (newCode === passcode) {
            await controls.start({
              scale: [1, 1.1, 1],
              transition: { duration: 0.3 }
            });
            onUnlock();
          } else {
            setIsError(true);
            await shakeAnimation();
            setTimeout(() => {
              setEnteredCode('');
              setIsError(false);
            }, 1000);
          }
        }
      }
    };

    const buttonSpring = useSpring({
      config: { tension: 300, friction: 10 }
    });

    return (
      <motion.div
        ref={ref}
        {...bind()}
        className="h-full w-full relative overflow-hidden"
        style={{
          backgroundImage: wallpaper ? `url(${wallpaper})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Dynamic Island */}
        <motion.div
          className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-black rounded-full px-4 py-1 z-50"
          animate={{ width: [120, 140, 120] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="flex items-center justify-center space-x-2">
            <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
            <span className="text-white text-xs">9:41</span>
          </div>
        </motion.div>

        {/* Lock Screen Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 backdrop-blur-sm bg-black/20">
          {/* Time Display */}
          <motion.div
            className="text-center mb-12"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div
              className="text-white text-7xl font-extralight mb-2 tracking-tight"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              {format(time, 'HH:mm')}
            </motion.div>
            <div className="text-white/80 text-xl font-light">
              {format(time, 'EEEE, MMMM d')}
            </div>
          </motion.div>

          {/* Passcode Input */}
          <motion.div
            className="mb-8"
            animate={controls}
          >
            <p className="text-white text-center mb-6 font-medium">Enter Passcode</p>
            <div className="flex justify-center space-x-4 mb-12">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className={`w-4 h-4 rounded-full border-2 ${
                    i < enteredCode.length
                      ? 'bg-white border-white'
                      : 'border-white/50'
                  } ${isError ? 'border-red-500' : ''}`}
                  animate={i < enteredCode.length ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.2 }}
                />
              ))}
            </div>
          </motion.div>

          {/* Number Pad with Advanced Animations */}
          <div className="grid grid-cols-3 gap-8 w-full max-w-xs">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'delete'].map((num, i) => (
              <motion.button
                key={i}
                onClick={() => {
                  if (num === 'delete') {
                    setEnteredCode(prev => prev.slice(0, -1));
                  } else if (num !== '') {
                    handleNumberPress(num.toString());
                  }
                }}
                className={`w-20 h-20 rounded-full text-white text-2xl font-light backdrop-blur-md
                  ${num !== '' ? 'bg-white/10 border border-white/20' : ''}
                  transition-all duration-200`}
                disabled={num === ''}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={{
                  backgroundColor: num !== '' ? 'rgba(255,255,255,0.1)' : 'transparent'
                }}
              >
                {num === 'delete' ? '⌫' : num}
              </motion.button>
            ))}
          </div>

          {/* Emergency & Camera Access */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-12">
            <motion.button
              className="text-white/70 text-sm"
              whileTap={{ scale: 0.9 }}
            >
              Emergency
            </motion.button>
            <motion.button
              className="text-white/70 text-sm"
              whileTap={{ scale: 0.9 }}
            >
              Camera
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  }
  ```

- [ ] Implement Face ID/Touch ID biometric simulation with Three.js face detection
- [ ] Create dynamic wallpaper system with particle effects
- [ ] Add realistic iOS notification system with slide animations
- [ ] Implement Control Center swipe-down gesture
- [ ] Add Emergency SOS and Camera quick access
- [ ] Create realistic battery indicator with charging animations

### 2.5.4 Redux Store & iPhone State Management

- [ ] Create `store/iphone-store.ts`:

  ```typescript
  import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";

  interface App {
    id: string;
    name: string;
    icon: string;
    component: string;
    position: { x: number; y: number; page: number };
    isSystem: boolean;
    badgeCount?: number;
  }

  interface iPhoneState {
    isLocked: boolean;
    passcode: string;
    currentApp: string | null;
    isAppOpen: boolean;
    homeScreenPage: number;
    apps: App[];
    notifications: Notification[];
    battery: number;
    signal: number;
    wifi: boolean;
    bluetooth: boolean;
    dndMode: boolean;
    brightness: number;
    volume: number;
    wallpaper: string;
    theme: "light" | "dark";
  }

  const iPhoneSlice = createSlice({
    name: "iphone",
    initialState: {
      isLocked: true,
      passcode: process.env.NEXT_PUBLIC_IPHONE_PASSCODE || "123456",
      currentApp: null,
      isAppOpen: false,
      homeScreenPage: 0,
      apps: [],
      notifications: [],
      battery: 100,
      signal: 4,
      wifi: true,
      bluetooth: true,
      dndMode: false,
      brightness: 80,
      volume: 70,
      wallpaper: "/wallpapers/default.jpg",
      theme: "dark",
    } as iPhoneState,
    reducers: {
      unlockPhone: (state) => {
        state.isLocked = false;
      },
      lockPhone: (state) => {
        state.isLocked = true;
        state.currentApp = null;
        state.isAppOpen = false;
      },
      openApp: (state, action: PayloadAction<string>) => {
        state.currentApp = action.payload;
        state.isAppOpen = true;
      },
      closeApp: (state) => {
        state.currentApp = null;
        state.isAppOpen = false;
      },
      setHomeScreenPage: (state, action: PayloadAction<number>) => {
        state.homeScreenPage = action.payload;
      },
      updateAppPosition: (
        state,
        action: PayloadAction<{
          id: string;
          position: { x: number; y: number; page: number };
        }>
      ) => {
        const app = state.apps.find((a) => a.id === action.payload.id);
        if (app) app.position = action.payload.position;
      },
      addNotification: (state, action: PayloadAction<Notification>) => {
        state.notifications.unshift(action.payload);
      },
      // ... more reducers
    },
  });

  export const iPhoneStore = configureStore({
    reducer: {
      iphone: iPhoneSlice.reducer,
    },
  });
  ```

- [ ] Create iPhone context provider with Redux integration
- [ ] Implement app state persistence in localStorage
- [ ] Add realistic system settings (WiFi, Bluetooth, etc.)
- [ ] Create notification system with badge counts

### 2.5.5 Advanced Home Screen with App Physics

- [ ] Create `components/iphone/home-screen.tsx`:

  ```typescript
  import { motion, AnimatePresence, PanInfo } from 'framer-motion';
  import { useGesture } from '@use-gesture/react';
  import { useSelector, useDispatch } from 'react-redux';
  import { useState, useEffect } from 'react';
  import { Canvas } from '@react-three/fiber';
  import { AppIcon3D } from './app-icon-3d';
  import { Wallpaper3D } from './wallpaper-3d';
  import { StatusBar } from './status-bar';

  interface HomeScreenProps {
    onAppOpen: (appId: string) => void;
  }

  export function HomeScreen({ onAppOpen }: HomeScreenProps) {
    const dispatch = useDispatch();
    const {
      apps,
      homeScreenPage,
      wallpaper,
      theme,
      notifications
    } = useSelector((state: RootState) => state.iphone);

    const [isReordering, setIsReordering] = useState(false);
    const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });

    // Parallax effect for wallpaper
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX - window.innerWidth / 2) / 50;
      const y = (e.clientY - window.innerHeight / 2) / 50;
      setParallaxOffset({ x, y });
    };

    useEffect(() => {
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Gesture handling for page navigation
    const bind = useGesture({
      onDrag: ({ offset: [x], velocity: [vx], direction: [dx] }) => {
        if (Math.abs(vx) > 0.5) {
          if (dx > 0 && homeScreenPage > 0) {
            dispatch(setHomeScreenPage(homeScreenPage - 1));
          } else if (dx < 0 && homeScreenPage < Math.ceil(apps.length / 20) - 1) {
            dispatch(setHomeScreenPage(homeScreenPage + 1));
          }
        }
      },
      onSwipeStart: () => setIsReordering(false)
    });

    const currentPageApps = apps.filter(app =>
      app.position.page === homeScreenPage && !app.isSystem
    );

    const dockApps = apps.filter(app => app.position.page === -1); // Dock apps

    return (
      <motion.div
        {...bind()}
        className="h-full w-full relative overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* 3D Wallpaper Background */}
        <div className="absolute inset-0 -z-10">
          <Canvas camera={{ position: [0, 0, 5] }}>
            <Wallpaper3D
              type={wallpaper}
              parallax={parallaxOffset}
              theme={theme}
            />
          </Canvas>
        </div>

        {/* Status Bar */}
        <StatusBar />

        {/* Search Bar */}
        <motion.div
          className="mx-4 mt-4 mb-6"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="bg-white/10 backdrop-blur-md rounded-xl px-4 py-3 flex items-center space-x-3">
            <div className="text-white/60">🔍</div>
            <span className="text-white/60 text-sm">Search</span>
          </div>
        </motion.div>

        {/* Apps Grid with Physics */}
        <div className="px-4 flex-1">
          <motion.div
            className="grid grid-cols-4 gap-4 h-full content-start"
            layout
          >
            <AnimatePresence>
              {currentPageApps.map((app, index) => (
                <motion.div
                  key={app.id}
                  layout
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: 1,
                    opacity: 1,
                    transition: { delay: index * 0.05 }
                  }}
                  exit={{ scale: 0, opacity: 0 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  drag={isReordering}
                  dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                  onDragStart={() => setIsReordering(true)}
                  onDragEnd={(_, info: PanInfo) => {
                    // Handle app reordering logic
                    const newPosition = calculateNewPosition(info, app.position);
                    dispatch(updateAppPosition({ id: app.id, position: newPosition }));
                    setIsReordering(false);
                  }}
                >
                  <AppIcon3D
                    app={app}
                    onClick={() => onAppOpen(app.id)}
                    onLongPress={() => setIsReordering(true)}
                    isReordering={isReordering}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Page Indicators */}
        <div className="flex justify-center space-x-2 mb-4">
          {Array.from({ length: Math.ceil(apps.length / 20) }).map((_, i) => (
            <motion.div
              key={i}
              className={`w-2 h-2 rounded-full ${
                i === homeScreenPage ? 'bg-white' : 'bg-white/30'
              }`}
              whileTap={{ scale: 1.2 }}
              onClick={() => dispatch(setHomeScreenPage(i))}
            />
          ))}
        </div>

        {/* 3D Dock with Glass Effect */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
        >
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-3 border border-white/20 shadow-2xl">
            <div className="flex space-x-4">
              {dockApps.map((app) => (
                <AppIcon3D
                  key={app.id}
                  app={app}
                  onClick={() => onAppOpen(app.id)}
                  isDockApp
                  scale={1.2}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Home Indicator */}
        <motion.div
          className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-white/60 rounded-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        />

        {/* Notification Badge System */}
        {notifications.length > 0 && (
          <motion.div
            className="absolute top-16 right-4 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring" }}
          >
            {notifications.length}
          </motion.div>
        )}
      </motion.div>
    );
  }

  // Helper function for app position calculation
  function calculateNewPosition(info: PanInfo, currentPosition: any) {
    // Complex logic for determining new grid position based on drag
    // This would calculate the nearest grid slot
    return currentPosition; // Simplified for example
  }
  ```

- [ ] Create `components/iphone/app-icon-3d.tsx` with Three.js 3D app icons
- [ ] Implement realistic app icon animations with spring physics
- [ ] Create dynamic wallpaper system with Three.js particles and shaders
- [ ] Add Control Center swipe-down with gesture recognition
- [ ] Implement app folder system with physics-based opening/closing
- [ ] Create realistic notification system with interactive banners

### 2.5.4 Create Core iPhone Apps

- [ ] Create `components/iphone/apps/phone-app.tsx`:

  ```typescript
  export function PhoneApp({ onClose }: { onClose: () => void }) {
    return (
      <div className="h-full w-full bg-black text-white">
        <div className="flex items-center justify-between p-4 bg-gray-900">
          <button onClick={onClose} className="text-blue-400">Cancel</button>
          <h1 className="text-lg font-medium">Phone</h1>
          <div></div>
        </div>
        <div className="p-4">
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📞</div>
            <p className="text-gray-400">Phone app simulation</p>
          </div>
        </div>
      </div>
    );
  }
  ```

- [ ] Create `components/iphone/apps/camera-app.tsx` with camera simulation
- [ ] Create `components/iphone/apps/photos-app.tsx` with gallery
- [ ] Create `components/iphone/apps/settings-app.tsx` with iPhone settings
- [ ] Create `components/iphone/apps/safari-app.tsx` with browser simulation
- [ ] Create `components/iphone/apps/messages-app.tsx` with messages
- [ ] Create `components/iphone/apps/calculator-app.tsx` with working calculator
- [ ] Create `components/iphone/apps/weather-app.tsx` with weather info
- [ ] Create `components/iphone/apps/clock-app.tsx` with clock/timer
- [ ] Create `components/iphone/apps/calendar-app.tsx` with calendar
- [ ] Create `components/iphone/apps/notes-app.tsx` with notes app
- [ ] Create `components/iphone/apps/music-app.tsx` with music player
- [ ] Create `components/iphone/apps/mail-app.tsx` with email app
- [ ] Create `components/iphone/apps/appstore-app.tsx` with app store simulation

### 2.5.5 E-Commerce Integration

- [ ] Create `components/iphone/apps/culturemade-app.tsx`:

  ```typescript
  import { useState } from 'react';
  import { ProductGrid } from './culturemade/product-grid';
  import { ProductDetail } from './culturemade/product-detail';
  import { Cart } from './culturemade/cart';
  import { Profile } from './culturemade/profile';

  export function CultureMadeApp({ onClose }: { onClose: () => void }) {
    const [currentView, setCurrentView] = useState('home');
    const [selectedProduct, setSelectedProduct] = useState(null);

    return (
      <div className="h-full w-full bg-black text-white">
        {/* App Header */}
        <div className="flex items-center justify-between p-4 bg-gray-900">
          <button onClick={onClose} className="text-blue-400">Close</button>
          <h1 className="text-lg font-medium">CultureMade</h1>
          <button className="text-blue-400">Cart</button>
        </div>

        {/* App Content */}
        <div className="flex-1 overflow-auto">
          {currentView === 'home' && (
            <ProductGrid onProductSelect={setSelectedProduct} />
          )}
          {currentView === 'product' && (
            <ProductDetail product={selectedProduct} onBack={() => setCurrentView('home')} />
          )}
          {currentView === 'cart' && (
            <Cart onBack={() => setCurrentView('home')} />
          )}
          {currentView === 'profile' && (
            <Profile onBack={() => setCurrentView('home')} />
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="bg-gray-900 border-t border-gray-800 px-4 py-2">
          <div className="flex justify-around">
            <button
              onClick={() => setCurrentView('home')}
              className={`py-2 px-4 rounded ${currentView === 'home' ? 'bg-white text-black' : 'text-gray-400'}`}
            >
              Home
            </button>
            <button
              onClick={() => setCurrentView('cart')}
              className={`py-2 px-4 rounded ${currentView === 'cart' ? 'bg-white text-black' : 'text-gray-400'}`}
            >
              Cart
            </button>
            <button
              onClick={() => setCurrentView('profile')}
              className={`py-2 px-4 rounded ${currentView === 'profile' ? 'bg-white text-black' : 'text-gray-400'}`}
            >
              Profile
            </button>
          </div>
        </div>
      </div>
    );
  }
  ```

- [ ] Create e-commerce sub-components within CultureMade app
- [ ] Implement product browsing within iPhone interface
- [ ] Add cart functionality optimized for mobile
- [ ] Create checkout flow within iPhone constraints
- [ ] Add user authentication within the app
- [ ] Implement push notifications simulation

### 2.5.6 iPhone State Management

- [ ] Create `hooks/use-iphone-state.ts`:

  ```typescript
  import { useState, useEffect } from "react";

  export function useIphoneState() {
    const [isLocked, setIsLocked] = useState(true);
    const [currentApp, setCurrentApp] = useState<string | null>(null);
    const [isAppOpen, setIsAppOpen] = useState(false);
    const [passcode] = useState(
      process.env.NEXT_PUBLIC_IPHONE_PASSCODE || "123456"
    );

    const unlockPhone = () => {
      setIsLocked(false);
    };

    const lockPhone = () => {
      setIsLocked(true);
      setCurrentApp(null);
      setIsAppOpen(false);
    };

    const openApp = (appId: string) => {
      setCurrentApp(appId);
      setIsAppOpen(true);
    };

    const closeApp = () => {
      setCurrentApp(null);
      setIsAppOpen(false);
    };

    const goHome = () => {
      setCurrentApp(null);
      setIsAppOpen(false);
    };

    return {
      isLocked,
      currentApp,
      isAppOpen,
      passcode,
      unlockPhone,
      lockPhone,
      openApp,
      closeApp,
      goHome,
    };
  }
  ```

- [ ] Create context for iPhone state management
- [ ] Implement app switching and multitasking
- [ ] Add iPhone-specific gestures (swipe up, swipe down)
- [ ] Create realistic animations and transitions
- [ ] Add haptic feedback simulation

### 2.5.7 Advanced App Rendering & Transition System

- [ ] Create `components/iphone/app-renderer.tsx`:

  ```typescript
  import { motion, AnimatePresence } from 'framer-motion';
  import { Suspense, lazy } from 'react';
  import { useSelector } from 'react-redux';
  import { Canvas } from '@react-three/fiber';
  import { Html } from '@react-three/drei';

  // Lazy load all iPhone apps for performance
  const PhoneApp = lazy(() => import('./apps/phone-app'));
  const CameraApp = lazy(() => import('./apps/camera-app'));
  const CultureMadeApp = lazy(() => import('./apps/culturemade-app'));
  // ... other apps

  interface AppRendererProps {
    appId: string | null;
    onClose: () => void;
    onHome: () => void;
  }

  export function AppRenderer({ appId, onClose, onHome }: AppRendererProps) {
    const { theme, apps } = useSelector((state: RootState) => state.iphone);

    if (!appId) return null;

    const renderApp = () => {
      switch (appId) {
        case 'phone':
          return <PhoneApp onClose={onClose} />;
        case 'camera':
          return <CameraApp onClose={onClose} />;
        case 'culturemade':
          return <CultureMadeApp onClose={onClose} />;
        // ... other cases
        default:
          return <DefaultApp appId={appId} onClose={onClose} />;
      }
    };

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={appId}
          className="absolute inset-0 z-50"
          initial={{
            scale: 0.1,
            opacity: 0,
            borderRadius: '50%'
          }}
          animate={{
            scale: 1,
            opacity: 1,
            borderRadius: '0%'
          }}
          exit={{
            scale: 0.1,
            opacity: 0,
            borderRadius: '50%'
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
            mass: 0.8
          }}
        >
          <Suspense fallback={<AppLoadingScreen appId={appId} />}>
            {renderApp()}
          </Suspense>
        </motion.div>
      </AnimatePresence>
    );
  }
  ```

- [ ] Create app transition animations with realistic iOS spring physics
- [ ] Implement app backgrounding/foregrounding state management
- [ ] Add app memory management and cleanup
- [ ] Create universal app loading screens with skeleton UI

### 2.5.8 Main iPhone Integration & Route Updates

- [ ] Update `app/page.tsx` to use advanced iPhone system:

  ```typescript
  'use client';

  import { Provider } from 'react-redux';
  import { iPhone3D } from '@/components/iphone/iPhone3D';
  import { LockScreen } from '@/components/iphone/lock-screen';
  import { HomeScreen } from '@/components/iphone/home-screen';
  import { AppRenderer } from '@/components/iphone/app-renderer';
  import { NotificationSystem } from '@/components/iphone/notification-system';
  import { ControlCenter } from '@/components/iphone/control-center';
  import { iPhoneStore } from '@/store/iphone-store';
  import { useSelector, useDispatch } from 'react-redux';

  function iPhoneInterface() {
    const dispatch = useDispatch();
    const {
      isLocked,
      currentApp,
      isAppOpen,
      passcode
    } = useSelector((state: RootState) => state.iphone);

    const unlockPhone = () => dispatch(unlockPhone());
    const openApp = (appId: string) => dispatch(openApp(appId));
    const closeApp = () => dispatch(closeApp());

    return (
      <iPhone3D>
        <div className="relative w-full h-full overflow-hidden bg-black">
          {/* Lock Screen */}
          {isLocked && (
            <LockScreen
              onUnlock={unlockPhone}
              passcode={passcode}
              wallpaper="/wallpapers/default.jpg"
            />
          )}

          {/* Home Screen */}
          {!isLocked && !isAppOpen && (
            <HomeScreen onAppOpen={openApp} />
          )}

          {/* App Renderer */}
          {!isLocked && isAppOpen && (
            <AppRenderer
              appId={currentApp}
              onClose={closeApp}
              onHome={closeApp}
            />
          )}

          {/* Global Systems */}
          <NotificationSystem />
          <ControlCenter />
        </div>
      </iPhone3D>
    );
  }

  export default function HomePage() {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <Provider store={iPhoneStore}>
          <iPhoneInterface />
        </Provider>
      </div>
    );
  }
  ```

- [ ] Implement iPhone-aware routing system
- [ ] Add development mode toggle for traditional interface
- [ ] Create responsive iPhone sizing for different screen sizes
- [ ] Add iPhone orientation handling (portrait/landscape)
- [ ] Implement iPhone performance monitoring and optimization

---

## Phase 3: Product Management System (Days 5-6)

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
