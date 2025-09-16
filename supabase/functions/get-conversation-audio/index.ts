import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { conversationId } = await req.json();
    
    if (!conversationId) {
      throw new Error('Conversation ID is required');
    }
    
    const elevenlabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
    
    if (!elevenlabsApiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    console.log('Fetching audio for conversation:', conversationId);

    const response = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${conversationId}/audio`, {
      method: 'GET',
      headers: {
        'xi-api-key': elevenlabsApiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    // Get the audio as array buffer
    const audioBuffer = await response.arrayBuffer();
    
    // Convert to base64 for safe transport
    const audioBase64 = btoa(
      String.fromCharCode(...new Uint8Array(audioBuffer))
    );

    console.log('Successfully fetched audio, size:', audioBuffer.byteLength, 'bytes');

    return new Response(JSON.stringify({ 
      audioContent: audioBase64,
      size: audioBuffer.byteLength
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in get-conversation-audio function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});