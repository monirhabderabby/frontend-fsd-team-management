import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button.jsx"
import { Calendar } from "@/components/ui/calendar.jsx"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover.jsx"
import { Input } from "@/components/ui/input.jsx"

export function DateTimePicker({ date, setDate, placeholder = "Pick date & time", className }) {
  const selectedDate = date ? new Date(date) : undefined;
  
  const handleTimeChange = (e) => {
    const time = e.target.value; // HH:mm
    if (!time || !selectedDate) return;
    
    const [hours, minutes] = time.split(":").map(Number);
    const newDate = new Date(selectedDate);
    newDate.setHours(hours);
    newDate.setMinutes(minutes);
    setDate(newDate.toISOString());
  };

  const handleDateSelect = (d) => {
    if (!d) return;
    const newDate = new Date(d);
    if (selectedDate) {
      newDate.setHours(selectedDate.getHours());
      newDate.setMinutes(selectedDate.getMinutes());
    } else {
      newDate.setHours(12); // Default to noon
      newDate.setMinutes(0);
    }
    setDate(newDate.toISOString());
  };

  const timeValue = selectedDate 
    ? `${String(selectedDate.getHours()).padStart(2, "0")}:${String(selectedDate.getMinutes()).padStart(2, "0")}`
    : "";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-medium rounded-xl h-9 border-slate-200 hover:border-emerald-300 transition-all",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
          {date ? format(selectedDate, "PPP p") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4 rounded-2xl shadow-2xl border-slate-100 flex flex-col gap-4" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          initialFocus
          className="rounded-xl border border-slate-100 shadow-sm"
        />
        <div className="flex items-center gap-3 px-1 pt-2 border-t border-slate-100">
           <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-wider">
             <Clock size={14} /> Time
           </div>
           <Input 
             type="time" 
             value={timeValue} 
             onChange={handleTimeChange}
             className="h-9 rounded-xl border-slate-200 focus:ring-emerald-500/10"
           />
        </div>
      </PopoverContent>
    </Popover>
  )
}
