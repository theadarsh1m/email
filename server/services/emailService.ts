import { storage } from "../storage";
import { geminiService } from "./openaiService";
import { gmailService } from "./gmailService";
import type { InsertEmail } from "@shared/schema";

export class EmailService {
  async syncEmailsFromGmail(): Promise<void> {
    try {
      console.log("Starting Gmail sync...");
      const gmailMessages = await gmailService.getSupportEmails();
      
      for (const gmailMessage of gmailMessages) {
        const emailData = gmailService.extractEmailData(gmailMessage);
        
        // Check if email already exists
        const existingEmail = await storage.getEmailById(emailData.messageId);
        if (existingEmail) {
          continue; // Skip if already processed
        }

        // Process email with AI
        await this.processNewEmail(emailData);
      }
      
      console.log(`Processed ${gmailMessages.length} emails from Gmail`);
    } catch (error) {
      console.error("Gmail sync failed:", error);
    }
  }

  async processNewEmail(emailData: any): Promise<void> {
    try {
      // Analyze sentiment
      const sentimentAnalysis = await geminiService.analyzeSentiment(emailData.body);
      
      // Analyze priority
      const priorityAnalysis = await geminiService.analyzePriority(emailData.body, emailData.subject);
      
      // Extract information
      const extractedInfo = await geminiService.extractInformation(emailData.body);
      
      // Create email record
      const newEmail: InsertEmail = {
        messageId: emailData.messageId,
        subject: emailData.subject,
        sender: emailData.sender,
        body: emailData.body,
        receivedAt: emailData.receivedAt,
        sentiment: sentimentAnalysis.sentiment,
        priority: priorityAnalysis.priority,
        extractedInfo: extractedInfo,
        tags: this.generateTags(emailData.subject, extractedInfo),
        isProcessed: true
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
        model: "gemini-2.5-flash"
      });

      console.log(`Processed email: ${email.subject} (${email.priority})`);
    } catch (error) {
      console.error("Failed to process email:", error);
    }
  }

  async processUrgentEmails(): Promise<void> {
    const urgentEmails = await storage.getEmailsByPriority("urgent");
    const unprocessedUrgent = urgentEmails.filter(email => !email.isProcessed);
    
    for (const email of unprocessedUrgent) {
      await this.processNewEmail({
        messageId: email.messageId,
        subject: email.subject,
        sender: email.sender,
        body: email.body,
        receivedAt: email.receivedAt
      });
    }
  }

  async generateNewResponse(emailId: string): Promise<string> {
    const email = await storage.getEmailById(emailId);
    if (!email) {
      throw new Error("Email not found");
    }

    const extractedInfo = email.extractedInfo as any || {};
    
    const aiResponse = await geminiService.generateResponse(
      email.body,
      email.subject,
      email.sentiment,
      extractedInfo
    );

    // Save new response
    await storage.createResponse({
      emailId: email.id,
      content: aiResponse.content,
      confidence: Math.round(aiResponse.confidence * 100),
      model: "gemini-2.5-flash"
    });

    return aiResponse.content;
  }

  async sendResponse(responseId: string): Promise<boolean> {
    const response = await storage.getResponsesByEmailId(responseId);
    if (!response || response.length === 0) {
      return false;
    }

    const resp = response[0];
    const email = await storage.getEmailById(resp.emailId);
    if (!email) {
      return false;
    }

    const success = await gmailService.sendReply(
      email.sender,
      email.subject,
      resp.content,
      email.messageId
    );

    if (success) {
      await storage.markResponseAsSent(resp.id);
      await storage.markEmailAsResolved(email.id);
      await gmailService.markAsRead(email.messageId);
    }

    return success;
  }

  async updateDailyAnalytics(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const allEmails = await storage.getEmails(1000); // Get recent emails
    const todayEmails = allEmails.filter(email => 
      email.receivedAt >= today
    );

    const totalEmails = todayEmails.length;
    const resolvedEmails = todayEmails.filter(e => e.isResolved).length;
    const pendingEmails = totalEmails - resolvedEmails;
    const urgentEmails = todayEmails.filter(e => e.priority === "urgent").length;

    // Calculate sentiment breakdown
    const sentimentCounts = todayEmails.reduce((acc, email) => {
      acc[email.sentiment] = (acc[email.sentiment] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sentimentBreakdown = {
      positive: Math.round(((sentimentCounts.positive || 0) / totalEmails) * 100) || 0,
      neutral: Math.round(((sentimentCounts.neutral || 0) / totalEmails) * 100) || 0,
      negative: Math.round(((sentimentCounts.negative || 0) / totalEmails) * 100) || 0
    };

    // Calculate average response time (mock for now)
    const avgResponseTime = 144; // 2.4 hours in minutes

    await storage.createOrUpdateDailyAnalytics(today, {
      totalEmails,
      resolvedEmails,
      pendingEmails,
      urgentEmails,
      avgResponseTime,
      sentimentBreakdown
    });
  }

  private generateTags(subject: string, extractedInfo: any): string[] {
    const tags: string[] = [];
    
    // Add tags based on subject
    if (subject.toLowerCase().includes('urgent') || subject.toLowerCase().includes('critical')) {
      tags.push('urgent');
    }
    
    if (subject.toLowerCase().includes('account') || subject.toLowerCase().includes('login')) {
      tags.push('account-access');
    }
    
    if (subject.toLowerCase().includes('technical') || subject.toLowerCase().includes('error')) {
      tags.push('technical-support');
    }
    
    if (subject.toLowerCase().includes('feature') || subject.toLowerCase().includes('request')) {
      tags.push('feature-request');
    }
    
    // Add tags based on extracted info
    if (extractedInfo.issueType) {
      tags.push(extractedInfo.issueType.toLowerCase().replace(/\s+/g, '-'));
    }
    
    if (extractedInfo.product) {
      tags.push(extractedInfo.product.toLowerCase().replace(/\s+/g, '-'));
    }
    
    return [...new Set(tags)]; // Remove duplicates
  }
}

export const emailService = new EmailService();
