import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';
import { Label } from './Label';

const meta = {
  title: 'UI/Input',
  component: Input as any,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: { type: 'select' },
      options: ['text', 'email', 'password', 'number', 'tel', 'url'],
    },
    disabled: {
      control: { type: 'boolean' },
    },
    placeholder: {
      control: { type: 'text' },
    },
  },
} satisfies Meta<any>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="email">Email</Label>
      <Input type="email" id="email" placeholder="Email" />
    </div>
  ),
};

export const Password: Story = {
  args: {
    type: 'password',
    placeholder: 'Enter password...',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: 'Disabled input',
  },
};

export const WithError: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="error-input">Team Name</Label>
      <Input
        type="text"
        id="error-input"
        placeholder="Enter team name"
        className="border-destructive focus-visible:ring-destructive"
      />
      <p className="text-sm text-destructive">Team name is required</p>
    </div>
  ),
};

export const FormExample: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-sm">
      <div className="grid items-center gap-1.5">
        <Label htmlFor="tournament-name">Tournament Name</Label>
        <Input
          type="text"
          id="tournament-name"
          placeholder="Spring Championship"
        />
      </div>
      <div className="grid items-center gap-1.5">
        <Label htmlFor="start-date">Start Date</Label>
        <Input type="date" id="start-date" />
      </div>
      <div className="grid items-center gap-1.5">
        <Label htmlFor="max-teams">Max Teams</Label>
        <Input type="number" id="max-teams" placeholder="16" />
      </div>
    </div>
  ),
};
