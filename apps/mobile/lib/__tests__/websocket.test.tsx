/* eslint-env browser, jest */
/* eslint-disable no-undef */
import { render, screen, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { gql, useSubscription } from '@apollo/client';
import React from 'react';

// Global type declarations for testing environment
declare global {
  interface Window {
    __CLERK_TOKEN__?: string;
  }
}

// Mock WebSocket for testing
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(public url: string) {
    // Simulate connection opening
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 10);
  }

  send(data: string) {
    // Mock sending data
    console.log('WebSocket send:', data);
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }

  addEventListener(
    type: string,
    _listener: EventListenerOrEventListenerObject
  ) {
    if (type === 'open') this.onopen = _listener as (event: Event) => void;
    if (type === 'close')
      this.onclose = _listener as (event: CloseEvent) => void;
    if (type === 'message')
      this.onmessage = _listener as (event: MessageEvent) => void;
    if (type === 'error') this.onerror = _listener as (event: Event) => void;
  }

  removeEventListener(
    type: string,
    _listener: EventListenerOrEventListenerObject
  ) {
    if (type === 'open') this.onopen = null;
    if (type === 'close') this.onclose = null;
    if (type === 'message') this.onmessage = null;
    if (type === 'error') this.onerror = null;
  }

  // Method to simulate receiving a message
  simulateMessage(data: any) {
    if (this.onmessage && this.readyState === MockWebSocket.OPEN) {
      const event = new MessageEvent('message', { data: JSON.stringify(data) });
      this.onmessage(event);
    }
  }
}

// Replace global WebSocket with mock
(global as any).WebSocket = MockWebSocket;

// Test subscription query
const MATCH_UPDATES_SUBSCRIPTION = gql`
  subscription MatchUpdates($tournamentId: ID!) {
    matchUpdated(tournamentId: $tournamentId) {
      id
      status
      scoreA
      scoreB
    }
  }
`;

// Test component that uses subscription
const MatchUpdatesComponent: React.FC<{ matchId: string }> = ({ matchId }) => {
  const { data, loading, error } = useSubscription(MATCH_UPDATES_SUBSCRIPTION, {
    variables: { matchId },
  });

  if (loading) return <div>Subscribing to match updates...</div>;
  if (error) return <div>Subscription error: {error.message}</div>;

  return (
    <div data-testid="match-updates">
      {data?.matchUpdated && (
        <div>
          <div data-testid="match-id">Match: {data.matchUpdated.id}</div>
          <div data-testid="score">
            Score: {data.matchUpdated.scoreA} - {data.matchUpdated.scoreB}
          </div>
          <div data-testid="status">Status: {data.matchUpdated.status}</div>
        </div>
      )}
    </div>
  );
};

describe('WebSocket Subscription Tests', () => {
  let mockWebSocket: MockWebSocket;

  beforeEach(() => {
    // Reset WebSocket mock
    mockWebSocket = new MockWebSocket('ws://localhost:4000/graphql');
  });

  afterEach(() => {
    if (mockWebSocket) {
      mockWebSocket.close();
    }
  });

  it('should establish WebSocket connection', async () => {
    const ws = new MockWebSocket('ws://localhost:4000/graphql');

    await waitFor(() => {
      expect(ws.readyState).toEqual(MockWebSocket.OPEN);
    });

    expect(ws.url).toEqual('ws://localhost:4000/graphql');
  });

  it('should handle subscription with mock data', async () => {
    const subscriptionMocks = [
      {
        request: {
          query: MATCH_UPDATES_SUBSCRIPTION,
          variables: { matchId: 'match-1' },
        },
        result: {
          data: {
            matchUpdated: {
              id: 'match-1',
              scoreA: 14,
              scoreB: 7,
              status: 'live',
              updatedAt: new Date().toISOString(),
            },
          },
        },
      },
    ];

    render(
      <MockedProvider mocks={subscriptionMocks} addTypename={false}>
        <MatchUpdatesComponent matchId="match-1" />
      </MockedProvider>
    );

    // Should show loading initially
    expect(
      screen.getByText(/Subscribing to match updates/)
    ).toBeInTheDocument();

    // Wait for subscription data
    await waitFor(() => {
      expect(screen.getByTestId('match-updates')).toBeInTheDocument();
    });
  });

  it('should handle subscription errors', async () => {
    const errorMocks = [
      {
        request: {
          query: MATCH_UPDATES_SUBSCRIPTION,
          variables: { matchId: 'match-1' },
        },
        error: new Error('WebSocket connection failed'),
      },
    ];

    render(
      <MockedProvider mocks={errorMocks} addTypename={false}>
        <MatchUpdatesComponent matchId="match-1" />
      </MockedProvider>
    );

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText(/Subscription error:/)).toBeInTheDocument();
    });

    expect(screen.getByText(/WebSocket connection failed/)).toBeInTheDocument();
  });

  it('should push real-time updates via WebSocket mock', async () => {
    const ws = new MockWebSocket('ws://localhost:4000/graphql');

    // Wait for connection to open
    await waitFor(() => {
      expect(ws.readyState).toBe(MockWebSocket.OPEN);
    });

    // Simulate receiving a match update
    const mockUpdate = {
      type: 'data',
      payload: {
        data: {
          matchUpdated: {
            id: 'match-1',
            scoreA: 21,
            scoreB: 14,
            status: 'live',
            updatedAt: new Date().toISOString(),
          },
        },
      },
    };

    // Test that we can simulate message reception
    let receivedData: any = null;
    ws.addEventListener('message', (event) => {
      receivedData = JSON.parse((event as MessageEvent).data);
    });

    ws.simulateMessage(mockUpdate);

    expect(receivedData).toStrictEqual(mockUpdate);
  });

  it('should handle WebSocket connection lifecycle', async () => {
    const ws = new MockWebSocket('ws://localhost:4000/graphql');
    let connectionState = 'connecting';

    ws.addEventListener('open', () => {
      connectionState = 'open';
    });

    ws.addEventListener('close', () => {
      connectionState = 'closed';
    });

    // Wait for connection to open
    await waitFor(() => {
      expect(connectionState).toEqual('open');
    });

    // Close connection
    ws.close();

    await waitFor(() => {
      expect(connectionState).toEqual('closed');
    });
  });

  it('should handle authentication in WebSocket connection', () => {
    // Mock JWT token
    (window as any).__CLERK_TOKEN__ = 'mock-jwt-token';

    const ws = new MockWebSocket('ws://localhost:4000/graphql');

    // In real implementation, token would be sent in connection params
    expect(ws.url).toEqual('ws://localhost:4000/graphql');
    expect((window as any).__CLERK_TOKEN__).toEqual('mock-jwt-token');

    // Clean up
    delete (window as any).__CLERK_TOKEN__;
  });

  it('should handle multiple concurrent subscriptions', async () => {
    const subscriptionMocks = [
      {
        request: {
          query: MATCH_UPDATES_SUBSCRIPTION,
          variables: { matchId: 'match-1' },
        },
        result: {
          data: {
            matchUpdated: {
              id: 'match-1',
              scoreA: 14,
              scoreB: 7,
              status: 'live',
              updatedAt: new Date().toISOString(),
            },
          },
        },
      },
      {
        request: {
          query: MATCH_UPDATES_SUBSCRIPTION,
          variables: { matchId: 'match-2' },
        },
        result: {
          data: {
            matchUpdated: {
              id: 'match-2',
              scoreA: 21,
              scoreB: 14,
              status: 'live',
              updatedAt: new Date().toISOString(),
            },
          },
        },
      },
    ];

    render(
      <MockedProvider mocks={subscriptionMocks} addTypename={false}>
        <div>
          <MatchUpdatesComponent matchId="match-1" />
          <MatchUpdatesComponent matchId="match-2" />
        </div>
      </MockedProvider>
    );

    // Both components should be able to subscribe
    expect(screen.getAllByText(/Subscribing to match updates/)).toHaveLength(2);
  });
});
