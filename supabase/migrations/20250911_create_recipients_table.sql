-- Create recipients table to track individual call recipients within a batch
CREATE TABLE public.recipients (
  -- Internal ID for the recipient record
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,

  -- ElevenLabs' ID for the recipient
  elevenlabs_recipient_id TEXT NOT NULL UNIQUE,

  -- Foreign key to link to the user/agent
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Foreign key to link to the batch_calls table
  elevenlabs_batch_id TEXT NOT NULL REFERENCES public.batch_calls(batch_id) ON DELETE CASCADE,

  -- Foreign key to link to the conversations table (can be NULL initially)
  elevenlabs_conversation_id TEXT REFERENCES public.conversations(conversation_id) ON DELETE SET NULL,

  -- Recipient details
  phone_number TEXT NOT NULL,
  contact_name TEXT,

  -- Call status for this specific recipient
  status TEXT, -- e.g., 'scheduled', 'initiated', 'connected', 'failed'

  -- Store client-specific data for call initiation from the ElevenLabs payload
  conversation_initiation_client_data JSONB,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for the recipients table
ALTER TABLE public.recipients ENABLE ROW LEVEL SECURITY;

-- Create RLS policies to allow users to manage their own recipient records
CREATE POLICY "Users can view their own recipients"
ON public.recipients
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recipients"
ON public.recipients
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recipients"
ON public.recipients
FOR UPDATE
USING (auth.uid() = user_id);

-- Create a trigger for automatic timestamp updates on the recipients table
CREATE TRIGGER update_recipients_updated_at
BEFORE UPDATE ON public.recipients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for improved query performance
CREATE INDEX idx_recipients_elevenlabs_recipient_id ON public.recipients(elevenlabs_recipient_id);
CREATE INDEX idx_recipients_elevenlabs_batch_id ON public.recipients(elevenlabs_batch_id);
CREATE INDEX idx_recipients_user_id ON public.recipients(user_id);