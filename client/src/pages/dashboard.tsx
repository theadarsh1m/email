import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Bell } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { AnalyticsSection } from "@/components/analytics-section";
import { EmailList } from "@/components/email-list";
import { EmailDetail } from "@/components/email-detail";
import { LoadingOverlay } from "@/components/loading-overlay";
import { useSyncEmails, useEmail } from "@/hooks/use-emails";
import { useToast } from "@/hooks/use-toast";
import type { Email } from "@/types/email";

export default function Dashboard() {
  const [selectedEmailId, setSelectedEmailId] = useState<string>();
  const { toast } = useToast();
  
  const syncEmails = useSyncEmails();
  const { data: selectedEmail, isLoading: emailLoading } = useEmail(selectedEmailId || "");

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
                onClick={handleSyncEmails}
                disabled={syncEmails.isPending}
                data-testid="button-sync-emails"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${syncEmails.isPending ? 'animate-spin' : ''}`} />
                {syncEmails.isPending ? "Syncing..." : "Sync Emails"}
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
