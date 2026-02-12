import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface MagicFillRequest {
  websiteUrl: string;
}

interface MagicFillResponse {
  success: boolean;
  data?: {
    businessName: string;
    industry: string;
    services: string;
    faqs: string;
    contactInfo: string;
    locations: string;
  };
  error?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { websiteUrl } = await req.json() as MagicFillRequest;

    if (!websiteUrl) {
      return new Response(
        JSON.stringify({ success: false, error: 'Website URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate URL
    let formattedUrl = websiteUrl.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    if (!FIRECRAWL_API_KEY) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Scraping website for Magic Fill:', formattedUrl);

    // Step 1: Crawl the website using Firecrawl (multi-page), fallback to single-page scrape
    let websiteContent = '';
    let metadata: Record<string, unknown> = {};
    let crawledUrls: string[] = [];

    const crawlResponse = await fetch('https://api.firecrawl.dev/v1/crawl', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: formattedUrl,
        limit: 8,
        scrapeOptions: {
          formats: ['markdown'],
          onlyMainContent: true,
        },
      }),
    });

    const crawlData = await crawlResponse.json();

    if (crawlResponse.ok && crawlData?.success) {
      const pages = crawlData.data || crawlData.pages || [];
      const markdownChunks: string[] = [];
      pages.forEach((page: Record<string, unknown>) => {
        const pageMarkdown = (page as { markdown?: string }).markdown || '';
        const pageMetadata = (page as { metadata?: Record<string, unknown> }).metadata || {};
        const pageUrl = (page as { url?: string }).url || (page as { metadata?: { url?: string } }).metadata?.url;
        if (pageUrl) crawledUrls.push(pageUrl);
        if (pageMarkdown) markdownChunks.push(pageMarkdown);
        if (!metadata.title && pageMetadata?.title) {
          metadata = pageMetadata;
        }
      });
      websiteContent = markdownChunks.join('\n\n');
    } else {
      console.warn('Firecrawl crawl failed, falling back to scrape:', crawlData);
      const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: formattedUrl,
          formats: ['markdown'],
          onlyMainContent: true,
        }),
      });

      const scrapeData = await scrapeResponse.json();

      if (!scrapeResponse.ok || !scrapeData.success) {
        console.error('Firecrawl scrape error:', scrapeData);
        return new Response(
          JSON.stringify({ success: false, error: scrapeData.error || 'Failed to scrape website' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      websiteContent = scrapeData.data?.markdown || '';
      metadata = scrapeData.data?.metadata || {};
    }

    console.log('Scraped content length:', websiteContent.length);
    if (crawledUrls.length > 0) {
      console.log('Crawled URLs:', crawledUrls.join(', '));
    }
    console.log('Metadata:', JSON.stringify(metadata));

    // Step 2: Use Lovable AI to extract structured business info
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const extractionPrompt = `Analyze the following multi-page website content and extract business information. Return a JSON object with these fields:

- businessName: The company/business name
- industry: The industry category (e.g., "tech", "healthcare", "retail", "hospitality", "education", "banking", "other")
- services: A detailed list of services/products offered (formatted nicely with bullet points or line breaks)
- faqs: Common Q&A pairs you can infer from the content (format as "Q: question\nA: answer" pairs)
- contactInfo: Any contact information found (email, phone, address)
- locations: Business locations if mentioned

If you can't find specific information, provide reasonable defaults or leave as empty string.

Website content:
${websiteContent.slice(0, 30000)}

Respond ONLY with a valid JSON object, no markdown formatting.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that extracts structured business information from website content. Always respond with valid JSON only.' },
          { role: 'user', content: extractionPrompt }
        ],
        temperature: 0.3,
        max_tokens: 2048,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI service error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || '{}';

    console.log('AI extraction result:', aiContent);

    // Parse the AI response
    let extractedData;
    try {
      // Clean up potential markdown code blocks
      const cleanedContent = aiContent
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();
      extractedData = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback to basic extraction from metadata
      extractedData = {
        businessName: metadata.title || '',
        industry: 'other',
        services: metadata.description || '',
        faqs: '',
        contactInfo: '',
        locations: '',
      };
    }

    const response: MagicFillResponse = {
      success: true,
      data: {
        businessName: extractedData.businessName || metadata.title || '',
        industry: extractedData.industry || 'other',
        services: extractedData.services || '',
        faqs: extractedData.faqs || '',
        contactInfo: extractedData.contactInfo || '',
        locations: extractedData.locations || '',
      },
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in magic-fill function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
