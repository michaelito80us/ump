import type { Meta, StoryObj } from '@storybook/react';
import { ConsentCheckbox } from './ConsentCheckbox';

const meta: Meta<typeof ConsentCheckbox> = {
  title: 'UI/ConsentCheckbox',
  component: ConsentCheckbox,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'destructive', 'secondary'],
    },
    size: {
      control: { type: 'select' },
      options: ['default', 'sm', 'lg'],
    },
    labelVariant: {
      control: { type: 'select' },
      options: ['default', 'muted', 'accent'],
    },
    required: {
      control: { type: 'boolean' },
    },
    disabled: {
      control: { type: 'boolean' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'I agree to the terms and conditions',
    description:
      'By checking this box, you consent to our data processing practices.',
  },
};

export const Required: Story = {
  args: {
    label: 'I consent to data processing',
    description: 'This consent is required to participate in the tournament.',
    required: true,
  },
};

export const WithLongDescription: Story = {
  args: {
    label: 'GDPR Data Processing Consent',
    description:
      'I understand that my personal data (name, email, team affiliation, match statistics) will be processed for tournament management purposes. This data may be shared with tournament organizers, referees, and other participants as necessary for tournament operations. I have the right to access, rectify, or delete my data at any time.',
    required: true,
  },
};

export const Destructive: Story = {
  args: {
    label: 'I acknowledge the risks',
    description: 'This action cannot be undone.',
    variant: 'destructive',
    required: true,
  },
};

export const Secondary: Story = {
  args: {
    label: 'Optional newsletter subscription',
    description: 'Receive updates about future tournaments and events.',
    variant: 'secondary',
  },
};

export const Small: Story = {
  args: {
    label: 'Small consent checkbox',
    description: 'This is a smaller version of the consent checkbox.',
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    label: 'Large consent checkbox',
    description: 'This is a larger version of the consent checkbox.',
    size: 'lg',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled consent checkbox',
    description: 'This checkbox is disabled and cannot be interacted with.',
    disabled: true,
  },
};

export const MutedLabel: Story = {
  args: {
    label: 'Muted label consent',
    description: 'This consent checkbox has a muted label style.',
    labelVariant: 'muted',
  },
};

export const AccentLabel: Story = {
  args: {
    label: 'Accent label consent',
    description: 'This consent checkbox has an accent label style.',
    labelVariant: 'accent',
  },
};
