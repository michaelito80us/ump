import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';
import { Toaster } from './Toaster';
import { useToast } from '../hooks/use-toast';

const meta: Meta = {
  title: 'Components/Toast',
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

function ToastDemo() {
  const { toast } = useToast();

  return (
    <div className="space-y-4">
      <Button
        variant="outline"
        onClick={() => {
          toast({
            title: 'Scheduled: Catch up',
            description: 'Friday, February 10, 2023 at 5:57 PM',
          });
        }}
      >
        Add to calendar
      </Button>
      <Toaster />
    </div>
  );
}

function ToastDestructiveDemo() {
  const { toast } = useToast();

  return (
    <div className="space-y-4">
      <Button
        variant="destructive"
        onClick={() => {
          toast({
            variant: 'destructive',
            title: 'Uh oh! Something went wrong.',
            description: 'There was a problem with your request.',
          });
        }}
      >
        Show destructive toast
      </Button>
      <Toaster />
    </div>
  );
}

function ToastWithActionDemo() {
  const { toast } = useToast();

  return (
    <div className="space-y-4">
      <Button
        variant="outline"
        onClick={() => {
          toast({
            title: 'Uh oh! Something went wrong.',
            description: 'There was a problem with your request.',
            action: (
              <Button variant="outline" size="sm">
                Try again
              </Button>
            ),
          });
        }}
      >
        Show toast with action
      </Button>
      <Toaster />
    </div>
  );
}

export const Default: Story = {
  render: () => <ToastDemo />,
};

export const Destructive: Story = {
  render: () => <ToastDestructiveDemo />,
};

export const WithAction: Story = {
  render: () => <ToastWithActionDemo />,
};
