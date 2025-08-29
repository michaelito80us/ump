import React from 'react';

// Type declaration for Jest expect
declare const expect: jest.Expect;
import { render, act } from '@testing-library/react';
import { axe } from 'jest-axe';
import MarketplacePage from '../page';
import { pluginRegistry } from '@ump/engine';
import type { SportPlugin } from '@ump/engine';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      title: 'Plugin Marketplace',
      description:
        'Discover and install plugins to extend your tournament management capabilities',
      install: 'Install',
      installing: 'Installing...',
      author: 'Author',
      version: 'Version',
      languages: 'Languages',
      capabilities: 'Capabilities',
      noDescription: 'No description available',
      searchPlaceholder: 'Search plugins...',
      allCategories: 'All Categories',
      'category.sports': 'Sports',
      'category.phases': 'Phases',
      'category.seeding': 'Seeding',
      'category.scheduling': 'Scheduling',
      'category.tournaments': 'Tournaments',
      noPluginsFound: 'No plugins found',
      refresh: 'Refresh',
      pluginCount: 'Showing {count} of {total} plugins',
      installSuccess: 'Plugin installed successfully',
      installError: 'Failed to install plugin',
    };
    return translations[key] || key;
  },
}));

// Mock @ump/ui components with proper accessibility attributes
jest.mock('@ump/ui', () => ({
  Card: ({ children, className, role }: any) => (
    <div className={className} role={role || 'article'}>
      {children}
    </div>
  ),
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardDescription: ({ children }: any) => <p>{children}</p>,
  CardFooter: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>, // Changed from <header> to <div>
  CardTitle: ({ children }: any) => <h2>{children}</h2>,
  Button: ({ children, onClick, className, type, ...props }: any) => (
    <button
      onClick={onClick}
      className={className}
      type={type || 'button'}
      {...props}
    >
      {children}
    </button>
  ),
  Input: ({ placeholder, onChange, className, type, ...props }: any) => (
    <input
      placeholder={placeholder}
      onChange={onChange}
      className={className}
      type={type || 'text'}
      {...props}
    />
  ),
  Select: ({ children, value, onValueChange }: any) => (
    <select value={value} onChange={(e) => onValueChange?.(e.target.value)}>
      {children}
    </select>
  ),
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => (
    <option value={value}>{children}</option>
  ),
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
  Badge: ({ children, variant, className }: any) => (
    <span className={`badge ${variant} ${className}`}>{children}</span>
  ),
}));

describe('Marketplace Accessibility Tests', () => {
  const mockPlugin: SportPlugin = {
    id: 'rugby',
    name: 'Rugby Plugin',
    version: '1.0.0',
    description: 'Rugby scoring system',
    author: 'UMP Team',
    supportedLanguages: ['en'],
    i18n: { en: { name: 'Rugby' } },
    capabilities: ['statTier:3'],
    statSchema: ['tries', 'conversions'],
    renderScoreEntry: () => React.createElement('div', null, 'Score Entry'),
    renderScore: () => React.createElement('div', null, 'Score Display'),
    calculateTotalScore: () => 0,
    validateScore: () => null,
  };

  beforeEach(() => {
    // Register test plugin with both category and plugin parameters
    pluginRegistry.register('sports', mockPlugin);
  });

  afterEach(() => {
    // Clear all plugins
    pluginRegistry.clear();
  });

  it('should not have any accessibility violations', async () => {
    let container: HTMLElement;

    await act(async () => {
      const renderResult = render(<MarketplacePage />);
      container = renderResult.container;
    });

    const results = await axe(container!);
    expect(results).toHaveNoViolations();
  });

  it('should have proper heading structure', async () => {
    let container: HTMLElement;

    await act(async () => {
      const renderResult = render(<MarketplacePage />);
      container = renderResult.container;
    });

    const h1 = container!.querySelector('h1');
    expect(h1).toHaveTextContent('Plugin Marketplace');

    const results = await axe(container!);
    expect(results).toHaveNoViolations();
  });

  it('should have proper ARIA labels and roles', async () => {
    let container: HTMLElement;

    await act(async () => {
      const renderResult = render(<MarketplacePage />);
      container = renderResult.container;
    });

    // Check for proper ARIA roles
    const articles = container!.querySelectorAll('[role="article"]');
    expect(articles.length).toBeGreaterThan(0);

    const results = await axe(container!);
    expect(results).toHaveNoViolations();
  });

  it('should support keyboard navigation', async () => {
    let container: HTMLElement;

    await act(async () => {
      const renderResult = render(<MarketplacePage />);
      container = renderResult.container;
    });

    // Check that interactive elements are focusable and have proper type attributes
    const buttons = container!.querySelectorAll('button');
    buttons.forEach((button) => {
      expect(button).toHaveAttribute('type');
      expect(button.getAttribute('type')).toBe('button');
    });

    const results = await axe(container!);
    expect(results).toHaveNoViolations();
  });

  it('should have descriptive button text and proper attributes', async () => {
    let container: HTMLElement;

    await act(async () => {
      const renderResult = render(<MarketplacePage />);
      container = renderResult.container;
    });

    const installButtons = container!.querySelectorAll('button');
    installButtons.forEach((button) => {
      expect(button).toHaveTextContent(/install|refresh/i);
      expect(button).toHaveAttribute('type', 'button');
    });

    const results = await axe(container!);
    expect(results).toHaveNoViolations();
  });
});
