"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar, Clock } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface DateTimePickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const TIME_PRESETS = [
  { label: "9:00 AM", value: "09:00" },
  { label: "12:00 PM", value: "12:00" },
  { label: "1:00 PM", value: "13:00" },
  { label: "3:00 PM", value: "15:00" },
  { label: "5:00 PM", value: "17:00" },
  { label: "6:00 PM", value: "18:00" },
  { label: "End of day", value: "23:59" },
];

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Select date and time",
  className,
  disabled
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Parse the current value
  const currentDate = value ? new Date(value) : null;
  const isValidDate = currentDate && !isNaN(currentDate.getTime());
  const dateValue = isValidDate ? format(currentDate, "yyyy-MM-dd") : "";
  const timeValue = isValidDate ? format(currentDate, "HH:mm") : "";
  
  const handleDateChange = (newDate: string) => {
    if (!newDate) {
      onChange("");
      return;
    }
    
    const time = timeValue || "09:00";
    const dateTime = `${newDate}T${time}`;
    onChange(dateTime);
  };
  
  const handleTimeChange = (newTime: string) => {
    if (!dateValue) {
      // If no date is selected, use today
      const today = format(new Date(), "yyyy-MM-dd");
      const dateTime = `${today}T${newTime}`;
      onChange(dateTime);
    } else {
      const dateTime = `${dateValue}T${newTime}`;
      onChange(dateTime);
    }
  };
  
  const handleTimePreset = (presetTime: string) => {
    handleTimeChange(presetTime);
    setIsOpen(false);
  };
  
  const formatDisplayValue = () => {
    if (!isValidDate) return "";
    return format(currentDate, "MMM d, yyyy 'at' h:mm a");
  };
  
  const clearValue = () => {
    onChange("");
    setIsOpen(false);
  };
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <Calendar className="mr-2 h-4 w-4" />
          {value ? formatDisplayValue() : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-4 space-y-4">
          {/* Date Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Date</Label>
            <Input
              type="date"
              value={dateValue}
              onChange={(e) => handleDateChange(e.target.value)}
              min={format(new Date(), "yyyy-MM-dd")}
              className="w-full"
            />
          </div>
          
          {/* Time Presets */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Quick Times</Label>
            <div className="grid grid-cols-2 gap-2">
              {TIME_PRESETS.map((preset) => (
                <Button
                  key={preset.value}
                  variant={timeValue === preset.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleTimePreset(preset.value)}
                  className="text-xs"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Custom Time */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Custom Time
            </Label>
            <Input
              type="time"
              value={timeValue}
              onChange={(e) => handleTimeChange(e.target.value)}
              className="w-full"
            />
          </div>
          
          {/* Actions */}
          <div className="flex justify-between pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearValue}
              className="text-xs"
            >
              Clear
            </Button>
            <Button
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-xs"
            >
              Done
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}