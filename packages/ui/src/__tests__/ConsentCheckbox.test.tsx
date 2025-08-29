/// <reference types="jest" />
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import {
  ConsentCheckbox,
  useConsentCheckbox,
} from '../components/ConsentCheckbox';

// Test component for useConsentCheckbox hook
function TestHookComponent({
  onStateChange,
}: {
  onStateChange?: (state: any) => void;
}) {
  const consent = useConsentCheckbox();

  React.useEffect(() => {
    onStateChange?.(consent);
  }, [consent, onStateChange]);

  return (
    <div>
      <button
        onClick={() => consent.handleConsentChange(true)}
        data-testid="set-consent-true"
      >
        Set Consent True
      </button>
      <button
        onClick={() => consent.handleConsentChange(false)}
        data-testid="set-consent-false"
      >
        Set Consent False
      </button>
      <button
        onClick={() => consent.requireConsent()}
        data-testid="require-consent"
      >
        Require Consent
      </button>
      <button
        onClick={() => consent.validateConsent()}
        data-testid="validate-consent"
      >
        Validate Consent
      </button>
      <div data-testid="consent-state">{JSON.stringify(consent)}</div>
    </div>
  );
}

describe('ConsentCheckbox Component', () => {
  const defaultProps = {
    label: 'I consent to data processing',
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with basic props', () => {
    render(<ConsentCheckbox {...defaultProps} />);

    expect(screen.getByRole('checkbox')).toBeInTheDocument();
    expect(
      screen.getByText('I consent to data processing')
    ).toBeInTheDocument();
  });

  it('calls onChange when clicked', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(<ConsentCheckbox {...defaultProps} onChange={onChange} />);

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'change',
        target: expect.any(HTMLInputElement),
      })
    );
  });

  it('displays as checked when checked prop is true', () => {
    render(<ConsentCheckbox {...defaultProps} checked={true} />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('displays as unchecked when checked prop is false', () => {
    render(<ConsentCheckbox {...defaultProps} checked={false} />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
  });

  it('is disabled when disabled prop is true', () => {
    render(<ConsentCheckbox {...defaultProps} disabled />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
  });

  it('shows required indicator when required prop is true', () => {
    render(<ConsentCheckbox {...defaultProps} required />);

    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('displays description when provided', () => {
    const description = 'This is a detailed description of the consent.';
    render(<ConsentCheckbox {...defaultProps} description={description} />);

    expect(screen.getByText(description)).toBeInTheDocument();
  });

  it('handles required state properly', () => {
    render(<ConsentCheckbox {...defaultProps} required />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-required', 'true');
  });

  it('applies correct CSS classes for different variants', () => {
    const { rerender } = render(
      <ConsentCheckbox {...defaultProps} variant="destructive" />
    );

    let checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveClass('border-destructive');

    rerender(<ConsentCheckbox {...defaultProps} variant="secondary" />);
    checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveClass('border-secondary');
  });

  it('applies correct CSS classes for different sizes', () => {
    const { rerender } = render(
      <ConsentCheckbox {...defaultProps} size="sm" />
    );

    let checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveClass('h-3', 'w-3');

    rerender(<ConsentCheckbox {...defaultProps} size="lg" />);
    checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveClass('h-5', 'w-5');
  });

  it('applies correct CSS classes for different label variants', () => {
    const { rerender } = render(
      <ConsentCheckbox {...defaultProps} labelVariant="muted" />
    );

    let label = screen.getByText('I consent to data processing');
    expect(label).toHaveClass('text-muted-foreground');

    rerender(<ConsentCheckbox {...defaultProps} labelVariant="accent" />);
    label = screen.getByText('I consent to data processing');
    expect(label).toHaveClass('text-accent-foreground');
  });

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    // Use uncontrolled component for this test (no checked prop)
    render(
      <ConsentCheckbox
        label="I consent to data processing"
        onChange={onChange}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    checkbox.focus();

    await user.keyboard(' ');
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'change',
        target: expect.any(HTMLInputElement),
      })
    );

    // Verify the checkbox is actually checked
    expect(checkbox).toBeChecked();
  });

  it('does not call onChange when disabled and clicked', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(<ConsentCheckbox {...defaultProps} onChange={onChange} disabled />);

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('useConsentCheckbox Hook', () => {
  it('initializes with default state', () => {
    let hookState: any;

    render(
      <TestHookComponent
        onStateChange={(state) => {
          hookState = state;
        }}
      />
    );

    expect(hookState.hasConsent).toBe(false);
    expect(hookState.isRequired).toBe(false);
    expect(hookState.validateConsent()).toBe(false);
  });

  it('updates consent state when setConsent is called', async () => {
    let hookState: any;

    render(
      <TestHookComponent
        onStateChange={(state) => {
          hookState = state;
        }}
      />
    );

    const setConsentButton = screen.getByTestId('set-consent-true');
    fireEvent.click(setConsentButton);

    await waitFor(() => {
      expect(hookState.hasConsent).toBe(true);
    });
  });

  it('sets required state when requireConsent is called', async () => {
    let hookState: any;

    render(
      <TestHookComponent
        onStateChange={(state) => {
          hookState = state;
        }}
      />
    );

    const requireConsentButton = screen.getByTestId('require-consent');
    fireEvent.click(requireConsentButton);

    await waitFor(() => {
      expect(hookState.isRequired).toBe(true);
      expect(hookState.hasConsent).toBe(false);
      expect(() => hookState.validateConsent()).toThrow(
        'GDPR consent is required but not provided'
      );
    });
  });

  it('validates consent correctly when required', async () => {
    let hookState: any;

    render(
      <TestHookComponent
        onStateChange={(state) => {
          hookState = state;
        }}
      />
    );

    // First require consent
    const requireConsentButton = screen.getByTestId('require-consent');
    fireEvent.click(requireConsentButton);

    await waitFor(() => {
      expect(hookState.isRequired).toBe(true);
      expect(hookState.hasConsent).toBe(false);
    });

    // Then set consent to true
    const setConsentButton = screen.getByTestId('set-consent-true');
    fireEvent.click(setConsentButton);

    await waitFor(() => {
      expect(hookState.hasConsent).toBe(true);
      expect(hookState.isRequired).toBe(true);
      expect(hookState.validateConsent()).toBe(true);
    });
  });

  it('validates consent correctly when not required', async () => {
    let _hookState: any;

    render(
      <TestHookComponent
        onStateChange={(state) => {
          _hookState = state;
        }}
      />
    );

    await waitFor(() => {
      expect(_hookState.hasConsent).toBe(false);
      expect(_hookState.isRequired).toBe(false);
      expect(_hookState.validateConsent()).toBe(false);
    });
  });

  it('returns validation result from validateConsent', async () => {
    let _hookState: any;
    let validationResult: any;

    function TestValidationComponent() {
      const consent = useConsentCheckbox();

      React.useEffect(() => {
        _hookState = consent;
      }, [consent]);

      return (
        <div>
          <button
            onClick={() => {
              validationResult = consent.validateConsent();
            }}
            data-testid="validate"
          >
            Validate
          </button>
          <button
            onClick={() => consent.handleConsentChange(true)}
            data-testid="set-consent"
          >
            Set Consent
          </button>
          <button
            onClick={() => consent.requireConsent()}
            data-testid="require"
          >
            Require
          </button>
        </div>
      );
    }

    render(<TestValidationComponent />);

    // Test validation when not required
    fireEvent.click(screen.getByTestId('validate'));
    expect(validationResult).toBe(false); // No consent given, returns false

    // Set consent and test validation
    fireEvent.click(screen.getByTestId('set-consent'));
    await waitFor(() => {
      fireEvent.click(screen.getByTestId('validate'));
      expect(validationResult).toBe(true);
    });

    // Test validation error when consent is required but not given
    const TestErrorComponent = () => {
      const consent = useConsentCheckbox();
      React.useEffect(() => {
        consent.requireConsent();
      }, []);

      return (
        <button
          onClick={() => {
            try {
              consent.validateConsent();
            } catch (error) {
              validationResult = error;
            }
          }}
          data-testid="validate-error"
        >
          Validate Error
        </button>
      );
    };

    render(<TestErrorComponent />);
    fireEvent.click(screen.getByTestId('validate-error'));
    expect(validationResult).toBeInstanceOf(Error);
    expect(validationResult.message).toBe(
      'GDPR consent is required but not provided'
    );
  });
});
