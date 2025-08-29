import React from 'react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Label } from '../components/Label';
import { Input } from '../components/Input';

describe('Label Accessibility', () => {
  it('should not have any accessibility violations with default props', async () => {
    const { container } = render(<Label>Test Label</Label>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations when associated with input', async () => {
    const { container } = render(
      <div>
        <Label htmlFor="test-input">Test Label</Label>
        <Input id="test-input" />
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations with required indicator', async () => {
    const { container } = render(
      <div>
        <Label htmlFor="required-input">
          Required Field <span aria-label="required">*</span>
        </Label>
        <Input id="required-input" required />
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
