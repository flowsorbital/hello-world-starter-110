import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";

interface Contact {
  id: string;
  name: string;
  phone: string;
  [key: string]: string;
}

interface ContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contacts: Contact[]) => void;
}

export function ContactsModal({ isOpen, onClose, onSave }: ContactsModalProps) {
  const [contacts, setContacts] = useState<Contact[]>([
    { id: '1', name: '', phone: '' }
  ]);
  const [customFields, setCustomFields] = useState<string[]>([]);
  const [newFieldName, setNewFieldName] = useState('');

  const addContact = () => {
    const newContact: Contact = { 
      id: Date.now().toString(), 
      name: '', 
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

  const handleSave = () => {
    const validContacts = contacts.filter(contact => contact.name && contact.phone);
    if (validContacts.length > 0) {
      onSave(validContacts);
      onClose();
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
              <div className="col-span-4">Name *</div>
              <div className="col-span-4">Phone Number *</div>
              {customFields.map(field => (
                <div key={field} className="col-span-2">{field}</div>
              ))}
              <div className="col-span-1">Actions</div>
            </div>
            
            {contacts.map((contact) => (
              <div key={contact.id} className="grid grid-cols-12 gap-2">
                <Input
                  className="col-span-4"
                  placeholder="Full name"
                  value={contact.name}
                  onChange={(e) => updateContact(contact.id, 'name', e.target.value)}
                />
                <Input
                  className="col-span-4"
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