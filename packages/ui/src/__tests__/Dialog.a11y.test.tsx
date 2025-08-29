import React from 'react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/Dialog';

describe('Dialog Accessibility', () => {
  it('should not have any accessibility violations with basic dialog', async () => {
    const { container } = render(
      <Dialog open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog Title</DialogTitle>
            <DialogDescription>Dialog description</DialogDescription>
          </DialogHeader>
          <p>Dialog content</p>
        </DialogContent>
      </Dialog>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations with complete dialog structure', async () => {
    const { container } = render(
      <Dialog open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Dialog</DialogTitle>
            <DialogDescription>This dialog has all sections</DialogDescription>
          </DialogHeader>
          <div>
            <p>Main dialog content</p>
            <form>
              <label htmlFor="dialog-input">Input:</label>
              <input id="dialog-input" type="text" />
            </form>
          </div>
          <DialogFooter>
            <button>Cancel</button>
            <button>Confirm</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations with dialog trigger', async () => {
    const { container } = render(
      <Dialog>
        <DialogTrigger asChild>
          <button>Open Dialog</button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Triggered Dialog</DialogTitle>
          </DialogHeader>
          <p>Content</p>
        </DialogContent>
      </Dialog>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations with form dialog', async () => {
    const { container } = render(
      <Dialog open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Form Dialog</DialogTitle>
            <DialogDescription>Please fill out this form</DialogDescription>
          </DialogHeader>
          <form>
            <div>
              <label htmlFor="form-name">Name:</label>
              <input id="form-name" type="text" required />
            </div>
            <div>
              <label htmlFor="form-email">Email:</label>
              <input id="form-email" type="email" required />
            </div>
            <fieldset>
              <legend>Preferences</legend>
              <label>
                <input type="checkbox" />
                Newsletter
              </label>
              <label>
                <input type="checkbox" />
                Updates
              </label>
            </fieldset>
          </form>
          <DialogFooter>
            <button type="button">Cancel</button>
            <button type="submit">Save</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
