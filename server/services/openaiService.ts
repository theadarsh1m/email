import { GoogleGenAI } from "@google/genai";

// Using Gemini 2.5 Flash as the primary model for analysis tasks
const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface SentimentAnalysis {
  sentiment: "positive" | "negative" | "neutral";
  confidence: number;
  reasoning: string;
}

export interface PriorityAnalysis {
  priority: "urgent" | "normal";
  confidence: number;
  keywords: string[];
  reasoning: string;
}

export interface ExtractedInfo {
  customerName?: string;
  customerId?: string;
  phone?: string;
  email?: string;
  company?: string;
  issueType?: string;
  product?: string;
  urgencyKeywords: string[];
}

export interface EmailResponse {
  content: string;
  tone: string;
  confidence: number;
  reasoning: string;
}

export class GeminiService {
  async analyzeSentiment(emailContent: string): Promise<SentimentAnalysis> {
    try {
      const response = await genai.models.generateContent({
        model: "gemini-2.5-flash",
        config: {
          systemInstruction: `You are a sentiment analysis expert. Analyze the sentiment of customer support emails. 
            Respond with JSON in this exact format: {
              "sentiment": "positive" | "negative" | "neutral",
              "confidence": number between 0 and 1,
              "reasoning": "brief explanation of why you classified it this way"
            }`,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              sentiment: { type: "string", enum: ["positive", "negative", "neutral"] },
              confidence: { type: "number" },
              reasoning: { type: "string" }
            },
            required: ["sentiment", "confidence", "reasoning"]
          }
        },
        contents: `Analyze the sentiment of this email:\n\n${emailContent}`
      });

      const result = JSON.parse(response.text || "{}");
      return {
        sentiment: result.sentiment || "neutral",
        confidence: Math.max(0, Math.min(1, result.confidence || 0)),
        reasoning: result.reasoning || "Unable to determine reasoning"
      };
    } catch (error) {
      console.error("Sentiment analysis failed:", error);
      return {
        sentiment: "neutral",
        confidence: 0,
        reasoning: "Analysis failed due to API error"
      };
    }
  }

  async analyzePriority(emailContent: string, subject: string): Promise<PriorityAnalysis> {
    try {
      const response = await genai.models.generateContent({
        model: "gemini-2.5-flash",
        config: {
          systemInstruction: `You are a priority classification expert for customer support emails. 
            Classify emails as "urgent" or "normal" based on content and urgency indicators.
            
            URGENT indicators: "immediately", "critical", "cannot access", "down", "broken", "emergency", "asap", "urgent", "help", "issue", "problem", "error", "failed", "not working"
            
            Respond with JSON in this exact format: {
              "priority": "urgent" | "normal",
              "confidence": number between 0 and 1,
              "keywords": ["array", "of", "detected", "urgency", "keywords"],
              "reasoning": "brief explanation of classification"
            }`,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              priority: { type: "string", enum: ["urgent", "normal"] },
              confidence: { type: "number" },
              keywords: { type: "array", items: { type: "string" } },
              reasoning: { type: "string" }
            },
            required: ["priority", "confidence", "keywords", "reasoning"]
          }
        },
        contents: `Subject: ${subject}\n\nContent: ${emailContent}`
      });

      const result = JSON.parse(response.text || "{}");
      return {
        priority: result.priority || "normal",
        confidence: Math.max(0, Math.min(1, result.confidence || 0)),
        keywords: Array.isArray(result.keywords) ? result.keywords : [],
        reasoning: result.reasoning || "Unable to determine reasoning"
      };
    } catch (error) {
      console.error("Priority analysis failed:", error);
      return {
        priority: "normal",
        confidence: 0,
        keywords: [],
        reasoning: "Analysis failed due to API error"
      };
    }
  }

  async extractInformation(emailContent: string): Promise<ExtractedInfo> {
    try {
      const response = await genai.models.generateContent({
        model: "gemini-2.5-flash",
        config: {
          systemInstruction: `You are an information extraction expert. Extract key customer information from support emails.
            
            Respond with JSON in this exact format: {
              "customerName": "full name if found",
              "customerId": "customer/account ID if mentioned",
              "phone": "phone number if provided",
              "email": "email address if different from sender",
              "company": "company name if mentioned",
              "issueType": "categorize the main issue type",
              "product": "product/service mentioned",
              "urgencyKeywords": ["array", "of", "urgency", "related", "words"]
            }
            
            Use null for missing fields.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              customerName: { type: ["string", "null"] },
              customerId: { type: ["string", "null"] },
              phone: { type: ["string", "null"] },
              email: { type: ["string", "null"] },
              company: { type: ["string", "null"] },
              issueType: { type: ["string", "null"] },
              product: { type: ["string", "null"] },
              urgencyKeywords: { type: "array", items: { type: "string" } }
            },
            required: ["urgencyKeywords"]
          }
        },
        contents: `Extract information from this email:\n\n${emailContent}`
      });

      const result = JSON.parse(response.text || "{}");
      return {
        customerName: result.customerName || undefined,
        customerId: result.customerId || undefined,
        phone: result.phone || undefined,
        email: result.email || undefined,
        company: result.company || undefined,
        issueType: result.issueType || undefined,
        product: result.product || undefined,
        urgencyKeywords: Array.isArray(result.urgencyKeywords) ? result.urgencyKeywords : []
      };
    } catch (error) {
      console.error("Information extraction failed:", error);
      return { urgencyKeywords: [] };
    }
  }

  async generateResponse(emailContent: string, subject: string, sentiment: string, extractedInfo: ExtractedInfo): Promise<EmailResponse> {
    try {
      const contextPrompt = this.buildContextPrompt(sentiment, extractedInfo);
      const knowledgeBase = this.getKnowledgeBase(subject, emailContent);
      
      const response = await genai.models.generateContent({
        model: "gemini-2.5-flash",
        config: {
          systemInstruction: `You are a professional customer support specialist with access to a comprehensive knowledge base. Generate empathetic, helpful, and professional email responses using RAG (Retrieval-Augmented Generation) principles.

            KNOWLEDGE BASE:
            ${knowledgeBase}
            
            RESPONSE GUIDELINES:
            - Always maintain a professional and friendly tone
            - Be empathetic, especially for frustrated customers (use phrases like "I understand your frustration" or "I apologize for the inconvenience")
            - Provide specific, actionable solutions based on the knowledge base
            - Include specific details from the customer's message to show you've read it carefully
            - Use appropriate greeting ("Dear [Name]" if available, otherwise "Hello")
            - Provide clear next steps and timeline expectations
            - Include contact information for further assistance
            - Keep responses concise but comprehensive
            - If mentioning products/services, reference them accurately from the knowledge base
            
            CONTEXT AWARENESS:
            ${contextPrompt}
            
            URGENCY HANDLING:
            - For urgent issues: Acknowledge urgency, provide immediate steps, escalate if needed
            - For billing issues: Offer specific resolution steps and timeline
            - For technical issues: Provide troubleshooting steps or escalation
            - For account issues: Guide through verification and resolution process
            
            Respond with JSON in this exact format: {
              "content": "the complete email response",
              "tone": "description of the tone used",
              "confidence": number between 0 and 1,
              "reasoning": "brief explanation of response approach"
            }`,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              content: { type: "string" },
              tone: { type: "string" },
              confidence: { type: "number" },
              reasoning: { type: "string" }
            },
            required: ["content", "tone", "confidence", "reasoning"]
          }
        },
        contents: `Generate a professional response to this email:
            
            Subject: ${subject}
            
            Content: ${emailContent}`
      });

      const result = JSON.parse(response.text || "{}");
      return {
        content: result.content || "Thank you for your email. We have received your message and will respond shortly.",
        tone: result.tone || "professional",
        confidence: Math.max(0, Math.min(1, result.confidence || 0)),
        reasoning: result.reasoning || "Standard response generated"
      };
    } catch (error) {
      console.error("Response generation failed:", error);
      return {
        content: "Thank you for contacting us. We have received your message and will respond as soon as possible.",
        tone: "professional",
        confidence: 0,
        reasoning: "Fallback response due to API error"
      };
    }
  }

  private buildContextPrompt(sentiment: string, extractedInfo: ExtractedInfo): string {
    let context = "";
    
    if (sentiment === "negative") {
      context += "The customer appears frustrated or upset. Acknowledge their frustration empathetically and prioritize resolving their issue quickly. ";
    } else if (sentiment === "positive") {
      context += "The customer has a positive tone. Maintain this positive interaction while being helpful. ";
    }
    
    if (extractedInfo.customerName) {
      context += `Address the customer by name: ${extractedInfo.customerName}. `;
    }
    
    if (extractedInfo.customerId) {
      context += `Reference their customer ID: ${extractedInfo.customerId}. `;
    }
    
    if (extractedInfo.issueType) {
      context += `The issue type is: ${extractedInfo.issueType}. `;
    }
    
    if (extractedInfo.product) {
      context += `They are asking about: ${extractedInfo.product}. `;
    }
    
    if (extractedInfo.urgencyKeywords.length > 0) {
      context += `Urgency indicators detected: ${extractedInfo.urgencyKeywords.join(", ")}. Prioritize quick resolution. `;
    }
    
    return context;
  }

  private getKnowledgeBase(subject: string, content: string): string {
    const text = (subject + " " + content).toLowerCase();
    let knowledgeBase = "COMPANY INFORMATION:\n";
    knowledgeBase += "- Company: TechSolutions Inc.\n";
    knowledgeBase += "- Support Hours: Monday-Friday 9AM-6PM EST\n";
    knowledgeBase += "- Support Email: support@techsolutions.com\n";
    knowledgeBase += "- Support Phone: 1-800-TECH-HELP\n\n";

    // Account & Login Issues
    if (text.includes('login') || text.includes('account') || text.includes('access') || text.includes('password')) {
      knowledgeBase += "ACCOUNT & LOGIN SUPPORT:\n";
      knowledgeBase += "- Password Reset: Use the 'Forgot Password' link or contact support\n";
      knowledgeBase += "- Account Locked: Contact support with your account email for unlock\n";
      knowledgeBase += "- Two-Factor Authentication: Available in Security Settings\n";
      knowledgeBase += "- Account Recovery: Requires email verification and identity proof\n\n";
    }

    // Billing Issues
    if (text.includes('billing') || text.includes('payment') || text.includes('charge') || text.includes('refund')) {
      knowledgeBase += "BILLING & PAYMENTS:\n";
      knowledgeBase += "- Billing Cycle: Monthly on the date of initial subscription\n";
      knowledgeBase += "- Refund Policy: 30-day money-back guarantee for new customers\n";
      knowledgeBase += "- Payment Methods: Credit card, PayPal, bank transfer\n";
      knowledgeBase += "- Double Charges: Usually processing delays, refunded within 3-5 business days\n";
      knowledgeBase += "- Billing Support: billing@techsolutions.com or call during business hours\n\n";
    }

    // Technical Issues
    if (text.includes('technical') || text.includes('error') || text.includes('bug') || text.includes('not working')) {
      knowledgeBase += "TECHNICAL SUPPORT:\n";
      knowledgeBase += "- System Requirements: Chrome/Firefox/Safari latest versions\n";
      knowledgeBase += "- Clear Browser Cache: Often resolves display issues\n";
      knowledgeBase += "- Server Status: Check status.techsolutions.com for outages\n";
      knowledgeBase += "- Bug Reports: Include browser, OS, and steps to reproduce\n";
      knowledgeBase += "- Technical Escalation: Priority support for critical issues\n\n";
    }

    // Integration & API
    if (text.includes('integration') || text.includes('api') || text.includes('connect')) {
      knowledgeBase += "INTEGRATIONS & API:\n";
      knowledgeBase += "- API Documentation: Available at docs.techsolutions.com\n";
      knowledgeBase += "- Supported Integrations: Slack, Microsoft Teams, Salesforce, HubSpot\n";
      knowledgeBase += "- API Rate Limits: 1000 requests/hour for standard, 10000 for premium\n";
      knowledgeBase += "- Integration Support: Custom integrations available for Enterprise plans\n";
      knowledgeBase += "- Webhook Setup: Real-time notifications for events\n\n";
    }

    // Pricing & Plans
    if (text.includes('pricing') || text.includes('plan') || text.includes('subscription') || text.includes('upgrade')) {
      knowledgeBase += "PRICING & PLANS:\n";
      knowledgeBase += "- Starter Plan: $29/month - Up to 5 users, basic features\n";
      knowledgeBase += "- Professional: $79/month - Up to 25 users, advanced features\n";
      knowledgeBase += "- Enterprise: Custom pricing - Unlimited users, custom integrations\n";
      knowledgeBase += "- Annual Discount: 20% off when paying annually\n";
      knowledgeBase += "- Plan Changes: Immediate upgrades, downgrades at next billing cycle\n\n";
    }

    // Server/Infrastructure Issues
    if (text.includes('down') || text.includes('server') || text.includes('outage') || text.includes('slow')) {
      knowledgeBase += "INFRASTRUCTURE & PERFORMANCE:\n";
      knowledgeBase += "- Server Locations: US East, US West, EU, Asia Pacific\n";
      knowledgeBase += "- Uptime SLA: 99.9% guaranteed uptime\n";
      knowledgeBase += "- Status Page: Real-time system status at status.techsolutions.com\n";
      knowledgeBase += "- Performance Issues: Often resolved by switching data centers\n";
      knowledgeBase += "- Maintenance Windows: Saturdays 2-4 AM EST with 48h notice\n\n";
    }

    knowledgeBase += "ESCALATION PROCEDURES:\n";
    knowledgeBase += "- Critical Issues: Immediate escalation to senior support\n";
    knowledgeBase += "- Response Times: 1 hour for urgent, 24 hours for normal\n";
    knowledgeBase += "- Follow-up: Automated follow-up until resolution confirmed\n";
    
    return knowledgeBase;
  }
}

export const geminiService = new GeminiService();
