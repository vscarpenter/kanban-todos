"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, X, Globe, Loader2, AlertTriangle } from "lucide-react";
import { useTaskStore } from "@/lib/stores/taskStore";
import { useSettingsStore } from "@/lib/stores/settingsStore";
import { TaskFilters } from "@/lib/types";

export function SearchBar() {
  const { 
    filters, 
    setFilters, 
    setCrossBoardSearch, 
    clearFilters, 
    isSearching, 
    error,
    tasks,
    filteredTasks
  } = useTaskStore();
  const { settings, updateSettings, isLoading: settingsLoading } = useSettingsStore();
  const [searchValue, setSearchValue] = useState(filters.search);
  const [localFilters, setLocalFilters] = useState<TaskFilters>(filters);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only update searchValue from filters if user is not actively typing
    if (!isUserTyping) {
      setSearchValue(filters.search);
    }
    setLocalFilters(filters);
  }, [filters, isUserTyping]);

  // Initialize cross-board search from settings on mount
  useEffect(() => {
    if (!settingsLoading && settings.searchPreferences?.rememberScope) {
      setCrossBoardSearch(settings.searchPreferences.defaultScope === 'all-boards');
    }
  }, [settings.searchPreferences, setCrossBoardSearch, settingsLoading]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleSearch = () => {
    setFilters({ ...localFilters, search: searchValue });
  };

  const handleFilterChange = (key: keyof TaskFilters, value: string | undefined) => {
    const filterValue = value === 'all' ? undefined : value;
    const newFilters = { ...localFilters, [key]: filterValue };
    setLocalFilters(newFilters);
    setFilters(newFilters);
  };

  const handleScopeToggle = async (enabled: boolean) => {
    setCrossBoardSearch(enabled);
    
    // Update settings if remember scope is enabled
    if (!settingsLoading && settings.searchPreferences?.rememberScope) {
      await updateSettings({
        searchPreferences: {
          ...settings.searchPreferences,
          defaultScope: enabled ? 'all-boards' : 'current-board'
        }
      });
    }
  };

  const handleClearFilters = () => {
    setIsUserTyping(false);
    clearFilters();
    setLocalFilters({ 
      search: '', 
      tags: [], 
      crossBoardSearch: filters.crossBoardSearch 
    });
    setSearchValue('');
  };

  const hasActiveFilters = filters.search || filters.status || filters.priority || filters.tags.length > 0;
  const hasLargeDataset = tasks.length > 500;

  return (
    <div className="border-b border-border bg-background p-4">
      <div className="flex items-center gap-4 max-w-4xl mx-auto">
        {/* Search Input */}
        <div className="flex-1 relative">
          {isSearching ? (
            <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
          ) : (
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          )}
          
          {/* Right side icons */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            {hasLargeDataset && (
              <div title={`Large dataset (${tasks.length} tasks) - searches may be slower`}>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </div>
            )}
            {filters.crossBoardSearch && !isSearching && (
              <div title="Searching across all boards">
                <Globe className="h-4 w-4 text-primary" />
              </div>
            )}
          </div>
          
          <Input
            placeholder={filters.crossBoardSearch ? "Search across all boards..." : "Search tasks..."}
            value={searchValue}
            onChange={(e) => {
              setIsUserTyping(true);
              setSearchValue(e.target.value);
              
              // Clear existing timeout
              if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
              }
              
              // Set new timeout to reset typing flag
              typingTimeoutRef.current = setTimeout(() => {
                setIsUserTyping(false);
              }, 1000);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (typingTimeoutRef.current) {
                  clearTimeout(typingTimeoutRef.current);
                }
                setIsUserTyping(false);
                handleSearch();
              } else if (e.key === 'Escape') {
                if (typingTimeoutRef.current) {
                  clearTimeout(typingTimeoutRef.current);
                }
                setIsUserTyping(false);
                setSearchValue('');
                handleClearFilters();
              }
            }}
            onBlur={() => {
              // Reset typing flag when input loses focus
              if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
              }
              setIsUserTyping(false);
            }}
            className={`pl-10 pr-12 ${error ? 'border-destructive' : ''} ${isSearching ? 'opacity-75' : ''}`}
            disabled={isSearching}
            aria-label={filters.crossBoardSearch ? "Search across all boards" : "Search tasks in current board"}
            aria-describedby={error ? "search-error" : filters.search ? "search-results" : undefined}
            role="searchbox"
            aria-autocomplete="list"
          />
          
          {/* Loading overlay */}
          {isSearching && (
            <div className="absolute inset-0 bg-background/50 rounded-md flex items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {filters.crossBoardSearch ? 'Searching all boards...' : 'Searching...'}
              </div>
            </div>
          )}
          
          {error && (
            <div 
              id="search-error"
              className="absolute top-full left-0 right-0 mt-1 p-3 bg-destructive/10 border border-destructive/20 rounded-md z-10"
              role="alert"
              aria-live="polite"
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div className="flex-1">
                  <p className="text-xs text-destructive font-medium mb-1">Search Error</p>
                  <p className="text-xs text-destructive/80">{error}</p>
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsUserTyping(false);
                        setSearchValue('');
                        setFilters({ ...localFilters, search: '' });
                        useTaskStore.getState().recoverFromSearchError();
                      }}
                      className="h-6 px-2 text-xs border-destructive/20 text-destructive hover:bg-destructive/10"
                      aria-label="Clear search and recover from error"
                    >
                      Clear Search
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsUserTyping(false);
                        useTaskStore.getState().setError(null);
                        handleSearch();
                      }}
                      className="h-6 px-2 text-xs border-destructive/20 text-destructive hover:bg-destructive/10"
                      aria-label="Retry the search operation"
                    >
                      Retry
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Search results summary */}
          {filters.search && !isSearching && !error && (
            <div 
              id="search-results"
              className="absolute top-full left-0 right-0 mt-1 p-2 bg-muted/50 border border-border/50 rounded-md text-xs text-muted-foreground z-10"
              role="status"
              aria-live="polite"
            >
              Found {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} 
              {filters.crossBoardSearch ? ' across all boards' : ' in current board'}
            </div>
          )}
        </div>

        {/* Filter Button */}
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              aria-label={`Open filters menu${hasActiveFilters ? ` (${Object.values(filters).filter(Boolean).length} active)` : ''}`}
              aria-expanded={false}
              aria-haspopup="dialog"
            >
              <Filter className="h-4 w-4 mr-2" aria-hidden="true" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs" aria-label={`${Object.values(filters).filter(Boolean).length} active filters`}>
                  {Object.values(filters).filter(Boolean).length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Filter Tasks</h4>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="h-6 px-2 text-xs"
                  >
                    Clear all
                  </Button>
                )}
              </div>

              {/* Search Scope Toggle */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <label 
                      htmlFor="cross-board-search-toggle"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Search all boards
                    </label>
                  </div>
                  <p 
                    className="text-xs text-muted-foreground"
                    id="cross-board-search-description"
                  >
                    {filters.crossBoardSearch 
                      ? "Searching across all boards" 
                      : "Searching current board only"
                    }
                  </p>
                </div>
                <Switch
                  id="cross-board-search-toggle"
                  checked={filters.crossBoardSearch}
                  onCheckedChange={handleScopeToggle}
                  aria-describedby="cross-board-search-description"
                  aria-label={`Toggle cross-board search. Currently ${filters.crossBoardSearch ? 'enabled' : 'disabled'}`}
                />
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <label htmlFor="status-filter" className="text-sm font-medium">Status</label>
                <Select
                  value={localFilters.status || 'all'}
                  onValueChange={(value) => handleFilterChange('status', value)}
                >
                  <SelectTrigger id="status-filter" aria-label="Filter by task status">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Priority Filter */}
              <div className="space-y-2">
                <label htmlFor="priority-filter" className="text-sm font-medium">Priority</label>
                <Select
                  value={localFilters.priority || 'all'}
                  onValueChange={(value) => handleFilterChange('priority', value)}
                >
                  <SelectTrigger id="priority-filter" aria-label="Filter by task priority">
                    <SelectValue placeholder="All priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All priorities</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Active Filters Display */}
              {hasActiveFilters && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Active Filters</label>
                  <div className="flex flex-wrap gap-2">
                    {filters.status && (
                      <Badge variant="secondary" className="text-xs">
                        Status: {filters.status}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                          onClick={() => handleFilterChange('status', undefined)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    )}
                    {filters.priority && (
                      <Badge variant="secondary" className="text-xs">
                        Priority: {filters.priority}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                          onClick={() => handleFilterChange('priority', undefined)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    )}
                  </div>
                </div>
              )}

            </div>
          </PopoverContent>
        </Popover>

        {/* Search Button */}
        <Button 
          onClick={handleSearch} 
          size="sm"
          aria-label="Execute search"
          disabled={isSearching}
        >
          {isSearching ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
              Searching...
            </>
          ) : (
            'Search'
          )}
        </Button>
      </div>
    </div>
  );
}
