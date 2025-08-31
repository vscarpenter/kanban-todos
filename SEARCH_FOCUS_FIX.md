# Search Bar Focus Issue Fix

## Problem Description
The search bar was losing focus every time a user typed a letter. This made it extremely difficult to search as users had to click back into the search input after each character.

## Root Cause Analysis
The issue was caused by a state management conflict in the `SearchBar` component:

1. **User types in search input** → triggers `onChange` handler
2. **onChange handler calls both:**
   - `setSearchValue(e.target.value)` (local state)
   - `setSearchQuery(e.target.value)` (global store)
3. **Global store update triggers useEffect** that depends on `filters`
4. **useEffect calls `setSearchValue(filters.search)`** → causes re-render
5. **Re-render causes input to lose focus**

The problematic code:
```tsx
const [searchValue, setSearchValue] = useState(filters.search);

useEffect(() => {
  setSearchValue(filters.search);  // This causes focus loss!
  setLocalFilters(filters);
}, [filters]);

// In the input onChange:
onChange={(e) => {
  setSearchValue(e.target.value);
  setSearchQuery(e.target.value);  // This triggers the useEffect above
}}
```

## Solution
Added a `isUserTyping` flag to prevent the `useEffect` from updating the search value when the user is actively typing:

```tsx
const [isUserTyping, setIsUserTyping] = useState(false);

useEffect(() => {
  // Only update searchValue from filters if user is not actively typing
  if (!isUserTyping) {
    setSearchValue(filters.search);
  }
  setLocalFilters(filters);
}, [filters, isUserTyping]);

// In the input onChange:
onChange={(e) => {
  setIsUserTyping(true);
  setSearchValue(e.target.value);
  setSearchQuery(e.target.value);
  // Reset typing flag after a short delay
  setTimeout(() => setIsUserTyping(false), 100);
}}
```

## Additional Improvements
1. **Added `onBlur` handler** to reset the typing flag when input loses focus
2. **Updated keyboard handlers** to reset the typing flag on Enter/Escape
3. **Updated error recovery buttons** to reset the typing flag
4. **Updated clear filters function** to reset the typing flag

## Files Modified
- `src/components/SearchBar.tsx` - Main fix implementation

## Testing
- All existing SearchBar tests continue to pass
- The fix preserves all existing functionality while solving the focus issue
- No breaking changes to the API or user interface

## How It Works
The `isUserTyping` flag acts as a guard to prevent external state updates from interfering with user input. When the user is actively typing:
- Local state updates immediately (responsive UI)
- Global state updates for search functionality
- External state changes are ignored to preserve focus
- After a brief delay or explicit events (blur, Enter, Escape), external updates are allowed again

This ensures the search input remains focused and responsive while maintaining all search functionality.