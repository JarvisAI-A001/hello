import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { usePlaygrounds } from "@/hooks/usePlaygrounds";
import { PlaygroundManager } from "@/components/playground/PlaygroundManager";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import SocialMediaChatSetup from "@/components/playground/SocialMediaChatSetup";
import SocialMediaPlayground from "@/components/playground/SocialMediaPlayground";
import SocialMediaAnalyzer from "@/components/playground/SocialMediaAnalyzer";
import { BotStudio } from "@/components/playground/BotStudio";
import AnalyticsDashboard from "@/components/playground/AnalyticsDashboard";
import LiveChatViewer from "@/components/playground/LiveChatViewer";
import { ChatWidget } from "@/components/ChatWidget";
import { VideoGeneratorPage } from "@/components/playground/VideoGeneratorPage";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Bot, 
  Mail, 
  Calendar, 
  FileText,
  Play,
  Loader2,
  Copy,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Home,
  Code,
  LayoutDashboard,
  FileCode,
  Settings,
  Key,
  User,
  Star,
  Image,
  Mic,
  Video,
  Zap,
  PanelLeftClose,
  PanelLeft,
  Upload,
  Database,
  Tag,
  MessageSquare,
  Timer,
  Shield,
  Lock,
  Brain,
  FileUp,
  Link,
  X,
  Check,
  ArrowRight,
  Trash2,
  Globe,
  ExternalLink,
  Megaphone,
  Target,
  TrendingUp,
  CalendarDays,
  BarChart3,
  Instagram,
  Hash,
  DollarSign,
  Users,
  Lightbulb,
  LogOut,
  FolderOpen,
  Wand2,
  Edit,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Bot personality tones
const personalityTones = [
  { value: "friendly", label: "Friendly", description: "Warm and approachable" },
  { value: "professional", label: "Professional", description: "Business-like and formal" },
  { value: "formal", label: "Formal", description: "Very structured and official" },
  { value: "casual", label: "Casual", description: "Relaxed and conversational" },
  { value: "humorous", label: "Humorous", description: "Witty and light-hearted" },
];

const typingSpeedOptions = [
  { value: "instant", label: "Instant", delay: "0s" },
  { value: "fast", label: "Fast", delay: "1s" },
  { value: "medium", label: "Medium", delay: "2s" },
  { value: "slow", label: "Slow", delay: "3s" },
];

// AI Modules for the home menu
interface Module {
  id: string;
  name: string;
  description: string;
  icon: typeof Bot;
  isNew?: boolean;
  isPaid?: boolean;
  isComingSoon?: boolean;
  category: string;
}

const modules: Module[] = [
  {
    id: "chatbot",
    name: "Chatbot",
    description: "Intelligent conversational AI for customer support and engagement.",
    icon: MessageSquare,
    isNew: true,
    category: "Featured",
  },
  {
    id: "social-media-marketing",
    name: "Social Media Marketing + Ads",
    description: "AI-powered content generation, ad campaigns, scheduling, and analytics for all platforms.",
    icon: Megaphone,
    isNew: true,
    isComingSoon: true,
    category: "Featured",
  },
  {
    id: "social-media-analyzer",
    name: "Social Media Account Analyzer",
    description: "Analyze any public profile from links, screenshots, or captions. Get feedback, content ideas, and ad suggestions.",
    icon: TrendingUp,
    isNew: true,
    category: "Featured",
  },
  {
    id: "email-replier",
    name: "Email Replier",
    description: "Generate professional email responses automatically with tone customization.",
    icon: Mail,
    category: "Featured",
  },
  {
    id: "appointment-maker",
    name: "Appointment Maker",
    description: "Automate scheduling and booking conversations intelligently.",
    icon: Calendar,
    isComingSoon: true,
    category: "Featured",
  },
  {
    id: "ai-human-models",
    name: "AI Human Models",
    description: "Create realistic human models for social media content and campaigns.",
    icon: Users,
    isNew: true,
    isComingSoon: true,
    category: "Featured",
  },
  {
    id: "content-generator",
    name: "Content Generator",
    description: "Create marketing copy, articles, and social content at scale.",
    icon: FileText,
    category: "Featured",
  },
  {
    id: "image-gen",
    name: "Image Generator",
    description: "State-of-the-art image generation and editing model.",
    icon: Image,
    isPaid: true,
    category: "Media",
  },
  {
    id: "video-gen",
    name: "Video Generator",
    description: "Create short videos from text prompts with sound effects.",
    icon: Video,
    isPaid: true,
    category: "Media",
  },
  {
    id: "audio-gen",
    name: "Text to Speech",
    description: "Generate high quality text to speech with natural voices.",
    icon: Mic,
    category: "Media",
  },
];

const categories = ["Featured", "Media", "Custom"];

// Interface for uploaded files
interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: string;
}

// Interface for bot configuration
interface BotConfig {
  name: string;
  tone: string;
  typingSpeed: string;
  behaviorRules: string[];
  businessName: string;
  industry: string;
  services: string;
  contactInfo: string;
  paymentMethods: string;
  locations: string;
  faqs: string;
  policies: string;
  uploadedFiles: UploadedFile[];
  tags: string[];
  apiIntegration: boolean;
  features?: Record<string, string[]>;
  welcomeMessage: string;
  shortDescription: string;
  status: "active" | "inactive";
  avatarUrl?: string;
  faqsText: string;
  knowledgeSources: string[];
  topicFocus: string;
  contentRefresh: string;
  responseLength: "short" | "medium" | "long";
  memoryEnabled: boolean;
  contextLimit: number;
  fallbackResponse: string;
  primaryLanguage: string;
  multiLanguage: boolean;
  ttsEnabled: boolean;
  sttEnabled: boolean;
  accessibilityMode: boolean;
  autoGreeting: boolean;
  chatHistory: "save" | "reset" | "delete";
  proactivePrompts: string[];
  quickReplies: string[];
  themeColor: string;
  chatPosition: "bottom-right" | "bottom-left" | "center";
  chatSize: "small" | "medium" | "large";
  customFont: string;
  animationStyle: string;
  showAvatar?: boolean;
  publishText?: string;
  bookingEnabled?: boolean;
  bookingButtonText?: string;
  widgetStyle?: "classic" | "modern" | "minimal" | "gpt";
  iconStyle?: "modern" | "basic" | "outline";
  backgroundStyle?: "clean" | "gradient" | "grid" | "glass";
  suggestedQuestions?: string[];
  crmIntegration: boolean;
  emailNotifications: boolean;
  webhooksEnabled: boolean;
  webhookUrl: string;
  aiModel: "fast" | "smart";
  aiModelProvider?: string;
  analyticsEnabled: boolean;
  requireLogin: boolean;
  privacyPolicy: string;
  blockPhrases: string;
  publishStatus: "draft" | "published";
  versionNotes: string;
  bookingHours: {
    openTime: string;
    closeTime: string;
    timezone: string;
  };
  humanModel?: {
    ethnicity: string;
    bodyType: string;
    styleVibe: string;
    seedId: string;
  };
  // Social Media Marketing specific fields
  socialMedia?: {
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
  };
}

// Interface for saved playground state (now stored in database)
interface SavedPlaygroundState {
  botConfig: BotConfig;
  selectedModuleId: string | null;
  currentView: 'home' | 'catalog' | 'setup' | 'playground';
  setupStep: number;
  messages: { role: 'user' | 'bot'; content: string }[];
}

// Navigation Item Component
function NavItem({ 
  icon: Icon, 
  label, 
  active, 
  collapsed, 
  expandable, 
  external,
  onClick,
  children 
}: { 
  icon: typeof Home; 
  label: string; 
  active?: boolean; 
  collapsed?: boolean;
  expandable?: boolean;
  external?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(active);

  return (
    <div>
      <button 
        onClick={() => {
          if (expandable) setExpanded(!expanded);
          if (onClick) onClick();
        }}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
          active ? "bg-accent/10 text-accent" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
          collapsed && "justify-center"
        )}
      >
        <Icon className="w-4 h-4 shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1 text-left">{label}</span>
            {expandable && (
              <ChevronRight className={cn("w-4 h-4 transition-transform", expanded && "rotate-90")} />
            )}
            {external && <span className="text-xs">↗</span>}
          </>
        )}
      </button>
      {expanded && !collapsed && children}
    </div>
  );
}

export default function Playground() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, isLoading: authLoading, signOut, getPlaygroundLimit, isGuest } = useAuth();
  const {
    playgrounds,
    isLoading: playgroundsLoading,
    currentPlaygroundId,
    setCurrentPlaygroundId,
    createPlayground,
    updatePlayground,
    renamePlayground,
    deletePlayground,
  } = usePlaygrounds(user?.id);
  
  // View states: 'home' | 'catalog' | 'setup' | 'playground' | 'manage' | 'video-generator' | 'analytics' | 'live-chat' | 'settings' | 'bot-settings'
  const [currentView, setCurrentView] = useState<'home' | 'catalog' | 'setup' | 'playground' | 'manage' | 'video-generator' | 'analytics' | 'live-chat' | 'settings' | 'bot-settings'>('home');
  const [setupStep, setSetupStep] = useState(1);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [activeCategory, setActiveCategory] = useState("Featured");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedPlaygroundId, setSelectedPlaygroundId] = useState<string | null>(null);
  const [newPlaygroundName, setNewPlaygroundName] = useState("");

  const openPlayground = (pg: any) => {
    setCurrentPlaygroundId(pg.id);
    const foundModule = modules.find(m => m.id === pg.module_id);
    if (foundModule) {
      setSelectedModule(foundModule);
    }
    setCurrentView('setup');
  };

  // Publish toggle for the current playground
  const handlePublishToggle = async () => {
    if (!currentPlaygroundId) return;
    try {
      const newStatus = botConfig.publishStatus === 'published' ? 'draft' : 'published';
      if (newStatus === 'published') {
        const published = await handlePublishBot({ showDialog: false });
        if (!published) return;
        setPlaygroundTab('publish');
      } else {
        setPlaygroundTab('chat');
      }
      setBotConfig(prev => ({ ...prev, publishStatus: newStatus }));
      await updatePlayground(currentPlaygroundId, { bot_config: { ...(playgrounds.find(p => p.id === currentPlaygroundId)?.bot_config as Record<string, unknown>), ...botConfig, publishStatus: newStatus } });
      toast({ title: newStatus === 'published' ? 'Published' : 'Saved as Draft', description: newStatus === 'published' ? 'Your bot is now live.' : 'Your bot is saved as a draft.' });
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to update publish status', variant: 'destructive' });
    }
  };

  const handleEditInfo = () => {
    // Navigate the user to the bot-settings page and open the Configuration tab for editing
    setCurrentView('bot-settings');
    setBotSettingsTab('settings');
  };

  const handleRenameClick = (e: React.MouseEvent, pg: any) => {
    e.stopPropagation();
    setSelectedPlaygroundId(pg.id);
    setNewPlaygroundName(pg.name);
    setRenameDialogOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, pg: any) => {
    e.stopPropagation();
    setSelectedPlaygroundId(pg.id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmRename = async () => {
    if (selectedPlaygroundId && newPlaygroundName.trim()) {
      try {
        await renamePlayground(selectedPlaygroundId, newPlaygroundName);
        toast({ title: "Success", description: "Playground renamed successfully" });
        setRenameDialogOpen(false);
      } catch (error) {
        toast({ title: "Error", description: "Failed to rename playground", variant: "destructive" });
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (selectedPlaygroundId) {
      try {
        await deletePlayground(selectedPlaygroundId);
        toast({ title: "Success", description: "Playground deleted successfully" });
        setDeleteConfirmOpen(false);
      } catch (error) {
        toast({ title: "Error", description: "Failed to delete playground", variant: "destructive" });
      }
    }
  };

  // Bot configuration state
  const [botConfig, setBotConfig] = useState<BotConfig>({
    name: "",
    tone: "professional",
    typingSpeed: "medium",
    behaviorRules: [],
    businessName: "",
    industry: "",
    services: "",
    contactInfo: "",
    paymentMethods: "",
    locations: "",
    faqs: "",
    policies: "",
    uploadedFiles: [],
    tags: [],
    apiIntegration: false,
    features: {},
    welcomeMessage: "Hi! I'm your assistant. How can I help today?",
    shortDescription: "",
    status: "active",
    avatarUrl: "",
    faqsText: "",
    knowledgeSources: [],
    topicFocus: "",
    contentRefresh: "weekly",
    responseLength: "medium",
    memoryEnabled: true,
    contextLimit: 10,
    fallbackResponse: "I'm not sure, but I can check and get back to you.",
    primaryLanguage: "English",
    multiLanguage: false,
    ttsEnabled: false,
    sttEnabled: false,
    accessibilityMode: false,
    autoGreeting: true,
    chatHistory: "save",
    proactivePrompts: [],
    quickReplies: [],
    themeColor: "#6366f1",
    chatPosition: "bottom-right",
    chatSize: "medium",
    customFont: "Inter",
    animationStyle: "typing",
    crmIntegration: false,
    emailNotifications: false,
    webhooksEnabled: false,
    webhookUrl: "",
    aiModel: "smart",
    aiModelProvider: "gemini",
    widgetStyle: "classic",
    iconStyle: "modern",
    backgroundStyle: "clean",
    suggestedQuestions: [
      "What can you help me with?",
      "Can I see pricing?",
      "How do I get started?",
    ],
    analyticsEnabled: true,
    requireLogin: false,
    privacyPolicy: "",
    blockPhrases: "",
    publishStatus: "draft",
    versionNotes: "",
    bookingHours: {
      openTime: "09:00",
      closeTime: "17:00",
      timezone: typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "Local",
    },
    humanModel: {
      ethnicity: "",
      bodyType: "",
      styleVibe: "",
      seedId: "",
    },
    socialMedia: {
      targetAudience: {
        ageRange: "",
        locations: "",
        interests: "",
      },
      marketingGoal: "",
      platforms: [],
      brandVoice: "professional",
      postingFrequency: "moderate",
      contentTypes: [],
      adBudget: "",
      competitors: "",
    },
  });

  // New behavior rule input
  const [newRule, setNewRule] = useState("");
  const [newTag, setNewTag] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Playground state
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; content: string }[]>([]);
  const [bookingFlowActive, setBookingFlowActive] = useState(false);
  const [bookingStep, setBookingStep] = useState(0);
  const [bookingDraft, setBookingDraft] = useState({
    name: "",
    email: "",
    phone: "",
    date: "",
    time: "",
    service: "",
    notes: "",
  });

  // Publish/embed state
  const [savedBotId, setSavedBotId] = useState<string | null>(null);
  const [savedApiKey, setSavedApiKey] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showEmbedDialog, setShowEmbedDialog] = useState(false);
  const [embedCopied, setEmbedCopied] = useState<string | null>(null);
  const [previewBotId, setPreviewBotId] = useState<string | null>(null);
  const [playgroundTab, setPlaygroundTab] = useState<'chat' | 'publish'>('chat');
  const publishBotId = savedBotId || previewBotId || null;
  const showPublishTab = botConfig.publishStatus === 'published' || Boolean(publishBotId);
  
  
  // Magic Fill state
  const [magicFillUrl, setMagicFillUrl] = useState("");
  const [isMagicFilling, setIsMagicFilling] = useState(false);
  const [showMagicFillDialog, setShowMagicFillDialog] = useState(false);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user && !isGuest) {
      navigate("/auth");
    }
  }, [authLoading, user, isGuest, navigate]);

  // Load current playground state when switching playgrounds
  useEffect(() => {
    if (currentPlaygroundId) {
      const currentPlayground = playgrounds.find(p => p.id === currentPlaygroundId);
      if (currentPlayground) {
        const config = currentPlayground.bot_config as unknown as BotConfig;
        if (config && Object.keys(config).length > 0) {
          setBotConfig(prev => ({ ...prev, ...config }));
        }
        setMessages(currentPlayground.messages as { role: 'user' | 'bot'; content: string }[]);
        const savedView = (currentPlayground.current_view as 'home' | 'setup' | 'playground' | 'manage' | 'video-generator') || 'home';
        if (currentView !== 'manage' && currentView !== 'catalog' && currentView !== 'setup') {
          setCurrentView(savedView);
        }
        setSetupStep(currentPlayground.setup_step);
        if (currentPlayground.module_id) {
          const foundModule = modules.find(m => m.id === currentPlayground.module_id);
          if (foundModule) setSelectedModule(foundModule);
        }
      }
    }
  }, [currentPlaygroundId, playgrounds]);

  // Fetch published bot id by name for preview
  useEffect(() => {
    const fetchPreviewBot = async () => {
      if (!botConfig.name) {
        setPreviewBotId(null);
        return;
      }
      const { data } = await supabase
        .from('bots')
        .select('bot_id')
        .eq('name', botConfig.name)
        .eq('is_active', true)
        .maybeSingle();
      setPreviewBotId(data?.bot_id || null);
    };
    fetchPreviewBot();
  }, [botConfig.name]);

  // Auto-save to database when state changes
  const saveToDatabase = useCallback(() => {
    if (!currentPlaygroundId) return;
    
    updatePlayground(currentPlaygroundId, {
      bot_config: botConfig as unknown as Record<string, unknown>,
      messages: messages as unknown as Array<{ role: string; content: string }>,
      current_view: currentView === 'manage' || currentView === 'video-generator' || currentView === 'catalog' ? 'home' : currentView,
      setup_step: setupStep,
      module_id: selectedModule?.id || null,
    });
  }, [currentPlaygroundId, botConfig, messages, currentView, setupStep, selectedModule, updatePlayground]);

  // Debounced save
  useEffect(() => {
    if (!currentPlaygroundId) return;
    const timer = setTimeout(saveToDatabase, 1000);
    return () => clearTimeout(timer);
  }, [botConfig, messages, currentView, setupStep, selectedModule, saveToDatabase, currentPlaygroundId]);

  useEffect(() => {
    if (!showPublishTab && playgroundTab !== 'chat') {
      setPlaygroundTab('chat');
    }
  }, [showPublishTab, playgroundTab]);

  const filteredModules = modules.filter((m) => m.category === activeCategory);

  const handleModuleSelect = async (module: Module) => {
    // Check guest bot limit
    if (isGuest && playgrounds.length >= 1) {
      toast({
        title: "Tour Mode Limit",
        description: "Guest users can create only 1 test bot. Sign in to create more.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    let targetPlaygroundId = currentPlaygroundId;
    if (currentView === 'catalog') {
      const newPlayground = await createPlayground();
      if (!newPlayground) {
        toast({
          title: "Could not create playground",
          description: "Please try again in a moment.",
          variant: "destructive",
        });
        return;
      }
      targetPlaygroundId = newPlayground.id;
      setCurrentPlaygroundId(newPlayground.id);
    }
    // Handle media modules specially - navigate to dedicated pages
    if (module.id === 'video-gen') {
      setSelectedModule(module);
      setCurrentView('video-generator');
      return;
    }
    
    // Handle Social Media Analyzer - goes directly to analyzer view
    if (module.id === 'social-media-analyzer') {
      setSelectedModule(module);
      setCurrentView('setup');
      return;
    }
    
    setSelectedModule(module);
    setCurrentView('setup');
    setSetupStep(1);

    if (targetPlaygroundId) {
      updatePlayground(targetPlaygroundId, {
        current_view: 'setup',
        setup_step: 1,
        module_id: module.id,
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles: UploadedFile[] = Array.from(files).map((file, index) => ({
        id: `file-${Date.now()}-${index}`,
        name: file.name,
        type: file.type || 'unknown',
        size: formatFileSize(file.size),
      }));
      setBotConfig(prev => ({
        ...prev,
        uploadedFiles: [...prev.uploadedFiles, ...newFiles],
      }));
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const removeFile = (fileId: string) => {
    setBotConfig(prev => ({
      ...prev,
      uploadedFiles: prev.uploadedFiles.filter(f => f.id !== fileId),
    }));
  };

  const addBehaviorRule = () => {
    if (newRule.trim()) {
      setBotConfig(prev => ({
        ...prev,
        behaviorRules: [...prev.behaviorRules, newRule.trim()],
      }));
      setNewRule("");
    }
  };

  const removeRule = (index: number) => {
    setBotConfig(prev => ({
      ...prev,
      behaviorRules: prev.behaviorRules.filter((_, i) => i !== index),
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !botConfig.tags.includes(newTag.trim())) {
      setBotConfig(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setBotConfig(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
  };

  const handleMagicFill = async () => {
    if (!magicFillUrl.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter your website URL to use Magic Fill",
        variant: "destructive",
      });
      return;
    }

    setIsMagicFilling(true);
    try {
      const { data, error } = await supabase.functions.invoke('magic-fill', {
        body: { websiteUrl: magicFillUrl.trim() },
      });

      if (error) {
        throw error;
      }

      if (data?.success && data?.data) {
        setBotConfig(prev => ({
          ...prev,
          businessName: data.data.businessName || prev.businessName,
          industry: data.data.industry || prev.industry,
          services: data.data.services || prev.services,
          faqs: data.data.faqs || prev.faqs,
          contactInfo: data.data.contactInfo || prev.contactInfo,
          locations: data.data.locations || prev.locations,
        }));
        setShowMagicFillDialog(false);
        setMagicFillUrl("");
        toast({
          title: "Magic Fill Complete! ✨",
          description: "Your business information has been extracted. Review and adjust as needed.",
        });
      } else {
        throw new Error(data?.error || 'Failed to extract information');
      }
    } catch (error) {
      console.error('Magic Fill error:', error);
      toast({
        title: "Magic Fill Failed",
        description: error instanceof Error ? error.message : "Could not extract information from website",
        variant: "destructive",
      });
    } finally {
      setIsMagicFilling(false);
    }
  };

  const handleTestMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput("");
    setIsLoading(true);

    try {
      if (bookingFlowActive) {
        const stepFields: Array<keyof typeof bookingDraft> = [
          "name",
          "email",
          "phone",
          "date",
          "time",
          "service",
          "notes",
        ];

        const currentField = stepFields[bookingStep];
        const updated = { ...bookingDraft, [currentField]: userMessage };

        if (currentField === "email") {
          const emailOk = /[^\s@]+@[^\s@]+\.[^\s@]+/.test(userMessage);
          if (!emailOk) {
            setMessages(prev => [
              ...prev,
              { role: "bot", content: "Please enter a valid email address." },
            ]);
            setIsLoading(false);
            return;
          }
        }

        if (currentField === "time") {
          const minutes = parseTimeInputToMinutes(userMessage);
          const { openTime, closeTime, timezone } = botConfig.bookingHours;
          const [openH, openM] = openTime.split(":").map(Number);
          const [closeH, closeM] = closeTime.split(":").map(Number);
          const openMinutes = openH * 60 + openM;
          const closeMinutes = closeH * 60 + closeM;
          if (minutes === null) {
            const examples = getTimeSlots(openTime, closeTime).slice(0, 3).join(", ");
            setMessages(prev => [
              ...prev,
              { role: "bot", content: `Please enter a time like 3:00 PM. Example times: ${examples}` },
            ]);
            setIsLoading(false);
            return;
          }
          if (minutes < openMinutes || minutes >= closeMinutes) {
            const examples = getTimeSlots(openTime, closeTime).slice(0, 5).join(", ");
            setMessages(prev => [
              ...prev,
              { role: "bot", content: `We book between ${normalizeTimeLabel(openTime)} and ${normalizeTimeLabel(closeTime)} (${timezone}). Try one of these: ${examples}` },
            ]);
            setIsLoading(false);
            return;
          }
          updated.time = normalizeTimeLabel(
            `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`
          );
        }
        setBookingDraft(updated);

        const nextStep = bookingStep + 1;
        if (nextStep >= stepFields.length) {
          const botIdForBooking = publishBotId;
          if (!botIdForBooking) {
            setMessages(prev => [
              ...prev,
              {
                role: "bot",
                content:
                  "Thanks! I captured the details, but this bot isn't published yet. Publish it to save bookings to your dashboard.",
              },
            ]);
            setBookingFlowActive(false);
            setBookingStep(0);
            setIsLoading(false);
            return;
          }

          const { error: bookingError } = await supabase
            .from("appointments")
            .insert({
              bot_id: botIdForBooking,
              name: updated.name,
              email: updated.email,
              phone: updated.phone || null,
              date: updated.date,
              time: updated.time,
              service: updated.service,
              notes: updated.notes || `Booked via chat (${botConfig.bookingHours.timezone})`,
              status: "pending",
            });

          if (bookingError) {
            console.error("Booking save error:", bookingError);
            setMessages(prev => [
              ...prev,
              {
                role: "bot",
                content: "I couldn't save that booking. Please try again in a moment.",
              },
            ]);
          } else {
            setMessages(prev => [
              ...prev,
              {
                role: "bot",
                content:
                  "Thanks! I saved your booking details. You can review them on the Bookings page.",
              },
            ]);
          }
          setBookingFlowActive(false);
          setBookingStep(0);
          setIsLoading(false);
          return;
        }

        const { openTime, closeTime } = botConfig.bookingHours;
        const prompts: string[] = [
          "Great. What is your email address?",
          "Phone number?",
          "Which date do you prefer? (e.g., 2026-02-08)",
          `What time works for you? We're open ${normalizeTimeLabel(openTime)} to ${normalizeTimeLabel(closeTime)}.`,
          "Which service are you booking?",
          "Any notes for this appointment?",
        ];
        setBookingStep(nextStep);
        setMessages(prev => [...prev, { role: "bot", content: prompts[nextStep - 1] }]);
        setIsLoading(false);
        return;
      }

          const { data, error } = await supabase.functions.invoke('bot-chat', {
        body: {
          message: userMessage,
          botConfig: {
            name: botConfig.name,
            tone: botConfig.tone,
            typingSpeed: botConfig.typingSpeed,
            behaviorRules: botConfig.behaviorRules,
            businessName: botConfig.businessName,
            industry: botConfig.industry,
            services: botConfig.services,
            contactInfo: botConfig.contactInfo,
            paymentMethods: botConfig.paymentMethods,
            locations: botConfig.locations,
            faqs: botConfig.faqs,
            policies: botConfig.policies,
            tags: botConfig.tags,
            bookingHours: botConfig.bookingHours,
            bookingEnabled: botConfig.apiIntegration,
            aiModel: botConfig.aiModelProvider,
          },
          conversationHistory: messages,
        },
      });

      if (error) {
        console.error('Error calling bot-chat:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to get response from AI",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (data?.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const botResponse = data?.response || "I apologize, but I couldn't generate a response.";
      setMessages(prev => [...prev, { role: 'bot', content: botResponse }]);
    } catch (err) {
      console.error('Error:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    const fullConversation = messages.map(m => `${m.role}: ${m.content}`).join('\n');
    await navigator.clipboard.writeText(fullConversation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startBookingFlow = () => {
    if (!botConfig.apiIntegration) return;
    const hours = botConfig.bookingHours;
    const openLabel = normalizeTimeLabel(hours.openTime);
    const closeLabel = normalizeTimeLabel(hours.closeTime);
    setBookingDraft({
      name: "",
      email: "",
      phone: "",
      date: "",
      time: "",
      service: "",
      notes: "",
    });
    setBookingStep(0);
    setBookingFlowActive(true);
    setMessages(prev => [
      ...prev,
      {
        role: "bot",
        content:
          `Let's book an appointment. We're open from ${openLabel} to ${closeLabel} (${hours.timezone}). What's your full name?`,
      },
    ]);
  };

  const toggleFeature = (section: string, item: string) => {
    setBotConfig((prev) => {
      const current = prev.features || {};
      const items = new Set(current[section] || []);
      if (items.has(item)) {
        items.delete(item);
      } else {
        items.add(item);
      }
      return {
        ...prev,
        features: {
          ...current,
          [section]: Array.from(items),
        },
      };
    });
  };

  const copyEmbedCode = async (code: string, id: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(code);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = code;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        textarea.style.top = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const success = document.execCommand("copy");
        document.body.removeChild(textarea);
        if (!success) throw new Error("Copy failed");
      }
      setEmbedCopied(id);
      setTimeout(() => setEmbedCopied(null), 2000);
      toast({ title: "Copied", description: "Widget code copied to clipboard." });
    } catch (err) {
      console.error("Copy error:", err);
      toast({
        title: "Copy failed",
        description: "Your browser blocked clipboard access. Try selecting the code and copying manually.",
        variant: "destructive",
      });
    }
  };

  const normalizeTimeLabel = (time24: string) => {
    const [rawH, rawM] = time24.split(":");
    const hours = Number(rawH);
    const minutes = Number(rawM || "0");
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return time24;
    const suffix = hours >= 12 ? "PM" : "AM";
    const displayHour = hours % 12 === 0 ? 12 : hours % 12;
    return `${displayHour}:${String(minutes).padStart(2, "0")} ${suffix}`;
  };

  const parseTimeInputToMinutes = (inputTime: string) => {
    const cleaned = inputTime.trim().toLowerCase();
    const match = cleaned.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
    if (!match) return null;
    let hours = Number(match[1]);
    const minutes = Number(match[2] || "0");
    const meridiem = match[3];
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
    if (meridiem) {
      if (hours === 12) hours = 0;
      if (meridiem === "pm") hours += 12;
    }
    if (hours > 23 || minutes > 59) return null;
    return hours * 60 + minutes;
  };

  const getTimeSlots = (openTime: string, closeTime: string, stepMinutes = 30) => {
    const [openH, openM] = openTime.split(":").map(Number);
    const [closeH, closeM] = closeTime.split(":").map(Number);
    const open = openH * 60 + openM;
    const close = closeH * 60 + closeM;
    if (Number.isNaN(open) || Number.isNaN(close) || close <= open) return [];
    const slots: string[] = [];
    for (let m = open; m < close; m += stepMinutes) {
      const hours = Math.floor(m / 60);
      const minutes = m % 60;
      slots.push(normalizeTimeLabel(`${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`));
    }
    return slots;
  };

  // Save/Publish bot to database
  const handlePublishBot = async (options: { showDialog?: boolean } = {}) => {
    if (!botConfig.name) {
      toast({
        title: "Bot name required",
        description: "Please give your bot a name before publishing",
        variant: "destructive",
      });
      return null;
    }

    setIsSaving(true);
    try {
      const normalizePlanTier = (plan?: string | null) => {
        switch (plan) {
          case "starter":
          case "optimizer":
          case "enterprise":
          case "free":
            return plan;
          case "pro":
            return "starter";
          case "exclusive":
            return "enterprise";
          default:
            return "free";
        }
      };

      const planTier = normalizePlanTier(profile?.plan);
      const messageLimit =
        planTier === "enterprise" ? null : planTier === "optimizer" ? 200 : planTier === "starter" ? 100 : 50;

      const { data, error } = await supabase
        .from('bots')
        .insert({
          name: botConfig.name,
          tone: botConfig.tone,
          typing_speed: botConfig.typingSpeed,
          behavior_rules: botConfig.behaviorRules,
          business_name: botConfig.businessName,
          industry: botConfig.industry,
          services: botConfig.services,
          contact_info: botConfig.contactInfo,
          payment_methods: botConfig.paymentMethods,
          locations: botConfig.locations,
          faqs: botConfig.faqs,
          policies: botConfig.policies,
          tags: botConfig.tags,
          greeting_message: `Hi! I'm ${botConfig.name}. How can I help you today?`,
          primary_color: botConfig.themeColor || "#0EA5E9",
          avatar_url: botConfig.avatarUrl || null,
          bot_type: selectedModule?.id || 'chatbot',
          booking_enabled: botConfig.apiIntegration ? true : false,
          booking_button_text: "Schedule an appointment",
          bot_plan_tier: planTier,
          message_limit: messageLimit,
          ai_model: botConfig.aiModelProvider || "gemini",
          widget_style: botConfig.widgetStyle || "classic",
          icon_style: botConfig.iconStyle || "modern",
          background_style: botConfig.backgroundStyle || "clean",
          suggested_questions: botConfig.suggestedQuestions || [],
        })
        .select('bot_id, api_key')
        .single();

      if (error) {
        console.error('Error saving bot:', error);
        throw error;
      }

      setSavedBotId(data.bot_id);
      setSavedApiKey(data.api_key);
      if (currentPlaygroundId) {
        setBotConfig(prev => ({ ...prev, publishStatus: 'published' }));
        updatePlayground(currentPlaygroundId, {
          bot_config: {
            ...(playgrounds.find(p => p.id === currentPlaygroundId)?.bot_config as Record<string, unknown>),
            ...botConfig,
            publishStatus: 'published',
            publishedBotId: data.bot_id,
          },
        });
      }
      if (options.showDialog !== false) {
        setShowEmbedDialog(true);
      }
      toast({
        title: "Bot Published!",
        description: "Your bot is now ready to embed on any website.",
      });
      return data;
    } catch (err) {
      console.error('Error:', err);
      toast({
        title: "Error",
        description: "Failed to publish bot. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const getIframeSnippetLeft = (botId: string) => `<!-- ModelStack AI Chatbot (iFrame Embed) -->
<iframe
  src="${window.location.origin}/widget/${botId}"
  title="ModelStack AI Chatbot"
  style="width: 380px; height: 560px; border: 0; border-radius: 24px; box-shadow: 0 20px 60px rgba(15, 23, 42, 0.25); overflow: hidden;"
  allow="clipboard-read; clipboard-write; microphone; speaker; camera"
  loading="lazy"
></iframe>
<!-- End ModelStack AI Chatbot -->`;

  const goToNextStep = () => {
    if (setupStep < 3) {
      setSetupStep(setupStep + 1);
    } else {
      setCurrentView('playground');
    }
  };

  const goToPrevStep = () => {
    if (setupStep > 1) {
      setSetupStep(setupStep - 1);
    } else {
      setCurrentView('home');
    }
  };

  return (
    <Layout>
      {/* Embed Code Dialog */}
      <Dialog open={showEmbedDialog} onOpenChange={setShowEmbedDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-accent" />
              Embed Your Bot
            </DialogTitle>
            <DialogDescription>
              Copy the iFrame snippet below to add your AI bot to any website. Supports text chat, voice conversations (TTS/STT), and appointment booking.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {/* Bot ID */}
            <div className="p-3 bg-accent/10 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-accent" />
              <span className="font-medium">Bot ID: <code className="bg-secondary px-2 py-1 rounded">{savedBotId}</code></span>
            </div>
            
            {/* API Key - ModelStack format */}
            <div className="p-4 bg-secondary/50 rounded-lg border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Key className="w-4 h-4 text-accent" />
                <h4 className="font-medium">Your ModelStack API Key</h4>
              </div>
              <div className="relative">
                <code className="block bg-background px-3 py-2 rounded text-sm font-mono break-all">
                  {savedApiKey || 'Generating...'}
                </code>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="absolute top-1 right-1"
                  onClick={() => savedApiKey && copyEmbedCode(savedApiKey, 'apikey')}
                >
                  {embedCopied === 'apikey' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Keep this key secret! Use it to authenticate API requests to your bot.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">iFrame Embed</h4>
              <p className="text-xs text-muted-foreground mb-2">
                The only supported embed method. Drop the iFrame on any page where you want the bot to appear.
              </p>
              <div className="relative">
                <pre className="bg-secondary/50 rounded-lg p-3 text-xs overflow-x-auto max-h-48">
                  <code>{savedBotId ? getIframeSnippetLeft(savedBotId) : ''}</code>
                </pre>
                <Button size="sm" variant="secondary" className="absolute top-2 right-2" onClick={() => savedBotId && copyEmbedCode(getIframeSnippetLeft(savedBotId), 'iframe')}>
                  {embedCopied === 'iframe' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => navigate('/embed')} className="gap-2">
                <ExternalLink className="w-4 h-4" />
                Full Embed Page
              </Button>
              <Button variant="outline" onClick={() => savedBotId && window.open(`/widget/${savedBotId}`, '_blank')} className="gap-2">
                <Globe className="w-4 h-4" />
                Preview Widget
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div
        className={cn(
          "bg-background flex",
          currentView === "bot-settings"
            ? "h-[calc(100vh-4rem)] overflow-hidden"
            : "min-h-screen"
        )}
      >
        {/* Left Sidebar */}
        <div className={cn(
          "border-r border-border bg-card flex flex-col transition-all duration-300",
          sidebarCollapsed ? "w-16" : "w-64"
        )}>
          {/* Logo area */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            {!sidebarCollapsed && (
              <span className="font-bold text-lg text-foreground">ModelStack</span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="ml-auto"
            >
              {sidebarCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-2 space-y-1">
            <NavItem 
              icon={Home} 
              label="Home" 
              collapsed={sidebarCollapsed} 
              active={currentView === 'home'}
              onClick={() => setCurrentView('home')}
            />
            <NavItem 
              icon={FolderOpen} 
              label="My Playgrounds" 
              active={currentView === 'manage'} 
              collapsed={sidebarCollapsed}
              onClick={() => setCurrentView('manage')}
            />
            <NavItem 
              icon={Code} 
              label="Current Playground" 
              active={currentView === 'setup' || currentView === 'playground'} 
              collapsed={sidebarCollapsed}
              expandable
              onClick={() => currentPlaygroundId && selectedModule && setCurrentView('playground')}
            >
              {!sidebarCollapsed && playgrounds.length > 0 && (
                <div className="ml-6 mt-1 space-y-1">
                  {playgrounds.slice(0, 3).map((pg) => (
                    <button
                      key={pg.id}
                      onClick={() => {
                        setCurrentPlaygroundId(pg.id);
                        const foundModule = modules.find((m) => m.id === pg.module_id);
                        if (foundModule) {
                          setSelectedModule(foundModule);
                        }
                        setCurrentView('playground');
                      }}
                      className={cn(
                        "w-full text-left px-3 py-1.5 text-sm transition-colors truncate",
                        pg.id === currentPlaygroundId ? "text-accent" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {pg.name}
                    </button>
                  ))}
                  {playgrounds.length > 3 && (
                    <button 
                      onClick={() => setCurrentView('manage')}
                      className="w-full text-left px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                    >
                      View all ({playgrounds.length}) <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </NavItem>
            <NavItem 
              icon={BarChart3} 
              label="Analytics" 
              collapsed={sidebarCollapsed} 
              active={currentView === 'analytics'}
              onClick={() => setCurrentView('analytics')}
            />
            <NavItem 
              icon={Users} 
              label="Live Chat Viewer" 
              collapsed={sidebarCollapsed}
              active={currentView === 'live-chat'}
              onClick={() => setCurrentView('live-chat')}
            />
          <NavItem 
            icon={Settings} 
            label="Bot Settings" 
            collapsed={sidebarCollapsed}
            active={currentView === 'bot-settings'}
            onClick={() => setCurrentView('bot-settings')}
          />

        </nav>

      </div>

      {/* Main Content */}
      <div
        className={cn(
          "flex-1 flex flex-col h-full min-h-0",
          currentView === "bot-settings" && "overflow-hidden"
        )}
      >

            {/* HOME VIEW - Create AI Showcase */}
            {currentView === 'home' && (
              <div className="flex-1 px-6 py-10 md:py-14">
                <div className="max-w-6xl mx-auto">
                  <div className="grid lg:grid-cols-2 gap-10 items-center">
                    <div className="space-y-6">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-semibold uppercase tracking-widest">
                        Create AI Studio
                      </div>
                      <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                        <span className="text-muted-foreground">Model</span>Stack Create AI
                      </h1>
                      <p className="text-lg text-muted-foreground max-w-xl">
                        ModelStack - AI Chatbots That Know Your Business. Build intelligent assistants, marketing engines, and
                        analytics workflows from one studio.
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <Button variant="accent" onClick={() => setCurrentView('catalog')}>
                          Start New Playground
                        </Button>
                        <Button variant="outline" onClick={() => setCurrentView('manage')}>
                          My Playgrounds
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-4 pt-4">
                        <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
                          <div className="text-2xl font-bold text-foreground">{modules.length}</div>
                          <div className="text-xs text-muted-foreground">AI Modules</div>
                        </div>
                        <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
                          <div className="text-2xl font-bold text-foreground">{playgrounds.length}</div>
                          <div className="text-xs text-muted-foreground">Bots</div>
                        </div>
                        <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
                          <div className="text-2xl font-bold text-foreground">Live</div>
                          <div className="text-xs text-muted-foreground">Realtime Embeds</div>
                        </div>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {modules.slice(0, 4).map((module) => (
                        <div
                          key={module.id}
                          className="rounded-2xl border border-border/60 bg-card/60 p-5 shadow-sm"
                        >
                          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-3">
                            <module.icon className="w-5 h-5 text-accent" />
                          </div>
                          <div className="font-semibold text-foreground">{module.name}</div>
                          <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {module.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CATALOG VIEW - Module Selection */}
            {currentView === 'catalog' && (
              <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 md:py-14">
                <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3">
                  <span className="text-muted-foreground">Choose</span> Your AI
                </h1>
                <p className="text-muted-foreground mb-8 text-center max-w-2xl">
                  Pick a module and launch a tailored AI workflow. Each module can be configured with your business information.
                </p>

                {isGuest && playgrounds.length >= 1 && (
                  <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg text-center max-w-2xl">
                    <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                      You've reached the guest tour limit (1 bot). <button onClick={() => navigate('/auth')} className="text-accent hover:underline">Sign in or create an account</button> to create more.
                    </p>
                  </div>
                )}

                {/* Category Tabs */}
                <div className="flex items-center gap-1 mb-8 p-1 bg-secondary/50 rounded-full border border-border">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setActiveCategory(category)}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium transition-all",
                        activeCategory === category
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {category === "Featured" && "??? "}
                      {category}
                    </button>
                  ))}
                </div>

                {/* Module List */}
                <div className="w-full max-w-5xl grid md:grid-cols-2 gap-4">
                  {filteredModules.map((module) => (
                    <button
                      key={module.id}
                      onClick={() => !module.isComingSoon && handleModuleSelect(module)}
                      disabled={module.isComingSoon || (isGuest && playgrounds.length >= 1)}
                      className={cn(
                        "w-full flex items-start gap-4 p-5 rounded-2xl border border-border/60 bg-card/60 transition-all text-left group",
                        (module.isComingSoon || (isGuest && playgrounds.length >= 1))
                          ? "opacity-60 cursor-not-allowed"
                          : "hover:border-accent/50 hover:shadow-glow"
                      )}
                    >
                      <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center shrink-0">
                        <module.icon className="w-5 h-5 text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-foreground text-lg">{module.name}</span>
                          {module.isNew && (
                            <span className="text-xs text-green-500 font-medium">??? New</span>
                          )}
                          {module.isComingSoon && (
                            <span className="text-xs text-amber-500 font-medium inline-flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              Coming Soon
                            </span>
                          )}
                          {module.isPaid && (
                            <span className="text-xs text-accent font-medium">??? Paid</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {module.description}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* SETUP VIEW - Bot Configuration */}
            {currentView === 'setup' && (
              <div className="max-w-4xl mx-auto p-8">
                {/* Progress Indicator */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    {[1, 2, 3].map((step) => (
                      <div key={step} className="flex items-center gap-2">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                          step === setupStep ? "bg-accent text-accent-foreground" :
                          step < setupStep ? "bg-green-500 text-white" : "bg-secondary text-muted-foreground"
                        )}>
                          {step < setupStep ? <Check className="w-4 h-4" /> : step}
                        </div>
                        <span className={cn(
                          "text-sm font-medium",
                          step === setupStep ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {selectedModule?.id === 'social-media-marketing' 
                            ? (step === 1 ? "Business" : step === 2 ? "Platforms" : "Strategy")
                            : (step === 1 ? "Identity" : step === 2 ? "Knowledge" : "Review")
                          }
                        </span>
                        {step < 3 && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedModule && <selectedModule.icon className="w-5 h-5 text-accent" />}
                    <span className="font-medium text-foreground">{selectedModule?.name}</span>
                  </div>
                </div>

                {/* Social Media Marketing Chat Setup */}
                {selectedModule?.id === 'social-media-marketing' && (
                  <SocialMediaChatSetup
                    onComplete={(config, businessName, industry) => {
                      setBotConfig(prev => ({
                        ...prev,
                        businessName,
                        industry,
                        socialMedia: config
                      }));
                      setCurrentView('playground');
                    }}
                  />
                )}

                {/* Social Media Analyzer - handled separately in its own view */}
                {selectedModule?.id === 'social-media-analyzer' && null}

                {/* AI Human Models Setup */}
                {selectedModule?.id === 'ai-human-models' && (
                  <div className="space-y-6 animate-fade-in">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground mb-2">AI Human Model Customization</h2>
                      <p className="text-muted-foreground">
                        Configure the model’s look, body type, style, and face consistency.
                      </p>
                    </div>

                    <div className="grid gap-6">
                      <div className="grid md:grid-cols-2 gap-4 rounded-2xl border border-border/60 bg-card/60 p-5">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">Ethnicity & Look</label>
                          <Input
                            value={botConfig.humanModel?.ethnicity || ""}
                            onChange={(e) =>
                              setBotConfig((prev) => ({
                                ...prev,
                                humanModel: { ...prev.humanModel!, ethnicity: e.target.value },
                              }))
                            }
                            placeholder="European, African, Asian, Hispanic, etc."
                          />
                          <p className="text-xs text-muted-foreground">
                            Sets the base skin tone and facial features.
                          </p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">Body Type</label>
                          <Input
                            value={botConfig.humanModel?.bodyType || ""}
                            onChange={(e) =>
                              setBotConfig((prev) => ({
                                ...prev,
                                humanModel: { ...prev.humanModel!, bodyType: e.target.value },
                              }))
                            }
                            placeholder="Athletic, Curvy, Slim, Tall"
                          />
                          <p className="text-xs text-muted-foreground">
                            Defines the physical build of the model.
                          </p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">Style / Vibe</label>
                          <Input
                            value={botConfig.humanModel?.styleVibe || ""}
                            onChange={(e) =>
                              setBotConfig((prev) => ({
                                ...prev,
                                humanModel: { ...prev.humanModel!, styleVibe: e.target.value },
                              }))
                            }
                            placeholder="Streetwear, High-Fashion, Fitness, Casual"
                          />
                          <p className="text-xs text-muted-foreground">
                            Determines the default clothing and lighting.
                          </p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">Consistent Face</label>
                          <Input
                            value={botConfig.humanModel?.seedId || ""}
                            onChange={(e) =>
                              setBotConfig((prev) => ({
                                ...prev,
                                humanModel: { ...prev.humanModel!, seedId: e.target.value },
                              }))
                            }
                            placeholder="Seed ID Lock"
                          />
                          <p className="text-xs text-muted-foreground">
                            Ensures the model looks the same in every photo.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Email Replier Setup */}
                {selectedModule?.id === 'email-replier' && (
                  <div className="space-y-6 animate-fade-in">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground mb-2">Email Replier Setup</h2>
                      <p className="text-muted-foreground">
                        Connect your inbox, sync context, and set AI guardrails.
                      </p>
                    </div>

                    <div className="grid gap-6">
                      <div className="p-4 rounded-lg border border-border bg-secondary/30">
                        <h3 className="font-semibold text-foreground mb-2">Step 1: The Connection (OAuth 2.0)</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Select your provider and grant read/write permissions.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Button variant="outline" className="flex-1">Connect Gmail</Button>
                          <Button variant="outline" className="flex-1">Connect Outlook</Button>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-sm text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 rounded-md px-3 py-2">
                          <Shield className="w-4 h-4" />
                          Encrypted Connection Established. Your data is never stored, only processed.
                        </div>
                      </div>

                      <div className="p-4 rounded-lg border border-border bg-secondary/30">
                        <h3 className="font-semibold text-foreground mb-2">Step 2: Voice & Context Sync</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          The AI learns your tone and links context from chats.
                        </p>
                        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                          <li>Sent Folder: Analyzes last 50 emails to learn your voice.</li>
                          <li>Chatbot Logs: Links email to chat history for better context.</li>
                        </ul>
                      </div>

                      <div className="p-4 rounded-lg border border-border bg-secondary/30">
                        <h3 className="font-semibold text-foreground mb-2">Step 3: Guardrails</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Control how and when the AI sends emails.
                        </p>
                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Drafting Mode</label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Human Review" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="review">Human Review</SelectItem>
                                <SelectItem value="auto">Auto-Pilot</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                              Review saves drafts; Auto-Pilot sends instantly.
                            </p>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Meeting Buffers</label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="30 minutes" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="15">15 min</SelectItem>
                                <SelectItem value="30">30 min</SelectItem>
                                <SelectItem value="60">60 min</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                              Prevents back-to-back meetings.
                            </p>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Price Lists</label>
                            <Button variant="outline" className="w-full">Upload PDF / Text</Button>
                            <p className="text-xs text-muted-foreground">
                              AI checks master price list before quoting.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Regular Bot Setup (non-social-media modules) */}
                {selectedModule?.id !== 'social-media-marketing' && selectedModule?.id !== 'social-media-analyzer' && selectedModule?.id !== 'ai-human-models' && selectedModule?.id !== 'email-replier' && (
                  <>

                {/* Step 1: Bot Identity & Personality */}
                {setupStep === 1 && (
                  <div className="space-y-6 animate-fade-in">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground mb-2">Bot Identity & Personality</h2>
                      <p className="text-muted-foreground">Define how your AI assistant looks and behaves.</p>
                    </div>

                    <div className="grid gap-6">
                      {/* Bot Name */}
                      <div className="space-y-2 rounded-2xl border border-border/60 bg-card/60 p-5">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                          <Bot className="w-4 h-4 text-accent" />
                          Bot Name
                        </label>
                        <Input
                          value={botConfig.name}
                          onChange={(e) => setBotConfig(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., GreenBank Assistant"
                          className="max-w-md"
                        />
                        <p className="text-xs text-muted-foreground">A unique name for your AI assistant</p>
                      </div>

                      {/* Tone / Personality */}
                      <div className="space-y-2 rounded-2xl border border-border/60 bg-card/60 p-5">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-accent" />
                          Tone / Personality
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                          {personalityTones.map((tone) => (
                            <button
                              key={tone.value}
                              onClick={() => setBotConfig(prev => ({ ...prev, tone: tone.value }))}
                              className={cn(
                                "p-3 rounded-lg border text-left transition-all",
                                botConfig.tone === tone.value
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

                      {/* Typing Speed */}
                      <div className="space-y-2 rounded-2xl border border-border/60 bg-card/60 p-5">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                          <Timer className="w-4 h-4 text-accent" />
                          Typing Speed / Response Delay
                        </label>
                        <div className="flex gap-2">
                          {typingSpeedOptions.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => setBotConfig(prev => ({ ...prev, typingSpeed: option.value }))}
                              className={cn(
                                "px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                                botConfig.typingSpeed === option.value
                                  ? "border-accent bg-accent/10 text-accent"
                                  : "border-border text-muted-foreground hover:border-accent/50"
                              )}
                            >
                              {option.label}
                              <span className="block text-xs opacity-70">{option.delay}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Behavior Rules */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                          <Shield className="w-4 h-4 text-accent" />
                          Behavior / Boundaries
                        </label>
                        <div className="flex gap-2">
                          <Input
                            value={newRule}
                            onChange={(e) => setNewRule(e.target.value)}
                            placeholder="e.g., Avoid sensitive topics, no legal advice"
                            className="flex-1"
                            onKeyPress={(e) => e.key === 'Enter' && addBehaviorRule()}
                          />
                          <Button onClick={addBehaviorRule} variant="secondary">Add Rule</Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {botConfig.behaviorRules.map((rule, index) => (
                            <div key={index} className="flex items-center gap-1 bg-secondary px-3 py-1 rounded-full text-sm">
                              <span>{rule}</span>
                              <button onClick={() => removeRule(index)} className="text-muted-foreground hover:text-foreground">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Knowledge Base */}
                {setupStep === 2 && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-foreground mb-2">Knowledge Base / Business Info</h2>
                        <p className="text-muted-foreground">Teach your AI everything it should know about your business.</p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setShowMagicFillDialog(true)}
                        className="gap-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30 hover:border-purple-500/50 text-purple-600 hover:text-purple-700"
                      >
                        <Wand2 className="w-4 h-4" />
                        Magic Fill
                      </Button>
                    </div>

                    {/* Magic Fill Dialog */}
                    <Dialog open={showMagicFillDialog} onOpenChange={setShowMagicFillDialog}>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Wand2 className="w-5 h-5 text-purple-500" />
                            Magic Fill
                          </DialogTitle>
                          <DialogDescription>
                            Enter your website URL and we'll automatically extract your business information, services, and FAQs.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Website URL</label>
                            <Input
                              value={magicFillUrl}
                              onChange={(e) => setMagicFillUrl(e.target.value)}
                              placeholder="https://yourwebsite.com"
                              disabled={isMagicFilling}
                            />
                          </div>
                          <Button
                            onClick={handleMagicFill}
                            disabled={isMagicFilling || !magicFillUrl.trim()}
                            className="w-full gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                          >
                            {isMagicFilling ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Extracting...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4" />
                                Extract Information
                              </>
                            )}
                          </Button>
                          <p className="text-xs text-muted-foreground text-center">
                            We'll scan your website and auto-fill Services, FAQs, Contact Info, and more.
                          </p>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {selectedModule?.id === "ai-human-models" && (
                      <div className="p-4 rounded-lg border border-border bg-secondary/30 space-y-4">
                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                          <Users className="w-5 h-5 text-accent" />
                          AI Human Model Settings
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Ethnicity & Look</label>
                            <Input
                              value={botConfig.humanModel?.ethnicity || ""}
                              onChange={(e) =>
                                setBotConfig((prev) => ({
                                  ...prev,
                                  humanModel: { ...prev.humanModel!, ethnicity: e.target.value },
                                }))
                              }
                              placeholder="European, African, Asian, Hispanic..."
                            />
                            <p className="text-xs text-muted-foreground">
                              Sets the base skin tone and facial features.
                            </p>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Body Type</label>
                            <Input
                              value={botConfig.humanModel?.bodyType || ""}
                              onChange={(e) =>
                                setBotConfig((prev) => ({
                                  ...prev,
                                  humanModel: { ...prev.humanModel!, bodyType: e.target.value },
                                }))
                              }
                              placeholder="Athletic, Curvy, Slim, Tall..."
                            />
                            <p className="text-xs text-muted-foreground">
                              Defines the physical build of the model.
                            </p>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Style / Vibe</label>
                            <Input
                              value={botConfig.humanModel?.styleVibe || ""}
                              onChange={(e) =>
                                setBotConfig((prev) => ({
                                  ...prev,
                                  humanModel: { ...prev.humanModel!, styleVibe: e.target.value },
                                }))
                              }
                              placeholder="Streetwear, High-Fashion, Fitness, Casual..."
                            />
                            <p className="text-xs text-muted-foreground">
                              Determines the default clothing and lighting.
                            </p>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Consistent Face</label>
                            <Input
                              value={botConfig.humanModel?.seedId || ""}
                              onChange={(e) =>
                                setBotConfig((prev) => ({
                                  ...prev,
                                  humanModel: { ...prev.humanModel!, seedId: e.target.value },
                                }))
                              }
                              placeholder="Seed ID lock"
                            />
                            <p className="text-xs text-muted-foreground">
                              Ensures the model looks the same in every photo.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid gap-6">
                      {/* Structured Fields */}
                      <div className="grid md:grid-cols-2 gap-4 rounded-2xl border border-border/60 bg-card/60 p-5">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">Business Name</label>
                          <Input
                            value={botConfig.businessName}
                            onChange={(e) => setBotConfig(prev => ({ ...prev, businessName: e.target.value }))}
                            placeholder="Your Company Name"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">Industry</label>
                          <Select 
                            value={botConfig.industry} 
                            onValueChange={(value) => setBotConfig(prev => ({ ...prev, industry: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select industry" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="banking">Banking & Finance</SelectItem>
                              <SelectItem value="healthcare">Healthcare</SelectItem>
                              <SelectItem value="retail">Retail & E-commerce</SelectItem>
                              <SelectItem value="tech">Technology</SelectItem>
                              <SelectItem value="hospitality">Hospitality</SelectItem>
                              <SelectItem value="education">Education</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2 rounded-2xl border border-border/60 bg-card/60 p-5">
                        <label className="text-sm font-medium text-foreground">Services Offered</label>
                        <Textarea
                          value={botConfig.services}
                          onChange={(e) => setBotConfig(prev => ({ ...prev, services: e.target.value }))}
                          placeholder="Describe your services, products, or offerings..."
                          className="min-h-[100px]"
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">Contact Information</label>
                          <Textarea
                            value={botConfig.contactInfo}
                            onChange={(e) => setBotConfig(prev => ({ ...prev, contactInfo: e.target.value }))}
                            placeholder="Email, phone, address..."
                            className="min-h-[80px]"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">Payment Methods</label>
                          <Textarea
                            value={botConfig.paymentMethods}
                            onChange={(e) => setBotConfig(prev => ({ ...prev, paymentMethods: e.target.value }))}
                            placeholder="Visa, Mastercard, PayPal..."
                            className="min-h-[80px]"
                          />
                        </div>
                      </div>

                      <div className="space-y-2 rounded-2xl border border-border/60 bg-card/60 p-5">
                        <label className="text-sm font-medium text-foreground">Locations</label>
                        <Input
                          value={botConfig.locations}
                          onChange={(e) => setBotConfig(prev => ({ ...prev, locations: e.target.value }))}
                          placeholder="List your business locations..."
                        />
                      </div>

                      <div className="space-y-4 rounded-2xl border border-border/60 bg-card/60 p-5">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="w-4 h-4 text-accent" />
                          <h4 className="text-sm font-medium text-foreground">Booking Availability</h4>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Used when Live Data is enabled. The AI will only book within these hours.
                        </p>
                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Open Time</label>
                            <Input
                              type="time"
                              value={botConfig.bookingHours.openTime}
                              onChange={(e) =>
                                setBotConfig(prev => ({
                                  ...prev,
                                  bookingHours: { ...prev.bookingHours, openTime: e.target.value },
                                }))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Close Time</label>
                            <Input
                              type="time"
                              value={botConfig.bookingHours.closeTime}
                              onChange={(e) =>
                                setBotConfig(prev => ({
                                  ...prev,
                                  bookingHours: { ...prev.bookingHours, closeTime: e.target.value },
                                }))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Timezone</label>
                            <Input
                              value={botConfig.bookingHours.timezone}
                              onChange={(e) =>
                                setBotConfig(prev => ({
                                  ...prev,
                                  bookingHours: { ...prev.bookingHours, timezone: e.target.value },
                                }))
                              }
                              placeholder="e.g., America/New_York"
                            />
                          </div>
                        </div>
                      </div>

                      {/* FAQs */}
                      <div className="space-y-2 rounded-2xl border border-border/60 bg-card/60 p-5">
                        <label className="text-sm font-medium text-foreground">FAQs & Common Questions</label>
                        <Textarea
                          value={botConfig.faqs}
                          onChange={(e) => setBotConfig(prev => ({ ...prev, faqs: e.target.value }))}
                          placeholder="Q: What are your hours?&#10;A: We're open Mon-Fri 9am-5pm..."
                          className="min-h-[120px]"
                        />
                      </div>

                      {/* File Uploads */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                          <FileUp className="w-4 h-4 text-accent" />
                          Upload Files
                        </label>
                        <p className="text-xs text-muted-foreground mb-2">
                          Upload .txt, .csv, .xlsx, .pdf, .pptx files to teach your AI
                        </p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept=".txt,.csv,.xlsx,.pdf,.pptx"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-accent/50 transition-colors"
                        >
                          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                        </div>
                        {botConfig.uploadedFiles.length > 0 && (
                          <div className="space-y-2 mt-4">
                            {botConfig.uploadedFiles.map((file) => (
                              <div key={file.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <FileText className="w-4 h-4 text-accent" />
                                  <span className="text-sm font-medium">{file.name}</span>
                                  <span className="text-xs text-muted-foreground">{file.size}</span>
                                </div>
                                <button onClick={() => removeFile(file.id)} className="text-muted-foreground hover:text-destructive">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Tags */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                          <Tag className="w-4 h-4 text-accent" />
                          Tags / Metadata
                        </label>
                        <div className="flex gap-2">
                          <Input
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            placeholder="e.g., Payment Info, FAQs, Job Roles"
                            className="flex-1"
                            onKeyPress={(e) => e.key === 'Enter' && addTag()}
                          />
                          <Button onClick={addTag} variant="secondary">Add Tag</Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {botConfig.tags.map((tag) => (
                            <div key={tag} className="flex items-center gap-1 bg-accent/10 text-accent px-3 py-1 rounded-full text-sm">
                              <Tag className="w-3 h-3" />
                              <span>{tag}</span>
                              <button onClick={() => removeTag(tag)} className="hover:text-accent/70">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* API Integration */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                          <Database className="w-4 h-4 text-accent" />
                          API / Database Integration
                        </label>
                        <button
                          onClick={() => setBotConfig(prev => ({ ...prev, apiIntegration: !prev.apiIntegration }))}
                          className={cn(
                            "w-full p-4 rounded-lg border text-left transition-all",
                            botConfig.apiIntegration
                              ? "border-accent bg-accent/10"
                              : "border-border hover:border-accent/50"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium text-foreground">Connect Live Data</span>
                              <p className="text-sm text-muted-foreground">Pull from customer appointments, product catalogs, inventory</p>
                            </div>
                            <div className={cn(
                              "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                              botConfig.apiIntegration ? "border-accent bg-accent" : "border-muted-foreground"
                            )}>
                              {botConfig.apiIntegration && <Check className="w-3 h-3 text-accent-foreground" />}
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Review & Test */}
                {setupStep === 3 && (
                  <div className="space-y-6 animate-fade-in">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground mb-2">Review & Test</h2>
                      <p className="text-muted-foreground">Review your configuration and test your AI assistant.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Configuration Summary */}
                      <div className="space-y-4">
                        <h3 className="font-semibold text-foreground">Configuration Summary</h3>
                        
                        <div className="space-y-3 p-4 bg-secondary/30 rounded-lg">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Bot Name</span>
                            <span className="font-medium text-foreground">{botConfig.name || 'Not set'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Personality</span>
                            <span className="font-medium text-foreground capitalize">{botConfig.tone}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Typing Speed</span>
                            <span className="font-medium text-foreground capitalize">{botConfig.typingSpeed}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Business</span>
                            <span className="font-medium text-foreground">{botConfig.businessName || 'Not set'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Industry</span>
                            <span className="font-medium text-foreground capitalize">{botConfig.industry || 'Not set'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Files Uploaded</span>
                            <span className="font-medium text-foreground">{botConfig.uploadedFiles.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Tags</span>
                            <span className="font-medium text-foreground">{botConfig.tags.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">API Integration</span>
                            <span className="font-medium text-foreground">{botConfig.apiIntegration ? 'Enabled' : 'Disabled'}</span>
                          </div>
                        </div>

                        {botConfig.behaviorRules.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-foreground mb-2">Behavior Rules</h4>
                            <div className="flex flex-wrap gap-2">
                              {botConfig.behaviorRules.map((rule, i) => (
                                <span key={i} className="text-xs bg-secondary px-2 py-1 rounded">{rule}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Test Chat */}
                      <div className="space-y-4">
                        <h3 className="font-semibold text-foreground">Test Your Bot</h3>
                        
                        <div className="border border-border rounded-lg overflow-hidden">
                          {/* Chat Messages */}
                          <div className="h-64 overflow-y-auto p-4 space-y-3 bg-secondary/20">
                            {messages.length === 0 && (
                              <div className="text-center text-muted-foreground py-8">
                                <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">Send a message to test your AI</p>
                              </div>
                            )}
                            {messages.map((msg, i) => (
                              <div
                                key={i}
                                className={cn(
                                  "max-w-[80%] p-3 rounded-lg",
                                  msg.role === 'user'
                                    ? "ml-auto bg-accent text-accent-foreground"
                                    : "bg-card border border-border"
                                )}
                              >
                                {msg.content}
                              </div>
                            ))}
                            {isLoading && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-sm">Typing...</span>
                              </div>
                            )}
                          </div>

                          {/* Input */}
                          <div className="border-t border-border p-3 flex gap-2">
                            <Input
                              value={input}
                              onChange={(e) => setInput(e.target.value)}
                              placeholder="Ask a test question..."
                              className="flex-1"
                              onKeyPress={(e) => e.key === 'Enter' && handleTestMessage()}
                            />
                            <Button onClick={handleTestMessage} disabled={isLoading || !input.trim()}>
                              Send
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8 pt-6 border-t border-border">
                  <Button variant="outline" onClick={goToPrevStep}>
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    {setupStep === 1 ? 'Back to Home' : 'Previous'}
                  </Button>
                  <Button variant="accent" onClick={goToNextStep}>
                    {setupStep === 3 ? 'Launch Playground' : 'Continue'}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
                </>
                )}
              </div>
            )}

            {/* MANAGE PLAYGROUNDS VIEW */}
            {currentView === 'manage' && (
              <div className="p-6">
                <div className="max-w-6xl mx-auto">
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <h1 className="text-3xl font-bold text-foreground">My Playgrounds</h1>
                      <Button 
                        onClick={() => setCurrentView('catalog')}
                        className="gap-2"
                        disabled={isGuest && playgrounds.length >= 1}
                        title={isGuest && playgrounds.length >= 1 ? "Guest users can only create 1 bot. Sign in to create more." : ""}
                      >
                        <span>+</span>
                        Create Bot
                      </Button>
                    </div>
                    <p className="text-muted-foreground">Manage and access your AI bots</p>
                    
                    {/* Guest or Free Trial Counter */}
                    {isGuest ? (
                      <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">Tour Mode</p>
                            <p className="text-xs text-muted-foreground">You can create 1 test bot. <button onClick={() => navigate('/auth')} className="text-accent hover:underline">Sign in</button> for unlimited access</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-amber-600">{playgrounds.length}/1</p>
                            <div className="w-24 h-2 bg-muted rounded-full mt-1">
                              <div 
                                className="h-full bg-amber-500 rounded-full transition-all"
                                style={{ width: `${(playgrounds.length / 1) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 p-3 rounded-lg bg-accent/10 border border-accent/20">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">Free Trial</p>
                            <p className="text-xs text-muted-foreground">Create up to 3 bots</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-accent">{playgrounds.length}/3</p>
                            <div className="w-24 h-2 bg-muted rounded-full mt-1">
                              <div 
                                className="h-full bg-accent rounded-full transition-all"
                                style={{ width: `${(playgrounds.length / 3) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {playgrounds.length === 0 ? (
                    <div className="rounded-2xl border border-border/60 bg-card/60 p-12 text-center">
                      <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                        <Bot className="w-8 h-8 text-accent" />
                      </div>
                      <h2 className="text-xl font-semibold text-foreground mb-2">No Playgrounds Yet</h2>
                      <p className="text-muted-foreground mb-4">Create your first AI bot to get started</p>
                      <Button onClick={() => setCurrentView('catalog')}>Create Bot</Button>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {playgrounds.map((pg) => (
                        <div
                          key={pg.id}
                          className="rounded-2xl border border-border/60 bg-card/60 p-4 hover:border-accent/40 transition-colors cursor-pointer"
                          onClick={() => openPlayground(pg)}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                              <Bot className="w-5 h-5 text-accent" />
                            </div>
                            <span className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent">
                              {pg.module_id || 'Draft'}
                            </span>
                          </div>
                          <h3 className="font-semibold text-foreground mb-1">{pg.name}</h3>
                          <p className="text-xs text-muted-foreground mb-3">
                            Updated {new Date(pg.updated_at).toLocaleDateString()}
                          </p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                openPlayground(pg);
                                setCurrentView('playground');
                              }}
                            >
                              Open
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => handleRenameClick(e, pg)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => handleDeleteClick(e, pg)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* RENAME DIALOG */}
            <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Rename Playground</DialogTitle>
                  <DialogDescription>
                    Enter a new name for your playground
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Playground name"
                    value={newPlaygroundName}
                    onChange={(e) => setNewPlaygroundName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleConfirmRename();
                      }
                    }}
                    autoFocus
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setRenameDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleConfirmRename}>
                      Rename
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* DELETE CONFIRMATION DIALOG */}
            <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Playground</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this playground? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setDeleteConfirmOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleConfirmDelete}
                  >
                    Delete
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            {currentView === 'playground' && (
              <>
                {/* Social Media Marketing Playground */}
                {selectedModule?.id === 'social-media-marketing' && botConfig.socialMedia ? (
                  <SocialMediaPlayground
                    config={botConfig.socialMedia}
                    businessName={botConfig.businessName}
                    industry={botConfig.industry}
                    onGenerateContent={async (prompt) => {
                      // This will be connected to the AI later
                      return prompt;
                    }}
                    isLoading={isLoading}
                  />
                ) : (
                  <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto px-6 py-8">
                  <div className="max-w-5xl mx-auto w-full space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <h2 className="text-2xl font-bold text-foreground truncate">
                          {botConfig.name || selectedModule?.name || "AI Playground"}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          Test your bot and publish when you’re ready.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant={botConfig.publishStatus === 'published' ? 'destructive' : 'accent'}
                          onClick={handlePublishToggle}
                        >
                          {botConfig.publishStatus === 'published' ? 'Unpublish' : 'Publish'}
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleEditInfo}>
                          Edit Info
                        </Button>
                      </div>
                    </div>

                    {showPublishTab && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant={playgroundTab === 'chat' ? "accent" : "outline"}
                          onClick={() => setPlaygroundTab('chat')}
                        >
                          Live Chat
                        </Button>
                        <Button
                          size="sm"
                          variant={playgroundTab === 'publish' ? "accent" : "outline"}
                          onClick={() => setPlaygroundTab('publish')}
                        >
                          Publish & Embed
                        </Button>
                      </div>
                    )}

                    {playgroundTab === 'publish' ? (
                      <div className="rounded-2xl border border-border/60 bg-card/60 p-6 space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">Your AI Bot is Live</h3>
                          <p className="text-sm text-muted-foreground">
                            Use the ID and API key below, then embed the widget on any site using the iFrame snippet.
                          </p>
                        </div>
                        {!savedBotId && (
                          <Button
                            variant="accent"
                            onClick={() => handlePublishBot({ showDialog: false })}
                            disabled={isSaving}
                          >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate Bot ID & API Key"}
                          </Button>
                        )}

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="rounded-xl border border-border/70 bg-card/80 backdrop-blur-sm shadow-md p-4">
                            <div className="text-xs text-muted-foreground mb-1">Bot ID</div>
                            <div className="flex items-center gap-2">
                              <code className="flex-1 bg-secondary/60 px-3 py-2 rounded text-sm break-all">
                                {publishBotId || "Publish to generate"}
                              </code>
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={!publishBotId}
                                onClick={() => publishBotId && copyEmbedCode(publishBotId, 'botid')}
                              >
                                {embedCopied === 'botid' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                              </Button>
                            </div>
                          </div>
                          <div className="rounded-xl border border-border/70 bg-card/80 backdrop-blur-sm shadow-md p-4">
                            <div className="text-xs text-muted-foreground mb-1">API Key</div>
                            <div className="flex items-center gap-2">
                              <code className="flex-1 bg-secondary/60 px-3 py-2 rounded text-sm break-all">
                                {savedApiKey || "Publish to generate"}
                              </code>
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={!savedApiKey}
                                onClick={() => savedApiKey && copyEmbedCode(savedApiKey, 'apikey')}
                              >
                                {embedCopied === 'apikey' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-xl border border-border/70 bg-card/80 backdrop-blur-sm shadow-md p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-foreground">iFrame Widget</h4>
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={!publishBotId}
                              onClick={() => publishBotId && copyEmbedCode(getIframeSnippetLeft(publishBotId), 'iframe-left')}
                            >
                              {embedCopied === 'iframe-left' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </Button>
                          </div>
                          <pre className="bg-secondary/50 rounded-lg p-3 text-xs overflow-x-auto max-h-48">
                            <code>{publishBotId ? getIframeSnippetLeft(publishBotId) : ''}</code>
                          </pre>
                        </div>
                      </div>
                    ) : null}

                    {/* Welcome message */}
                    {playgroundTab === 'chat' && messages.length === 0 && (
                      <div className="text-center py-16">
                        <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                          <Brain className="w-8 h-8 text-accent" />
                        </div>
                        <p className="text-muted-foreground max-w-md mx-auto">
                          Your AI assistant is ready! Start a conversation to test how it responds based on your configuration.
                        </p>
                        <div className="flex flex-wrap justify-center gap-2 mt-6">
                          {['What services do you offer?', 'Tell me about your business', 'How can I contact you?'].map((q) => (
                            <button
                              key={q}
                              onClick={() => {
                                setInput(q);
                                handleTestMessage();
                              }}
                              className="px-4 py-2 rounded-full bg-secondary text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Messages */}
                    {playgroundTab === 'chat' && messages.map((msg, i) => (
                      <div
                        key={i}
                        className={cn(
                          "flex",
                          msg.role === 'user' ? 'justify-end' : 'justify-start'
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[70%] p-4 rounded-2xl",
                            msg.role === 'user'
                              ? "bg-accent text-accent-foreground rounded-br-md"
                              : "bg-card border border-border rounded-bl-md"
                          )}
                        >
                          {msg.role === 'bot' && (
                            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/50">
                              <Bot className="w-4 h-4 text-accent" />
                              <span className="text-sm font-medium">{botConfig.name || 'AI Assistant'}</span>
                            </div>
                          )}
                          <p>{msg.content}</p>
                        </div>
                      </div>
                    ))}

                    {playgroundTab === 'chat' && isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-card border border-border rounded-2xl rounded-bl-md p-4">
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-accent" />
                            <span className="text-muted-foreground">Typing...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Input Area */}
                {playgroundTab === 'chat' && (
                  <div className="border-t border-border p-4 bg-card sticky bottom-0">
                    <div className="max-w-5xl mx-auto w-full">
                      {botConfig.apiIntegration && (
                        <Button variant="outline" className="mb-3 w-full" onClick={startBookingFlow}>
                          Start Booking
                        </Button>
                      )}
                      <div className="flex gap-3">
                        <Textarea
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          placeholder="Type your message..."
                          className="min-h-[50px] max-h-[150px] resize-none flex-1"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleTestMessage();
                            }
                          }}
                        />
                        <div className="flex flex-col gap-2">
                          <Button 
                            variant="accent" 
                            onClick={handleTestMessage}
                            disabled={isLoading || !input.trim()}
                            className="h-12"
                          >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send'}
                          </Button>
                          {messages.length > 0 && (
                            <Button variant="ghost" size="sm" onClick={handleCopy}>
                              {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
                )}
              </>
            )}

            {/* VIDEO GENERATOR VIEW */}
            {currentView === 'video-generator' && (
              <VideoGeneratorPage onBack={() => setCurrentView('home')} />
            )}

            {/* ANALYTICS VIEW */}
            {currentView === 'analytics' && (
              <AnalyticsDashboard />
            )}

            {/* LIVE CHAT VIEWER */}
            {currentView === 'live-chat' && (
              <LiveChatViewer />
            )}

            {/* BOT SETTINGS STUDIO */}
            {currentView === 'bot-settings' && (
              <BotStudio
                playgrounds={playgrounds}
                currentPlaygroundId={currentPlaygroundId}
                onSelectPlayground={(id) => setCurrentPlaygroundId(id)}
                botConfig={botConfig}
                onUpdateBotConfig={(updates) => setBotConfig((prev) => ({ ...prev, ...updates }))}
                publishBotId={publishBotId}
              />
            )}
 
            {/* SOCIAL MEDIA ANALYZER VIEW */}
            {currentView === 'setup' && selectedModule?.id === 'social-media-analyzer' && (
              <SocialMediaAnalyzer />
            )}
        </div>
      </div>
    </Layout>
  );
}


