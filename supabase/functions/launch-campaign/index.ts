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
    const { campaignId, callName, agentId, phoneNumberId, scheduledTimeUnix, recipients, contactsWithFields } = await req.json();
    
    const elevenlabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
    
    if (!elevenlabsApiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    // Create Supabase client with ANONYMOUS key for regular access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create Supabase client with SERVICE_ROLE key for bypassing RLS
    const serviceRoleSupabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        auth: {
          persistSession: false,
        },
      }
    );

    console.log('Launching campaign with data:', {
      call_name: callName,
      agent_id: agentId,
      agent_phone_number_id: phoneNumberId,
      scheduled_time_unix: scheduledTimeUnix,
      recipients: recipients,
      contactsWithFields: contactsWithFields
    });

    // Prepare ElevenLabs API payload
    const elevenlabsPayload = {
      call_name: callName,
      agent_id: agentId,
      agent_phone_number_id: phoneNumberId,
      scheduled_time_unix: scheduledTimeUnix,
      recipients: contactsWithFields ? contactsWithFields.map((contact: any) => {
        // Extract dynamic variables from contact, excluding phone_number
        const dynamicVariables: any = {};
        
        // Add name if available
        if (contact.name) {
          dynamicVariables.name = contact.name;
        }
        
        // Add all other fields except phone, name, and id
        Object.keys(contact).forEach(key => {
          if (!['phone', 'name', 'id'].includes(key) && contact[key]) {
            dynamicVariables[key] = contact[key];
          }
        });
        
        return {
          phone_number: contact.phone,
          conversation_initiation_client_data: {
            dynamic_variables: dynamicVariables
          }
        };
      }) : recipients.map((phone: string) => ({ phone_number: phone }))
    };

    // Log the exact payload being sent to ElevenLabs
    console.log('ElevenLabs API payload:', JSON.stringify(elevenlabsPayload, null, 2));

    const response = await fetch('https://api.elevenlabs.io/v1/convai/batch-calling/submit', {
      method: 'POST',
      headers: {
        'xi-api-key': elevenlabsApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(elevenlabsPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Campaign launched successfully:', result);

    // Update campaign status in database using the SERVICE_ROLE client
    const { error: updateError } = await serviceRoleSupabase
      .from('campaigns')
      .update({
        status: 'Launched',
        launched_at: new Date().toISOString()
      })
      .eq('id', campaignId);

    if (updateError) {
      console.error('Error updating campaign status:', updateError);
    }

    // Save batch call data if available
    if (result.id) {
      // Get user_id first using the ANONYMOUS key client
      const { data: campaignData, error: campaignError } = await serviceRoleSupabase
        .from('campaigns')
        .select('user_id')
        .eq('id', campaignId)
        .single();

      if (campaignError) {
        console.error('Error fetching campaign data:', campaignError);
      } else {
        const batchIdToUse = result.id; // API returns 'id' field as batch_id
        console.log('Saving batch call data with batch_id:', batchIdToUse);
        console.log('Full API response:', JSON.stringify(result));

        // Use the SERVICE_ROLE client to insert data as it's a serverless function
        const { error: batchError } = await serviceRoleSupabase
          .from('batch_calls')
          .insert({
                     user_id: campaignData.user_id,
                     campaign_id: campaignId,
                     batch_id: batchIdToUse, // API 'id' maps to our 'batch_id'
                     batch_name: result.name, // API 'name' maps to our 'batch_name'
                     agent_id: result.agent_id,
                     phone_number_id: result.phone_number_id,
                     status: result.status,
                     total_calls_scheduled: result.total_calls_scheduled,
                     total_calls_dispatched: result.total_calls_dispatched,
                     scheduled_time_unix: result.scheduled_time_unix,
                     created_at_unix: result.created_at_unix,
                     last_updated_at_unix: result.last_updated_at_unix,
                });

        if (batchError) {
          console.error('Error saving batch call data:', batchError);
        } else {
          console.log('Batch call data saved successfully');
          
          // Start polling in background
          console.log('Starting background polling for batch:', batchIdToUse);
          EdgeRuntime.waitUntil(
            fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/poll-batch-status`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                batchId: batchIdToUse,
                userId: campaignData.user_id
              })
            }).catch(err => console.error('Error starting polling:', err))
          );
        }
      }
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