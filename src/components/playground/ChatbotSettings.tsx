import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Bot,
  Image,
  MessageSquare,
  Timer,
  Sparkles,
  Palette,
  Type,
  Upload,
  Save,
  Eye,
  X,
  CheckCircle2,
  Calendar,
  Volume2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

interface ChatbotSettingsProps {
  botConfig: {
    name: string;
    tone: string;
    typingSpeed: string;
  };
  onUpdate: (updates: Partial<ChatbotCustomization>) => void;
}

export interface ChatbotCustomization {
  name: string;
  logo: string | null;
  tone: string;
  typingSpeed: number;
  accuracy: "balanced" | "precise" | "creative";
  style: "minimal" | "modern" | "classic" | "playful";
  welcomeMessage: string;
  publishText: string;
  primaryColor: string;
  fontFamily: string;
  bookingEnabled?: boolean;
  bookingButtonText?: string;
  elevenlabsApiKey?: string;
}

const toneOptions = [
  { value: "friendly", label: "Friendly", emoji: "😊" },
  { value: "professional", label: "Professional", emoji: "💼" },
  { value: "formal", label: "Formal", emoji: "🎩" },
  { value: "casual", label: "Casual", emoji: "😎" },
  { value: "humorous", label: "Humorous", emoji: "😄" },
  { value: "empathetic", label: "Empathetic", emoji: "💚" },
];

// Helper function to convert hex color to rgba
const hexToRgba = (hex: string, alpha: number = 0.15): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Helper function to lighten a hex color
const lightenColor = (hex: string, percent: number = 20): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lighter_r = Math.round(r + (255 - r) * percent / 100);
  const lighter_g = Math.round(g + (255 - g) * percent / 100);
  const lighter_b = Math.round(b + (255 - b) * percent / 100);
  return `#${lighter_r.toString(16).padStart(2, '0')}${lighter_g.toString(16).padStart(2, '0')}${lighter_b.toString(16).padStart(2, '0')}`;
};

const styleOptions = [
  { value: "minimal", label: "Minimal", description: "Clean and simple" },
  { value: "modern", label: "Modern", description: "Sleek with gradients" },
  { value: "classic", label: "Classic", description: "Traditional look" },
  { value: "playful", label: "Playful", description: "Fun with animations" },
];

const accuracyOptions = [
  { value: "balanced", label: "Balanced", description: "Mix of creativity and accuracy" },
  { value: "precise", label: "Precise", description: "Stick to facts strictly" },
  { value: "creative", label: "Creative", description: "More flexible responses" },
];

const colorPresets = [
  "#0EA5E9", // Sky blue
  "#8B5CF6", // Purple
  "#10B981", // Green
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#6366F1", // Indigo
];

interface BotOption {
  bot_id: string;
  name: string;
  tone: string;
  greeting_message: string;
  primary_color: string;
}

export default function ChatbotSettings({ botConfig, onUpdate }: ChatbotSettingsProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const [bots, setBots] = useState<BotOption[]>([]);
  const [selectedBotId, setSelectedBotId] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  const [settings, setSettings] = useState<ChatbotCustomization>(() => {
    // Try to load saved settings from localStorage
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`bot-settings-${botConfig.name}`);
        if (saved) {
          return JSON.parse(saved);
        }
      } catch (e) {
        console.error("Error loading saved settings:", e);
      }
    }
    // Default settings if nothing saved
    return {
      name: botConfig.name || "AI Assistant",
      logo: null,
      tone: botConfig.tone || "professional",
      typingSpeed: botConfig.typingSpeed === "instant" ? 0 : botConfig.typingSpeed === "fast" ? 1 : botConfig.typingSpeed === "slow" ? 3 : 2,
      accuracy: "balanced",
      style: "modern",
      welcomeMessage: `Hi! I'm ${botConfig.name || "your AI assistant"}. How can I help you today?`,
      publishText: "Chat with our AI assistant",
      primaryColor: "#0EA5E9",
      fontFamily: "Inter",
      bookingEnabled: false,
      bookingButtonText: "Schedule an appointment",
      elevenlabsApiKey: "",
    };
  });

  const [previewMode, setPreviewMode] = useState(false);

  // Fetch user's bots
  useEffect(() => {
    const fetchBots = async () => {
      const { data, error } = await supabase
        .from("bots")
        .select("bot_id, name, tone, greeting_message, primary_color")
        .eq("is_active", true);

      if (!error && data) {
        setBots(data);
      }
    };

    fetchBots();
  }, []);

  // Load bot settings when selected
  useEffect(() => {
    if (selectedBotId) {
      const bot = bots.find(b => b.bot_id === selectedBotId);
      if (bot) {
        setSettings(prev => ({
          ...prev,
          name: bot.name,
          tone: bot.tone || "professional",
          welcomeMessage: bot.greeting_message || prev.welcomeMessage,
          primaryColor: bot.primary_color || "#0EA5E9",
        }));
      }
    }
  }, [selectedBotId, bots]);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`bot-settings-${botConfig.name}`, JSON.stringify(settings));
      } catch (e) {
        console.error("Error saving to localStorage:", e);
      }
    }
  }, [settings, botConfig.name]);

  // Auto-save settings to database with debouncing (every 2 seconds of inactivity)
  useEffect(() => {
    if (!selectedBotId) return;

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    setIsSaving(true);

    // Set new timeout for auto-save
    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from("bots")
          .update({
            name: settings.name,
            tone: settings.tone,
            greeting_message: settings.welcomeMessage,
            primary_color: settings.primaryColor,
            booking_enabled: settings.bookingEnabled ?? false,
            booking_button_text: settings.bookingButtonText || "Schedule an appointment",
          })
          .eq("bot_id", selectedBotId);

        if (error) {
          throw error;
        }

        setLastSaved(new Date());
        setIsSaving(false);
      } catch (error) {
        console.error("Auto-save error:", error);
        setIsSaving(false);
      }
    }, 2000);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [settings, selectedBotId]);

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && selectedBotId) {
      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          if (e.target?.result) {
            const logoDataUrl = e.target!.result as string;
            setSettings((prev) => ({ ...prev, logo: logoDataUrl }));
            
            // Save logo URL to database
            try {
              const { error } = await supabase
                .from("bots")
                .update({
                  avatar_url: logoDataUrl,
                })
                .eq("bot_id", selectedBotId);

              if (error) {
                throw error;
              }

              toast({
                title: "Logo updated",
                description: "Your bot logo has been saved.",
              });
            } catch (error) {
              console.error("Error saving logo:", error);
              toast({
                title: "Error saving logo",
                description: error instanceof Error ? error.message : "Failed to save logo",
                variant: "destructive",
              });
            }
          }
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error("Error uploading logo:", error);
      }
    }
  };

  const handleSave = async () => {
    if (!selectedBotId) {
      toast({
        title: "Error",
        description: "Please select a chatbot first",
        variant: "destructive",
      });
      return;
    }

    try {
      // Update the bot settings in the database
      const { error } = await supabase
        .from("bots")
        .update({
          name: settings.name,
          tone: settings.tone,
          greeting_message: settings.welcomeMessage,
          primary_color: settings.primaryColor,
          booking_enabled: settings.bookingEnabled ?? false,
          booking_button_text: settings.bookingButtonText || "Schedule an appointment",
          elevenlabs_api_key: settings.elevenlabsApiKey || null,
        })
        .eq("bot_id", selectedBotId);

      if (error) {
        throw error;
      }

      // Also call the onUpdate callback if provided
      onUpdate(settings);

      toast({
        title: "Settings saved",
        description: "Your chatbot customization has been updated in real-time.",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error saving settings",
        description: error instanceof Error ? error.message : "Failed to save settings",
        variant: "destructive",
      });
    }
  };

  if (!selectedBotId) {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-foreground mb-2">Chatbot Settings</h2>
          <p className="text-muted-foreground text-sm">Select a chatbot to customize its settings.</p>
        </div>
        <div className="p-6 bg-secondary/30 rounded-lg border border-border max-w-md">
          <label className="text-sm font-medium text-foreground mb-2 block">Select a Chatbot</label>
          <Select value={selectedBotId} onValueChange={setSelectedBotId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a chatbot to edit..." />
            </SelectTrigger>
            <SelectContent>
              {bots.map((bot) => (
                <SelectItem key={bot.bot_id} value={bot.bot_id}>
                  {bot.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {bots.length === 0 && (
            <p className="text-sm text-muted-foreground mt-3">
              No chatbots found. Create one first from the Playground.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex-1 flex gap-4 p-6 overflow-hidden">
        {/* Left Panel - Settings */}
        <div className="flex-1 overflow-auto space-y-6 pr-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">Chatbot Customization</h2>
              <p className="text-muted-foreground text-sm">
                Customize how your chatbot looks and behaves when published.
              </p>
            </div>
            <Select value={selectedBotId} onValueChange={setSelectedBotId}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {bots.map((bot) => (
                  <SelectItem key={bot.bot_id} value={bot.bot_id}>
                    {bot.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="p-4 bg-secondary/30 rounded-lg border border-border space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Bot className="w-5 h-5 text-accent" />
              Bot Identity
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Bot Name</label>
                <Input
                  value={settings.name}
                  onChange={(e) => setSettings((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Aria, Max, Helper"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Logo / Avatar</label>
                <div className="flex items-center gap-3">
                  {settings.logo ? (
                    <div className="relative">
                      <img
                        src={settings.logo}
                        alt="Bot logo"
                        className="w-12 h-12 rounded-full object-cover border-2 border-border"
                      />
                      <button
                        onClick={() => setSettings((prev) => ({ ...prev, logo: null }))}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center border-2 border-dashed border-border">
                      <Image className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    Upload
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Behavior */}
          <div className="p-4 bg-secondary/30 rounded-lg border border-border space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-accent" />
              Behavior
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Tone / Personality</label>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {toneOptions.map((tone) => (
                    <button
                      key={tone.value}
                      onClick={() => setSettings((prev) => ({ ...prev, tone: tone.value }))}
                      className={cn(
                        "p-3 rounded-lg border text-center transition-all",
                        settings.tone === tone.value
                          ? "border-accent bg-accent/10"
                          : "border-border hover:border-accent/50"
                      )}
                    >
                      <span className="text-xl block mb-1">{tone.emoji}</span>
                      <span className="text-xs font-medium text-foreground">{tone.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Timer className="w-4 h-4 text-accent" />
                  Typing Speed (seconds delay)
                </label>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground w-16">Instant</span>
                  <Slider
                    value={[settings.typingSpeed]}
                    onValueChange={([val]) => setSettings((prev) => ({ ...prev, typingSpeed: val }))}
                    min={0}
                    max={5}
                    step={0.5}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground w-16 text-right">Slow</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Current: {settings.typingSpeed === 0 ? "Instant" : `${settings.typingSpeed}s delay`}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent" />
                  Accuracy / Creativity
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {accuracyOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSettings((prev) => ({ ...prev, accuracy: option.value as any }))}
                      className={cn(
                        "p-3 rounded-lg border text-left transition-all",
                        settings.accuracy === option.value
                          ? "border-accent bg-accent/10"
                          : "border-border hover:border-accent/50"
                      )}
                    >
                      <span className="block font-medium text-foreground text-sm">{option.label}</span>
                      <span className="text-xs text-muted-foreground">{option.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Appearance */}
          <div className="p-4 bg-secondary/30 rounded-lg border border-border space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Palette className="w-5 h-5 text-accent" />
              Appearance
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Widget Style</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {styleOptions.map((style) => (
                    <button
                      key={style.value}
                      onClick={() => setSettings((prev) => ({ ...prev, style: style.value as any }))}
                      className={cn(
                        "p-3 rounded-lg border text-left transition-all",
                        settings.style === style.value
                          ? "border-accent bg-accent/10"
                          : "border-border hover:border-accent/50"
                      )}
                    >
                      <span className="block font-medium text-foreground text-sm">{style.label}</span>
                      <span className="text-xs text-muted-foreground">{style.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Primary Color</label>
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    {colorPresets.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSettings((prev) => ({ ...prev, primaryColor: color }))}
                        className={cn(
                          "w-8 h-8 rounded-full transition-all",
                          settings.primaryColor === color && "ring-2 ring-offset-2 ring-foreground"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <Input
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) => setSettings((prev) => ({ ...prev, primaryColor: e.target.value }))}
                    className="w-10 h-10 p-1 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="p-4 bg-secondary/30 rounded-lg border border-border space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Type className="w-5 h-5 text-accent" />
              Messages
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Welcome Message</label>
                <Textarea
                  value={settings.welcomeMessage}
                  onChange={(e) => setSettings((prev) => ({ ...prev, welcomeMessage: e.target.value }))}
                  placeholder="The first message users see when they open the chat..."
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Widget Button Text</label>
                <Input
                  value={settings.publishText}
                  onChange={(e) => setSettings((prev) => ({ ...prev, publishText: e.target.value }))}
                  placeholder="Text shown on the chat button"
                />
                <p className="text-xs text-muted-foreground">
                  This text appears on the chat button when the widget is minimized
                </p>
              </div>
            </div>
          </div>

          {/* Voice & Audio Settings */}
          <div className="p-4 bg-secondary/30 rounded-lg border border-border space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-accent" />
              Voice & Audio
            </h3>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">ElevenLabs API Key</label>
              <div className="relative">
                <Input
                  type="password"
                  value={settings.elevenlabsApiKey || ""}
                  onChange={(e) => setSettings((prev) => ({ ...prev, elevenlabsApiKey: e.target.value }))}
                  placeholder="sk_..."
                  className="pr-10"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs font-medium">
                  {settings.elevenlabsApiKey ? "✓" : "○"}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Get your API key from <a href="https://elevenlabs.io" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">elevenlabs.io</a>. Required for natural voice synthesis in voice calls.
              </p>
            </div>

            <div className="p-3 bg-accent/10 rounded border border-accent/20 text-sm text-foreground">
              <p className="font-medium mb-1">Voice Features:</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Enable voice calling in your chat widget</li>
                <li>AI responds with natural-sounding voices</li>
                <li>Supports 100+ languages and accents</li>
                <li>Automatic fallback if API key is not set</li>
              </ul>
            </div>
          </div>

          {/* Booking Settings */}
          <div className="p-4 bg-secondary/30 rounded-lg border border-border space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Calendar className="w-5 h-5 text-accent" />
              Appointment Booking
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-secondary/40 rounded border border-border">
                <div className="flex-1">
                  <label className="text-sm font-medium text-foreground block">Enable Bookings</label>
                  <p className="text-xs text-muted-foreground">Allow users to schedule appointments through your bot</p>
                </div>
                <Switch
                  checked={settings.bookingEnabled ?? false}
                  onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, bookingEnabled: checked }))}
                />
              </div>

              {settings.bookingEnabled && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Booking Button Text</label>
                  <Input
                    value={settings.bookingButtonText || "Schedule an appointment"}
                    onChange={(e) => setSettings((prev) => ({ ...prev, bookingButtonText: e.target.value }))}
                    placeholder="e.g., Schedule an appointment, Book a meeting"
                  />
                  <p className="text-xs text-muted-foreground">
                    This button will appear in the chat and link to your booking page
                  </p>
                </div>
              )}

              <div className="p-3 bg-accent/10 rounded border border-accent/20 text-sm text-foreground">
                <p className="font-medium mb-1">How it works:</p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>When enabled, users see a booking button in the chat</li>
                  <li>Clicking it takes them to your booking form</li>
                  <li>They can select a service, date, and time</li>
                  <li>Appointments appear in your Appointments dashboard</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pb-6">
            <Button 
              onClick={handleSave} 
              className="flex-1"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Saving...
                </>
              ) : lastSaved ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                  Saved
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setPreviewMode(!previewMode)}
            >
              <Eye className="w-4 h-4 mr-2" />
              {previewMode ? "Hide Preview" : "Preview"}
            </Button>
          </div>
        </div>

        {/* Right Panel - Preview */}
        {previewMode && (
          <div className="w-[520px] shrink-0 pb-6 flex flex-col">
            <div className="sticky top-0 z-10 bg-gradient-to-b from-background via-background to-transparent pb-4">
              <h4 className="text-sm font-semibold text-foreground">
                Live Widget Preview
                <span className="text-xs text-accent ml-2">({settings.style === "modern" ? "Floating Bubble" : "Embedded Window"})</span>
              </h4>
              <p className="text-xs text-muted-foreground mt-1">See how your bot appears to visitors</p>
            </div>
            
            <div className="flex-1 overflow-auto">
              {settings.style === "modern" ? (
                // MODERN STYLE - Floating Bubble Widget
                <div className="relative bg-gradient-to-br from-secondary/50 to-secondary/20 rounded-xl p-8 min-h-[550px] flex items-end justify-end overflow-hidden border border-border/60">
                  {/* Simulated page content background */}
                  <div className="absolute inset-0 opacity-20">
                    <div className="grid grid-cols-2 gap-3 p-6">
                      <div className="bg-muted rounded-lg h-16"></div>
                      <div className="bg-muted rounded-lg h-16"></div>
                      <div className="bg-muted rounded-lg h-10"></div>
                      <div className="bg-muted rounded-lg h-10"></div>
                    </div>
                  </div>

                  {/* Floating Chat Widget */}
                  <div className="relative z-10 space-y-4">
                    {/* Chat Window (shown when open) */}
                    <div 
                      className="rounded-2xl overflow-hidden shadow-2xl bg-background"
                      style={{ 
                        width: "380px",
                        height: "480px",
                        display: "flex",
                        flexDirection: "column",
                        border: `2px solid ${settings.primaryColor}30`,
                      }}
                    >
                      {/* Header */}
                      <div
                        className="p-4 text-white flex items-center gap-3 shrink-0"
                        style={{ backgroundColor: settings.primaryColor }}
                      >
                        {settings.logo ? (
                          <img
                            src={settings.logo}
                            alt="Bot"
                            className="w-10 h-10 rounded-full object-cover border-2 border-white/30"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                            <Bot className="w-5 h-5" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h5 className="font-semibold text-sm">{settings.name}</h5>
                          <p className="text-xs opacity-80">Online</p>
                        </div>
                        <div className="text-xl leading-none cursor-pointer hover:opacity-75">×</div>
                      </div>

                      {/* Messages Area */}
                      <div className="flex-1 overflow-auto p-3 bg-background space-y-3">
                        {/* Welcome message from bot */}
                        <div className="flex gap-2">
                          {settings.logo ? (
                            <img
                              src={settings.logo}
                              alt="Bot"
                              className="w-6 h-6 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-white text-xs"
                              style={{ backgroundColor: settings.primaryColor }}
                            >
                              <Bot className="w-3 h-3" />
                            </div>
                          )}
                          <div
                            className="px-3 py-2 rounded-lg text-sm max-w-[70%] text-gray-900"
                            style={{ backgroundColor: lightenColor(settings.primaryColor, 15) }}
                          >
                            {settings.welcomeMessage}
                          </div>
                        </div>

                        {/* User message */}
                        <div className="flex justify-end">
                          <div
                            className="px-3 py-2 rounded-lg text-sm text-white max-w-[70%]"
                            style={{ backgroundColor: settings.primaryColor }}
                          >
                            How can I use this?
                          </div>
                        </div>

                        {/* Bot response */}
                        <div className="flex gap-2">
                          {settings.logo ? (
                            <img
                              src={settings.logo}
                              alt="Bot"
                              className="w-6 h-6 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-white text-xs"
                              style={{ backgroundColor: settings.primaryColor }}
                            >
                              <Bot className="w-3 h-3" />
                            </div>
                          )}
                          <div
                            className="px-3 py-2 rounded-lg text-sm max-w-[70%] text-gray-900"
                            style={{ backgroundColor: lightenColor(settings.primaryColor, 15) }}
                          >
                            I'm here to assist! Just ask me anything.
                          </div>
                        </div>
                      </div>

                      {/* Input Area */}
                      <div className="p-3 border-t border-border bg-background shrink-0">
                        <div className="flex gap-2">
                          <input 
                            placeholder="Type a message..." 
                            className="flex-1 text-sm px-3 py-2 rounded-full border border-border focus:outline-none"
                            disabled 
                          />
                          <button 
                            className="p-2 rounded-full text-white text-sm"
                            style={{ backgroundColor: settings.primaryColor }}
                            disabled
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Floating Bubble Button */}
                    <div className="flex justify-end pr-4">
                      <button
                        className="w-16 h-16 rounded-full text-white font-semibold text-sm shadow-2xl flex items-center justify-center transition-all hover:scale-110 border-2 border-white/30 hover:shadow-xl"
                        style={{ backgroundColor: settings.primaryColor }}
                      >
                        <MessageSquare className="w-7 h-7" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // CLASSIC STYLE - Embedded Window Widget
                <div className="relative bg-gradient-to-br from-secondary/50 to-secondary/20 rounded-xl p-4 min-h-[550px] flex items-center justify-center border border-border/60">
                  <div 
                    className="rounded-xl overflow-hidden shadow-2xl bg-background"
                    style={{ 
                      width: "100%",
                      height: "480px",
                      display: "flex",
                      flexDirection: "column",
                      border: `3px solid ${settings.primaryColor}`,
                    }}
                  >
                    {/* Header */}
                    <div
                      className="p-4 text-white flex items-center gap-3 shrink-0"
                      style={{ backgroundColor: settings.primaryColor }}
                    >
                      {settings.logo ? (
                        <img
                          src={settings.logo}
                          alt="Bot"
                          className="w-10 h-10 rounded-full object-cover border-2 border-white/30"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                          <Bot className="w-5 h-5" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h5 className="font-semibold text-sm">{settings.name}</h5>
                        <p className="text-xs opacity-80">Online</p>
                      </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-auto p-4 bg-background space-y-3">
                      {/* Welcome message from bot */}
                      <div className="flex gap-2">
                        {settings.logo ? (
                          <img
                            src={settings.logo}
                            alt="Bot"
                            className="w-8 h-8 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white"
                            style={{ backgroundColor: settings.primaryColor }}
                          >
                            <Bot className="w-4 h-4" />
                          </div>
                        )}
                        <div
                          className="px-4 py-2 rounded-2xl rounded-bl-sm text-sm max-w-[75%] text-gray-900"
                          style={{ backgroundColor: lightenColor(settings.primaryColor, 20) }}
                        >
                          {settings.welcomeMessage}
                        </div>
                      </div>

                      {/* User message */}
                      <div className="flex justify-end">
                        <div
                          className="px-4 py-2 rounded-2xl rounded-br-sm text-sm text-white max-w-[75%]"
                          style={{ backgroundColor: settings.primaryColor }}
                        >
                          Hello! How can you help?
                        </div>
                      </div>

                      {/* Bot response */}
                      <div className="flex gap-2">
                        {settings.logo ? (
                          <img
                            src={settings.logo}
                            alt="Bot"
                            className="w-8 h-8 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white"
                            style={{ backgroundColor: settings.primaryColor }}
                          >
                            <Bot className="w-4 h-4" />
                          </div>
                        )}
                        <div
                          className="px-4 py-2 rounded-2xl rounded-bl-sm text-sm max-w-[75%] text-gray-900"
                          style={{ backgroundColor: lightenColor(settings.primaryColor, 20) }}
                        >
                          I'm here to help! Feel free to ask me anything.
                        </div>
                      </div>
                    </div>

                    {/* Input Area */}
                    <div className="p-3 border-t border-border bg-background shrink-0">
                      <div className="flex gap-2">
                        <input 
                          placeholder="Type a message..." 
                          className="flex-1 text-sm px-3 py-2 rounded-full border border-border focus:outline-none"
                          disabled 
                        />
                        <button 
                          className="px-4 py-2 rounded-full text-white text-sm font-medium"
                          style={{ backgroundColor: settings.primaryColor }}
                          disabled
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Color Info */}
              <div className="mt-4 p-3 bg-secondary/50 rounded border border-border text-xs text-muted-foreground">
                <p><strong>Primary Color:</strong> {settings.primaryColor}</p>
                <p><strong>Light Variant:</strong> {lightenColor(settings.primaryColor, 15)}</p>
                <p className="mt-1 text-xs">Widget Style: <span className="font-semibold">{settings.style === "modern" ? "Floating Bubble (Modern)" : "Embedded Window (Classic)"}</span></p>
              </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
