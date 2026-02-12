import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Send, Bot, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MicrophoneButton } from "@/components/voice/MicrophoneButton";

interface Message {
  role: 'user' | 'bot';
  content: string;
}

// Parse simple markdown: **bold**, *italic*, `code`
const parseMarkdown = (text: string): string => {
  return text
    // Bold: **text** or __text__
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    // Italic: *text* or _text_ (but not inside bold)
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
    .replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, '<em>$1</em>')
    // Inline code: `code`
    .replace(/`(.+?)`/g, '<code style="background:hsl(222 30% 18%);padding:2px 6px;border-radius:4px;font-size:0.9em;">$1</code>')
    // Line breaks
    .replace(/\n/g, '<br/>');
};

const lightenColor = (hex: string, percent: number = 20): string => {
  const raw = hex.replace("#", "");
  if (raw.length !== 6) return hex;
  const r = parseInt(raw.slice(0, 2), 16);
  const g = parseInt(raw.slice(2, 4), 16);
  const b = parseInt(raw.slice(4, 6), 16);
  const lr = Math.round(r + (255 - r) * (percent / 100));
  const lg = Math.round(g + (255 - g) * (percent / 100));
  const lb = Math.round(b + (255 - b) * (percent / 100));
  return `#${lr.toString(16).padStart(2, "0")}${lg.toString(16).padStart(2, "0")}${lb.toString(16).padStart(2, "0")}`;
};

interface BotInfo {
  name: string;
  greeting_message: string;
  primary_color: string;
  avatar_url: string;
  business_name: string;
  booking_enabled?: boolean;
  booking_button_text?: string;
  ai_model?: string;
  widget_style?: string;
  icon_style?: string;
  background_style?: string;
  suggested_questions?: string[];
}

export default function Widget() {
  const { botId } = useParams<{ botId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [botInfo, setBotInfo] = useState<BotInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send heartbeat every 30 seconds to keep session "live"
  useEffect(() => {
    if (!sessionId || !botId) return;

    const sendHeartbeat = async () => {
      try {
        await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/widget-bot?botId=${botId}&sessionId=${sessionId}&action=heartbeat`,
          { method: 'GET' }
        );
      } catch (err) {
        console.error("Heartbeat error:", err);
      }
    };

    // Send initial heartbeat
    sendHeartbeat();

    // Set up interval for heartbeats
    heartbeatIntervalRef.current = setInterval(sendHeartbeat, 30000);

    // Cleanup: send disconnect on unmount
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      // Send disconnect signal
      if (sessionId && botId) {
        fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/widget-bot?botId=${botId}&sessionId=${sessionId}&action=disconnect`,
          { method: 'GET' }
        ).catch(console.error);
      }
    };
  }, [sessionId, botId]);

  // Fetch bot configuration on mount
  useEffect(() => {
    const fetchBotInfo = async () => {
      if (!botId) {
        setError("No bot ID provided");
        setIsInitializing(false);
        return;
      }

      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/widget-bot?botId=${botId}`,
          { method: 'GET' }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to load bot");
        }

        const data = await response.json();
        setBotInfo(data);
        if (data.session_id) {
          setSessionId(data.session_id);
        }
        
        // Add greeting message
        if (data.greeting_message) {
          setMessages([{ role: 'bot', content: data.greeting_message }]);
        }
      } catch (err) {
        console.error("Error fetching bot info:", err);
        setError(err instanceof Error ? err.message : "Failed to load bot");
      } finally {
        setIsInitializing(false);
      }
    };

    fetchBotInfo();
  }, [botId]);

  const sendMessageText = async (text: string) => {
    if (!text.trim() || isLoading || !botId) return;

    const userMessage = text.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/widget-bot?botId=${botId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userMessage,
            conversationHistory: messages.map(m => ({
              role: m.role === 'user' ? 'user' : 'assistant',
              content: m.content
            })),
            sessionId: sessionId
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429 && data?.code === "MESSAGE_LIMIT_REACHED") {
          throw new Error(data.error || "Message limit reached for this chat.");
        }
        throw new Error(data.error || "Failed to get response");
      }

      setMessages(prev => [...prev, { role: 'bot', content: data.response }]);
    } catch (err) {
      console.error("Error sending message:", err);
      const errorMessage = err instanceof Error ? err.message : "I'm sorry, I encountered an error. Please try again.";
      setMessages(prev => [...prev, { 
        role: 'bot', 
        content: errorMessage 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    await sendMessageText(input);
  };

  const handleVoiceMessage = async (message: string) => {
    if (!botId) throw new Error("No bot ID provided");
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/widget-bot?botId=${botId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          conversationHistory: messages.map((m) => ({
            role: m.role === "user" ? "user" : "assistant",
            content: m.content,
          })),
          sessionId: sessionId,
        }),
      }
    );
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to get response");
    }
    return data.response || "Sorry, something went wrong.";
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const primaryColor = botInfo?.primary_color || "#6366f1";
  const styleVariant = botInfo?.widget_style || "classic";
  const iconStyle = botInfo?.icon_style || "modern";
  const backgroundStyle = botInfo?.background_style || "clean";
  const suggestedQuestions = (botInfo?.suggested_questions || []).filter(Boolean).slice(0, 3);

  const backgroundClass = (() => {
    switch (backgroundStyle) {
      case "gradient":
        return "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white";
      case "grid":
        return "bg-[radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.25)_1px,transparent_1px)] [background-size:22px_22px] bg-slate-950 text-white";
      case "glass":
        return "bg-white/80 backdrop-blur-2xl";
      case "clean":
      default:
        return "bg-background";
    }
  })();

  const avatarClass = (() => {
    switch (iconStyle) {
      case "basic":
        return "rounded-full bg-white/20";
      case "outline":
        return "rounded-full border border-white/60 bg-transparent";
      case "modern":
      default:
        return "rounded-2xl bg-white/20 shadow-[0_0_20px_rgba(255,255,255,0.25)]";
    }
  })();

  const voiceBotConfig = botInfo
    ? {
        name: botInfo.name || "AI Assistant",
        tone: "professional",
        businessName: botInfo.business_name || "",
        services: "",
      }
    : undefined;

  // Loading state
  if (isInitializing) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">Unable to Load Bot</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("h-screen flex flex-col", backgroundClass)}>
      {/* Header - Classic preview style */}
      <div
        className={cn(
          "px-4 py-3 flex items-center gap-3",
          styleVariant === "gpt" ? "bg-slate-900 text-white" : "text-white"
        )}
        style={{ backgroundColor: styleVariant === "gpt" ? undefined : primaryColor }}
      >
        {botInfo?.avatar_url ? (
          <img
            src={botInfo.avatar_url}
            alt={botInfo.name}
            className={cn("w-10 h-10 object-cover border-2 border-white/30", avatarClass)}
          />
        ) : (
          <div className={cn("w-10 h-10 flex items-center justify-center", avatarClass)}>
            <Bot className="w-5 h-5" />
          </div>
        )}
        <div className="flex-1">
          <h1 className="font-semibold text-sm">{botInfo?.name || "Chat Assistant"}</h1>
          {botInfo?.business_name ? (
            <p className="text-xs text-white/80">{botInfo.business_name}</p>
          ) : (
            <p className="text-xs text-white/80">Online</p>
          )}
        </div>
        <MicrophoneButton
          botName={botInfo?.name}
          botId={botId}
          className="w-9 h-9"
          botConfig={voiceBotConfig}
          conversationHistory={messages.map((m) => ({
            role: m.role === "user" ? "user" : "assistant",
            content: m.content,
          }))}
          onSendMessage={handleVoiceMessage}
        />
      </div>

      {/* Messages */}
      <div
        className={cn(
          "flex-1 overflow-y-auto p-4 space-y-3",
          styleVariant === "minimal" ? "bg-transparent" : "bg-background"
        )}
      >
        {messages.map((message, index) => (
          <div
            key={index}
            className={cn(
              "flex",
              message.role === 'user' ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[80%] px-4 py-2 text-sm [&_strong]:font-bold [&_em]:italic",
                message.role === 'user'
                  ? "rounded-2xl rounded-br-sm text-white"
                  : "rounded-2xl rounded-bl-sm"
              )}
              style={
                message.role === 'user'
                  ? { backgroundColor: primaryColor }
                  : styleVariant === "gpt"
                  ? { backgroundColor: "rgba(15, 23, 42, 0.9)", color: "white" }
                  : styleVariant === "minimal"
                  ? { backgroundColor: "rgba(255,255,255,0.85)", color: "#0f172a" }
                  : { backgroundColor: lightenColor(primaryColor, 20), color: "#0f172a" }
              }
              dangerouslySetInnerHTML={{ __html: parseMarkdown(message.content) }}
            />
          </div>
        ))}

        {messages.length <= 1 && suggestedQuestions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((q) => (
              <button
                key={q}
                onClick={() => sendMessageText(q)}
                className="px-3 py-1.5 rounded-full text-xs border border-border/60 bg-white/70 hover:bg-white transition"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div
              className="px-4 py-2 rounded-2xl rounded-bl-sm text-white text-sm"
              style={{ backgroundColor: primaryColor }}
            >
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input - Classic preview style */}
      <div
        className={cn(
          "p-4 border-t border-border space-y-3",
          styleVariant === "gpt" ? "bg-slate-900 text-white border-white/10" : "bg-background"
        )}
      >
        {botInfo?.booking_enabled && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.open(`/booking/${botId}`, "_blank")}
          >
            {botInfo.booking_button_text || "Schedule an appointment"}
          </Button>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={isLoading}
            className={cn(
              "flex-1 text-sm px-4 py-3 rounded-full border border-border focus:outline-none",
              styleVariant === "gpt" ? "bg-slate-800 text-white border-white/10 placeholder:text-white/40" : "bg-white"
            )}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 rounded-full text-white text-sm font-medium"
            style={{ backgroundColor: primaryColor }}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-2">
          Powered by ModelStack
        </p>
      </div>
    </div>
  );
}
