'use client'

import * as React from 'react'

import { Calendar } from '@/components/ui/calendar'

export const BookamrkCalendar = () => {
    const [date, setDate] = React.useState<Date | undefined>(new Date())

    return (
        <Calendar
            mode="single"
            selected={date}
            modifiers={{
                booked: [new Date('2025-3-10'), new Date('2025-3-16'), new Date()],
            }}
            onSelect={setDate}
            modifiersClassNames={{
                booked: 'bg-blue-200',
            }}
            className="rounded-md border shadow"
        />
    )
}

export default BookamrkCalendar
