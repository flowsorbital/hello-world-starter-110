import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KPICard } from "@/components/dashboard/KPICard";
import { Phone, Calendar, Users, HeadphonesIcon, Play, Plus } from "lucide-react";

const mockCampaigns = [
  {
    id: '1',
    name: 'Q1 Lead Generation',
    agent: 'Alex - Lead Qualifier',
    status: 'Completed',
    calls: 245,
    success: 187,
    appointments: 34,
    leads: 89,
    date: '2024-01-15'
  },
  {
    id: '2', 
    name: 'Customer Support Follow-up',
    agent: 'Emma - Support Agent',
    status: 'Running',
    calls: 127,
    success: 98,
    appointments: 0,
    leads: 0,
    date: '2024-01-20'
  },
  {
    id: '3',
    name: 'Appointment Reminders',
    agent: 'Sarah - Appointment Assistant', 
    status: 'Scheduled',
    calls: 0,
    success: 0,
    appointments: 0,
    leads: 0,
    date: '2024-01-25'
  }
];

const getStatusBadge = (status: string) => {
  const variants = {
    'Completed': 'default',
    'Running': 'secondary', 
    'Scheduled': 'outline'
  } as const;

  return (
    <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
      {status}
    </Badge>
  );
};

export default function Analytics() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Campaign Analytics</h2>
          <p className="text-muted-foreground">
            Track performance across all your voice campaigns
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Launch New Campaign
        </Button>
      </div>

      {/* Overall KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Calls Attempted"
          value="1,847"
          icon={Phone}
          trend={{ value: 12.5, isPositive: true }}
        />
        <KPICard
          title="Successful Connections"
          value="1,423"
          icon={Phone}
          trend={{ value: 8.2, isPositive: true }}
        />
        <KPICard
          title="Appointments Booked"
          value="234"
          icon={Calendar}
          trend={{ value: 15.3, isPositive: true }}
        />
        <KPICard
          title="Leads Qualified"
          value="456"
          icon={Users}
          trend={{ value: 22.1, isPositive: true }}
        />
      </div>

      {/* Campaign Performance Chart Placeholder */}
      <Card className="shadow-soft border-card-border">
        <CardHeader>
          <CardTitle>Campaign Performance Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
            <p className="text-muted-foreground">Performance chart visualization would go here</p>
          </div>
        </CardContent>
      </Card>

      {/* Campaign History */}
      <Card className="shadow-soft border-card-border">
        <CardHeader>
          <CardTitle>Campaign History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockCampaigns.map((campaign) => (
              <div 
                key={campaign.id}
                className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium text-foreground">{campaign.name}</h4>
                    {getStatusBadge(campaign.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">{campaign.agent}</p>
                  <p className="text-xs text-muted-foreground">Started: {campaign.date}</p>
                </div>
                
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <p className="font-medium text-foreground">{campaign.calls}</p>
                    <p className="text-muted-foreground">Calls</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-foreground">{campaign.success}</p>
                    <p className="text-muted-foreground">Connected</p>
                  </div>
                  {campaign.appointments > 0 && (
                    <div className="text-center">
                      <p className="font-medium text-foreground">{campaign.appointments}</p>
                      <p className="text-muted-foreground">Appointments</p>
                    </div>
                  )}
                  {campaign.leads > 0 && (
                    <div className="text-center">
                      <p className="font-medium text-foreground">{campaign.leads}</p>
                      <p className="text-muted-foreground">Leads</p>
                    </div>
                  )}
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}