/**
 * Voice Service
 * Handles text-to-speech (TTS) using ElevenLabs API and speech-to-text (STT) using Web Speech API
 */

export interface VoiceConfig {
  language: string;
  rate: number;
  pitch: number;
  volume: number;
  voiceId?: string;
  apiKey?: string;
}

const defaultConfig: VoiceConfig = {
  language: 'en-US',
  rate: 1,
  pitch: 1,
  volume: 1,
  voiceId: '21m00Tcm4TlvDq8ikWAM', // Default ElevenLabs voice ID (Rachel)
};

let currentAudio: HTMLAudioElement | null = null;
let isListening = false;

const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

/**
 * Speak text using ElevenLabs API (Text-to-Speech)
 */
export function speak(text: string, config: Partial<VoiceConfig> = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    const mergedConfig = { ...defaultConfig, ...config };
    const apiKey = mergedConfig.apiKey || ELEVENLABS_API_KEY;
    
    if (!apiKey) {
      // Fallback to Web Speech API if no API key
      console.warn('ElevenLabs API key not configured, falling back to Web Speech API');
      speakWithWebSpeechAPI(text, config).then(resolve).catch(reject);
      return;
    }
    
    // Call ElevenLabs TTS API
    fetch(`${ELEVENLABS_API_URL}/text-to-speech/${mergedConfig.voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`ElevenLabs API error: ${response.statusText}`);
        }
        return response.arrayBuffer();
      })
      .then((audioBuffer) => {
        // Create audio blob and play it
        const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Stop any existing audio
        if (currentAudio) {
          currentAudio.pause();
          currentAudio = null;
        }

        currentAudio = new Audio(audioUrl);
        currentAudio.volume = mergedConfig.volume;
        
        currentAudio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          currentAudio = null;
          resolve();
        };

        currentAudio.onerror = (error) => {
          URL.revokeObjectURL(audioUrl);
          currentAudio = null;
          reject(new Error(`Audio playback error: ${error}`));
        };

        currentAudio.play().catch((error) => {
          URL.revokeObjectURL(audioUrl);
          currentAudio = null;
          reject(new Error(`Failed to play audio: ${error.message}`));
        });
      })
      .catch((error) => {
        console.error('ElevenLabs TTS error:', error);
        reject(error);
      });
  });
}

/**
 * Fallback to Web Speech API if ElevenLabs is not available
 */
function speakWithWebSpeechAPI(text: string, config: Partial<VoiceConfig> = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('Speech Synthesis API not supported'));
      return;
    }

    window.speechSynthesis.cancel();
    const mergedConfig = { ...defaultConfig, ...config };
    const utterance = new SpeechSynthesisUtterance(text);
    
    utterance.lang = mergedConfig.language;
    utterance.rate = mergedConfig.rate;
    utterance.pitch = mergedConfig.pitch;
    utterance.volume = mergedConfig.volume;

    utterance.onend = () => {
      resolve();
    };

    utterance.onerror = (event) => {
      reject(new Error(`Speech synthesis error: ${event.error}`));
    };

    window.speechSynthesis.speak(utterance);
  });
}

/**
 * Stop current speech
 */
export function stopSpeaking(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Check if currently speaking
 */
export function isSpeaking(): boolean {
  return (currentAudio !== null && !currentAudio.paused) || (window.speechSynthesis?.speaking || false);
}

/**
 * Start listening for speech using Web Speech API (Speech-to-Text)
 */
export function startListening(
  onResult: (transcript: string, isFinal: boolean) => void,
  onError: (error: string) => void
): () => void {
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    onError('Speech Recognition API not supported');
    return () => {};
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onstart = () => {
    isListening = true;
  };

  recognition.onresult = (event: any) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript + ' ';
      } else {
        interimTranscript += transcript;
      }
    }

    if (finalTranscript) {
      onResult(finalTranscript.trim(), true);
    } else if (interimTranscript) {
      onResult(interimTranscript, false);
    }
  };

  recognition.onerror = (event: any) => {
    onError(`Speech recognition error: ${event.error}`);
  };

  recognition.onend = () => {
    isListening = false;
  };

  recognition.start();

  // Return stop function
  return () => {
    isListening = false;
    recognition.stop();
  };
}

/**
 * Check if currently listening
 */
export function isCurrentlyListening(): boolean {
  return isListening;
}

/**
 * Get available voices
 */
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (!('speechSynthesis' in window)) {
    return [];
  }
  return window.speechSynthesis.getVoices();
}
