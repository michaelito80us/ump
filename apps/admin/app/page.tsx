'use client';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
} from '@ump/ui';
import {
  Plus,
  Calendar,
  Users,
  Trophy,
  Settings,
  BarChart3,
  Wifi,
} from 'lucide-react';
import Link from 'next/link';
import { useRealtimeConnection } from '../hooks/use-realtime';
import { ConnectionStatus } from '../components/connection-status';
import { LiveNotifications } from '../components/live-notifications';

export default function AdminPage() {
  const { isConnected } = useRealtimeConnection();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  Admin Dashboard
                </h1>
                <ConnectionStatus compact />
              </div>
              <p className="text-gray-600">
                Manage tournaments, teams, and system settings
                {isConnected && (
                  <span className="ml-2 text-green-600 text-sm">
                    • Real-time updates active
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <LiveNotifications />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/tournaments/new">
              <Button
                className="w-full h-16 text-left justify-start"
                variant="outline"
              >
                <Plus className="mr-3 h-5 w-5" />
                <div>
                  <div className="font-medium">Create Tournament</div>
                  <div className="text-sm text-gray-500">
                    Set up a new tournament
                  </div>
                </div>
              </Button>
            </Link>
            <Link href="/tournaments">
              <Button
                className="w-full h-16 text-left justify-start"
                variant="outline"
              >
                <Trophy className="mr-3 h-5 w-5" />
                <div>
                  <div className="font-medium">Manage Tournaments</div>
                  <div className="text-sm text-gray-500">
                    View and edit tournaments
                  </div>
                </div>
              </Button>
            </Link>
            <Link href="/settings">
              <Button
                className="w-full h-16 text-left justify-start"
                variant="outline"
              >
                <Settings className="mr-3 h-5 w-5" />
                <div>
                  <div className="font-medium">System Settings</div>
                  <div className="text-sm text-gray-500">
                    Configure system options
                  </div>
                </div>
              </Button>
            </Link>
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Tournaments
                </CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">
                  +2 from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Teams
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">248</div>
                <p className="text-xs text-muted-foreground">
                  +18 from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Upcoming Events
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8</div>
                <p className="text-xs text-muted-foreground">Next 30 days</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  System Health
                </CardTitle>
                <div className="flex items-center gap-2">
                  {isConnected && <Wifi className="h-3 w-3 text-green-600" />}
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">98%</div>
                <p className="text-xs text-muted-foreground">
                  All systems operational
                  {isConnected && (
                    <span className="block text-green-600">
                      • Real-time monitoring active
                    </span>
                  )}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Tournaments</CardTitle>
              <CardDescription>Latest tournament activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Spring Rugby Championship</p>
                    <p className="text-sm text-gray-500">Created 2 hours ago</p>
                  </div>
                  <Badge variant="outline">Draft</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Winter Soccer League</p>
                    <p className="text-sm text-gray-500">Updated 1 day ago</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Basketball Tournament 2024</p>
                    <p className="text-sm text-gray-500">
                      Completed 3 days ago
                    </p>
                  </div>
                  <Badge variant="secondary">Completed</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Notifications</CardTitle>
              <CardDescription>Important updates and alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Database backup completed</p>
                    <p className="text-sm text-gray-500">
                      Scheduled backup finished successfully at 2:00 AM
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">New plugin available</p>
                    <p className="text-sm text-gray-500">
                      Advanced Statistics Plugin v2.1 is ready for installation
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Maintenance scheduled</p>
                    <p className="text-sm text-gray-500">
                      System maintenance planned for Sunday 3:00 AM - 5:00 AM
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
