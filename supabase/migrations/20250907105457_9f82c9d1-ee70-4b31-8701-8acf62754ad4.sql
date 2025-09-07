-- Create conversations table to store call details from ElevenLabs API
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  conversation_id TEXT NOT NULL UNIQUE, -- ElevenLabs conversation ID
  agent_id TEXT,
  phone_number TEXT,
  contact_name TEXT,
  status TEXT, -- done, in_progress, failed, etc.
  call_successful TEXT, -- success, fail
  call_duration_secs INTEGER DEFAULT 0,
  total_cost INTEGER DEFAULT 0, -- in cents
  start_time_unix BIGINT,
  accepted_time_unix BIGINT,
  transcript JSONB, -- Store full transcript array
  metadata JSONB, -- Store metadata object
  analysis JSONB, -- Store analysis object (evaluation_criteria_results, data_collection_results)
  conversation_summary TEXT,
  has_audio BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create batch_calls table to track campaign batches
CREATE TABLE public.batch_calls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  batch_id TEXT NOT NULL UNIQUE, -- ElevenLabs batch ID
  batch_name TEXT,
  agent_id TEXT,
  phone_number_id TEXT,
  status TEXT DEFAULT 'pending', -- pending, running, completed, failed
  total_calls_scheduled INTEGER DEFAULT 0,
  total_calls_dispatched INTEGER DEFAULT 0,
  scheduled_time_unix BIGINT,
  created_at_unix BIGINT,
  last_updated_at_unix BIGINT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_calls ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for conversations
CREATE POLICY "Users can view their own conversations" 
ON public.conversations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations" 
ON public.conversations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" 
ON public.conversations 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create RLS policies for batch_calls
CREATE POLICY "Users can view their own batch calls" 
ON public.batch_calls 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own batch calls" 
ON public.batch_calls 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own batch calls" 
ON public.batch_calls 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX idx_conversations_campaign_id ON public.conversations(campaign_id);
CREATE INDEX idx_conversations_conversation_id ON public.conversations(conversation_id);
CREATE INDEX idx_batch_calls_user_id ON public.batch_calls(user_id);
CREATE INDEX idx_batch_calls_campaign_id ON public.batch_calls(campaign_id);
CREATE INDEX idx_batch_calls_batch_id ON public.batch_calls(batch_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_batch_calls_updated_at
BEFORE UPDATE ON public.batch_calls
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();