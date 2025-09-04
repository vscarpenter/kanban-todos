'use client';

import { useEffect, useState } from 'react';
import { getDeviceInfo, getIOSDebugInfo } from '@/lib/utils/iosDetection';

export function TouchDebugInfo() {
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const info = {
      hasTouch: 'ontouchstart' in window,
      maxTouchPoints: navigator.maxTouchPoints,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      deviceInfo: getDeviceInfo(),
      iosDebugInfo: getIOSDebugInfo(),
    };
    setDebugInfo(info);
  }, []);

  if (!debugInfo) return null;

  return (
    <div className="fixed top-4 right-4 bg-black/80 text-white text-xs p-4 rounded-lg max-w-md z-50">
      <h3 className="font-bold mb-2">Touch Debug Info:</h3>
      <div className="space-y-1">
        <div>hasTouch: {String(debugInfo.hasTouch)}</div>
        <div>maxTouchPoints: {String(debugInfo.maxTouchPoints)}</div>
        <div>userAgent: {String(debugInfo.userAgent).substring(0, 50)}...</div>
        <pre className="text-xs overflow-auto max-h-32">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>
    </div>
  );
}