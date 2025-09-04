import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { emailService } from "./services/emailService";
import { gmailService } from "./services/gmailService";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Email endpoints
  app.get("/api/emails", async (req, res) => {
    try {
      const { priority, sentiment, limit } = req.query;
      let emails;
      
      if (priority && typeof priority === "string") {
        emails = await storage.getEmailsByPriority(priority);
      } else if (sentiment && typeof sentiment === "string") {
        emails = await storage.getEmailsBySentiment(sentiment);
      } else {
        const emailLimit = limit ? parseInt(limit as string) : 50;
        emails = await storage.getEmails(emailLimit);
      }
      
      res.json(emails);
    } catch (error) {
      console.error("Failed to fetch emails:", error);
      res.status(500).json({ error: "Failed to fetch emails" });
    }
  });

  app.get("/api/emails/:id", async (req, res) => {
    try {
      const email = await storage.getEmailById(req.params.id);
      if (!email) {
        return res.status(404).json({ error: "Email not found" });
      }
      res.json(email);
    } catch (error) {
      console.error("Failed to fetch email:", error);
      res.status(500).json({ error: "Failed to fetch email" });
    }
  });

  app.get("/api/emails/:id/responses", async (req, res) => {
    try {
      const responses = await storage.getResponsesByEmailId(req.params.id);
      res.json(responses);
    } catch (error) {
      console.error("Failed to fetch responses:", error);
      res.status(500).json({ error: "Failed to fetch responses" });
    }
  });

  app.post("/api/emails/:id/responses", async (req, res) => {
    try {
      const content = await emailService.generateNewResponse(req.params.id);
      res.json({ content });
    } catch (error) {
      console.error("Failed to generate response:", error);
      res.status(500).json({ error: "Failed to generate response" });
    }
  });

  app.post("/api/emails/:id/resolve", async (req, res) => {
    try {
      await storage.markEmailAsResolved(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to resolve email:", error);
      res.status(500).json({ error: "Failed to resolve email" });
    }
  });

  app.post("/api/responses/:id/send", async (req, res) => {
    try {
      // For demo purposes, we'll simulate sending the email successfully
      // In a real implementation, this would use the Gmail service
      console.log(`Simulating email send for response ${req.params.id}`);
      
      // Mark the response as sent in the database
      await storage.updateResponse(req.params.id, { 
        isSent: true, 
        sentAt: new Date() 
      });
      
      // Mark the associated email as resolved
      const responses = await storage.getResponsesByEmailId(req.params.id);
      if (responses.length > 0) {
        await storage.markEmailAsResolved(responses[0].emailId);
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to send response:", error);
      res.status(500).json({ error: "Failed to send response" });
    }
  });

  // Sync endpoints
  app.post("/api/sync", async (req, res) => {
    try {
      await emailService.syncEmailsFromGmail();
      await emailService.updateDailyAnalytics();
      res.json({ success: true, message: "Email sync completed" });
    } catch (error) {
      console.error("Sync failed:", error);
      res.status(500).json({ error: "Sync failed" });
    }
  });

  // Auto-process urgent emails
  app.post("/api/process-urgent", async (req, res) => {
    try {
      const urgentEmails = await storage.getEmailsByPriority("urgent");
      const unprocessedUrgent = urgentEmails.filter(email => !email.isResolved);
      let processedCount = 0;

      for (const email of unprocessedUrgent.slice(0, 5)) { // Process up to 5 at a time
        try {
          // Generate AI response if none exists
          const responses = await storage.getResponsesByEmailId(email.id);
          if (responses.length === 0) {
            const newResponse = await emailService.generateNewResponse(email.id);
            processedCount++;
          }
        } catch (error) {
          console.error(`Failed to process urgent email ${email.id}:`, error);
        }
      }

      res.json({ 
        success: true, 
        message: `Processed ${processedCount} urgent emails`,
        processedCount 
      });
    } catch (error) {
      console.error("Failed to process urgent emails:", error);
      res.status(500).json({ error: "Failed to process urgent emails" });
    }
  });

  // Analytics endpoints
  app.get("/api/analytics/today", async (req, res) => {
    try {
      const stats = await storage.getTodayStats();
      res.json(stats);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  app.get("/api/analytics/range", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ error: "Start date and end date required" });
      }
      
      const analytics = await storage.getAnalyticsByDateRange(
        new Date(startDate as string),
        new Date(endDate as string)
      );
      res.json(analytics);
    } catch (error) {
      console.error("Failed to fetch analytics range:", error);
      res.status(500).json({ error: "Failed to fetch analytics range" });
    }
  });

  // Gmail auth endpoints
  app.get("/api/auth/gmail", async (req, res) => {
    try {
      const authUrl = await gmailService.getAuthUrl();
      res.json({ authUrl });
    } catch (error) {
      console.error("Failed to get auth URL:", error);
      res.status(500).json({ error: "Failed to get auth URL" });
    }
  });

  app.post("/api/auth/gmail/callback", async (req, res) => {
    try {
      const { code } = req.body;
      if (!code) {
        return res.status(400).json({ error: "Authorization code required" });
      }
      
      const tokens = await gmailService.exchangeCodeForTokens(code);
      res.json({ success: true, tokens });
    } catch (error) {
      console.error("Failed to exchange tokens:", error);
      res.status(500).json({ error: "Failed to exchange tokens" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
