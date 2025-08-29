import React from 'react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Badge } from '../components/Badge';

describe('Badge Accessibility', () => {
  it('should not have any accessibility violations with default props', async () => {
    const { container } = render(<Badge>Default Badge</Badge>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations with different variants', async () => {
    const variants = [
      'default',
      'secondary',
      'destructive',
      'outline',
      'success',
      'warning',
    ] as const;

    for (const variant of variants) {
      const { container } = render(
        <Badge variant={variant}>{variant} Badge</Badge>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    }
  });

  it('should not have accessibility violations when used as status indicator', async () => {
    const { container } = render(
      <div>
        <span>Tournament Status: </span>
        <Badge variant="success" role="status" aria-label="Tournament is live">
          Live
        </Badge>
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations when interactive', async () => {
    const { container } = render(
      <Badge
        role="button"
        tabIndex={0}
        aria-label="Remove tag"
        onClick={() => {}}
        onKeyDown={() => {}}
      >
        Removable Tag ×
      </Badge>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
