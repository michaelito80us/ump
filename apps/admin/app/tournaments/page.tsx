'use client';

import { useState, useEffect } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Input,
} from '@ump/ui';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Trophy,
  Wifi,
} from 'lucide-react';
import Link from 'next/link';
import {
  useTournamentsSubscription,
  useRealtimeConnection,
} from '../../hooks/use-realtime';
import { ConnectionStatus } from '../../components/connection-status';

// Mock data for tournaments
const tournaments = [
  {
    id: '1',
    name: 'Spring Rugby Championship',
    sport: 'Rugby',
    status: 'Draft',
    startDate: '2024-04-15',
    endDate: '2024-04-17',
    teams: 16,
    location: 'Central Sports Complex',
  },
  {
    id: '2',
    name: 'Winter Soccer League',
    sport: 'Soccer',
    status: 'Active',
    startDate: '2024-03-01',
    endDate: '2024-05-30',
    teams: 24,
    location: 'City Stadium',
  },
  {
    id: '3',
    name: 'Basketball Tournament 2024',
    sport: 'Basketball',
    status: 'Completed',
    startDate: '2024-02-10',
    endDate: '2024-02-12',
    teams: 8,
    location: 'Sports Arena',
  },
  {
    id: '4',
    name: 'Tennis Open Championship',
    sport: 'Tennis',
    status: 'Scheduled',
    startDate: '2024-06-01',
    endDate: '2024-06-07',
    teams: 32,
    location: 'Tennis Club',
  },
];

function getStatusBadge(status: string) {
  switch (status) {
    case 'Active':
      return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    case 'Draft':
      return <Badge variant="outline">Draft</Badge>;
    case 'Completed':
      return <Badge variant="secondary">Completed</Badge>;
    case 'Scheduled':
      return <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function TournamentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [localTournaments, setLocalTournaments] = useState(tournaments);
  const { isConnected } = useRealtimeConnection();

  // Subscribe to real-time updates for all tournaments
  const tournamentIds = localTournaments.map((t) => t.id);
  const { tournamentsData, lastUpdate } =
    useTournamentsSubscription(tournamentIds);

  // Update local tournaments when real-time data changes
  useEffect(() => {
    if (lastUpdate && tournamentsData[lastUpdate.entityId]) {
      setLocalTournaments((prev) =>
        prev.map((tournament) => {
          if (tournament.id === lastUpdate.entityId) {
            const realtimeData = tournamentsData[lastUpdate.entityId];
            return {
              ...tournament,
              ...realtimeData,
              // Map real-time fields to local tournament structure
              name: realtimeData.name || tournament.name,
              status: realtimeData.status || tournament.status,
              startDate: realtimeData.startDate || tournament.startDate,
              endDate: realtimeData.endDate || tournament.endDate,
              teams: realtimeData.participantCount || tournament.teams,
            };
          }
          return tournament;
        })
      );
    }
  }, [lastUpdate, tournamentsData]);

  // Filter tournaments based on search term
  const filteredTournaments = localTournaments.filter(
    (tournament) =>
      tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tournament.sport.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tournament.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">Tournaments</h1>
              <ConnectionStatus compact />
            </div>
            <p className="text-gray-600">
              Manage and organize your tournaments
              {isConnected && (
                <span className="ml-2 text-green-600 text-sm">
                  • Live updates enabled
                </span>
              )}
            </p>
          </div>
          <Link href="/tournaments/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Tournament
            </Button>
          </Link>
        </div>

        {/* Search and Filter */}
        <div className="mb-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search tournaments..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
        </div>

        {/* Tournaments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTournaments.map((tournament) => {
            const hasRealtimeUpdate = tournamentsData[tournament.id];
            return (
              <Card
                key={tournament.id}
                className={`hover:shadow-lg transition-all duration-200 ${
                  hasRealtimeUpdate ? 'ring-2 ring-green-200 bg-green-50' : ''
                }`}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">
                          {tournament.name}
                        </CardTitle>
                        {hasRealtimeUpdate && (
                          <Wifi className="h-3 w-3 text-green-600" />
                        )}
                      </div>
                      <CardDescription>{tournament.sport}</CardDescription>
                    </div>
                    {getStatusBadge(tournament.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Start Date:</span>
                      <span>
                        {new Date(tournament.startDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>End Date:</span>
                      <span>
                        {new Date(tournament.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Teams:</span>
                      <span>{tournament.teams}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Location:</span>
                      <span className="text-right">{tournament.location}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="mr-1 h-3 w-3" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="mr-1 h-3 w-3" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty State (if no tournaments) */}
        {filteredTournaments.length === 0 && searchTerm && (
          <div className="text-center py-12">
            <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No tournaments found
            </h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search terms
            </p>
            <Button variant="outline" onClick={() => setSearchTerm('')}>
              Clear Search
            </Button>
          </div>
        )}

        {tournaments.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No tournaments yet
            </h3>
            <p className="text-gray-600 mb-4">
              Get started by creating your first tournament
            </p>
            <Link href="/tournaments/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Tournament
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
