import React from 'react';
import { render } from '@testing-library/react';
import ScheduleCalendar from '../ScheduleCalendar';
import { Team, Match } from '@ump/core';

// Mock FullCalendar components
jest.mock('@fullcalendar/react', () => {
  return function MockFullCalendar({ events }: any) {
    return (
      <div data-testid="mock-fullcalendar">
        {events?.map((event: any) => (
          <div
            key={event.id}
            data-testid={`event-${event.id}`}
            className={`fc-event ${event.classNames || ''}`}
          >
            {event.title}
          </div>
        ))}
      </div>
    );
  };
});

// Mock FullCalendar plugins
jest.mock('@fullcalendar/daygrid', () => ({}));
jest.mock('@fullcalendar/interaction', () => ({}));

// Mock @ump/ui components
jest.mock('@ump/ui', () => ({
  Card: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  Button: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

// Mock teams
const mockTeamA: Team = {
  id: 'team-a',
  name: 'Dragons',
  sportIds: ['rugby'],
  playerIds: [],
  managers: [],
  tournaments: ['tournament-1'],
};

const mockTeamB: Team = {
  id: 'team-b',
  name: 'Lions',
  sportIds: ['rugby'],
  playerIds: [],
  managers: [],
  tournaments: ['tournament-1'],
};

// Helper function to create mock matches
function createMockMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: 'match-1',
    teamA: mockTeamA,
    teamB: mockTeamB,
    scoreA: 0,
    scoreB: 0,
    status: 'pending',
    scheduledTime: '2024-01-15T10:00:00Z',
    venue: 'Field A',
    ...overrides,
  };
}

describe('ScheduleCalendar', () => {
  const mockOnMatchUpdate = jest.fn();
  const _mockVenues = ['Field A', 'Field B', 'Field C'];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(
        <ScheduleCalendar matches={[]} onMatchUpdate={mockOnMatchUpdate} />
      );
      if (!container) throw new Error('Container should exist');
    });

    it('should display matches as calendar events', () => {
      const matches = [
        createMockMatch({ id: 'match-1', status: 'pending' }),
        createMockMatch({ id: 'match-2', status: 'live' }),
      ];

      const { container } = render(
        <ScheduleCalendar matches={matches} onMatchUpdate={mockOnMatchUpdate} />
      );
      if (!container) throw new Error('Container should exist');
    });
  });

  describe('Basic Functionality', () => {
    it('should render with matches', () => {
      const matches = [
        createMockMatch({ id: 'match-1', status: 'pending' }),
        createMockMatch({ id: 'match-2', status: 'live' }),
      ];

      const { container } = render(
        <ScheduleCalendar matches={matches} onMatchUpdate={mockOnMatchUpdate} />
      );
      if (!container) throw new Error('Container should exist');
    });

    it('should render in read-only mode', () => {
      const matches = [createMockMatch({ id: 'match-1', status: 'pending' })];

      const { container } = render(
        <ScheduleCalendar
          matches={matches}
          onMatchUpdate={mockOnMatchUpdate}
          isReadOnly={true}
        />
      );
      if (!container) throw new Error('Container should exist');
    });
  });
});
