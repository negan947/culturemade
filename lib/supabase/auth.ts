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
  const user = await requireAuth();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || profile?.role !== "admin") {
    redirect("/");
  }

  return user;
}

export async function getUserProfile() {
  const { user } = await getUser();
  if (!user) return { user: null, profile: null };

  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return { user, profile, error };
}

export async function isAdmin() {
  const { user } = await getUser();
  if (!user) return false;

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return profile?.role === "admin";
} 