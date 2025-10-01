import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Contact {
  id: string;
  phone: string;
  [key: string]: string;
}

interface ContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contacts: Contact[]) => void;
  campaignId?: string;
}

export function ContactsModal({ isOpen, onClose, onSave, campaignId }: ContactsModalProps) {
  const [contacts, setContacts] = useState<Contact[]>([
    { id: '1', phone: '' }
  ]);
  const [customFields, setCustomFields] = useState<string[]>([]);
  const [newFieldName, setNewFieldName] = useState('');
  
  const { user } = useAuth();
  const { toast } = useToast();

  const addContact = () => {
    const newContact: Contact = { 
      id: Date.now().toString(), 
      phone: '',
      ...Object.fromEntries(customFields.map(field => [field, '']))
    };
    setContacts([...contacts, newContact]);
  };

  const removeContact = (id: string) => {
    if (contacts.length > 1) {
      setContacts(contacts.filter(contact => contact.id !== id));
    }
  };

  const updateContact = (id: string, field: string, value: string) => {
    setContacts(contacts.map(contact => 
      contact.id === id ? { ...contact, [field]: value } : contact
    ));
  };

  const addCustomField = () => {
    if (newFieldName && !customFields.includes(newFieldName)) {
      setCustomFields([...customFields, newFieldName]);
      setContacts(contacts.map(contact => ({ ...contact, [newFieldName]: '' })));
      setNewFieldName('');
    }
  };

  const removeCustomField = (fieldName: string) => {
    setCustomFields(customFields.filter(field => field !== fieldName));
    setContacts(contacts.map(contact => {
      const { [fieldName]: removed, ...rest } = contact;
      return rest as Contact;
    }));
  };

  const handleSave = async () => {
    const validContacts = contacts.filter(contact => contact.phone && contact.phone.trim() !== '');
    if (validContacts.length === 0 || !user) return;

    try {
      // Check for existing contacts and update/insert accordingly
      const processedContacts = [];
      
      for (const contact of validContacts) {
        // Check if contact with this phone number already exists
        const { data: existingContact } = await supabase
          .from('contacts')
          .select('id')
          .eq('user_id', user.id)
          .eq('phone', contact.phone)
          .maybeSingle();

        if (existingContact) {
          // Update existing contact - store all fields except id and phone in additional_fields
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
          // Insert new contact - store all fields except id and phone in additional_fields
          const { data: newContact, error: insertError } = await supabase
            .from('contacts')
            .insert({
              user_id: user.id,
              name: contact.name,
              phone: contact.phone,
              additional_fields: Object.fromEntries(
                Object.entries(contact).filter(([key]) => !['id', 'name', 'phone'].includes(key))
              ),
            })
            .select()
            .single();

          if (insertError) throw insertError;
          processedContacts.push({ ...contact, id: newContact.id });
        }
      }

      // If campaignId is provided, link contacts to campaign
      if (campaignId) {
        for (const contact of processedContacts) {
          // Check if relationship already exists
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

      onSave(processedContacts);
      onClose();
      
      toast({
        title: "Success",
        description: `${processedContacts.length} contacts processed successfully`,
      });
    } catch (error: any) {
      console.error('Error saving contacts:', error);
      toast({
        title: "Error",
        description: "Failed to save contacts",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enter Contacts Manually</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Custom Fields */}
          <div className="space-y-4">
            <h4 className="font-medium">Additional Fields</h4>
            <div className="flex gap-2">
              <Input
                placeholder="Field name (e.g., Email, Company)"
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value)}
              />
              <Button onClick={addCustomField} disabled={!newFieldName}>
                Add Field
              </Button>
            </div>
            {customFields.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {customFields.map(field => (
                  <div key={field} className="flex items-center gap-1 bg-muted px-2 py-1 rounded">
                    <span className="text-sm">{field}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCustomField(field)}
                      className="h-4 w-4 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contacts Table */}
          <div className="space-y-4">
            <div className="grid grid-cols-12 gap-2 font-medium text-sm">
              <div className="col-span-6">Phone Number *</div>
              {customFields.map(field => (
                <div key={field} className="col-span-2">{field}</div>
              ))}
              <div className="col-span-1">Actions</div>
            </div>
            
            {contacts.map((contact) => (
              <div key={contact.id} className="grid grid-cols-12 gap-2">
                <Input
                  className="col-span-6"
                  placeholder="919999958112"
                  value={contact.phone}
                  onChange={(e) => updateContact(contact.id, 'phone', e.target.value)}
                />
                {customFields.map(field => (
                  <Input
                    key={field}
                    className="col-span-2"
                    placeholder={field}
                    value={contact[field] || ''}
                    onChange={(e) => updateContact(contact.id, field, e.target.value)}
                  />
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeContact(contact.id)}
                  disabled={contacts.length <= 1}
                  className="col-span-1 h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button onClick={addContact} variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave}>Save Contacts</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}