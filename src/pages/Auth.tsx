import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, ArrowRight, Sparkles, Chrome, Check } from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");
const REDIRECT_KEY = "auth:redirect";

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const redirectTarget = (() => {
    const fromState = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
    const fromStorage = localStorage.getItem(REDIRECT_KEY);
    return fromState || fromStorage || "/playground";
  })();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        localStorage.removeItem(REDIRECT_KEY);
        navigate(redirectTarget);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        localStorage.removeItem(REDIRECT_KEY);
        navigate(redirectTarget);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, redirectTarget]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    const errorDescription = params.get("error_description");
    if (error) {
      toast({
        title: "Authentication error",
        description: errorDescription || error,
        variant: "destructive",
      });
    }
  }, [toast]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    try {
      emailSchema.parse(email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0].message;
      }
    }

    try {
      passwordSchema.parse(password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.password = e.errors[0].message;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({
              title: "Login failed",
              description: "Invalid email or password. Please try again.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Login failed",
              description: error.message,
              variant: "destructive",
            });
          }
          return;
        }

        toast({
          title: "Welcome back!",
          description: "You have been logged in successfully.",
        });
        localStorage.removeItem(REDIRECT_KEY);
        sessionStorage.setItem("just_logged_in", "1");
        navigate(redirectTarget);
      } else {
        const redirectUrl = `${window.location.origin}/`;

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
          },
        });

        if (error) {
          if (error.message.includes("User already registered")) {
            toast({
              title: "Account exists",
              description: "This email is already registered. Please login instead.",
              variant: "destructive",
            });
            setIsLogin(true);
          } else {
            toast({
              title: "Signup failed",
              description: error.message,
              variant: "destructive",
            });
          }
          return;
        }

        toast({
          title: "Account created!",
          description: "You can now start creating playgrounds.",
        });
        localStorage.removeItem(REDIRECT_KEY);
        sessionStorage.setItem("just_logged_in", "1");
        navigate(redirectTarget);
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    localStorage.setItem(REDIRECT_KEY, redirectTarget);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      toast({
        title: "Google sign-in failed",
        description: error.message,
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const handleGuestContinue = () => {
    localStorage.setItem("auth:guest", "1");
    localStorage.setItem(REDIRECT_KEY, redirectTarget);
    navigate(redirectTarget);
  };

  return (
    <div className="min-h-screen bg-background grid lg:grid-cols-[1.1fr_0.9fr]">
      {/* Left side - Branding */}
      <div className="relative hidden lg:flex items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#4f46e5_0%,transparent_55%),radial-gradient(circle_at_bottom,#0ea5e9_0%,transparent_45%)] opacity-60 animate-pulse" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        
        {/* Animated orbits */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-accent/20 rounded-full blur-3xl animate-blob" />
          <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-blob animation-delay-4000" />
        </div>
        
        <div className="relative z-10 max-w-md text-white animate-fade-in">
          <div className="flex items-center gap-3 mb-8 animate-slide-down">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <Sparkles className="w-6 h-6 text-white animate-pulse-glow" />
            </div>
            <span className="text-3xl font-bold">ModelStack</span>
          </div>
          <h1 className="text-4xl font-bold mb-4 leading-tight animate-slide-down animation-delay-200">
            Build AI-powered bots in minutes.
          </h1>
          <p className="text-white/75 text-lg animate-slide-down animation-delay-400">
            Launch, customize, and deploy intelligent assistants with zero code.
            Your workspace stays organized and your clients get instant answers.
          </p>

          <div className="mt-10 grid gap-4">
            {[
              "Free plan to get started fast",
              "Pro-grade workflows with logic blocks",
              "Enterprise controls for teams and billing",
            ].map((text, index) => (
              <div 
                key={text} 
                className="flex items-center gap-3 animate-slide-right"
                style={{ animationDelay: `${600 + index * 150}ms` }}
              >
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <span className="text-white/80">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="flex items-center justify-center p-8 animate-fade-in">
        <div className="w-full max-w-md animate-slide-up">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center animate-slide-down">
            <Sparkles className="w-8 h-8 text-accent animate-pulse-glow" />
            <span className="text-2xl font-bold">ModelStack</span>
          </div>

          <div className="bg-card border border-border/60 rounded-2xl p-8 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.5)] hover:shadow-[0_25px_70px_-30px_rgba(79,70,229,0.4)] transition-all duration-500">
            <div className="mb-6 animate-slide-down animation-delay-300">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {isLogin ? "Secure Access" : "Get Started"}
              </p>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {isLogin ? "Welcome back" : "Create your account"}
              </h2>
              <p className="text-muted-foreground">
                {isLogin
                  ? "Enter your credentials to access your playgrounds"
                  : "Start building AI bots with your free account"}
              </p>
            </div>

            <div className="grid gap-4 animate-slide-down animation-delay-400">
              <Button
                type="button"
                variant="outline"
                className="w-full justify-center gap-2 hover:border-accent/50 hover:bg-accent/5 transition-all"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
              >
                <Chrome className="w-4 h-4" />
                Continue with Google
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-center gap-2 hover:bg-accent/10 transition-all"
                onClick={handleGuestContinue}
                disabled={isLoading}
              >
                Continue as guest
              </Button>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px w-full bg-border" />
                or continue with email
                <span className="h-px w-full bg-border" />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-6 animate-slide-down animation-delay-500">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 focus:ring-2 focus:ring-accent/50 transition-all"
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive animate-slide-down">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 focus:ring-2 focus:ring-accent/50 transition-all"
                  />
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-accent hover:bg-accent/90 text-white font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-accent/30"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {isLogin ? "Sign in" : "Create account"}
                    <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center animate-slide-down animation-delay-600">
              <p className="text-sm text-muted-foreground mb-3">
                {isLogin ? "New to ModelStack?" : "Already using ModelStack?"}
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrors({});
                  setEmail("");
                  setPassword("");
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg transition-colors font-medium text-sm"
              >
                {isLogin
                  ? "Create an account"
                  : "Sign in with email"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
