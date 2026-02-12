// @ts-nocheck
// @ts-ignore - Deno remote import in Supabase Edge Functions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { agentId } = await req.json();
    
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      console.error("ELEVENLABS_API_KEY is not configured");
      throw new Error("Voice service is not configured");
    }

    // If agentId is provided, get a conversation token for that agent
    // Otherwise, we'll return signed URL for WebSocket connection
    const url = agentId 
      ? `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${agentId}`
      : `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url`;

    const response = await fetch(url, {
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API error:", response.status, errorText);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const data = await response.json();
    
    return new Response(JSON.stringify({ 
      signed_url: data.signed_url,
      token: data.token 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in elevenlabs-conversation-token function:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "An unexpected error occurred" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
