"use client";

import { useEffect } from "react";
import { getIOSTouchClasses } from "@/lib/utils/iosDetection";

/**
 * Client component that applies iOS-specific CSS classes to the document body
 * This ensures iOS touch optimizations are applied globally
 */
export function IOSClassProvider() {
  useEffect(() => {
    const iosClasses = getIOSTouchClasses();
    
    if (iosClasses.length > 0) {
      // Add iOS classes to document body
      document.body.classList.add(...iosClasses);
      
      // Also add to document element for broader CSS selector support
      document.documentElement.classList.add(...iosClasses);
    }
    
    // Cleanup function to remove classes if component unmounts
    return () => {
      if (iosClasses.length > 0) {
        document.body.classList.remove(...iosClasses);
        document.documentElement.classList.remove(...iosClasses);
      }
    };
  }, []);

  // This component doesn't render anything visible
  return null;
}