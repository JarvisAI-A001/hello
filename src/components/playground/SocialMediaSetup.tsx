import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Megaphone,
  Target,
  Users,
  TrendingUp,
  CalendarDays,
  BarChart3,
  MessageCircle,
  Hash,
  DollarSign,
  Lightbulb,
  Check,
  ChevronRight,
  ChevronLeft,
  Instagram,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Social media platforms
const platforms = [
  { id: "instagram", name: "Instagram", icon: "📸", description: "Emojis, hashtags, reels, short captions" },
  { id: "tiktok", name: "TikTok", icon: "🎵", description: "Trend-based, short videos, hooks" },
  { id: "twitter", name: "X (Twitter)", icon: "𝕏", description: "Concise, punchy text" },
  { id: "linkedin", name: "LinkedIn", icon: "💼", description: "Professional, no emojis, business tone" },
  { id: "facebook", name: "Facebook", icon: "📘", description: "Mix casual & professional, text + image" },
];

const marketingGoals = [
  { value: "followers", label: "Grow Followers", icon: Users, description: "Increase your social media following" },
  { value: "traffic", label: "Drive Traffic", icon: TrendingUp, description: "Get more visitors to your website" },
  { value: "sales", label: "Boost Sales", icon: DollarSign, description: "Convert followers into customers" },
  { value: "awareness", label: "Brand Awareness", icon: Megaphone, description: "Get your brand noticed" },
];

const toneOptions = [
  { value: "friendly", label: "Friendly", description: "Warm and approachable" },
  { value: "professional", label: "Professional", description: "Business-like and clear" },
  { value: "bold", label: "Bold", description: "Confident and daring" },
  { value: "luxury", label: "Luxury", description: "Premium and exclusive" },
  { value: "playful", label: "Playful", description: "Fun and engaging" },
];

const contentTypes = [
  { id: "posts", name: "Image Posts", description: "Static image content" },
  { id: "reels", name: "Reels/Shorts", description: "Short-form video content" },
  { id: "stories", name: "Stories", description: "24-hour ephemeral content" },
  { id: "carousels", name: "Carousels", description: "Multi-image slideshows" },
  { id: "polls", name: "Polls & Q&A", description: "Interactive engagement" },
];

const postingFrequencies = [
  { value: "daily", label: "Daily", description: "1 post per day" },
  { value: "frequent", label: "Frequent", description: "3-4 posts per week" },
  { value: "moderate", label: "Moderate", description: "2-3 posts per week" },
  { value: "weekly", label: "Weekly", description: "1 post per week" },
];

interface SocialMediaConfig {
  targetAudience: {
    ageRange: string;
    locations: string;
    interests: string;
  };
  marketingGoal: string;
  platforms: string[];
  brandVoice: string;
  postingFrequency: string;
  contentTypes: string[];
  adBudget: string;
  competitors: string;
}

interface SocialMediaSetupProps {
  config: SocialMediaConfig;
  businessName: string;
  industry: string;
  onConfigChange: (config: SocialMediaConfig) => void;
  onBusinessInfoChange: (field: 'businessName' | 'industry', value: string) => void;
  step: number;
  onNextStep: () => void;
  onPrevStep: () => void;
  totalSteps: number;
}

export default function SocialMediaSetup({
  config,
  businessName,
  industry,
  onConfigChange,
  onBusinessInfoChange,
  step,
  onNextStep,
  onPrevStep,
  totalSteps,
}: SocialMediaSetupProps) {
  const updateConfig = (updates: Partial<SocialMediaConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  const togglePlatform = (platformId: string) => {
    const newPlatforms = config.platforms.includes(platformId)
      ? config.platforms.filter(p => p !== platformId)
      : [...config.platforms, platformId];
    updateConfig({ platforms: newPlatforms });
  };

  const toggleContentType = (contentTypeId: string) => {
    const newContentTypes = config.contentTypes.includes(contentTypeId)
      ? config.contentTypes.filter(c => c !== contentTypeId)
      : [...config.contentTypes, contentTypeId];
    updateConfig({ contentTypes: newContentTypes });
  };

  // Step 1: Business & Audience
  if (step === 1) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Business & Target Audience</h2>
          <p className="text-muted-foreground">Tell us about your business and who you want to reach.</p>
        </div>

        <div className="grid gap-6">
          {/* Business Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-accent" />
                Business Name
              </label>
              <Input
                value={businessName}
                onChange={(e) => onBusinessInfoChange('businessName', e.target.value)}
                placeholder="Your Company Name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Industry / Niche</label>
              <Select
                value={industry}
                onValueChange={(value) => onBusinessInfoChange('industry', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ecommerce">E-commerce & Retail</SelectItem>
                  <SelectItem value="saas">SaaS & Technology</SelectItem>
                  <SelectItem value="health">Health & Wellness</SelectItem>
                  <SelectItem value="food">Food & Beverage</SelectItem>
                  <SelectItem value="fashion">Fashion & Beauty</SelectItem>
                  <SelectItem value="finance">Finance & Banking</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="entertainment">Entertainment</SelectItem>
                  <SelectItem value="realestate">Real Estate</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Target Audience */}
          <div className="space-y-4 p-4 bg-secondary/30 rounded-lg border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-accent" />
              <h3 className="font-semibold text-foreground">Target Audience</h3>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Age Range</label>
                <Select
                  value={config.targetAudience.ageRange}
                  onValueChange={(value) => updateConfig({
                    targetAudience: { ...config.targetAudience, ageRange: value }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select age range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="18-24">18-24 (Gen Z)</SelectItem>
                    <SelectItem value="25-34">25-34 (Millennials)</SelectItem>
                    <SelectItem value="35-44">35-44</SelectItem>
                    <SelectItem value="45-54">45-54</SelectItem>
                    <SelectItem value="55+">55+</SelectItem>
                    <SelectItem value="all">All Ages</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Locations</label>
                <Input
                  value={config.targetAudience.locations}
                  onChange={(e) => updateConfig({
                    targetAudience: { ...config.targetAudience, locations: e.target.value }
                  })}
                  placeholder="e.g., New York, Los Angeles, Global"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Interests & Topics</label>
              <Input
                value={config.targetAudience.interests}
                onChange={(e) => updateConfig({
                  targetAudience: { ...config.targetAudience, interests: e.target.value }
                })}
                placeholder="e.g., fitness, technology, travel, fashion"
              />
              <p className="text-xs text-muted-foreground">Comma-separated list of interests your audience cares about</p>
            </div>
          </div>

          {/* Marketing Goal */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-accent" />
              Primary Marketing Goal
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {marketingGoals.map((goal) => (
                <button
                  key={goal.value}
                  onClick={() => updateConfig({ marketingGoal: goal.value })}
                  className={cn(
                    "p-4 rounded-lg border text-left transition-all",
                    config.marketingGoal === goal.value
                      ? "border-accent bg-accent/10"
                      : "border-border hover:border-accent/50"
                  )}
                >
                  <goal.icon className={cn(
                    "w-6 h-6 mb-2",
                    config.marketingGoal === goal.value ? "text-accent" : "text-muted-foreground"
                  )} />
                  <span className="block font-medium text-foreground text-sm">{goal.label}</span>
                  <span className="text-xs text-muted-foreground">{goal.description}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Platforms & Voice
  if (step === 2) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Platforms & Brand Voice</h2>
          <p className="text-muted-foreground">Choose your platforms and define your brand's tone.</p>
        </div>

        <div className="grid gap-6">
          {/* Platforms */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Hash className="w-4 h-4 text-accent" />
              Select Platforms
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {platforms.map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => togglePlatform(platform.id)}
                  className={cn(
                    "p-4 rounded-lg border text-left transition-all flex items-start gap-3",
                    config.platforms.includes(platform.id)
                      ? "border-accent bg-accent/10"
                      : "border-border hover:border-accent/50"
                  )}
                >
                  <span className="text-2xl">{platform.icon}</span>
                  <div className="flex-1">
                    <span className="block font-medium text-foreground">{platform.name}</span>
                    <span className="text-xs text-muted-foreground">{platform.description}</span>
                  </div>
                  {config.platforms.includes(platform.id) && (
                    <Check className="w-5 h-5 text-accent shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Brand Voice / Tone */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-accent" />
              Brand Voice / Tone
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {toneOptions.map((tone) => (
                <button
                  key={tone.value}
                  onClick={() => updateConfig({ brandVoice: tone.value })}
                  className={cn(
                    "p-3 rounded-lg border text-left transition-all",
                    config.brandVoice === tone.value
                      ? "border-accent bg-accent/10"
                      : "border-border hover:border-accent/50"
                  )}
                >
                  <span className="block font-medium text-foreground text-sm">{tone.label}</span>
                  <span className="text-xs text-muted-foreground">{tone.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content Types */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              Content Types to Generate
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              {contentTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => toggleContentType(type.id)}
                  className={cn(
                    "p-3 rounded-lg border text-left transition-all",
                    config.contentTypes.includes(type.id)
                      ? "border-accent bg-accent/10"
                      : "border-border hover:border-accent/50"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-foreground text-sm">{type.name}</span>
                    {config.contentTypes.includes(type.id) && (
                      <Check className="w-4 h-4 text-accent" />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{type.description}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Strategy & Budget
  if (step === 3) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Strategy & Ads</h2>
          <p className="text-muted-foreground">Configure your posting schedule and ad preferences.</p>
        </div>

        <div className="grid gap-6">
          {/* Posting Frequency */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-accent" />
              Posting Frequency
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {postingFrequencies.map((freq) => (
                <button
                  key={freq.value}
                  onClick={() => updateConfig({ postingFrequency: freq.value })}
                  className={cn(
                    "p-3 rounded-lg border text-left transition-all",
                    config.postingFrequency === freq.value
                      ? "border-accent bg-accent/10"
                      : "border-border hover:border-accent/50"
                  )}
                >
                  <span className="block font-medium text-foreground text-sm">{freq.label}</span>
                  <span className="text-xs text-muted-foreground">{freq.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Ad Budget */}
          <div className="space-y-3 p-4 bg-secondary/30 rounded-lg border border-border">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-accent" />
              <h3 className="font-semibold text-foreground">Ad Campaign Budget (Optional)</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              AI will suggest ad strategies based on your budget. You approve everything before any spend.
            </p>
            <Select
              value={config.adBudget}
              onValueChange={(value) => updateConfig({ adBudget: value })}
            >
              <SelectTrigger className="max-w-sm">
                <SelectValue placeholder="Select budget range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No ads for now</SelectItem>
                <SelectItem value="small">€5-20/day (Testing)</SelectItem>
                <SelectItem value="medium">€20-50/day (Growth)</SelectItem>
                <SelectItem value="large">€50-100/day (Scale)</SelectItem>
                <SelectItem value="enterprise">€100+/day (Enterprise)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              ⚠️ AI does NOT launch ads automatically — you approve everything first.
            </p>
          </div>

          {/* Competitors */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-accent" />
              Competitor Accounts (Optional)
            </label>
            <Textarea
              value={config.competitors}
              onChange={(e) => updateConfig({ competitors: e.target.value })}
              placeholder="@competitor1, @competitor2 — AI will analyze their content strategy"
              className="min-h-[80px]"
            />
            <p className="text-xs text-muted-foreground">
              AI will study these accounts to understand industry trends and content styles
            </p>
          </div>

          {/* Summary Preview */}
          <div className="p-4 bg-accent/5 rounded-lg border border-accent/20">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5 text-accent" />
              <h4 className="font-semibold text-foreground">What Your AI Will Do</h4>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                Generate {config.contentTypes.length > 0 ? config.contentTypes.join(', ') : 'content'} for {config.platforms.length > 0 ? config.platforms.map(p => platforms.find(pl => pl.id === p)?.name).join(', ') : 'your platforms'}
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                Create captions with relevant hashtags and CTAs
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                Plan {config.postingFrequency || 'regular'} posting schedules
              </li>
              {config.adBudget && config.adBudget !== 'none' && (
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  Suggest ad campaigns with copy and targeting (you approve first)
                </li>
              )}
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                Analyze performance and suggest improvements
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
