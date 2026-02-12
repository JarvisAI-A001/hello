import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContentRequest {
  prompt: string;
  platforms: string[];
  industry: string;
  businessName: string;
  brandVoice: string;
  marketingGoal: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, platforms, industry, businessName, brandVoice, marketingGoal } = await req.json() as ContentRequest;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("AI service is not configured");
    }

    console.log("Generating social content for:", { prompt, platforms, industry, brandVoice });

    const systemPrompt = `You are a social media marketing expert. Generate engaging social media content based on user prompts.

Your task:
1. Take the user's rough idea and transform it into polished, platform-optimized captions
2. Generate relevant hashtags that match the content and industry
3. Suggest a call-to-action based on the marketing goal
4. Recommend visual content ideas

Platform-specific rules:
- TikTok: Short hooks, trend-based, casual, use trending sounds references
- Instagram: Emojis welcome, 20-30 hashtags, reels-friendly, engaging
- X (Twitter): Short, punchy, no emojis, max 280 chars, 2-3 hashtags
- LinkedIn: Professional, no emojis, thought leadership tone, 3-5 hashtags
- Facebook: Casual but informative, questions encouraged, 5-10 hashtags

Brand voice: ${brandVoice}
Industry: ${industry}
Business: ${businessName}
Marketing goal: ${marketingGoal}

Respond with a JSON object in this exact format:
{
  "posts": [
    {
      "platform": "platform_name",
      "caption": "The polished caption with proper formatting",
      "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3"],
      "cta": "Call to action text",
      "visualSuggestion": "Description of recommended visual",
      "bestTime": "Best posting time"
    }
  ]
}

Generate one post per platform requested. Make the captions engaging, on-brand, and ready to post.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Create social media posts for these platforms: ${platforms.join(", ")}\n\nUser's idea: "${prompt}"` }
        ],
        temperature: 0.8,
        max_tokens: 2048,
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
    const content = data.choices?.[0]?.message?.content || "";
    
    console.log("AI response:", content);

    // Parse the JSON from the response
    let posts = [];
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        posts = parsed.posts || [];
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Fallback: generate basic content
      posts = platforms.map(platform => ({
        platform,
        caption: prompt,
        hashtags: ["#business", "#marketing", "#content"],
        cta: "Learn more!",
        visualSuggestion: "Use a high-quality image",
        bestTime: "12pm"
      }));
    }

    return new Response(JSON.stringify({ posts }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in generate-social-content function:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "An unexpected error occurred" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
