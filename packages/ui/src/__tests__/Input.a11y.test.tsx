import React from 'react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Input } from '../components/Input';
import { Label } from '../components/Label';

describe('Input Accessibility', () => {
  it('should not have any accessibility violations with default props', async () => {
    const { container } = render(<Input placeholder="Enter text" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations when properly labeled', async () => {
    const { container } = render(
      <div>
        <Label htmlFor="test-input">Test Input</Label>
        <Input id="test-input" placeholder="Enter text" />
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations when disabled', async () => {
    const { container } = render(
      <div>
        <Label htmlFor="disabled-input">Disabled Input</Label>
        <Input id="disabled-input" disabled placeholder="Disabled" />
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations with different input types', async () => {
    const types = [
      'text',
      'email',
      'password',
      'number',
      'tel',
      'url',
    ] as const;

    for (const type of types) {
      const { container } = render(
        <div>
          <Label htmlFor={`${type}-input`}>{type} Input</Label>
          <Input
            id={`${type}-input`}
            type={type}
            placeholder={`Enter ${type}`}
          />
        </div>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    }
  });

  it('should have proper ARIA attributes for error state', async () => {
    const { container } = render(
      <div>
        <Label htmlFor="error-input">Email</Label>
        <Input
          id="error-input"
          type="email"
          aria-invalid="true"
          aria-describedby="error-message"
        />
        <div id="error-message" role="alert">
          Please enter a valid email
        </div>
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
