import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Phone, Target, Clock, IndianRupee } from "lucide-react";
import { formatCost } from "@/utils/currency";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

interface CampaignsListProps {
  campaigns: Campaign[];
  onViewDetails: (campaignId: string) => void;
  isLoading?: boolean;
}

export function CampaignsList({ campaigns, onViewDetails, isLoading }: CampaignsListProps) {
  const getStatusBadge = (status: string) => {
    const statusMap = {
      'Draft': { variant: 'secondary' as const, label: 'Draft', className: '' },
      'Launched': { variant: 'default' as const, label: 'In Progress', className: '' },
      'Completed': { variant: 'default' as const, label: 'Completed', className: 'bg-success text-success-foreground' },
      'Failed': { variant: 'destructive' as const, label: 'Failed', className: '' },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { variant: 'secondary' as const, label: status, className: '' };
    return <Badge variant={statusInfo.variant} className={statusInfo.className}>{statusInfo.label}</Badge>;
  };


  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  if (isLoading) {
    return (
      <Card className="shadow-soft border-card-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Campaigns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-muted rounded-lg p-4 h-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (campaigns.length === 0) {
    return (
      <Card className="shadow-soft border-card-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Campaigns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Phone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No campaigns found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-soft border-card-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Campaigns ({campaigns.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Campaign Start</TableHead>
                <TableHead className="text-center">Total Calls</TableHead>
                <TableHead className="text-center">Connected</TableHead>
                <TableHead className="text-center">Success Rate</TableHead>
                <TableHead className="text-right">Total Cost</TableHead>
                <TableHead className="text-center">Duration</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">
                    {campaign.name}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(campaign.status)}
                  </TableCell>
                  <TableCell className="text-center">
                    {campaign.launched_at ? (
                      <div className="text-sm">
                        <div className="text-foreground">
                          {new Date(campaign.launched_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                        <div className="text-muted-foreground">
                          {new Date(campaign.launched_at).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not launched</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {campaign.totalCalls}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      {campaign.connectedCalls}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`font-medium ${
                      campaign.successRate >= 70 ? 'text-success' : 
                      campaign.successRate >= 40 ? 'text-warning' : 'text-destructive'
                    }`}>
                      {campaign.successRate.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <IndianRupee className="h-4 w-4 text-muted-foreground" />
                      {formatCost(campaign.totalCost)}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {formatDuration(campaign.totalMinutes * 60)}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewDetails(campaign.id)}
                      className="gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}