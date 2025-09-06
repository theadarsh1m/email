import { storage } from "../storage";
import { geminiService } from "./openaiService";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import type { InsertEmail } from "@shared/schema";

// Default sample data if CSV files are not available
const DEFAULT_SAMPLE_EMAILS = [
  {
    sender: "urgent.user@company.com",
    subject: "CRITICAL: Production system down",
    body: "Our main production system is completely down. All users are affected and we're losing revenue. This needs immediate attention!",
    sent_date: "2024-12-06 09:00:00"
  },
  {
    sender: "billing@customer.org",
    subject: "Billing inquiry - overcharge",
    body: "I was charged $299 instead of $99 for my monthly subscription. Please review my account and issue a refund for the difference.",
    sent_date: "2024-12-06 10:15:00"
  },
  {
    sender: "support@helpdesk.com",
    subject: "Password reset not working",
    body: "I've tried resetting my password multiple times but I'm not receiving the reset email. Can you help me regain access to my account?",
    sent_date: "2024-12-06 11:30:00"
  },
  {
    sender: "integration@techfirm.io",
    subject: "API documentation request",
    body: "We're planning to integrate with your API but need more detailed documentation on rate limits and webhook configurations.",
    sent_date: "2024-12-06 12:45:00"
  },
  {
    sender: "feedback@startup.co",
    subject: "Feature request - bulk export",
    body: "It would be great if you could add a bulk export feature. We need to export all our data for compliance reporting.",
    sent_date: "2024-12-06 14:00:00"
  },
  {
    sender: "security@enterprise.net",
    subject: "Security audit questions",
    body: "We're conducting a security audit and need information about your data encryption, access controls, and compliance certifications.",
    sent_date: "2024-12-06 15:20:00"
  },
  {
    sender: "training@newclient.com",
    subject: "Training session request",
    body: "Our team is new to your platform. Could we schedule a training session to help us get started and learn best practices?",
    sent_date: "2024-12-06 16:40:00"
  },
  {
    sender: "bug.report@testingteam.org",
    subject: "Mobile app crash on iOS",
    body: "The mobile app consistently crashes when uploading files larger than 10MB on iOS devices. This happens on iPhone 13 and newer models.",
    sent_date: "2024-12-05 09:10:00"
  }
];

export class SeedService {
  async seedFromCSV(): Promise<void> {
    try {
      console.log("Starting data seeding...");
      
      let allEmailData: any[] = [];
      
      // Try to load from multiple CSV files
      const csvFiles = [
        join(process.cwd(), "sample_data", "customer_support_emails.csv"),
        join(process.cwd(), "sample_data", "technical_support_emails.csv"),
        join(process.cwd(), "attached_assets", "68b1acd44f393_Sample_Support_Emails_Dataset_1757005849228.csv"),
        join(process.cwd(), "68b1acd44f393_Sample_Support_Emails_Dataset.csv")
      ];
      
      let csvFilesLoaded = 0;
      
      for (const csvPath of csvFiles) {
        if (existsSync(csvPath)) {
          try {
            console.log(`Loading CSV file: ${csvPath}`);
            const csvContent = readFileSync(csvPath, 'utf-8');
            const emailsFromFile = this.parseCSVContent(csvContent);
            allEmailData = [...allEmailData, ...emailsFromFile];
            csvFilesLoaded++;
            console.log(`Loaded ${emailsFromFile.length} emails from ${csvPath}`);
          } catch (error) {
            console.warn(`Failed to load CSV file ${csvPath}:`, error);
          }
        }
      }
      
      // If no CSV files were loaded, use default sample data
      if (csvFilesLoaded === 0) {
        console.log("No CSV files found, using default sample data");
        allEmailData = DEFAULT_SAMPLE_EMAILS;
      }
      
      console.log(`Processing ${allEmailData.length} sample emails from ${csvFilesLoaded} CSV files...`);
      
      // Process each email with AI analysis
      let processedCount = 0;
      let skippedCount = 0;
      
      for (const email of allEmailData) {
        // Check if email already exists (by sender + subject combination)
        const existingEmails = await storage.getEmails(1000);
        const exists = existingEmails.some(e => 
          e.sender === email.sender && e.subject === email.subject && 
          e.body === email.body
        );
        
        if (exists) {
          console.log(`Skipping duplicate email: ${email.subject}`);
          skippedCount++;
          continue;
        }
        
        await this.processEmailWithAI(email);
        processedCount++;
      }
      
      // Update analytics
      await this.updateAnalytics();
      
      console.log(`Seeding completed! Processed: ${processedCount}, Skipped: ${skippedCount}`);
    } catch (error) {
      console.error("Failed to seed data:", error);
      throw error;
    }
  }
  
  private parseCSVContent(csvContent: string): any[] {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',');
    const emailData = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      
      // Parse CSV line (handling quoted content)
      const values = this.parseCSVLine(line);
      if (values.length >= 4) {
        emailData.push({
          sender: values[0],
          subject: values[1],
          body: values[2],
          sent_date: values[3]
        });
      }
    }
    
    return emailData;
  }
  
  private parseCSVLine(line: string): string[] {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }
  
  private async processEmailWithAI(emailData: any): Promise<void> {
    try {
      console.log(`Processing: ${emailData.subject}`);
      
      // Generate unique message ID
      const messageId = `seed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // AI Analysis
      const sentimentAnalysis = await geminiService.analyzeSentiment(emailData.body);
      const priorityAnalysis = await geminiService.analyzePriority(emailData.body, emailData.subject);
      const extractedInfo = await geminiService.extractInformation(emailData.body);
      
      // Create email record
      const newEmail: InsertEmail = {
        messageId: messageId,
        subject: emailData.subject,
        sender: emailData.sender,
        body: emailData.body,
        receivedAt: new Date(emailData.sent_date),
        sentiment: sentimentAnalysis.sentiment,
        priority: priorityAnalysis.priority,
        extractedInfo: extractedInfo,
        tags: this.generateTags(emailData.subject, emailData.body, extractedInfo),
        isProcessed: true,
        isResolved: Math.random() > 0.3 // Randomly mark some as resolved for demo
      };
      
      const email = await storage.createEmail(newEmail);
      
      // Generate AI response
      const aiResponse = await geminiService.generateResponse(
        emailData.body,
        emailData.subject,
        sentimentAnalysis.sentiment,
        extractedInfo
      );
      
      // Save response
      await storage.createResponse({
        emailId: email.id,
        content: aiResponse.content,
        confidence: Math.round(aiResponse.confidence * 100),
        model: "gemini-2.5-flash",
        isSent: email.isResolved
      });
      
      console.log(`✅ Processed: ${email.subject} (${email.priority}/${email.sentiment})`);
      
    } catch (error) {
      console.error(`Failed to process email: ${emailData.subject}`, error);
    }
  }
  
  private generateTags(subject: string, body: string, extractedInfo: any): string[] {
    const tags: string[] = [];
    const text = (subject + " " + body).toLowerCase();
    
    // Priority-based tags
    if (text.includes('urgent') || text.includes('critical') || text.includes('immediate')) {
      tags.push('urgent');
    }
    
    // Issue type tags
    if (text.includes('login') || text.includes('access') || text.includes('account')) {
      tags.push('account-access');
    }
    
    if (text.includes('billing') || text.includes('payment') || text.includes('charge')) {
      tags.push('billing');
    }
    
    if (text.includes('technical') || text.includes('error') || text.includes('bug')) {
      tags.push('technical');
    }
    
    if (text.includes('integration') || text.includes('api')) {
      tags.push('integration');
    }
    
    if (text.includes('support') || text.includes('help')) {
      tags.push('support-request');
    }
    
    if (text.includes('downtime') || text.includes('server')) {
      tags.push('infrastructure');
    }
    
    if (text.includes('refund') || text.includes('subscription')) {
      tags.push('billing');
    }
    
    // Add extracted info tags
    if (extractedInfo.issueType) {
      tags.push(extractedInfo.issueType.toLowerCase().replace(/\s+/g, '-'));
    }
    
    if (extractedInfo.product) {
      tags.push(extractedInfo.product.toLowerCase().replace(/\s+/g, '-'));
    }
    
    return [...new Set(tags)]; // Remove duplicates
  }
  
  private async updateAnalytics(): Promise<void> {
    try {
      // Get all emails for analytics
      const allEmails = await storage.getEmails(1000);
      
      // Create analytics for the last 7 days
      const today = new Date();
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const dayEmails = allEmails.filter(email => {
          const emailDate = new Date(email.receivedAt);
          emailDate.setHours(0, 0, 0, 0);
          return emailDate.getTime() === date.getTime();
        });
        
        if (dayEmails.length === 0) continue;
        
        const totalEmails = dayEmails.length;
        const resolvedEmails = dayEmails.filter(e => e.isResolved).length;
        const pendingEmails = totalEmails - resolvedEmails;
        const urgentEmails = dayEmails.filter(e => e.priority === "urgent").length;
        
        // Calculate sentiment breakdown
        const sentimentCounts = dayEmails.reduce((acc, email) => {
          acc[email.sentiment] = (acc[email.sentiment] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const sentimentBreakdown = {
          positive: Math.round(((sentimentCounts.positive || 0) / totalEmails) * 100) || 0,
          neutral: Math.round(((sentimentCounts.neutral || 0) / totalEmails) * 100) || 0,
          negative: Math.round(((sentimentCounts.negative || 0) / totalEmails) * 100) || 0
        };
        
        // Mock response time (varies by day)
        const avgResponseTime = 60 + Math.floor(Math.random() * 120); // 1-3 hours
        
        await storage.createOrUpdateDailyAnalytics(date, {
          totalEmails,
          resolvedEmails,
          pendingEmails,
          urgentEmails,
          avgResponseTime,
          sentimentBreakdown
        });
      }
      
    } catch (error) {
      console.error("Failed to update analytics:", error);
    }
  }
}

export const seedService = new SeedService();
