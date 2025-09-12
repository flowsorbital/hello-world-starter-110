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
    const signature = req.headers.get('elevenlabs-signature');
    const body = await req.text();
    
    // Verify HMAC signature using Web Crypto API
    const webhookSecret = Deno.env.get('ELEVENLABS_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.error('Webhook secret not configured:', webhookSecret);
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

    if (webhookData.type === 'post_call_transcription') {
      const conversationData = webhookData.data;

      // New Logic: Find the correct user_id from our database using the recipient ID.
      const { data: recipientRecord, error: recipientError } = await supabase
        .from('recipients')
        .select('user_id, elevenlabs_recipient_id, elevenlabs_batch_id')
        .eq('elevenlabs_recipient_id', conversationData.batch_call.batch_call_recipient_id)
        .single();

      if (recipientError || !recipientRecord) {
        console.error('Error fetching recipient record or recipient not found:', recipientError);
        return new Response(JSON.stringify({ error: 'Recipient record not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const userId = recipientRecord.user_id;

      // Step 1: Upsert the conversation record.
      const { error: conversationUpsertError } = await supabase
        .from('conversations')
        .upsert({
          user_id: userId,
          conversation_id: conversationData.conversation_id,
          agent_id: conversationData.agent_id,
          phone_number: conversationData.phone_number,
          contact_name: conversationData.contact_name || null,
          status: conversationData.status,
          call_successful: conversationData.analysis?.call_successful || null,
          call_duration_secs: conversationData.metadata?.call_duration_secs || 0,
          total_cost: conversationData.metadata?.cost || 0,
          start_time_unix: conversationData.metadata?.start_time_unix_secs || null,
          accepted_time_unix: conversationData.metadata?.accepted_time_unix_secs || null,
          conversation_summary: conversationData.analysis?.transcript_summary || null,
          analysis: conversationData.analysis || {},
          metadata: conversationData.metadata || {},
          has_audio: conversationData.has_audio || false,
          elevenlabs_batch_id: conversationData.batch_call?.batch_call_id || null,
          recipient_id: conversationData.batch_call?.batch_call_recipient_id || null
        }, { onConflict: 'conversation_id' });

      if (conversationUpsertError) {
        console.error('Error saving or updating conversation:', conversationUpsertError);
      } else {
        console.log('Conversation saved successfully');

        // Step 2: Insert each transcript entry into the new transcripts table
        const transcriptEntries = conversationData.transcript.map((turn) => ({
            conversation_id: conversationData.conversation_id,
            role: turn.role,
            message: turn.message,
            time_in_call_secs: turn.time_in_call_secs
        }));

        const { error: transcriptInsertError } = await supabase
            .from('transcripts')
            .insert(transcriptEntries);

        if (transcriptInsertError) {
            console.error('Error inserting transcripts:', transcriptInsertError);
        } else {
            console.log('Transcripts saved successfully');
        }

        // Step 3: Update the recipient record to link it to the conversation.
        const { error: recipientUpdateError } = await supabase
          .from('recipients')
          .update({
            elevenlabs_conversation_id: conversationData.conversation_id,
            status: conversationData.status,
            updated_at: new Date().toISOString()
          })
          .eq('elevenlabs_recipient_id', recipientRecord.elevenlabs_recipient_id);

        if (recipientUpdateError) {
          console.error('Error updating recipient with conversation ID:', recipientUpdateError);
        } else {
          console.log('Recipient updated with conversation ID successfully');
        }
      }
    } else if (webhookData.type === 'batch_status_update') {
      // Handle batch status updates
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
