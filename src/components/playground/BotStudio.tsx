import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  Bot,
  Palette,
  Image as ImageIcon,
  Wand2,
  Layers,
  Settings,
  Save,
  X,
  Undo2,
  Redo2,
} from "lucide-react";

interface BotStudioProps {
  playgrounds: { id: string; name: string; module_id?: string | null }[];
  currentPlaygroundId: string | null;
  onSelectPlayground: (id: string) => void;
  botConfig: {
    name: string;
    welcomeMessage: string;
    shortDescription: string;
    themeColor: string;
    avatarUrl?: string;
    tone: string;
    typingSpeed: string;
    responseLength: "short" | "medium" | "long";
    aiModelProvider?: string;
    widgetStyle?: "classic" | "modern" | "minimal" | "gpt";
    iconStyle?: "modern" | "basic" | "outline";
    backgroundStyle?: "clean" | "gradient" | "grid" | "glass";
    suggestedQuestions?: string[];
    apiIntegration?: boolean;
    bookingButtonText?: string;
  };
  onUpdateBotConfig: (updates: Partial<BotStudioProps["botConfig"]>) => void;
  publishBotId: string | null;
}

const modelOptions = [
  { value: "gemini", label: "Gemini", status: "active" },
  { value: "chatgpt", label: "ChatGPT", status: "active" },
  { value: "grok", label: "Grok", status: "active" },
  { value: "deepseek", label: "DeepSeek", status: "active" },
  { value: "claude", label: "Claude", status: "soon" },
  { value: "llama", label: "Llama", status: "soon" },
];

const widgetStyles = [
  { value: "classic", label: "Classic", description: "Polished, professional layout" },
  { value: "modern", label: "Modern", description: "Bold header and floating feel" },
  { value: "minimal", label: "Minimal", description: "Clean, low-contrast bubbles" },
  { value: "gpt", label: "GPT", description: "ChatGPT-inspired spacing" },
];

const iconStyles = [
  { value: "modern", label: "Modern" },
  { value: "basic", label: "Basic" },
  { value: "outline", label: "Outline" },
];

const backgroundStyles = [
  { value: "clean", label: "Clean" },
  { value: "gradient", label: "Gradient" },
  { value: "grid", label: "Grid" },
  { value: "glass", label: "Glass" },
];

const toneOptions = [
  { value: "friendly", label: "Friendly" },
  { value: "professional", label: "Professional" },
  { value: "formal", label: "Formal" },
  { value: "casual", label: "Casual" },
  { value: "humorous", label: "Humorous" },
];

export function BotStudio({
  playgrounds,
  currentPlaygroundId,
  onSelectPlayground,
  botConfig,
  onUpdateBotConfig,
  publishBotId,
}: BotStudioProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [leftWidth, setLeftWidth] = useState(300);
  const [rightWidth, setRightWidth] = useState(320);
  const draggingRef = useRef<"left" | "right" | null>(null);
  const dragStartRef = useRef({ x: 0, width: 0 });
  const lastSavedRef = useRef<string>(JSON.stringify(botConfig));
  const historyRef = useRef<string[]>([JSON.stringify(botConfig)]);
  const historyIndexRef = useRef(0);

  const isDirty = useMemo(() => {
    return JSON.stringify(botConfig) !== lastSavedRef.current;
  }, [botConfig]);

  const suggestions = botConfig.suggestedQuestions ?? ["", "", ""];
  const previewBackground = useMemo(() => {
    switch (botConfig.backgroundStyle) {
      case "gradient":
        return "bg-gradient-to-br from-white via-slate-50 to-white text-slate-900";
      case "grid":
        return "bg-[radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.2)_1px,transparent_1px)] [background-size:22px_22px] bg-white text-slate-900";
      case "glass":
        return "bg-white/90 backdrop-blur-2xl text-slate-900";
      case "clean":
      default:
        return "bg-white text-slate-900";
    }
  }, [botConfig.backgroundStyle]);

  const previewShellClass = useMemo(() => {
    switch (botConfig.widgetStyle) {
      case "minimal":
        return "bg-white text-slate-900 border border-slate-200";
      case "gpt":
        return "bg-white text-slate-900 border border-slate-200";
      case "modern":
        return "bg-white text-slate-900 border border-slate-200 shadow-[0_24px_80px_rgba(15,23,42,0.12)]";
      case "classic":
      default:
        return "bg-white text-slate-900 border border-slate-200";
    }
  }, [botConfig.widgetStyle]);

  const previewBubble = (role: "bot" | "user") =>
    cn(
      "px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm",
      role === "user"
        ? "text-white ml-auto"
        : "text-slate-900 bg-white/90"
    );

  const avatarClass = useMemo(() => {
    switch (botConfig.iconStyle) {
      case "basic":
        return "rounded-full bg-slate-100 text-slate-900";
      case "outline":
        return "rounded-full border border-slate-300 text-slate-900 bg-white";
      case "modern":
      default:
        return "rounded-2xl bg-slate-100 text-slate-900 shadow-[0_0_20px_rgba(15,23,42,0.12)]";
    }
  }, [botConfig.iconStyle]);

  const pushHistory = (nextConfig: BotStudioProps["botConfig"]) => {
    const snapshot = JSON.stringify(nextConfig);
    const history = historyRef.current.slice(0, historyIndexRef.current + 1);
    history.push(snapshot);
    historyRef.current = history;
    historyIndexRef.current = history.length - 1;
  };

  const applyUpdate = (updates: Partial<BotStudioProps["botConfig"]>) => {
    const next = { ...botConfig, ...updates };
    onUpdateBotConfig(updates);
    pushHistory(next);
  };

  const handleUndo = () => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current -= 1;
    const snapshot = historyRef.current[historyIndexRef.current];
    onUpdateBotConfig(JSON.parse(snapshot));
  };

  const handleRedo = () => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current += 1;
    const snapshot = historyRef.current[historyIndexRef.current];
    onUpdateBotConfig(JSON.parse(snapshot));
  };

  const startDrag = (side: "left" | "right") => (event: React.MouseEvent) => {
    draggingRef.current = side;
    dragStartRef.current = { x: event.clientX, width: side === "left" ? leftWidth : rightWidth };
    window.addEventListener("mousemove", handleDrag);
    window.addEventListener("mouseup", stopDrag);
  };

  const handleDrag = (event: MouseEvent) => {
    if (!draggingRef.current) return;
    const delta = event.clientX - dragStartRef.current.x;
    if (draggingRef.current === "left") {
      const next = Math.min(420, Math.max(240, dragStartRef.current.width + delta));
      setLeftWidth(next);
    } else {
      const next = Math.min(420, Math.max(260, dragStartRef.current.width - delta));
      setRightWidth(next);
    }
  };

  const stopDrag = () => {
    draggingRef.current = null;
    window.removeEventListener("mousemove", handleDrag);
    window.removeEventListener("mouseup", stopDrag);
  };

  const handleClose = async () => {
    if (isDirty) {
      const shouldSave = window.confirm("You have unsaved changes. Save before leaving?");
      if (shouldSave) {
        await handleSyncLive();
      }
    }
    navigate("/playground");
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      applyUpdate({ avatarUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleSuggestionChange = (index: number, value: string) => {
    const updated = [...suggestions];
    updated[index] = value;
    applyUpdate({ suggestedQuestions: updated });
  };

  const handleSyncLive = async () => {
    if (!publishBotId) {
      toast({
        title: "Publish your bot",
        description: "Publish the bot first to sync live widget settings.",
      });
      return;
    }

    setIsSyncing(true);
    try {
      const { error } = await supabase
        .from("bots")
        .update({
          name: botConfig.name,
          greeting_message: botConfig.welcomeMessage,
          primary_color: botConfig.themeColor,
          avatar_url: botConfig.avatarUrl || null,
          booking_enabled: botConfig.apiIntegration ?? false,
          booking_button_text: botConfig.bookingButtonText || "Schedule an appointment",
          ai_model: botConfig.aiModelProvider || "gemini",
          widget_style: botConfig.widgetStyle || "classic",
          icon_style: botConfig.iconStyle || "modern",
          background_style: botConfig.backgroundStyle || "clean",
          suggested_questions: botConfig.suggestedQuestions || [],
        })
        .eq("bot_id", publishBotId);

      if (error) throw error;
      toast({
        title: "Synced",
        description: "Live widget settings updated.",
      });
      lastSavedRef.current = JSON.stringify(botConfig);
    } catch (err) {
      console.error(err);
      toast({
        title: "Sync failed",
        description: "Unable to update the live widget. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex-1 h-[calc(100vh-4rem)] overflow-hidden bg-white text-slate-900 flex flex-col">
      <div className="px-6 pt-6 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <div className="text-sm font-semibold text-slate-700">Bot Studio</div>
          <div className="flex items-center gap-3">
            <div className="min-w-[220px]">
              <Select value={currentPlaygroundId || ""} onValueChange={onSelectPlayground}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a bot to edit" />
                </SelectTrigger>
                <SelectContent>
                  {playgrounds.map((pg) => (
                    <SelectItem key={pg.id} value={pg.id}>
                      {pg.name} {pg.module_id ? "" : "(draft)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={handleUndo} disabled={historyIndexRef.current <= 0}>
              <Undo2 className="w-4 h-4 mr-2" />
              Undo
            </Button>
            <Button variant="outline" onClick={handleRedo} disabled={historyIndexRef.current >= historyRef.current.length - 1}>
              <Redo2 className="w-4 h-4 mr-2" />
              Redo
            </Button>
            <Button variant="accent" onClick={handleSyncLive} disabled={isSyncing}>
              <Save className="w-4 h-4 mr-2" />
              {isSyncing ? "Syncing..." : "Sync Live"}
            </Button>
            <Button variant="ghost" onClick={handleClose} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
          </div>
        </div>
      </div>

      {!currentPlaygroundId ? (
        <div className="px-6 py-10 text-center text-muted-foreground flex-1 min-h-0 overflow-hidden">
          Choose a bot from your playgrounds to open the customization studio.
        </div>
      ) : (
        <div className="px-6 py-8 flex-1 min-h-0 overflow-hidden flex flex-col gap-6 lg:flex-row lg:items-stretch">
          {/* Left sidebar */}
          <div
            className="space-y-5 lg:shrink-0 min-h-0 overflow-y-auto pr-1"
            style={{ width: leftWidth }}
          >
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                <Bot className="w-4 h-4 text-accent" /> Identity
              </div>
              <div className="space-y-3">
                <Input
                  value={botConfig.name}
                  onChange={(e) => applyUpdate({ name: e.target.value })}
                  placeholder="Bot name"
                />
                <Textarea
                  value={botConfig.shortDescription}
                  onChange={(e) => applyUpdate({ shortDescription: e.target.value })}
                  placeholder="Short description"
                  className="min-h-[90px]"
                />
                <label className="text-xs text-muted-foreground">Logo upload</label>
                <Input type="file" accept="image/*" onChange={handleLogoUpload} />
                <div className="grid grid-cols-3 gap-2">
                  {iconStyles.map((style) => (
                    <Button
                      key={style.value}
                      size="sm"
                      variant={botConfig.iconStyle === style.value ? "accent" : "outline"}
                      onClick={() => applyUpdate({ iconStyle: style.value as BotStudioProps["botConfig"]["iconStyle"] })}
                    >
                      {style.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                <Palette className="w-4 h-4 text-accent" /> Style
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-xs text-muted-foreground">Primary color</label>
                  <Input
                    type="color"
                    value={botConfig.themeColor}
                    onChange={(e) => applyUpdate({ themeColor: e.target.value })}
                    className="w-12 h-10 p-0"
                  />
                </div>
                <Select
                  value={botConfig.widgetStyle || "classic"}
                  onValueChange={(value) => applyUpdate({ widgetStyle: value as BotStudioProps["botConfig"]["widgetStyle"] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Widget style" />
                  </SelectTrigger>
                  <SelectContent>
                    {widgetStyles.map((style) => (
                      <SelectItem key={style.value} value={style.value}>
                        {style.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={botConfig.backgroundStyle || "clean"}
                  onValueChange={(value) => applyUpdate({ backgroundStyle: value as BotStudioProps["botConfig"]["backgroundStyle"] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Background style" />
                  </SelectTrigger>
                  <SelectContent>
                    {backgroundStyles.map((style) => (
                      <SelectItem key={style.value} value={style.value}>
                        {style.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                <Wand2 className="w-4 h-4 text-accent" /> Suggestions (max 3)
              </div>
              <div className="space-y-3">
                {suggestions.slice(0, 3).map((q, index) => (
                  <Input
                    key={index}
                    value={q}
                    onChange={(e) => handleSuggestionChange(index, e.target.value)}
                    placeholder={`Suggestion ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div
            className="hidden lg:flex w-2 cursor-col-resize justify-center"
            onMouseDown={startDrag("left")}
          >
            <span className="w-1 h-full rounded-full bg-border" />
          </div>

          {/* Center preview */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg flex items-center justify-center min-h-0 h-full lg:flex-1 lg:min-w-0 overflow-hidden">
            <div className={cn("w-full max-w-md rounded-3xl p-5 shadow-2xl", previewBackground, previewShellClass)}>
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  {botConfig.avatarUrl ? (
                    <img
                      src={botConfig.avatarUrl}
                      alt={botConfig.name}
                      className={cn("w-12 h-12 object-cover", avatarClass)}
                    />
                  ) : (
                    <div className={cn("w-12 h-12 flex items-center justify-center text-lg font-semibold", avatarClass)}>
                      {botConfig.name?.charAt(0).toUpperCase() || "M"}
                    </div>
                  )}
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-500">ModelStack Bot</p>
                    <h3 className="text-xl font-semibold">{botConfig.name || "AI Assistant"}</h3>
                  </div>
                </div>
                <div className="px-3 py-1 rounded-full bg-slate-100 text-xs text-slate-700">
                  {botConfig.aiModelProvider?.toUpperCase() || "GEMINI"}
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className={previewBubble("bot")}>{botConfig.welcomeMessage}</div>
                <div className={previewBubble("user")} style={{ backgroundColor: botConfig.themeColor }}>
                  What can you do for my business?
                </div>
                <div className={previewBubble("bot")}>
                  I can answer questions, capture leads, and help schedule appointments in seconds.
                </div>
              </div>

              {suggestions.some((q) => q.trim()) && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {suggestions.filter((q) => q.trim()).slice(0, 3).map((q) => (
                    <span
                      key={q}
                      className="px-3 py-1 rounded-full bg-slate-100 text-xs text-slate-700 border border-slate-200"
                    >
                      {q}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-5 flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2">
                <ImageIcon className="w-4 h-4 text-slate-500" />
                <input
                  className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                  placeholder="Type your message..."
                  readOnly
                />
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: botConfig.themeColor }}>
                  <Layers className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div
            className="hidden lg:flex w-2 cursor-col-resize justify-center"
            onMouseDown={startDrag("right")}
          >
            <span className="w-1 h-full rounded-full bg-border" />
          </div>

          <div
            className="space-y-5 lg:shrink-0 min-h-0 overflow-y-auto pl-1"
            style={{ width: rightWidth }}
          >
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                <Settings className="w-4 h-4 text-accent" /> Configuration
              </div>
              <div className="space-y-3">
                <label className="text-xs text-muted-foreground">AI model</label>
                <Select
                  value={botConfig.aiModelProvider || "gemini"}
                  onValueChange={(value) => applyUpdate({ aiModelProvider: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {modelOptions.map((model) => (
                      <SelectItem
                        key={model.value}
                        value={model.value}
                        disabled={model.status === "soon"}
                      >
                        {model.label} {model.status === "soon" ? "(Coming soon)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <label className="text-xs text-muted-foreground">Tone</label>
                <Select
                  value={botConfig.tone}
                  onValueChange={(value) => applyUpdate({ tone: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tone" />
                  </SelectTrigger>
                  <SelectContent>
                    {toneOptions.map((tone) => (
                      <SelectItem key={tone.value} value={tone.value}>
                        {tone.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <label className="text-xs text-muted-foreground">Response length</label>
                <Select
                  value={botConfig.responseLength}
                  onValueChange={(value) => applyUpdate({ responseLength: value as "short" | "medium" | "long" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Response length" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Short</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="long">Long</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                <ImageIcon className="w-4 h-4 text-accent" /> Behavior
              </div>
              <div className="space-y-3">
                <label className="text-xs text-muted-foreground">Welcome message</label>
                <Textarea
                  value={botConfig.welcomeMessage}
                  onChange={(e) => applyUpdate({ welcomeMessage: e.target.value })}
                  className="min-h-[100px]"
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Typing speed</span>
                  <Select
                    value={botConfig.typingSpeed}
                    onValueChange={(value) => applyUpdate({ typingSpeed: value })}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instant">Instant</SelectItem>
                      <SelectItem value="fast">Fast</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="slow">Slow</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Enable booking button</span>
                  <Switch
                    checked={!!botConfig.apiIntegration}
                    onCheckedChange={(value) => applyUpdate({ apiIntegration: value })}
                  />
                </div>
                {botConfig.apiIntegration && (
                  <Input
                    value={botConfig.bookingButtonText || ""}
                    onChange={(e) => applyUpdate({ bookingButtonText: e.target.value })}
                    placeholder="Booking button text"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
