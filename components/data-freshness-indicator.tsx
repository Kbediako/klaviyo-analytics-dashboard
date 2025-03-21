import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DataFreshnessIndicatorProps {
  lastUpdated: Date | null;
  isLoading?: boolean;
  isError?: boolean;
  onRefresh?: () => void;
  className?: string;
  staleDurationMs?: number; // Duration in ms after which data is considered stale
}

export function DataFreshnessIndicator({
  lastUpdated,
  isLoading = false,
  isError = false,
  onRefresh,
  className,
  staleDurationMs = 5 * 60 * 1000, // Default 5 minutes
}: DataFreshnessIndicatorProps) {
  const [isStale, setIsStale] = useState(false);
  const [timeAgo, setTimeAgo] = useState<string>('');

  useEffect(() => {
    function updateTimeAgo() {
      if (!lastUpdated) return;

      const now = new Date();
      const diff = now.getTime() - lastUpdated.getTime();
      setIsStale(diff >= staleDurationMs);

      // Format time ago string
      if (diff < 60000) {
        setTimeAgo('just now');
      } else if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        setTimeAgo(`${minutes}m ago`);
      } else if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        setTimeAgo(`${hours}h ago`);
      } else {
        const days = Math.floor(diff / 86400000);
        setTimeAgo(`${days}d ago`);
      }
    }

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [lastUpdated, staleDurationMs]);

  return (
    <div
      className={cn(
        'flex items-center gap-2 text-sm',
        isError ? 'text-destructive' : isStale ? 'text-yellow-600' : 'text-muted-foreground',
        className
      )}
    >
      {isLoading ? (
        <>
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Updating...</span>
        </>
      ) : isError ? (
        <>
          <AlertCircle className="h-4 w-4" />
          <span>Error updating</span>
        </>
      ) : (
        <>
          <CheckCircle2 className="h-4 w-4" />
          <span>
            Updated {timeAgo}
            {isStale && ' (stale)'}
          </span>
          {isStale && onRefresh && (
            <button
              onClick={onRefresh}
              className="ml-2 rounded-md p-1 hover:bg-accent hover:text-accent-foreground"
              aria-label="Refresh data"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          )}
        </>
      )}
    </div>
  );
}
