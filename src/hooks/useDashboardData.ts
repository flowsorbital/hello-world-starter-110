import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DateRange } from "react-day-picker";
import { useProfile } from "@/hooks/useProfile";

interface MetricsData {
  totalCalls: number;
  totalConnected: number;
  successRate: number;
  totalMinutes: number;
  totalCost: number;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  totalCalls: number;
  connectedCalls: number;
  successRate: number;
  totalCost: number;
  totalMinutes: number;
  created_at: string;
  launched_at: string | null;
}

interface ConversationDetail {
  id: string;
  phone_number: string;
  contact_name: string;
  status: string; // Conversation status (completed, failed, in_progress, etc.)
  call_successful: string;
  call_duration_secs: number;
  start_time_unix: number;
  conversation_summary: string;
  analysis: any;
  has_audio: boolean;
  additional_fields?: any;
  conversation_id: string;
}

// Helper function to calculate minutes based on the new billing logic
const calculateBillingMinutes = (durationSeconds: number): number => {
  if (durationSeconds <= 0) return 0;
  if (durationSeconds <= 60) return 1;
  return Math.ceil(durationSeconds / 60);
};

export function useDashboardData() {
  const [metrics, setMetrics] = useState<MetricsData>({
    totalCalls: 0,
    totalConnected: 0,
    successRate: 0,
    totalMinutes: 0,
    totalCost: 0,
  });
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [conversations, setConversations] = useState<ConversationDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { profile, loading: profileLoading } = useProfile();

  const fetchDashboardData = async (selectedCampaigns?: string[]) => {
    try {
      setIsLoading(true);

      // Build query for conversations
      let conversationsQuery = supabase
        .from('conversations')
        .select('*');

      if (selectedCampaigns && selectedCampaigns.length > 0 && !selectedCampaigns.includes('all')) {
        conversationsQuery = conversationsQuery.in('campaign_id', selectedCampaigns);
      }


      const { data: conversationsData, error: conversationsError } = await conversationsQuery;

      if (conversationsError) {
        console.error('Error fetching conversations:', conversationsError);
        toast({
          title: "Error",
          description: "Failed to fetch conversation data",
          variant: "destructive",
        });
        return;
      }

      // Build query for campaigns with filtering
      let campaignsQuery = supabase
        .from('campaigns')
        .select(`
          *,
          conversations!campaign_id (
            status,
            call_successful,
            call_duration_secs,
            total_cost,
            created_at
          )
        `)
        .neq('status', 'Draft'); //exclude draft campaigns from dashboard

      // Apply campaign filter to campaigns query
      if (selectedCampaigns && selectedCampaigns.length > 0 && !selectedCampaigns.includes('all')) {
        campaignsQuery = campaignsQuery.in('id', selectedCampaigns);
      }

      const { data: campaignsData, error: campaignsError } = await campaignsQuery;

      if (campaignsError) {
        console.error('Error fetching campaigns:', campaignsError);
        toast({
          title: "Error",
          description: "Failed to fetch campaign data",
          variant: "destructive",
        });
        return;
      }

      // Process conversations data for metrics
      const totalCalls = conversationsData?.length || 0;
      // Count calls that were successfully connected (status is 'done' or 'completed')
      const connectedCalls = conversationsData?.filter(c => 
        c.status?.toLowerCase() === 'done' || c.status?.toLowerCase() === 'completed'
      ).length || 0;
      
      // Calculate success rate based on evaluation results, not connected calls
      const successfulEvaluations = conversationsData?.filter(c => {
        if (!c.analysis?.evaluation_criteria_results) return false;
        const results = Object.values(c.analysis.evaluation_criteria_results);
        return results.length > 0 && results.every((result: any) => result.result === 'success');
      }).length || 0;
      const successRate = totalCalls > 0 ? (successfulEvaluations / totalCalls) * 100 : 0;
      
      // Calculate total minutes using new billing logic
      const totalMinutes = conversationsData?.reduce((sum, c) => {
        return sum + calculateBillingMinutes(c.call_duration_secs || 0);
      }, 0) || 0;
      
      // Calculate total cost based on user's currency and call rate from profile
      // Default call rate to a reasonable value if not set in profile
      const callRate = profile?.call_rate ?? 2.0; // Default to 2.0 per minute if not set (reasonable for voice calls)
      const totalCost = totalMinutes * callRate;

      setMetrics({
        totalCalls,
        totalConnected: connectedCalls,
        successRate,
        totalMinutes,
        totalCost,
      });

      // Process campaigns data
      const processedCampaigns: Campaign[] = campaignsData?.map(campaign => {
        const campaignCalls = campaign.conversations || [];
        
        // Count calls that were successfully connected (status is 'done' or 'completed')
        const campaignConnected = campaignCalls.filter((c: any) => 
          c.status?.toLowerCase() === 'done' || c.status?.toLowerCase() === 'completed'
        ).length;
        
        // Calculate success rate based on evaluation results, not connected calls
        const campaignSuccessfulEvaluations = campaignCalls.filter((c: any) => {
          if (!c.analysis?.evaluation_criteria_results) return false;
          const results = Object.values(c.analysis.evaluation_criteria_results);
          return results.length > 0 && results.every((result: any) => result.result === 'success');
        }).length;
        const campaignSuccessRate = campaignCalls.length > 0 ? (campaignSuccessfulEvaluations / campaignCalls.length) * 100 : 0;
        
        // Calculate total minutes using new billing logic: <=60sec = 1min, >60&<=120 = 2min, etc.
        const campaignMinutes = campaignCalls.reduce((sum: number, c: any) => {
          return sum + calculateBillingMinutes(c.call_duration_secs || 0);
        }, 0);
        
        // Calculate total cost based on user's currency and call rate from profile
        // Default call rate to a reasonable value if not set in profile
        const callRate = profile?.call_rate ?? 2.0; // Default to 2.0 per minute if not set (reasonable for voice calls)
        const campaignCost = campaignMinutes * callRate;

        return {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          totalCalls: campaignCalls.length,
          connectedCalls: campaignConnected,
          successRate: campaignSuccessRate,
          totalCost: campaignCost,
          totalMinutes: campaignMinutes,
          created_at: campaign.created_at,
          launched_at: campaign.launched_at,
        };
      }) || [];

      // Sort campaigns by Campaign Start date (launched_at) in descending order
      // Latest campaigns appear first. If launched_at is null, use created_at as fallback
      const sortedCampaigns = processedCampaigns.sort((a, b) => {
        const dateA = a.launched_at || a.created_at;
        const dateB = b.launched_at || b.created_at;
        
        // Convert to Date objects for comparison
        const timeA = new Date(dateA).getTime();
        const timeB = new Date(dateB).getTime();
        
        // Descending order (latest first)
        return timeB - timeA;
      });

      setCampaigns(sortedCampaigns);
      setConversations((conversationsData || []).map(conv => ({
        ...conv,
        analysis: conv.analysis || {},
      })));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch dashboard data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCampaignDetails = async (campaignId: string) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('campaign_id', campaignId);

      if (error) {
        console.error('Error fetching campaign details:', error);
        toast({
          title: "Error",
          description: "Failed to fetch campaign details",
          variant: "destructive",
        });
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching campaign details:', error);
      toast({
        title: "Error",
        description: "Failed to fetch campaign details",
        variant: "destructive",
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch data after profile has finished loading
    if (!profileLoading) {
      fetchDashboardData();
    }
  }, [profileLoading, profile?.call_rate]);

  const fetchTranscript = async (conversationId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from('transcripts')
        .select('full_transcript')
        .eq('conversation_id', conversationId)
        .single();

      if (error) {
        console.error('Error fetching transcript:', error);
        return null;
      }

      return data?.full_transcript || null;
    } catch (error) {
      console.error('Error fetching transcript:', error);
      return null;
    }
  };

  return {
    metrics,
    campaigns,
    conversations,
    isLoading,
    fetchDashboardData,
    fetchCampaignDetails,
    fetchTranscript,
  };
}
