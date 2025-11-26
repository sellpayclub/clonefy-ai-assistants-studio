import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, assistantId } = await req.json();
    
    if (!url || !assistantId) {
      return new Response(JSON.stringify({ error: 'URL and assistantId are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Web Scraper - Processing URL: ${url} for assistant: ${assistantId}`);

    // Fetch the webpage
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }

    const html = await response.text();

    // Simple HTML to text extraction (remove scripts, styles, etc.)
    let text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Limit text length to avoid token limits (keep first 50000 characters)
    if (text.length > 50000) {
      text = text.substring(0, 50000) + '... [conteúdo truncado]';
    }

    // Get user from assistant
    const { data: assistant } = await supabase
      .from('assistants')
      .select('user_id')
      .eq('id', assistantId)
      .single();

    if (!assistant) {
      throw new Error('Assistant not found');
    }

    // Create a text file from the scraped content
    const fileName = `scraped-${Date.now()}.txt`;
    const fileContent = `Conteúdo extraído de: ${url}\n\n${text}`;
    
    // Convert to bytes for OpenAI upload
    const encoder = new TextEncoder();
    const fileBytes = encoder.encode(fileContent);
    
    // Upload to OpenAI directly
    const formData = new FormData();
    const fileBlob = new Blob([fileBytes], { type: 'text/plain' });
    formData.append('file', fileBlob, fileName);
    formData.append('purpose', 'assistants');

    const openaiResponse = await fetch('https://api.openai.com/v1/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: formData
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.json();
      throw new Error(`OpenAI API error: ${error.error?.message || 'Failed to upload file'}`);
    }

    const fileData = await openaiResponse.json();

    // Save to Supabase Storage
    const storageFileName = `${assistant.user_id}/${assistantId}/${Date.now()}-${fileName}`;
    const storageBlob = new Blob([fileContent], { type: 'text/plain' });
    const { error: storageError } = await supabase.storage
      .from('assistant-knowledge')
      .upload(storageFileName, storageBlob);

    if (storageError) {
      console.error('Storage error:', storageError);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('assistant-knowledge')
      .getPublicUrl(storageFileName);

    // Save metadata to database
    const { error: dbError } = await supabase
      .from('assistant_knowledge_files')
      .insert({
        assistant_id: assistantId,
        user_id: assistant.user_id,
        file_name: fileName,
        file_url: publicUrl,
        openai_file_id: fileData.id,
        file_size: fileBytes.length,
        mime_type: 'text/plain',
        description: `Conteúdo extraído de: ${url}`,
      });

    if (dbError) {
      console.error('Database error:', dbError);
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'URL processed successfully',
      fileId: fileData.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in web-scraper function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

