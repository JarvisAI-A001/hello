import { useState, useEffect, useRef } from "react";
import { Phone, PhoneOff, Mic, MicOff, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { speak, stopSpeaking, startListening, isSpeaking, isCurrentlyListening } from "@/services/voiceService";

interface VoiceCallProps {
  botName: string;
  botAvatar?: string;
  primaryColor?: string;
  elevenlabsApiKey?: string;
  onMessage: (text: string) => Promise<string>;
  onClose: () => void;
}

export function VoiceCall({
  botName,
  botAvatar,
  primaryColor = "#0EA5E9",
  elevenlabsApiKey,
  onMessage,
  onClose,
}: VoiceCallProps) {
  const [isCallActive, setIsCallActive] = useState(true);
  const [isBotSpeaking, setIsBotSpeaking] = useState(false);
  const [userIsSpeaking, setUserIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [callDuration, setCallDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const stopListeningRef = useRef<(() => void) | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer for call duration
  useEffect(() => {
    if (isCallActive) {
      callTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [isCallActive]);

  // Format call duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Start listening for user input
  const startListeningForUser = () => {
    if (userIsSpeaking) return;

    setUserIsSpeaking(true);
    setTranscript("");

    stopListeningRef.current = startListening(
      async (text, isFinal) => {
        setTranscript(text);
        if (isFinal) {
          setUserIsSpeaking(false);
          await processUserMessage(text);
        }
      },
      (error) => {
        console.error("Listening error:", error);
        setUserIsSpeaking(false);
      }
    );
  };

  // Stop listening
  const stopListening = () => {
    if (stopListeningRef.current) {
      stopListeningRef.current();
      stopListeningRef.current = null;
    }
    setUserIsSpeaking(false);
  };

  // Process user message
  const processUserMessage = async (text: string) => {
    if (!text.trim()) return;

    setIsProcessing(true);
    try {
      const botResponse = await onMessage(text);
      await speakBotResponse(botResponse);
    } catch (error) {
      console.error("Error processing message:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Speak bot response
  const speakBotResponse = async (text: string) => {
    setIsBotSpeaking(true);
    try {
      await speak(text, {
        rate: 1,
        pitch: 1,
        volume: 1,
        apiKey: elevenlabsApiKey,
      });
    } catch (error) {
      console.error("Speech error:", error);
    } finally {
      setIsBotSpeaking(false);
    }
  };

  // End call
  const handleEndCall = () => {
    stopSpeaking();
    stopListening();
    setIsCallActive(false);
    onClose();
  };

  // Animated voice waves component
  const VoiceWaves = () => (
    <div className="flex items-center justify-center gap-1 h-16">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-1 bg-white rounded-full transition-all",
            isBotSpeaking
              ? "animate-pulse"
              : userIsSpeaking
              ? "animate-pulse"
              : "h-2"
          )}
          style={{
            height: isBotSpeaking || userIsSpeaking ? `${20 + i * 12}px` : "8px",
            animation:
              isBotSpeaking || userIsSpeaking
                ? `wave 0.6s ease-in-out infinite`
                : "none",
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={handleEndCall}
    >
      <style>{`
        @keyframes wave {
          0%, 100% { height: 8px; }
          50% { height: 40px; }
        }
      `}</style>

      <div
        className="bg-gradient-to-br rounded-2xl shadow-2xl overflow-hidden w-full max-w-sm"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}dd 0%, ${primaryColor}aa 100%)`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-8 text-center text-white space-y-3">
          {/* Bot Avatar */}
          <div className="flex justify-center">
            {botAvatar ? (
              <img
                src={botAvatar}
                alt={botName}
                className="w-20 h-20 rounded-full border-4 border-white object-cover shadow-lg"
              />
            ) : (
              <div
                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center text-2xl font-bold shadow-lg"
                style={{ backgroundColor: primaryColor }}
              >
                {botName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Bot Name and Status */}
          <div>
            <h2 className="text-2xl font-bold">{botName}</h2>
            <p className="text-sm opacity-90">
              {isBotSpeaking
                ? "Speaking..."
                : userIsSpeaking
                ? "Listening..."
                : isProcessing
                ? "Processing..."
                : "Ready to talk"}
            </p>
          </div>

          {/* Call Duration */}
          <div className="text-lg font-semibold opacity-90">
            {formatDuration(callDuration)}
          </div>
        </div>

        {/* Voice Waves Animation */}
        <div className="px-6 py-8 flex justify-center">
          <VoiceWaves />
        </div>

        {/* Transcript Display */}
        {transcript && (
          <div className="px-6 pb-6">
            <div className="bg-white/20 rounded-lg p-4 text-white text-center text-sm backdrop-blur-sm">
              <p className="opacity-75 text-xs mb-1">
                {userIsSpeaking ? "You:" : ""}
              </p>
              <p>{transcript}</p>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="px-6 py-6 flex items-center justify-center gap-4">
          {!userIsSpeaking && !isBotSpeaking && !isProcessing && (
            <Button
              size="lg"
              className="rounded-full w-16 h-16 p-0 flex items-center justify-center bg-white text-current hover:bg-gray-100 shadow-lg"
              onClick={startListeningForUser}
              style={{ color: primaryColor }}
            >
              <Mic className="w-6 h-6" />
            </Button>
          )}

          {userIsSpeaking && (
            <Button
              size="lg"
              className="rounded-full w-16 h-16 p-0 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white shadow-lg"
              onClick={stopListening}
            >
              <MicOff className="w-6 h-6" />
            </Button>
          )}

          {isBotSpeaking && (
            <Button
              size="lg"
              className="rounded-full w-16 h-16 p-0 flex items-center justify-center bg-white text-current hover:bg-gray-100 shadow-lg cursor-default"
              style={{ color: primaryColor }}
            >
              <Volume2 className="w-6 h-6 animate-pulse" />
            </Button>
          )}

          {isProcessing && (
            <Button
              size="lg"
              className="rounded-full w-16 h-16 p-0 flex items-center justify-center bg-white text-current shadow-lg cursor-default"
              style={{ color: primaryColor }}
              disabled
            >
              <div className="w-6 h-6 rounded-full border-2 border-current border-t-transparent animate-spin" />
            </Button>
          )}

          {/* End Call Button */}
          <Button
            size="lg"
            className="rounded-full w-16 h-16 p-0 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white shadow-lg"
            onClick={handleEndCall}
          >
            <PhoneOff className="w-6 h-6" />
          </Button>
        </div>

        {/* Bottom Info */}
        <div className="px-6 pb-4 text-center text-white text-xs opacity-75">
          <p>Press the microphone to speak</p>
        </div>
      </div>
    </div>
  );
}
