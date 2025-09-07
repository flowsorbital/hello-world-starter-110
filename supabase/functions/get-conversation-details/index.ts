import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    
    const elevenlabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
    
    if (!elevenlabsApiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    console.log('Fetching conversation details for:', conversationId);

    const response = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`, {
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

    const conversationData = await response.json();
    console.log('Successfully fetched conversation details');

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Store conversation details in database
    const { data, error } = await supabase
      .from('conversations')
      .upsert({
        conversation_id: conversationData.conversation_id,
        agent_id: conversationData.agent_id,
        phone_number: conversationData.metadata?.phone_call?.phone_number || null,
        status: conversationData.status,
        call_successful: conversationData.analysis?.call_successful || null,
        call_duration_secs: conversationData.metadata?.call_duration_secs || 0,
        total_cost: conversationData.metadata?.charging?.call_charge || 0,
        start_time_unix: conversationData.metadata?.start_time_unix,
        accepted_time_unix: conversationData.metadata?.accepted_time_unix,
        transcript: conversationData.transcript,
        metadata: conversationData.metadata,
        analysis: conversationData.analysis,
        conversation_summary: conversationData.analysis?.transcript_summary || null,
        has_audio: conversationData.has_audio || false,
      }, {
        onConflict: 'conversation_id'
      });

    if (error) {
      console.error('Error storing conversation:', error);
    }

    return new Response(JSON.stringify(conversationData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in get-conversation-details function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});