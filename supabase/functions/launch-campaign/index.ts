import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { campaignId, callName, agentId, phoneNumberId, scheduledTimeUnix, recipients } = await req.json();
    
    const elevenlabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
    
    if (!elevenlabsApiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Launching campaign with data:', {
      call_name: callName,
      agent_id: agentId,
      agent_phone_number_id: phoneNumberId,
      scheduled_time_unix: scheduledTimeUnix,
      recipients: recipients
    });

    const response = await fetch('https://api.elevenlabs.io/v1/convai/batch-calling/submit', {
      method: 'POST',
      headers: {
        'xi-api-key': elevenlabsApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        call_name: callName,
        agent_id: agentId,
        agent_phone_number_id: phoneNumberId,
        scheduled_time_unix: scheduledTimeUnix,
        recipients: recipients.map((phone: string) => ({ phone_number: phone }))
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Campaign launched successfully:', result);

    // Update campaign status in database
    const { error: updateError } = await supabase
      .from('campaigns')
      .update({
        status: 'Launched',
        launched_at: new Date().toISOString()
      })
      .eq('id', campaignId);

    if (updateError) {
      console.error('Error updating campaign status:', updateError);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in launch-campaign function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});