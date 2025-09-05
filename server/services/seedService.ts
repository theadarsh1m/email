import { storage } from "../storage";
import { geminiService } from "./openaiService";
import { readFileSync } from "fs";
import { join } from "path";
import type { InsertEmail } from "@shared/schema";

export class SeedService {
  async seedFromCSV(): Promise<void> {
    try {
      console.log("Starting data seeding from CSV...");
      
      // Read and parse CSV file
      const csvPath = join(process.cwd(), "attached_assets", "68b1acd44f393_Sample_Support_Emails_Dataset_1757005849228.csv");
      const csvContent = readFileSync(csvPath, 'utf-8');
      const lines = csvContent.trim().split('\n');
      const headers = lines[0].split(',');
      
      const emailData = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;
        
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
      
      console.log(`Processing ${emailData.length} sample emails...`);
      
      // Process each email with AI analysis
      for (const email of emailData) {
        // Check if email already exists (by sender + subject combination)
        const existingEmails = await storage.getEmails(1000);
        const exists = existingEmails.some(e => 
          e.sender === email.sender && e.subject === email.subject && 
          e.body === email.body
        );
        
        if (exists) {
          console.log(`Skipping duplicate email: ${email.subject}`);
          continue;
        }
        
        await this.processEmailWithAI(email);
      }
      
      // Update analytics
      await this.updateAnalytics();
      
      console.log("CSV data seeding completed successfully!");
    } catch (error) {
      console.error("Failed to seed data from CSV:", error);
      throw error;
    }
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
