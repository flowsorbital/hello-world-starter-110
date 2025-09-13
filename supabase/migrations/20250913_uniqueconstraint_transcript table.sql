ALTER TABLE public.transcripts
ADD CONSTRAINT unique_conversation_id UNIQUE (conversation_id);