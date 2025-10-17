'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { generateReport } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BarChartBig, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { DailySummary } from '@/lib/types';

const initialState = {};

function GenerateButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Generating...' : 'Generate Report'}
      {!pending && <BarChartBig className="ml-2 h-4 w-4" />}
    </Button>
  );
}

export default function ReportsView() {
  const [state, formAction] = useFormState(generateReport, initialState);
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(new Date().setDate(new Date().getDate() - 7))
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-4">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={'outline'}
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !startDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, 'PPP') : <span>Start date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={'outline'}
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !endDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, 'PPP') : <span>End date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <input type="hidden" name="startDate" value={startDate?.toISOString()} />
        <input type="hidden" name="endDate" value={endDate?.toISOString()} />
        <GenerateButton />
      </form>

      {state?.error && (
        <p className="text-sm font-medium text-destructive">{state.error}</p>
      )}
      {state?.message && (
        <p className="text-sm text-muted-foreground">{state.message}</p>
      )}

      {state?.summaries && (
        <Card>
          <CardHeader>
            <CardTitle>Report Summary</CardTitle>
            <CardDescription>
              {startDate && endDate
                ? `From ${format(startDate, 'PPP')} to ${format(endDate, 'PPP')}`
                : 'Summary of the selected period'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {state.summaries.map((summary: DailySummary) => (
                  <TableRow key={summary.date}>
                    <TableCell>
                      {format(new Date(summary.date + 'T00:00:00'), 'MMM d, yy')}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'text-right font-semibold',
                        summary.profit >= 0 ? 'text-green-600' : 'text-red-600'
                      )}
                    >
                      {summary.profit < 0 && '-'}$
                      {Math.abs(summary.profit).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
