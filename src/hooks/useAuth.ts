import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  plan: string;
  avatar_url?: string | null;
  display_name?: string | null;
  bio?: string | null;
  company_name?: string | null;
  company_size?: string | null;
  industry?: string | null;
  logo_url?: string | null;
  two_factor_enabled?: boolean | null;
  onboarding_complete?: boolean | null;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  const getGuestFlag = () => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("auth:guest") === "1";
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer profile fetch with setTimeout to avoid deadlock
        if (session?.user) {
          if (typeof window !== "undefined") {
            localStorage.removeItem("auth:guest");
            localStorage.removeItem("guest:profile");
            localStorage.removeItem("guest:onboarding_complete");
          }
          setIsGuest(false);
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setIsGuest(getGuestFlag());
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("auth:guest");
          localStorage.removeItem("guest:profile");
          localStorage.removeItem("guest:onboarding_complete");
        }
        setIsGuest(false);
        fetchProfile(session.user.id);
      } else {
        setIsGuest(getGuestFlag());
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth:guest");
      localStorage.removeItem("guest:profile");
      localStorage.removeItem("guest:onboarding_complete");
    }
    setIsGuest(false);
  };

  const refreshProfile = async () => {
    if (session?.user) {
      await fetchProfile(session.user.id);
    }
  };

  const getPlaygroundLimit = () => {
    if (!profile) return 3; // Default free limit
    switch (profile.plan) {
      case "pro":
        return 6;
      case "exclusive":
        return 10;
      default:
        return 3;
    }
  };

  return {
    user,
    session,
    profile,
    isLoading,
    isGuest,
    signOut,
    refreshProfile,
    getPlaygroundLimit,
  };
}
