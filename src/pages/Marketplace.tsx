import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Star,
  ShoppingCart,
  Filter,
  TrendingUp,
  Shield,
  MessageSquare,
  Mail,
  Calendar,
  FileText,
  Zap,
  Users,
  Clock,
  CheckCircle2,
  Copy,
  ChevronRight,
  Home,
  Info,
  CreditCard,
  Lock,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data for API keys in the marketplace
const mockApiKeys = [
  {
    id: 1,
    name: "GPT-4 Turbo API Access",
    description: "High-performance language model for advanced chatbot and content generation tasks.",
    moduleType: "Chatbot",
    price: 25,
    seller: "AIForge Labs",
    sellerRating: 4.9,
    reviewCount: 234,
    usageLimit: "10K requests/month",
    verified: true,
    featured: true,
    apiKey: "sk-xxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    version: "v2",
    endpoints: [
      { method: "GET", name: "Get Profile Data", path: "/profile" },
      { method: "GET", name: "Get Profile Data By URL", path: "/profile/url" },
      { method: "GET", name: "Search People", path: "/search/people" },
      { method: "POST", name: "Search People by URL", path: "/search/url" },
      { method: "GET", name: "Get Profile Recent Activity Time", path: "/profile/activity" },
      { method: "GET", name: "Get Profile's Posts", path: "/profile/posts" },
    ],
  },
  {
    id: 2,
    name: "Smart Email Composer",
    description: "AI-powered email drafting and response generation with tone customization.",
    moduleType: "Email Replier",
    price: 15,
    seller: "MailBot Pro",
    sellerRating: 4.7,
    reviewCount: 156,
    usageLimit: "5K emails/month",
    verified: true,
    featured: false,
    apiKey: "em-xxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    version: "v1",
    endpoints: [
      { method: "POST", name: "Compose Email", path: "/compose" },
      { method: "POST", name: "Reply to Email", path: "/reply" },
    ],
  },
  {
    id: 3,
    name: "Calendar AI Assistant",
    description: "Intelligent appointment scheduling with natural language understanding.",
    moduleType: "Appointment Maker",
    price: 12,
    seller: "ScheduleGenius",
    sellerRating: 4.5,
    reviewCount: 89,
    usageLimit: "Unlimited bookings",
    verified: true,
    featured: false,
    apiKey: "cal-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    version: "v1",
    endpoints: [
      { method: "POST", name: "Create Appointment", path: "/appointments" },
      { method: "GET", name: "Get Available Slots", path: "/slots" },
    ],
  },
  {
    id: 4,
    name: "Content Factory API",
    description: "Generate blog posts, social media content, and marketing copy at scale.",
    moduleType: "Content Generator",
    price: 35,
    seller: "ContentAI Inc",
    sellerRating: 4.8,
    reviewCount: 312,
    usageLimit: "50K words/month",
    verified: true,
    featured: true,
    apiKey: "cf-xxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    version: "v2",
    endpoints: [
      { method: "POST", name: "Generate Blog Post", path: "/blog" },
      { method: "POST", name: "Generate Social Post", path: "/social" },
    ],
  },
  {
    id: 5,
    name: "Multi-Language Chatbot",
    description: "Support 50+ languages with automatic translation and cultural context.",
    moduleType: "Chatbot",
    price: 30,
    seller: "GlobalChat AI",
    sellerRating: 4.6,
    reviewCount: 178,
    usageLimit: "15K requests/month",
    verified: true,
    featured: false,
    apiKey: "ml-xxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    version: "v1",
    endpoints: [
      { method: "POST", name: "Translate and Chat", path: "/chat" },
    ],
  },
  {
    id: 6,
    name: "Email Sentiment Analyzer",
    description: "Analyze incoming emails and suggest appropriate response tones.",
    moduleType: "Email Replier",
    price: 10,
    seller: "SentimentPro",
    sellerRating: 4.3,
    reviewCount: 67,
    usageLimit: "3K analyses/month",
    verified: false,
    featured: false,
    apiKey: "es-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    version: "v1",
    endpoints: [
      { method: "POST", name: "Analyze Sentiment", path: "/analyze" },
    ],
  },
];

const moduleIcons: Record<string, React.ReactNode> = {
  Chatbot: <MessageSquare className="w-5 h-5" />,
  "Email Replier": <Mail className="w-5 h-5" />,
  "Appointment Maker": <Calendar className="w-5 h-5" />,
  "Content Generator": <FileText className="w-5 h-5" />,
};

const moduleTypes = ["All", "Chatbot", "Email Replier", "Appointment Maker", "Content Generator"];

interface ChatbotListing {
  id: number;
  name: string;
  category: string;
  price: number;
  description: string;
  demoUrl?: string;
  seller: string;
  featured?: boolean;
}

export default function Marketplace() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModule, setSelectedModule] = useState("All");
  const [sortBy, setSortBy] = useState("featured");
  const [priceRange, setPriceRange] = useState("all");
  const [selectedApi, setSelectedApi] = useState<typeof mockApiKeys[0] | null>(null);
  const [isPurchased, setIsPurchased] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [activeTab, setActiveTab] = useState("code");
  const [codeTarget, setCodeTarget] = useState("Shell");
  const [codeClient, setCodeClient] = useState("cURL");
  const [chatbotListings] = useState<ChatbotListing[]>([]);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [walletBalance] = useState(320);

  const filteredKeys = mockApiKeys
    .filter((key) => {
      const matchesSearch =
        key.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        key.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        key.seller.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesModule = selectedModule === "All" || key.moduleType === selectedModule;
      const matchesPrice =
        priceRange === "all" ||
        (priceRange === "10-20" && key.price >= 10 && key.price <= 20) ||
        (priceRange === "20-35" && key.price > 20 && key.price <= 35) ||
        (priceRange === "35+" && key.price > 35);
      return matchesSearch && matchesModule && matchesPrice;
    })
    .sort((a, b) => {
      if (sortBy === "featured") return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      if (sortBy === "rating") return b.sellerRating - a.sellerRating;
      return 0;
    });

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-3.5 h-3.5 ${
              i < Math.floor(rating)
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground/30"
            }`}
          />
        ))}
        <span className="text-sm font-medium text-foreground ml-1">{rating}</span>
      </div>
    );
  };

  const handleBuy = (api: typeof mockApiKeys[0]) => {
    setSelectedApi(api);
    setIsPurchased(false);
    setShowPayment(false);
  };

  const handlePurchase = () => {
    setShowPayment(true);
  };

  const handleConfirmPayment = () => {
    setIsPurchased(true);
    setShowPayment(false);
  };

  const generateCodeSnippet = () => {
    if (!selectedApi) return "";
    const apiKey = isPurchased ? selectedApi.apiKey : "YOUR_API_KEY";
    return `curl --request GET \\
  --url 'https://api.modelstack.com${selectedApi.endpoints[0]?.path || "/endpoint"}' \\
  --header 'x-api-key: ${apiKey}' \\
  --header 'x-api-host: ${selectedApi.seller.toLowerCase().replace(/\s/g, "-")}.modelstack.com'`;
  };


  return (
    <Layout>
      <div className="min-h-screen pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-end mb-4">
            <Button
              variant="outline"
              size="icon"
              className="border-accent/30 text-accent hover:bg-accent/10"
              onClick={() => setIsWalletOpen(true)}
              aria-label="Open wallet"
            >
              <Wallet className="w-4 h-4" />
            </Button>
          </div>
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <Badge variant="outline" className="mb-4 border-accent/30 text-accent">
              <ShoppingCart className="w-3 h-3 mr-1" />
              API Marketplace
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Buy & Sell <span className="text-gradient">AI API Keys</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover premium API keys from verified sellers. Minimum €10/month per key.
              All transactions include platform verification and 20% seller fee.
            </p>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { icon: <Zap className="w-5 h-5 text-accent" />, value: "150+", label: "API Keys" },
              { icon: <Users className="w-5 h-5 text-accent" />, value: "45", label: "Verified Sellers" },
              { icon: <TrendingUp className="w-5 h-5 text-accent" />, value: "€10", label: "Min Price" },
              { icon: <Shield className="w-5 h-5 text-accent" />, value: "20%", label: "Platform Fee" },
            ].map((stat, index) => (
              <Card key={index} className="glass border-border/50 text-center py-4">
                <div className="flex flex-col items-center gap-1">
                  {stat.icon}
                  <span className="text-2xl font-bold text-foreground">{stat.value}</span>
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </div>
              </Card>
            ))}
          </div>

          {/* Filters */}
          <Card className="glass border-border/50 p-4 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search API keys, sellers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background/50 border-border/50"
                />
              </div>
              <div className="flex gap-3 flex-wrap">
                <Select value={selectedModule} onValueChange={setSelectedModule}>
                  <SelectTrigger className="w-[160px] bg-background/50 border-border/50">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Module Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {moduleTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={priceRange} onValueChange={setPriceRange}>
                  <SelectTrigger className="w-[140px] bg-background/50 border-border/50">
                    <SelectValue placeholder="Price Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Prices</SelectItem>
                    <SelectItem value="10-20">€10 - €20</SelectItem>
                    <SelectItem value="20-35">€20 - €35</SelectItem>
                    <SelectItem value="35+">€35+</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[140px] bg-background/50 border-border/50">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">Featured</SelectItem>
                    <SelectItem value="price-low">Price: Low</SelectItem>
                    <SelectItem value="price-high">Price: High</SelectItem>
                    <SelectItem value="rating">Top Rated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Results Count */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-muted-foreground">
              Showing <span className="text-foreground font-medium">{filteredKeys.length}</span> API keys
            </p>
            <div className="flex items-center gap-2">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-accent/30 text-accent hover:bg-accent/10"
              >
                <a href="/trusted-seller">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Sell Your API Key
                </a>
              </Button>
              <Button asChild variant="accent" size="sm">
                <a href="/trusted-seller">Sell Your Chatbot</a>
              </Button>
            </div>
          </div>

          {/* Chatbot Listings */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">Chatbots for Sale</h2>
              <span className="text-sm text-muted-foreground">
                {chatbotListings.length} listings
              </span>
            </div>
            {chatbotListings.length === 0 ? (
              <Card className="glass border-border/50 p-8 text-center">
                <MessageSquare className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-foreground mb-1">No chatbots yet</h3>
                <p className="text-muted-foreground mb-4">
                  Be the first to list a chatbot and start earning monthly revenue.
                </p>
              <Button asChild variant="accent">
                <a href="/trusted-seller">List Your Chatbot</a>
              </Button>
            </Card>
          ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {chatbotListings.map((bot) => (
                  <Card
                    key={bot.id}
                    className="glass border-border/50 hover:border-accent/50 transition-all duration-300"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">{bot.category}</Badge>
                        {bot.featured && (
                          <Badge className="bg-accent/20 text-accent border-0 text-xs">
                            New
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mt-3">{bot.name}</h3>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {bot.description}
                      </p>
                      {bot.demoUrl && (
                        <a
                          className="text-sm text-accent hover:underline"
                          href={bot.demoUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View demo
                        </a>
                      )}
                    </CardContent>
                    <CardFooter className="flex items-center justify-between border-t border-border/50 pt-3">
                      <div>
                        <span className="text-xl font-bold text-foreground">â‚¬{bot.price}</span>
                        <span className="text-sm text-muted-foreground">/mo</span>
                      </div>
                      <Button variant="accent" size="sm">
                        <ShoppingCart className="w-4 h-4 mr-1" />
                        Buy
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* API Key Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredKeys.map((apiKey, index) => (
              <Card
                key={apiKey.id}
                className="glass border-border/50 hover:border-accent/50 transition-all duration-300 hover:shadow-lg hover:shadow-accent/10 group animate-fade-in flex flex-col"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                      {moduleIcons[apiKey.moduleType]}
                    </div>
                    <div className="flex items-center gap-2">
                      {apiKey.featured && (
                        <Badge className="bg-accent/20 text-accent border-0 text-xs">Featured</Badge>
                      )}
                      {apiKey.verified && (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                  </div>
                  <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors line-clamp-1">
                    {apiKey.name}
                  </h3>
                  <Badge variant="secondary" className="w-fit text-xs">
                    {apiKey.moduleType}
                  </Badge>
                </CardHeader>
                <CardContent className="pb-3 flex-1">
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {apiKey.description}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Seller</span>
                      <span className="text-foreground font-medium">{apiKey.seller}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Rating</span>
                      {renderStars(apiKey.sellerRating)}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Reviews</span>
                      <span className="text-foreground">{apiKey.reviewCount}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{apiKey.usageLimit}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-3 border-t border-border/50 flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-foreground">€{apiKey.price}</span>
                    <span className="text-sm text-muted-foreground">/mo</span>
                  </div>
                  <Button variant="accent" size="sm" onClick={() => handleBuy(apiKey)}>
                    <ShoppingCart className="w-4 h-4 mr-1" />
                    Buy
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {filteredKeys.length === 0 && (
            <Card className="glass border-border/50 p-12 text-center">
              <Search className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No API keys found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filters or search query
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedModule("All");
                  setPriceRange("all");
                }}
              >
                Clear Filters
              </Button>
            </Card>
          )}

          {/* Seller CTA */}
          <Card className="glass border-accent/30 mt-12 p-8 text-center bg-gradient-to-r from-accent/5 to-primary/5">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Want to sell your API keys?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Go to Projects, create your API key, then click "Sell on Marketplace" to list it.
              Set your own prices (min €10/month) with only 20% platform fee.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="accent" size="lg">
                Go to Projects
              </Button>
              <Button variant="outline" size="lg">
                Learn More
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* API Detail Modal */}
      <Dialog open={!!selectedApi} onOpenChange={() => setSelectedApi(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0">
          <div className="flex h-full">
            {/* Left Sidebar - Endpoints */}
            <div className="w-64 border-r border-border bg-secondary/30 p-4 overflow-y-auto">
              <div className="mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Home className="w-4 h-4" />
                  <ChevronRight className="w-3 h-3" />
                  <span>{selectedApi?.name}</span>
                </div>
              </div>

              <div className="mb-4">
                <label className="text-sm font-medium text-foreground mb-2 block">Version</label>
                <Select defaultValue={selectedApi?.version || "v2"}>
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="v1">v1</SelectItem>
                    <SelectItem value="v2">v2 (current)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="mb-4">
                <label className="text-sm font-medium text-foreground mb-2 block">Endpoints</label>
                <div className="relative mb-2">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                  <Input placeholder="Search Endpoints" className="pl-7 h-8 text-sm" />
                </div>
              </div>

              <Button variant="accent" size="sm" className="w-full mb-4">
                <Zap className="w-3 h-3 mr-1" />
                MCP Playground
              </Button>

              <div className="space-y-1">
                {selectedApi?.endpoints.map((endpoint, i) => (
                  <button
                    key={i}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-background/50 text-left"
                  >
                    <span className={cn(
                      "text-xs font-mono",
                      endpoint.method === "GET" ? "text-green-500" : "text-blue-500"
                    )}>
                      {endpoint.method}
                    </span>
                    <span className="text-muted-foreground truncate">{endpoint.name}</span>
                    <Info className="w-3 h-3 ml-auto text-muted-foreground/50" />
                  </button>
                ))}
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{selectedApi?.name}</h2>
                  <p className="text-sm text-muted-foreground">{selectedApi?.seller}</p>
                </div>
                <Button variant="accent" onClick={handlePurchase}>
                  Test Endpoint
                </Button>
              </div>

              {/* Tabs */}
              <div className="border-b border-border px-4">
                <div className="flex gap-6">
                  {["App", "Params", "Headers", "Body", "Authorizations"].map((tab) => (
                    <button
                      key={tab}
                      className={cn(
                        "py-3 text-sm font-medium transition-colors relative",
                        tab === "App" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {tab}
                      {(tab === "Params" || tab === "Headers") && (
                        <span className="text-xs text-muted-foreground ml-1">(1)</span>
                      )}
                      {tab === "App" && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Left - Request URL */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Request URL</label>
                    <Input 
                      value={`${selectedApi?.seller.toLowerCase().replace(/\s/g, "-")}.modelstack.com`}
                      className="bg-secondary/50 mb-6"
                      readOnly
                    />

                    {/* API Key Display */}
                    <div className="bg-secondary/50 rounded-lg p-4 mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground">API Key</span>
                        {isPurchased && (
                          <Button variant="ghost" size="sm">
                            <Copy className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                      <div className="font-mono text-sm relative">
                        {isPurchased ? (
                          <span className="text-accent">{selectedApi?.apiKey}</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="blur-sm select-none">sk-xxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx</span>
                            <Lock className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      {!isPurchased && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Purchase to reveal API key
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right - Code Snippets */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex gap-4">
                        {["Code Snippets", "Example Responses", "Results"].map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setActiveTab(tab.toLowerCase().replace(" ", "-"))}
                            className={cn(
                              "text-sm font-medium transition-colors",
                              activeTab === tab.toLowerCase().replace(" ", "-")
                                ? "text-foreground"
                                : "text-muted-foreground"
                            )}
                          >
                            {tab}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Target:</span>
                        <Select value={codeTarget} onValueChange={setCodeTarget}>
                          <SelectTrigger className="w-24 h-8 bg-secondary/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Shell">Shell</SelectItem>
                            <SelectItem value="JavaScript">JavaScript</SelectItem>
                            <SelectItem value="Python">Python</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Client:</span>
                        <Select value={codeClient} onValueChange={setCodeClient}>
                          <SelectTrigger className="w-24 h-8 bg-secondary/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cURL">cURL</SelectItem>
                            <SelectItem value="fetch">fetch</SelectItem>
                            <SelectItem value="axios">axios</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button variant="ghost" size="sm" className="ml-auto">
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>

                    <div className="bg-secondary/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                      <pre className="text-foreground whitespace-pre-wrap">
                        {generateCodeSnippet()}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom - Purchase Button */}
              {!isPurchased && (
                <div className="p-4 border-t border-border bg-secondary/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-foreground">€{selectedApi?.price}</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    <Button variant="accent" size="lg" onClick={handlePurchase}>
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Purchase API Key
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Purchase</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="bg-secondary/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-foreground">{selectedApi?.name}</span>
                <span className="text-lg font-bold text-foreground">€{selectedApi?.price}/mo</span>
              </div>
              <p className="text-sm text-muted-foreground">{selectedApi?.description}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Card Number</label>
              <div className="relative">
                <Input placeholder="1234 5678 9012 3456" className="pl-10" />
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Expiry</label>
                <Input placeholder="MM/YY" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">CVC</label>
                <Input placeholder="123" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Name on Card</label>
              <Input placeholder="John Doe" />
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="w-4 h-4" />
              <span>Your payment is secured with 256-bit encryption</span>
            </div>

            <Button variant="accent" className="w-full" onClick={handleConfirmPayment}>
              Pay €{selectedApi?.price}/month
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Wallet Modal */}
      <Dialog open={isWalletOpen} onOpenChange={setIsWalletOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>My Wallet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-xl border border-border/60 bg-secondary/30 p-4">
              <p className="text-xs text-muted-foreground">Current Balance</p>
              <p className="text-3xl font-semibold text-foreground mt-1">${walletBalance}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="accent">Add Money</Button>
              <Button variant="outline">Withdraw</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sell Chatbot Modal removed in favor of /trusted-seller */}
    </Layout>
  );
}
