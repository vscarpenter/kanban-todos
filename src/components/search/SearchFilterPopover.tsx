"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Filter, Globe, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TaskFilters } from "@/lib/types";

interface SearchFilterPopoverProps {
  filters: TaskFilters;
  localFilters: TaskFilters;
  hasActiveFilters: boolean;
  onFilterChange: (key: keyof TaskFilters, value: string | undefined) => void;
  onScopeToggle: (enabled: boolean) => void;
  onClearFilters: () => void;
}

/**
 * Popover menu with search filters and settings
 */
export function SearchFilterPopover({
  filters,
  localFilters,
  hasActiveFilters,
  onFilterChange,
  onScopeToggle,
  onClearFilters
}: SearchFilterPopoverProps) {
  return (
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
                onClick={onClearFilters}
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
              onCheckedChange={onScopeToggle}
              aria-describedby="cross-board-search-description"
              aria-label={`Toggle cross-board search. Currently ${filters.crossBoardSearch ? 'enabled' : 'disabled'}`}
            />
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <label htmlFor="status-filter" className="text-sm font-medium">Status</label>
            <Select
              value={localFilters.status || 'all'}
              onValueChange={(value) => onFilterChange('status', value)}
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
              onValueChange={(value) => onFilterChange('priority', value)}
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
                      onClick={() => onFilterChange('status', undefined)}
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
                      onClick={() => onFilterChange('priority', undefined)}
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
  );
}
