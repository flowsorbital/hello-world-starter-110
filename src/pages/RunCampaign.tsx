import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ContactsModal } from "@/components/contacts/ContactsModal";
import { ChevronLeft, ChevronRight, Upload, Play, CalendarIcon, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";

const steps = [
  "Select Agent",
  "Upload Contacts", 
  "Campaign Settings",
  "Review & Launch"
];

interface Agent {
  id: string;
  name: string;
  type: string;
  status: string;
}

interface Contact {
  id: string;
  name: string;
  phone: string;
  [key: string]: string;
}

interface PhoneNumber {
  phone_number: string;
  label: string;
  supports_inbound: boolean;
  supports_outbound: boolean;
  phone_number_id: string;
  assigned_agent: string | null;
  provider: string;
}

export default function RunCampaign() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [campaignName, setCampaignName] = useState('');
  const [campaignStart, setCampaignStart] = useState('Immediate');
  const [startDate, setStartDate] = useState<Date>();
  const [selectedPhone, setSelectedPhone] = useState('');
  const [selectedPhoneId, setSelectedPhoneId] = useState('');
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [startTime, setStartTime] = useState('');
  const [isContactsModalOpen, setIsContactsModalOpen] = useState(false);
  const [isLaunched, setIsLaunched] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [savedCampaignId, setSavedCampaignId] = useState<string | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);
  
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchAgents();
      fetchPhoneNumbers();
    }
  }, [user]);

  const fetchAgents = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setAgents(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load agents",
        variant: "destructive",
      });
    }
  };

  const fetchPhoneNumbers = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-phone-numbers');
      
      if (error) throw error;
      setPhoneNumbers(data || []);
    } catch (error: any) {
      console.error('Error fetching phone numbers:', error);
      toast({
        title: "Error",
        description: "Failed to load phone numbers",
        variant: "destructive",
      });
    }
  };

  const nextStep = async () => {
    if (currentStep === 2) {
      // Save campaign details when moving from Campaign Settings step
      await saveCampaignDetails();
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    const text = await file.text();
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const parsedContacts: Contact[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length >= 2 && values[0] && values[1]) {
        const contact: Contact = {
          id: `csv-${i}`,
          name: values[0],
          phone: values[1],
        };
        
        // Add additional fields
        for (let j = 2; j < Math.min(headers.length, values.length); j++) {
          contact[headers[j]] = values[j];
        }
        
        parsedContacts.push(contact);
      }
    }

    // Save contacts to database
    try {
      const { error } = await supabase
        .from('contacts')
        .insert(
          parsedContacts.map(contact => ({
            user_id: user.id,
            name: contact.name,
            phone: contact.phone,
            additional_fields: Object.fromEntries(
              Object.entries(contact).filter(([key]) => !['id', 'name', 'phone'].includes(key))
            ),
          }))
        );

      if (error) throw error;

      setContacts(parsedContacts);
      toast({
        title: "Success",
        description: `${parsedContacts.length} contacts uploaded successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to save contacts",
        variant: "destructive",
      });
    }
  };

  const handleManualContacts = async (newContacts: Contact[]) => {
    setContacts([...contacts, ...newContacts]);
  };

  const saveCampaignDetails = async () => {
    if (!user || !selectedAgent) return;

    try {
      const startDateTime = campaignStart === 'Custom' && startDate && startTime 
        ? new Date(`${startDate.toISOString().split('T')[0]}T${startTime}:00`)
        : null;

      const { data, error } = await supabase
        .from('campaigns')
        .insert({
          user_id: user.id,
          agent_id: selectedAgent,
          name: campaignName,
          campaign_start: campaignStart,
          start_date: startDateTime?.toISOString(),
          phone_number: selectedPhone,
          phone_number_id: selectedPhoneId,
          elevenlabs_agent_id: selectedAgent,
          status: 'Draft',
        })
        .select()
        .single();

      if (error) throw error;
      
      setSavedCampaignId(data.id);
      
      // Link existing contacts to campaign
      if (contacts.length > 0) {
        const campaignContacts = contacts.map(contact => ({
          campaign_id: data.id,
          contact_id: contact.id
        }));

        await supabase
          .from('campaign_contact')
          .insert(campaignContacts);
      }

      toast({
        title: "Success",
        description: "Campaign details saved successfully",
      });
    } catch (error: any) {
      console.error('Error saving campaign:', error);
      toast({
        title: "Error",
        description: "Failed to save campaign details",
        variant: "destructive",
      });
    }
  };

  const handleLaunchCampaign = async () => {
    if (!user || !selectedAgent || !savedCampaignId) return;

    setIsLaunching(true);
    try {
      const startDateTime = campaignStart === 'Custom' && startDate && startTime 
        ? new Date(`${startDate.toISOString().split('T')[0]}T${startTime}:00`)
        : new Date();

      const scheduledTimeUnix = Math.floor(startDateTime.getTime() / 1000);
      const recipients = contacts.map(contact => contact.phone);

      // Prepare contacts with all fields for dynamic variables (excluding phone number)
      const contactsWithFields = contacts.map(contact => ({
        phone: contact.phone,
        ...contact // This includes all additional fields from CSV or manual entry
      }));

      // Launch campaign via ElevenLabs API
      const { data: launchResult, error: launchError } = await supabase.functions.invoke('launch-campaign', {
        body: {
          campaignId: savedCampaignId,
          callName: campaignName,
          agentId: selectedAgent,
          phoneNumberId: selectedPhoneId,
          scheduledTimeUnix,
          recipients,
          contactsWithFields // Pass contacts with all their fields for dynamic variables
        }
      });

      if (launchError) throw launchError;

      setIsLaunched(true);
      toast({
        title: "Campaign Launched!",
        description: "Your campaign has been successfully launched.",
      });
    } catch (error: any) {
      console.error('Error launching campaign:', error);
      toast({
        title: "Error",
        description: "Failed to launch campaign",
        variant: "destructive",
      });
    } finally {
      setIsLaunching(false);
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;
  const selectedAgentData = agents.find(agent => agent.id === selectedAgent);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Header */}
      <Card className="shadow-soft border-card-border">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-2xl font-bold">Run Campaign</CardTitle>
            <span className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <div className="flex justify-between text-xs text-muted-foreground">
              {steps.map((step, index) => (
                <span 
                  key={step}
                  className={`${index <= currentStep ? 'text-primary font-medium' : ''}`}
                >
                  {step}
                </span>
              ))}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Step Content */}
      <Card className="shadow-soft border-card-border min-h-[400px]">
        <CardContent className="p-8">
          {currentStep === 0 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold mb-6">Select an Existing Voice Agent</h3>
              <div className="space-y-3">
                {agents.length === 0 ? (
                  <p className="text-muted-foreground">No agents found. Create an agent first.</p>
                ) : (
                  agents.map((agent) => (
                    <div
                      key={agent.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-soft ${
                        selectedAgent === agent.id 
                          ? 'border-primary bg-primary-light' 
                          : 'border-card-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedAgent(agent.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-foreground">{agent.name}</h4>
                          <p className="text-sm text-muted-foreground">{agent.type}</p>
                        </div>
                        <Badge variant="default" className="bg-success text-success-foreground">
                          {agent.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold mb-6">Upload Contact List</h3>
              <div className="space-y-4">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="w-full h-32 border-2 border-dashed border-input rounded-lg hover:bg-primary-light hover:border-primary transition-colors flex items-center justify-center">
                    <div className="text-center">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="font-medium">Upload CSV File</p>
                      <p className="text-sm text-muted-foreground">
                        Click to browse and select your contact list
                      </p>
                    </div>
                  </div>
                </label>
                
                <div className="text-center">
                  <span className="text-muted-foreground">OR</span>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setIsContactsModalOpen(true)}
                >
                  Enter Contacts Manually
                </Button>

                {contacts.length > 0 && (
                  <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                    <p className="font-medium">{contacts.length} contacts loaded</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold mb-6">Campaign Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Campaign Name *</label>
                    <input 
                      type="text" 
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      placeholder="e.g., Q1 Lead Generation"
                      className="w-full p-3 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Campaign Start *</label>
                    <Select value={campaignStart} onValueChange={setCampaignStart}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Immediate">Immediate</SelectItem>
                        <SelectItem value="Custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    {campaignStart === 'Custom' && (
                      <div className="space-y-2">
                        <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full mt-2 justify-start text-left font-normal">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {startDate ? format(startDate, "PPP") : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={startDate}
                              onSelect={(date) => {
                                setStartDate(date);
                                setShowCalendar(false);
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <Input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Campaign Phone Number *</label>
                    <Select 
                      value={selectedPhoneId} 
                      onValueChange={(value) => {
                        setSelectedPhoneId(value);
                        const selectedPhoneNumber = phoneNumbers.find(p => p.phone_number_id === value);
                        setSelectedPhone(selectedPhoneNumber?.phone_number || '');
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a phone number" />
                      </SelectTrigger>
                      <SelectContent>
                        {phoneNumbers.map((phoneNumber) => (
                          <SelectItem key={phoneNumber.phone_number_id} value={phoneNumber.phone_number_id}>
                            {phoneNumber.phone_number} ({phoneNumber.label})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold mb-6">Review & Launch</h3>
              <div className="space-y-4">
                <div className="bg-muted/30 rounded-lg p-6">
                  <h4 className="font-medium mb-4">Campaign Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Agent:</span>
                      <p className="font-medium">{selectedAgentData?.name || 'None selected'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Contacts:</span>
                      <p className="font-medium">{contacts.length} contacts</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Campaign Name:</span>
                      <p className="font-medium">{campaignName || 'Untitled Campaign'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Start:</span>
                      <p className="font-medium">
                        {campaignStart === 'Custom' && startDate 
                          ? `${format(startDate, "PPP")} ${startTime || ''}`.trim()
                          : campaignStart
                        }
                      </p>
                    </div>
                  </div>
                </div>
                
                {isLaunched ? (
                  <div className="text-center p-6 bg-success/10 rounded-lg border border-success/20">
                    <h4 className="font-semibold text-success mb-2">Campaign Launched Successfully!</h4>
                    <p className="text-sm text-success/80">
                      Your campaign is now active and calls will begin according to your settings.
                    </p>
                  </div>
                ) : (
                  <Button 
                    onClick={handleLaunchCampaign}
                    className="w-full h-12 text-lg flex items-center justify-center gap-3"
                    disabled={!selectedAgent || contacts.length === 0 || !campaignName || !savedCampaignId || isLaunching}
                  >
                    {isLaunching ? (
                      <>
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Launching...
                      </>
                    ) : (
                      <>
                        <Play className="h-5 w-5" />
                        Launch Campaign
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        {currentStep > 0 && (
          <Button
            variant="outline"
            onClick={prevStep}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
        )}
        <div className="flex-1"></div>
        {currentStep < steps.length - 1 && (
          <Button
            onClick={nextStep}
            className="flex items-center gap-2"
            disabled={
              (currentStep === 0 && !selectedAgent) ||
              (currentStep === 1 && contacts.length === 0) ||
              (currentStep === 2 && (!campaignName || !selectedPhoneId))
            }
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      <ContactsModal
        isOpen={isContactsModalOpen}
        onClose={() => setIsContactsModalOpen(false)}
        onSave={handleManualContacts}
        campaignId={savedCampaignId || undefined}
      />
    </div>
  );
}