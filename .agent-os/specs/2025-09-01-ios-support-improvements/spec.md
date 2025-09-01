# Spec Requirements Document

> Spec: iOS Support Improvements
> Created: 2025-09-01
> Status: Planning

## Overview

Resolve critical iOS Safari drag-and-drop issues, implement touch-friendly board reordering controls, and establish robust cache busting to ensure optimal mobile experience for iOS 18+ Safari users.

## User Stories

### iPad Task Management
As an iPad Pro user, I want to drag tasks between columns so that I can manage my workflow efficiently on mobile devices.

**Current Issue Workflow:**
1. User touches and holds a task card in "To Do" column
2. User drags task card across screen to "In Progress" column
3. Task card visually moves and appears to drop successfully
4. Task card immediately snaps back to original position
5. User becomes frustrated and abandons mobile workflow

**Expected Workflow:**
1. User touches and holds a task card in "To Do" column
2. User drags task card across screen to "In Progress" column
3. Task card drops and remains in new position
4. Database updates reflect the column change
5. User continues productive mobile workflow

### Board Organization  
As an iOS user, I want to reorder boards using touch-friendly controls so that I can organize my workspace without drag-and-drop limitations.

**Proposed Workflow:**
1. User navigates to board management or sidebar
2. User sees up/down arrow buttons next to each board name
3. User taps up arrow to move board higher in order
4. User taps down arrow to move board lower in order
5. Board order updates immediately with smooth animation
6. New order persists across app sessions

### Cache Management
As an iOS user, I want to ensure I'm running the latest version so that I get all new features and bug fixes without manual cache clearing.

**Current Issue Workflow:**
1. Developer deploys new version with iOS fixes
2. iOS user visits app expecting improvements
3. Service worker serves cached outdated version
4. User continues experiencing known bugs
5. User must manually clear browser data to get updates

**Expected Workflow:**
1. Developer deploys new version with cache busting
2. iOS user visits app
3. Service worker detects version mismatch
4. App automatically fetches and caches latest version
5. User sees version indicator confirming latest code
6. User immediately benefits from all improvements

## Spec Scope

1. **iOS Safari Touch Event Handling** - Fix @dnd-kit configuration for iOS Safari drag-and-drop completion
   - Investigate TouchSensor configuration and iOS-specific touch event handling
   - Implement proper touch event prevention and pointer capture for Safari
   - Test drag-and-drop completion across different iPad sizes and orientations

2. **Board Reordering Controls** - Implement up/down arrow controls for board reordering on touch devices
   - Add iOS detection utility for conditional UI rendering
   - Design and implement up/down arrow button components
   - Integrate with existing board store reordering logic
   - Add smooth animations for board position changes

3. **Cache Busting System** - Implement automatic cache invalidation for service worker and static assets
   - Add build-time version generation and injection
   - Implement service worker cache versioning strategy
   - Add client-side version checking and cache invalidation
   - Create visible version indicator for user confirmation

4. **iOS Detection** - Add iOS-specific UI adaptations and fallbacks
   - Implement reliable iOS/iPadOS detection
   - Add conditional rendering for touch-optimized controls
   - Ensure graceful fallbacks for unsupported features

5. **Version Management** - Add visible version indicator for cache validation
   - Display current app version in settings or footer
   - Add cache status indicator for debugging
   - Implement manual cache refresh option for power users

## Out of Scope

- IndexedDB data clearing or migration (data persistence maintained)
- Support for iOS versions below 18 (focusing on latest Safari capabilities)
- Chrome/Firefox iOS optimization (Safari-first approach)
- Desktop UI changes (mobile-specific improvements only)
- Android touch optimizations (iOS-focused scope)
- Complete drag-and-drop library replacement (optimize existing @dnd-kit)

## Expected Deliverable

1. **Functional Task Drag-and-Drop**: iPad users can successfully drag tasks between columns without snap-back behavior, with visual feedback and reliable completion across all supported iPad models and orientations

2. **Touch-Friendly Board Management**: iOS users can reorder boards using intuitive up/down arrow controls with smooth animations, maintaining the same functionality as desktop drag-and-drop

3. **Automatic Cache Updates**: iOS devices automatically receive latest code updates through intelligent cache busting, with visible version confirmation and elimination of stale code issues

## Spec Documentation

- Tasks: @.agent-os/specs/2025-09-01-ios-support-improvements/tasks.md
- Technical Specification: @.agent-os/specs/2025-09-01-ios-support-improvements/sub-specs/technical-spec.md
- Testing Specification: @.agent-os/specs/2025-09-01-ios-support-improvements/sub-specs/tests.md