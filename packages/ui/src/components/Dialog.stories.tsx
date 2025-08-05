import type { Meta, StoryObj } from '@storybook/react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './Dialog';
import { Button } from './Button';
import { Input } from './Input';
import { Label } from './Label';

const meta = {
  title: 'UI/Dialog',
  component: Dialog,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Open Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dialog Title</DialogTitle>
          <DialogDescription>
            This is a dialog description that explains what this dialog is for.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p>Dialog content goes here.</p>
        </div>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const Destructive: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive">Delete Tournament</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the
            tournament and all associated data.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button variant="destructive">Delete Tournament</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const WithForm: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Add Team</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Team</DialogTitle>
          <DialogDescription>
            Enter the team details below to add them to the tournament.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="team-name" className="text-right">
              Team Name
            </Label>
            <Input
              id="team-name"
              className="col-span-3"
              placeholder="Enter team name"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="coach-name" className="text-right">
              Coach
            </Label>
            <Input
              id="coach-name"
              className="col-span-3"
              placeholder="Enter coach name"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="contact-email" className="text-right">
              Email
            </Label>
            <Input
              id="contact-email"
              type="email"
              className="col-span-3"
              placeholder="team@example.com"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button>Add Team</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const LongContent: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Tournament Rules</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tournament Rules & Regulations</DialogTitle>
          <DialogDescription>
            Please read the following rules carefully before participating.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <h3 className="font-semibold mb-2">1. General Rules</h3>
            <p className="text-sm text-muted-foreground">
              All participants must register before the tournament begins. Late
              registrations will not be accepted under any circumstances.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">2. Equipment</h3>
            <p className="text-sm text-muted-foreground">
              Teams are responsible for bringing their own equipment. The
              tournament organizers will provide basic field equipment only.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">3. Match Duration</h3>
            <p className="text-sm text-muted-foreground">
              Each match will consist of two 40-minute halves with a 10-minute
              break. The referee's decision on timing is final.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">4. Scoring</h3>
            <p className="text-sm text-muted-foreground">
              Points will be awarded as follows: Win = 3 points, Draw = 1 point,
              Loss = 0 points. In case of a tie, goal difference will be used.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">5. Conduct</h3>
            <p className="text-sm text-muted-foreground">
              Unsporting behavior will result in immediate disqualification.
              Respect for opponents, officials, and spectators is mandatory.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button>I Understand</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

// For visual regression testing - controlled open state
export const OpenDialog: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    children: null,
  },
  render: (args) => (
    <Dialog {...args}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Open Dialog for Testing</DialogTitle>
          <DialogDescription>
            This dialog is always open for visual regression testing.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p>
            This is used for visual regression testing to capture the dialog in
            its open state.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};
