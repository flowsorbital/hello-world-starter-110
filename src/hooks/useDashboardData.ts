import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DateRange } from "react-day-picker";

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
}

interface ConversationDetail {
  id: string;
  phone_number: string;
  contact_name: string;
  call_successful: string;
  call_duration_secs: number;
  start_time_unix: number;
  conversation_summary: string;
  transcript: any;
  analysis: any;
  has_audio: boolean;
  additional_fields?: any;
}

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

  const fetchDashboardData = async (selectedCampaign?: string, dateRange?: DateRange) => {
    try {
      setIsLoading(true);

      // Build query for conversations
      let conversationsQuery = supabase
        .from('conversations')
        .select('*');

      if (selectedCampaign && selectedCampaign !== 'all') {
        conversationsQuery = conversationsQuery.eq('campaign_id', selectedCampaign);
      }

      if (dateRange?.from && dateRange?.to) {
        conversationsQuery = conversationsQuery
          .gte('created_at', dateRange.from.toISOString())
          .lte('created_at', dateRange.to.toISOString());
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

      // Fetch campaigns with aggregated data
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('campaigns')
        .select(`
          *,
          conversations!campaign_id (
            call_successful,
            call_duration_secs,
            total_cost
          )
        `);

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
      const connectedCalls = conversationsData?.filter(c => c.call_successful === 'success').length || 0;
      const successRate = totalCalls > 0 ? (connectedCalls / totalCalls) * 100 : 0;
      const totalMinutes = conversationsData?.reduce((sum, c) => sum + (c.call_duration_secs / 60), 0) || 0;
      const totalCost = conversationsData?.reduce((sum, c) => sum + (c.total_cost || 0), 0) || 0;

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
        const campaignConnected = campaignCalls.filter((c: any) => c.call_successful === 'success').length;
        const campaignSuccessRate = campaignCalls.length > 0 ? (campaignConnected / campaignCalls.length) * 100 : 0;
        const campaignMinutes = campaignCalls.reduce((sum: number, c: any) => sum + (c.call_duration_secs / 60), 0);
        const campaignCost = campaignCalls.reduce((sum: number, c: any) => sum + (c.total_cost || 0), 0);

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
        };
      }) || [];

      setCampaigns(processedCampaigns);
      setConversations((conversationsData || []).map(conv => ({
        ...conv,
        transcript: conv.transcript || [],
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
    fetchDashboardData();
  }, []);

  return {
    metrics,
    campaigns,
    conversations,
    isLoading,
    fetchDashboardData,
    fetchCampaignDetails,
  };
}