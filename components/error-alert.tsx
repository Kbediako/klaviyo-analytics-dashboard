import React from 'react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertCircleIcon, RefreshCwIcon } from 'lucide-react';
import { Button } from './ui/button';

/**
 * Interface for error alert props
 */
interface ErrorAlertProps {
  /**
   * Error message to display
   */
  message: string;
  
  /**
   * Optional title for the alert
   */
  title?: string;
  
  /**
   * Optional retry function
   */
  onRetry?: () => void;
}

/**
 * Error alert component
 * 
 * @param props Component props
 * @returns React component
 */
export function ErrorAlert({
  message,
  title = 'Error',
  onRetry,
}: ErrorAlertProps) {
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircleIcon className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>{message}</span>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            className="ml-2"
            onClick={onRetry}
          >
            <RefreshCwIcon className="mr-2 h-4 w-4" />
            Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
