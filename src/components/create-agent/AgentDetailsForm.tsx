import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface AgentDetailsFormProps {
  formData: {
    agentName: string;
    agentPersona: string;
    agentGoal: string;
    greetingMessage: string;
    instructions: string;
    responseVariability: string;
  };
  onUpdate: (field: string, value: string) => void;
}

export default function AgentDetailsForm({ formData, onUpdate }: AgentDetailsFormProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Agent Details</h3>
      <div className="space-y-6 max-w-4xl">
        {/* Top 3 fields in horizontal line */}
        <div className="grid grid-cols-3 gap-6">
          {/* Agent Name */}
          <div className="space-y-2">
            <Label htmlFor="agentName" className="text-sm font-medium">
              Agent Name *
            </Label>
            <Input
              id="agentName"
              type="text"
              placeholder="e.g., Sarah - Appointment Assistant"
              value={formData.agentName}
              onChange={(e) => onUpdate('agentName', e.target.value)}
              className="w-full"
            />
          </div>

          {/* Agent Persona */}
          <div className="space-y-2">
            <Label htmlFor="agentPersona" className="text-sm font-medium">
              Agent Persona *
            </Label>
            <Select value={formData.agentPersona} onValueChange={(value) => onUpdate('agentPersona', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select persona" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Response Variability */}
          <div className="space-y-2">
            <Label htmlFor="responseVariability" className="text-sm font-medium">
              Response Variability *
            </Label>
            <Select value={formData.responseVariability} onValueChange={(value) => onUpdate('responseVariability', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select response style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="consistent">Consistent & predictable responses</SelectItem>
                <SelectItem value="balanced">Balanced creativity & consistency</SelectItem>
                <SelectItem value="creative">Highly creative & varied responses</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Agent Goal */}
        <div className="space-y-2">
          <Label htmlFor="agentGoal" className="text-sm font-medium">
            Agent Goal *
          </Label>
          <Input
            id="agentGoal"
            type="text"
            placeholder="e.g., Schedule appointments and answer basic questions"
            value={formData.agentGoal}
            onChange={(e) => onUpdate('agentGoal', e.target.value)}
            className="w-full"
          />
        </div>

        {/* Greeting Message */}
        <div className="space-y-2">
          <Label htmlFor="greetingMessage" className="text-sm font-medium">
            Greeting Message *
          </Label>
          <div className="space-y-2">
            <Textarea
              id="greetingMessage"
              placeholder="Hi! I'm Sarah, your appointment assistant. How can I help you today?"
              rows={3}
              value={formData.greetingMessage}
              onChange={(e) => onUpdate('greetingMessage', e.target.value)}
              className="resize-none"
            />
            <Button variant="outline" size="sm" className="w-fit">
              <Plus className="h-4 w-4 mr-2" />
              Add Dynamic Variable
            </Button>
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-2">
          <Label htmlFor="instructions" className="text-sm font-medium">
            Instructions *
          </Label>
          <div className="space-y-2">
            <Textarea
              id="instructions"
              placeholder="Provide detailed instructions for how the agent should behave..."
              rows={20}
              value={formData.instructions}
              onChange={(e) => onUpdate('instructions', e.target.value)}
              className="resize-none"
            />
            <Button variant="outline" size="sm" className="w-fit">
              <Plus className="h-4 w-4 mr-2" />
              Add Dynamic Variable
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}