import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { batchId } = await req.json();
    
    const elevenlabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
    
    if (!elevenlabsApiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    console.log('Fetching batch status for:', batchId);

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
    console.log('Successfully fetched batch status');

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update batch status in database
    const { error } = await supabase
      .from('batch_calls')
      .update({
        status: batchData.status,
        total_calls_dispatched: batchData.total_calls_dispatched,
        last_updated_at_unix: batchData.last_updated_at_unix,
      })
      .eq('batch_id', batchId);

    if (error) {
      console.error('Error updating batch status:', error);
    }

    // Update corresponding campaign status
    await updateCampaignStatus(supabase, batchId, batchData.status);

    return new Response(JSON.stringify(batchData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in get-batch-status function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});