-- Create contact_messages table for Contact Us form data
CREATE TABLE public.contact_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT NOT NULL,
  reason TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Create policies (public access for submission, admin access for viewing)
CREATE POLICY "Anyone can submit contact messages" 
ON public.contact_messages 
FOR INSERT 
WITH CHECK (true);

-- Trigger for automatic timestamp updates
CREATE TRIGGER update_contact_messages_updated_at
BEFORE UPDATE ON public.contact_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();