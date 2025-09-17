-- Add dynamic_variables column to conversations table to store the conversation initiation client data
ALTER TABLE public.conversations 
ADD COLUMN dynamic_variables jsonb;