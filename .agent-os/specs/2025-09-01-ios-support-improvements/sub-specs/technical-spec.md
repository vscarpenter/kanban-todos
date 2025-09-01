# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-09-01-ios-support-improvements/spec.md

> Created: 2025-09-01
> Version: 1.0.0

## Technical Requirements

### iOS Safari Drag-and-Drop Fix

#### @dnd-kit TouchSensor Configuration
- **TouchSensor Activation Distance**: Set `activationDistance` to `{ x: 5, y: 5 }` to prevent accidental activation
- **Touch Activation Delay**: Configure `activationDelay` to `150ms` for iPad Pro compatibility
- **Touch Event Handling**: Implement custom touch event handling with `touchend` event completion
- **iOS Safari Compatibility**: Add specific configuration for iOS Safari user agent detection

#### Implementation Details
```typescript
// Custom TouchSensor configuration
const touchSensor = useSensor(TouchSensor, {
  activationConstraint: {
    distance: 5,
    delay: 150,
    tolerance: 5,
  },
});

// iOS-specific event handling
const handleTouchEnd = (event: TouchEvent) => {
  // Prevent snap-back behavior on iOS Safari
  event.preventDefault();
  // Ensure proper drop completion
};
```

### Board Reordering Controls

#### Touch-Friendly Controls
- **Arrow Button Components**: Create `BoardReorderControls` with up/down arrows
- **Touch Target Size**: Minimum 44px x 44px per Apple Human Interface Guidelines
- **Visual Feedback**: Add pressed states and haptic feedback simulation
- **Accessibility**: ARIA labels and keyboard navigation support

#### Programmatic Reordering
- **@dnd-kit Integration**: Use `arrayMove` utility for position updates
- **State Management**: Update Zustand board store with new order
- **Persistence**: Immediate IndexedDB sync for reorder operations
- **Animation**: Smooth transitions using CSS transforms

#### Implementation Details
```typescript
// Board reorder controls component
interface BoardReorderControlsProps {
  boardId: string;
  currentIndex: number;
  totalBoards: number;
  onReorder: (direction: 'up' | 'down') => void;
}

// Programmatic reordering logic
const handleBoardReorder = (boardId: string, direction: 'up' | 'down') => {
  const boards = useBoardStore.getState().boards;
  const currentIndex = boards.findIndex(b => b.id === boardId);
  const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  
  if (newIndex >= 0 && newIndex < boards.length) {
    const reorderedBoards = arrayMove(boards, currentIndex, newIndex);
    useBoardStore.getState().setBoards(reorderedBoards);
  }
};
```

### Cache Busting System

#### Service Worker Versioning
- **Build-Time Version**: Generate version hash from build timestamp and git commit
- **Version Storage**: Store in service worker and compare on update check
- **Cache Strategy**: Implement stale-while-revalidate with version validation
- **Update Detection**: Check for new versions on app focus and periodic intervals

#### Implementation Details
```typescript
// Version generation at build time
const VERSION = `${process.env.BUILD_TIMESTAMP}-${process.env.GIT_COMMIT_HASH?.slice(0, 8)}`;

// Service worker update logic
const checkForUpdates = async () => {
  const registration = await navigator.serviceWorker.getRegistration();
  if (registration) {
    await registration.update();
    
    if (registration.waiting) {
      // New version available
      showUpdateNotification();
    }
  }
};

// Cache invalidation strategy
const cacheStrategy = new StaleWhileRevalidate({
  cacheName: `kanban-cache-${VERSION}`,
  plugins: [
    new CacheableResponsePlugin({
      statuses: [0, 200],
    }),
  ],
});
```

### iOS Detection and Adaptation

#### User Agent Detection
- **iOS Safari Detection**: Comprehensive user agent string parsing
- **Device Type**: Distinguish between iPhone, iPad, and iPad Pro
- **Safari Version**: Detect Safari version for feature compatibility
- **Touch Capability**: Detect touch vs. mouse input methods

#### Conditional UI Rendering
- **Touch Controls**: Show alternative controls on touch devices
- **Drag Handle Visibility**: Enhanced visual indicators for iOS
- **Button Sizing**: Larger touch targets on mobile devices
- **Gesture Support**: iOS-specific swipe gestures for quick actions

#### Implementation Details
```typescript
// iOS detection utility
const detectIOSDevice = () => {
  const userAgent = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isSafari = /Safari/.test(userAgent) && !/Chrome|CriOS|FxiOS/.test(userAgent);
  const isIPadPro = /iPad/.test(userAgent) && window.screen.height >= 1024;
  
  return {
    isIOS,
    isSafari,
    isIPadPro,
    isIOSSafari: isIOS && isSafari,
  };
};

// CSS classes for iOS-specific styling
.ios-device {
  --touch-target-size: 44px;
  --drag-handle-size: 32px;
}

.ios-device .drag-handle {
  min-height: var(--drag-handle-size);
  min-width: var(--drag-handle-size);
  touch-action: none;
}
```

### Version Management

#### Version Display
- **Version Indicator**: Show in settings/about section with build info
- **Update Status**: Display current version and available update status
- **Release Notes**: Link to changelog or release information
- **Debug Info**: Include device info and feature detection results

#### Update Notification System
- **Update Banner**: Non-intrusive notification of available updates
- **User Control**: Allow user to dismiss or apply updates
- **Automatic Updates**: Optional automatic update installation
- **Rollback Support**: Ability to revert to previous version if needed

#### Implementation Details
```typescript
// Version management store
interface VersionState {
  currentVersion: string;
  availableVersion?: string;
  lastUpdateCheck: number;
  updateAvailable: boolean;
  showUpdateNotification: boolean;
}

// Update notification component
const UpdateNotification = () => {
  const { updateAvailable, availableVersion } = useVersionStore();
  
  const handleUpdate = async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };
  
  if (!updateAvailable) return null;
  
  return (
    <div className="update-notification">
      <p>New version {availableVersion} available!</p>
      <button onClick={handleUpdate}>Update Now</button>
    </div>
  );
};
```

## Approach

### Implementation Strategy
1. **Phase 1**: Fix critical iOS Safari drag-and-drop issues with @dnd-kit configuration
2. **Phase 2**: Implement alternative board reordering controls for touch devices
3. **Phase 3**: Enhance service worker and cache busting mechanisms
4. **Phase 4**: Add comprehensive version management and update notifications

### Testing Strategy
- **Device Testing**: Test on physical iOS devices (iPhone, iPad, iPad Pro)
- **Safari Versions**: Test across Safari 15, 16, and 17
- **Touch Simulation**: Use browser dev tools touch simulation for initial testing
- **Performance Testing**: Verify smooth animations and responsive touch handling

### Rollback Plan
- **Feature Flags**: Implement feature toggles for new iOS-specific features
- **Progressive Enhancement**: Ensure core functionality works without new features
- **Error Handling**: Graceful degradation if iOS-specific features fail

## External Dependencies

### @dnd-kit Updates
- **Version Compatibility**: Verify compatibility with @dnd-kit v6.1.0+
- **TouchSensor API**: Use latest TouchSensor configuration options
- **Custom Sensors**: Potentially implement custom sensor for iOS Safari

### Service Worker APIs
- **Registration API**: Standard service worker registration methods
- **Cache API**: Browser Cache API for version-aware caching
- **Update Events**: Service worker update lifecycle events

### iOS Web APIs
- **Touch Events**: TouchEvent API for custom touch handling
- **User Agent**: Navigator.userAgent for device detection
- **Viewport**: Visual viewport API for iOS Safari compatibility

### Build Tools
- **Environment Variables**: Access to build timestamp and git commit hash
- **Static Asset Versioning**: Build-time asset hash generation
- **Service Worker Generation**: Workbox or custom service worker build process