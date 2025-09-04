import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Mail, CheckCircle, Clock, Timer, TrendingUp, TrendingDown } from "lucide-react";
import { useTodayAnalytics } from "@/hooks/use-emails";
import { Skeleton } from "@/components/ui/skeleton";

export function AnalyticsSection() {
  const { data: analytics, isLoading } = useTodayAnalytics();

  if (isLoading) {
    return (
      <section className="p-6 border-b border-border bg-muted/30">
        <h3 className="text-lg font-semibold mb-4">Analytics & Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  const stats = analytics || {
    totalEmails: 0,
    resolvedEmails: 0,
    pendingEmails: 0,
    urgentEmails: 0,
    avgResponseTime: 0,
    sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 }
  };

  const resolutionRate = stats.totalEmails > 0 
    ? Math.round((stats.resolvedEmails / stats.totalEmails) * 100) 
    : 0;

  const avgResponseHours = Math.round(stats.avgResponseTime / 60 * 10) / 10;

  return (
    <section className="p-6 border-b border-border bg-muted/30">
      <h3 className="text-lg font-semibold mb-4" data-testid="analytics-title">Analytics & Overview</h3>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card className="stats-card bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Emails (24h)</p>
                <p className="text-2xl font-bold" data-testid="stat-total-emails">{stats.totalEmails}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Mail className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm">
              <span className="text-chart-2 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                12%
              </span>
              <span className="text-muted-foreground ml-1">from yesterday</span>
            </div>
          </CardContent>
        </Card>

        <Card className="stats-card bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Resolved</p>
                <p className="text-2xl font-bold text-chart-2" data-testid="stat-resolved">{stats.resolvedEmails}</p>
              </div>
              <div className="w-12 h-12 bg-chart-2/10 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-chart-2" />
              </div>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              {resolutionRate}% resolution rate
            </div>
          </CardContent>
        </Card>

        <Card className="stats-card bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Pending</p>
                <p className="text-2xl font-bold text-chart-3" data-testid="stat-pending">{stats.pendingEmails}</p>
              </div>
              <div className="w-12 h-12 bg-chart-3/10 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-chart-3" />
              </div>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              {stats.urgentEmails} urgent, {stats.pendingEmails - stats.urgentEmails} normal
            </div>
          </CardContent>
        </Card>

        <Card className="stats-card bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Avg Response Time</p>
                <p className="text-2xl font-bold" data-testid="stat-response-time">{avgResponseHours}h</p>
              </div>
              <div className="w-12 h-12 bg-chart-4/10 rounded-lg flex items-center justify-center">
                <Timer className="h-6 w-6 text-chart-4" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm">
              <span className="text-chart-2 flex items-center">
                <TrendingDown className="h-3 w-3 mr-1" />
                18%
              </span>
              <span className="text-muted-foreground ml-1">improvement</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Email Volume Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="chart-container bg-muted/30 rounded-md flex items-center justify-center h-[300px]">
              <p className="text-muted-foreground" data-testid="chart-placeholder">📊 Interactive Chart - Email Volume (7 days)</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sentiment Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-chart-2 rounded-full"></div>
                    <span className="text-sm">Positive</span>
                  </div>
                  <span className="text-sm font-medium" data-testid="sentiment-positive">{stats.sentimentBreakdown.positive}%</span>
                </div>
                <Progress value={stats.sentimentBreakdown.positive} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-chart-3 rounded-full"></div>
                    <span className="text-sm">Neutral</span>
                  </div>
                  <span className="text-sm font-medium" data-testid="sentiment-neutral">{stats.sentimentBreakdown.neutral}%</span>
                </div>
                <Progress value={stats.sentimentBreakdown.neutral} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-chart-4 rounded-full"></div>
                    <span className="text-sm">Negative</span>
                  </div>
                  <span className="text-sm font-medium" data-testid="sentiment-negative">{stats.sentimentBreakdown.negative}%</span>
                </div>
                <Progress value={stats.sentimentBreakdown.negative} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
