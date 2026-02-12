import { useState, useCallback, useEffect, useRef } from "react";
import { Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

// Type declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

interface VoiceModeUIProps {
  onClose?: () => void;
  botName?: string;
  botId?: string;
  botConfig?: {
    name: string;
    tone: string;
    businessName: string;
    services: string;
  };
  conversationHistory?: { role: 'user' | 'assistant'; content: string }[];
  onSendMessage?: (message: string) => Promise<string>;
}

export function VoiceModeUI({ 
  onClose, 
  botName = "AI Assistant",
  botId,
  botConfig,
  conversationHistory = [],
  onSendMessage 
}: VoiceModeUIProps) {
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("Hello! How can I help you today?");
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isListeningRef = useRef(false);
  const shouldResumeListeningRef = useRef(false);
  const fallbackVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSentRef = useRef<string>("");
  const isProcessingRef = useRef(false);
  const ttsModeRef = useRef<"elevenlabs" | "web" | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognitionConstructor) {
      recognitionRef.current = new SpeechRecognitionConstructor();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptText = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptText;
          } else {
            interimTranscript += transcriptText;
          }
        }

        setTranscript(finalTranscript || interimTranscript);

        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }

        if (finalTranscript) {
          const cleaned = finalTranscript.trim();
          if (cleaned && cleaned !== lastSentRef.current && !isProcessingRef.current) {
            lastSentRef.current = cleaned;
            handleUserSpeech(cleaned);
          }
          return;
        }

        const interimCleaned = interimTranscript.trim();
        if (!interimCleaned) return;

        // Send after a short pause to feel more conversational
        silenceTimerRef.current = setTimeout(() => {
          if (isProcessingRef.current) return;
          if (interimCleaned && interimCleaned !== lastSentRef.current) {
            lastSentRef.current = interimCleaned;
            handleUserSpeech(interimCleaned);
          }
        }, 700);
      };

      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        if (event.error !== 'no-speech') {
          setError(`Speech recognition error: ${event.error}`);
        }
      };

      recognitionRef.current.onend = () => {
        if (isListeningRef.current) {
          recognitionRef.current?.start();
        }
      };
    }

    return () => {
      recognitionRef.current?.stop();
      audioRef.current?.pause();
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    };
  }, []);

  // Handle barge-in (user interrupts AI speaking)
  const handleBargeIn = useCallback(() => {
    if (isSpeaking && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsSpeaking(false);
    }
  }, [isSpeaking]);

  // Send message and get AI response with voice
  const handleUserSpeech = async (userText: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    handleBargeIn(); // Stop current audio if playing
    setIsConnecting(true);
    setError(null);

    try {
      let responseText: string;

      // If onSendMessage prop is provided, use it
      if (onSendMessage) {
        responseText = await onSendMessage(userText);
      } else {
        // Call bot-chat to get AI response
        const { data: chatData, error: chatError } = await supabase.functions.invoke('bot-chat', {
          body: {
            message: userText,
            botConfig: botConfig || {
              name: botName,
              tone: 'professional',
              businessName: '',
              services: '',
            },
            conversationHistory,
          },
        });

        if (chatError) throw chatError;
        responseText = chatData.response;
      }

      setAiResponse(responseText);

      // Convert response to speech
      if (!isMuted) {
        await speakResponse(responseText);
      }
    } catch (err) {
      console.error('Error processing speech:', err);
      setError('Failed to process your request. Please try again.');
    } finally {
      setIsConnecting(false);
      isProcessingRef.current = false;
    }
  };

  // Use ElevenLabs TTS
  const speakResponse = async (text: string) => {
    try {
      setIsSpeaking(true);
      const wasListening = isListeningRef.current;
      if (wasListening) {
        shouldResumeListeningRef.current = true;
        isListeningRef.current = false;
        setIsListening(false);
        recognitionRef.current?.stop();
      }

      const resumeListening = () => {
        if (shouldResumeListeningRef.current) {
          shouldResumeListeningRef.current = false;
          try {
            recognitionRef.current?.start();
            setIsListening(true);
          } catch (err) {
            console.error("Failed to resume listening:", err);
          }
        }
      };

      const speakWithWeb = () => {
        if (!('speechSynthesis' in window)) {
          setIsSpeaking(false);
          return;
        }
        const synth = window.speechSynthesis;
        const pickFallbackVoice = () => {
          const voices = synth.getVoices();
          if (!voices.length) return null;
          const preferred =
            voices.find((v) => v.lang === "en-US") ||
            voices.find((v) => v.lang.startsWith("en")) ||
            voices[0];
          return preferred || null;
        };

        if (!fallbackVoiceRef.current) {
          fallbackVoiceRef.current = pickFallbackVoice();
        }
        const utterance = new SpeechSynthesisUtterance(text);
        if (fallbackVoiceRef.current) {
          utterance.voice = fallbackVoiceRef.current;
        }
        utterance.onend = () => {
          setIsSpeaking(false);
          resumeListening();
        };
        utterance.onerror = () => {
          setIsSpeaking(false);
          shouldResumeListeningRef.current = false;
        };
        synth.cancel();
        synth.speak(utterance);
      };

      if (ttsModeRef.current === "web") {
        speakWithWeb();
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ 
            text,
            botConfig,
            botId
          }),
        }
      );

      if (!response.ok) {
        throw new Error('TTS request failed');
      }

      const data = await response.json();
      
      if (data.audioContent) {
        ttsModeRef.current = "elevenlabs";
        const audioUrl = `data:audio/mpeg;base64,${data.audioContent}`;
        audioRef.current = new Audio(audioUrl);
        
        audioRef.current.onended = () => {
          setIsSpeaking(false);
          resumeListening();
        };

        audioRef.current.onerror = () => {
          setIsSpeaking(false);
          setError('Failed to play audio');
          shouldResumeListeningRef.current = false;
        };

        await audioRef.current.play();
      } else {
        throw new Error('TTS audio missing');
      }
    } catch (err) {
      console.error('TTS Error:', err);
      setIsSpeaking(false);
      // Lock in a single voice mode per session.
      if (ttsModeRef.current === null) {
        ttsModeRef.current = "web";
        const synth = window.speechSynthesis;
        const voices = synth?.getVoices?.() ?? [];
        fallbackVoiceRef.current = voices.find((v) => v.lang === "en-US") || voices.find((v) => v.lang.startsWith("en")) || voices[0] || null;
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(text);
          if (fallbackVoiceRef.current) {
            utterance.voice = fallbackVoiceRef.current;
          }
          utterance.onend = () => {
            setIsSpeaking(false);
            if (shouldResumeListeningRef.current) {
              shouldResumeListeningRef.current = false;
              try {
                recognitionRef.current?.start();
                setIsListening(true);
              } catch (err) {
                console.error("Failed to resume listening:", err);
              }
            }
          };
          utterance.onerror = () => {
            setIsSpeaking(false);
            shouldResumeListeningRef.current = false;
          };
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(utterance);
        }
      }
    }
  };

  const toggleListening = useCallback(async () => {
    if (!recognitionRef.current) {
      setError('Speech recognition not supported in this browser');
      return;
    }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      if (isListening) {
        shouldResumeListeningRef.current = false;
        recognitionRef.current.stop();
        setIsListening(false);
      } else {
        setTranscript('');
        recognitionRef.current.start();
        setIsListening(true);
        handleBargeIn();
      }
    } catch (err) {
      setError('Microphone access denied. Please enable microphone permissions.');
    }
  }, [isListening, handleBargeIn]);

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted && audioRef.current) {
      audioRef.current.pause();
      setIsSpeaking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
            <Volume2 className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">{botName}</h2>
            <p className="text-xs text-muted-foreground">
              {isConnecting ? "Processing..." : isListening ? "Listening..." : isSpeaking ? "Speaking..." : "Voice Mode"}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-destructive hover:bg-destructive/10"
        >
          <PhoneOff className="w-5 h-5" />
        </Button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
        {/* Error message */}
        {error && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-destructive/10 text-destructive px-4 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Waveform visualization */}
        <div className="relative">
          {/* Outer glow rings */}
          <div
            className={cn(
              "absolute inset-0 rounded-full transition-all duration-500",
              isListening && "animate-ping bg-accent/20"
            )}
            style={{ margin: "-20px" }}
          />
          <div
            className={cn(
              "absolute inset-0 rounded-full transition-all duration-700",
              isSpeaking && "animate-pulse bg-accent/30"
            )}
            style={{ margin: "-10px" }}
          />

          {/* Central orb */}
          <div
            className={cn(
              "w-40 h-40 rounded-full flex items-center justify-center transition-all duration-300",
              isListening
                ? "bg-accent/30 shadow-[0_0_60px_hsl(239_84%_67%/0.5)]"
                : isSpeaking
                ? "bg-success/30 shadow-[0_0_60px_hsl(142_76%_36%/0.5)]"
                : isConnecting
                ? "bg-warning/30 shadow-[0_0_60px_hsl(38_92%_50%/0.5)]"
                : "bg-card/50"
            )}
          >
            {isConnecting ? (
              <Loader2 className="w-12 h-12 text-warning animate-spin" />
            ) : isListening ? (
              <div className="voice-waveform">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bar" />
                ))}
              </div>
            ) : isSpeaking ? (
              <div className="voice-waveform speaking">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bar" />
                ))}
              </div>
            ) : (
              <Phone className="w-12 h-12 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Transcript area */}
        <div className="w-full max-w-md space-y-4">
          {transcript && (
            <div className="glass-card p-4 rounded-2xl">
              <p className="text-xs text-muted-foreground mb-1">You said:</p>
              <p className="text-foreground">{transcript}</p>
            </div>
          )}

          {aiResponse && (
            <div className="glass-card p-4 rounded-2xl border-accent/30">
              <p className="text-xs text-accent mb-1">AI Response:</p>
              <p className="text-foreground">{aiResponse}</p>
            </div>
          )}
        </div>

        {/* Barge-in hint */}
        <p className="text-xs text-muted-foreground text-center">
          💡 Tip: You can interrupt the AI anytime by speaking (barge-in supported)
        </p>
      </div>

      {/* Controls */}
      <div className="p-6 border-t border-border/30">
        <div className="flex items-center justify-center gap-4">
          {/* Mute toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className={cn(
              "w-14 h-14 rounded-full",
              isMuted && "bg-destructive/20 text-destructive"
            )}
          >
            {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
          </Button>

          {/* Main mic button */}
          <Button
            onClick={toggleListening}
            disabled={isConnecting}
            className={cn(
              "w-20 h-20 rounded-full transition-all duration-300",
              isListening
                ? "bg-destructive hover:bg-destructive/90 mic-glow"
                : "bg-accent hover:bg-accent/90 shadow-glow"
            )}
          >
            {isListening ? (
              <MicOff className="w-8 h-8" />
            ) : (
              <Mic className="w-8 h-8" />
            )}
          </Button>

          {/* End call */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="w-14 h-14 rounded-full hover:bg-destructive/20 hover:text-destructive"
          >
            <Phone className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}
