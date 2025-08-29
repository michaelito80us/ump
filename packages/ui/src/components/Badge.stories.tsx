import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './Badge';

const meta = {
  title: 'UI/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: [
        'default',
        'secondary',
        'destructive',
        'outline',
        'success',
        'warning',
      ],
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Badge',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary',
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Destructive',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Success',
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    children: 'Warning',
  },
};

// Tournament-specific examples
export const TournamentStatus: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="success">Live</Badge>
      <Badge variant="warning">Registration Open</Badge>
      <Badge variant="secondary">Draft</Badge>
      <Badge variant="destructive">Cancelled</Badge>
      <Badge variant="outline">Completed</Badge>
    </div>
  ),
};

export const MatchStatus: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Scheduled</Badge>
      <Badge variant="success">Final</Badge>
      <Badge variant="warning">Live</Badge>
      <Badge variant="outline">Needs Approval</Badge>
    </div>
  ),
};
