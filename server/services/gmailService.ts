import { google } from 'googleapis';

export interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
    body: {
      data?: string;
    };
    parts?: Array<{
      mimeType: string;
      body: {
        data?: string;
      };
    }>;
  };
  internalDate: string;
}

export class GmailService {
  private gmail: any;
  private auth: any;

  constructor() {
    // Initialize OAuth2 client with credentials
    this.auth = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI
    );

    // Set refresh token if available
    if (process.env.GMAIL_REFRESH_TOKEN) {
      this.auth.setCredentials({
        refresh_token: process.env.GMAIL_REFRESH_TOKEN
      });
    }

    this.gmail = google.gmail({ version: 'v1', auth: this.auth });
  }

  async getAuthUrl(): Promise<string> {
    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send'
    ];

    return this.auth.generateAuthUrl({
      access_type: 'offline',
      scope: scopes
    });
  }

  async exchangeCodeForTokens(code: string): Promise<any> {
    const { tokens } = await this.auth.getToken(code);
    this.auth.setCredentials(tokens);
    return tokens;
  }

  async getSupportEmails(maxResults = 50): Promise<GmailMessage[]> {
    try {
      // Build query to filter support-related emails
      const query = 'subject:(support OR query OR request OR help) is:unread';
      
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults
      });

      if (!response.data.messages) {
        return [];
      }

      // Fetch detailed message data
      const messages = await Promise.all(
        response.data.messages.map(async (message: any) => {
          const detail = await this.gmail.users.messages.get({
            userId: 'me',
            id: message.id,
            format: 'full'
          });
          return detail.data;
        })
      );

      return messages;
    } catch (error) {
      console.error('Failed to fetch Gmail messages:', error);
      return [];
    }
  }

  extractEmailData(gmailMessage: GmailMessage) {
    const headers = gmailMessage.payload.headers;
    const subject = headers.find(h => h.name === 'Subject')?.value || '';
    const from = headers.find(h => h.name === 'From')?.value || '';
    const date = headers.find(h => h.name === 'Date')?.value || '';
    
    // Extract email body
    let body = '';
    if (gmailMessage.payload.body.data) {
      body = Buffer.from(gmailMessage.payload.body.data, 'base64').toString('utf-8');
    } else if (gmailMessage.payload.parts) {
      // Find text/plain part
      const textPart = gmailMessage.payload.parts.find(part => 
        part.mimeType === 'text/plain' && part.body.data
      );
      if (textPart?.body.data) {
        body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
      }
    }

    return {
      messageId: gmailMessage.id,
      subject,
      sender: from,
      body,
      receivedAt: new Date(parseInt(gmailMessage.internalDate))
    };
  }

  async sendReply(to: string, subject: string, body: string, threadId?: string): Promise<boolean> {
    try {
      const email = [
        `To: ${to}`,
        `Subject: Re: ${subject}`,
        threadId ? `In-Reply-To: ${threadId}` : '',
        '',
        body
      ].join('\n');

      const encodedEmail = Buffer.from(email).toString('base64url');

      await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedEmail,
          threadId
        }
      });

      return true;
    } catch (error) {
      console.error('Failed to send email reply:', error);
      return false;
    }
  }

  async markAsRead(messageId: string): Promise<boolean> {
    try {
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          removeLabelIds: ['UNREAD']
        }
      });
      return true;
    } catch (error) {
      console.error('Failed to mark email as read:', error);
      return false;
    }
  }
}

export const gmailService = new GmailService();
