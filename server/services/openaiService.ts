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
      
      const response = await genai.models.generateContent({
        model: "gemini-2.5-flash",
        config: {
          systemInstruction: `You are a professional customer support specialist. Generate empathetic, helpful, and professional email responses.

            Guidelines:
            - Always maintain a professional and friendly tone
            - Be empathetic, especially for frustrated customers
            - Provide actionable solutions when possible
            - Include specific details from the customer's message
            - Use appropriate greeting and closing
            - Keep responses concise but comprehensive
            - Include next steps and contact information
            
            ${contextPrompt}
            
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
}

export const geminiService = new GeminiService();
