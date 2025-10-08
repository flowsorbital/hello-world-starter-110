import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CsvUploader } from "@/components/contacts/CsvUploader";
import { ContactsModal } from "@/components/contacts/ContactsModal";
import { EditContactForm } from "@/components/contacts/EditContactForm";
import { Users, Search, Plus, Upload, Trash2, Edit } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Contact {
  id: string;
  phone: string;
  additional_fields: any;
  created_at: string;
  updated_at: string;
}

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isManualDialogOpen, setIsManualDialogOpen] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchContacts();
    }
  }, [user]);

  useEffect(() => {
    // Filter contacts based on search term
    const filtered = contacts.filter(contact => 
      contact.phone.includes(searchTerm) ||
      (contact.additional_fields?.name && 
        String(contact.additional_fields.name).toLowerCase().includes(searchTerm.toLowerCase())) ||
      (contact.additional_fields && 
        Object.values(contact.additional_fields).some((value: any) => 
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    );
    setFilteredContacts(filtered);
  }, [contacts, searchTerm]);

  const fetchContacts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (error: any) {
      console.error('Error fetching contacts:', error);
      toast.error('Failed to load contacts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactsUploaded = (uploadedContacts: any[]) => {
    setIsUploadDialogOpen(false);
    fetchContacts(); // Refresh the list
    toast.success(`${uploadedContacts.length} contacts uploaded successfully`);
  };

  const handleManualContactsSaved = (newContacts: any[]) => {
    setIsManualDialogOpen(false);
    fetchContacts(); // Refresh the list
  };

  const handleDeleteSelected = async () => {
    if (selectedContacts.size === 0) return;

    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .in('id', Array.from(selectedContacts));

      if (error) throw error;

      toast.success(`${selectedContacts.size} contacts deleted`);
      setSelectedContacts(new Set());
      fetchContacts();
    } catch (error: any) {
      console.error('Error deleting contacts:', error);
      toast.error('Failed to delete contacts');
    }
  };

  const toggleContactSelection = (contactId: string) => {
    const newSelection = new Set(selectedContacts);
    if (newSelection.has(contactId)) {
      newSelection.delete(contactId);
    } else {
      newSelection.add(contactId);
    }
    setSelectedContacts(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedContacts.size === filteredContacts.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(filteredContacts.map(c => c.id)));
    }
  };

  const getAdditionalFieldsDisplay = (additionalFields: any) => {
    if (!additionalFields || typeof additionalFields !== 'object') return null;
    
    return Object.entries(additionalFields)
      .slice(0, 3) // Show only first 3 fields
      .map(([key, value]) => (
        <Badge key={key} variant="secondary" className="mr-1 mb-1">
          {key}: {String(value)}
        </Badge>
      ));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6" />
              <CardTitle className="text-2xl">Contacts</CardTitle>
              <Badge variant="secondary">{contacts.length} total</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Upload CSV
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Upload Contacts</DialogTitle>
                  </DialogHeader>
                  <CsvUploader onContactsUploaded={handleContactsUploaded} />
                </DialogContent>
              </Dialog>

              <Button 
                variant="outline" 
                onClick={() => setIsManualDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Manually
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Search and Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {selectedContacts.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedContacts.size} selected
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteSelected}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contacts Table */}
      <Card>
        <CardContent className="p-0">
          {filteredContacts.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No contacts found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'No contacts match your search.' : 'Get started by uploading a CSV file or adding contacts manually.'}
              </p>
              {!searchTerm && (
                <div className="flex items-center justify-center gap-2">
                  <Button onClick={() => setIsUploadDialogOpen(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload CSV
                  </Button>
                  <Button variant="outline" onClick={() => setIsManualDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Manually
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedContacts.size === filteredContacts.length && filteredContacts.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded"
                    />
                  </TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Additional Info</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-12">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedContacts.has(contact.id)}
                        onChange={() => toggleContactSelection(contact.id)}
                        className="rounded"
                      />
                    </TableCell>
                    <TableCell className="font-mono">{contact.phone}</TableCell>
                    <TableCell>{contact.additional_fields?.name || '-'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap">
                        {getAdditionalFieldsDisplay(contact.additional_fields)}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(contact.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setEditingContact(contact)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Manual Contacts Modal */}
      <ContactsModal
        isOpen={isManualDialogOpen}
        onClose={() => setIsManualDialogOpen(false)}
        onSave={handleManualContactsSaved}
      />

      {/* Edit Contact Modal */}
      {editingContact && (
        <Dialog open={!!editingContact} onOpenChange={() => setEditingContact(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Contact</DialogTitle>
            </DialogHeader>
            <EditContactForm
              contact={editingContact}
              onSave={(updatedContact) => {
                setEditingContact(null);
                fetchContacts();
                toast.success('Contact updated successfully');
              }}
              onCancel={() => setEditingContact(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
