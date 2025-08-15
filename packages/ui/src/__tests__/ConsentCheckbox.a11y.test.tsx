import React from 'react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { ConsentCheckbox } from '../components/ConsentCheckbox';

describe('ConsentCheckbox Accessibility', () => {
  it('should not have any accessibility violations with default props', async () => {
    const { container } = render(
      <ConsentCheckbox
        label="I consent to data processing"
        checked={false}
        onChange={() => {}}
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations with different variants', async () => {
    const variants = ['default', 'destructive', 'secondary'] as const;

    for (const variant of variants) {
      const { container } = render(
        <ConsentCheckbox
          label="Consent checkbox"
          variant={variant}
          checked={false}
          onChange={() => {}}
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    }
  });

  it('should not have accessibility violations with different sizes', async () => {
    const sizes = ['default', 'sm', 'lg'] as const;

    for (const size of sizes) {
      const { container } = render(
        <ConsentCheckbox
          label="Consent checkbox"
          size={size}
          checked={false}
          onChange={() => {}}
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    }
  });

  it('should not have accessibility violations when disabled', async () => {
    const { container } = render(
      <ConsentCheckbox
        label="Disabled consent"
        disabled
        checked={false}
        onChange={() => {}}
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations when required', async () => {
    const { container } = render(
      <ConsentCheckbox
        label="Required consent"
        required
        checked={false}
        onChange={() => {}}
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations with description', async () => {
    const { container } = render(
      <ConsentCheckbox
        label="Consent with description"
        description="This is a detailed description of what you're consenting to."
        checked={false}
        onChange={() => {}}
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations with error state', async () => {
    const { container } = render(
      <ConsentCheckbox
        label="Consent with error"
        error="You must consent to continue"
        checked={false}
        onChange={() => {}}
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper ARIA attributes when required', async () => {
    const { getByRole } = render(
      <ConsentCheckbox
        label="Required consent"
        required
        checked={false}
        onChange={() => {}}
      />
    );

    const checkbox = getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-required', 'true');
  });

  it('should have proper ARIA attributes with description', async () => {
    const { getByRole } = render(
      <ConsentCheckbox
        label="Consent with description"
        description="Detailed description"
        checked={false}
        onChange={() => {}}
      />
    );

    const checkbox = getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-describedby');
  });

  it('should have proper ARIA attributes with error', async () => {
    const { getByRole } = render(
      <ConsentCheckbox
        label="Consent with error"
        error="Error message"
        checked={false}
        onChange={() => {}}
      />
    );

    const checkbox = getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-describedby');
    expect(checkbox).toHaveAttribute('aria-invalid', 'true');
  });
});
