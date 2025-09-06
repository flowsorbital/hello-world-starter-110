import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Phone, CheckCircle, AlertCircle } from "lucide-react";

interface ActivityItem {
  id: string;
  type: 'campaign' | 'agent' | 'call';
  title: string;
  status: 'completed' | 'running' | 'scheduled' | 'failed';
  time: string;
  details?: string;
}

const mockActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'campaign',
    title: 'Lead Generation Campaign',
    status: 'running',
    time: '2 hours ago',
    details: '127 calls made, 23 appointments scheduled'
  },
  {
    id: '2',
    type: 'agent',
    title: 'Customer Support Agent Created',
    status: 'completed',
    time: '1 day ago',
    details: 'Ready for deployment'
  },
  {
    id: '3',
    type: 'campaign',
    title: 'Appointment Booking Campaign',
    status: 'completed',
    time: '2 days ago',
    details: '45 calls made, 12 appointments scheduled'
  },
  {
    id: '4',
    type: 'call',
    title: 'Failed Call Retry',
    status: 'failed',
    time: '3 days ago',
    details: 'Contact unreachable after 3 attempts'
  },
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-success" />;
    case 'running':
      return <Phone className="h-4 w-4 text-primary animate-pulse" />;
    case 'scheduled':
      return <Clock className="h-4 w-4 text-warning" />;
    case 'failed':
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
};

const getStatusBadge = (status: string) => {
  const variants = {
    completed: 'default',
    running: 'secondary',
    scheduled: 'outline',
    failed: 'destructive'
  } as const;

  return (
    <Badge variant={variants[status as keyof typeof variants] || 'outline'} className="text-xs">
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

export function ActivityLog() {
  return (
    <Card className="shadow-soft border-card-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {mockActivities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="flex-shrink-0 mt-0.5">
              {getStatusIcon(activity.status)}
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">{activity.title}</p>
                {getStatusBadge(activity.status)}
              </div>
              {activity.details && (
                <p className="text-xs text-muted-foreground">{activity.details}</p>
              )}
              <p className="text-xs text-muted-foreground">{activity.time}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}