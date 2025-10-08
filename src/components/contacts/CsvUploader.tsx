import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ValidationErrors } from "@/components/contacts/ValidationErrors";
import { Upload, FileText, CheckCircle, AlertCircle, X, Download } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  parseContactFile, 
  validateContacts, 
  suggestPhoneColumn, 
  downloadCsvTemplate,
  type ParsedCsvData 
} from "@/utils/csvParser";

interface Contact {
  id: string;
  phone: string;
  [key: string]: string;
}

interface CsvUploaderProps {
  onContactsUploaded: (contacts: Contact[]) => void;
  campaignId?: string;
}



export function CsvUploader({ onContactsUploaded, campaignId }: CsvUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedCsvData | null>(null);
  const [phoneColumnIndex, setPhoneColumnIndex] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [previewData, setPreviewData] = useState<Contact[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { user } = useAuth();





  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    const parsed = await parseContactFile(selectedFile);
    setParsedData(parsed);
    
    if (parsed.errors.length > 0) {
      toast.error(`File parsing errors: ${parsed.errors.join(', ')}`);
    } else {
      // Auto-suggest phone column
      const suggestedIndex = suggestPhoneColumn(parsed.headers);
      setPhoneColumnIndex(suggestedIndex);
    }
  };

  const generatePreview = () => {
    if (!parsedData || phoneColumnIndex === -1) return;

    const { validContacts, errors } = validateContacts(
      parsedData.rows, 
      parsedData.headers, 
      phoneColumnIndex
    );

    setValidationErrors(errors);
    setPreviewData(validContacts);

    if (errors.length > 0) {
      toast.error(`Found ${errors.length} validation errors`);
    } else {
      toast.success(`${validContacts.length} contacts ready for upload`);
    }
  };

  const handleUpload = async () => {
    if (!user || previewData.length === 0) return;

    setIsUploading(true);
    try {
      const processedContacts = [];
      
      for (const contact of previewData) {
        // Check if contact exists
        const { data: existingContact } = await supabase
          .from('contacts')
          .select('id')
          .eq('user_id', user.id)
          .eq('phone', contact.phone)
          .maybeSingle();

        if (existingContact) {
          // Update existing contact
          const { error: updateError } = await supabase
            .from('contacts')
            .update({
              additional_fields: Object.fromEntries(
                Object.entries(contact).filter(([key]) => !['id', 'phone'].includes(key))
              ),
              updated_at: new Date().toISOString()
            })
            .eq('id', existingContact.id);

          if (updateError) throw updateError;
          processedContacts.push({ ...contact, id: existingContact.id });
        } else {
          // Insert new contact
          const { data: newContact, error: insertError } = await supabase
            .from('contacts')
            .insert({
              user_id: user.id,
              phone: contact.phone,
              additional_fields: Object.fromEntries(
                Object.entries(contact).filter(([key]) => !['id', 'phone'].includes(key))
              ),
            })
            .select()
            .single();

          if (insertError) throw insertError;
          processedContacts.push({ ...contact, id: newContact.id });
        }
      }

      // Link to campaign if provided
      if (campaignId) {
        for (const contact of processedContacts) {
          const { data: existingRelation } = await supabase
            .from('campaign_contact')
            .select('id')
            .eq('campaign_id', campaignId)
            .eq('contact_id', contact.id)
            .maybeSingle();

          if (!existingRelation) {
            await supabase
              .from('campaign_contact')
              .insert({
                campaign_id: campaignId,
                contact_id: contact.id
              });
          }
        }
      }

      onContactsUploaded(processedContacts);
      toast.success(`Successfully uploaded ${processedContacts.length} contacts`);
      
      // Reset state
      setFile(null);
      setParsedData(null);
      setPreviewData([]);
      setValidationErrors([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Error uploading contacts:', error);
      toast.error('Failed to upload contacts');
    } finally {
      setIsUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setParsedData(null);
    setPreviewData([]);
    setValidationErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          CSV/Excel Upload
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Select File
            </Button>
            {file && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{file.name}</Badge>
                <Button variant="ghost" size="sm" onClick={clearFile}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <Alert className="flex-1">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Supported formats: CSV, XLS, XLSX. Ensure your file has a header row with column names.
              </AlertDescription>
            </Alert>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadCsvTemplate}
              className="ml-4 flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Template
            </Button>
          </div>
        </div>

        {/* Column Mapping */}
        {parsedData && parsedData.headers.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-medium">File parsed successfully</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Phone Number Column *</Label>
                <Select
                  value={phoneColumnIndex.toString()}
                  onValueChange={(value) => setPhoneColumnIndex(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {parsedData.headers.map((header, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {header} (Column {index + 1})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button onClick={generatePreview} disabled={phoneColumnIndex === -1}>
                  Generate Preview
                </Button>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              Found {parsedData.totalRows} data rows with {parsedData.headers.length} columns
            </div>
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <ValidationErrors 
            errors={validationErrors} 
            onClose={() => setValidationErrors([])} 
            title="CSV Validation Errors"
          />
        )}

        {/* Preview */}
        {previewData.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Preview ({previewData.length} contacts)</h4>
              <Button onClick={handleUpload} disabled={isUploading}>
                {isUploading ? 'Uploading...' : 'Upload Contacts'}
              </Button>
            </div>
            
            <div className="border rounded-lg max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Phone</TableHead>
                    {parsedData?.headers
                      .filter((_, index) => index !== phoneColumnIndex)
                      .slice(0, 4)
                      .map((header) => (
                        <TableHead key={header}>{header}</TableHead>
                      ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.slice(0, 10).map((contact, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono">{contact.phone}</TableCell>
                      {parsedData?.headers
                        .filter((_, headerIndex) => headerIndex !== phoneColumnIndex)
                        .slice(0, 4)
                        .map((header) => (
                          <TableCell key={header}>
                            {contact[header] || '-'}
                          </TableCell>
                        ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {previewData.length > 10 && (
              <div className="text-sm text-muted-foreground text-center">
                Showing first 10 rows. {previewData.length - 10} more rows will be uploaded.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}