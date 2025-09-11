import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Filter } from "lucide-react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

interface DashboardFiltersProps {
  campaigns: Array<{ id: string; name: string }>;
  selectedCampaign: string;
  dateRange: DateRange | undefined;
  onCampaignChange: (campaignId: string) => void;
  onDateRangeChange: (dateRange: DateRange | undefined) => void;
  onClearFilters: () => void;
}

export function DashboardFilters({
  campaigns,
  selectedCampaign,
  dateRange,
  onCampaignChange,
  onDateRangeChange,
  onClearFilters,
}: DashboardFiltersProps) {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  return (
    <Card className="shadow-soft border-card-border">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium text-foreground">Filters:</span>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <Select value={selectedCampaign} onValueChange={onCampaignChange}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="All Campaigns" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Campaigns</SelectItem>
                {campaigns.map((campaign) => (
                  <SelectItem key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="p-0 text-left font-normal"
                >
                  <CalendarIcon className="h-4 w-4 text-muted-foreground mr-2" />
                  <span className="text-sm">
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Select date range</span>
                  )}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={(range) => {
                    onDateRangeChange(range);
                    if (range?.from && range?.to) {
                      setIsDatePickerOpen(false);
                    }
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>

            <Button
              variant="outline"
              onClick={onClearFilters}
              className="whitespace-nowrap"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}