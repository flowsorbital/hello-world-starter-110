import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, X } from "lucide-react";

interface ValidationErrorsProps {
  errors: string[];
  onClose: () => void;
  title?: string;
}

export function ValidationErrors({ errors, onClose, title = "Validation Errors" }: ValidationErrorsProps) {
  if (errors.length === 0) return null;

  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            {title}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            Found {errors.length} validation error{errors.length !== 1 ? 's' : ''}. 
            Please fix these issues before proceeding.
          </AlertDescription>
        </Alert>
        
        <ScrollArea className="h-32">
          <div className="space-y-1">
            {errors.map((error, index) => (
              <div key={index} className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                {error}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}