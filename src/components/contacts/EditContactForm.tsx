import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Contact {
  id: string;
  phone: string;
  additional_fields: any;
}

interface EditContactFormProps {
  contact: Contact;
  onSave: (contact: Contact) => void;
  onCancel: () => void;
}

export function EditContactForm({ contact, onSave, onCancel }: EditContactFormProps) {
  const [phone, setPhone] = useState(contact.phone);
  const [additionalFields, setAdditionalFields] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  
  const { user } = useAuth();

  useEffect(() => {
    // Initialize additional fields
    if (contact.additional_fields && typeof contact.additional_fields === 'object') {
      setAdditionalFields(contact.additional_fields);
    }
  }, [contact]);

  const handleSave = async () => {
    if (!user || !phone.trim()) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('contacts')
        .update({
          phone: phone.trim(),
          additional_fields: additionalFields,
          updated_at: new Date().toISOString()
        })
        .eq('id', contact.id);

      if (error) throw error;

      onSave({
        ...contact,
        phone: phone.trim(),
        additional_fields: additionalFields
      });
    } catch (error: any) {
      console.error('Error updating contact:', error);
      toast.error('Failed to update contact');
    } finally {
      setIsLoading(false);
    }
  };

  const updateAdditionalField = (key: string, value: string) => {
    setAdditionalFields(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const deleteAdditionalField = (key: string) => {
    setAdditionalFields(prev => {
      const { [key]: deleted, ...rest } = prev;
      return rest;
    });
  };

  const fieldKeys = Object.keys(additionalFields);

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="phone">Phone Number *</Label>
        <Input
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="919999958112"
        />
      </div>

      {fieldKeys.map((key) => (
        <div key={key}>
          <Label htmlFor={key}>{key}</Label>
          <div className="flex gap-2">
            <Input
              id={key}
              value={additionalFields[key] || ''}
              onChange={(e) => updateAdditionalField(key, e.target.value)}
              placeholder={key}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteAdditionalField(key)}
              className="px-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isLoading || !phone.trim()}>
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
