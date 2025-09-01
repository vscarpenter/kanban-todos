'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Info, ExternalLink } from '@/lib/icons';

interface VersionInfo {
  version: string;
  buildTime: string;
  buildHash: string;
}

export function VersionIndicator() {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Get version info from build-time environment variables or package.json
    const getVersionInfo = (): VersionInfo => {
      // Try to get build-time environment variables first
      const version = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';
      const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString();
      const buildHash = process.env.NEXT_PUBLIC_BUILD_HASH || 'dev';

      return {
        version,
        buildTime,
        buildHash: buildHash.slice(0, 7), // Short hash
      };
    };

    setVersionInfo(getVersionInfo());
  }, []);

  if (!versionInfo) {
    return null;
  }

  const buildDate = new Date(versionInfo.buildTime).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      {/* Compact version display */}
      <Button
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-xs hover:bg-muted/50"
        onClick={() => setIsExpanded(!isExpanded)}
        title={`Version ${versionInfo.version} • Built: ${buildDate} • Hash: ${versionInfo.buildHash}`}
      >
        <Badge variant="outline" className="text-xs">
          v{versionInfo.version}
        </Badge>
        <Info className="ml-1 h-3 w-3" />
      </Button>

        {/* Expanded version details */}
        {isExpanded && (
          <div className="flex items-center gap-2 text-xs animate-in slide-in-from-left-2 duration-200">
            <span className="text-muted-foreground">•</span>
            <span>Built {buildDate}</span>
            <span className="text-muted-foreground">•</span>
            <code className="bg-muted px-1 py-0.5 rounded text-[10px] font-mono">
              {versionInfo.buildHash}
            </code>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 hover:bg-muted/50"
              onClick={() => setIsExpanded(false)}
              aria-label="Collapse version details"
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        )}
    </div>
  );
}

// Minimal footer version for space-constrained areas
export function VersionFooter() {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);

  useEffect(() => {
    const getVersionInfo = (): VersionInfo => {
      const version = process.env.NEXT_PUBLIC_APP_VERSION || '2.0.0';
      const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString();
      const buildHash = process.env.NEXT_PUBLIC_BUILD_HASH || 'dev';

      return {
        version,
        buildTime,
        buildHash: buildHash.slice(0, 7),
      };
    };

    setVersionInfo(getVersionInfo());
  }, []);

  if (!versionInfo) {
    return (
      <div className="text-center text-xs text-muted-foreground">
        Cascade v2.0.0 • {new Date().getFullYear()}
      </div>
    );
  }

  // Format build date for display
  const buildDate = new Date(versionInfo.buildTime);
  const formattedDate = buildDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: buildDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
  
  const formattedTime = buildDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <div className="text-center text-xs text-muted-foreground">
      <div>Cascade v{versionInfo.version}</div>
      <div className="mt-0.5 text-[10px] opacity-75">
        Built {formattedDate} {formattedTime} • {versionInfo.buildHash}
      </div>
    </div>
  );
}