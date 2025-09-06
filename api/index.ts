import "dotenv/config";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { storage } from "../server/storage";
import { emailService } from "../server/services/emailService";
import { gmailService } from "../server/services/gmailService";
import { seedService } from "../server/services/seedService";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { method, url } = req;
  const path = url?.replace('/api', '') || '';

  try {
    // Route handling
    if (method === 'GET' && path === '/emails') {
      return await handleGetEmails(req, res);
    } else if (method === 'GET' && path.match(/\/emails\/[^/]+$/)) {
      return await handleGetEmailById(req, res, path);
    } else if (method === 'GET' && path.match(/\/emails\/[^/]+\/responses$/)) {
      return await handleGetEmailResponses(req, res, path);
    } else if (method === 'POST' && path.match(/\/emails\/[^/]+\/responses$/)) {
      return await handleCreateResponse(req, res, path);
    } else if (method === 'POST' && path.match(/\/emails\/[^/]+\/resolve$/)) {
      return await handleResolveEmail(req, res, path);
    } else if (method === 'POST' && path.match(/\/responses\/[^/]+\/send$/)) {
      return await handleSendResponse(req, res, path);
    } else if (method === 'POST' && path === '/sync') {
      return await handleSync(req, res);
    } else if (method === 'POST' && path === '/process-urgent') {
      return await handleProcessUrgent(req, res);
    } else if (method === 'POST' && path === '/seed') {
      return await handleSeed(req, res);
    } else if (method === 'GET' && path === '/analytics/today') {
      return await handleAnalyticsToday(req, res);
    } else if (method === 'GET' && path === '/analytics/range') {
      return await handleAnalyticsRange(req, res);
    } else if (method === 'GET' && path === '/auth/gmail') {
      return await handleGmailAuth(req, res);
    } else if (method === 'POST' && path === '/auth/gmail/callback') {
      return await handleGmailCallback(req, res);
    } else {
      res.status(404).json({ error: 'Route not found' });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function handleGetEmails(req: VercelRequest, res: VercelResponse) {
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
}

async function handleGetEmailById(req: VercelRequest, res: VercelResponse, path: string) {
  try {
    const id = path.split('/')[2];
    const email = await storage.getEmailById(id);
    if (!email) {
      return res.status(404).json({ error: "Email not found" });
    }
    res.json(email);
  } catch (error) {
    console.error("Failed to fetch email:", error);
    res.status(500).json({ error: "Failed to fetch email" });
  }
}

async function handleGetEmailResponses(req: VercelRequest, res: VercelResponse, path: string) {
  try {
    const id = path.split('/')[2];
    const responses = await storage.getResponsesByEmailId(id);
    res.json(responses);
  } catch (error) {
    console.error("Failed to fetch responses:", error);
    res.status(500).json({ error: "Failed to fetch responses" });
  }
}

async function handleCreateResponse(req: VercelRequest, res: VercelResponse, path: string) {
  try {
    const id = path.split('/')[2];
    const content = await emailService.generateNewResponse(id);
    res.json({ content });
  } catch (error) {
    console.error("Failed to generate response:", error);
    res.status(500).json({ error: "Failed to generate response" });
  }
}

async function handleResolveEmail(req: VercelRequest, res: VercelResponse, path: string) {
  try {
    const id = path.split('/')[2];
    await storage.markEmailAsResolved(id);
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to resolve email:", error);
    res.status(500).json({ error: "Failed to resolve email" });
  }
}

async function handleSendResponse(req: VercelRequest, res: VercelResponse, path: string) {
  try {
    const id = path.split('/')[2];
    console.log(`Simulating email send for response ${id}`);
    
    await storage.updateResponse(id, { 
      isSent: true, 
      sentAt: new Date() 
    });
    
    const responses = await storage.getResponsesByEmailId(id);
    if (responses.length > 0) {
      await storage.markEmailAsResolved(responses[0].emailId);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to send response:", error);
    res.status(500).json({ error: "Failed to send response" });
  }
}

async function handleSync(req: VercelRequest, res: VercelResponse) {
  try {
    await emailService.syncEmailsFromGmail();
    await emailService.updateDailyAnalytics();
    res.json({ success: true, message: "Email sync completed" });
  } catch (error) {
    console.error("Sync failed:", error);
    res.status(500).json({ error: "Sync failed" });
  }
}

async function handleProcessUrgent(req: VercelRequest, res: VercelResponse) {
  try {
    const urgentEmails = await storage.getEmailsByPriority("urgent");
    const unprocessedUrgent = urgentEmails.filter(email => !email.isResolved);
    let processedCount = 0;

    for (const email of unprocessedUrgent.slice(0, 5)) {
      try {
        const responses = await storage.getResponsesByEmailId(email.id);
        if (responses.length === 0) {
          await emailService.generateNewResponse(email.id);
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
}

async function handleSeed(req: VercelRequest, res: VercelResponse) {
  try {
    console.log("🌱 Starting CSV data seeding...");
    console.log("Environment check:", {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? "✅ Present" : "❌ Missing",
      GOOGLE_GEMINI_API_KEY: process.env.GOOGLE_GEMINI_API_KEY ? "✅ Present" : "❌ Missing"
    });
    
    // Check database connection first
    try {
      const emails = await storage.getEmails(1);
      console.log("✅ Database connection successful");
    } catch (dbError) {
      console.error("❌ Database connection failed:", dbError);
      return res.status(500).json({ 
        error: "Database connection failed", 
        details: dbError instanceof Error ? dbError.message : String(dbError)
      });
    }
    
    await seedService.seedFromCSV();
    
    // Only update analytics if seeding succeeded
    try {
      await emailService.updateDailyAnalytics();
    } catch (analyticsError) {
      console.warn("⚠️ Analytics update failed, but seeding succeeded:", analyticsError);
    }
    
    res.json({ 
      success: true, 
      message: "✅ Sample email data loaded and processed with AI analysis" 
    });
  } catch (error) {
    console.error("❌ Seed operation failed:", error);
    
    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error("Error details:", { message: errorMessage, stack: errorStack });
    
    res.status(500).json({ 
      error: "Failed to seed database with sample data",
      details: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
}

async function handleAnalyticsToday(req: VercelRequest, res: VercelResponse) {
  try {
    const stats = await storage.getTodayStats();
    res.json(stats);
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
}

async function handleAnalyticsRange(req: VercelRequest, res: VercelResponse) {
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
}

async function handleGmailAuth(req: VercelRequest, res: VercelResponse) {
  try {
    const authUrl = await gmailService.getAuthUrl();
    res.json({ authUrl });
  } catch (error) {
    console.error("Failed to get auth URL:", error);
    res.status(500).json({ error: "Failed to get auth URL" });
  }
}

async function handleGmailCallback(req: VercelRequest, res: VercelResponse) {
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
}
