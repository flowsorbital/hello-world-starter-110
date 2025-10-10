import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Helper function to handle minutes refund after campaign completion
async function handleMinutesRefund(supabase: any, batchId: string, userId: string, batchData: any, isFailedCampaign = false) {
  try {
    // Get the original deduction transaction
    const { data: deductionTransaction, error: transactionError } = await supabase
      .from('minutes_transactions')
      .select('minutes, campaign_id')
      .eq('batch_id', batchId)
      .eq('user_id', userId)
      .eq('transaction_type', 'deduction')
      .single();

    if (transactionError || !deductionTransaction) {
      console.error('Error finding deduction transaction:', transactionError);
      return;
    }

    const originalMinutes = deductionTransaction.minutes;
    let refundMinutes = 0;

    if (isFailedCampaign) {
      // Refund all minutes for failed campaigns
      refundMinutes = originalMinutes;
    } else {
      // Get actual minutes used from conversations table
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select('call_duration_secs, status')
        .eq('campaign_id', deductionTransaction.campaign_id);

      if (conversationsError) {
        console.error('Error fetching conversations for refund:', conversationsError);
        return;
      }

      // Calculate actual minutes using same billing logic as dashboard
      const actualMinutesUsed = conversationsData?.reduce((sum, conv) => {
        // Only count completed/successful calls
        if (conv.status?.toLowerCase() === 'done' || conv.status?.toLowerCase() === 'completed') {
          const durationSeconds = conv.call_duration_secs || 0;
          if (durationSeconds <= 0) return sum;
          if (durationSeconds <= 60) return sum + 1;
          return sum + Math.ceil(durationSeconds / 60);
        }
        return sum;
      }, 0) || 0;
      
      refundMinutes = Math.max(0, originalMinutes - actualMinutesUsed);
      
      console.log(`Campaign completed: ${conversationsData?.length || 0} total calls, actual minutes used: ${actualMinutesUsed}`);
      console.log(`Original minutes: ${originalMinutes}, Used minutes: ${actualMinutesUsed}, Refund: ${refundMinutes}`);
    }

    if (refundMinutes > 0) {
      // Update user's available minutes
      const { data: currentProfile, error: profileError } = await supabase
        .from('profiles')
        .select('available_minutes')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching current profile:', profileError);
        return;
      }

      const newAvailableMinutes = (currentProfile.available_minutes || 0) + refundMinutes;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ available_minutes: newAvailableMinutes })
        .eq('id', userId);

      if (updateError) {
        console.error('Error refunding minutes:', updateError);
        return;
      }

      // Record refund transaction
      const { error: refundTransactionError } = await supabase
        .from('minutes_transactions')
        .insert({
          user_id: userId,
          campaign_id: deductionTransaction.campaign_id,
          batch_id: batchId,
          transaction_type: 'refund',
          minutes: refundMinutes,
          description: isFailedCampaign ? 'Campaign failed - full refund' : `Campaign completed - unused minutes refund`,
          created_at: new Date().toISOString()
        });

      if (refundTransactionError) {
        console.error('Error recording refund transaction:', refundTransactionError);
      } else {
        console.log(`Refunded ${refundMinutes} minutes to user ${userId}. New balance: ${newAvailableMinutes}`);
      }
    }
  } catch (error) {
    console.error('Error in handleMinutesRefund:', error);
  }
}

// Helper function to update campaign status based on batch status
async function updateCampaignStatus(supabase: any, batchId: string, batchStatus: string, userId: string) {
  try {
    // First, get the campaign_id associated with this batch
    const { data: batchCallData, error: fetchError } = await supabase
      .from('batch_calls')
      .select('campaign_id')
      .eq('batch_id', batchId)
      .eq('user_id', userId)
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
      console.log('Updating campaign ' + batchCallData.campaign_id + ' status to: ' + campaignStatus);

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
        console.log('Successfully updated campaign status to: ' + campaignStatus);
      }
    }
  } catch (error) {
    console.error('Error in updateCampaignStatus:', error);
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { batchId, userId } = await req.json();

    if (!batchId || !userId) {
      throw new Error('Batch ID and User ID are required');
    }

    const elevenlabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');

    if (!elevenlabsApiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    console.log('Starting batch status polling for:', batchId);

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Poll until completed
    let isCompleted = false;
    let pollCount = 0;
    const maxPolls = 100; // Prevent infinite loops
    const pollInterval = 10000; // 10 seconds

    while (!isCompleted && pollCount < maxPolls) {
      try {
        console.log('Polling attempt ' + (pollCount + 1) + ' for batch ' + batchId);

        const response = await fetch('https://api.elevenlabs.io/v1/convai/batch-calling/' + batchId, {
          method: 'GET',
          headers: {
            'xi-api-key': elevenlabsApiKey,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('ElevenLabs API error:', response.status, errorText);
          throw new Error('ElevenLabs API error: ' + response.status + ' - ' + errorText);
        }

        const batchData = await response.json();
        console.log('Batch status:', batchData.status);

        // Update batch status in database
        const { error: batchUpdateError } = await supabase
          .from('batch_calls')
          .update({
            status: batchData.status,
            total_calls_dispatched: batchData.total_calls_dispatched,
            last_updated_at_unix: batchData.last_updated_at_unix,
          })
          .eq('batch_id', batchId)
          .eq('user_id', userId);

        if (batchUpdateError) {
          console.error('Error updating batch status:', batchUpdateError);
        }

        // Update corresponding campaign status
        await updateCampaignStatus(supabase, batchId, batchData.status, userId);

        // Save recipients data if available
        if (batchData.recipients && Array.isArray(batchData.recipients)) {
          console.log('Processing ' + batchData.recipients.length + ' recipients');

          for (const recipient of batchData.recipients) {
            // Check if recipient already exists
            const { data: existingRecipient } = await supabase
              .from('recipients')
              .select('id')
              .eq('elevenlabs_recipient_id', recipient.id)
              .eq('elevenlabs_batch_id', batchId)
              .maybeSingle();

            if (!existingRecipient) {
              // Check if conversation ID is available
              if (recipient.conversation_id) {
                // Get campaign_id from batch_calls table
                const { data: batchCallData } = await supabase
                  .from('batch_calls')
                  .select('campaign_id')
                  .eq('batch_id', batchId)
                  .eq('user_id', userId)
                  .single();

                console.log('Creating placeholder conversation record for ID: ' + recipient.conversation_id);
                const { error: conversationUpsertError } = await supabase
                  .from('conversations')
                  .upsert({
                    conversation_id: recipient.conversation_id,
                    status: recipient.status,
                    user_id: userId,
                    campaign_id: batchCallData?.campaign_id || null,
                    phone_number: recipient.phone_number,
                    contact_name: recipient.contact_name || null,
                    dynamic_variables: recipient.conversation_initiation_client_data?.dynamic_variables || null,
                  }, { onConflict: 'conversation_id' });

                if (conversationUpsertError) {
                  console.error('Error creating conversation placeholder:', conversationUpsertError);
                  // Continue to the next recipient to avoid blocking the loop
                  continue;
                }
              }

              // Now insert the new recipient, including the conversation_id if available.
              const { error: recipientError } = await supabase
                .from('recipients')
                .insert({
                  user_id: userId,
                  elevenlabs_batch_id: batchId,
                  elevenlabs_recipient_id: recipient.id,
                  phone_number: recipient.phone_number,
                  contact_name: recipient.contact_name || null,
                  status: recipient.status || null,
                  elevenlabs_conversation_id: recipient.conversation_id || null,
                  conversation_initiation_client_data: recipient.conversation_initiation_client_data || null,
                });

              if (recipientError) {
                console.error('Error inserting recipient:', recipientError);
              } else {
                console.log('Inserted new recipient:', recipient.id);
              }
            } else {
              // Update existing recipient
              // First ensure conversation exists if conversation_id is provided
              if (recipient.conversation_id) {
                const { data: batchCallData } = await supabase
                  .from('batch_calls')
                  .select('campaign_id')
                  .eq('batch_id', batchId)
                  .eq('user_id', userId)
                  .single();

                const { error: conversationUpsertError } = await supabase
                  .from('conversations')
                  .upsert({
                    conversation_id: recipient.conversation_id,
                    status: recipient.status,
                    user_id: userId,
                    campaign_id: batchCallData?.campaign_id || null,
                    phone_number: recipient.phone_number,
                    contact_name: recipient.contact_name || null,
                    dynamic_variables: recipient.conversation_initiation_client_data?.dynamic_variables || null,
                  }, { onConflict: 'conversation_id' });

                if (conversationUpsertError) {
                  console.error('Error creating conversation placeholder:', conversationUpsertError);
                  continue;
                }
              }

              const { error: recipientUpdateError } = await supabase
                .from('recipients')
                .update({
                  status: recipient.status || null,
                  elevenlabs_conversation_id: recipient.conversation_id || null,
                  conversation_initiation_client_data: recipient.conversation_initiation_client_data || null,
                })
                .eq('elevenlabs_recipient_id', recipient.id)
                .eq('elevenlabs_batch_id', batchId);

              if (recipientUpdateError) {
                console.error('Error updating recipient:', recipientUpdateError);
              } else {
                console.log('Updated existing recipient:', recipient.id);
              }
            }
          }
        } else {
          console.log('No recipients data available in batch response');
        }

        // Check if completed
        if (batchData.status === 'completed') {
          isCompleted = true;
          console.log('Batch completed successfully');
          
          // Calculate minutes refund based on actual usage
          await handleMinutesRefund(supabase, batchId, userId, batchData);
        } else if (batchData.status === 'failed' || batchData.status === 'cancelled') {
          console.log('Batch failed or cancelled, stopping polling');
          
          // Refund all minutes for failed campaigns
          await handleMinutesRefund(supabase, batchId, userId, batchData, true);
          break;
        }

        pollCount++;

        // Wait before next poll (except if completed)
        if (!isCompleted && pollCount < maxPolls) {
          await new Promise(resolve => setTimeout(resolve, pollInterval));
        }

      } catch (pollError) {
        console.error('Error during polling iteration:', pollError);
        pollCount++;

        // Continue polling on errors, but add delay
        if (pollCount < maxPolls) {
          await new Promise(resolve => setTimeout(resolve, pollInterval));
        }
      }
    }

    if (pollCount >= maxPolls) {
      console.warn('Max polling attempts reached');
    }

    return new Response(JSON.stringify({
      success: true,
      completed: isCompleted,
      pollCount
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in poll-batch-status function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
