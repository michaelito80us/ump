import React from 'react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Button } from '../components/Button';

describe('Button Accessibility', () => {
  it('should not have any accessibility violations with default props', async () => {
    const { container } = render(<Button>Click me</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations with different variants', async () => {
    const variants = [
      'default',
      'destructive',
      'outline',
      'secondary',
      'ghost',
      'link',
    ] as const;

    for (const variant of variants) {
      const { container } = render(<Button variant={variant}>Button</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    }
  });

  it('should not have accessibility violations with different sizes', async () => {
    const sizes = ['default', 'sm', 'lg', 'icon'] as const;

    for (const size of sizes) {
      const { container } = render(<Button size={size}>Button</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    }
  });

  it('should not have accessibility violations when disabled', async () => {
    const { container } = render(<Button disabled>Disabled Button</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should fail accessibility when missing accessible name', async () => {
    const { container } = render(<Button />);
    const results = await axe(container);
    expect(results.violations).toHaveLength(1);
    expect(results.violations[0].id).toBe('button-name');
  });

  it('should pass accessibility with aria-label when no text content', async () => {
    const { container } = render(<Button aria-label="Close dialog" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should pass accessibility with icon button and proper labeling', async () => {
    const { container } = render(
      <Button size="icon" aria-label="Settings">
        <span aria-hidden="true">⚙️</span>
      </Button>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
