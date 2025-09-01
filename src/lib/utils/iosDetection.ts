/**
 * Enhanced iOS and Touch Device Detection Utility
 * Provides comprehensive detection of iOS devices, touch capabilities, and browser features
 */

export interface IOSDetectionResult {
  isIOS: boolean;
  isIPad: boolean;
  isIPhone: boolean;
  isIPod: boolean;
  isSafari: boolean;
  isIOSWebView: boolean;
  iosVersion: number | null;
  safariVersion: number | null;
  isIOSSupported: boolean; // iOS 18+ for this app
}

export interface TouchCapabilityResult {
  hasTouch: boolean;
  maxTouchPoints: number;
  isPrimaryTouch: boolean;
  isCoarsePointer: boolean;
  supportsHover: boolean;
  isLikelyMobile: boolean;
  isLikelyTablet: boolean;
}

/**
 * Detects iOS devices and Safari browser with version information
 * Targets iOS 18+ Safari for optimal touch support
 */
export function detectIOSDevice(): IOSDetectionResult {
  const userAgent = navigator.userAgent || '';
  const vendor = navigator.vendor || '';
  
  // Basic iOS detection
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPad Pro detection
  
  // Device-specific detection
  const isIPad = /iPad/.test(userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isIPhone = /iPhone/.test(userAgent);
  const isIPod = /iPod/.test(userAgent);
  
  // Safari detection with iOS WebView detection
  const isSafari = /Safari/.test(userAgent) && 
    /Apple Computer/.test(vendor) && 
    !/Chrome|CriOS|FxiOS|EdgiOS/.test(userAgent);
  
  // iOS WebView detection (apps using WKWebView)
  const isIOSWebView = isIOS && 
    (/Version\/[\d.]+.*Mobile.*Safari/.test(userAgent) || 
     !userAgent.includes('Safari'));
  
  // iOS version extraction
  let iosVersion: number | null = null;
  const iosMatch = userAgent.match(/OS (\d+)_(\d+)/);
  if (iosMatch) {
    iosVersion = parseInt(iosMatch[1], 10);
  }
  
  // Safari version extraction
  let safariVersion: number | null = null;
  const safariMatch = userAgent.match(/Version\/(\d+)\.(\d+)/);
  if (safariMatch) {
    safariVersion = parseInt(safariMatch[1], 10);
  }
  
  // Support check - iOS 18+ required
  const isIOSSupported = iosVersion !== null && iosVersion >= 18;
  
  return {
    isIOS,
    isIPad,
    isIPhone,
    isIPod,
    isSafari,
    isIOSWebView,
    iosVersion,
    safariVersion,
    isIOSSupported,
  };
}

/**
 * Quick check for iOS Safari 18+ support
 */
export function isIOSSafariSupported(): boolean {
  const detection = detectIOSDevice();
  return detection.isIOS && detection.isSafari && detection.isIOSSupported;
}

/**
 * Check if device needs iOS-optimized touch configuration
 */
export function needsIOSTouchOptimization(): boolean {
  const detection = detectIOSDevice();
  return detection.isIOS && detection.isSafari;
}

/**
 * Get optimal TouchSensor configuration for iOS devices
 */
export function getIOSTouchSensorConfig() {
  const detection = detectIOSDevice();
  
  if (!detection.isIOS) {
    // Return default configuration for non-iOS devices
    return {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    };
  }
  
  // iOS-optimized configuration
  return {
    activationConstraint: {
      delay: detection.isIPad ? 150 : 200, // Slightly faster on iPad Pro
      tolerance: detection.isIPad ? 12 : 8, // More tolerance on iPad Pro
    },
  };
}

/**
 * Get device-specific CSS classes for touch optimization
 */
export function getIOSTouchClasses(): string[] {
  const detection = detectIOSDevice();
  const classes: string[] = [];
  
  if (detection.isIOS) {
    classes.push('ios-device');
    
    if (detection.isIPad) {
      classes.push('ipad-device');
    }
    
    if (detection.isIPhone) {
      classes.push('iphone-device');
    }
    
    if (detection.isSafari) {
      classes.push('safari-browser');
    }
    
    if (detection.isIOSSupported) {
      classes.push('ios-supported');
    }
  }
  
  return classes;
}

/**
 * Comprehensive touch capability detection beyond just iOS
 */
export function detectTouchCapabilities(): TouchCapabilityResult {
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const maxTouchPoints = navigator.maxTouchPoints || 0;
  
  // Check if touch is the primary input method
  const isPrimaryTouch = window.matchMedia('(pointer: coarse)').matches;
  const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const supportsHover = window.matchMedia('(hover: hover)').matches;
  
  // Device classification heuristics
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  const minDimension = Math.min(screenWidth, screenHeight);
  const maxDimension = Math.max(screenWidth, screenHeight);
  
  // Mobile: typically 320-480px width, <7" diagonal
  const isLikelyMobile = hasTouch && minDimension <= 480 && maxDimension <= 896;
  
  // Tablet: typically 768px+ width, 7-13" diagonal
  const isLikelyTablet = hasTouch && minDimension >= 768 && !supportsHover;
  
  return {
    hasTouch,
    maxTouchPoints,
    isPrimaryTouch,
    isCoarsePointer,
    supportsHover,
    isLikelyMobile,
    isLikelyTablet,
  };
}

/**
 * Get comprehensive device and touch information
 */
export function getDeviceInfo(): {
  ios: IOSDetectionResult;
  touch: TouchCapabilityResult;
  deviceClass: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  needsIOSOptimizations: boolean;
  needsTouchOptimizations: boolean;
} {
  const ios = detectIOSDevice();
  const touch = detectTouchCapabilities();
  
  // Determine device class
  let deviceClass: 'mobile' | 'tablet' | 'desktop' | 'unknown' = 'unknown';
  if (ios.isIPhone || ios.isIPod || touch.isLikelyMobile) {
    deviceClass = 'mobile';
  } else if (ios.isIPad || touch.isLikelyTablet) {
    deviceClass = 'tablet';
  } else if (!touch.hasTouch || touch.supportsHover) {
    deviceClass = 'desktop';
  }
  
  return {
    ios,
    touch,
    deviceClass,
    needsIOSOptimizations: ios.isIOS && ios.isSafari,
    needsTouchOptimizations: touch.hasTouch && touch.isPrimaryTouch,
  };
}

/**
 * Debug information for iOS detection
 */
export function getIOSDebugInfo(): Record<string, unknown> {
  const detection = detectIOSDevice();
  const touch = detectTouchCapabilities();
  const deviceInfo = getDeviceInfo();
  
  return {
    ...detection,
    touchCapabilities: touch,
    deviceInfo,
    userAgent: navigator.userAgent,
    vendor: navigator.vendor,
    platform: navigator.platform,
    maxTouchPoints: navigator.maxTouchPoints,
    touchSensorConfig: getIOSTouchSensorConfig(),
    cssClasses: getIOSTouchClasses(),
  };
}