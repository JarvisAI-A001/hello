import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface BotConfig {
  name: string;
  tone: string;
  typing_speed: string;
  behavior_rules: string[];
  business_name: string;
  industry: string;
  services: string;
  contact_info: string;
  payment_methods: string;
  locations: string;
  faqs: string;
  policies: string;
  tags: string[];
  greeting_message: string;
  primary_color: string;
  avatar_url: string;
  allowed_domains: string[];
  booking_enabled: boolean;
  booking_button_text: string;
  bot_plan_tier?: string | null;
  message_limit?: number | null;
  ai_model?: string | null;
  widget_style?: string | null;
  icon_style?: string | null;
  background_style?: string | null;
  suggested_questions?: string[] | null;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const url = new URL(req.url);
    const botId = url.searchParams.get('botId');
    const sessionId = url.searchParams.get('sessionId');
    const action = url.searchParams.get('action');

    // Validate origin for security (if allowed_domains is set)
    const origin = req.headers.get('origin') || req.headers.get('referer') || '';

    // Handle heartbeat action - update session activity to keep it "live"
    if (action === 'heartbeat' && sessionId) {
      const { error } = await supabase
        .from('chat_sessions')
        .update({ 
          last_activity_at: new Date().toISOString(),
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) {
        console.error("Heartbeat error:", error);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle disconnect action - mark session as ended
    if (action === 'disconnect' && sessionId) {
      const { error } = await supabase
        .from('chat_sessions')
        .update({ 
          status: 'ended',
          ended_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) {
        console.error("Disconnect error:", error);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!botId) {
      console.error("Missing botId parameter");
      return new Response(JSON.stringify({ error: "Missing botId parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch bot configuration
    const { data: bot, error: botError } = await supabase
      .from('bots')
      .select('*')
      .eq('bot_id', botId)
      .eq('is_active', true)
      .single();

    if (botError || !bot) {
      console.error("Bot not found:", botError);
      return new Response(JSON.stringify({ error: "Bot not found or inactive" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check domain restrictions (if configured)
    if (bot.allowed_domains && bot.allowed_domains.length > 0) {
      const isAllowed = bot.allowed_domains.some((domain: string) => 
        origin.includes(domain) || domain === '*'
      );
      if (!isAllowed) {
        console.error("Domain not allowed:", origin);
        return new Response(JSON.stringify({ error: "Domain not authorized" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const resolveModel = (model?: string | null) => {
      const key = (model || "gemini").toLowerCase();
      switch (key) {
        case "chatgpt":
          return "openai/gpt-4o-mini";
        case "grok":
          return "xai/grok-2-latest";
        case "deepseek":
          return "deepseek/deepseek-chat";
        case "gemini":
        default:
          return "google/gemini-2.5-flash";
      }
    };

    // Handle GET request - return bot config for widget initialization
    if (req.method === 'GET') {
      console.log("Returning bot config for:", bot.name);
      
      // Create a new chat session for analytics
      const visitorId = 'visitor-' + Math.random().toString(36).substring(2, 10);
      const { data: session, error: sessionError } = await supabase
        .from('chat_sessions')
        .insert({
          bot_id: botId,
          visitor_id: visitorId,
          location: 'Unknown', // Will be updated by frontend if available
          status: 'active',
          last_activity_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (sessionError) {
        console.error("Error creating session:", sessionError);
      }

      // Update analytics
      const today = new Date().toISOString().split('T')[0];
      try {
        await supabase
          .from('bot_analytics')
          .upsert(
            { bot_id: botId, date: today, total_users: 1, total_chats: 1 },
            { onConflict: 'bot_id,date' }
          );
      } catch (e) {
        console.error("Analytics update error:", e);
      }

      return new Response(JSON.stringify({
        name: bot.name,
        greeting_message: bot.greeting_message,
        primary_color: bot.primary_color,
        avatar_url: bot.avatar_url,
        business_name: bot.business_name,
        booking_enabled: bot.booking_enabled,
        booking_button_text: bot.booking_button_text,
        bot_plan_tier: bot.bot_plan_tier,
        message_limit: bot.message_limit,
        ai_model: bot.ai_model,
        widget_style: bot.widget_style,
        icon_style: bot.icon_style,
        background_style: bot.background_style,
        suggested_questions: bot.suggested_questions || [],
        session_id: session?.id || null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle POST request - process chat message
    if (req.method === 'POST') {
      const { message, conversationHistory = [], sessionId: bodySessionId, location } = await req.json() as {
        message: string;
        conversationHistory: ChatMessage[];
        sessionId?: string;
        location?: string;
      };

      const activeSessionId = bodySessionId || sessionId;

      if (!message) {
        return new Response(JSON.stringify({ error: "Message is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const messageLimit = bot.message_limit;
      const hasLimit = messageLimit !== null && messageLimit !== undefined && messageLimit > 0;
      if (activeSessionId && hasLimit) {
        const { count, error: countError } = await supabase
          .from('chat_messages')
          .select('id', { count: 'exact', head: true })
          .eq('session_id', activeSessionId)
          .eq('role', 'user');

        if (countError) {
          console.error("Message count error:", countError);
        } else if ((count ?? 0) >= messageLimit) {
          return new Response(JSON.stringify({ 
            error: "Message limit reached for this chat.",
            code: "MESSAGE_LIMIT_REACHED",
            limit: messageLimit,
          }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // Log user message to database
      if (activeSessionId) {
        await supabase.from('chat_messages').insert({
          session_id: activeSessionId,
          role: 'user',
          content: message,
        });

        // Update session activity with last_activity_at
        await supabase
          .from('chat_sessions')
          .update({ 
            updated_at: new Date().toISOString(), 
            last_activity_at: new Date().toISOString(),
            status: 'active',
            location: location || 'Unknown'
          })
          .eq('id', activeSessionId);
      }

      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) {
        console.error("LOVABLE_API_KEY is not configured");
        throw new Error("AI service is not configured");
      }

      // Build system prompt from bot configuration
      const systemPrompt = buildSystemPrompt(bot);
      console.log("Processing chat for bot:", bot.name);
      console.log("User message:", message);

      const messages = [
        { role: "system", content: systemPrompt },
        ...conversationHistory.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        })),
        { role: "user", content: message }
      ];

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: resolveModel(bot.ai_model),
          messages,
          temperature: 0.7,
          max_tokens: 1024,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI gateway error:", response.status, errorText);
        
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "Service temporarily unavailable." }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        throw new Error(`AI service error: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage = data.choices?.[0]?.message?.content || "I apologize, but I couldn't generate a response.";

      console.log("AI response generated successfully");

      // Log bot response to database
      if (activeSessionId) {
        await supabase.from('chat_messages').insert({
          session_id: activeSessionId,
          role: 'bot',
          content: assistantMessage,
        });

        // Update session activity after bot response
        await supabase
          .from('chat_sessions')
          .update({ 
            last_activity_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', activeSessionId);

        // Update analytics for message count
        const today = new Date().toISOString().split('T')[0];
        try {
          await supabase
            .from('bot_analytics')
            .upsert(
              { bot_id: botId, date: today, total_messages: 1 },
              { onConflict: 'bot_id,date' }
            );
        } catch (e) {
          console.error("Analytics update error:", e);
        }
      }

      return new Response(JSON.stringify({ response: assistantMessage }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in widget-bot function:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "An unexpected error occurred" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function buildSystemPrompt(config: BotConfig): string {
  const toneDescriptions: Record<string, string> = {
    friendly: "warm, approachable, and helpful with a conversational tone",
    professional: "business-like, clear, and efficient while remaining courteous",
    formal: "very structured, official, and respectful in all communications",
    casual: "relaxed, easygoing, and conversational like talking to a friend",
    humorous: "witty, light-hearted, and entertaining while still being helpful"
  };

  let prompt = `You are ${config.name || 'an AI assistant'}`;
  
  if (config.business_name) {
    prompt += ` for ${config.business_name}`;
  }
  
  if (config.industry) {
    prompt += ` in the ${config.industry} industry`;
  }
  
  prompt += `.

## Personality & Tone
You speak in a ${toneDescriptions[config.tone] || 'professional'} manner.`;

  if (config.behavior_rules && config.behavior_rules.length > 0) {
    prompt += `

## Behavior Guidelines
You must follow these rules strictly:
${config.behavior_rules.map((rule, i) => `${i + 1}. ${rule}`).join('\n')}`;
  }

  prompt += `

## Business Knowledge`;

  if (config.services) {
    prompt += `

### Services Offered
${config.services}`;
  }

  if (config.contact_info) {
    prompt += `

### Contact Information
${config.contact_info}`;
  }

  if (config.payment_methods) {
    prompt += `

### Payment Methods Accepted
${config.payment_methods}`;
  }

  if (config.locations) {
    prompt += `

### Locations
${config.locations}`;
  }

  if (config.faqs) {
    prompt += `

### Frequently Asked Questions
${config.faqs}`;
  }

  if (config.policies) {
    prompt += `

### Policies
${config.policies}`;
  }

  prompt += `

## General Instructions
- Answer questions based on the knowledge provided above
- If you don't have specific information about something, politely say so and offer to help with what you do know
- Stay in character as ${config.name || 'the AI assistant'} at all times
- Be helpful and aim to resolve the user's query efficiently
- If asked about topics outside your knowledge, guide the conversation back to what you can help with`;

  return prompt;
}
