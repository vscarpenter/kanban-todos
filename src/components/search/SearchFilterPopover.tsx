"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Globe, X, SlidersHorizontal } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TaskFilters } from "@/lib/types";

interface ActiveFilterChipProps {
  label: string;
  onRemove: () => void;
}

function ActiveFilterChip({ label, onRemove }: ActiveFilterChipProps) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded"
      style={{
        padding: "2px 4px 2px 8px",
        background: "var(--accent-50)",
        color: "var(--accent-700)",
        border: "1px solid var(--accent-100)",
        fontSize: "11px",
        fontWeight: 500,
      }}
    >
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label}`}
        className="inline-flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-[var(--accent-100)]"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

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
  const [isOpen, setIsOpen] = useState(false);
  const activeFilterCount =
    (filters.search ? 1 : 0) +
    (filters.status ? 1 : 0) +
    (filters.priority ? 1 : 0) +
    filters.tags.length +
    (filters.crossBoardSearch ? 1 : 0);

  const handleClearFilters = () => {
    if (!hasActiveFilters) return;
    onClearFilters();
    setIsOpen(false);
  };

  const handleClearFiltersKeyDown = (event: React.KeyboardEvent<HTMLSpanElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    handleClearFilters();
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Open filters menu${hasActiveFilters ? ` (${activeFilterCount} active)` : ''}`}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 md:px-3 md:py-2 transition-colors touch-target-mobile"
          style={{
            background: "var(--paper-card)",
            border: "1px solid var(--hairline-strong)",
            boxShadow: "var(--shadow-xs)",
            fontSize: "12.5px",
            fontWeight: 600,
            color: "var(--ink-2)",
          }}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">Filters</span>
          {hasActiveFilters && (
            <span
              className="font-mono inline-flex items-center justify-center rounded px-1.5"
              style={{
                fontSize: "11px",
                fontWeight: 600,
                background: "var(--accent-100)",
                color: "var(--accent-700)",
                minWidth: "18px",
                fontFeatureSettings: '"tnum"',
              }}
              aria-label={`${activeFilterCount} active filters`}
            >
              {activeFilterCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-4" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="label-eyebrow">Filter</span>
            <span
              role="button"
              tabIndex={hasActiveFilters ? 0 : -1}
              onClick={handleClearFilters}
              onKeyDown={handleClearFiltersKeyDown}
              aria-disabled={!hasActiveFilters}
              aria-hidden={!hasActiveFilters}
              aria-label="Reset filters"
              className="inline-flex cursor-pointer items-center rounded px-2 py-1 transition-colors hover:text-[var(--ink-1)] aria-disabled:pointer-events-none aria-disabled:invisible"
              style={{
                fontSize: "11.5px",
                fontWeight: 500,
                color: "var(--ink-3)",
                minHeight: "32px",
              }}
            >
              Reset
            </span>
          </div>

          {/* Search Scope Toggle */}
          <div
            className="flex items-center justify-between rounded-lg p-3"
            style={{
              background: "var(--paper-1)",
              border: "1px solid var(--hairline)",
            }}
          >
            <div>
              <div className="flex items-center gap-2">
                <Globe className="h-3.5 w-3.5" style={{ color: "var(--ink-3)" }} aria-hidden="true" />
                <label
                  htmlFor="cross-board-search-toggle"
                  className="cursor-pointer"
                  style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--ink-1)" }}
                >
                  Search all boards
                </label>
              </div>
              <p
                className="mt-1"
                id="cross-board-search-description"
                style={{ fontSize: "11px", color: "var(--ink-4)" }}
              >
                {filters.crossBoardSearch
                  ? "Searching across all boards"
                  : "Searching current board only"}
              </p>
            </div>
            <Switch
              id="cross-board-search-toggle"
              checked={filters.crossBoardSearch}
              onCheckedChange={onScopeToggle}
              className="data-[state=checked]:bg-[var(--accent-500)]"
              aria-describedby="cross-board-search-description"
              aria-label={`Toggle cross-board search. Currently ${filters.crossBoardSearch ? 'enabled' : 'disabled'}`}
            />
          </div>

          {/* Status Filter */}
          <div className="space-y-1.5">
            <label htmlFor="status-filter" className="label-eyebrow block">Status</label>
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
          <div className="space-y-1.5">
            <label htmlFor="priority-filter" className="label-eyebrow block">Priority</label>
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
          {hasActiveFilters && (filters.status || filters.priority) && (
            <div className="space-y-1.5">
              <span className="label-eyebrow block">Active</span>
              <div className="flex flex-wrap gap-1.5">
                {filters.status && (
                  <ActiveFilterChip
                    label={`Status: ${filters.status}`}
                    onRemove={() => onFilterChange('status', undefined)}
                  />
                )}
                {filters.priority && (
                  <ActiveFilterChip
                    label={`Priority: ${filters.priority}`}
                    onRemove={() => onFilterChange('priority', undefined)}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
