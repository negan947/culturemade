"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const registerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password confirmation is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

export function RegisterForm({ onSuccess, redirectTo = "/" }: RegisterFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  // Helper function to create profile with retry logic
  const createUserProfile = async (userId: string, fullName: string, retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        const { error } = await supabase
          .from("profiles")
          .insert({
            id: userId,
            role: "customer",
            full_name: fullName,
          });

        if (!error) {
          return { success: true };
        }

        // If it's a unique constraint violation, the profile might already exist
        if (error.code === '23505' || error.message.includes('duplicate key')) {
          console.log('Profile already exists, continuing...');
          return { success: true };
        }

        // For other errors, retry after a short delay
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
          continue;
        }

        return { success: false, error };
      } catch (err) {
        console.error(`Profile creation attempt ${i + 1} failed:`, err);
        if (i === retries - 1) {
          return { success: false, error: err };
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
    return { success: false, error: new Error('Max retries exceeded') };
  };

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // Step 1: Create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
          },
        },
      });

      if (authError) {
        setErrorMessage(authError.message);
        return;
      }

      if (!authData.user) {
        setErrorMessage("Failed to create user account. Please try again.");
        return;
      }

      // Step 2: Wait a moment for the auth user to be fully created
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 3: Create user profile with retry logic
      const profileResult = await createUserProfile(authData.user.id, data.fullName);

      if (!profileResult.success) {
        console.error("Profile creation failed:", profileResult.error);
        // Don't show this error to user if auth was successful
        // The trigger should handle profile creation automatically
        console.log("Profile creation failed, but auth was successful. This may be handled by database triggers.");
      }

      // Step 4: Handle success
      if (authData.user.email_confirmed_at) {
        // User is automatically confirmed (development mode)
        setSuccessMessage("Account created successfully! You can now sign in.");
        
        if (onSuccess) {
          setTimeout(() => onSuccess(), 1500);
        } else {
          setTimeout(() => {
            window.location.href = redirectTo;
          }, 1500);
        }
      } else {
        // User needs to confirm email
        setSuccessMessage(
          "Account created successfully! Please check your email to verify your account before signing in."
        );
      }

    } catch (error) {
      console.error("Registration error:", error);
      setErrorMessage("An unexpected error occurred during registration. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          type="text"
          placeholder="Enter your full name"
          {...register("fullName")}
          disabled={isLoading}
        />
        {errors.fullName && (
          <p className="text-sm text-destructive">{errors.fullName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          {...register("email")}
          disabled={isLoading}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Enter your password"
          {...register("password")}
          disabled={isLoading}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="Confirm your password"
          {...register("confirmPassword")}
          disabled={isLoading}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      {errorMessage && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="p-3 text-sm text-green-800 bg-green-50 border border-green-200 rounded-md">
          {successMessage}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Creating account..." : "Create Account"}
      </Button>

      {/* Debug info for development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-2 bg-gray-100 rounded text-xs text-gray-600">
          <strong>Dev Note:</strong> If you see database errors, run the profile creation trigger SQL in Supabase dashboard.
        </div>
      )}
    </form>
  );
} 