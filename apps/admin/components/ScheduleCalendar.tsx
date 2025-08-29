'use client';

import React, { useState, useCallback, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import type {
  EventInput,
  EventDropArg,
  EventClickArg,
} from '@fullcalendar/core';
import { Card, CardHeader, CardTitle, CardContent } from '@ump/ui';
import type { Match, MatchStatus } from '@ump/core';

export interface ScheduleCalendarProps {
  matches: Match[];
  onMatchUpdate: (matchId: string, updates: Partial<Match>) => Promise<void>;
  onMatchClick?: (match: Match) => void;
  venues?: string[];
  isReadOnly?: boolean;
  className?: string;
}

interface CalendarEvent extends EventInput {
  id: string;
  title: string;
  start: string;
  end?: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps: {
    match: Match;
    isLocked: boolean;
  };
}

// Status color mapping for visual distinction
const STATUS_COLORS: Record<
  MatchStatus,
  { bg: string; border: string; text: string }
> = {
  pending: { bg: '#f3f4f6', border: '#d1d5db', text: '#374151' },
  live: { bg: '#10b981', border: '#059669', text: '#ffffff' },
  final: { bg: '#3b82f6', border: '#2563eb', text: '#ffffff' },
  needs_approval: { bg: '#f59e0b', border: '#d97706', text: '#ffffff' },
};

export function ScheduleCalendar({
  matches,
  onMatchUpdate,
  onMatchClick,
  venues = [],
  isReadOnly = false,
  className = '',
}: ScheduleCalendarProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<string>('all');

  // Convert matches to FullCalendar events
  const calendarEvents = useMemo((): CalendarEvent[] => {
    return matches
      .filter((match) => {
        // Filter by venue if selected
        if (selectedVenue !== 'all' && match.venue !== selectedVenue) {
          return false;
        }
        // Only show matches with scheduled times
        return match.scheduledTime;
      })
      .map((match) => {
        const colors = STATUS_COLORS[match.status];
        const isLocked = match.status === 'live' || match.status === 'final';

        // Calculate end time (assume 90 minutes if not specified)
        const startTime = new Date(match.scheduledTime!);
        const endTime = new Date(startTime.getTime() + 90 * 60 * 1000);

        return {
          id: match.id,
          title: `${match.teamA.name} vs ${match.teamB.name}`,
          start: match.scheduledTime!,
          end: endTime.toISOString(),
          backgroundColor: colors.bg,
          borderColor: colors.border,
          textColor: colors.text,
          extendedProps: {
            match,
            isLocked,
          },
        };
      });
  }, [matches, selectedVenue]);

  // Handle event drop (drag-drop functionality)
  const handleEventDrop = useCallback(
    async (dropInfo: EventDropArg) => {
      const { event } = dropInfo;
      const match = event.extendedProps.match as Match;
      const isLocked = event.extendedProps.isLocked as boolean;

      // Prevent moving locked matches
      if (isLocked || isReadOnly) {
        dropInfo.revert();
        return;
      }

      setIsUpdating(true);

      try {
        // Update the match with new scheduled time
        await onMatchUpdate(match.id, {
          scheduledTime: event.start!.toISOString(),
        });
      } catch (error) {
        console.error('Failed to update match schedule:', error);
        dropInfo.revert();
      } finally {
        setIsUpdating(false);
      }
    },
    [onMatchUpdate, isReadOnly]
  );

  // Handle event click
  const handleEventClick = useCallback(
    (clickInfo: EventClickArg) => {
      const match = clickInfo.event.extendedProps.match as Match;
      onMatchClick?.(match);
    },
    [onMatchClick]
  );

  // Handle venue filter change
  const handleVenueChange = useCallback((venue: string) => {
    setSelectedVenue(venue);
  }, []);

  return (
    <Card className={`w-full ${className}`} data-testid="schedule-calendar">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Tournament Schedule</CardTitle>

          {/* Venue Filter */}
          {venues.length > 0 && (
            <div className="flex items-center gap-2">
              <label
                htmlFor="venue-filter"
                className="text-sm font-medium text-gray-700"
              >
                Venue:
              </label>
              <select
                id="venue-filter"
                value={selectedVenue}
                onChange={(e) => handleVenueChange(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Venues</option>
                {venues.map((venue) => (
                  <option key={venue} value={venue}>
                    {venue}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Status Legend */}
        <div className="flex items-center gap-4 text-xs">
          {Object.entries(STATUS_COLORS).map(([status, colors]) => (
            <div key={status} className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded border"
                style={{
                  backgroundColor: colors.bg,
                  borderColor: colors.border,
                }}
              />
              <span className="capitalize">{status.replace('_', ' ')}</span>
            </div>
          ))}
          <div className="flex items-center gap-1 ml-4">
            <span className="text-gray-500">🔒</span>
            <span>Locked (cannot move)</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isUpdating && (
          <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded-md text-blue-700 text-sm">
            Updating schedule...
          </div>
        )}

        <div className="calendar-container">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridWeek"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,dayGridWeek,dayGridDay',
            }}
            events={calendarEvents}
            editable={!isReadOnly}
            droppable={!isReadOnly}
            eventDrop={handleEventDrop}
            eventClick={handleEventClick}
            height="auto"
            eventDisplay="block"
            dayMaxEvents={3}
            moreLinkClick="popover"
            eventDidMount={(info) => {
              // Add lock icon for locked matches
              if (info.event.extendedProps.isLocked) {
                const lockIcon = document.createElement('span');
                lockIcon.innerHTML = ' 🔒';
                lockIcon.style.fontSize = '10px';
                info.el.appendChild(lockIcon);
              }

              // Add venue info to event
              const match = info.event.extendedProps.match as Match;
              if (match.venue) {
                const venueSpan = document.createElement('div');
                venueSpan.innerHTML = match.venue;
                venueSpan.style.fontSize = '10px';
                venueSpan.style.opacity = '0.8';
                info.el.appendChild(venueSpan);
              }
            }}
            eventClassNames={(arg) => {
              const isLocked = arg.event.extendedProps.isLocked;
              return isLocked ? 'locked-event' : 'draggable-event';
            }}
          />
        </div>

        {matches.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No matches scheduled yet.
          </div>
        )}

        {!isReadOnly && (
          <div className="mt-4 text-xs text-gray-600">
            💡 Tip: Drag and drop matches to reschedule them. Locked matches
            (live or completed) cannot be moved.
          </div>
        )}
      </CardContent>

      <style
        dangerouslySetInnerHTML={{
          __html: `
          .calendar-container .fc-event {
            cursor: pointer;
            border-radius: 4px;
            padding: 2px 4px;
            font-size: 12px;
            line-height: 1.2;
          }
          
          .calendar-container .locked-event {
            cursor: not-allowed;
            opacity: 0.8;
          }
          
          .calendar-container .draggable-event:hover {
            opacity: 0.9;
            transform: scale(1.02);
            transition: all 0.2s ease;
          }
          
          .calendar-container .fc-daygrid-event-harness {
            margin: 1px 0;
          }
          
          .calendar-container .fc-h-event {
            border-radius: 4px;
          }
        `,
        }}
      />
    </Card>
  );
}

export default ScheduleCalendar;
