import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("get conv audio Function started.");
    const { conversationId } = await req.json();

    if (!conversationId) {
      console.error("Error: Missing conversationId");
      return new Response(JSON.stringify({ error: "conversationId is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`Received request for conversation ID: ${conversationId}`);

    // Get the ElevenLabs API key from a Supabase Secret
    const elevenLabsApiKey = Deno.env.get("ELEVENLABS_API_KEY");

    if (!elevenLabsApiKey) {
      console.error("Error: ElevenLabs API key not configured");
      return new Response(JSON.stringify({ error: "ElevenLabs API key not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const elevenLabsResponse = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${conversationId}/audio`, {
      method: 'GET',
      headers: {
        'xi-api-key': elevenLabsApiKey,
      },
    });

    console.log(`ElevenLabs API response status: ${elevenLabsResponse.status}`);

    if (!elevenLabsResponse.ok) {
      const errorText = await elevenLabsResponse.text();
      console.error(`ElevenLabs API error: ${elevenLabsResponse.status} - ${errorText}`);
      return new Response(JSON.stringify({ error: `Failed to fetch audio from ElevenLabs: ${elevenLabsResponse.statusText}` }), {
        status: elevenLabsResponse.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!elevenLabsResponse.body) {
      console.error("Error: ElevenLabs response body is null or undefined.");
      return new Response(JSON.stringify({ error: "No audio stream available." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Return the audio stream directly to the client
    console.log("Streaming audio to client.");
    return new Response(elevenLabsResponse.body, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
        "Content-Disposition": `attachment; filename="conversation_${conversationId}.mp3"`,
      },
    });

  } catch (error: any) {
    console.error("Edge function error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
