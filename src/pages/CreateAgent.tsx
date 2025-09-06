import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import UseCaseSelection from "@/components/create-agent/UseCaseSelection";
import AgentDetailsForm from "@/components/create-agent/AgentDetailsForm";
import VoiceLanguageSettings from "@/components/create-agent/VoiceLanguageSettings";
import KnowledgeBaseForm from "@/components/create-agent/KnowledgeBaseForm";
import EvaluationDataCollection from "@/components/create-agent/EvaluationDataCollection";

const steps = [
  "Choose Use Case",
  "Agent Details", 
  "Voice & Language Settings",
  "Knowledge Base",
  "Evaluation & Data Collection",
  "Preview & Test"
];

export default function CreateAgent() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const { toast } = useToast();
  
  // Form data state
  const [selectedUseCase, setSelectedUseCase] = useState<string | null>(null);
  const [agentDetails, setAgentDetails] = useState({
    agentName: '',
    agentPersona: '',
    agentGoal: '',
    greetingMessage: '',
    instructions: '',
    responseVariability: ''
  });
  const [voiceLanguageSettings, setVoiceLanguageSettings] = useState({
    tone: '',
    voice: '',
    defaultLanguage: '',
    additionalLanguages: [] as string[]
  });
  const [knowledgeBase, setKnowledgeBase] = useState({
    uploadedFiles: [] as string[],
    knowledgeUrls: [] as string[]
  });
  const [evaluationData, setEvaluationData] = useState({
    evaluationCriteria: [] as any[],
    dataCollectionItems: [] as any[]
  });

  const updateAgentDetails = (field: string, value: string) => {
    setAgentDetails(prev => ({ ...prev, [field]: value }));
  };

  const updateVoiceLanguageSettings = (field: string, value: string | string[]) => {
    setVoiceLanguageSettings(prev => ({ ...prev, [field]: value }));
  };

  const updateKnowledgeBase = (field: string, value: string[]) => {
    setKnowledgeBase(prev => ({ ...prev, [field]: value }));
  };

  const updateEvaluationData = (field: string, value: any[]) => {
    setEvaluationData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  const createAgentAPI = async () => {
    setIsCreatingAgent(true);
    
    try {
      const agentPayload = {
        name: agentDetails.agentName,
        conversation_config: {
          agent: {
            prompt: {
              prompt: agentDetails.instructions || "You are a helpful assistant."
            },
            first_message: agentDetails.greetingMessage || "Hello! How can I help you today?",
            language: voiceLanguageSettings.defaultLanguage || "en"
          },
          tts: {
            voice_id: voiceLanguageSettings.voice || "EXAVITQu4vr4xnSDxMaL" // Default to Sarah
          }
        },
        platform_settings: {
          widget_config: {
            accent_color: "#000000",
            background_color: "#ffffff",
            text_color: "#000000"
          }
        },
        tags: selectedUseCase ? [selectedUseCase] : []
      };

      const response = await fetch('https://api.elevenlabs.io/v1/convai/agents/create', {
        method: 'POST',
        headers: {
          'xi-api-key': 'sk_bd34b0c355a0c1e857c5bfe25cd08677b23c9bb1c78fa77c',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(agentPayload)
      });

      if (!response.ok) {
        throw new Error(`Failed to create agent: ${response.status}`);
      }

      const result = await response.json();
      
      toast({
        title: "Agent Created Successfully!",
        description: `Agent ID: ${result.agent_id}`,
      });

      // You could also redirect to campaigns page or store the agent_id
      console.log('Created Agent ID:', result.agent_id);
      
    } catch (error) {
      console.error('Error creating agent:', error);
      toast({
        title: "Error Creating Agent",
        description: "Failed to create agent. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingAgent(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Header */}
      <Card className="shadow-soft border-card-border">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-2xl font-bold">Create Voice Agent</CardTitle>
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
            <UseCaseSelection 
              selectedUseCase={selectedUseCase}
              onSelect={setSelectedUseCase}
            />
          )}

          {currentStep === 1 && (
            <AgentDetailsForm 
              formData={agentDetails}
              onUpdate={updateAgentDetails}
            />
          )}

          {currentStep === 2 && (
            <VoiceLanguageSettings 
              formData={voiceLanguageSettings}
              onUpdate={updateVoiceLanguageSettings}
            />
          )}

          {currentStep === 3 && (
            <KnowledgeBaseForm 
              formData={knowledgeBase}
              onUpdate={updateKnowledgeBase}
            />
          )}

          {currentStep === 4 && (
            <EvaluationDataCollection 
              formData={evaluationData}
              onUpdate={updateEvaluationData}
            />
          )}

          {currentStep === 5 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold mb-6">Preview & Test</h3>
              <div className="bg-muted/30 rounded-lg p-6 text-center">
                <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
                <h4 className="text-lg font-medium mb-2">Agent Created Successfully!</h4>
                <p className="text-muted-foreground mb-6">
                  Your voice agent "{agentDetails.agentName || 'Your Agent'}" is ready to use.
                </p>
                <Button variant="outline" className="mr-3">
                  Test Agent
                </Button>
                <Button 
                  onClick={createAgentAPI}
                  disabled={isCreatingAgent}
                  className="flex items-center gap-2"
                >
                  {isCreatingAgent && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isCreatingAgent ? 'Creating Agent...' : 'Use in Campaign'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 0}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <Button
          onClick={nextStep}
          disabled={currentStep === steps.length - 1}
          className="flex items-center gap-2"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}