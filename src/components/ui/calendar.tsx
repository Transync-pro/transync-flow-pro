
import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, SelectSingleEventHandler, MonthChangeEventHandler } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  // For month/year navigation dropdowns
  const [currentMonth, setCurrentMonth] = React.useState<Date>(props.defaultMonth || new Date());
  
  // Generate array of months for dropdown
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  // Generate array of years (current year - 10 to current year + 5)
  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: 16 }, 
    (_, i) => (currentYear - 10 + i).toString()
  );

  // Handle month change from the dropdown
  const handleMonthChange = (monthValue: string) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(months.indexOf(monthValue));
    setCurrentMonth(newMonth);
    
    if (props.onMonthChange) {
      props.onMonthChange(newMonth);
    }
  };

  // Handle year change from the dropdown
  const handleYearChange = (yearValue: string) => {
    const newMonth = new Date(currentMonth);
    newMonth.setFullYear(parseInt(yearValue));
    setCurrentMonth(newMonth);
    
    if (props.onMonthChange) {
      props.onMonthChange(newMonth);
    }
  };
  
  // Handle month navigation
  const handleMonthNav: MonthChangeEventHandler = (month) => {
    setCurrentMonth(month);
    
    if (props.onMonthChange) {
      props.onMonthChange(month);
    }
  };

  // Custom caption component with dropdowns
  const CustomCaption = ({ displayMonth }: { displayMonth: Date }) => {
    const month = months[displayMonth.getMonth()];
    const year = displayMonth.getFullYear().toString();
    
    return (
      <div className="flex justify-center items-center space-x-2 pt-1">
        {/* Month selection */}
        <Select value={month} onValueChange={handleMonthChange}>
          <SelectTrigger className="h-7 w-[100px] text-xs font-medium">
            <SelectValue>{month}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {months.map((m) => (
              <SelectItem key={m} value={m} className="text-xs">
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Year selection */}
        <Select value={year} onValueChange={handleYearChange}>
          <SelectTrigger className="h-7 w-[70px] text-xs font-medium">
            <SelectValue>{year}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={y} className="text-xs">
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

  return (
    <DayPicker
      month={currentMonth}
      onMonthChange={handleMonthNav}
      showOutsideDays={showOutsideDays}
      className={cn("p-3 pointer-events-auto", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "hidden", // Hide the original caption label
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
        Caption: ({ displayMonth }) => <CustomCaption displayMonth={displayMonth} />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
