# Sample Data for Email Triage Bot

This document explains how the sample data loading functionality works in the Email Triage Bot.

## Overview

The "Load Sample Data" feature allows you to populate your email dashboard with realistic sample email data for testing and demonstration purposes. This is particularly useful for:

- Testing the AI email analysis functionality
- Demonstrating the system to stakeholders
- Development and debugging
- Training and onboarding new users

## How It Works

### Load Sample Data Button

The main dashboard includes a "Load Sample Data" button in the header. When clicked, it:

1. **Searches for CSV files** in multiple locations:
   - `sample_data/customer_support_emails.csv`
   - `sample_data/technical_support_emails.csv`
   - `attached_assets/68b1acd44f393_Sample_Support_Emails_Dataset_1757005849228.csv`
   - Root directory CSV files

2. **Fallback to default data**: If no CSV files are found, it uses built-in sample emails

3. **Processes each email** with AI analysis:
   - Sentiment analysis (positive, neutral, negative)
   - Priority classification (low, medium, high, urgent)
   - Information extraction
   - Tag generation
   - AI-generated responses

4. **Avoids duplicates**: Checks existing emails to prevent duplicates

5. **Updates analytics**: Refreshes dashboard analytics with the new data

## Sample Data Files

### Customer Support Emails (`customer_support_emails.csv`)
Contains 20 realistic customer support scenarios including:
- Password reset issues
- Billing inquiries
- Feature requests
- System outages
- Integration help
- Account management

### Technical Support Emails (`technical_support_emails.csv`)
Contains 20 technical support scenarios including:
- Critical production bugs
- Performance issues
- Security concerns
- Infrastructure problems
- Database issues
- API failures

### CSV Format

All CSV files should follow this format:
```csv
sender,subject,body,sent_date
user@company.com,Subject Line,Email body content,2024-12-06 09:00:00
```

## API Endpoint

The sample data loading is handled by the `/api/seed` endpoint which:
- Accepts POST requests
- Returns success/failure status
- Provides detailed error messages
- Updates analytics automatically

## Usage

### From Dashboard
1. Open the Email Triage Bot dashboard
2. Click the "Load Sample Data" button in the header
3. Wait for the loading process to complete
4. Check the success/error toast notification
5. Browse the loaded emails in the email list

### Programmatically
```typescript
import { useLoadSampleData } from '@/hooks/use-emails';

const loadSampleData = useLoadSampleData();

const handleLoadData = async () => {
  try {
    await loadSampleData.mutateAsync();
    console.log('Sample data loaded successfully');
  } catch (error) {
    console.error('Failed to load sample data:', error);
  }
};
```

## Default Sample Data

If no CSV files are available, the system uses these built-in sample emails:

1. **Critical Production System Down** (Urgent)
2. **Billing Inquiry - Overcharge** (Medium)
3. **Password Reset Not Working** (Medium)
4. **API Documentation Request** (Low)
5. **Feature Request - Bulk Export** (Low)
6. **Security Audit Questions** (Medium)
7. **Training Session Request** (Low)
8. **Mobile App Crash on iOS** (High)

## Features

- **AI-Powered Analysis**: Each email is processed with AI for sentiment, priority, and information extraction
- **Realistic Data**: Sample emails represent common support scenarios
- **Duplicate Prevention**: Won't create duplicate emails if data is loaded multiple times
- **Analytics Integration**: Automatically updates dashboard analytics
- **Error Handling**: Graceful fallback if CSV files are missing or corrupted
- **Progress Feedback**: Loading states and success/error notifications

## Customization

### Adding New CSV Files

1. Create a new CSV file with the required format
2. Add the file path to the `csvFiles` array in `seedService.ts`
3. Restart the server to use the new data

### Modifying Default Data

Edit the `DEFAULT_SAMPLE_EMAILS` array in `server/services/seedService.ts` to customize the fallback data.

### Adjusting AI Processing

Modify the `processEmailWithAI` method in `seedService.ts` to customize:
- AI analysis parameters
- Tag generation rules
- Response generation logic
- Resolution probability

## Troubleshooting

### Common Issues

**CSV files not loading**
- Check file paths are correct
- Verify CSV format matches expected structure
- Check file permissions

**AI analysis failing**
- Verify OpenAI/Gemini API credentials
- Check rate limits
- Review error logs

**Duplicate emails**
- This is expected behavior to prevent data pollution
- Clear database if you want to reload the same data

**Performance issues**
- Large CSV files may take time to process
- Each email requires multiple AI API calls
- Consider processing smaller batches for testing
