'use client';

import { useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from '@ump/ui';
import { ArrowLeft, Save, Eye } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface TournamentFormData {
  name: string;
  description: string;
  sport: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  maxTeams: string;
  location: string;
  entryFee: string;
  isPublic: boolean;
  allowLateRegistration: boolean;
  requireApproval: boolean;
}

const initialFormData: TournamentFormData = {
  name: '',
  description: '',
  sport: '',
  startDate: '',
  endDate: '',
  registrationDeadline: '',
  maxTeams: '',
  location: '',
  entryFee: '',
  isPublic: true,
  allowLateRegistration: false,
  requireApproval: false,
};

const sports = [
  'Soccer',
  'Basketball',
  'Tennis',
  'Rugby',
  'Volleyball',
  'Baseball',
  'Cricket',
  'Hockey',
  'Badminton',
  'Table Tennis',
];

export default function NewTournamentPage() {
  const [formData, setFormData] = useState<TournamentFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleInputChange = (
    field: keyof TournamentFormData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (isDraft: boolean = false) => {
    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      console.log('Tournament data:', {
        ...formData,
        status: isDraft ? 'draft' : 'published',
      });

      // Navigate back to tournaments list
      router.push('/tournaments');
    } catch (error) {
      console.error('Error creating tournament:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid =
    formData.name && formData.sport && formData.startDate && formData.endDate;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/tournaments">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Create New Tournament
            </h1>
            <p className="text-gray-600">
              Set up your tournament details and configuration
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Essential details about your tournament
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tournament Name *
                  </label>
                  <Input
                    placeholder="Enter tournament name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <Textarea
                    placeholder="Describe your tournament"
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange('description', e.target.value)
                    }
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sport *
                    </label>
                    <Select
                      value={formData.sport}
                      onValueChange={(value) =>
                        handleInputChange('sport', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select sport" />
                      </SelectTrigger>
                      <SelectContent>
                        {sports.map((sport) => (
                          <SelectItem key={sport} value={sport}>
                            {sport}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <Input
                      placeholder="Tournament venue"
                      value={formData.location}
                      onChange={(e) =>
                        handleInputChange('location', e.target.value)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Schedule & Registration */}
            <Card>
              <CardHeader>
                <CardTitle>Schedule & Registration</CardTitle>
                <CardDescription>
                  Set important dates and limits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date *
                    </label>
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        handleInputChange('startDate', e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date *
                    </label>
                    <Input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) =>
                        handleInputChange('endDate', e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Registration Deadline
                    </label>
                    <Input
                      type="date"
                      value={formData.registrationDeadline}
                      onChange={(e) =>
                        handleInputChange(
                          'registrationDeadline',
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Maximum Teams
                    </label>
                    <Input
                      type="number"
                      placeholder="e.g., 16"
                      value={formData.maxTeams}
                      onChange={(e) =>
                        handleInputChange('maxTeams', e.target.value)
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Entry Fee
                  </label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={formData.entryFee}
                    onChange={(e) =>
                      handleInputChange('entryFee', e.target.value)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Tournament Settings</CardTitle>
                <CardDescription>Configure tournament behavior</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Public Tournament
                    </label>
                    <p className="text-sm text-gray-500">
                      Allow anyone to view and register
                    </p>
                  </div>
                  <Switch
                    checked={formData.isPublic}
                    onCheckedChange={(checked) =>
                      handleInputChange('isPublic', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Allow Late Registration
                    </label>
                    <p className="text-sm text-gray-500">
                      Teams can register after deadline
                    </p>
                  </div>
                  <Switch
                    checked={formData.allowLateRegistration}
                    onCheckedChange={(checked) =>
                      handleInputChange('allowLateRegistration', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Require Approval
                    </label>
                    <p className="text-sm text-gray-500">
                      Manually approve team registrations
                    </p>
                  </div>
                  <Switch
                    checked={formData.requireApproval}
                    onCheckedChange={(checked) =>
                      handleInputChange('requireApproval', checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => handleSubmit(false)}
                  disabled={!isFormValid || isSubmitting}
                  className="w-full"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSubmitting ? 'Creating...' : 'Create & Publish'}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleSubmit(true)}
                  disabled={!formData.name || isSubmitting}
                  className="w-full"
                >
                  Save as Draft
                </Button>

                <Button
                  variant="outline"
                  disabled={!isFormValid}
                  className="w-full"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </Button>
              </CardContent>
            </Card>

            {/* Form Status */}
            <Card>
              <CardHeader>
                <CardTitle>Form Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Tournament Name:</span>
                    <span
                      className={
                        formData.name ? 'text-green-600' : 'text-red-600'
                      }
                    >
                      {formData.name ? '✓' : '✗'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sport:</span>
                    <span
                      className={
                        formData.sport ? 'text-green-600' : 'text-red-600'
                      }
                    >
                      {formData.sport ? '✓' : '✗'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Start Date:</span>
                    <span
                      className={
                        formData.startDate ? 'text-green-600' : 'text-red-600'
                      }
                    >
                      {formData.startDate ? '✓' : '✗'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>End Date:</span>
                    <span
                      className={
                        formData.endDate ? 'text-green-600' : 'text-red-600'
                      }
                    >
                      {formData.endDate ? '✓' : '✗'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
