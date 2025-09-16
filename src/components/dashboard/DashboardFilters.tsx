import { useState } from "react";
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Filter, Search } from "lucide-react";

interface DashboardFiltersProps {
  campaigns: Array<{ id: string; name: string }>;
  selectedCampaigns: string[];
  onCampaignChange: (campaignIds: string[]) => void;
  onClearFilters: () => void;
}

export function DashboardFilters({
  campaigns,
  selectedCampaigns,
  onCampaignChange,
  onClearFilters,
}: DashboardFiltersProps) {
  const [isCampaignDropdownOpen, setIsCampaignDropdownOpen] = useState(false);
  const [campaignSearchQuery, setCampaignSearchQuery] = useState("");
  const [tempSelectedCampaigns, setTempSelectedCampaigns] = useState<string[]>(selectedCampaigns);

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.name.toLowerCase().includes(campaignSearchQuery.toLowerCase())
  );

  const handleCampaignToggle = (campaignId: string) => {
    if (campaignId === 'all') {
      setTempSelectedCampaigns(['all']);
      return;
    }

    let newSelected = [...tempSelectedCampaigns];
    if (newSelected.includes('all')) {
      newSelected = newSelected.filter(id => id !== 'all');
    }

    if (newSelected.includes(campaignId)) {
      newSelected = newSelected.filter(id => id !== campaignId);
    } else {
      newSelected.push(campaignId);
    }

    if (newSelected.length === 0) {
      newSelected = ['all'];
    }

    setTempSelectedCampaigns(newSelected);
  };

  const applyFilters = () => {
    onCampaignChange(tempSelectedCampaigns);
    setIsCampaignDropdownOpen(false);
  };

  const handleDropdownClose = (open: boolean) => {
    if (!open) {
      // Apply filters when dropdown closes
      applyFilters();
    }
    setIsCampaignDropdownOpen(open);
  };

  const getSelectedCampaignText = () => {
    if (selectedCampaigns.includes('all')) {
      return 'All Campaigns';
    }
    if (selectedCampaigns.length === 1) {
      const campaign = campaigns.find(c => c.id === selectedCampaigns[0]);
      return campaign?.name || 'Select campaigns';
    }
    return `${selectedCampaigns.length} campaigns selected`;
  };

  // Update temp selection when selectedCampaigns prop changes
  React.useEffect(() => {
    setTempSelectedCampaigns(selectedCampaigns);
  }, [selectedCampaigns]);

  return (
    <Card className="shadow-soft border-card-border">
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Filters:</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 items-end lg:items-center">
            {/* Campaign Multi-Select Dropdown */}
            <Popover open={isCampaignDropdownOpen} onOpenChange={handleDropdownClose}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full sm:w-56 justify-start text-left font-normal text-sm h-9"
                >
                  <span className="truncate">{getSelectedCampaignText()}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0 bg-background border-border z-50" align="start">
                <div className="p-2 border-b border-border">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search campaigns..."
                      value={campaignSearchQuery}
                      onChange={(e) => setCampaignSearchQuery(e.target.value)}
                      className="pl-8 h-8 text-sm bg-background"
                    />
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto p-2">
                  <div className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded cursor-pointer"
                       onClick={() => handleCampaignToggle('all')}>
                    <Checkbox
                      checked={tempSelectedCampaigns.includes('all')}
                      className="h-4 w-4"
                    />
                    <span className="text-sm font-medium">All Campaigns</span>
                  </div>
                  {filteredCampaigns.map((campaign) => (
                    <div
                      key={campaign.id}
                      className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded cursor-pointer"
                      onClick={() => handleCampaignToggle(campaign.id)}
                    >
                      <Checkbox
                        checked={tempSelectedCampaigns.includes(campaign.id)}
                        className="h-4 w-4"
                      />
                      <span className="text-sm truncate">{campaign.name}</span>
                    </div>
                  ))}
                  {filteredCampaigns.length === 0 && campaignSearchQuery !== '' && (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      No campaigns found
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            <Button
              variant="outline"
              onClick={onClearFilters}
              className="whitespace-nowrap text-sm h-9 px-3"
              size="sm"
            >
              Clear
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}