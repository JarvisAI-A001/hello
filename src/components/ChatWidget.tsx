import { useState, useRef, useEffect } from "react";
import { Phone, MessageCircle, X, Minimize2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VoiceCall } from "./VoiceCall";
import { cn } from "@/lib/utils";

interface ChatWidgetProps {
  botId: string;
  botName: string;
  botAvatar?: string;
  primaryColor?: string;
  welcomeMessage?: string;
  publishText?: string;
  style?: "modern" | "classic";
  position?: "bottom-right" | "bottom-left";
  bookingEnabled?: boolean;
  bookingButtonText?: string;
  elevenlabsApiKey?: string;
  onSendMessage?: (message: string) => Promise<string>;
  preview?: boolean;
}

interface Message {
  id: string;
  role: "user" | "bot";
  content: string;
  timestamp: Date;
}

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

export function ChatWidget({
  botId,
  botName,
  botAvatar,
  primaryColor = "#0EA5E9",
  welcomeMessage = "Hi! How can I help?",
  publishText = "Chat with us",
  style = "modern",
  position = "bottom-right",
  bookingEnabled = false,
  bookingButtonText = "Schedule an appointment",
  elevenlabsApiKey,
  onSendMessage,
  preview = false,
}: ChatWidgetProps) {
  const effectiveStyle = preview ? 'classic' : style;
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "bot",
      content: welcomeMessage,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showVoiceCall, setShowVoiceCall] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await (onSendMessage
        ? onSendMessage(inputValue)
        : Promise.resolve("Thank you for your message!"));

      const botMessage: Message = {
        id: `msg-${Date.now()}-bot`,
        role: "bot",
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceMessage = async (transcript: string) => {
    const response = await (onSendMessage
      ? onSendMessage(transcript)
      : Promise.resolve("I understood you. How else can I help?"));
    return response;
  };

  const handleBookingClick = () => {
    if (bookingEnabled) {
      // Open booking page in new tab or embedded
      window.open(`/booking/${botId}`, "_blank");
    }
  };

  if (showVoiceCall) {
    return (
      <VoiceCall
        botName={botName}
        botAvatar={botAvatar}
        primaryColor={primaryColor}
        elevenlabsApiKey={elevenlabsApiKey}
        onMessage={handleVoiceMessage}
        onClose={() => setShowVoiceCall(false)}
      />
    );
  }

  // Modern style - Floating bubble
  if (effectiveStyle === "modern") {
    const anchorClass = position === "bottom-left" ? "left-4" : "right-4";
    return (
      <>
        {/* Chat Widget Bubble */}
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className={cn(
              "fixed bottom-4 w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-40 cursor-pointer",
              anchorClass
            )}
            style={{ backgroundColor: primaryColor }}
          >
            <MessageCircle className="w-6 h-6 text-white" />
          </button>
        )}

        {/* Chat Window */}
        {isOpen && !isMinimized && (
          <div
            className={cn(
              "fixed bottom-4 w-80 h-96 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-40 bg-white",
              anchorClass
            )}
            style={{ borderTop: `4px solid ${primaryColor}` }}
          >
            {/* Header */}
            <div
              className="px-4 py-3 text-white flex items-center justify-between"
              style={{ backgroundColor: primaryColor }}
            >
              <div className="flex items-center gap-2">
                {botAvatar ? (
                  <img
                    src={botAvatar}
                    alt={botName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                    {botName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-sm">{botName}</h3>
                  <p className="text-xs opacity-90">Always here to help</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setShowVoiceCall(true)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  title="Start voice call"
                >
                  <Phone className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-xs px-3 py-2 rounded-lg text-sm",
                      msg.role === "user"
                        ? "bg-gray-200 text-gray-900"
                        : "text-white"
                    )}
                    style={
                      msg.role === "bot"
                        ? {
                            backgroundColor: primaryColor,
                          }
                        : undefined
                    }
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div
                    className="px-3 py-2 rounded-lg text-white text-sm"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-white animate-bounce" />
                      <div className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: "0.2s" }} />
                      <div className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: "0.4s" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Booking Button */}
            {bookingEnabled && (
              <div className="px-4 py-2 border-t">
                <Button
                  onClick={handleBookingClick}
                  className="w-full text-sm"
                  style={{ backgroundColor: primaryColor }}
                >
                  {bookingButtonText}
                </Button>
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Type a message..."
                className="text-sm"
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim()}
                size="sm"
                style={{ backgroundColor: primaryColor }}
              >
                Send
              </Button>
            </div>
          </div>
        )}

        {/* Minimized State */}
        {isOpen && isMinimized && (
          <button
            onClick={() => setIsMinimized(false)}
            className={cn(
              "fixed bottom-4 px-4 py-2 rounded-full shadow-lg text-sm font-medium flex items-center gap-2 z-40 text-white",
              anchorClass
            )}
            style={{ backgroundColor: primaryColor }}
          >
            <MessageCircle className="w-4 h-4" />
            {botName}
            <Maximize2 className="w-4 h-4" />
          </button>
        )}
      </>
    );
  }

  // Classic style - Embedded window
  return (
    <div className="w-full h-full bg-white rounded-xl shadow-lg flex flex-col border" style={{ borderColor: primaryColor }}>
      {/* Header */}
      <div
        className="px-4 py-3 text-white flex items-center justify-between"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="flex items-center gap-2">
          {botAvatar ? (
            <img
              src={botAvatar}
              alt={botName}
              className="w-8 h-8 rounded-full object-cover border-2 border-white/30"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
              {botName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h3 className="font-semibold text-sm">{botName}</h3>
            <p className="text-xs opacity-80">Online</p>
          </div>
        </div>
        <button
          onClick={() => setShowVoiceCall(true)}
          className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          title="Start voice call"
        >
          <Phone className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-xs px-3 py-2 rounded-2xl text-sm",
                msg.role === "user"
                  ? "rounded-br-sm text-white"
                  : "rounded-bl-sm text-gray-900"
              )}
              style={
                msg.role === "bot"
                  ? { backgroundColor: lightenColor(primaryColor, 20) }
                  : { backgroundColor: primaryColor }
              }
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div
              className="px-3 py-2 rounded-2xl rounded-bl-sm text-white text-sm"
              style={{ backgroundColor: primaryColor }}
            >
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-white animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: "0.2s" }} />
                <div className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: "0.4s" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Booking Button */}
      {bookingEnabled && (
        <div className="px-4 py-2 border-t">
          <Button
            onClick={handleBookingClick}
            className="w-full text-sm"
            style={{ backgroundColor: primaryColor }}
          >
            {bookingButtonText}
          </Button>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          placeholder="Type a message..."
          className="text-sm rounded-full"
          disabled={isLoading}
        />
        <Button
          onClick={handleSendMessage}
          disabled={isLoading || !inputValue.trim()}
          size="sm"
          style={{ backgroundColor: primaryColor }}
          className="rounded-full"
        >
          Send
        </Button>
      </div>
    </div>
  );
}
