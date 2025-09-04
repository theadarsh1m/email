export interface Email {
  id: string;
  messageId: string;
  subject: string;
  sender: string;
  body: string;
  receivedAt: string;
  priority: "urgent" | "normal";
  sentiment: "positive" | "negative" | "neutral";
  isProcessed: boolean;
  isResolved: boolean;
  extractedInfo: ExtractedInfo;
  tags: string[];
  createdAt: string;
  updatedAt: string;
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

export interface Response {
  id: string;
  emailId: string;
  content: string;
  isSent: boolean;
  sentAt: string | null;
  generatedAt: string;
  model: string;
  confidence: number;
}

export interface Analytics {
  id: string;
  date: string;
  totalEmails: number;
  resolvedEmails: number;
  pendingEmails: number;
  urgentEmails: number;
  avgResponseTime: number;
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
}
