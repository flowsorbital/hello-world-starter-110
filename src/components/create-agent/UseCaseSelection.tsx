import { Button } from "@/components/ui/button";

interface UseCase {
  title: string;
  description: string;
  icon: string;
}

interface UseCaseSelectionProps {
  selectedUseCase: string | null;
  onSelect: (useCase: string) => void;
}

const inboundUseCases: UseCase[] = [
  {
    title: "Appointment Booking",
    description: "Customers can call to schedule, reschedule, or cancel appointments.",
    icon: "📅",
  },
  {
    title: "Customer Support FAQs",
    description: "Answer common questions (pricing, business hours, return policy, etc.).",
    icon: "❓",
  },
  {
    title: "Order Tracking & Status",
    description: "Provide order/shipment updates via phone number or reference ID.",
    icon: "📦",
  },
  {
    title: "Product/Service Information",
    description: "Handle 'What do you offer?' or 'How does it work?' queries.",
    icon: "ℹ️",
  },
  {
    title: "Helpdesk / IT Support Triage",
    description: "Capture issue details before routing to a human agent.",
    icon: "🔧",
  },
  {
    title: "Reservation Management",
    description: "Restaurants, clinics, salons managing bookings over phone.",
    icon: "🏪",
  },
  {
    title: "Billing & Payments Queries",
    description: "Answer bill-related questions or guide to payment links.",
    icon: "💳",
  },
];

const outboundUseCases: UseCase[] = [
  {
    title: "Lead Generation & Qualification",
    description: "Call prospects, ask qualification questions, pass hot leads.",
    icon: "🎯",
  },
  {
    title: "Appointment Reminders",
    description: "Automated reminders with option to confirm, reschedule, or cancel.",
    icon: "⏰",
  },
  {
    title: "Payment Reminders / Collections",
    description: "Notify customers about pending invoices/bills with payment link.",
    icon: "💰",
  },
  {
    title: "Customer Re-Engagement",
    description: "Reach out to inactive customers with new offers or check-ins.",
    icon: "🔄",
  },
  {
    title: "Promotional Campaigns",
    description: "Announce new products, sales, or seasonal offers.",
    icon: "📢",
  },
  {
    title: "Event Invitations / RSVPs",
    description: "Invite customers to webinars, workshops, or store events with confirmation capture.",
    icon: "🎉",
  },
  {
    title: "Surveys / Feedback Calls",
    description: "Collect structured input on customer experience.",
    icon: "📊",
  },
  {
    title: "Cross-Sell / Upsell Calls",
    description: "Offer product upgrades, extended warranties, or add-on services.",
    icon: "📈",
  },
  {
    title: "Feedback Collection",
    description: "Capture customer feedback after service or support call.",
    icon: "💬",
  },
];

export default function UseCaseSelection({ selectedUseCase, onSelect }: UseCaseSelectionProps) {
  return (
    <div className="space-y-8">
      <h3 className="text-xl font-semibold">Choose Your Use Case</h3>
      
      {/* Inbound Use Cases */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-primary">Inbound</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {inboundUseCases.map((useCase) => (
            <Button
              key={useCase.title}
              variant={selectedUseCase === useCase.title ? "default" : "outline"}
              className="h-32 p-4 text-left hover:bg-primary-light hover:border-primary transition-all flex flex-col items-start justify-start overflow-hidden"
              onClick={() => onSelect(useCase.title)}
            >
              <div className="w-full h-full flex flex-col overflow-hidden">
                <div className="text-2xl mb-2 flex-shrink-0">{useCase.icon}</div>
                <h5 className="font-medium text-sm leading-tight mb-2 flex-shrink-0">{useCase.title}</h5>
                <p className="text-xs text-muted-foreground leading-relaxed flex-1 overflow-hidden text-ellipsis">{useCase.description}</p>
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Outbound Use Cases */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-secondary">Outbound</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {outboundUseCases.map((useCase) => (
            <Button
              key={useCase.title}
              variant={selectedUseCase === useCase.title ? "default" : "outline"}
              className="h-32 p-4 text-left hover:bg-primary-light hover:border-primary transition-all flex flex-col items-start justify-start overflow-hidden"
              onClick={() => onSelect(useCase.title)}
            >
              <div className="w-full h-full flex flex-col overflow-hidden">
                <div className="text-2xl mb-2 flex-shrink-0">{useCase.icon}</div>
                <h5 className="font-medium text-sm leading-tight mb-2 flex-shrink-0">{useCase.title}</h5>
                <p className="text-xs text-muted-foreground leading-relaxed flex-1 overflow-hidden text-ellipsis">{useCase.description}</p>
              </div>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}