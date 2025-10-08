# CSV Upload Functionality Guide

## Overview

The enhanced CSV upload functionality allows users to import contact lists from CSV, XLS, and XLSX files with advanced validation, error handling, and preview capabilities.

## Features

### 🚀 **Enhanced File Parsing**
- **Multiple Formats**: Supports CSV, XLS, and XLSX files
- **Smart Quote Handling**: Properly handles quoted fields and escaped quotes in CSV
- **Automatic Column Detection**: Suggests phone number columns based on header names
- **Data Validation**: Validates phone numbers and data integrity

### 📊 **Preview & Validation**
- **Live Preview**: Shows parsed data before upload
- **Phone Number Validation**: Ensures valid phone number formats (10-15 digits)
- **Auto-formatting**: Adds country codes when missing
- **Error Reporting**: Detailed validation errors with row numbers

### 🎯 **User Experience**
- **Template Download**: Provides CSV template for proper formatting
- **Progress Indicators**: Shows parsing and upload progress
- **Duplicate Handling**: Updates existing contacts or creates new ones
- **Batch Operations**: Handles large contact lists efficiently

## File Format Requirements

### CSV Format
```csv
phone,name,email,company,notes
1234567890,John Doe,john@example.com,Acme Corp,VIP customer
9876543210,Jane Smith,jane@example.com,Tech Inc,Follow up needed
```

### Required Fields
- **Phone Number**: Must be 10-15 digits (country code optional)

### Optional Fields
- **Name**: Contact name
- **Email**: Email address
- **Company**: Company name
- **Custom Fields**: Any additional fields will be stored

## Phone Number Formats

### Supported Formats
- `1234567890` (10 digits - US number, country code added automatically)
- `+1234567890` (with country code)
- `(123) 456-7890` (formatted - cleaned automatically)
- `123-456-7890` (dashed format - cleaned automatically)

### Validation Rules
- Minimum 10 digits
- Maximum 15 digits
- Non-digit characters are automatically removed
- US numbers (10 digits) get country code `1` added

## Usage Instructions

### 1. Access CSV Upload
- Navigate to **Contacts** page or **Run Campaign** → **Upload Contacts**
- Click **Upload CSV** button

### 2. Select File
- Click **Select File** button
- Choose CSV, XLS, or XLSX file
- File is automatically parsed and validated

### 3. Map Columns
- Select which column contains phone numbers
- System auto-suggests based on header names
- Preview shows first few rows

### 4. Generate Preview
- Click **Generate Preview** to validate data
- Review validation errors if any
- See formatted phone numbers and additional fields

### 5. Upload Contacts
- Click **Upload Contacts** to save to database
- Existing contacts are updated, new ones created
- Success message shows number of contacts processed

## Error Handling

### Common Validation Errors
- **Missing phone number**: Row has empty phone field
- **Invalid phone format**: Phone number too short/long or invalid
- **Duplicate headers**: CSV has duplicate column names
- **Empty file**: No data found in file
- **Parsing errors**: File format issues

### Error Display
- Validation errors shown in dedicated error panel
- Row numbers provided for easy fixing
- Detailed error descriptions
- Option to dismiss errors and proceed with valid data

## API Integration

### Database Schema
```sql
-- Contacts table structure
contacts (
  id: uuid (primary key)
  user_id: uuid (foreign key)
  phone: text (required)
  name: text (required)
  additional_fields: jsonb (optional custom fields)
  created_at: timestamp
  updated_at: timestamp
)
```

### Contact Processing
1. **Validation**: Phone numbers validated and formatted
2. **Deduplication**: Existing contacts updated by phone number
3. **Storage**: Additional fields stored in JSON format
4. **Campaign Linking**: Contacts linked to campaigns when applicable

## Component Architecture

### Core Components
- **`CsvUploader`**: Main upload component with preview
- **`ValidationErrors`**: Error display component
- **`ContactsModal`**: Manual contact entry
- **`Contacts`**: Full contact management page

### Utility Functions
- **`parseContactFile`**: Multi-format file parsing
- **`validateContacts`**: Contact validation logic
- **`validateAndFormatPhone`**: Phone number processing
- **`downloadCsvTemplate`**: Template generation

## Best Practices

### File Preparation
1. **Use Headers**: Always include header row
2. **Phone Column**: Name column with "phone", "mobile", or "number"
3. **Clean Data**: Remove empty rows and invalid characters
4. **Test Small**: Start with small files to test format

### Data Quality
1. **Consistent Format**: Use same phone number format throughout
2. **Required Fields**: Ensure phone numbers are present
3. **Encoding**: Use UTF-8 encoding for special characters
4. **Size Limits**: Keep files under 10MB for best performance

### Error Resolution
1. **Check Errors**: Review validation errors before upload
2. **Fix Source**: Correct issues in original file
3. **Re-upload**: Upload corrected file
4. **Verify**: Check contacts page to confirm upload

## Technical Implementation

### File Parsing
```typescript
// Parse multiple file formats
const parsed = await parseContactFile(file);

// Validate contacts
const { validContacts, errors } = validateContacts(
  parsed.rows, 
  parsed.headers, 
  phoneColumnIndex
);
```

### Phone Validation
```typescript
// Validate and format phone number
const result = validateAndFormatPhone(phone);
if (result.isValid) {
  contact.phone = result.formattedPhone;
}
```

### Database Operations
```typescript
// Upsert contact (update if exists, insert if new)
const { data: existingContact } = await supabase
  .from('contacts')
  .select('id')
  .eq('phone', contact.phone)
  .maybeSingle();

if (existingContact) {
  // Update existing
  await supabase.from('contacts').update(contactData);
} else {
  // Insert new
  await supabase.from('contacts').insert(contactData);
}
```

## Troubleshooting

### Common Issues
1. **File not parsing**: Check file format and encoding
2. **Phone validation fails**: Ensure proper phone number format
3. **Upload fails**: Check network connection and file size
4. **Duplicates created**: Phone numbers must match exactly

### Debug Steps
1. Download and check CSV template
2. Validate file format matches template
3. Check browser console for detailed errors
4. Try with smaller file first
5. Contact support if issues persist

## Future Enhancements

### Planned Features
- **Excel formula support**: Handle calculated fields
- **Bulk edit**: Edit multiple contacts at once
- **Import history**: Track upload history
- **Advanced mapping**: Map multiple phone numbers per contact
- **Data enrichment**: Auto-fill missing contact information

### Performance Optimizations
- **Streaming upload**: Handle very large files
- **Background processing**: Process uploads asynchronously
- **Caching**: Cache parsed data for re-uploads
- **Compression**: Compress large files before upload