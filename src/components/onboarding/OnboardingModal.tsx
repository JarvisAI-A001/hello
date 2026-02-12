import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, CheckCircle2 } from "lucide-react";

const companySizes = [
  "Solo",
  "2 to 20",
  "20 to 100",
  "100 to 1000",
  "1000+",
];

export function OnboardingModal() {
  const { user, profile, refreshProfile, isGuest } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(1);
  const guestProfile = useMemo(() => {
    if (!isGuest || typeof window === "undefined") return null;
    const raw = localStorage.getItem("guest:profile");
    return raw ? (JSON.parse(raw) as { display_name?: string; company_name?: string; company_size?: string }) : null;
  }, [isGuest]);
  const [displayName, setDisplayName] = useState(profile?.display_name || guestProfile?.display_name || "");
  const [companyName, setCompanyName] = useState(profile?.company_name || guestProfile?.company_name || "");
  const [companySize, setCompanySize] = useState(profile?.company_size || guestProfile?.company_size || "");
  const [isSaving, setIsSaving] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [localComplete, setLocalComplete] = useState(false);

  const allowedPaths = ["/", "/playground", "/settings"];
  const isAllowedPath = allowedPaths.includes(location.pathname);
  const profileCreatedAt = profile?.created_at ? new Date(profile.created_at).getTime() : null;
  const isNewUser = profileCreatedAt ? Date.now() - profileCreatedAt < 24 * 60 * 60 * 1000 : true;
  const guestComplete = typeof window !== "undefined" && localStorage.getItem("guest:onboarding_complete") === "1";
  const justLoggedIn = typeof window !== "undefined" && sessionStorage.getItem("just_logged_in") === "1";
  const isOpen = Boolean(
    isAllowedPath &&
    !localComplete &&
    ((user && profile && !profile.onboarding_complete && isNewUser) ||
      (isGuest && !guestComplete) ||
      justLoggedIn)
  );

  const canContinue = useMemo(() => {
    if (step === 1) return displayName.trim().length > 0;
    if (step === 2) return companyName.trim().length > 0;
    if (step === 3) return companySize.trim().length > 0;
    return false;
  }, [step, displayName, companyName, companySize]);

  const handleFinish = async () => {
    if (isGuest) {
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "guest:profile",
          JSON.stringify({
            display_name: displayName,
            company_name: companyName,
            company_size: companySize,
          })
        );
        localStorage.setItem("guest:onboarding_complete", "1");
        sessionStorage.removeItem("just_logged_in");
      }
      setLocalComplete(true);
      setShowWelcome(true);
      setTimeout(() => {
        setShowWelcome(false);
        navigate("/");
      }, 2000);
      return;
    }
    if (!user) return;
    setIsSaving(true);
    try {
      await supabase
        .from("profiles")
        .update({
          display_name: displayName,
          company_name: companyName,
          company_size: companySize,
          onboarding_complete: true,
        })
        .eq("user_id", user.id);
      setLocalComplete(true);
      setShowWelcome(true);
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("just_logged_in");
      }
      await refreshProfile();
      setTimeout(() => {
        setShowWelcome(false);
        setLocalComplete(true);
        navigate("/");
      }, 2000);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen && !showWelcome) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background/90 backdrop-blur-sm">
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-xl rounded-3xl border border-border bg-card p-8 shadow-xl relative">
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-accent/10 rounded-full blur-3xl" />
          <div className="relative space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Welcome setup</p>
                <h2 className="text-xl font-semibold text-foreground">Let’s personalize your workspace</h2>
              </div>
            </div>

            {step === 1 && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">What’s your name?</label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Company name</label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Your company"
                />
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Do you work as a…</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {companySizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setCompanySize(size)}
                      className={`rounded-xl border px-4 py-3 text-left text-sm transition-all ${
                        companySize === size
                          ? "border-accent bg-accent/10 text-foreground"
                          : "border-border text-muted-foreground hover:border-accent/50"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">Step {step} of 3</div>
              <div className="flex gap-2">
                {step > 1 && (
                  <Button variant="outline" onClick={() => setStep(step - 1)}>
                    Back
                  </Button>
                )}
                {step < 3 ? (
                  <Button onClick={() => setStep(step + 1)} disabled={!canContinue}>
                    Continue
                  </Button>
                ) : (
                  <Button onClick={handleFinish} disabled={!canContinue || isSaving}>
                    Finish
                  </Button>
                )}
              </div>
            </div>
          </div>

          {showWelcome && (
            <div className="fixed inset-0 z-[120] bg-background flex items-center justify-center">
              <div className="absolute inset-0 pointer-events-none">
                <div className="welcome-lens lens-top-right" />
                <div className="welcome-lens lens-center" />
                <div className="welcome-lens lens-bottom-left" />
                <div className="welcome-lens lens-extra-1" />
                <div className="welcome-lens lens-extra-2" />
                <div className="welcome-lens lens-extra-3" />
                <div className="welcome-lens lens-extra-4" />
                <div className="welcome-lens lens-extra-5" />
                <div className="welcome-lens lens-extra-6" />
              </div>
              <div className="text-center animate-fade-in relative z-10">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h3 className="text-3xl font-semibold text-foreground">
                  Welcome to ModelStack
                </h3>
                <p className="text-muted-foreground mt-1">You’re all set.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
