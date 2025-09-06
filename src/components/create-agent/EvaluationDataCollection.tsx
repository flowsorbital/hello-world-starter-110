import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

interface EvaluationCriteria {
  id: string;
  identifier: string;
  prompt: string;
}

interface DataCollectionItem {
  id: string;
  dataType: string;
  identifier: string;
  description: string;
}

interface EvaluationDataCollectionProps {
  formData: {
    evaluationCriteria: EvaluationCriteria[];
    dataCollectionItems: DataCollectionItem[];
  };
  onUpdate: (field: string, value: EvaluationCriteria[] | DataCollectionItem[]) => void;
}

export default function EvaluationDataCollection({ formData, onUpdate }: EvaluationDataCollectionProps) {
  const [newEvaluation, setNewEvaluation] = useState<Omit<EvaluationCriteria, 'id'>>({
    identifier: '',
    prompt: ''
  });

  const [newDataItem, setNewDataItem] = useState<Omit<DataCollectionItem, 'id'>>({
    dataType: '',
    identifier: '',
    description: ''
  });

  const addEvaluationCriteria = () => {
    if (newEvaluation.identifier && newEvaluation.prompt) {
      const criteria: EvaluationCriteria = {
        id: Date.now().toString(),
        ...newEvaluation
      };
      onUpdate('evaluationCriteria', [...formData.evaluationCriteria, criteria]);
      setNewEvaluation({ identifier: '', prompt: '' });
    }
  };

  const removeEvaluationCriteria = (id: string) => {
    onUpdate('evaluationCriteria', formData.evaluationCriteria.filter(item => item.id !== id));
  };

  const addDataCollectionItem = () => {
    if (newDataItem.dataType && newDataItem.identifier && newDataItem.description) {
      const dataItem: DataCollectionItem = {
        id: Date.now().toString(),
        ...newDataItem
      };
      onUpdate('dataCollectionItems', [...formData.dataCollectionItems, dataItem]);
      setNewDataItem({ dataType: '', identifier: '', description: '' });
    }
  };

  const removeDataCollectionItem = (id: string) => {
    onUpdate('dataCollectionItems', formData.dataCollectionItems.filter(item => item.id !== id));
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Evaluation & Data Collection</h3>
      
      {/* Evaluation Criteria */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Goal Prompt Criteria</CardTitle>
          <p className="text-sm text-muted-foreground">
            Passes the conversation transcript together with a custom prompt to the LLM that verifies if a goal was met. 
            The result will be one of three values: success, failure, or unknown, as well as a rationale describing why the given result was chosen.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add New Evaluation Criteria */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="evalIdentifier" className="text-sm font-medium">
                  Evaluation Identifier
                </Label>
                <Input
                  id="evalIdentifier"
                  placeholder="e.g., appointment_scheduled"
                  value={newEvaluation.identifier}
                  onChange={(e) => setNewEvaluation({ ...newEvaluation, identifier: e.target.value })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="evalPrompt" className="text-sm font-medium">
                Prompt
              </Label>
              <Textarea
                id="evalPrompt"
                placeholder="Enter the evaluation prompt that will be used to assess if the goal was met..."
                rows={3}
                value={newEvaluation.prompt}
                onChange={(e) => setNewEvaluation({ ...newEvaluation, prompt: e.target.value })}
                className="resize-none"
              />
            </div>
            
            <Button 
              onClick={addEvaluationCriteria}
              disabled={!newEvaluation.identifier || !newEvaluation.prompt}
              className="w-fit"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Evaluation Criteria
            </Button>
          </div>

          {/* Existing Evaluation Criteria */}
          {formData.evaluationCriteria.map((criteria) => (
            <div key={criteria.id} className="p-4 border rounded-lg space-y-2">
              <div className="flex justify-between items-start">
                <div className="flex-1 space-y-2">
                  <div className="font-medium text-sm">{criteria.identifier}</div>
                  <div className="text-sm text-muted-foreground">{criteria.prompt}</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeEvaluationCriteria(criteria.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Data Collection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Data Collection</CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure data points to extract from conversation transcripts.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add New Data Collection Item */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dataType" className="text-sm font-medium">
                  Data Type
                </Label>
                <Select value={newDataItem.dataType} onValueChange={(value) => setNewDataItem({ ...newDataItem, dataType: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select data type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="boolean">Boolean</SelectItem>
                    <SelectItem value="integer">Integer</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="string">String</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dataIdentifier" className="text-sm font-medium">
                  Data Identifier
                </Label>
                <Input
                  id="dataIdentifier"
                  placeholder="e.g., customer_name"
                  value={newDataItem.identifier}
                  onChange={(e) => setNewDataItem({ ...newDataItem, identifier: e.target.value })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dataDescription" className="text-sm font-medium">
                Description
              </Label>
              <Textarea
                id="dataDescription"
                placeholder="This field will be passed to the LLM and should describe in detail how to extract the data from the transcript."
                rows={3}
                value={newDataItem.description}
                onChange={(e) => setNewDataItem({ ...newDataItem, description: e.target.value })}
                className="resize-none"
              />
            </div>
            
            <Button 
              onClick={addDataCollectionItem}
              disabled={!newDataItem.dataType || !newDataItem.identifier || !newDataItem.description}
              className="w-fit"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Data Collection Item
            </Button>
          </div>

          {/* Existing Data Collection Items */}
          {formData.dataCollectionItems.map((item) => (
            <div key={item.id} className="p-4 border rounded-lg space-y-2">
              <div className="flex justify-between items-start">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-sm">{item.identifier}</span>
                    <span className="text-xs bg-muted px-2 py-1 rounded">{item.dataType}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">{item.description}</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeDataCollectionItem(item.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
