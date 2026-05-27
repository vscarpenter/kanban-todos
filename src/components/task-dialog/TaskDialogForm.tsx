"use client";

import type { Dispatch, FormEvent, KeyboardEvent, RefObject, SetStateAction } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import type { Task } from "@/lib/types";
import { DatePresetButton } from "../DatePresetButton";
import {
  formatDueDateQuick,
  getNextWeek,
  getToday,
  getTomorrow,
  isNextWeek,
  isToday,
  isTomorrow,
} from "../taskDialogUtils";
import type { TaskDialogFormData } from "./useTaskDialogState";

interface TaskDialogFormProps {
  formData: TaskDialogFormData;
  showDetails: boolean;
  setShowDetails: Dispatch<SetStateAction<boolean>>;
  minDate: Date | undefined;
  titleInputRef: RefObject<HTMLInputElement | null>;
  isLoading: boolean;
  submitButtonText: string;
  showProgressSlider: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onTitleKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onFormDataChange: <K extends keyof TaskDialogFormData>(
    field: K,
    value: TaskDialogFormData[K]
  ) => void;
  onDateChange: (date: Date | undefined) => void;
  onCancel: () => void;
}

export function TaskDialogForm({
  formData,
  showDetails,
  setShowDetails,
  minDate,
  titleInputRef,
  isLoading,
  submitButtonText,
  showProgressSlider,
  onSubmit,
  onTitleKeyDown,
  onFormDataChange,
  onDateChange,
  onCancel,
}: TaskDialogFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          ref={titleInputRef}
          id="title"
          value={formData.title}
          onChange={(event) => onFormDataChange("title", event.target.value)}
          onKeyDown={onTitleKeyDown}
          placeholder="What needs to be done?"
          maxLength={200}
          required
        />
      </div>

      <div className="space-y-3">
        <Label>Due Date</Label>
        <div className="grid grid-cols-4 gap-2">
          <DatePresetButton
            label="Today"
            isActive={!!(formData.dueDate && isToday(formData.dueDate))}
            onClick={() => onDateChange(getToday())}
          />
          <DatePresetButton
            label="Tomorrow"
            isActive={!!(formData.dueDate && isTomorrow(formData.dueDate))}
            onClick={() => onDateChange(getTomorrow())}
          />
          <DatePresetButton
            label="Next Week"
            isActive={!!(formData.dueDate && isNextWeek(formData.dueDate))}
            onClick={() => onDateChange(getNextWeek())}
          />
          <DatePresetButton
            label="No Date"
            isActive={!formData.dueDate}
            onClick={() => onDateChange(undefined)}
          />
        </div>
        {formData.dueDate && (
          <div className="text-xs text-muted text-center">
            Due {formatDueDateQuick(formData.dueDate)}
          </div>
        )}
      </div>

      <div className="pt-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
          className="w-full justify-center"
        >
          {showDetails ? "Hide Details" : "Show Details"}
          <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${showDetails ? "rotate-180" : ""}`} />
        </Button>
      </div>

      {showDetails && (
        <div className="space-y-4 pt-4 border-t border-border">
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(event) => onFormDataChange("description", event.target.value)}
              placeholder="Add more details..."
              rows={3}
              maxLength={500}
            />
            <div className="text-xs text-muted text-right">
              {formData.description.length}/500
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={formData.priority}
              onValueChange={(value: Task["priority"]) => onFormDataChange("priority", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(event) => onFormDataChange("tags", event.target.value)}
              placeholder="work, urgent, design..."
            />
            <div className="text-xs text-muted">Separate tags with commas</div>
          </div>

          {showProgressSlider && (
            <div className="space-y-2">
              <Label htmlFor="progress">Progress</Label>
              <div className="px-3">
                <Slider
                  id="progress"
                  min={0}
                  max={100}
                  step={5}
                  value={[formData.progress]}
                  onValueChange={(value: number[]) => onFormDataChange("progress", value[0])}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted mt-1">
                  <span>0%</span>
                  <span className="font-medium">{formData.progress}%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Custom Date & Time</Label>
            <DateTimePicker
              value={formData.dueDate}
              onChange={onDateChange}
              placeholder="Pick specific date and time"
              minDate={minDate}
            />
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || !formData.title.trim()}>
          {submitButtonText}
        </Button>
      </div>
    </form>
  );
}
