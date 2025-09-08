import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-elevenlabs-signature',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get('x-elevenlabs-signature');
    const body = await req.text();
    
    // Verify HMAC signature using Web Crypto API
    const webhookSecret = Deno.env.get('ELEVENLABS_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new Error('Webhook secret not configured');
    }

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(webhookSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature_bytes = await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(body)
    );

    const expectedSignature = Array.from(new Uint8Array(signature_bytes))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (signature !== `sha256=${expectedSignature}`) {
      console.error('Invalid webhook signature');
      return new Response('Unauthorized', { status: 401 });
    }

    const webhookData = JSON.parse(body);
    console.log('Received webhook:', webhookData);

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Save conversation data based on webhook type
    if (webhookData.type === 'conversation_ended') {
      const conversationData = webhookData.data;
      
      // Find the campaign and user based on conversation metadata
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('user_id')
        .eq('elevenlabs_agent_id', conversationData.agent_id)
        .single();

      if (campaign) {
        // Insert conversation record
        const { error: conversationError } = await supabase
          .from('conversations')
          .insert({
            user_id: campaign.user_id,
            conversation_id: conversationData.conversation_id,
            agent_id: conversationData.agent_id,
            phone_number: conversationData.phone_number,
            contact_name: conversationData.contact_name || null,
            status: conversationData.status,
            call_successful: conversationData.call_successful ? 'success' : 'failed',
            call_duration_secs: conversationData.call_duration_secs || 0,
            start_time_unix: conversationData.start_time_unix,
            accepted_time_unix: conversationData.accepted_time_unix,
            conversation_summary: conversationData.conversation_summary,
            transcript: conversationData.transcript || [],
            analysis: conversationData.analysis || {},
            metadata: conversationData.metadata || {},
            has_audio: conversationData.has_audio || false,
            total_cost: conversationData.total_cost || 0
          });

        if (conversationError) {
          console.error('Error saving conversation:', conversationError);
        } else {
          console.log('Conversation saved successfully');
        }
      }
    }

    // Handle batch status updates
    if (webhookData.type === 'batch_status_update') {
      const batchData = webhookData.data;
      
      const { error: batchError } = await supabase
        .from('batch_calls')
        .update({
          status: batchData.status,
          total_calls_dispatched: batchData.total_calls_dispatched,
          last_updated_at_unix: batchData.last_updated_at_unix,
        })
        .eq('batch_id', batchData.batch_id);

      if (batchError) {
        console.error('Error updating batch status:', batchError);
      } else {
        console.log('Batch status updated successfully');
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in eleven-labs-webhook function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});