'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, RefreshCw, Download, AlertCircle, Check } from '@/lib/icons';
import { cn } from '@/lib/utils';

interface UpdateInfo {
  available: boolean;
  currentVersion: string;
  newVersion: string;
  releaseNotes?: string[];
  isRequired?: boolean;
  timestamp: number;
}

interface UpdateNotificationProps {
  onDismiss?: () => void;
  onUpdate?: () => void;
  className?: string;
}

export function UpdateNotification({ onDismiss, onUpdate, className }: UpdateNotificationProps) {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<'checking' | 'available' | 'downloading' | 'ready' | 'error' | null>(null);

  // Check for updates using service worker
  const checkForUpdates = useCallback(async () => {
    setUpdateStatus('checking');
    
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        
        // Simulate version check - in production this would check against actual version
        const currentVersion = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';
        
        // Check if there's a newer service worker
        if (registration.waiting || registration.installing) {
          setUpdateInfo({
            available: true,
            currentVersion,
            newVersion: currentVersion, // In real app, this would be fetched from server
            releaseNotes: [
              'Improved iOS Safari compatibility',
              'Enhanced drag-and-drop performance',
              'Fixed board reordering on touch devices',
              'Better cache management'
            ],
            isRequired: false,
            timestamp: Date.now(),
          });
          setUpdateStatus('available');
        } else {
          setUpdateStatus(null);
        }
      } catch (error) {
        console.error('Failed to check for updates:', error);
        setUpdateStatus('error');
      }
    }
  }, []);

  // Handle update installation
  const handleUpdate = useCallback(async () => {
    if (!updateInfo || isUpdating) return;
    
    setIsUpdating(true);
    setUpdateStatus('downloading');
    
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        
        if (registration.waiting) {
          // Tell the waiting service worker to skip waiting
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          
          // Listen for the controlling service worker change
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            setUpdateStatus('ready');
            
            // Slight delay for user feedback, then reload
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          });
        }
      }
      
      onUpdate?.();
    } catch (error) {
      console.error('Failed to apply update:', error);
      setUpdateStatus('error');
      setIsUpdating(false);
    }
  }, [updateInfo, isUpdating, onUpdate]);

  // Handle dismissal
  const handleDismiss = useCallback(() => {
    setIsDismissed(true);
    onDismiss?.();
  }, [onDismiss]);

  // Check for updates on mount and periodically
  useEffect(() => {
    // Defer initial check to avoid synchronous state update in effect body
    const timeoutId = setTimeout(checkForUpdates, 0);

    // Check for updates every 5 minutes
    const interval = setInterval(checkForUpdates, 5 * 60 * 1000);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(interval);
    };
  }, [checkForUpdates]);

  // Listen for service worker updates
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleUpdateFound = () => {
        checkForUpdates();
      };

      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'UPDATE_AVAILABLE') {
          checkForUpdates();
        }
      });

      navigator.serviceWorker.addEventListener('controllerchange', handleUpdateFound);
      
      return () => {
        navigator.serviceWorker.removeEventListener('controllerchange', handleUpdateFound);
      };
    }
  }, [checkForUpdates]);

  // Don't show if dismissed or no update available
  if (isDismissed || !updateInfo?.available || updateStatus === 'ready') {
    return null;
  }

  // Loading state for update check
  if (updateStatus === 'checking') {
    return (
      <Card className={cn('border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20', className)}>
        <CardContent className="flex items-center gap-3 p-4">
          <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
          <span className="text-sm text-blue-800 dark:text-blue-200">
            Checking for updates...
          </span>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (updateStatus === 'error') {
    return (
      <Card className={cn('border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20', className)}>
        <CardContent className="flex items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-800 dark:text-red-200">
              Failed to check for updates
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20',
      updateStatus === 'downloading' && 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20',
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {updateStatus === 'downloading' ? (
              <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
            ) : (
              <Download className="h-5 w-5 text-green-600" />
            )}
            <CardTitle className="text-lg">
              {updateStatus === 'downloading' ? 'Installing Update' : 'Update Available'}
            </CardTitle>
            {updateInfo.isRequired && (
              <Badge variant="destructive" className="text-xs">
                Required
              </Badge>
            )}
          </div>
          {!updateInfo.isRequired && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              disabled={isUpdating}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <CardDescription>
          {updateStatus === 'downloading' 
            ? 'Please wait while the update is being installed...'
            : `Version ${updateInfo.newVersion} is now available. Your current version is ${updateInfo.currentVersion}.`
          }
        </CardDescription>
      </CardHeader>

      {updateInfo.releaseNotes && updateInfo.releaseNotes.length > 0 && updateStatus !== 'downloading' && (
        <CardContent className="pt-0">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-green-800 dark:text-green-200">
              What&apos;s New:
            </h4>
            <ul className="space-y-1">
              {updateInfo.releaseNotes.slice(0, 4).map((note, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                  <Check className="h-3 w-3 text-green-600" />
                  {note}
                </li>
              ))}
            </ul>
            {updateInfo.releaseNotes.length > 4 && (
              <p className="text-xs text-muted-foreground">
                And {updateInfo.releaseNotes.length - 4} more improvements...
              </p>
            )}
          </div>
        </CardContent>
      )}

      <CardFooter className="flex gap-2 pt-3">
        {updateStatus === 'downloading' ? (
          <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Updating... This will take just a moment.
          </div>
        ) : (
          <>
            <Button 
              onClick={handleUpdate} 
              disabled={isUpdating}
              className="bg-green-600 hover:bg-green-700"
            >
              <RefreshCw className={cn('mr-2 h-4 w-4', isUpdating && 'animate-spin')} />
              {isUpdating ? 'Updating...' : 'Update Now'}
            </Button>
            {!updateInfo.isRequired && (
              <Button variant="outline" onClick={handleDismiss} disabled={isUpdating}>
                Later
              </Button>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  );
}