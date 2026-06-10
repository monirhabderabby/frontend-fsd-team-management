/* eslint-disable no-unused-vars */
import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button.jsx"
import { Calendar } from "@/components/ui/calendar.jsx"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover.jsx"

export function DatePicker({ date, setDate, placeholder = "Pick a date", className }) {
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
          {date ? format(new Date(date), "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 rounded-2xl shadow-2xl border-slate-100" align="start">
        <Calendar
          mode="single"
          selected={date ? new Date(date) : undefined}
          onSelect={(d) => setDate(d ? d.toISOString() : "")}
          initialFocus
          className="rounded-2xl"
        />
      </PopoverContent>
    </Popover>
  )
}
