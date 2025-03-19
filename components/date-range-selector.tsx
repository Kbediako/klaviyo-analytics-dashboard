import React from 'react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { DateRangeOption, useDateRange, CustomDateRange } from '../hooks';
import { CalendarIcon, ChevronDownIcon } from 'lucide-react';

/**
 * Date range options for the dropdown
 */
const DATE_RANGE_OPTIONS: { value: DateRangeOption; label: string }[] = [
  { value: 'last-7-days', label: 'Last 7 days' },
  { value: 'last-30-days', label: 'Last 30 days' },
  { value: 'last-90-days', label: 'Last 90 days' },
  { value: 'this-month', label: 'This month' },
  { value: 'last-month', label: 'Last month' },
  { value: 'this-year', label: 'This year' },
  { value: 'custom', label: 'Custom range' },
];

/**
 * Date range selector component
 * 
 * @returns React component
 */
export function DateRangeSelector() {
  const {
    selectedOption,
    dateRangeLabel,
    customDateRange,
    handleDateRangeChange,
    handleCustomDateRangeChange,
  } = useDateRange();
  
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
  
  // Handle custom date range selection
  const handleCustomDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    // If no start date is selected, set it
    if (!customDateRange.startDate) {
      handleCustomDateRangeChange({
        startDate: date,
        endDate: null,
      });
      return;
    }
    
    // If start date is already selected, set end date
    if (!customDateRange.endDate) {
      // Ensure end date is after start date
      if (date < customDateRange.startDate) {
        handleCustomDateRangeChange({
          startDate: date,
          endDate: customDateRange.startDate,
        });
      } else {
        handleCustomDateRangeChange({
          startDate: customDateRange.startDate,
          endDate: date,
        });
      }
      
      // Close the calendar after selecting end date
      setIsCalendarOpen(false);
    } else {
      // If both dates are already selected, start over
      handleCustomDateRangeChange({
        startDate: date,
        endDate: null,
      });
    }
  };
  
  return (
    <div className="flex items-center space-x-2">
      <Select
        value={selectedOption}
        onValueChange={(value) => handleDateRangeChange(value as DateRangeOption)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select date range" />
        </SelectTrigger>
        <SelectContent>
          {DATE_RANGE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {selectedOption === 'custom' ? (
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="ml-2">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {customDateRange.startDate && customDateRange.endDate
                ? `${customDateRange.startDate.toLocaleDateString()} - ${customDateRange.endDate.toLocaleDateString()}`
                : customDateRange.startDate
                ? `${customDateRange.startDate.toLocaleDateString()} - Select end date`
                : 'Select date range'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={{
                from: customDateRange.startDate || undefined,
                to: customDateRange.endDate || undefined,
              }}
              onSelect={(range) => {
                if (!range) return;
                handleCustomDateRangeChange({
                  startDate: range.from || null,
                  endDate: range.to || null,
                });
                if (range.from && range.to) {
                  setIsCalendarOpen(false);
                }
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      ) : (
        <div className="ml-2 text-sm text-muted-foreground">
          {dateRangeLabel}
        </div>
      )}
    </div>
  );
}
