import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarIcon, Clock, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, subDays, subWeeks, subMonths, subYears, startOfDay, endOfDay } from "date-fns";

export type TimeRange = {
  from: Date;
  to: Date;
  label: string;
  key: string;
};

interface TimeRangeFilterProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
  className?: string;
}

const presetRanges: TimeRange[] = [
  {
    key: 'today',
    label: 'Today',
    from: startOfDay(new Date()),
    to: endOfDay(new Date())
  },
  {
    key: 'yesterday',
    label: 'Yesterday',
    from: startOfDay(subDays(new Date(), 1)),
    to: endOfDay(subDays(new Date(), 1))
  },
  {
    key: 'last7days',
    label: 'Last 7 days',
    from: startOfDay(subDays(new Date(), 6)),
    to: endOfDay(new Date())
  },
  {
    key: 'last30days', 
    label: 'Last 30 days',
    from: startOfDay(subDays(new Date(), 29)),
    to: endOfDay(new Date())
  },
  {
    key: 'thisweek',
    label: 'This week',
    from: startOfDay(subDays(new Date(), new Date().getDay())),
    to: endOfDay(new Date())
  },
  {
    key: 'lastweek',
    label: 'Last week',
    from: startOfDay(subWeeks(subDays(new Date(), new Date().getDay()), 1)),
    to: endOfDay(subDays(subDays(new Date(), new Date().getDay()), 1))
  },
  {
    key: 'thismonth',
    label: 'This month', 
    from: startOfDay(new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
    to: endOfDay(new Date())
  },
  {
    key: 'lastmonth',
    label: 'Last month',
    from: startOfDay(subMonths(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 1)),
    to: endOfDay(new Date(new Date().getFullYear(), new Date().getMonth(), 0))
  },
  {
    key: 'thisyear',
    label: 'This year',
    from: startOfDay(new Date(new Date().getFullYear(), 0, 1)),
    to: endOfDay(new Date())
  },
  {
    key: 'lastyear',
    label: 'Last year',
    from: startOfDay(new Date(new Date().getFullYear() - 1, 0, 1)),
    to: endOfDay(new Date(new Date().getFullYear() - 1, 11, 31))
  }
];

export default function TimeRangeFilter({ value, onChange, className }: TimeRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState<Date>();
  const [customTo, setCustomTo] = useState<Date>();
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');

  const handlePresetSelect = (preset: TimeRange) => {
    onChange(preset);
    setIsOpen(false);
  };

  const handleCustomApply = () => {
    if (customFrom && customTo) {
      const customRange: TimeRange = {
        key: 'custom',
        label: `${format(customFrom, 'MMM d')} - ${format(customTo, 'MMM d')}`,
        from: startOfDay(customFrom),
        to: endOfDay(customTo)
      };
      onChange(customRange);
      setIsOpen(false);
    }
  };

  const formatRangeDisplay = (range: TimeRange) => {
    const { from, to } = range;
    
    // If it's a preset, use the label
    if (range.key !== 'custom') {
      return range.label;
    }
    
    // For custom ranges, format the dates
    if (format(from, 'yyyy') === format(to, 'yyyy')) {
      if (format(from, 'MM') === format(to, 'MM')) {
        return `${format(from, 'MMM d')} - ${format(to, 'd, yyyy')}`;
      }
      return `${format(from, 'MMM d')} - ${format(to, 'MMM d, yyyy')}`;
    }
    return `${format(from, 'MMM d, yyyy')} - ${format(to, 'MMM d, yyyy')}`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className={cn(
            "justify-start text-left font-normal bg-white border-gray-200 hover:bg-gray-50",
            !value && "text-muted-foreground",
            className
          )}
        >
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-gray-500" />
            <span className="hidden sm:inline">{formatRangeDisplay(value)}</span>
            <span className="sm:hidden">{value.label}</span>
          </div>
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0 bg-white border border-gray-200 shadow-lg" align="start">
        <Card className="border-0 shadow-none">
          <CardContent className="p-0">
            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              <Button
                variant="ghost"
                className={cn(
                  "flex-1 rounded-none border-b-2 border-transparent py-3",
                  activeTab === 'presets' && "border-blue-500 bg-blue-50 text-blue-600"
                )}
                onClick={() => setActiveTab('presets')}
              >
                <Clock className="h-4 w-4 mr-2" />
                Quick Select
              </Button>
              <Button
                variant="ghost"
                className={cn(
                  "flex-1 rounded-none border-b-2 border-transparent py-3",
                  activeTab === 'custom' && "border-blue-500 bg-blue-50 text-blue-600"
                )}
                onClick={() => setActiveTab('custom')}
              >
                <Filter className="h-4 w-4 mr-2" />
                Custom Range
              </Button>
            </div>

            {/* Presets Tab */}
            {activeTab === 'presets' && (
              <div className="p-4">
                <div className="grid grid-cols-2 gap-2">
                  {presetRanges.map((preset) => (
                    <Button
                      key={preset.key}
                      variant="ghost"
                      className={cn(
                        "justify-start h-auto p-3 text-left hover:bg-gray-100",
                        value.key === preset.key && "bg-blue-50 text-blue-600 border border-blue-200"
                      )}
                      onClick={() => handlePresetSelect(preset)}
                    >
                      <div>
                        <div className="font-medium text-sm">{preset.label}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {format(preset.from, preset.from.getFullYear() === preset.to.getFullYear() ? 'MMM d' : 'MMM d, yyyy')} - {format(preset.to, 'MMM d')}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Tab */}
            {activeTab === 'custom' && (
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">From Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !customFrom && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {customFrom ? format(customFrom, "MMM d, yyyy") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={customFrom}
                          onSelect={setCustomFrom}
                          disabled={(date) => date > new Date() || (customTo ? date > customTo : false)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">To Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !customTo && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {customTo ? format(customTo, "MMM d, yyyy") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={customTo}
                          onSelect={setCustomTo}
                          disabled={(date) => date > new Date() || (customFrom ? date < customFrom : false)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCustomFrom(undefined);
                      setCustomTo(undefined);
                    }}
                    className="flex-1"
                  >
                    Clear
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCustomApply}
                    disabled={!customFrom || !customTo}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    Apply
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}