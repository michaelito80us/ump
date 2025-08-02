import { Button } from '@ump/ui';
import { Card, CardHeader, CardTitle, CardContent } from '@ump/ui';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@ump/ui';

export default function TestUIPage() {
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">UI Components Test</h1>

      {/* Button Tests */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Button Component</h2>
        <div className="flex gap-4">
          <Button variant="default">Default Button</Button>
          <Button variant="destructive">Destructive Button</Button>
          <Button variant="outline">Outline Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="ghost">Ghost Button</Button>
          <Button variant="link">Link Button</Button>
        </div>
        <div className="flex gap-4">
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon">🎯</Button>
        </div>
      </section>

      {/* Card Tests */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Card Component</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>Tournament Setup</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Configure your tournament settings and participants.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Match Results</CardTitle>
            </CardHeader>
            <CardContent>
              <p>View and manage match outcomes and statistics.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Dialog Tests */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Dialog Component</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Test Dialog</DialogTitle>
            </DialogHeader>
            <p>
              This is a test dialog to verify the Dialog component works
              correctly.
            </p>
          </DialogContent>
        </Dialog>
      </section>
    </div>
  );
}
