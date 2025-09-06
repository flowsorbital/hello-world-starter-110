-- Create campaign_contact relationship table
CREATE TABLE public.campaign_contact (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL,
  contact_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, contact_id)
);

-- Enable RLS
ALTER TABLE public.campaign_contact ENABLE ROW LEVEL SECURITY;

-- Create policies for campaign_contact
CREATE POLICY "Users can view their own campaign contacts" 
ON public.campaign_contact 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.campaigns 
    WHERE campaigns.id = campaign_contact.campaign_id 
    AND campaigns.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own campaign contacts" 
ON public.campaign_contact 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.campaigns 
    WHERE campaigns.id = campaign_contact.campaign_id 
    AND campaigns.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own campaign contacts" 
ON public.campaign_contact 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.campaigns 
    WHERE campaigns.id = campaign_contact.campaign_id 
    AND campaigns.user_id = auth.uid()
  )
);

-- Add phone_number_id and elevenlabs_agent_id columns to campaigns table
ALTER TABLE public.campaigns 
ADD COLUMN phone_number_id TEXT,
ADD COLUMN elevenlabs_agent_id TEXT;

-- Update campaigns table to store datetime for start_date instead of text
ALTER TABLE public.campaigns 
ALTER COLUMN start_date TYPE TIMESTAMP WITH TIME ZONE;