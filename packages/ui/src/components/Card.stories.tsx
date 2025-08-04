import type { Meta, StoryObj } from '@storybook/react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './Card';
import { Button } from './Button';

const meta = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>This is the card content area.</p>
      </CardContent>
      <CardFooter>
        <Button>Action</Button>
      </CardFooter>
    </Card>
  ),
};

export const Simple: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardContent className="p-6">
        <p>Simple card with just content.</p>
      </CardContent>
    </Card>
  ),
};

export const WithoutFooter: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Tournament Setup</CardTitle>
        <CardDescription>Configure your tournament settings</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p>Tournament Name: Rugby Championship</p>
          <p>Date: March 15, 2024</p>
          <p>Teams: 8</p>
        </div>
      </CardContent>
    </Card>
  ),
};

export const WithActions: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Match Result</CardTitle>
        <CardDescription>Team A vs Team B</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <div className="text-2xl font-bold">24 - 18</div>
          <p className="text-sm text-muted-foreground">Final Score</p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Edit</Button>
        <Button>Confirm</Button>
      </CardFooter>
    </Card>
  ),
};

// Visual regression test scenarios
export const CardVariations: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 p-4">
      <Card className="w-[300px]">
        <CardHeader>
          <CardTitle>Basic Card</CardTitle>
          <CardDescription>Simple card layout</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Basic content</p>
        </CardContent>
      </Card>

      <Card className="w-[300px]">
        <CardContent className="p-6">
          <p>Content only card</p>
        </CardContent>
      </Card>

      <Card className="w-[300px]">
        <CardHeader>
          <CardTitle>With Footer</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Card with footer actions</p>
        </CardContent>
        <CardFooter>
          <Button size="sm">Action</Button>
        </CardFooter>
      </Card>

      <Card className="w-[300px]">
        <CardHeader>
          <CardTitle>Long Title That Might Wrap to Multiple Lines</CardTitle>
          <CardDescription>
            This is a longer description that tests how the card handles more
            content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>
            Testing longer content to see how the card adapts to different
            content lengths.
          </p>
        </CardContent>
      </Card>
    </div>
  ),
};
