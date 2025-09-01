# Spec Tasks

These are the tasks to be completed for the spec detailed in @.agent-os/specs/2025-09-01-ios-support-improvements/spec.md

> Created: 2025-09-01
> Status: Ready for Implementation

## Tasks

- [ ] 1. iOS Safari Drag-and-Drop Fix
  - [ ] 1.1 Write tests for TouchSensor configuration and touch event handling
  - [ ] 1.2 Update @dnd-kit TouchSensor configuration with iOS-optimized activation distance (15px) and delay (200ms)
  - [ ] 1.3 Implement touch event preventDefault handling in DragDropProvider.tsx to prevent iOS scroll interference
  - [ ] 1.4 Add touchAction CSS properties to draggable elements (.touch-action-none class)
  - [ ] 1.5 Create iOS-specific touch feedback with haptic vibration API integration
  - [ ] 1.6 Update pointer sensor fallback configuration for iOS Safari compatibility
  - [ ] 1.7 Test drag-and-drop functionality across iOS Safari versions (15+, 16+, 17+)
  - [ ] 1.8 Verify all touch sensor tests pass and drag operations work on iOS devices

- [ ] 2. Board Reordering Controls for Touch Devices
  - [ ] 2.1 Write tests for BoardReorderControls component and touch interaction patterns
  - [ ] 2.2 Create BoardReorderControls component with up/down arrow buttons (44px minimum touch targets)
  - [ ] 2.3 Implement board position mutation functions in useBoardStore (moveBoard, reorderBoards)
  - [ ] 2.4 Add conditional rendering logic to show arrows only on touch devices (iOS detection)
  - [ ] 2.5 Style arrow controls with proper accessibility (ARIA labels, focus indicators, high contrast)
  - [ ] 2.6 Integrate controls into Sidebar.tsx board list with proper spacing and alignment
  - [ ] 2.7 Add keyboard navigation support (Enter/Space activation) for accessibility compliance
  - [ ] 2.8 Verify board reordering works correctly and persists to IndexedDB

- [ ] 3. Enhanced Cache Busting System
  - [ ] 3.1 Write tests for service worker versioning and cache invalidation logic
  - [ ] 3.2 Update service worker with BUILD_TIMESTAMP-based versioning strategy
  - [ ] 3.3 Implement selective cache invalidation for HTML files while preserving static assets
  - [ ] 3.4 Add cache validation checks on app startup to detect stale content
  - [ ] 3.5 Create automatic cache refresh mechanism with user notification system
  - [ ] 3.6 Implement fallback cache strategy for offline scenarios
  - [ ] 3.7 Add debug logging for cache operations in development mode
  - [ ] 3.8 Verify cache busting works correctly and updates are properly detected

- [ ] 4. iOS Detection and Conditional UI Adaptation
  - [ ] 4.1 Write tests for iOS user agent detection and device capability detection
  - [ ] 4.2 Create iOS detection utility with comprehensive user agent patterns (iPhone, iPad, iPod)
  - [ ] 4.3 Implement touch capability detection beyond just iOS (Android tablets, Windows touch)
  - [ ] 4.4 Add iOS-specific CSS classes and touch behavior modifications
  - [ ] 4.5 Create responsive touch target sizing (44px minimum) for iOS interface guidelines
  - [ ] 4.6 Implement iOS-specific scroll behavior and momentum scrolling optimizations
  - [ ] 4.7 Add iOS Safari viewport meta tag optimizations for proper scaling
  - [ ] 4.8 Verify iOS detection accuracy and UI adaptations work across different iOS devices

- [ ] 5. Version Management and Update Notification System
  - [ ] 5.1 Write tests for version display, update detection, and notification components
  - [ ] 5.2 Create VersionIndicator component to display current app version in footer/settings
  - [ ] 5.3 Implement UpdateNotification component with dismiss and refresh actions
  - [ ] 5.4 Add version comparison logic to detect when updates are available
  - [ ] 5.5 Integrate update notifications with service worker update events
  - [ ] 5.6 Create user-friendly update messaging with benefits and change highlights
  - [ ] 5.7 Add update preference settings (automatic, manual, notifications enabled/disabled)
  - [ ] 5.8 Verify version management system works correctly and provides clear user feedback

## Technical Implementation Notes

### @dnd-kit Configuration Changes
- TouchSensor activationConstraint: { distance: 15, delay: 200 }
- Add preventDefault to touch events in sensor configuration
- Implement pointer-events: none during drag operations

### CSS Touch Specifications
- Minimum touch target size: 44px x 44px (iOS guidelines)
- touch-action: none for draggable elements
- -webkit-touch-callout: none for iOS Safari

### Service Worker Cache Strategy
- Cache static assets with BUILD_TIMESTAMP versioning
- Invalidate HTML cache on version mismatch
- Implement stale-while-revalidate for optimal performance

### iOS User Agent Detection Patterns
- iPhone: /iPhone.*OS\s([\d_]+)/
- iPad: /iPad.*OS\s([\d_]+)/
- iPod: /iPod.*OS\s([\d_]+)/
- iOS WebView: /Version\/[\d\.]+ Mobile.*Safari/

### Zustand Store Updates
- useBoardStore: Add moveBoard, reorderBoards actions
- useSettingsStore: Add version, updatePreferences state
- Persist reordering changes to IndexedDB immediately

### Accessibility Requirements
- WCAG 2.1 AA compliance for all new touch controls
- Screen reader support with proper ARIA labels
- Keyboard navigation equivalents for touch interactions
- High contrast mode compatibility

## Dependencies and Build Order
1. Complete Task 1 (drag-and-drop) before Task 2 (board controls) - shared touch detection
2. Task 3 (cache busting) can be developed in parallel
3. Task 4 (iOS detection) provides utilities needed for Tasks 1-2
4. Task 5 (version management) integrates with Task 3 cache system
5. All tasks require comprehensive testing before deployment to todos.vinny.dev