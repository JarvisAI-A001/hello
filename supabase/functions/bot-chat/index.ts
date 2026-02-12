import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BotConfig {
  name: string;
  tone: string;
  typingSpeed: string;
  behaviorRules: string[];
  businessName: string;
  industry: string;
  services: string;
  contactInfo: string;
  paymentMethods: string;
  locations: string;
  faqs: string;
  policies: string;
  tags: string[];
  aiModel?: string;
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

  try {
    const { message, botConfig, conversationHistory } = await req.json() as {
      message: string;
      botConfig: BotConfig;
      conversationHistory: ChatMessage[];
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("AI service is not configured");
    }

    // Build the system prompt from bot configuration
    const systemPrompt = buildSystemPrompt(botConfig);

    console.log("Bot config received:", JSON.stringify(botConfig, null, 2));
    console.log("System prompt:", systemPrompt);
    console.log("User message:", message);

    // Prepare messages for the API
    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: "user", content: message }
    ];

    const resolveModel = (model?: string) => {
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

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: resolveModel(botConfig.aiModel),
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
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI service error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content || "I apologize, but I couldn't generate a response.";

    console.log("AI response:", assistantMessage);

    return new Response(JSON.stringify({ response: assistantMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in bot-chat function:", error);
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
  
  if (config.businessName) {
    prompt += ` for ${config.businessName}`;
  }
  
  if (config.industry) {
    prompt += ` in the ${config.industry} industry`;
  }
  
  prompt += `.

## Personality & Tone
You speak in a ${toneDescriptions[config.tone] || 'professional'} manner.`;

  // Add behavior rules
  if (config.behaviorRules && config.behaviorRules.length > 0) {
    prompt += `

## Behavior Guidelines
You must follow these rules strictly:
${config.behaviorRules.map((rule, i) => `${i + 1}. ${rule}`).join('\n')}`;
  }

  // Add business knowledge
  prompt += `

## Business Knowledge`;

  if (config.services) {
    prompt += `

### Services Offered
${config.services}`;
  }

  if (config.contactInfo) {
    prompt += `

### Contact Information
${config.contactInfo}`;
  }

  if (config.paymentMethods) {
    prompt += `

### Payment Methods Accepted
${config.paymentMethods}`;
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

  // Add general instructions
  prompt += `

## General Instructions
- Answer questions based on the knowledge provided above
- If you don't have specific information about something, politely say so and offer to help with what you do know
- Stay in character as ${config.name || 'the AI assistant'} at all times
- Be helpful and aim to resolve the user's query efficiently
- If asked about topics outside your knowledge, guide the conversation back to what you can help with`;

  return prompt;
}
