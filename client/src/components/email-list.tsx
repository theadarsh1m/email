import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, AlertTriangle, Smile, Frown, Meh } from "lucide-react";
import { useEmails } from "@/hooks/use-emails";
import { Skeleton } from "@/components/ui/skeleton";
import type { Email } from "@/types/email";
import { formatDistanceToNow } from "date-fns";

interface EmailListProps {
  selectedEmailId?: string;
  onEmailSelect: (email: Email) => void;
}

export function EmailList({ selectedEmailId, onEmailSelect }: EmailListProps) {
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [sentimentFilter, setSentimentFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: emails, isLoading } = useEmails(
    priorityFilter === "all" ? undefined : priorityFilter || undefined,
    sentimentFilter === "all" ? undefined : sentimentFilter || undefined
  );

  const filteredEmails = emails?.filter(email => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      email.subject.toLowerCase().includes(query) ||
      email.sender.toLowerCase().includes(query) ||
      email.body.toLowerCase().includes(query)
    );
  }) || [];

  // Sort emails: urgent first, then by received date
  const sortedEmails = [...filteredEmails].sort((a, b) => {
    if (a.priority === "urgent" && b.priority !== "urgent") return -1;
    if (b.priority === "urgent" && a.priority !== "urgent") return 1;
    return new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime();
  });

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "positive": return <Smile className="h-3 w-3" />;
      case "negative": return <Frown className="h-3 w-3" />;
      default: return <Meh className="h-3 w-3" />;
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
      <div className="w-1/2 border-r border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="flex-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 border-b border-border">
              <Skeleton className="h-16 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-1/2 border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold" data-testid="email-list-title">Support Emails</h3>
          <div className="flex items-center space-x-2">
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-32" data-testid="filter-priority">
                <SelectValue placeholder="All Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent Only</SelectItem>
                <SelectItem value="normal">Normal Only</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
              <SelectTrigger className="w-32" data-testid="filter-sentiment">
                <SelectValue placeholder="All Sentiment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sentiment</SelectItem>
                <SelectItem value="positive">Positive</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="negative">Negative</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Search emails..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="search-emails"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {sortedEmails.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p data-testid="no-emails">No emails found</p>
          </div>
        ) : (
          sortedEmails.map((email) => (
            <div
              key={email.id}
              className={`email-item p-4 border-b border-border bg-card hover:bg-accent cursor-pointer transition-all ${
                email.priority === "urgent" ? "priority-urgent" : "priority-normal"
              } ${
                selectedEmailId === email.id ? "ring-2 ring-ring bg-accent" : ""
              }`}
              onClick={() => onEmailSelect(email)}
              data-testid={`email-item-${email.id}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <Badge
                      variant={email.priority === "urgent" ? "destructive" : "secondary"}
                      className="text-xs"
                      data-testid={`badge-priority-${email.priority}`}
                    >
                      {email.priority === "urgent" && <AlertTriangle className="h-3 w-3 mr-1" />}
                      {email.priority.toUpperCase()}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-xs ${getSentimentColor(email.sentiment)}`}
                      data-testid={`badge-sentiment-${email.sentiment}`}
                    >
                      {getSentimentIcon(email.sentiment)}
                      <span className="ml-1 capitalize">{email.sentiment}</span>
                    </Badge>
                  </div>
                  <h4 className="font-medium text-sm truncate" data-testid={`email-subject-${email.id}`}>
                    {email.subject}
                  </h4>
                  <p className="text-muted-foreground text-xs" data-testid={`email-sender-${email.id}`}>
                    {email.sender}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground" data-testid={`email-time-${email.id}`}>
                  {formatDistanceToNow(new Date(email.receivedAt), { addSuffix: true })}
                </span>
              </div>
              
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2" data-testid={`email-preview-${email.id}`}>
                {email.body.substring(0, 150)}...
              </p>
              
              {email.tags.length > 0 && (
                <div className="flex items-center space-x-1 flex-wrap">
                  {email.tags.slice(0, 3).map((tag, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="text-xs"
                      data-testid={`email-tag-${tag}`}
                    >
                      {tag.replace(/-/g, " ")}
                    </Badge>
                  ))}
                  {email.tags.length > 3 && (
                    <span className="text-xs text-muted-foreground">
                      +{email.tags.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
