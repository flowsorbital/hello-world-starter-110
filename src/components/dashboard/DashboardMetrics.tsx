import { KPICard } from "./KPICard";
import { Phone, Users, Target, Clock, IndianRupee, DollarSign } from "lucide-react";
import { formatCurrency } from "@/utils/currency";

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
  userCurrency?: string;
}

export function DashboardMetrics({ metrics, isLoading, userCurrency = 'INR' }: DashboardMetricsProps) {
  const getCurrencyIcon = (currency: string) => {
    switch (currency?.toLowerCase()) {
      case 'inr':
        return IndianRupee;
      case 'usd':
        return DollarSign;
      default:
        return DollarSign;
    }
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
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
        title="Call Connectivity Rate"
        value={`${((metrics.totalConnected / metrics.totalCalls) * 100 || 0).toFixed(1)}%`}
        icon={Target}
      />
      <KPICard
        title="Overall Success Rate"
        value={`${metrics.successRate.toFixed(1)}%`}
        icon={Target}
      />
      <KPICard
        title="Total Minutes"
        value={`${metrics.totalMinutes} min`}
        icon={Clock}
      />
      <KPICard
        title="Total Cost"
        value={formatCurrency(metrics.totalCost, userCurrency)}
        icon={getCurrencyIcon(userCurrency)}
      />
    </div>
  );
}
