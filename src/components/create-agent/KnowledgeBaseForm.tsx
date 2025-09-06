import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Link, FileText, Plus } from "lucide-react";
import { useState } from "react";

interface KnowledgeBaseFormProps {
  formData: {
    uploadedFiles: string[];
    knowledgeUrls: string[];
  };
  onUpdate: (field: string, value: string[]) => void;
}

export default function KnowledgeBaseForm({ formData, onUpdate }: KnowledgeBaseFormProps) {
  const [urlInput, setUrlInput] = useState("");

  const handleAddUrl = () => {
    if (urlInput.trim()) {
      onUpdate('knowledgeUrls', [...formData.knowledgeUrls, urlInput.trim()]);
      setUrlInput("");
    }
  };

  const handleRemoveUrl = (index: number) => {
    const updatedUrls = formData.knowledgeUrls.filter((_, i) => i !== index);
    onUpdate('knowledgeUrls', updatedUrls);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Knowledge Base</h3>
      <div className="space-y-6">
        
        {/* File Upload */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Upload Files</Label>
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
            <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
            <p className="font-medium mb-2">Upload Knowledge Documents</p>
            <p className="text-sm text-muted-foreground mb-4">
              Drag & drop files here or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              Supported formats: Excel, CSV, PDF, Word, TXT
            </p>
            <Button variant="outline" className="mt-4">
              <FileText className="h-4 w-4 mr-2" />
              Choose Files
            </Button>
          </div>
          
          {/* Display uploaded files */}
          {formData.uploadedFiles.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Uploaded Files:</Label>
              {formData.uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4" />
                  <span>{file}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* URL Knowledge Base */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Add Website URLs</Label>
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="https://example.com/faq"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="flex-1"
            />
            <Button 
              variant="outline" 
              onClick={handleAddUrl}
              disabled={!urlInput.trim()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add URL
            </Button>
          </div>
          
          {/* Display added URLs */}
          {formData.knowledgeUrls.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Added URLs:</Label>
              {formData.knowledgeUrls.map((url, index) => (
                <div key={index} className="flex items-center justify-between gap-2 p-2 bg-muted/30 rounded text-sm">
                  <div className="flex items-center gap-2">
                    <Link className="h-4 w-4" />
                    <span className="truncate">{url}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveUrl(index)}
                    className="h-auto p-1"
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}