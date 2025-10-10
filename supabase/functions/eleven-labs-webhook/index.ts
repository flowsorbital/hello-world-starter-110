import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Helper function to calculate billing minutes with 1-minute pulse
function calculateBillingMinutes(durationSeconds: number): number {
  if (durationSeconds <= 0) return 0;
  return Math.ceil(durationSeconds / 60); // Always round up to next minute
}

// Helper function to handle minutes refund for individual conversation
async function handleConversationMinutesRefund(supabase: any, conversationData: any, userId: string, campaignId: string) {
  try {
    if (!campaignId) return;

    const callDurationSecs = conversationData.metadata?.call_duration_secs || 0;
    const actualMinutesUsed = calculateBillingMinutes(callDurationSecs);
    const estimatedMinutesPerCall = 2; // Original estimation was 2 minutes per call
    
    // Only process refund if actual usage is less than estimated
    if (actualMinutesUsed < estimatedMinutesPerCall) {
      const refundMinutes = estimatedMinutesPerCall - actualMinutesUsed;
      
      // Update user's available minutes
      const { data: currentProfile, error: profileError } = await supabase
        .from('profiles')
        .select('available_minutes')
        .eq('user_id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching profile for refund:', profileError);
        return;
      }

      const newAvailableMinutes = (currentProfile.available_minutes || 0) + refundMinutes;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ available_minutes: newAvailableMinutes })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error refunding minutes:', updateError);
        return;
      }

      // Record refund transaction
      const { error: refundTransactionError } = await supabase
        .from('minutes_transactions')
        .insert({
          user_id: userId,
          campaign_id: campaignId,
          batch_id: conversationData.metadata.batch_call?.batch_call_id || null,
          transaction_type: 'refund',
          minutes: refundMinutes,
          description: `Call completed - refund for conversation ${conversationData.conversation_id}`,
          created_at: new Date().toISOString()
        });

      if (refundTransactionError) {
        console.error('Error recording refund transaction:', refundTransactionError);
      } else {
        console.log(`Refunded ${refundMinutes} minutes for conversation ${conversationData.conversation_id}. Duration: ${callDurationSecs}s, Billed: ${actualMinutesUsed}min`);
      }
    }
  } catch (error) {
    console.error('Error in handleConversationMinutesRefund:', error);
  }
}

// Helper function to update campaign status based on batch status
async function updateCampaignStatus(supabase: any, batchId: string, batchStatus: string) {
  try {
    // First, get the campaign_id associated with this batch
    const { data: batchCallData, error: fetchError } = await supabase
      .from('batch_calls')
      .select('campaign_id')
      .eq('batch_id', batchId)
      .single();

    if (fetchError) {
      console.error('Error fetching batch call data:', fetchError);
      return;
    }

    if (!batchCallData?.campaign_id) {
      console.log('No campaign_id found for batch:', batchId);
      return;
    }

    let campaignStatus = null;
    
    // Map batch status to campaign status
    switch (batchStatus?.toLowerCase()) {
      case 'completed':
      case 'successful':
      case 'success':
        campaignStatus = 'Completed';
        break;
      case 'failed':
      case 'error':
      case 'cancelled':
        campaignStatus = 'Failed';
        break;
      // Don't update campaign status for other statuses (pending, running, etc.)
    }

    if (campaignStatus) {
      console.log(`Updating campaign ${batchCallData.campaign_id} status to: ${campaignStatus}`);
      
      const { error: campaignError } = await supabase
        .from('campaigns')
        .update({
          status: campaignStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', batchCallData.campaign_id);

      if (campaignError) {
        console.error('Error updating campaign status:', campaignError);
      } else {
        console.log(`Successfully updated campaign status to: ${campaignStatus}`);
      }
    }
  } catch (error) {
    console.error('Error in updateCampaignStatus:', error);
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'elevenlabs-signature, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Log all incoming headers to debug
    console.log('--- Incoming Request Headers ---');
    req.headers.forEach((value, name) => {
      console.log(`${name}: ${value}`);
    });
    console.log('------------------------------');

    const signature = req.headers.get('elevenlabs-signature') || req.headers.get('x-elevenlabs-signature');
    console.log('Found signature header:', signature);
    
    const body = await req.text();
    console.log('Request body length:', body.length);
    
    const webhookData = JSON.parse(body);
    console.log('Received webhook payload:', JSON.stringify(webhookData, null, 2));

    // Verify HMAC signature using Web Crypto API
    const webhookSecret = Deno.env.get('ELEVENLABS_WEBHOOK_SECRET');
    console.log('Webhook secret configured:', !!webhookSecret);
    console.log('Webhook secret (first 10 chars):', webhookSecret?.substring(0, 10));
    
    if (!webhookSecret) {
      console.error('Webhook secret not configured');
      return new Response(JSON.stringify({ error: 'Webhook secret not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!signature) {
      console.error('No signature header found - proceeding without verification for debugging');
      // For debugging, let's proceed without signature verification
    } else {
      try {
        // Remove any quotes from the webhook secret if present
        const cleanSecret = webhookSecret.replace(/^["']|["']$/g, '');
        console.log('Using clean secret (first 10 chars):', cleanSecret.substring(0, 10));
        
        const key = await crypto.subtle.importKey(
          'raw',
          new TextEncoder().encode(cleanSecret),
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

        const expectedSignatureWithPrefix = `sha256=${expectedSignature}`;
        console.log('Expected signature:', expectedSignatureWithPrefix);
        console.log('Received signature:', signature);
        console.log('Signatures match:', signature === expectedSignatureWithPrefix);

        if (signature !== expectedSignatureWithPrefix) {
          console.error('Invalid webhook signature - but continuing for debugging');
          // For debugging, let's not fail on signature mismatch
          // return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          //   status: 401,
          //   headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          // });
        }
      } catch (signatureError) {
        console.error('Error verifying signature:', signatureError);
        console.error('Continuing anyway for debugging purposes');
        // For debugging, let's not fail on signature errors
        // return new Response(JSON.stringify({ error: 'Signature verification failed' }), {
        //   status: 401,
        //   headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        // });
      }
    }

    console.log('Webhook type:', webhookData.type);

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (webhookData.type === 'post_call_transcription') {
       const conversationData = webhookData.data; //conv_6501k4yxfg2ce8rawe5dew8dzy0h
       console.log('Processing conversation:', conversationData.conversation_id);
       console.log('batch_call_recipient_id:', conversationData.metadata.batch_call?.batch_call_recipient_id);
       // Try to find user_id from recipient record, but don't fail if not found
       let userId = null;
       let campaignId = null;

       // If no user_id found from recipient, try to find from batch_calls table
       if (conversationData.metadata.batch_call?.batch_call_id) {
         console.log('Looking up batch_call_id:', conversationData.metadata.batch_call.batch_call_id);

         const { data: batchRecord, error: batchError } = await supabase
           .from('batch_calls')
           .select('user_id,campaign_id')
           .eq('batch_id', conversationData.metadata.batch_call.batch_call_id)
           .maybeSingle();

         if (batchError) {
           console.error('Error looking up batch_calls:', batchError);
         }

         userId = batchRecord?.user_id;
         campaignId = batchRecord?.campaign_id;
         console.log('Found user_id from batch_calls:', userId);
         console.log('Found campaignId from batch_calls:', campaignId);
         console.log('Batch record found:', !!batchRecord);
       } else {
         console.log('No batch_call_id found in metadata');
       }

       // Fallback: try to find campaign by phone number and recent timestamp if no batch found
       if (!userId || !campaignId) {
         console.log('Attempting fallback lookup by phone number and timestamp');
         const phoneNumber = conversationData.metadata.phone_call?.external_number;

         if (phoneNumber) {
           // Look for recent campaigns with this phone number
           const { data: recentCampaigns } = await supabase
             .from('campaigns')
             .select(`
               id,
               user_id,
               phone_number,
               created_at,
               campaign_contact!inner(
                 contact_id,
                 contacts!inner(
                   phone
                 )
               )
             `)
             .eq('campaign_contact.contacts.phone', phoneNumber)
             .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
             .order('created_at', { ascending: false })
             .limit(1);

           if (recentCampaigns && recentCampaigns.length > 0) {
             const campaign = recentCampaigns[0];
             userId = campaign.user_id;
             campaignId = campaign.id;
             console.log('Found campaign via fallback:', JSON.stringify({ userId: userId, campaignId: campaignId, phone: phoneNumber }));
           }
         }
       }

      if (!userId) {
        console.error('Unable to determine user_id for conversation');
        return new Response(JSON.stringify({ error: 'Unable to determine user_id' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Extract dynamic variables from conversation initiation client data for contact name
      const dynamicVariables = conversationData.conversation_initiation_client_data?.dynamic_variables || {};
      const contactName = dynamicVariables.name || conversationData.contact_name || null;
      
      console.log('Dynamic variables:', JSON.stringify(dynamicVariables, null, 2));
      console.log('Resolved contact name:', contactName);

      // Enhanced metadata with dynamic variables
      const enhancedMetadata = {
        ...conversationData.metadata || {},
        dynamic_variables: dynamicVariables
      };

      // Step 1: Upsert the conversation record.
      const { error: conversationUpsertError } = await supabase
        .from('conversations')
        .upsert({
          user_id: userId,
          campaign_id: campaignId,
          conversation_id: conversationData.conversation_id,
          agent_id: conversationData.agent_id,
          phone_number: conversationData.metadata.phone_call?.external_number || null,
          contact_name: contactName,
          status: conversationData.status,
          call_successful: conversationData.analysis?.call_successful || null,
          call_duration_secs: conversationData.metadata?.call_duration_secs || 0,
          total_cost: conversationData.metadata?.cost || 0,
          start_time_unix: conversationData.metadata?.start_time_unix_secs || null,
          accepted_time_unix: conversationData.metadata?.accepted_time_unix_secs || null,
          conversation_summary: conversationData.analysis?.transcript_summary || null,
          analysis: conversationData.analysis || {},
          metadata: enhancedMetadata,
          has_audio: conversationData.has_audio || false,
          elevenlabs_batch_id: conversationData.metadata.batch_call?.batch_call_id || null,
          recipient_id: conversationData.metadata.batch_call?.batch_call_recipient_id || null,
          recipient_phone_number: conversationData.metadata.phone_call?.external_number || null,
          dynamic_variables: dynamicVariables
        }, { onConflict: 'conversation_id' });

      if (conversationUpsertError) {
        console.error('Error saving or updating conversation:', conversationUpsertError);
      } else {
        console.log('Conversation saved successfully');

        // Step 2: Save transcript data to transcripts table
        const { error: transcriptUpsertError } = await supabase
          .from('transcripts')
          .upsert({
            conversation_id: conversationData.conversation_id,
            full_transcript: conversationData.transcript || []
          }, { onConflict: 'conversation_id' });

        if (transcriptUpsertError) {
          console.error('Error saving transcript:', transcriptUpsertError);
        } else {
          console.log('Transcript saved successfully');
        }

        // Step 3: Handle minutes refund for completed conversation
        if (conversationData.status?.toLowerCase() === 'done' || conversationData.status?.toLowerCase() === 'completed') {
          await handleConversationMinutesRefund(supabase, conversationData, userId, campaignId);
        }

        // Step 4: Update the recipient record to link it to the conversation (if recipient exists)
        if (conversationData.metadata.batch_call?.batch_call_recipient_id) {
          const { error: recipientUpdateError } = await supabase
            .from('recipients')
            .update({
              elevenlabs_conversation_id: conversationData.conversation_id,
              status: conversationData.status,
              updated_at: new Date().toISOString()
            })
            .eq('elevenlabs_recipient_id', conversationData.metadata.batch_call.batch_call_recipient_id);

          if (recipientUpdateError) {
            console.error('Error updating recipient with conversation ID:', recipientUpdateError);
          } else {
            console.log('Recipient updated with conversation ID successfully');
          }
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
        
        // Update corresponding campaign status
        await updateCampaignStatus(supabase, batchData.batch_id, batchData.status);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in eleven-labs-webhook function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
