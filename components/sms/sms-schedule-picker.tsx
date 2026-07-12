"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDays,
  addHours,
  endOfWeek,
  addMonths,
  endOfMonth,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  isToday,
  setHours,
  setMinutes,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import {
  combineDateAndTime,
  isFutureSchedule,
  roundUpToNextQuarterHour,
  toDatetimeLocalValue,
} from "@/lib/sms/schedule-datetime";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Send,
  X,
} from "lucide-react";

type DeliveryMode = "now" | "schedule";

type SmsSchedulePickerProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function buildCalendarDays(viewMonth: Date) {
  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);

  const days: Date[] = [];
  let cursor = gridStart;
  while (cursor <= gridEnd) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return days;
}

function defaultScheduleParts() {
  const base = roundUpToNextQuarterHour(addHours(new Date(), 1));
  return {
    date: startOfDay(base),
    hour: base.getHours(),
    minute: base.getMinutes(),
  };
}

export function SmsSchedulePicker({ value, onChange, disabled }: SmsSchedulePickerProps) {
  const scheduled = isFutureSchedule(value);
  const [mode, setMode] = useState<DeliveryMode>(scheduled ? "schedule" : "now");
  const [viewMonth, setViewMonth] = useState(() => {
    const parsed = value ? new Date(value) : roundUpToNextQuarterHour(addHours(new Date(), 1));
    return startOfMonth(parsed);
  });
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    if (scheduled && value) return startOfDay(new Date(value));
    return defaultScheduleParts().date;
  });
  const [hour, setHour] = useState(() => {
    if (scheduled && value) return new Date(value).getHours();
    return defaultScheduleParts().hour;
  });
  const [minute, setMinute] = useState(() => {
    if (scheduled && value) return new Date(value).getMinutes();
    return defaultScheduleParts().minute;
  });

  const today = startOfDay(new Date());
  const calendarDays = useMemo(() => buildCalendarDays(viewMonth), [viewMonth]);

  const composed = useMemo(
    () => combineDateAndTime(selectedDate, hour, minute),
    [selectedDate, hour, minute],
  );

  const composedValue = useMemo(() => toDatetimeLocalValue(composed), [composed]);
  const composedIsFuture = composed > new Date();

  useEffect(() => {
    if (mode === "schedule" && composedIsFuture) {
      if (value !== composedValue) onChange(composedValue);
    } else if (mode === "now" && value) {
      onChange("");
    }
  }, [mode, composedValue, composedIsFuture, value, onChange]);

  function switchToNow() {
    setMode("now");
    onChange("");
  }

  function switchToSchedule() {
    setMode("schedule");
    const parts = defaultScheduleParts();
    setSelectedDate(parts.date);
    setHour(parts.hour);
    setMinute(parts.minute);
    setViewMonth(startOfMonth(parts.date));
    onChange(toDatetimeLocalValue(combineDateAndTime(parts.date, parts.hour, parts.minute)));
  }

  function applyPreset(date: Date) {
    setMode("schedule");
    setSelectedDate(startOfDay(date));
    setHour(date.getHours());
    setMinute(date.getMinutes());
    setViewMonth(startOfMonth(date));
    onChange(toDatetimeLocalValue(date));
  }

  function cancelSchedule() {
    switchToNow();
  }

  const presets = useMemo(() => {
    const inOneHour = roundUpToNextQuarterHour(addHours(new Date(), 1));
    const tomorrowMorning = setMinutes(setHours(addDays(today, 1), 9), 0);
    const nextWeekMorning = setMinutes(setHours(addDays(today, 7), 9), 0);
    return [
      { label: "In 1 hour", date: inOneHour },
      { label: "Tomorrow 9 AM", date: tomorrowMorning },
      { label: "Next week 9 AM", date: nextWeekMorning },
    ];
  }, [today]);

  const hourOptions = Array.from({ length: 24 }, (_, i) => i);
  const minuteOptions = [0, 15, 30, 45];

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 sm:p-5 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Clock3 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <Label className="text-sm font-semibold">Delivery timing</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Send immediately or pick a future date and time.
            </p>
          </div>
        </div>

        <div
          className="inline-flex rounded-lg border border-border/70 bg-muted/40 p-0.5 self-start sm:self-auto"
          role="tablist"
          aria-label="Delivery timing"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === "now"}
            disabled={disabled}
            onClick={switchToNow}
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all",
              mode === "now"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Send className="h-3 w-3" />
            Send now
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "schedule"}
            disabled={disabled}
            onClick={switchToSchedule}
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all",
              mode === "schedule"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <CalendarDays className="h-3 w-3" />
            Schedule
          </button>
        </div>
      </div>

      {mode === "schedule" ? (
        <div className="rounded-xl border border-primary/15 bg-gradient-to-br from-primary/[0.04] to-transparent p-4 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <Button
                key={preset.label}
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                className="h-8 rounded-full bg-background/80"
                onClick={() => applyPreset(preset.date)}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
            <div className="rounded-xl border border-border/60 bg-background/90 p-3 sm:p-4">
              <div className="flex items-center justify-between gap-2 mb-3">
                <p className="text-sm font-semibold">{format(viewMonth, "MMMM yyyy")}</p>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={disabled}
                    aria-label="Previous month"
                    onClick={() => setViewMonth((m) => subMonths(m, 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={disabled}
                    aria-label="Next month"
                    onClick={() => setViewMonth((m) => addMonths(m, 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-1">
                {WEEKDAYS.map((day) => (
                  <div
                    key={day}
                    className="text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground py-1"
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day) => {
                  const inMonth = isSameMonth(day, viewMonth);
                  const disabledDay = isBefore(day, today);
                  const selected = isSameDay(day, selectedDate);
                  const todayMark = isToday(day);

                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      disabled={disabled || disabledDay}
                      onClick={() => setSelectedDate(startOfDay(day))}
                      className={cn(
                        "relative h-9 rounded-lg text-sm font-medium transition-all",
                        !inMonth && "text-muted-foreground/45",
                        disabledDay && "opacity-35 cursor-not-allowed",
                        selected
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "hover:bg-muted/80",
                        todayMark && !selected && "ring-1 ring-primary/30",
                      )}
                    >
                      {format(day, "d")}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-border/60 bg-background/90 p-3 sm:p-4 space-y-3">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Time
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="schedule-hour" className="text-[11px] text-muted-foreground">
                      Hour
                    </Label>
                    <select
                      id="schedule-hour"
                      value={hour}
                      disabled={disabled}
                      onChange={(e) => setHour(Number(e.target.value))}
                      className="mt-1 flex h-10 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                    >
                      {hourOptions.map((h) => (
                        <option key={h} value={h}>
                          {format(setHours(new Date(), h), "h a")}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="schedule-minute" className="text-[11px] text-muted-foreground">
                      Minute
                    </Label>
                    <select
                      id="schedule-minute"
                      value={minute}
                      disabled={disabled}
                      onChange={(e) => setMinute(Number(e.target.value))}
                      className="mt-1 flex h-10 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                    >
                      {minuteOptions.map((m) => (
                        <option key={m} value={m}>
                          {String(m).padStart(2, "0")}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border/60 bg-background/90 p-3 sm:p-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Selected
                </p>
                <p className="text-sm font-semibold leading-snug">
                  {format(composed, "EEE, MMM d · h:mm a")}
                </p>
                {!composedIsFuture ? (
                  <p className="text-xs text-destructive">Choose a future date and time.</p>
                ) : (
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                    Credits charged at send time
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between pt-1">
            <p className="text-xs text-muted-foreground">
              You can pause or cancel scheduled sends from Campaigns.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={cancelSchedule}
              className="gap-1.5 self-start sm:self-auto"
            >
              <X className="h-3.5 w-3.5" />
              Cancel schedule
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
          <Send className="h-4 w-4 shrink-0 text-primary" />
          Messages will be sent as soon as you submit.
        </div>
      )}

      <input type="hidden" name="scheduledAt" value={mode === "schedule" && composedIsFuture ? composedValue : ""} />
    </div>
  );
}

export { isFutureSchedule as isSmsScheduledForLater };
