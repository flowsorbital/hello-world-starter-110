import { Button } from "@/components/ui/button";
import { KPICard } from "@/components/dashboard/KPICard";
import { ActivityLog } from "@/components/dashboard/ActivityLog";
import { Phone, Calendar, Users, HeadphonesIcon, Mic, BarChart3, TrendingUp, Target, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile } = useProfile();

  const getFirstName = () => {
    if (profile?.full_name) {
      return profile.full_name.split(' ')[0];
    }
    return 'User';
  };

  return (
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Calls Made"
          value="1,247"
          icon={Phone}
          trend={{ value: 12.5, isPositive: true }}
        />
        <KPICard
          title="Appointments Scheduled"
          value="156"
          icon={Calendar}
          trend={{ value: 8.2, isPositive: true }}
        />
        <KPICard
          title="Leads Qualified"
          value="89"
          icon={Users}
          trend={{ value: 15.3, isPositive: true }}
        />
        <KPICard
          title="Issues Resolved"
          value="234"
          icon={HeadphonesIcon}
          trend={{ value: -2.1, isPositive: false }}
        />
      </div>

      {/* Campaign Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <KPICard
          title="Conversion Rate"
          value="24.8%"
          icon={TrendingUp}
          trend={{ value: 5.2, isPositive: true }}
        />
        <KPICard
          title="Avg Call Duration"
          value="3m 42s"
          icon={Clock}
          trend={{ value: 12.3, isPositive: true }}
        />
        <KPICard
          title="Success Rate"
          value="89.4%"
          icon={Target}
          trend={{ value: 8.7, isPositive: true }}
        />
      </div>

      {/* Activity Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActivityLog />
        </div>
        <div className="space-y-4">
          <div className="bg-primary-light rounded-lg p-4 border border-primary/20">
            <h4 className="font-semibold text-primary mb-2">💡 Quick Tip</h4>
            <p className="text-sm text-primary/80">
              Use our appointment scheduling agent to automatically book meetings with qualified leads.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}