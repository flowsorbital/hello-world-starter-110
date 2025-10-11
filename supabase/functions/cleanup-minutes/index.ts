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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { campaignId } = await req.json().catch(() => ({}));
    
    // Get campaigns older than 4 hours that need cleanup
    const cutoffTime = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
    
    let campaignsQuery = supabase
      .from('campaigns')
      .select(`
        id,
        user_id,
        name,
        launched_at,
        batch_calls!inner(batch_id, total_calls_scheduled)
      `)
      .eq('status', 'Completed')
      .lt('launched_at', cutoffTime);

    if (campaignId) {
      campaignsQuery = campaignsQuery.eq('id', campaignId);
    }

    const { data: campaigns, error: campaignsError } = await campaignsQuery;

    if (campaignsError) {
      throw new Error(`Failed to fetch campaigns: ${campaignsError.message}`);
    }

    let totalRefunded = 0;
    const processedCampaigns = [];

    for (const campaign of campaigns || []) {
      // Get successful conversations for this campaign
      const { data: conversations, error: conversationsError } = await supabase
        .from('conversations')
        .select('conversation_id, status')
        .eq('campaign_id', campaign.id);

      if (conversationsError) {
        console.error(`Error fetching conversations for campaign ${campaign.id}:`, conversationsError);
        continue;
      }

      const successfulCalls = conversations?.filter(c => 
        c.status?.toLowerCase() === 'done' || c.status?.toLowerCase() === 'completed'
      ).length || 0;

      const expectedCalls = campaign.batch_calls[0]?.total_calls_scheduled || 0;
      const failedCalls = expectedCalls - successfulCalls;

      if (failedCalls > 0) {
        const refundMinutes = failedCalls * 2; // 2 minutes per failed call

        // Update user's available minutes
        const { data: currentProfile, error: profileError } = await supabase
          .from('profiles')
          .select('available_minutes')
          .eq('user_id', campaign.user_id)
          .single();

        if (profileError) {
          console.error(`Error fetching profile for user ${campaign.user_id}:`, profileError);
          continue;
        }

        const newAvailableMinutes = (currentProfile.available_minutes || 0) + refundMinutes;

        const { error: updateError } = await supabase
          .from('profiles')
          .update({ available_minutes: newAvailableMinutes })
          .eq('user_id', campaign.user_id);

        if (updateError) {
          console.error(`Error updating minutes for user ${campaign.user_id}:`, updateError);
          continue;
        }

        // Record refund transaction
        const { error: transactionError } = await supabase
          .from('minutes_transactions')
          .insert({
            user_id: campaign.user_id,
            campaign_id: campaign.id,
            batch_id: campaign.batch_calls[0]?.batch_id || null,
            transaction_type: 'refund',
            minutes: refundMinutes,
            description: `Batch cleanup - ${failedCalls} failed calls refund`,
            created_at: new Date().toISOString()
          });

        if (transactionError) {
          console.error(`Error recording transaction for campaign ${campaign.id}:`, transactionError);
        } else {
          totalRefunded += refundMinutes;
          processedCampaigns.push({
            campaignId: campaign.id,
            campaignName: campaign.name,
            expectedCalls,
            successfulCalls,
            failedCalls,
            refundedMinutes: refundMinutes
          });
          console.log(`Refunded ${refundMinutes} minutes for campaign ${campaign.name} (${failedCalls} failed calls)`);
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      totalRefunded,
      processedCampaigns: processedCampaigns.length,
      details: processedCampaigns
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in cleanup-minutes function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
