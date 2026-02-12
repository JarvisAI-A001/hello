import { useMemo, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  Lock,
  UploadCloud,
  CalendarDays,
  Mail,
  Sparkles,
  CheckCircle2,
  XCircle,
  TestTube2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type VerificationStatus = "unverified" | "blocked" | "parent_required" | "pending_parent" | "verified" | "verified_under18";

const priceOptions = ["10", "100", "300"];

export default function TrustedSeller() {
  const [serviceOffer, setServiceOffer] = useState("");
  const [activeStep, setActiveStep] = useState(1);
  const [gigTitle, setGigTitle] = useState("");
  const [gigDescription, setGigDescription] = useState("");
  const [botId, setBotId] = useState("");
  const [botPrice, setBotPrice] = useState("100");
  const [botPitch, setBotPitch] = useState("");
  const [botTested, setBotTested] = useState(false);
  const [testResult, setTestResult] = useState<"idle" | "success" | "error">("idle");

  const [dob, setDob] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>("unverified");
  const [idUploaded, setIdUploaded] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const [salesCount, setSalesCount] = useState(7);

  const trusted = verificationStatus === "verified" || verificationStatus === "verified_under18";
  const step1Done = serviceOffer.trim().length > 0;
  const step2Done = step1Done && gigTitle.trim().length > 0 && gigDescription.trim().length > 0;
  const step3Done = step2Done && botTested && botPitch.trim().length > 0;
  const step4Done = step3Done && trusted;
  const step5Done = step4Done && idUploaded;

  const sellerBadge = useMemo(() => {
    if (salesCount >= 100) {
      return { label: "Gold Seller", className: "bg-amber-400/20 text-amber-200 border-amber-300/50" };
    }
    if (salesCount >= 20) {
      return { label: "Green Seller", className: "bg-emerald-400/20 text-emerald-200 border-emerald-300/50" };
    }
    return { label: "Beginner", className: "bg-blue-400/20 text-blue-200 border-blue-300/50" };
  }, [salesCount]);

  const cardClass =
    "bg-white/5 backdrop-blur-xl border border-indigo-500/30 shadow-[0_0_25px_rgba(99,102,241,0.12)] rounded-2xl";

  const glowBorderClass =
    "border border-emerald-400/50 shadow-[0_0_25px_rgba(16,185,129,0.35)]";

  const age = useMemo(() => {
    if (!dob) return null;
    const birth = new Date(dob);
    if (Number.isNaN(birth.getTime())) return null;
    const today = new Date();
    let years = today.getFullYear() - birth.getFullYear();
    const monthDelta = today.getMonth() - birth.getMonth();
    if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birth.getDate())) {
      years -= 1;
    }
    return years;
  }, [dob]);

  const handleVerifyAge = () => {
    if (age === null) return;
    if (age < 15) {
      setVerificationStatus("blocked");
      return;
    }
    if (age >= 15 && age <= 17) {
      setVerificationStatus("parent_required");
      return;
    }
    setVerificationStatus("verified");
  };

  const handleSendParentConsent = () => {
    if (!parentEmail) return;
    setVerificationSent(true);
    setVerificationStatus("pending_parent");
  };

  const handleParentVerified = () => {
    setVerificationStatus("verified_under18");
  };

  const handleTestBot = () => {
    if (!botId || botId.length < 6) {
      setTestResult("error");
      setBotTested(false);
      return;
    }
    setTestResult("success");
    setBotTested(true);
  };

  const handlePublishBot = () => {
    if (!trusted || !idUploaded || !botTested || !serviceOffer || !gigTitle) return;
    const amount = Number(botPrice);
    void amount;
    setBotId("");
    setBotPitch("");
    setBotTested(false);
    setTestResult("idle");
    setSalesCount((prev) => prev + 1);
  };

  const goNext = () => {
    setActiveStep((prev) => Math.min(5, prev + 1));
  };

  const goBack = () => {
    setActiveStep((prev) => Math.max(1, prev - 1));
  };

  return (
    <Layout>
      <div className="min-h-screen bg-[#0b1020] text-white">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#1d4ed8_0%,transparent_55%),radial-gradient(circle_at_bottom,#0ea5e9_0%,transparent_40%)] opacity-50" />
          <div className="container mx-auto px-4 py-12 relative">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <Badge className="bg-indigo-500/20 text-indigo-200 border border-indigo-400/40 mb-3">
                  Trusted Seller Marketplace
                </Badge>
                <h1 className="text-3xl md:text-4xl font-bold">Become a Trusted Seller</h1>
                <p className="text-sm text-slate-300 mt-2 max-w-2xl">
                  Verify your identity, unlock the seller badge, and list your AI chatbot in the marketplace.
                </p>
              </div>
              <div className={cn("px-4 py-3 rounded-2xl flex items-center gap-3", cardClass, trusted && glowBorderClass)}>
                <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-300">Status</p>
                  <p className="font-semibold">
                    {trusted ? "Trusted Seller" : "Verification Required"}
                  </p>
                </div>
                {trusted && (
                  <Badge className="bg-emerald-400/20 text-emerald-200 border border-emerald-400/50">
                    Trusted Seller
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 pb-10">
          <div className={cn("p-8 md:p-10", cardClass)}>
            <div className="mb-6 rounded-xl border border-indigo-400/30 bg-white/5 p-4 text-sm text-slate-200">
              Need help? Complete each step in order. Your progress is saved on this page. If you're stuck,
              check the helper notes under each step or click Back to review.
            </div>
            {activeStep === 1 && (
              <div className="min-h-[60vh] flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-indigo-300" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold">Step 1: Your Service</h2>
                      <p className="text-sm text-slate-300">What do you offer?</p>
                    </div>
                  </div>
                  <div className="space-y-3 max-w-xl">
                    <label className="text-sm text-slate-300">Service you offer</label>
                    <Input
                      value={serviceOffer}
                      onChange={(e) => setServiceOffer(e.target.value)}
                      placeholder="e.g. AI Sales Assistant Setup"
                      className="bg-white/5 border-indigo-400/30 text-white"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button className="bg-indigo-500 hover:bg-indigo-600" disabled={!step1Done} onClick={goNext}>
                    Next Step
                  </Button>
                </div>
              </div>
            )}

            {activeStep === 2 && (
              <div className="min-h-[60vh] flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-indigo-300" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold">Step 2: Your Gig</h2>
                      <p className="text-sm text-slate-300">What are you selling?</p>
                    </div>
                  </div>
                  <div className="space-y-3 max-w-2xl">
                    <label className="text-sm text-slate-300">Gig title</label>
                    <Input
                      value={gigTitle}
                      onChange={(e) => setGigTitle(e.target.value)}
                      placeholder="e.g. Dental Intake Chatbot"
                      className="bg-white/5 border-indigo-400/30 text-white"
                    />
                    <label className="text-sm text-slate-300">Gig description</label>
                    <Textarea
                      value={gigDescription}
                      onChange={(e) => setGigDescription(e.target.value)}
                      placeholder="Describe your service and outcomes."
                      className="bg-white/5 border-indigo-400/30 text-white"
                    />
                  </div>
                </div>
                <div className="flex justify-between gap-3">
                  <Button variant="outline" className="border-indigo-400/30 text-indigo-200" onClick={goBack}>
                    Back
                  </Button>
                  <Button className="bg-indigo-500 hover:bg-indigo-600" disabled={!step2Done} onClick={goNext}>
                    Next Step
                  </Button>
                </div>
              </div>
            )}

            {activeStep === 3 && (
              <div className="min-h-[60vh] flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                      <TestTube2 className="w-6 h-6 text-indigo-300" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold">Step 3: Bot Info</h2>
                      <p className="text-sm text-slate-300">Bot ID, price & pitch</p>
                    </div>
                  </div>
                  <div className="space-y-3 max-w-xl">
                    <label className="text-sm text-slate-300">Bot ID</label>
                    <Input
                      value={botId}
                      onChange={(e) => setBotId(e.target.value)}
                      placeholder="bot_abc123"
                      className="bg-white/5 border-indigo-400/30 text-white"
                    />
                    <Button
                      variant="outline"
                      className="w-full border-indigo-400/30 text-indigo-200"
                      onClick={handleTestBot}
                      disabled={!botId}
                    >
                      <TestTube2 className="w-4 h-4 mr-2" />
                      Test Bot
                    </Button>
                    {testResult === "success" && (
                      <div className="text-xs text-emerald-300 flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3" />
                        Bot validated successfully.
                      </div>
                    )}
                    {testResult === "error" && (
                      <div className="text-xs text-red-300 flex items-center gap-2">
                        <XCircle className="w-3 h-3" />
                        Invalid Bot ID.
                      </div>
                    )}
                    <label className="text-sm text-slate-300">Price</label>
                    <Select value={botPrice} onValueChange={setBotPrice}>
                      <SelectTrigger className="bg-white/5 border-indigo-400/30 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priceOptions.map((price) => (
                          <SelectItem key={price} value={price}>
                            ${price} / month
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <label className="text-sm text-slate-300">The Pitch</label>
                    <Textarea
                      value={botPitch}
                      onChange={(e) => setBotPitch(e.target.value)}
                      placeholder="Why are you selling this bot?"
                      className="bg-white/5 border-indigo-400/30 text-white"
                    />
                  </div>
                </div>
                <div className="flex justify-between gap-3">
                  <Button variant="outline" className="border-indigo-400/30 text-indigo-200" onClick={goBack}>
                    Back
                  </Button>
                  <Button className="bg-indigo-500 hover:bg-indigo-600" disabled={!step3Done} onClick={goNext}>
                    Next Step
                  </Button>
                </div>
              </div>
            )}

            {activeStep === 4 && (
              <div className="min-h-[60vh] flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                      <CalendarDays className="w-6 h-6 text-indigo-300" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold">Step 4: Age Verification</h2>
                      <p className="text-sm text-slate-300">Required to sell</p>
                    </div>
                  </div>

                  <div className="space-y-4 max-w-xl">
                    <div>
                      <label className="text-sm text-slate-300">Date of Birth</label>
                      <Input
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="mt-2 bg-white/5 border-indigo-400/30 text-white"
                      />
                    </div>
                    <Button className="w-full bg-indigo-500 hover:bg-indigo-600" onClick={handleVerifyAge}>
                      Verify Age
                    </Button>

                    {verificationStatus === "blocked" && (
                      <div className="rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200">
                        You must be at least 15 to sell chatbots on the marketplace.
                      </div>
                    )}

                    {verificationStatus === "parent_required" && (
                      <div className="space-y-3 rounded-xl border border-indigo-400/30 bg-white/5 p-4">
                        <p className="text-sm text-slate-200">
                          Since you are under 18, parental consent is required.
                        </p>
                        <div>
                          <label className="text-sm text-slate-300">Parent Email</label>
                          <div className="relative mt-2">
                            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <Input
                              value={parentEmail}
                              onChange={(e) => setParentEmail(e.target.value)}
                              placeholder="parent@email.com"
                              className="pl-9 bg-white/5 border-indigo-400/30 text-white"
                            />
                          </div>
                        </div>
                        <Button className="w-full bg-indigo-500 hover:bg-indigo-600" onClick={handleSendParentConsent}>
                          Send Verification Link
                        </Button>
                      </div>
                    )}

                    {verificationStatus === "pending_parent" && (
                      <div className="rounded-xl border border-indigo-400/30 bg-white/5 p-4 space-y-3">
                        <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Parental Permission</div>
                        <div className="text-sm text-slate-200 space-y-2">
                          <p>Legal Guardian Consent Agreement</p>
                          <p className="text-slate-400">
                            By clicking the verification link, the parent/guardian agrees to the seller terms and
                            confirms that the account holder has permission to sell AI bots on this platform.
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400">
                            {verificationSent ? "Email sent to parent" : "Awaiting consent"}
                          </span>
                          <Button variant="outline" onClick={handleParentVerified} className="border-indigo-400/30 text-indigo-200">
                            Mark Verified
                          </Button>
                        </div>
                      </div>
                    )}

                    {(verificationStatus === "verified" || verificationStatus === "verified_under18") && (
                      <div className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 p-3 text-sm text-emerald-200 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Seller verification complete.
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-between gap-3">
                  <Button variant="outline" className="border-indigo-400/30 text-indigo-200" onClick={goBack}>
                    Back
                  </Button>
                  <Button className="bg-indigo-500 hover:bg-indigo-600" disabled={!step4Done} onClick={goNext}>
                    Next Step
                  </Button>
                </div>
              </div>
            )}

            {activeStep === 5 && (
              <div className="min-h-[60vh] flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                      <UploadCloud className="w-6 h-6 text-indigo-300" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold">Step 5: Upload ID</h2>
                      <p className="text-sm text-slate-300">Unlock selling tools</p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-indigo-400/30 bg-white/5 p-4 max-w-xl">
                    <p className="text-sm text-slate-200 mb-3">Upload ID or verification document</p>
                    <Button
                      variant="outline"
                      className="w-full border-indigo-400/30 text-indigo-200"
                      onClick={() => setIdUploaded(true)}
                    >
                      <UploadCloud className="w-4 h-4 mr-2" />
                      {idUploaded ? "ID Uploaded" : "Upload ID"}
                    </Button>
                    <p className="text-xs text-slate-400 mt-2">Required to unlock selling tools.</p>
                  </div>
                </div>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <Button variant="outline" className="border-indigo-400/30 text-indigo-200" onClick={goBack}>
                    Back
                  </Button>
                  <Button
                    className="bg-indigo-500 hover:bg-indigo-600"
                    disabled={!step5Done || !botPitch || !botTested}
                    onClick={handlePublishBot}
                  >
                    {trusted && idUploaded ? "Publish Listing" : "Locked"}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className={cn("p-6", cardClass)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-indigo-300" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Seller Badges</h2>
                  <p className="text-xs text-slate-300">Earn better trust tiers</p>
                </div>
              </div>
              <Badge className={cn("border", sellerBadge.className)}>
                {sellerBadge.label}
              </Badge>
            </div>
            <div className="mt-4 grid md:grid-cols-3 gap-4 text-sm">
              <div className="rounded-xl border border-blue-400/30 bg-blue-500/10 p-4">
                <p className="font-semibold text-blue-200">Beginner (Blue)</p>
                <p className="text-xs text-blue-100/70">0 - 19 sales</p>
              </div>
              <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4">
                <p className="font-semibold text-emerald-200">Pro (Green)</p>
                <p className="text-xs text-emerald-100/70">20 - 99 sales</p>
              </div>
              <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-4">
                <p className="font-semibold text-amber-200">Elite (Gold)</p>
                <p className="text-xs text-amber-100/70">100+ sales</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
