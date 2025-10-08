import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Contact {
  id: string;
  phone: string;
  additional_fields?: any;
  [key: string]: any;
}

interface ExistingContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contacts: Contact[]) => void;
}

export function ExistingContactsModal({ isOpen, onClose, onSave }: ExistingContactsModalProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && user) {
      fetchContacts();
    }
  }, [isOpen, user]);

  const fetchContacts = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform contacts to include additional_fields as top-level properties
      const transformedContacts = (data || []).map(contact => ({
        ...contact,
        ...contact.additional_fields
      }));
      
      setContacts(transformedContacts);
    } catch (error: any) {
      console.error('Error fetching contacts:', error);
      toast({
        title: "Error",
        description: "Failed to load contacts",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredContacts = contacts.filter(contact => 
    contact.phone.includes(searchQuery) ||
    Object.values(contact.additional_fields || {}).some(value => 
      String(value).toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleSelectAll = () => {
    if (selectedContacts.size === filteredContacts.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(filteredContacts.map(c => c.id)));
    }
  };

  const handleSelectContact = (contactId: string) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else {
      newSelected.add(contactId);
    }
    setSelectedContacts(newSelected);
  };

  const handleSave = () => {
    const selectedContactsData = contacts.filter(c => selectedContacts.has(c.id));
    onSave(selectedContactsData);
    onClose();
    setSelectedContacts(new Set());
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Select Existing Contacts</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Select All */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="select-all"
              checked={selectedContacts.size === filteredContacts.length && filteredContacts.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <label htmlFor="select-all" className="text-sm font-medium">
              Select All ({filteredContacts.length} contacts)
            </label>
          </div>

          {/* Contacts List */}
          <div className="border rounded-lg max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading contacts...</p>
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {searchQuery ? "No contacts found matching your search" : "No contacts found"}
              </div>
            ) : (
              <div className="divide-y">
                {filteredContacts.map((contact) => (
                  <div key={contact.id} className="p-4 hover:bg-muted/50">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={selectedContacts.has(contact.id)}
                        onCheckedChange={() => handleSelectContact(contact.id)}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{contact.phone}</div>
                        {contact.additional_fields && Object.keys(contact.additional_fields).length > 0 && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {Object.entries(contact.additional_fields)
                              .map(([key, value]) => `${key}: ${value}`)
                              .join(" • ")}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {selectedContacts.size} contact{selectedContacts.size !== 1 ? 's' : ''} selected
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleSave} disabled={selectedContacts.size === 0}>
                Add Selected Contacts
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
