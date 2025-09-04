import { Loader2 } from "lucide-react";

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
}

export function LoadingOverlay({ isVisible, message = "Processing emails with AI..." }: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" data-testid="loading-overlay">
      <div className="bg-card p-6 rounded-lg shadow-xl">
        <div className="flex items-center space-x-3">
          <Loader2 className="animate-spin w-5 h-5 text-primary" data-testid="loading-spinner" />
          <span className="font-medium" data-testid="loading-message">{message}</span>
        </div>
      </div>
    </div>
  );
}
