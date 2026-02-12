import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Loader2,
  Sparkles,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Users,
  Heart,
  MessageCircle,
  X,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Play,
  Clock,
  Share2,
  Percent,
  Activity,
  Video,
  Calendar,
  Send,
  Globe,
  ChevronRight,
  CheckCircle,
  Youtube,
  Instagram,
  Twitter,
  Facebook,
  Music2,
  LayoutDashboard,
  Film,
  PieChart as PieChartIcon,
  Bot,
  Minimize2,
  ArrowLeft,
  MapPin,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Platform {
  id: string;
  name: string;
  icon: any;
  color: string;
  available: boolean;
}

interface ChannelData {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  banner: string;
  subscribers: number;
  totalViews: number;
  totalVideos: number;
  joinDate: string;
  description: string;
  country: string;
  verified: boolean;
}

interface VideoData {
  id: string;
  title: string;
  thumbnail: string;
  views: number;
  likes: number;
  dislikes: number;
  comments: number;
  shares: number;
  watchTime: string;
  avgViewDuration: string;
  engagementRate: number;
  publishedAt: string;
  trend: "up" | "down" | "stable";
}

interface ChannelAnalytics {
  subscribers: number;
  subscribersTrend: number;
  totalViews: number;
  viewsTrend: number;
  totalComments: number;
  watchTime: string;
  avgViewDuration: string;
  engagementRate: number;
  mostPopularVideo: VideoData | null;
  leastPopularVideo: VideoData | null;
}

interface VideoAnalytics {
  views: number;
  viewsTrend: number;
  likes: number;
  dislikes: number;
  comments: number;
  shares: number;
  avgViewDuration: string;
  avgViewPercentage: number;
  demographics: {
    gender: { name: string; value: number; color: string }[];
    age: { name: string; value: number; color: string }[];
    country: { name: string; value: number; color: string }[];
  };
  performanceData: { date: string; views: number }[];
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

type ViewState = "platform-select" | "search" | "confirm" | "dashboard" | "video-analytics";

const platforms: Platform[] = [
  { id: "youtube", name: "YouTube", icon: Youtube, color: "#FF0000", available: true },
  { id: "tiktok", name: "TikTok", icon: Music2, color: "#000000", available: true },
  { id: "instagram", name: "Instagram", icon: Instagram, color: "#E4405F", available: true },
  { id: "facebook", name: "Facebook", icon: Facebook, color: "#1877F2", available: false },
  { id: "x", name: "X (Twitter)", icon: Twitter, color: "#000000", available: false },
];

export default function SocialMediaAnalyzer() {
  const { toast } = useToast();
  const [viewState, setViewState] = useState<ViewState>("platform-select");
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ChannelData[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<ChannelData | null>(null);
  const [channelAnalytics, setChannelAnalytics] = useState<ChannelAnalytics | null>(null);
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
  const [videoAnalytics, setVideoAnalytics] = useState<VideoAnalytics | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [performanceData, setPerformanceData] = useState<{ date: string; views: number; likes: number }[]>([]);
  const [audienceData, setAudienceData] = useState<{ name: string; value: number; color: string }[]>([]);
  
  // AI Assistant state
  const [showAIChat, setShowAIChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const handlePlatformSelect = (platform: Platform) => {
    if (!platform.available) {
      toast({ title: `${platform.name} coming soon!`, description: "This platform is not yet available." });
      return;
    }
    setSelectedPlatform(platform);
    setViewState("search");
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !selectedPlatform) return;
    
    setIsSearching(true);
    
    try {
      // Use YouTube API for YouTube platform
      if (selectedPlatform.id === 'youtube') {
        const { data, error } = await supabase.functions.invoke("youtube-analytics", {
          body: {
            action: 'search',
            query: searchQuery,
          },
        });

        if (error) throw error;

        if (data?.channels) {
          setSearchResults(data.channels);
        } else if (data?.error) {
          throw new Error(data.error);
        }
      } else {
        // Fallback to AI for other platforms
        const systemPrompt = `You are a social media data analyst. The user is searching for a ${selectedPlatform.name} channel/account.
        
Based on the search query, return realistic-looking channel data. Return JSON only:
{
  "channels": [
    {
      "id": "unique-id",
      "name": "Channel Name",
      "handle": "@handle",
      "avatar": "",
      "banner": "",
      "subscribers": 125000,
      "totalViews": 5000000,
      "totalVideos": 85,
      "joinDate": "Jan 2020",
      "description": "Channel description...",
      "country": "United States",
      "verified": true
    }
  ]
}

Search query: "${searchQuery}"
Return 1-3 realistic channel results that match the search.`;

        const { data, error } = await supabase.functions.invoke("social-media-chat", {
          body: {
            message: `Find ${selectedPlatform.name} channels matching: ${searchQuery}`,
            conversationHistory: [],
            systemPrompt,
          },
        });

        if (error) throw error;

        const response = data?.response || "";
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.channels) {
            setSearchResults(parsed.channels);
          }
        }
      }
    } catch (error) {
      console.error("Search error:", error);
      toast({ title: "Search failed", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" });
    } finally {
      setIsSearching(false);
    }
  };

  const handleConfirmChannel = async (channel: ChannelData) => {
    setSelectedChannel(channel);
    setViewState("confirm");
  };

  const handleLoadDashboard = async () => {
    if (!selectedChannel || !selectedPlatform) return;
    
    setIsLoadingAnalytics(true);
    setViewState("dashboard");
    
    try {
      // Use YouTube API for YouTube platform
      if (selectedPlatform.id === 'youtube') {
        const { data, error } = await supabase.functions.invoke("youtube-analytics", {
          body: {
            action: 'channel-analytics',
            channelId: selectedChannel.id,
          },
        });

        if (error) throw error;

        if (data?.error) {
          throw new Error(data.error);
        }

        if (data?.channelAnalytics) {
          setChannelAnalytics({
            ...data.channelAnalytics,
            mostPopularVideo: data.mostPopularVideo || data.videos?.[0] || null,
            leastPopularVideo: data.leastPopularVideo || data.videos?.[data.videos.length - 1] || null,
          });
        }
        
        if (data?.videos) {
          setVideos(data.videos);
        }
        
        if (data?.performanceData) {
          setPerformanceData(data.performanceData);
        }
        
        if (data?.audienceData) {
          setAudienceData(data.audienceData);
        }
      } else {
        // Fallback to AI for other platforms
        const systemPrompt = `You are a ${selectedPlatform.name} analytics expert. Generate comprehensive, realistic analytics data for the channel.

Channel: ${selectedChannel.name} (@${selectedChannel.handle})
Subscribers: ${selectedChannel.subscribers}
Total Views: ${selectedChannel.totalViews}

Return JSON with this exact structure:
{
  "channelAnalytics": {
    "subscribers": ${selectedChannel.subscribers},
    "subscribersTrend": 5.2,
    "totalViews": ${selectedChannel.totalViews},
    "viewsTrend": 12.5,
    "totalComments": 45000,
    "watchTime": "125K hours",
    "avgViewDuration": "4:32",
    "engagementRate": 6.8
  },
  "videos": [
    {
      "id": "v1",
      "title": "Video Title Here",
      "thumbnail": "",
      "views": 125000,
      "likes": 8500,
      "dislikes": 120,
      "comments": 450,
      "shares": 230,
      "watchTime": "8.5K hours",
      "avgViewDuration": "5:12",
      "engagementRate": 7.2,
      "publishedAt": "3 days ago",
      "trend": "up"
    }
  ],
  "mostPopularVideo": { same as video object },
  "leastPopularVideo": { same as video object },
  "performanceData": [
    {"date": "Jan 7", "views": 15000, "likes": 1200},
    {"date": "Jan 8", "views": 18000, "likes": 1400}
  ],
  "audienceData": [
    {"name": "18-24", "value": 35, "color": "#0EA5E9"},
    {"name": "25-34", "value": 40, "color": "#3B82F6"},
    {"name": "35-44", "value": 15, "color": "#6366F1"},
    {"name": "45+", "value": 10, "color": "#8B5CF6"}
  ]
}

Generate 5-8 realistic video entries. Make the data proportional to the subscriber count.`;

        const { data, error } = await supabase.functions.invoke("social-media-chat", {
          body: {
            message: `Load full analytics for ${selectedChannel.name}`,
            conversationHistory: [],
            systemPrompt,
          },
        });

        if (error) throw error;

        const response = data?.response || "";
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          
          if (parsed.channelAnalytics) {
            setChannelAnalytics({
              ...parsed.channelAnalytics,
              mostPopularVideo: parsed.mostPopularVideo || parsed.videos?.[0] || null,
              leastPopularVideo: parsed.leastPopularVideo || parsed.videos?.[parsed.videos.length - 1] || null,
            });
          }
          
          if (parsed.videos) {
            setVideos(parsed.videos);
          }
          
          if (parsed.performanceData) {
            setPerformanceData(parsed.performanceData);
          }
          
          if (parsed.audienceData) {
            setAudienceData(parsed.audienceData);
          }
        }
      }
    } catch (error) {
      console.error("Analytics error:", error);
      toast({ title: "Failed to load analytics", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" });
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  const handleAnalyzeVideo = async (video: VideoData) => {
    setSelectedVideo(video);
    setViewState("video-analytics");
    setIsLoadingAnalytics(true);
    
    try {
      // Use YouTube API for YouTube platform
      if (selectedPlatform?.id === 'youtube') {
        const { data, error } = await supabase.functions.invoke("youtube-analytics", {
          body: {
            action: 'video-analytics',
            videoId: video.id,
          },
        });

        if (error) throw error;

        if (data?.error) {
          throw new Error(data.error);
        }

        if (data?.videoAnalytics) {
          setVideoAnalytics(data.videoAnalytics);
        }
      } else {
        // Fallback to AI for other platforms
        const systemPrompt = `You are a ${selectedPlatform?.name} video analytics expert. Generate detailed analytics for this video.

Video: ${video.title}
Views: ${video.views}
Likes: ${video.likes}

Return JSON:
{
  "videoAnalytics": {
    "views": ${video.views},
    "viewsTrend": 8.5,
    "likes": ${video.likes},
    "dislikes": ${video.dislikes},
    "comments": ${video.comments},
    "shares": ${video.shares || 0},
    "avgViewDuration": "4:32",
    "avgViewPercentage": 65,
    "demographics": {
      "gender": [
        {"name": "Male", "value": 62, "color": "#0EA5E9"},
        {"name": "Female", "value": 35, "color": "#EC4899"},
        {"name": "Other", "value": 3, "color": "#8B5CF6"}
      ],
      "age": [
        {"name": "13-17", "value": 8, "color": "#10B981"},
        {"name": "18-24", "value": 35, "color": "#0EA5E9"},
        {"name": "25-34", "value": 32, "color": "#3B82F6"},
        {"name": "35-44", "value": 15, "color": "#6366F1"},
        {"name": "45-54", "value": 7, "color": "#8B5CF6"},
        {"name": "55+", "value": 3, "color": "#A855F7"}
      ],
      "country": [
        {"name": "United States", "value": 45, "color": "#0EA5E9"},
        {"name": "United Kingdom", "value": 15, "color": "#3B82F6"},
        {"name": "Canada", "value": 12, "color": "#6366F1"},
        {"name": "India", "value": 10, "color": "#8B5CF6"},
        {"name": "Others", "value": 18, "color": "#A855F7"}
      ]
    },
    "performanceData": [
      {"date": "Day 1", "views": 45000},
      {"date": "Day 2", "views": 32000},
      {"date": "Day 3", "views": 18000},
      {"date": "Day 4", "views": 12000},
      {"date": "Day 5", "views": 8000},
      {"date": "Day 6", "views": 6000},
      {"date": "Day 7", "views": 4000}
    ]
  }
}`;

        const { data, error } = await supabase.functions.invoke("social-media-chat", {
          body: {
            message: `Analyze video: ${video.title}`,
            conversationHistory: [],
            systemPrompt,
          },
        });

        if (error) throw error;

        const response = data?.response || "";
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.videoAnalytics) {
            setVideoAnalytics(parsed.videoAnalytics);
          }
        }
      }
    } catch (error) {
      console.error("Video analytics error:", error);
      toast({ title: "Failed to load video analytics", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" });
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  const handleChatSend = async () => {
    if (!chatInput.trim() || isChatLoading) return;

    const userMessage = chatInput;
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsChatLoading(true);

    try {
      const context = selectedChannel 
        ? `Channel: ${selectedChannel.name}, Subscribers: ${formatNumber(selectedChannel.subscribers)}, Platform: ${selectedPlatform?.name}`
        : `Platform: ${selectedPlatform?.name || "Social Media"}`;

      const systemPrompt = `You are an expert social media growth strategist and content advisor. Help users grow their channels.

Context: ${context}

You can help with:
- Best times to post content
- Video/content ideas based on trends
- How to gain more views and subscribers
- Engagement strategies
- Content optimization tips
- Trend analysis

Be specific, actionable, and friendly. Keep responses concise but helpful.`;

      const { data, error } = await supabase.functions.invoke("social-media-chat", {
        body: {
          message: userMessage,
          conversationHistory: chatMessages,
          systemPrompt,
        },
      });

      if (error) throw error;

      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: data?.response || "I couldn't generate a response." },
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      toast({ title: "Error", description: "Could not send message.", variant: "destructive" });
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleBack = () => {
    switch (viewState) {
      case "search":
        setViewState("platform-select");
        setSelectedPlatform(null);
        setSearchResults([]);
        setSearchQuery("");
        break;
      case "confirm":
        setViewState("search");
        break;
      case "dashboard":
        setViewState("confirm");
        break;
      case "video-analytics":
        setViewState("dashboard");
        setSelectedVideo(null);
        setVideoAnalytics(null);
        break;
    }
  };

  // Platform Selection View
  const renderPlatformSelectView = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Social Media Analytics</h1>
        <p className="text-muted-foreground">Choose a platform to analyze your account</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-4xl">
        {platforms.map((platform) => (
          <button
            key={platform.id}
            onClick={() => handlePlatformSelect(platform)}
            className={cn(
              "relative flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all duration-300",
              platform.available
                ? "border-border bg-card hover:border-accent hover:shadow-lg cursor-pointer"
                : "border-border/50 bg-muted/30 cursor-not-allowed opacity-60"
            )}
          >
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: platform.available ? `${platform.color}15` : undefined }}
            >
              <platform.icon
                className="w-8 h-8"
                style={{ color: platform.available ? platform.color : "currentColor" }}
              />
            </div>
            <span className="font-medium text-foreground">{platform.name}</span>
            {!platform.available && (
              <span className="absolute top-2 right-2 text-[10px] px-2 py-0.5 bg-muted text-muted-foreground rounded-full">
                Coming Soon
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );

  // Search View
  const renderSearchView = () => (
    <div className="flex-1 flex flex-col p-8">
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to platforms
      </button>
      
      <div className="max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-6">
          {selectedPlatform && (
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${selectedPlatform.color}15` }}
            >
              <selectedPlatform.icon className="w-5 h-5" style={{ color: selectedPlatform.color }} />
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold text-foreground">Search {selectedPlatform?.name}</h2>
            <p className="text-muted-foreground text-sm">Find your channel or account</p>
          </div>
        </div>
        
        <div className="flex gap-2 mb-6">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search for a ${selectedPlatform?.name} channel...`}
            className="flex-1"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={isSearching}>
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>
        
        {searchResults.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Search Results</h3>
            {searchResults.map((channel) => (
              <button
                key={channel.id}
                onClick={() => handleConfirmChannel(channel)}
                className="w-full flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:border-accent transition-all text-left"
              >
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  {channel.avatar ? (
                    <img src={channel.avatar} alt={channel.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <Users className="w-6 h-6 text-accent" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground truncate">{channel.name}</span>
                    {channel.verified && <CheckCircle className="w-4 h-4 text-accent shrink-0" />}
                  </div>
                  <span className="text-sm text-muted-foreground">{channel.handle}</span>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-semibold text-foreground">{formatNumber(channel.subscribers)}</div>
                  <div className="text-xs text-muted-foreground">subscribers</div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Confirm View
  const renderConfirmView = () => (
    <div className="flex-1 flex flex-col p-8">
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to search
      </button>
      
      {selectedChannel && (
        <div className="max-w-2xl mx-auto w-full">
          <h2 className="text-2xl font-bold text-foreground mb-6">Confirm this is your account</h2>
          
          <div className="bg-card border border-border rounded-xl overflow-hidden mb-6">
            {/* Banner */}
            <div className="h-32 bg-gradient-to-r from-accent/20 to-accent/5" />
            
            {/* Channel Info */}
            <div className="p-6 -mt-12">
              <div className="flex items-end gap-4 mb-4">
                <div className="w-24 h-24 rounded-full bg-card border-4 border-card flex items-center justify-center shrink-0">
                  {selectedChannel.avatar ? (
                    <img src={selectedChannel.avatar} alt={selectedChannel.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <Users className="w-12 h-12 text-accent" />
                  )}
                </div>
                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-foreground truncate">{selectedChannel.name}</h3>
                    {selectedChannel.verified && <CheckCircle className="w-5 h-5 text-accent shrink-0" />}
                  </div>
                  <p className="text-muted-foreground">{selectedChannel.handle}</p>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{selectedChannel.description}</p>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-secondary/50 rounded-lg">
                  <div className="text-xl font-bold text-foreground">{formatNumber(selectedChannel.subscribers)}</div>
                  <div className="text-xs text-muted-foreground">Subscribers</div>
                </div>
                <div className="text-center p-3 bg-secondary/50 rounded-lg">
                  <div className="text-xl font-bold text-foreground">{formatNumber(selectedChannel.totalViews)}</div>
                  <div className="text-xs text-muted-foreground">Total Views</div>
                </div>
                <div className="text-center p-3 bg-secondary/50 rounded-lg">
                  <div className="text-xl font-bold text-foreground">{selectedChannel.totalVideos}</div>
                  <div className="text-xs text-muted-foreground">Videos</div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Joined {selectedChannel.joinDate}
                </span>
                <span className="flex items-center gap-1">
                  <Globe className="w-4 h-4" />
                  {selectedChannel.country}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleBack} className="flex-1">
              Not my account
            </Button>
            <Button onClick={handleLoadDashboard} className="flex-1 bg-accent hover:bg-accent/90">
              <CheckCircle className="w-4 h-4 mr-2" />
              Yes, this is my account
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  // Dashboard View
  const renderDashboardView = () => (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 bg-card border-r border-border flex flex-col shrink-0">
          {/* Channel Info */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                {selectedChannel?.avatar ? (
                  <img src={selectedChannel.avatar} alt={selectedChannel.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <Users className="w-5 h-5 text-accent" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground text-sm truncate">{selectedChannel?.name}</p>
                <p className="text-xs text-muted-foreground">Your channel</p>
              </div>
            </div>
          </div>
          
          {/* Nav Items */}
          <nav className="flex-1 p-2">
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-accent/10 text-accent font-medium text-sm">
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-secondary text-sm transition-colors">
              <Film className="w-4 h-4" />
              Content
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-secondary text-sm transition-colors">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-secondary text-sm transition-colors">
              <MessageCircle className="w-4 h-4" />
              Comments
            </button>
          </nav>
          
          {/* Back button */}
          <div className="p-4 border-t border-border">
            <Button variant="ghost" size="sm" onClick={handleBack} className="w-full justify-start gap-2">
              <ArrowLeft className="w-4 h-4" />
              Change account
            </Button>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          {isLoadingAnalytics ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto mb-4" />
                <p className="text-muted-foreground">Loading analytics...</p>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-foreground">Channel analytics</h1>
                <div className="text-sm text-muted-foreground">Last 28 days</div>
              </div>
              
              {/* Overview Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Views</span>
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {channelAnalytics ? formatNumber(channelAnalytics.totalViews) : "—"}
                  </div>
                  {channelAnalytics && (
                    <div className={cn(
                      "flex items-center gap-1 text-sm mt-1",
                      channelAnalytics.viewsTrend > 0 ? "text-green-500" : "text-red-500"
                    )}>
                      {channelAnalytics.viewsTrend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {channelAnalytics.viewsTrend > 0 ? "+" : ""}{channelAnalytics.viewsTrend}%
                    </div>
                  )}
                </div>
                
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Watch time</span>
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {channelAnalytics?.watchTime || "—"}
                  </div>
                </div>
                
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Subscribers</span>
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {channelAnalytics ? formatNumber(channelAnalytics.subscribers) : "—"}
                  </div>
                  {channelAnalytics && (
                    <div className={cn(
                      "flex items-center gap-1 text-sm mt-1",
                      channelAnalytics.subscribersTrend > 0 ? "text-green-500" : "text-red-500"
                    )}>
                      {channelAnalytics.subscribersTrend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      +{channelAnalytics.subscribersTrend}%
                    </div>
                  )}
                </div>
                
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageCircle className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Comments</span>
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {channelAnalytics ? formatNumber(channelAnalytics.totalComments) : "—"}
                  </div>
                </div>
              </div>
              
              {/* Performance Chart */}
              {performanceData.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-4">
                  <h3 className="font-semibold text-foreground mb-4">Performance over time</h3>
                  <div style={{ width: '100%', height: 256 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={performanceData}>
                        <defs>
                          <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(199 89% 48%)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(199 89% 48%)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip />
                        <Area type="monotone" dataKey="views" stroke="hsl(199 89% 48%)" fill="url(#viewsGrad)" strokeWidth={2} />
                        <Line type="monotone" dataKey="likes" stroke="hsl(142 76% 36%)" strokeWidth={2} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
              
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Videos */}
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <Film className="w-5 h-5 text-accent" />
                      Your videos
                    </h3>
                  </div>
                  <div className="space-y-3 max-h-96 overflow-auto">
                    {videos.map((video) => (
                      <div key={video.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                        <div className="w-28 h-16 bg-secondary rounded-lg flex items-center justify-center shrink-0 relative group">
                          <Play className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground text-sm line-clamp-2 mb-1">{video.title}</h4>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{formatNumber(video.views)} views</span>
                            <span>{video.publishedAt}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAnalyzeVideo(video)}
                              className="h-7 text-xs gap-1"
                            >
                              <BarChart3 className="w-3 h-3" />
                              Analyze
                            </Button>
                          </div>
                        </div>
                        <div className={cn(
                          "flex items-center gap-1 text-xs px-2 py-1 rounded-full shrink-0",
                          video.trend === "up" ? "bg-green-500/10 text-green-500" :
                          video.trend === "down" ? "bg-red-500/10 text-red-500" :
                          "bg-muted text-muted-foreground"
                        )}>
                          {video.trend === "up" ? <TrendingUp className="w-3 h-3" /> :
                           video.trend === "down" ? <TrendingDown className="w-3 h-3" /> :
                           <Activity className="w-3 h-3" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Audience Demographics */}
                <div className="bg-card border border-border rounded-xl p-4">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-accent" />
                    Audience age
                  </h3>
                  {audienceData.length > 0 ? (
                    <>
                      <div style={{ width: '100%', height: 192 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={audienceData}
                              cx="50%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={70}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {audienceData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex flex-wrap justify-center gap-3 mt-4">
                        {audienceData.map((item) => (
                          <div key={item.name} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-xs text-muted-foreground">{item.name}: {item.value}%</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="h-48 flex items-center justify-center text-muted-foreground">
                      No audience data
                    </div>
                  )}
                </div>
              </div>
              
              {/* Top & Bottom Videos */}
              {channelAnalytics?.mostPopularVideo && (
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="bg-card border border-border rounded-xl p-4">
                    <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Crown className="w-5 h-5 text-yellow-500" />
                      Most popular video
                    </h3>
                    <div className="flex items-start gap-3">
                      <div className="w-32 h-20 bg-secondary rounded-lg flex items-center justify-center shrink-0">
                        <Play className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground mb-1">{channelAnalytics.mostPopularVideo.title}</h4>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>{formatNumber(channelAnalytics.mostPopularVideo.views)} views</span>
                          <span>{formatNumber(channelAnalytics.mostPopularVideo.likes)} likes</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {channelAnalytics?.leastPopularVideo && (
                    <div className="bg-card border border-border rounded-xl p-4">
                      <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                        <TrendingDown className="w-5 h-5 text-muted-foreground" />
                        Needs improvement
                      </h3>
                      <div className="flex items-start gap-3">
                        <div className="w-32 h-20 bg-secondary rounded-lg flex items-center justify-center shrink-0">
                          <Play className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground mb-1">{channelAnalytics.leastPopularVideo.title}</h4>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span>{formatNumber(channelAnalytics.leastPopularVideo.views)} views</span>
                            <span>{formatNumber(channelAnalytics.leastPopularVideo.likes)} likes</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Video Analytics View
  const renderVideoAnalyticsView = () => (
    <div className="flex-1 flex flex-col h-full overflow-auto bg-background">
      <div className="p-6 space-y-6">
        {/* Back button */}
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </button>
        
        {/* Video Info */}
        {selectedVideo && (
          <div className="flex items-start gap-4">
            <div className="w-48 h-28 bg-secondary rounded-lg flex items-center justify-center shrink-0">
              <Play className="w-10 h-10 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground mb-2">{selectedVideo.title}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Published {selectedVideo.publishedAt}</span>
              </div>
            </div>
          </div>
        )}
        
        {isLoadingAnalytics ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : videoAnalytics ? (
          <>
            {/* Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Views</span>
                </div>
                <div className="text-2xl font-bold text-foreground">{formatNumber(videoAnalytics.views)}</div>
                <div className="flex items-center gap-1 text-sm text-green-500 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  +{videoAnalytics.viewsTrend}%
                </div>
              </div>
              
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ThumbsUp className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Likes</span>
                </div>
                <div className="text-2xl font-bold text-foreground">{formatNumber(videoAnalytics.likes)}</div>
              </div>
              
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ThumbsDown className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Dislikes</span>
                </div>
                <div className="text-2xl font-bold text-foreground">{formatNumber(videoAnalytics.dislikes)}</div>
              </div>
              
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Avg. view duration</span>
                </div>
                <div className="text-2xl font-bold text-foreground">{videoAnalytics.avgViewDuration}</div>
                <div className="text-sm text-muted-foreground mt-1">{videoAnalytics.avgViewPercentage}% watched</div>
              </div>
            </div>
            
            {/* Views Over Time */}
            {videoAnalytics.performanceData && (
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="font-semibold text-foreground mb-4">Views over time</h3>
                <div style={{ width: '100%', height: 192 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={videoAnalytics.performanceData}>
                      <defs>
                        <linearGradient id="videoViewsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(199 89% 48%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(199 89% 48%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip />
                      <Area type="monotone" dataKey="views" stroke="hsl(199 89% 48%)" fill="url(#videoViewsGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
            
            {/* Demographics */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Gender */}
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-accent" />
                  Gender
                </h3>
                <div style={{ width: '100%', height: 160 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={videoAnalytics.demographics.gender}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={55}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {videoAnalytics.demographics.gender.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  {videoAnalytics.demographics.gender.map((item) => (
                    <div key={item.name} className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs text-muted-foreground">{item.name}: {item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Age */}
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-accent" />
                  Age group
                </h3>
                <div style={{ width: '100%', height: 160 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={videoAnalytics.demographics.age} layout="vertical">
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                      <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} width={40} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {videoAnalytics.demographics.age.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Country */}
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-accent" />
                  Top countries
                </h3>
                <div className="space-y-3">
                  {videoAnalytics.demographics.country.map((country, index) => (
                    <div key={country.name} className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground w-4">{index + 1}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-foreground">{country.name}</span>
                          <span className="text-sm text-muted-foreground">{country.value}%</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${country.value}%`, backgroundColor: country.color }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );

  // AI Chat Bubble
  const renderAIChatBubble = () => (
    <>
      {/* Floating Button */}
      {!showAIChat && (
        <button
          onClick={() => setShowAIChat(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-accent text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-50 animate-pulse-glow"
        >
          <Bot className="w-6 h-6" />
        </button>
      )}
      
      {/* Chat Panel */}
      {showAIChat && (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-card border border-border rounded-2xl shadow-xl flex flex-col z-50 animate-slide-up overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-accent text-white">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">AI Assistant</h3>
                <p className="text-xs text-white/70">Ask me anything</p>
              </div>
            </div>
            <button
              onClick={() => setShowAIChat(false)}
              className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>
          
          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            {chatMessages.length === 0 ? (
              <div className="text-center py-8">
                <Bot className="w-12 h-12 text-accent/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Hi! I can help you with:</p>
                <div className="space-y-2 mt-3">
                  {[
                    "Best times to post",
                    "Content ideas",
                    "How to gain views",
                    "Engagement tips",
                  ].map((tip) => (
                    <button
                      key={tip}
                      onClick={() => setChatInput(tip)}
                      className="block w-full text-left px-3 py-2 text-sm bg-secondary rounded-lg hover:bg-secondary/70 transition-colors"
                    >
                      {tip}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {chatMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex",
                      msg.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                        msg.role === "user"
                          ? "bg-accent text-white rounded-br-md"
                          : "bg-secondary text-foreground rounded-bl-md"
                      )}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-secondary text-foreground rounded-2xl rounded-bl-md px-4 py-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}
          </ScrollArea>
          
          {/* Input */}
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1"
                onKeyDown={(e) => e.key === "Enter" && handleChatSend()}
              />
              <Button
                onClick={handleChatSend}
                disabled={isChatLoading || !chatInput.trim()}
                size="icon"
                className="bg-accent hover:bg-accent/90"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {viewState === "platform-select" && renderPlatformSelectView()}
      {viewState === "search" && renderSearchView()}
      {viewState === "confirm" && renderConfirmView()}
      {viewState === "dashboard" && renderDashboardView()}
      {viewState === "video-analytics" && renderVideoAnalyticsView()}
      
      {/* AI Assistant - Only show on dashboard and video analytics */}
      {(viewState === "dashboard" || viewState === "video-analytics") && renderAIChatBubble()}
    </div>
  );
}
