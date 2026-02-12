import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, Sparkles, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

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

interface SocialMediaChatSetupProps {
  onComplete: (config: SocialMediaConfig, businessName: string, industry: string) => void;
}

const SYSTEM_PROMPT = `You are an AI marketing assistant inside a platform called ModelStack.

Your goal is to quickly generate high-performing social media posts and ads with minimal input from the user.

Startup Behavior (IMPORTANT)
- Do NOT ask long forms or many questions.
- When a user starts, ask one simple question: "What are you promoting?"
- Based on the user's answer, ask only 2–3 short follow-up questions such as:
  - Who is this for?
  - Where will you post it?
  - What's the main goal? (sales, traffic, followers)
- Ask questions one at a time, not all at once.
- Keep your responses short and conversational.
- After 3-4 questions total, say "Perfect! I have everything I need." and include a JSON block with the extracted config.

When you have enough info (after 3-4 exchanges), output a JSON block like this:
\`\`\`json
{
  "ready": true,
  "businessName": "extracted business name",
  "industry": "detected industry",
  "config": {
    "targetAudience": {
      "ageRange": "25-34",
      "locations": "Global",
      "interests": "detected interests"
    },
    "marketingGoal": "sales|traffic|followers|awareness",
    "platforms": ["instagram", "tiktok"],
    "brandVoice": "friendly|professional|bold|luxury|playful",
    "postingFrequency": "moderate",
    "contentTypes": ["posts", "reels"],
    "adBudget": "none",
    "competitors": ""
  }
}
\`\`\`

Platform Rules (use these when generating content later):
- TikTok: short hooks, trend-based, casual
- Instagram: emojis, hashtags, reels friendly
- X: short, punchy, no emojis
- LinkedIn: professional, clean, no emojis
- Facebook: casual but informative`;

export default function SocialMediaChatSetup({ onComplete }: SocialMediaChatSetupProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hey! 👋 I'm your marketing AI. Let's create some killer content together.\n\n**What are you promoting?** (a product, website, service, or brand idea)",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const extractConfig = (text: string) => {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed.ready && parsed.config) {
          return parsed;
        }
      } catch (e) {
        console.error("Failed to parse config JSON:", e);
      }
    }
    return null;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const conversationHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const { data, error } = await supabase.functions.invoke("social-media-chat", {
        body: {
          message: userMessage.content,
          conversationHistory,
          systemPrompt: SYSTEM_PROMPT,
        },
      });

      if (error) throw error;

      const assistantContent = data.response || "I'm having trouble responding. Please try again.";

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: assistantContent.replace(/```json[\s\S]*?```/g, "").trim(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Check if we have enough info
      const config = extractConfig(data.response);
      if (config) {
        setTimeout(() => {
          onComplete(config.config, config.businessName, config.industry);
        }, 1500);
      }
    } catch (error) {
      console.error("Error in chat:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: "Oops! Something went wrong. Let me try again - what are you promoting?",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center py-6 border-b border-border">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-4">
          <Megaphone className="w-8 h-8 text-accent" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Social Media & Ads AI</h1>
        <p className="text-muted-foreground mt-1">Quick setup through chat - no long forms!</p>
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-3",
                message.role === "user"
                  ? "bg-accent text-accent-foreground rounded-br-md"
                  : "bg-secondary text-foreground rounded-bl-md"
              )}
            >
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {message.content.split("**").map((part, i) =>
                  i % 2 === 1 ? (
                    <strong key={i}>{part}</strong>
                  ) : (
                    <span key={i}>{part}</span>
                  )
                )}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your answer..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          <Sparkles className="w-3 h-3 inline mr-1" />
          Just answer a few quick questions and I'll handle the rest
        </p>
      </div>
    </div>
  );
}
