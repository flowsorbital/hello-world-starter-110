import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface VoiceLanguageSettingsProps {
  formData: {
    tone: string;
    voice: string;
    defaultLanguage: string;
    additionalLanguages: string[];
  };
  onUpdate: (field: string, value: string | string[]) => void;
}

const toneOptions = [
  "Friendly",
  "Professional", 
  "Neutral",
  "Enthusiastic",
  "Calm",
  "Authoritative",
  "Conversational",
  "Empathetic"
];

const voiceOptions = [
  { value: "sarah_professional", label: "Sarah (Professional)" },
  { value: "david_friendly", label: "David (Friendly)" },
  { value: "emma_calm", label: "Emma (Calm)" },
  { value: "james_authoritative", label: "James (Authoritative)" },
  { value: "lisa_enthusiastic", label: "Lisa (Enthusiastic)" }
];

const languageOptions = [
  { value: "en-US", label: "English (US)" },
  { value: "en-GB", label: "English (UK)" },
  { value: "es-ES", label: "Spanish (Spain)" },
  { value: "es-MX", label: "Spanish (Mexico)" },
  { value: "fr-FR", label: "French (France)" },
  { value: "de-DE", label: "German" },
  { value: "it-IT", label: "Italian" },
  { value: "pt-BR", label: "Portuguese (Brazil)" },
  { value: "ja-JP", label: "Japanese" },
  { value: "ko-KR", label: "Korean" },
  { value: "zh-CN", label: "Chinese (Simplified)" }
];

export default function VoiceLanguageSettings({ formData, onUpdate }: VoiceLanguageSettingsProps) {
  const handleAdditionalLanguageAdd = (language: string) => {
    if (!formData.additionalLanguages.includes(language)) {
      onUpdate('additionalLanguages', [...formData.additionalLanguages, language]);
    }
  };

  const handleAdditionalLanguageRemove = (language: string) => {
    onUpdate('additionalLanguages', formData.additionalLanguages.filter(lang => lang !== language));
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Voice & Language Settings</h3>
      <div className="space-y-6 max-w-2xl">
        {/* Tone */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Tone of Voice *</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {toneOptions.map((tone) => (
              <Button
                key={tone}
                variant={formData.tone === tone ? "default" : "outline"}
                className="hover:bg-primary-light hover:border-primary text-sm"
                onClick={() => onUpdate('tone', tone)}
              >
                {tone}
              </Button>
            ))}
          </div>
        </div>

        {/* Voice */}
        <div className="space-y-2">
          <Label htmlFor="voice" className="text-sm font-medium">
            Voice *
          </Label>
          <Select value={formData.voice} onValueChange={(value) => onUpdate('voice', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select voice" />
            </SelectTrigger>
            <SelectContent>
              {voiceOptions.map((voice) => (
                <SelectItem key={voice.value} value={voice.value}>
                  {voice.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Default Language */}
        <div className="space-y-2">
          <Label htmlFor="defaultLanguage" className="text-sm font-medium">
            Default Language *
          </Label>
          <Select value={formData.defaultLanguage} onValueChange={(value) => onUpdate('defaultLanguage', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select default language" />
            </SelectTrigger>
            <SelectContent>
              {languageOptions.map((language) => (
                <SelectItem key={language.value} value={language.value}>
                  {language.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Additional Languages */}
        <div className="space-y-2">
          <Label htmlFor="additionalLanguages" className="text-sm font-medium">
            Additional Languages <span className="text-muted-foreground text-xs">(Optional)</span>
          </Label>
          <Select onValueChange={handleAdditionalLanguageAdd}>
            <SelectTrigger>
              <SelectValue placeholder="Add additional languages" />
            </SelectTrigger>
            <SelectContent>
              {languageOptions
                .filter(lang => lang.value !== formData.defaultLanguage && !formData.additionalLanguages.includes(lang.value))
                .map((language) => (
                  <SelectItem key={language.value} value={language.value}>
                    {language.label}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          
          {formData.additionalLanguages.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {formData.additionalLanguages.map((langValue) => {
                const language = languageOptions.find(lang => lang.value === langValue);
                return (
                  <Badge key={langValue} variant="secondary" className="gap-1">
                    {language?.label}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0.5 hover:bg-transparent"
                      onClick={() => handleAdditionalLanguageRemove(langValue)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}