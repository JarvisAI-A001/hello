import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Megaphone,
  Sparkles,
  CalendarDays,
  BarChart3,
  MessageCircle,
  Hash,
  Send,
  Loader2,
  Copy,
  Check,
  RefreshCw,
  Lightbulb,
  Target,
  Image,
  Video,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

interface GeneratedContent {
  id: string;
  platform: string;
  type: string;
  caption: string;
  hashtags: string[];
  cta: string;
  visualSuggestion: string;
  bestTime: string;
}

interface AdSuggestion {
  id: string;
  type: string;
  headline: string;
  description: string;
  cta: string;
  targetAudience: string;
  budget: string;
  duration: string;
}

interface SocialMediaPlaygroundProps {
  config: SocialMediaConfig;
  businessName: string;
  industry: string;
  onGenerateContent: (prompt: string) => Promise<string>;
  isLoading: boolean;
}

const platformIcons: Record<string, string> = {
  instagram: "📸",
  tiktok: "🎵",
  twitter: "𝕏",
  linkedin: "💼",
  facebook: "📘",
};

export default function SocialMediaPlayground({
  config,
  businessName,
  industry,
  onGenerateContent,
  isLoading,
}: SocialMediaPlaygroundProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("content");
  const [contentPrompt, setContentPrompt] = useState("");
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedContent[]>([]);
  const [adSuggestions, setAdSuggestions] = useState<AdSuggestion[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const handleGenerateContent = async () => {
    if (!contentPrompt.trim()) return;
    
    setGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("generate-social-content", {
        body: {
          prompt: contentPrompt,
          platforms: config.platforms.length > 0 ? config.platforms : ["instagram"],
          industry,
          businessName,
          brandVoice: config.brandVoice || "professional",
          marketingGoal: config.marketingGoal || "awareness",
        },
      });

      if (error) throw error;

      if (data.posts && data.posts.length > 0) {
        const newPosts: GeneratedContent[] = data.posts.map((post: any, index: number) => ({
          id: `post-${Date.now()}-${index}`,
          platform: post.platform,
          type: config.contentTypes[0] || "post",
          caption: post.caption,
          hashtags: post.hashtags || [],
          cta: post.cta,
          visualSuggestion: post.visualSuggestion,
          bestTime: post.bestTime,
        }));
        
        setGeneratedPosts(prev => [...newPosts, ...prev]);
        toast({
          title: "Content generated!",
          description: `Created ${newPosts.length} posts with AI-powered captions and hashtags.`,
        });
      }
    } catch (error) {
      console.error("Error generating content:", error);
      toast({
        variant: "destructive",
        title: "Generation failed",
        description: "Could not generate content. Please try again.",
      });
    } finally {
      setContentPrompt("");
      setGenerating(false);
    }
  };

  const handleGenerateAds = () => {
    const newAds: AdSuggestion[] = [
      {
        id: `ad-${Date.now()}-1`,
        type: "Awareness",
        headline: `Discover ${businessName}`,
        description: `Join thousands who trust ${businessName} for their ${industry} needs. Start your journey today!`,
        cta: "Learn More",
        targetAudience: `${config.targetAudience.ageRange} in ${config.targetAudience.locations}`,
        budget: "€5/day",
        duration: "7 days",
      },
      {
        id: `ad-${Date.now()}-2`,
        type: "Conversions",
        headline: `Limited Time Offer from ${businessName}`,
        description: `Get exclusive access to our premium features. Don't miss out on this opportunity!`,
        cta: "Shop Now",
        targetAudience: `${config.targetAudience.ageRange} interested in ${config.targetAudience.interests}`,
        budget: "€10/day",
        duration: "14 days",
      },
    ];
    
    setAdSuggestions(newAds);
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="border-b border-border px-6 py-2">
          <TabsList className="bg-secondary/30">
            <TabsTrigger value="content" className="gap-2">
              <Sparkles className="w-4 h-4" />
              Content Generator
            </TabsTrigger>
            <TabsTrigger value="ads" className="gap-2">
              <Target className="w-4 h-4" />
              Ad Campaigns
            </TabsTrigger>
            <TabsTrigger value="schedule" className="gap-2">
              <CalendarDays className="w-4 h-4" />
              Schedule
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="engage" className="gap-2">
              <MessageCircle className="w-4 h-4" />
              Engagement
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Content Generator Tab */}
        <TabsContent value="content" className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Content Generation Input */}
            <div className="p-4 bg-secondary/30 rounded-lg border border-border">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                Generate Content
              </h3>
              <div className="flex gap-3">
                <Textarea
                  value={contentPrompt}
                  onChange={(e) => setContentPrompt(e.target.value)}
                  placeholder="Describe what you want to post about... e.g., 'New product launch for summer collection' or 'Tips for better sleep'"
                  className="flex-1 min-h-[80px]"
                />
                <Button 
                  onClick={handleGenerateContent} 
                  disabled={generating || !contentPrompt.trim()}
                  className="self-end"
                >
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Generate
                </Button>
              </div>
              <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                <span>Generating for:</span>
                {config.platforms.map(p => (
                  <span key={p} className="px-2 py-0.5 bg-secondary rounded-full text-xs">
                    {platformIcons[p]} {p}
                  </span>
                ))}
              </div>
            </div>

            {/* Generated Posts */}
            {generatedPosts.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Generated Posts</h3>
                <div className="grid gap-4">
                  {generatedPosts.map((post) => (
                    <div key={post.id} className="p-4 bg-card border border-border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{platformIcons[post.platform]}</span>
                          <span className="font-medium text-foreground capitalize">{post.platform}</span>
                          <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">{post.type}</span>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => copyToClipboard(`${post.caption}\n\n${post.hashtags.join(' ')}\n\n${post.cta}`, post.id)}
                        >
                          {copiedId === post.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                      
                      <p className="text-foreground whitespace-pre-wrap mb-3">{post.caption}</p>
                      
                      <div className="flex flex-wrap gap-1 mb-3">
                        {post.hashtags.map((tag, i) => (
                          <span key={i} className="text-accent text-sm">{tag}</span>
                        ))}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Lightbulb className="w-4 h-4" />
                          {post.visualSuggestion}
                        </span>
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-4 h-4" />
                          Best time: {post.bestTime}
                        </span>
                      </div>
                      
                      <div className="mt-3 p-2 bg-accent/5 rounded text-sm">
                        <strong>CTA:</strong> {post.cta}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Ideas */}
            {generatedPosts.length === 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  "Product showcase",
                  "Behind the scenes",
                  "Customer testimonial",
                  "Tips & tricks",
                  "Industry news",
                  "Team spotlight",
                  "FAQ post",
                  "Seasonal promo",
                ].map((idea) => (
                  <button
                    key={idea}
                    onClick={() => setContentPrompt(idea)}
                    className="p-3 bg-secondary/30 rounded-lg border border-border hover:border-accent/50 text-left transition-colors"
                  >
                    <span className="text-sm text-foreground">{idea}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Ad Campaigns Tab */}
        <TabsContent value="ads" className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="p-4 bg-secondary/30 rounded-lg border border-border">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-accent" />
                AI Ad Campaign Suggestions
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                AI will suggest ad campaigns based on your business and goals. You approve everything before any spend.
              </p>
              <Button onClick={handleGenerateAds}>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Ad Ideas
              </Button>
            </div>

            {adSuggestions.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Suggested Ad Campaigns</h3>
                {adSuggestions.map((ad) => (
                  <div key={ad.id} className="p-4 bg-card border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2 py-1 bg-accent/10 text-accent text-sm font-medium rounded">{ad.type}</span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">Edit</Button>
                        <Button size="sm" variant="accent">Approve</Button>
                      </div>
                    </div>
                    <h4 className="font-semibold text-foreground mb-2">{ad.headline}</h4>
                    <p className="text-muted-foreground mb-3">{ad.description}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">CTA:</span>
                        <p className="font-medium text-foreground">{ad.cta}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Target:</span>
                        <p className="font-medium text-foreground">{ad.targetAudience}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Budget:</span>
                        <p className="font-medium text-foreground">{ad.budget}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Duration:</span>
                        <p className="font-medium text-foreground">{ad.duration}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-16">
              <CalendarDays className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Content Calendar</h3>
              <p className="text-muted-foreground mb-4">
                Plan and schedule your posts for the week or month. Drag and drop to organize.
              </p>
              <p className="text-sm text-muted-foreground">
                Coming soon: Integration with Meta Business Suite, Buffer, and more.
              </p>
            </div>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-16">
              <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Performance Analytics</h3>
              <p className="text-muted-foreground mb-4">
                Track engagement, reach, and conversions across all your platforms.
              </p>
              <div className="p-4 bg-accent/5 rounded-lg inline-block">
                <p className="text-sm text-foreground">
                  💡 AI Insight: "Posts with polls get 2x engagement. Schedule one per week."
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Engagement Tab */}
        <TabsContent value="engage" className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-16">
              <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Engagement Assistant</h3>
              <p className="text-muted-foreground mb-4">
                AI suggests replies to comments and DMs. You approve before sending.
              </p>
              <p className="text-sm text-muted-foreground">
                Coming soon: Automatic spam detection and priority inbox.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper functions
function getPlatformSpecificText(platform: string, businessName: string): string {
  const texts: Record<string, string> = {
    instagram: `Follow us @${businessName.toLowerCase().replace(/\s+/g, '')} for more! 🔥`,
    tiktok: `Follow for more! 👆 #fyp #foryou`,
    twitter: `What do you think? 👇`,
    linkedin: `Connect with us to stay updated on industry insights.`,
    facebook: `Like and share if you found this helpful! 💙`,
  };
  return texts[platform] || "";
}

function generateHashtags(industry: string, platform: string): string[] {
  const baseHashtags = ["#business", "#growth", "#success"];
  const industryHashtags: Record<string, string[]> = {
    ecommerce: ["#ecommerce", "#onlineshopping", "#shopnow"],
    saas: ["#saas", "#startup", "#tech"],
    health: ["#wellness", "#health", "#fitness"],
    food: ["#foodie", "#delicious", "#yummy"],
    fashion: ["#fashion", "#style", "#ootd"],
  };
  
  return [...baseHashtags, ...(industryHashtags[industry] || [])].slice(0, 6);
}

function getCTA(goal: string): string {
  const ctas: Record<string, string> = {
    followers: "Follow us for more content like this!",
    traffic: "Click the link in bio to learn more →",
    sales: "Shop now - Link in bio! 🛒",
    awareness: "Save this post for later! 📌",
  };
  return ctas[goal] || "Learn more →";
}

function getVisualSuggestion(platform: string, contentTypes: string[]): string {
  if (contentTypes.includes("reels")) {
    return "Record a 15-30 sec video";
  }
  if (contentTypes.includes("carousels")) {
    return "Create 3-5 slide carousel";
  }
  return "Use high-quality product image";
}

function getBestPostingTime(platform: string): string {
  const times: Record<string, string> = {
    instagram: "11am-1pm, 7-9pm",
    tiktok: "7-9pm",
    twitter: "9am, 12pm, 3pm",
    linkedin: "8-10am (weekdays)",
    facebook: "1-4pm",
  };
  return times[platform] || "12pm";
}
