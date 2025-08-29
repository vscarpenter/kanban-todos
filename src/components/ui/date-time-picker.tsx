"use client";

import * as React from "react";
import { format, parse, startOfDay, addDays, subDays } from "date-fns";
import { Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface DateTimePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  minDate?: Date;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Select date and time",
  disabled = false,
  className,
  minDate,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(value);
  const [timeValue, setTimeValue] = React.useState(() => {
    if (value) {
      return format(value, "HH:mm");
    }
    return "09:00";
  });

  // Update internal state when value prop changes
  React.useEffect(() => {
    setSelectedDate(value);
    if (value) {
      setTimeValue(format(value, "HH:mm"));
    }
  }, [value]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    
    // Combine selected date with current time
    const [hours, minutes] = timeValue.split(':').map(Number);
    const newDateTime = new Date(date);
    newDateTime.setHours(hours, minutes, 0, 0);
    
    onChange?.(newDateTime);
  };

  const handleTimeChange = (time: string) => {
    setTimeValue(time);
    
    if (selectedDate) {
      const [hours, minutes] = time.split(':').map(Number);
      const newDateTime = new Date(selectedDate);
      newDateTime.setHours(hours, minutes, 0, 0);
      
      onChange?.(newDateTime);
    }
  };

  const handleClear = () => {
    setSelectedDate(undefined);
    setTimeValue("09:00");
    onChange?.(undefined);
    setOpen(false);
  };

  const handleQuickSelect = (days: number) => {
    const today = new Date();
    const targetDate = days === 0 ? today : addDays(today, days);
    
    // Set time to 9 AM for quick selections
    targetDate.setHours(9, 0, 0, 0);
    
    setSelectedDate(targetDate);
    setTimeValue("09:00");
    onChange?.(targetDate);
    setOpen(false);
  };

  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const displayTime = format(parse(timeString, 'HH:mm', new Date()), 'h:mm a');
        times.push({ value: timeString, label: displayTime });
      }
    }
    return times;
  };

  const generateDateGrid = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Start from the first day of current month
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    
    // Get the day of week for the first day (0 = Sunday)
    const startDay = firstDay.getDay();
    
    // Create array of dates including previous month's trailing days
    const dates = [];
    
    // Add trailing days from previous month
    for (let i = startDay - 1; i >= 0; i--) {
      dates.push(subDays(firstDay, i + 1));
    }
    
    // Add all days of current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      dates.push(new Date(currentYear, currentMonth, day));
    }
    
    // Add leading days from next month to complete the grid
    const remainingCells = 42 - dates.length; // 6 rows × 7 days
    for (let day = 1; day <= remainingCells; day++) {
      dates.push(new Date(currentYear, currentMonth + 1, day));
    }
    
    return dates;
  };

  const isDateDisabled = (date: Date) => {
    if (minDate) {
      return date < startOfDay(minDate);
    }
    return false;
  };

  const formatDisplayValue = () => {
    if (!selectedDate) return "";
    
    const today = new Date();
    const tomorrow = addDays(today, 1);
    
    if (format(selectedDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
      return `Today at ${format(selectedDate, 'h:mm a')}`;
    } else if (format(selectedDate, 'yyyy-MM-dd') === format(tomorrow, 'yyyy-MM-dd')) {
      return `Tomorrow at ${format(selectedDate, 'h:mm a')}`;
    } else {
      return format(selectedDate, 'MMM d, yyyy \'at\' h:mm a');
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !selectedDate && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <Calendar className="mr-2 h-4 w-4" />
          {selectedDate ? formatDisplayValue() : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-4 space-y-4">
          {/* Quick Select Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickSelect(0)}
              className="flex-1"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickSelect(1)}
              className="flex-1"
            >
              Tomorrow
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickSelect(7)}
              className="flex-1"
            >
              Next Week
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-center">
              {format(new Date(), 'MMMM yyyy')}
            </div>
            
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 text-xs text-center text-muted-foreground">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="p-2 font-medium">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Date grid */}
            <div className="grid grid-cols-7 gap-1">
              {generateDateGrid().map((date, index) => {
                const isCurrentMonth = date.getMonth() === new Date().getMonth();
                const isSelected = selectedDate && format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                const disabled = isDateDisabled(date);
                
                return (
                  <Button
                    key={index}
                    variant={isSelected ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "h-8 w-8 p-0 text-xs",
                      !isCurrentMonth && "text-muted-foreground opacity-50",
                      isToday && !isSelected && "bg-accent",
                      disabled && "opacity-30 cursor-not-allowed"
                    )}
                    onClick={() => !disabled && handleDateSelect(date)}
                    disabled={disabled}
                  >
                    {date.getDate()}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Time Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Time
            </Label>
            <Select value={timeValue} onValueChange={handleTimeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {generateTimeOptions().map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="flex-1"
            >
              Clear
            </Button>
            <Button
              size="sm"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Done
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}