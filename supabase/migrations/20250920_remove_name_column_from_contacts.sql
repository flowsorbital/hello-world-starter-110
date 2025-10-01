-- Remove name column from contacts table
-- All name data should be stored in additional_fields JSON column

-- First, migrate existing name data to additional_fields
UPDATE contacts 
SET additional_fields = COALESCE(additional_fields, '{}'::jsonb) || 
  CASE 
    WHEN name IS NOT NULL AND name != '' 
    THEN jsonb_build_object('name', name)
    ELSE '{}'::jsonb
  END
WHERE name IS NOT NULL AND name != '';

-- Drop the name column
ALTER TABLE contacts DROP COLUMN IF EXISTS name;

-- Add comment to document the change
COMMENT ON TABLE contacts IS 'Contacts table - name and other custom fields stored in additional_fields JSON column';