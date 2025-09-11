-- 1. Add new columns and foreign key constraints to the conversations table
ALTER TABLE public.conversations
ADD COLUMN elevenlabs_batch_id TEXT REFERENCES public.batch_calls(batch_id) ON DELETE SET NULL,
ADD COLUMN recipient_id UUID, -- elevenlabs_recipient_id is not yet in a recipients table, so it's a UUID for now
ADD COLUMN recipient_phone_number TEXT;

-- 2. Create the new transcripts table
CREATE TABLE public.transcripts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES public.conversations(conversation_id) ON DELETE CASCADE,
  full_transcript JSONB, -- Store the full transcript
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Remove the old transcript column from conversations table
ALTER TABLE public.conversations
DROP COLUMN transcript;

-- 4. Enable RLS on the new transcripts table
ALTER TABLE public.transcripts ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for the new transcripts table
CREATE POLICY "Users can view their own transcripts"
ON public.transcripts
FOR SELECT
USING (
  (SELECT user_id FROM public.conversations WHERE conversation_id = transcripts.conversation_id) = auth.uid()
);

-- Note: We only need a SELECT policy as inserts/updates will be handled by the backend service account.

-- 6. Add a new index on the conversations table for the new batch_id column
CREATE INDEX idx_conversations_elevenlabs_batch_id ON public.conversations(elevenlabs_batch_id);

-- Optional: Create a trigger for automatic timestamp updates for transcripts table
CREATE TRIGGER update_transcripts_updated_at
BEFORE UPDATE ON public.transcripts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();