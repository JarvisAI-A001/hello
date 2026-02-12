import { useState } from "react";
import { Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { VoiceModeUI } from "./VoiceModeUI";

interface MicrophoneButtonProps {
  botName?: string;
  botId?: string;
  className?: string;
  botConfig?: {
    name: string;
    tone: string;
    businessName: string;
    services: string;
  };
  conversationHistory?: { role: 'user' | 'assistant'; content: string }[];
  onSendMessage?: (message: string) => Promise<string>;
}

export function MicrophoneButton({ botName, botId, className, botConfig, conversationHistory, onSendMessage }: MicrophoneButtonProps) {
  const [isVoiceModeOpen, setIsVoiceModeOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsVoiceModeOpen(true)}
        className={cn(
          "relative w-12 h-12 rounded-full bg-accent flex items-center justify-center",
          "transition-all duration-300 hover:scale-105",
          "shadow-[0_0_20px_hsl(239_84%_67%/0.4)]",
          "hover:shadow-[0_0_30px_hsl(239_84%_67%/0.6)]",
          "mic-glow",
          className
        )}
        aria-label="Start voice call"
      >
        {/* Animated glow ring */}
        <span className="absolute inset-0 rounded-full animate-ping bg-accent/30" />
        <span className="absolute inset-0 rounded-full animate-pulse bg-accent/20" />
        
        <Phone className="w-5 h-5 text-accent-foreground relative z-10" />
      </button>

      {isVoiceModeOpen && (
        <VoiceModeUI
          onClose={() => setIsVoiceModeOpen(false)}
          botName={botName}
          botId={botId}
          botConfig={botConfig}
          conversationHistory={conversationHistory}
          onSendMessage={onSendMessage}
        />
      )}
    </>
  );
}
