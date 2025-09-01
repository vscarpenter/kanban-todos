import { describe, it, expect, afterEach } from 'vitest'
import { 
  detectIOSDevice, 
  isIOSSafariSupported, 
  needsIOSTouchOptimization,
  getIOSTouchSensorConfig,
  getIOSTouchClasses,
  getIOSDebugInfo 
} from '../iosDetection'

describe('iOS Detection Utility', () => {
  const originalUserAgent = navigator.userAgent
  const originalVendor = navigator.vendor
  const originalPlatform = navigator.platform
  const originalMaxTouchPoints = navigator.maxTouchPoints

  afterEach(() => {
    // Restore original values
    Object.defineProperty(navigator, 'userAgent', { 
      value: originalUserAgent, 
      configurable: true 
    })
    Object.defineProperty(navigator, 'vendor', { 
      value: originalVendor, 
      configurable: true 
    })
    Object.defineProperty(navigator, 'platform', { 
      value: originalPlatform, 
      configurable: true 
    })
    Object.defineProperty(navigator, 'maxTouchPoints', { 
      value: originalMaxTouchPoints, 
      configurable: true 
    })
  })

  describe('iPad Pro Detection', () => {
    it('should detect iPad Pro with iOS 18', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
        configurable: true,
      })
      Object.defineProperty(navigator, 'vendor', {
        value: 'Apple Computer, Inc.',
        configurable: true,
      })
      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: 5,
        configurable: true,
      })

      const result = detectIOSDevice()

      expect(result.isIOS).toBe(true)
      expect(result.isIPad).toBe(true)
      expect(result.isIPhone).toBe(false)
      expect(result.isSafari).toBe(true)
      expect(result.iosVersion).toBe(18)
      expect(result.safariVersion).toBe(18)
      expect(result.isIOSSupported).toBe(true)
    })

    it('should detect iPad Pro using MacIntel platform detection', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
        configurable: true,
      })
      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        configurable: true,
      })
      Object.defineProperty(navigator, 'vendor', {
        value: 'Apple Computer, Inc.',
        configurable: true,
      })
      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: 5,
        configurable: true,
      })

      const result = detectIOSDevice()

      expect(result.isIOS).toBe(true)
      expect(result.isIPad).toBe(true)
      expect(result.isSafari).toBe(true)
    })
  })

  describe('iPhone Detection', () => {
    it('should detect iPhone with iOS 18', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
        configurable: true,
      })
      Object.defineProperty(navigator, 'vendor', {
        value: 'Apple Computer, Inc.',
        configurable: true,
      })

      const result = detectIOSDevice()

      expect(result.isIOS).toBe(true)
      expect(result.isIPad).toBe(false)
      expect(result.isIPhone).toBe(true)
      expect(result.isSafari).toBe(true)
      expect(result.iosVersion).toBe(18)
      expect(result.isIOSSupported).toBe(true)
    })
  })

  describe('Non-Safari Browser Detection', () => {
    it('should detect Chrome on iOS', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.0.0 Mobile/15E148 Safari/604.1',
        configurable: true,
      })
      Object.defineProperty(navigator, 'vendor', {
        value: 'Apple Computer, Inc.',
        configurable: true,
      })

      const result = detectIOSDevice()

      expect(result.isIOS).toBe(true)
      expect(result.isSafari).toBe(false) // Chrome, not Safari
    })

    it('should detect Firefox on iOS', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/120.0 Mobile/15E148 Safari/605.1.15',
        configurable: true,
      })

      const result = detectIOSDevice()

      expect(result.isIOS).toBe(true)
      expect(result.isSafari).toBe(false) // Firefox, not Safari
    })
  })

  describe('Version Support', () => {
    it('should detect iOS 17 as not supported', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/604.1',
        configurable: true,
      })
      Object.defineProperty(navigator, 'vendor', {
        value: 'Apple Computer, Inc.',
        configurable: true,
      })

      const result = detectIOSDevice()

      expect(result.isIOS).toBe(true)
      expect(result.iosVersion).toBe(17)
      expect(result.isIOSSupported).toBe(false)
    })

    it('should detect iOS 19 as supported', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPad; CPU OS 19_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/19.0 Safari/604.1',
        configurable: true,
      })
      Object.defineProperty(navigator, 'vendor', {
        value: 'Apple Computer, Inc.',
        configurable: true,
      })

      const result = detectIOSDevice()

      expect(result.iosVersion).toBe(19)
      expect(result.isIOSSupported).toBe(true)
    })
  })

  describe('Non-iOS Devices', () => {
    it('should detect Android device', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        configurable: true,
      })
      Object.defineProperty(navigator, 'vendor', {
        value: 'Google Inc.',
        configurable: true,
      })
      Object.defineProperty(navigator, 'platform', {
        value: 'Linux armv8l',
        configurable: true,
      })
      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: 5,
        configurable: true,
      })

      const result = detectIOSDevice()

      expect(result.isIOS).toBe(false)
      expect(result.isIPad).toBe(false)
      expect(result.isIPhone).toBe(false)
      expect(result.isSafari).toBe(false)
      expect(result.isIOSSupported).toBe(false)
    })

    it('should detect desktop browser', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        configurable: true,
      })
      Object.defineProperty(navigator, 'vendor', {
        value: 'Google Inc.',
        configurable: true,
      })
      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        configurable: true,
      })
      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: 0,
        configurable: true,
      })

      const result = detectIOSDevice()

      expect(result.isIOS).toBe(false)
      expect(result.isIPad).toBe(false)
    })
  })

  describe('Utility Functions', () => {
    it('should return correct iOS Safari support status', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/604.1',
        configurable: true,
      })
      Object.defineProperty(navigator, 'vendor', {
        value: 'Apple Computer, Inc.',
        configurable: true,
      })

      expect(isIOSSafariSupported()).toBe(true)
    })

    it('should detect need for touch optimization', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/604.1',
        configurable: true,
      })
      Object.defineProperty(navigator, 'vendor', {
        value: 'Apple Computer, Inc.',
        configurable: true,
      })

      expect(needsIOSTouchOptimization()).toBe(true)
    })

    it('should provide iPad-optimized touch sensor config', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/604.1',
        configurable: true,
      })

      const config = getIOSTouchSensorConfig()

      expect(config.activationConstraint.delay).toBe(150) // iPad gets faster activation
      expect(config.activationConstraint.tolerance).toBe(12) // iPad gets more tolerance
    })

    it('should provide iPhone-optimized touch sensor config', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/604.1',
        configurable: true,
      })

      const config = getIOSTouchSensorConfig()

      expect(config.activationConstraint.delay).toBe(200)
      expect(config.activationConstraint.tolerance).toBe(8)
    })

    it('should provide default config for non-iOS devices', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        configurable: true,
      })

      const config = getIOSTouchSensorConfig()

      expect(config.activationConstraint.delay).toBe(200)
      expect(config.activationConstraint.tolerance).toBe(8)
    })

    it('should generate appropriate CSS classes', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/604.1',
        configurable: true,
      })
      Object.defineProperty(navigator, 'vendor', {
        value: 'Apple Computer, Inc.',
        configurable: true,
      })

      const classes = getIOSTouchClasses()

      expect(classes).toContain('ios-device')
      expect(classes).toContain('ipad-device')
      expect(classes).toContain('safari-browser')
      expect(classes).toContain('ios-supported')
    })

    it('should provide comprehensive debug info', () => {
      const debugInfo = getIOSDebugInfo()

      expect(debugInfo).toHaveProperty('isIOS')
      expect(debugInfo).toHaveProperty('userAgent')
      expect(debugInfo).toHaveProperty('touchSensorConfig')
      expect(debugInfo).toHaveProperty('cssClasses')
    })
  })
})