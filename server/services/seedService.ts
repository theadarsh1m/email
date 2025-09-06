import { storage } from "../storage";
import { geminiService } from "./openaiService";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import type { InsertEmail } from "@shared/schema";

// Comprehensive sample data embedded for Vercel deployment
const DEFAULT_SAMPLE_EMAILS = [
  // Customer Support Emails
  {
    sender: "john.doe@techcorp.com",
    subject: "Password Reset Issue",
    body: "I've been trying to reset my password for the past hour, but I'm not receiving the email. Can you help me with this?",
    sent_date: "2024-12-06 09:15:00"
  },
  {
    sender: "sarah.johnson@retailco.com",
    subject: "Billing Inquiry - Double Charge",
    body: "I was charged twice for my monthly subscription. Transaction IDs: TX123456 and TX123457. Please refund one of them.",
    sent_date: "2024-12-06 10:30:00"
  },
  {
    sender: "mike.smith@startup.io",
    subject: "Feature Request - API Documentation",
    body: "Could you provide more detailed API documentation? Specifically looking for webhooks and rate limiting information.",
    sent_date: "2024-12-06 11:45:00"
  },
  {
    sender: "lisa.brown@agency.net",
    subject: "URGENT: System Outage",
    body: "Our entire team cannot access the platform. This is affecting our client deliverables. Need immediate assistance!",
    sent_date: "2024-12-06 13:20:00"
  },
  {
    sender: "david.wilson@consultant.com",
    subject: "Data Export Question",
    body: "How can I export all my data from your platform? I need it in CSV format for analysis purposes.",
    sent_date: "2024-12-06 14:10:00"
  },
  {
    sender: "emma.davis@nonprofit.org",
    subject: "Student Discount Application",
    body: "I'm a student and would like to apply for your educational discount. I have my student ID ready for verification.",
    sent_date: "2024-12-06 15:25:00"
  },
  {
    sender: "alex.garcia@freelance.com",
    subject: "Integration Help - Slack",
    body: "I'm having trouble setting up the Slack integration. The webhook URL doesn't seem to work correctly.",
    sent_date: "2024-12-06 16:40:00"
  },
  {
    sender: "jennifer.lee@marketing.co",
    subject: "Account Upgrade Question",
    body: "What are the differences between Pro and Enterprise plans? I need more storage and team members.",
    sent_date: "2024-12-06 17:55:00"
  },
  {
    sender: "robert.taylor@finance.org",
    subject: "Security Concern - Suspicious Activity",
    body: "I noticed some unusual login attempts on my account. Can you check the security logs?",
    sent_date: "2024-12-05 08:30:00"
  },
  {
    sender: "maria.rodriguez@ecommerce.com",
    subject: "Mobile App Bug Report",
    body: "The mobile app crashes when I try to upload images larger than 5MB. This happens on both iOS and Android.",
    sent_date: "2024-12-05 09:45:00"
  },
  
  // Technical Support Emails
  {
    sender: "dev.team@startupx.com",
    subject: "Critical Bug - Payment Processing",
    body: "Our payment processing is failing for all credit card transactions. Error code: CC_GATEWAY_ERROR. This is blocking our revenue!",
    sent_date: "2024-12-06 08:00:00"
  },
  {
    sender: "qa.lead@softwaretech.io",
    subject: "Performance Issue - Database Queries",
    body: "The application response time has increased from 200ms to 3000ms since yesterday. Database queries seem to be the bottleneck.",
    sent_date: "2024-12-06 09:30:00"
  },
  {
    sender: "sysadmin@infrastructure.net",
    subject: "Server Downtime Alert",
    body: "Server cluster us-east-1 is experiencing intermittent downtime. Users in the Eastern US cannot access the service.",
    sent_date: "2024-12-06 11:15:00"
  },
  {
    sender: "security@fintech.company",
    subject: "URGENT: Potential Security Breach",
    body: "We detected unusual API calls from unknown IP addresses. Possible security breach. Need immediate investigation!",
    sent_date: "2024-12-06 12:45:00"
  },
  {
    sender: "devops@cloudservices.org",
    subject: "SSL Certificate Expiry",
    body: "SSL certificates for our production domains expire in 3 days. Need renewal process and deployment guidance.",
    sent_date: "2024-12-06 14:20:00"
  },
  {
    sender: "api.team@integration.hub",
    subject: "Webhook Failures",
    body: "Webhooks are failing with 500 errors since this morning. Our clients are not receiving real-time updates.",
    sent_date: "2024-12-06 15:50:00"
  },
  {
    sender: "mobile.dev@appstudio.com",
    subject: "iOS App Store Rejection",
    body: "App Store rejected our latest version citing privacy policy issues. Need guidance on compliance requirements.",
    sent_date: "2024-12-06 17:10:00"
  },
  {
    sender: "backend.engineer@microservices.co",
    subject: "Memory Leak in Production",
    body: "Production servers showing memory usage climbing to 90%+ and not releasing. Potential memory leak in the codebase.",
    sent_date: "2024-12-05 10:30:00"
  },
  {
    sender: "frontend.dev@webapp.solutions",
    subject: "Cross-Browser Compatibility",
    body: "Our application breaks on Safari and older versions of Firefox. CSS grid layouts not rendering correctly.",
    sent_date: "2024-12-05 12:00:00"
  },
  {
    sender: "data.analyst@analytics.firm",
    subject: "Database Migration Issues",
    body: "Data migration from MySQL to PostgreSQL failed at 60%. Need rollback strategy and migration troubleshooting.",
    sent_date: "2024-12-05 13:45:00"
  }
];

export class SeedService {
  // Simple seeding without AI analysis for emergency fallback
  async seedSimple(): Promise<void> {
    try {
      console.log("🌱 Starting simple data seeding (no AI analysis)...");
      
      const existingEmails = await storage.getEmails(50);
      console.log(`📋 Found ${existingEmails.length} existing emails`);
      
      let processedCount = 0;
      
      for (const emailData of DEFAULT_SAMPLE_EMAILS) {
        // Check for duplicates
        const exists = existingEmails.some(e => 
          e.sender === emailData.sender && e.subject === emailData.subject
        );
        
        if (exists) continue;
        
        // Create email with basic classification
        const isUrgent = emailData.subject.toLowerCase().includes('urgent') || 
                        emailData.subject.toLowerCase().includes('critical');
        
        const newEmail: InsertEmail = {
          messageId: `simple-seed-${Date.now()}-${processedCount}`,
          subject: emailData.subject,
          sender: emailData.sender,
          body: emailData.body,
          receivedAt: new Date(emailData.sent_date),
          sentiment: "neutral",
          priority: isUrgent ? "urgent" : "normal",
          extractedInfo: {},
          tags: [],
          isProcessed: false,
          isResolved: false
        };
        
        await storage.createEmail(newEmail);
        processedCount++;
      }
      
      console.log(`🎉 Simple seeding completed! Processed: ${processedCount} emails`);
      
    } catch (error) {
      console.error("💥 Simple seeding failed:", error);
      throw error;
    }
  }
  
  async seedFromCSV(): Promise<void> {
    try {
      console.log("🌱 Starting data seeding...");
      console.log("📊 Environment:", process.env.NODE_ENV || 'development');
      console.log("🏠 Current working directory:", process.cwd());
      
      // In production/serverless, skip file system access and use embedded data
      const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;
      let allEmailData: any[] = [];
      
      if (isProduction) {
        console.log("🚀 Production environment detected - using embedded sample data");
        allEmailData = DEFAULT_SAMPLE_EMAILS;
      } else {
        console.log("🔧 Development environment - attempting to load CSV files");
        
        // Try to load from CSV files in development only
        const csvFiles = [
          join(process.cwd(), "sample_data", "customer_support_emails.csv"),
          join(process.cwd(), "sample_data", "technical_support_emails.csv")
        ];
        
        let csvFilesLoaded = 0;
        
        for (const csvPath of csvFiles) {
          if (existsSync(csvPath)) {
            try {
              console.log(`📁 Loading CSV file: ${csvPath}`);
              const csvContent = readFileSync(csvPath, 'utf-8');
              const emailsFromFile = this.parseCSVContent(csvContent);
              allEmailData = [...allEmailData, ...emailsFromFile];
              csvFilesLoaded++;
              console.log(`✅ Loaded ${emailsFromFile.length} emails from ${csvPath}`);
            } catch (error) {
              console.warn(`❌ Failed to load CSV file ${csvPath}:`, error);
            }
          }
        }
        
        // Fallback to embedded data if no CSV files found
        if (csvFilesLoaded === 0) {
          console.log("⚠️ No CSV files found in development, using embedded sample data");
          allEmailData = DEFAULT_SAMPLE_EMAILS;
        }
      }
      
      console.log(`📧 Processing ${allEmailData.length} sample emails...`);
      
      // Check if we already have data to avoid duplicates
      const existingEmails = await storage.getEmails(100);
      console.log(`📋 Found ${existingEmails.length} existing emails in database`);
      
      let processedCount = 0;
      let skippedCount = 0;
      
      for (const email of allEmailData) {
        // Check if email already exists
        const exists = existingEmails.some(e => 
          e.sender === email.sender && e.subject === email.subject
        );
        
        if (exists) {
          console.log(`⏭️ Skipping duplicate: ${email.subject}`);
          skippedCount++;
          continue;
        }
        
        try {
          await this.processEmailWithAI(email);
          processedCount++;
          
          // Add a small delay to prevent rate limiting
          if (processedCount % 5 === 0) {
            console.log(`💤 Processed ${processedCount}/${allEmailData.length} emails...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          console.error(`❌ Failed to process email "${email.subject}":`, error);
        }
      }
      
      // Update analytics
      try {
        await this.updateAnalytics();
        console.log("📈 Analytics updated successfully");
      } catch (analyticsError) {
        console.warn("⚠️ Analytics update failed (non-critical):", analyticsError);
      }
      
      console.log(`🎉 Seeding completed! ✅ Processed: ${processedCount}, ⏭️ Skipped: ${skippedCount}`);
    } catch (error) {
      console.error("💥 Seeding failed:", error);
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
      console.log(`🔄 Processing: ${emailData.subject}`);
      
      // Generate unique message ID
      const messageId = `seed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // AI Analysis with fallbacks
      let sentimentAnalysis, priorityAnalysis, extractedInfo;
      
      try {
        sentimentAnalysis = await geminiService.analyzeSentiment(emailData.body);
      } catch (error) {
        console.warn(`⚠️ Sentiment analysis failed for "${emailData.subject}", using fallback`);
        sentimentAnalysis = { sentiment: "neutral", confidence: 0, reasoning: "Analysis failed" };
      }
      
      try {
        priorityAnalysis = await geminiService.analyzePriority(emailData.body, emailData.subject);
      } catch (error) {
        console.warn(`⚠️ Priority analysis failed for "${emailData.subject}", using fallback`);
        const isUrgent = emailData.subject.toLowerCase().includes('urgent') || 
                        emailData.subject.toLowerCase().includes('critical') ||
                        emailData.body.toLowerCase().includes('urgent');
        priorityAnalysis = { 
          priority: isUrgent ? "urgent" : "normal", 
          confidence: 0.5, 
          keywords: [], 
          reasoning: "Analysis failed - using keyword detection" 
        };
      }
      
      try {
        extractedInfo = await geminiService.extractInformation(emailData.body);
      } catch (error) {
        console.warn(`⚠️ Information extraction failed for "${emailData.subject}", using fallback`);
        extractedInfo = { urgencyKeywords: [] };
      }
      
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
      
      // Generate AI response with fallback
      let aiResponse;
      try {
        aiResponse = await geminiService.generateResponse(
          emailData.body,
          emailData.subject,
          sentimentAnalysis.sentiment,
          extractedInfo
        );
      } catch (error) {
        console.warn(`⚠️ Response generation failed for "${emailData.subject}", using fallback`);
        aiResponse = {
          content: "Thank you for contacting us. We have received your message and will respond as soon as possible. Our team will review your inquiry and get back to you within 24 hours.",
          tone: "professional",
          confidence: 0.5,
          reasoning: "Fallback response due to API error"
        };
      }
      
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
      console.error(`❌ Failed to process email: ${emailData.subject}`, error);
      throw error; // Re-throw to be handled by calling function
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
