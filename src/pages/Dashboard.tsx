import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Phone, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useDashboardData } from "@/hooks/useDashboardData";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { DashboardMetrics } from "@/components/dashboard/DashboardMetrics";
import { CampaignsList } from "@/components/dashboard/CampaignsList";
import { CampaignDetails } from "@/components/dashboard/CampaignDetails";

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { metrics, campaigns, conversations, isLoading, fetchDashboardData, fetchCampaignDetails } = useDashboardData();
  
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>(['all']);
  const [selectedCampaignDetails, setSelectedCampaignDetails] = useState<string | null>(null);
  const [campaignDetailsData, setCampaignDetailsData] = useState<any[]>([]);

  const getFirstName = () => {
    if (profile?.full_name) {
      return profile.full_name.split(' ')[0];
    }
    return 'User';
  };

  const handleCampaignChange = (campaignIds: string[]) => {
    setSelectedCampaigns(campaignIds);
    const campaignsToFilter = campaignIds.includes('all') ? undefined : campaignIds;
    fetchDashboardData(campaignsToFilter);
  };

  const handleClearFilters = () => {
    setSelectedCampaigns(['all']);
    fetchDashboardData();
  };

  // Initialize data on mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleViewDetails = async (campaignId: string) => {
    const details = await fetchCampaignDetails(campaignId);
    setCampaignDetailsData(details);
    setSelectedCampaignDetails(campaignId);
  };

  const handleBackToCampaigns = () => {
    setSelectedCampaignDetails(null);
    setCampaignDetailsData([]);
  };

  return (
    <>
      {selectedCampaignDetails ? (
        // Campaign Details View - Use calculated height to prevent footer overlap
        <div style={{ height: 'calc(100vh - 64px - 80px)' }} className="flex flex-col">
          {/* Breadcrumb/Navigation Header */}
          <div className="flex items-center gap-4 mb-6 pb-4 border-b flex-shrink-0">
            <Button
              variant="outline"
              onClick={handleBackToCampaigns}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold">
              {campaigns.find(c => c.id === selectedCampaignDetails)?.name || 'Campaign'} - Details
            </h1>
          </div>
          
          {/* Scrollable Campaign Details Content */}
          <div className="flex-1 overflow-auto">
            <CampaignDetails
              campaignId={selectedCampaignDetails}
              campaignName={campaigns.find(c => c.id === selectedCampaignDetails)?.name || 'Campaign'}
              conversations={campaignDetailsData}
              onBack={handleBackToCampaigns}
              isLoading={isLoading}
            />
          </div>
        </div>
      ) : (
        // Main Dashboard View - Normal flow, let AppLayout handle footer positioning
        <div className="space-y-6">
          {/* Welcome Section */}
          <div className="bg-gradient-brand rounded-xl p-6 text-white shadow-medium">
            <h2 className="text-3xl font-bold mb-2">Welcome back, {getFirstName()}!</h2>
            <p className="text-white/90 text-lg">
              Create amazing voice experiences for your customers
            </p>
          </div>

          {/* Main Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Button
              onClick={() => navigate("/create-agent")}
              className="h-32 bg-card border border-card-border hover:bg-muted/50 text-left p-6 shadow-soft transition-all hover:shadow-medium group"
              variant="outline"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Mic className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-1">Create Voice Agent</h3>
                  <p className="text-muted-foreground">Set up a new AI voice agent for your business needs</p>
                </div>
              </div>
            </Button>

            <Button
              onClick={() => navigate("/run-campaign")}
              className="h-32 bg-card border border-card-border hover:bg-muted/50 text-left p-6 shadow-soft transition-all hover:shadow-medium group"
              variant="outline"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                  <Phone className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-1">Run Campaign</h3>
                  <p className="text-muted-foreground">Launch inbound or outbound calling campaigns</p>
                </div>
              </div>
            </Button>
          </div>

          {/* Dashboard Filters */}
          <DashboardFilters
            campaigns={campaigns.map(c => ({ 
              id: c.id, 
              name: c.name, 
              launched_at: c.launched_at,
              created_at: c.created_at 
            }))}
            selectedCampaigns={selectedCampaigns}
            onCampaignChange={handleCampaignChange}
            onClearFilters={handleClearFilters}
          />

          {/* Dashboard Metrics */}
          <DashboardMetrics metrics={metrics} isLoading={isLoading} userCurrency={profile?.currency || 'INR'} />

          {/* Campaigns List */}
          <CampaignsList
            campaigns={campaigns}
            onViewDetails={handleViewDetails}
            isLoading={isLoading}
            userCurrency={profile?.currency || 'INR'}
          />
        </div>
      )}
    </>
  );
}