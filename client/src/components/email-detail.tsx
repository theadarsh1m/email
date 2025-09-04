import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Tag, 
  Archive, 
  RefreshCw, 
  Send, 
  Bot, 
  Clock, 
  Brain, 
  Shield, 
  ThumbsUp, 
  CheckCircle,
  Smile,
  Frown,
  Meh,
  Mail
} from "lucide-react";
import { useEmailResponses, useGenerateResponse, useSendResponse, useResolveEmail } from "@/hooks/use-emails";
import { useToast } from "@/hooks/use-toast";
import type { Email } from "@/types/email";
import { formatDistanceToNow } from "date-fns";

interface EmailDetailProps {
  email: Email | null;
  isLoading?: boolean;
}

export function EmailDetail({ email, isLoading }: EmailDetailProps) {
  const [responseContent, setResponseContent] = useState("");
  const { toast } = useToast();
  
  const { data: responses, isLoading: responsesLoading } = useEmailResponses(email?.id || "");
  const generateResponse = useGenerateResponse();
  const sendResponse = useSendResponse();
  const resolveEmail = useResolveEmail();

  const latestResponse = responses?.[0];

  // Set response content when latest response is loaded
  if (latestResponse && !responseContent) {
    setResponseContent(latestResponse.content);
  }

  const handleGenerateResponse = async () => {
    if (!email) return;
    
    try {
      const result = await generateResponse.mutateAsync(email.id);
      setResponseContent(result.content);
      toast({
        title: "Response Generated",
        description: "AI has generated a new response for this email.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate response. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSendResponse = async () => {
    if (!latestResponse) return;
    
    try {
      await sendResponse.mutateAsync(latestResponse.id);
      toast({
        title: "Response Sent",
        description: "The email response has been sent successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send response. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleResolveEmail = async () => {
    if (!email) return;
    
    try {
      await resolveEmail.mutateAsync(email.id);
      toast({
        title: "Email Resolved",
        description: "The email has been marked as resolved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resolve email. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "positive": return <Smile className="h-4 w-4" />;
      case "negative": return <Frown className="h-4 w-4" />;
      default: return <Meh className="h-4 w-4" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive": return "text-chart-2 bg-chart-2/10";
      case "negative": return "text-chart-4 bg-chart-4/10";
      default: return "text-chart-3 bg-chart-3/10";
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="p-6 border-b border-border">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-4 w-48 mb-2" />
          <Skeleton className="h-16 w-full" />
        </div>
        <div className="flex-1 p-6">
          <Skeleton className="h-32 w-full mb-6" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p data-testid="no-email-selected">Select an email to view details</p>
        </div>
      </div>
    );
  }

  const extractedInfo = email.extractedInfo || {};

  return (
    <div className="flex-1 flex flex-col">
      {/* Email Header */}
      <div className="p-6 border-b border-border bg-card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Badge
                variant={email.priority === "urgent" ? "destructive" : "secondary"}
                data-testid="email-priority-badge"
              >
                {email.priority.toUpperCase()}
              </Badge>
              <Badge
                variant="outline"
                className={getSentimentColor(email.sentiment)}
                data-testid="email-sentiment-badge"
              >
                {getSentimentIcon(email.sentiment)}
                <span className="ml-1 capitalize">{email.sentiment}</span>
              </Badge>
            </div>
            <h3 className="font-semibold text-lg mb-1" data-testid="email-detail-subject">
              {email.subject}
            </h3>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span data-testid="email-detail-sender">{email.sender}</span>
              <span data-testid="email-detail-time">
                {formatDistanceToNow(new Date(email.receivedAt), { addSuffix: true })}
              </span>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" data-testid="button-tag">
              <Tag className="h-4 w-4 mr-1" />
              Tag
            </Button>
            <Button variant="outline" size="sm" data-testid="button-archive">
              <Archive className="h-4 w-4 mr-1" />
              Archive
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleResolveEmail}
              disabled={email.isResolved}
              data-testid="button-resolve"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              {email.isResolved ? "Resolved" : "Resolve"}
            </Button>
          </div>
        </div>

        {/* Extracted Information */}
        <Card className="bg-muted">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Extracted Information</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-4 text-sm">
              {extractedInfo.phone && (
                <div>
                  <span className="text-muted-foreground">Contact:</span>
                  <span className="ml-2" data-testid="extracted-phone">{extractedInfo.phone}</span>
                </div>
              )}
              {extractedInfo.customerId && (
                <div>
                  <span className="text-muted-foreground">Customer ID:</span>
                  <span className="ml-2" data-testid="extracted-customer-id">{extractedInfo.customerId}</span>
                </div>
              )}
              {extractedInfo.issueType && (
                <div>
                  <span className="text-muted-foreground">Issue Type:</span>
                  <span className="ml-2" data-testid="extracted-issue-type">{extractedInfo.issueType}</span>
                </div>
              )}
              {extractedInfo.product && (
                <div>
                  <span className="text-muted-foreground">Product:</span>
                  <span className="ml-2" data-testid="extracted-product">{extractedInfo.product}</span>
                </div>
              )}
              {extractedInfo.company && (
                <div>
                  <span className="text-muted-foreground">Company:</span>
                  <span className="ml-2" data-testid="extracted-company">{extractedInfo.company}</span>
                </div>
              )}
              {extractedInfo.customerName && (
                <div>
                  <span className="text-muted-foreground">Customer:</span>
                  <span className="ml-2" data-testid="extracted-customer-name">{extractedInfo.customerName}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Email Body */}
      <div className="flex-1 overflow-y-auto p-6">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Original Message</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none whitespace-pre-wrap" data-testid="email-body">
              {email.body}
            </div>
          </CardContent>
        </Card>

        {/* AI Generated Response */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center">
                <Bot className="h-4 w-4 mr-2 text-primary" />
                AI Generated Response
              </CardTitle>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateResponse}
                  disabled={generateResponse.isPending}
                  data-testid="button-regenerate"
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${generateResponse.isPending ? 'animate-spin' : ''}`} />
                  {generateResponse.isPending ? "Generating..." : "Regenerate"}
                </Button>
                <Button
                  size="sm"
                  onClick={handleSendResponse}
                  disabled={sendResponse.isPending || !latestResponse}
                  data-testid="button-send-reply"
                >
                  <Send className="h-4 w-4 mr-1" />
                  {sendResponse.isPending ? "Sending..." : "Send Reply"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {responsesLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <>
                <Textarea
                  className="min-h-64 resize-none"
                  value={responseContent}
                  onChange={(e) => setResponseContent(e.target.value)}
                  placeholder="AI response will appear here..."
                  data-testid="response-content"
                />
                
                {latestResponse && (
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Generated {formatDistanceToNow(new Date(latestResponse.generatedAt), { addSuffix: true })}
                      </span>
                      <span className="flex items-center">
                        <Brain className="h-3 w-3 mr-1" />
                        {latestResponse.model} Model
                      </span>
                      <span className="flex items-center">
                        <Shield className="h-3 w-3 mr-1" />
                        Professional Tone
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-chart-2 flex items-center">
                        <ThumbsUp className="h-3 w-3 mr-1" />
                        Empathetic
                      </span>
                      <span className="text-primary flex items-center">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Action-oriented
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
