import { KPICard } from "./KPICard";
import { Phone, Users, Target, Clock, IndianRupee } from "lucide-react";
import { formatCost } from "@/utils/currency";

interface MetricsData {
  totalCalls: number;
  totalConnected: number;
  successRate: number;
  totalMinutes: number;
  totalCost: number;
}

interface DashboardMetricsProps {
  metrics: MetricsData;
  isLoading?: boolean;
}

export function DashboardMetrics({ metrics, isLoading }: DashboardMetricsProps) {
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };


  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-card rounded-lg p-6 h-32 border border-card-border"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      <KPICard
        title="Total Calls Made"
        value={metrics.totalCalls.toLocaleString()}
        icon={Phone}
      />
      <KPICard
        title="Total Connected"
        value={metrics.totalConnected.toLocaleString()}
        icon={Users}
      />
      <KPICard
        title="Overall Success Rate"
        value={`${metrics.successRate.toFixed(1)}%`}
        icon={Target}
      />
      <KPICard
        title="Total Minutes"
        value={formatDuration(metrics.totalMinutes * 60)}
        icon={Clock}
      />
      <KPICard
        title="Total Cost"
        value={formatCost(metrics.totalCost)}
        icon={IndianRupee}
      />
    </div>
  );
}