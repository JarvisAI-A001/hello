import { useEffect, useRef, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Camera, Shield, CreditCard, User, Loader2, Upload, Moon, Sun, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";

export default function Settings() {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLogoUploading, setIsLogoUploading] = useState(false);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [emailInput, setEmailInput] = useState(user?.email || "");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatar_url || "");
  const [showBilling, setShowBilling] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(profile?.plan || "free");

  const MAX_DATA_URL_BYTES = 200 * 1024;

  const plans = [
    { id: "free", name: "Free", price: "$0", desc: "Get started with 50 messages per chat." },
    { id: "starter", name: "Starter 🌱", price: "$10/mo", desc: "Unlock 100 messages per chat and live calendar." },
    { id: "optimizer", name: "Optimizer 🚀", price: "$100/mo", desc: "200 messages per chat, automation and syncing." },
    { id: "enterprise", name: "Enterprise 👑", price: "$300/mo", desc: "Unlimited messages, priority support, full controls." },
  ];

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.display_name || "");
    setBio(profile.bio || "");
    setCompanyName(profile.company_name || "");
    setIndustry(profile.industry || "");
    setLogoUrl(profile.logo_url || "");
    setTwoFactorEnabled(Boolean(profile.two_factor_enabled));
    setAvatarPreview(profile.avatar_url || "");
    setSelectedPlan(profile.plan || "free");
  }, [profile]);

  const updateProfileAvatar = async (avatarUrl: string) => {
    if (!user) return;
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("user_id", user.id);

    if (updateError) throw updateError;
    setAvatarPreview(avatarUrl);
    await refreshProfile();
  };

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;
    setIsUploading(true);
    try {
      const localPreview = URL.createObjectURL(file);
      setAvatarPreview(localPreview);

      const fileExt = file.name.split(".").pop() || "png";
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true, contentType: file.type });

      if (uploadError) {
        if (file.size <= MAX_DATA_URL_BYTES) {
          const reader = new FileReader();
          const dataUrl = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error("Failed to read image"));
            reader.readAsDataURL(file);
          });

          await updateProfileAvatar(dataUrl);
          toast({
            title: "Profile photo updated",
            description: "Stored as a lightweight inline image.",
          });
          return;
        }

        throw uploadError;
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const avatarUrl = data.publicUrl;

      await updateProfileAvatar(avatarUrl);
      toast({ title: "Profile photo updated" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "Upload failed",
        description: `Please try another image or check storage settings. ${message}`,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    if (!user) return;
    setIsLogoUploading(true);
    try {
      const localPreview = URL.createObjectURL(file);
      setLogoUrl(localPreview);

      const fileExt = file.name.split(".").pop() || "png";
      const filePath = `${user.id}/logo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("logos")
        .upload(filePath, file, { upsert: true, contentType: file.type });

      if (uploadError) {
        if (file.size <= MAX_DATA_URL_BYTES) {
          const reader = new FileReader();
          const dataUrl = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error("Failed to read image"));
            reader.readAsDataURL(file);
          });
          setLogoUrl(dataUrl);
          toast({
            title: "Logo updated",
            description: "Stored as a lightweight inline image.",
          });
          return;
        }
        throw uploadError;
      }

      const { data } = supabase.storage.from("logos").getPublicUrl(filePath);
      setLogoUrl(data.publicUrl);
      toast({ title: "Logo updated" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "Logo upload failed",
        description: `Please try another image or check storage settings. ${message}`,
        variant: "destructive",
      });
    } finally {
      setIsLogoUploading(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName,
          bio,
          company_name: companyName,
          industry,
          logo_url: logoUrl,
          two_factor_enabled: twoFactorEnabled,
          plan: selectedPlan,
        })
        .eq("user_id", user.id);

      if (error) throw error;
      await refreshProfile();
      toast({ title: "Settings saved" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "Save failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEmailUpdate = async () => {
    if (!emailInput || !user) return;
    setIsUpdatingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: emailInput });
      if (error) throw error;
      toast({
        title: "Check your inbox",
        description: "Confirm the new email to complete the change.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "Email update failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background animate-fade-in">
        <div className="container mx-auto px-4 py-10 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Settings</h1>
              <p className="text-muted-foreground">
                Manage your profile, business identity, security, and billing.
              </p>
            </div>
            <Button variant="outline" onClick={handleSaveChanges} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
            </Button>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-accent" />
                </div>
                <CardTitle>Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-2xl bg-secondary/60 border border-border/60 flex items-center justify-center">
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Profile avatar"
                          className="w-full h-full object-cover rounded-2xl"
                        />
                      ) : (
                        <span className="text-2xl font-semibold text-muted-foreground">
                          {user?.email?.slice(0, 2).toUpperCase() || "MS"}
                        </span>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          void handleAvatarUpload(file);
                        }
                      }}
                    />
                    <Button
                      size="icon"
                      variant="accent"
                      className="absolute -bottom-2 -right-2 rounded-full"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                    </Button>
                  </div>
                  <div className="flex-1 grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input
                        id="displayName"
                        placeholder="Emmanuel"
                        value={displayName}
                        onChange={(event) => setDisplayName(event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Input
                        id="bio"
                        placeholder="Short profile description"
                        value={bio}
                        onChange={(event) => setBio(event.target.value)}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="flex flex-col md:flex-row gap-3">
                        <Input
                          id="email"
                          type="email"
                          value={emailInput}
                          onChange={(event) => setEmailInput(event.target.value)}
                          placeholder="you@example.com"
                        />
                        <Button
                          variant="outline"
                          onClick={handleEmailUpdate}
                          disabled={isUpdatingEmail || !emailInput || emailInput === user?.email}
                        >
                          {isUpdatingEmail ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "Change Email"
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        We will email you a confirmation link to finish the change.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-accent" />
                </div>
                <CardTitle>Plan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border border-border/60 p-4 bg-secondary/40">
                  <p className="text-sm text-muted-foreground">Current Plan</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="capitalize">
                      {selectedPlan.replace("-", " ")}
                    </Badge>
                    <span className="text-xs text-muted-foreground">Starts on Free for everyone</span>
                  </div>
                </div>
                <Button variant="accent" className="w-full" onClick={() => setShowBilling((v) => !v)}>
                  {showBilling ? "Hide Plans" : "Manage Billing"}
                </Button>
                {showBilling && (
                  <div className="space-y-3 animate-fade-in">
                    {plans.map((plan) => {
                      const active = selectedPlan === plan.id;
                      return (
                        <div
                          key={plan.id}
                          onClick={() => setSelectedPlan(plan.id)}
                          className={`rounded-2xl border p-4 cursor-pointer transition-all ${
                            active
                              ? "border-accent shadow-[0_0_25px_rgba(99,102,241,0.35)] bg-accent/10"
                              : "border-border/60 hover:border-accent/60 bg-secondary/30"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                                {plan.name}
                                {active && <Sparkles className="w-4 h-4 text-accent" />}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{plan.desc}</p>
                            </div>
                            <div className="text-lg font-bold text-foreground">{plan.price}</div>
                          </div>
                          {active && (
                            <Button
                              variant="accent"
                              size="sm"
                              className="mt-3"
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleSaveChanges();
                              }}
                              disabled={isSaving}
                            >
                              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Pay & Activate"}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-accent" />
                </div>
                <CardTitle>Security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-foreground">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">Protect your account with SMS or an authenticator app.</p>
                  </div>
                  <Switch
                    checked={twoFactorEnabled}
                    onCheckedChange={(value) => setTwoFactorEnabled(Boolean(value))}
                  />
                </div>
                <div className="rounded-xl border border-border/60 p-4 bg-secondary/40">
                  <p className="text-sm text-muted-foreground">Active Sessions</p>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Chrome · Windows</span>
                      <Badge variant="outline">Current</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Safari · iOS</span>
                      <Button size="sm" variant="outline">Sign out</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-accent" />
                </div>
                <CardTitle>Business</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    placeholder="ModelStack LLC"
                    value={companyName}
                    onChange={(event) => setCompanyName(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    placeholder="Dentist, Legal, HVAC"
                    value={industry}
                    onChange={(event) => setIndustry(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logo">Logo Upload</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="logo"
                      placeholder="Upload PNG or paste image URL"
                      value={logoUrl}
                      onChange={(event) => setLogoUrl(event.target.value)}
                    />
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          void handleLogoUpload(file);
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={isLogoUploading}
                    >
                      {isLogoUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    </Button>
                  </div>
                  {logoUrl && (
                    <div className="mt-3 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg border border-border/60 bg-secondary/40 overflow-hidden">
                        <img src={logoUrl} alt="Company logo" className="h-full w-full object-cover" />
                      </div>
                      <span className="text-xs text-muted-foreground">Preview</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                {theme === "light" ? (
                  <Sun className="w-5 h-5 text-accent" />
                ) : (
                  <Moon className="w-5 h-5 text-accent" />
                )}
              </div>
              <CardTitle>Appearance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Theme</Label>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    variant={theme === "dark" ? "accent" : "outline"}
                    onClick={() => setTheme("dark")}
                  >
                    <Moon className="w-4 h-4 mr-2" />
                    Dark
                  </Button>
                  <Button
                    variant={theme === "light" ? "accent" : "outline"}
                    onClick={() => setTheme("light")}
                  >
                    <Sun className="w-4 h-4 mr-2" />
                    Light
                  </Button>
                  <Button
                    variant={theme === "system" ? "accent" : "outline"}
                    onClick={() => setTheme("system")}
                  >
                    System
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
