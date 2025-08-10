"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, X } from "lucide-react";
import { useTaskStore } from "@/lib/stores/taskStore";
import { TaskFilters } from "@/lib/types";

export function SearchBar() {
  const { filters, setFilters, applyFilters, clearFilters } = useTaskStore();
  const [searchValue, setSearchValue] = useState(filters.search);
  const [localFilters, setLocalFilters] = useState<TaskFilters>(filters);

  useEffect(() => {
    setSearchValue(filters.search);
    setLocalFilters(filters);
  }, [filters]);

  const handleSearch = () => {
    setFilters({ search: searchValue });
    applyFilters();
  };

  const handleFilterChange = (key: keyof TaskFilters, value: string | undefined) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    setFilters(newFilters);
    applyFilters();
  };

  const handleClearFilters = () => {
    clearFilters();
    setLocalFilters({ search: '', tags: [] });
    setSearchValue('');
  };

  const hasActiveFilters = filters.search || filters.status || filters.priority || filters.tags.length > 0;

  return (
    <div className="border-b border-border bg-background p-4">
      <div className="flex items-center gap-4 max-w-4xl mx-auto">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10 pr-4"
          />
        </div>

        {/* Filter Button */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
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

              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={localFilters.status || ''}
                  onValueChange={(value) => handleFilterChange('status', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All statuses</SelectItem>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Priority Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select
                  value={localFilters.priority || ''}
                  onValueChange={(value) => handleFilterChange('priority', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All priorities</SelectItem>
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
        <Button onClick={handleSearch} size="sm">
          Search
        </Button>
      </div>
    </div>
  );
}
