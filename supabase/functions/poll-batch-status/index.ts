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
        console.log(`Polling attempt ${pollCount + 1} for batch ${batchId}`);
        
        const response = await fetch(`https://api.elevenlabs.io/v1/convai/batch-calling/${batchId}`, {
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

        // Save recipients data if available
        if (batchData.recipients && Array.isArray(batchData.recipients)) {
          console.log(`Processing ${batchData.recipients.length} recipients`);
          
          for (const recipient of batchData.recipients) {
            // Check if recipient already exists
            const { data: existingRecipient } = await supabase
              .from('recipients')
              .select('id')
              .eq('elevenlabs_recipient_id', recipient.id)
              .eq('elevenlabs_batch_id', batchId)
              .maybeSingle();

            if (!existingRecipient) {
              // Insert new recipient
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
                console.log('Inserted new recipient:', recipient.recipient_id);
              }
            } else {
              // Update existing recipient
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
        } else if (batchData.status === 'failed' || batchData.status === 'cancelled') {
          console.log('Batch failed or cancelled, stopping polling');
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

  } catch (error) {
    console.error('Error in poll-batch-status function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});