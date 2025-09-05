import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Bell, Database } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { AnalyticsSection } from "@/components/analytics-section";
import { EmailList } from "@/components/email-list";
import { EmailDetail } from "@/components/email-detail";
import { LoadingOverlay } from "@/components/loading-overlay";
import { useSyncEmails, useEmail } from "@/hooks/use-emails";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Email } from "@/types/email";

export default function Dashboard() {
  const [selectedEmailId, setSelectedEmailId] = useState<string>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const syncEmails = useSyncEmails();
  const { data: selectedEmail, isLoading: emailLoading } = useEmail(selectedEmailId || "");
  
  const processUrgent = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/process-urgent");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      toast({
        title: "Urgent Emails Processed",
        description: `Generated AI responses for ${data.processedCount} urgent emails.`,
      });
    }
  });

  const seedData = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/seed");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      toast({
        title: "Sample Data Loaded",
        description: data.message || "Sample email data loaded and processed with AI analysis.",
      });
    },
    onError: (error) => {
      toast({
        title: "Seeding Failed",
        description: "Failed to load sample data. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleEmailSelect = (email: Email) => {
    setSelectedEmailId(email.id);
  };

  const handleSyncEmails = async () => {
    try {
      await syncEmails.mutateAsync();
      toast({
        title: "Sync Complete",
        description: "Successfully synced emails from your mailbox.",
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to sync emails. Please check your email configuration.",
        variant: "destructive",
      });
    }
  };

  const handleProcessUrgent = async () => {
    try {
      await processUrgent.mutateAsync();
    } catch (error) {
      toast({
        title: "Processing Failed",
        description: "Failed to process urgent emails. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold" data-testid="dashboard-title">Communication Dashboard</h2>
              <p className="text-muted-foreground text-sm" data-testid="dashboard-subtitle">
                AI-powered email management and response system
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline"
                onClick={() => seedData.mutate()}
                disabled={seedData.isPending}
                data-testid="button-seed-data"
              >
                <Database className={`h-4 w-4 mr-2 ${seedData.isPending ? 'animate-spin' : ''}`} />
                {seedData.isPending ? "Loading..." : "Load Sample Data"}
              </Button>
              <Button 
                onClick={handleSyncEmails}
                disabled={syncEmails.isPending}
                data-testid="button-sync-emails"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${syncEmails.isPending ? 'animate-spin' : ''}`} />
                {syncEmails.isPending ? "Syncing..." : "Sync Emails"}
              </Button>
              <Button 
                variant="destructive"
                onClick={handleProcessUrgent}
                disabled={processUrgent.isPending}
                data-testid="button-process-urgent"
              >
                🚨 {processUrgent.isPending ? "Processing..." : "Process Urgent"}
              </Button>
              <Button variant="ghost" size="icon" data-testid="button-notifications">
                <Bell className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-auto">
          <AnalyticsSection />
          
          {/* Email Management Section */}
          <section className="flex-1 flex">
            <EmailList 
              selectedEmailId={selectedEmailId}
              onEmailSelect={handleEmailSelect}
            />
            <EmailDetail 
              email={selectedEmail || null}
              isLoading={emailLoading}
            />
          </section>
        </main>
      </div>

      <LoadingOverlay 
        isVisible={syncEmails.isPending}
        message="Syncing and processing emails with AI..."
      />
    </div>
  );
}
