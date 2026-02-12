// @ts-nocheck
// @ts-ignore - Deno remote imports in Supabase Edge Functions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
// @ts-ignore - Deno remote imports in Supabase Edge Functions
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Minimal Deno type shim for editor tooling without Deno extension
declare const Deno: {
  env: {
    get: (key: string) => string | undefined;
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BotConfig {
  name: string;
  tone: string;
  businessName: string;
  industry: string;
  services: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voiceId, botConfig, botId } = await req.json() as {
      text: string;
      voiceId?: string;
      botConfig?: BotConfig;
      botId?: string;
    };

    let elevenlabsKey = Deno.env.get("ELEVENLABS_API_KEY") || undefined;

    if (botId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (supabaseUrl && serviceKey) {
        const supabase = createClient(supabaseUrl, serviceKey);
        const { data } = await supabase
          .from("bots")
          .select("elevenlabs_api_key")
          .eq("bot_id", botId)
          .maybeSingle();
        if (data?.elevenlabs_api_key) {
          elevenlabsKey = data.elevenlabs_api_key;
        }
      }
    }

    if (!elevenlabsKey) {
      console.error("ELEVENLABS_API_KEY is not configured");
      throw new Error("Voice service is not configured");
    }

    // Use a default high-quality voice
    const selectedVoiceId = voiceId || "EXAVITQu4vr4xnSDxMaL"; // Sarah - professional female voice

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": elevenlabsKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_turbo_v2_5",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.3,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs TTS error:", response.status, errorText);
      throw new Error(`Voice synthesis error: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = base64Encode(audioBuffer);

    return new Response(JSON.stringify({ audioContent: base64Audio }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in voice-chat function:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "An unexpected error occurred" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
