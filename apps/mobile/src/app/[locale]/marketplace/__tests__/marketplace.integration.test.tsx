import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import { useTranslations } from 'next-intl';
import MarketplacePage from '../page';
import { pluginRegistry, registerPlugin } from '@ump/engine';

// Mock the dependencies
jest.mock('next-intl');
jest.mock('@ump/ui', () => ({
  Card: ({ children, className, role }: any) => (
    <div
      className={className}
      role={role || 'article'}
      data-testid="plugin-card"
    >
      {children}
    </div>
  ),
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardDescription: ({ children }: any) => <div>{children}</div>,
  CardFooter: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>,
  Button: ({ children, onClick, disabled, className, type, ...props }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      type={type || 'button'}
      {...props}
    >
      {children}
    </button>
  ),
  Badge: ({ children, variant, className }: any) => (
    <span className={`badge ${variant} ${className}`}>{children}</span>
  ),
  Input: ({ placeholder, onChange, value, className, type, ...props }: any) => (
    <input
      placeholder={placeholder}
      onChange={onChange}
      value={value}
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
}));

const mockTranslations = {
  title: 'Plugin Marketplace',
  description: 'Discover and install plugins',
  install: 'Install',
  installing: 'Installing...',
  installSuccess: 'Successfully installed {pluginName}',
  author: 'Author',
  version: 'Version',
  noDescription: 'No description available',
  searchPlaceholder: 'Search plugins...',
  allCategories: 'All Categories',
  'category.sports': 'Sports',
  'category.phases': 'Phases',
  noPluginsFound: 'No plugins found',
  pluginCount: 'Showing {count} of {total} plugins',
};

const mockUseTranslations = useTranslations as jest.MockedFunction<
  typeof useTranslations
>;

describe('Marketplace Integration Tests', () => {
  beforeEach(() => {
    // Clear registry
    pluginRegistry.clear();

    // Setup translations mock with parameter replacement
    const mockTranslationFn = jest.fn((key: string, params?: any) => {
      let translation =
        mockTranslations[key as keyof typeof mockTranslations] || key;
      if (params && typeof translation === 'string') {
        Object.keys(params).forEach((param) => {
          translation = translation.replace(`{${param}}`, params[param]);
        });
      }
      return translation;
    });

    // Add required properties to match useTranslations return type
    Object.assign(mockTranslationFn, {
      rich: jest.fn(),
      markup: jest.fn(),
      raw: jest.fn(),
      has: jest.fn(() => true),
    });

    mockUseTranslations.mockReturnValue(mockTranslationFn as any);

    // Register test plugins
    registerPlugin('sports', {
      id: 'test-rugby',
      name: 'Test Rugby Plugin',
      description: 'Test rugby plugin for integration testing',
      author: 'Test Author',
      version: '1.0.0',
      supportedLanguages: ['en'],
      i18n: { en: { name: 'Rugby' } },
      capabilities: ['statTier:2'],
      statSchema: ['tries', 'conversions'],
      renderScoreEntry: () => React.createElement('div', null, 'Score Entry'),
      renderScore: () => React.createElement('div', null, 'Score Display'),
      calculateTotalScore: () => 0,
      validateScore: () => null,
    });

    registerPlugin('phases', {
      id: 'test-round-robin',
      name: 'Test Round Robin',
      description: 'Test round robin phase plugin',
      author: 'Test Author',
      version: '1.0.0',
      supportedLanguages: ['en'],
      i18n: { en: { name: 'Round Robin' } },
      generateSchedule: () => [],
      renderBracketUI: () => React.createElement('div', null, 'Bracket UI'),
      renderStandings: () => React.createElement('div', null, 'Standings'),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    pluginRegistry.clear();
  });

  it('successfully installs a plugin (T-15.2 requirement)', async () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

    await act(async () => {
      render(<MarketplacePage />);
    });

    // Wait for plugins to load
    await waitFor(() => {
      expect(screen.getByText('Test Rugby Plugin')).toBeInTheDocument();
    });

    // Find and click the install button for the rugby plugin
    const pluginCards = screen.getAllByTestId('plugin-card');
    const rugbyCard = pluginCards.find((card) =>
      card.textContent?.includes('Test Rugby Plugin')
    );

    expect(rugbyCard).toBeInTheDocument();

    const installButton = rugbyCard?.querySelector('button');
    expect(installButton).toBeInTheDocument();
    expect(installButton?.textContent).toBe('Install');

    // Click install button
    await act(async () => {
      fireEvent.click(installButton!);
    });

    // Verify installing state
    await waitFor(() => {
      expect(installButton?.textContent).toBe('Installing...');
      expect(installButton?.disabled).toBe(true);
    });

    // Wait for installation to complete
    await waitFor(
      () => {
        expect(installButton?.textContent).toBe('Install');
        expect(installButton?.disabled).toBe(false);
      },
      { timeout: 2000 }
    );

    // Verify success alert was shown with plugin name
    expect(alertSpy).toHaveBeenCalledWith(
      'Successfully installed Test Rugby Plugin'
    );

    alertSpy.mockRestore();
  });

  it('displays multiple plugins from different categories', async () => {
    await act(async () => {
      render(<MarketplacePage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Rugby Plugin')).toBeInTheDocument();
      expect(screen.getByText('Test Round Robin')).toBeInTheDocument();
    });

    // Verify plugin details are displayed
    expect(
      screen.getByText('Test rugby plugin for integration testing')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Test round robin phase plugin')
    ).toBeInTheDocument();
    expect(screen.getAllByText('Test Author')).toHaveLength(2);
    expect(screen.getAllByText('1.0.0')).toHaveLength(2);
  });

  it('handles concurrent plugin installations', async () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

    await act(async () => {
      render(<MarketplacePage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Rugby Plugin')).toBeInTheDocument();
      expect(screen.getByText('Test Round Robin')).toBeInTheDocument();
    });

    const installButtons = screen.getAllByText('Install');
    expect(installButtons).toHaveLength(2);

    // Click both install buttons quickly
    await act(async () => {
      fireEvent.click(installButtons[0]);
      fireEvent.click(installButtons[1]);
    });

    // Both should show installing state
    await waitFor(() => {
      expect(screen.getAllByText('Installing...')).toHaveLength(2);
    });

    // Wait for both to complete
    await waitFor(
      () => {
        expect(screen.getAllByText('Install')).toHaveLength(2);
      },
      { timeout: 2000 }
    );

    // Both should have triggered success alerts with plugin names
    expect(alertSpy).toHaveBeenCalledTimes(2);
    expect(alertSpy).toHaveBeenCalledWith(
      'Successfully installed Test Rugby Plugin'
    );
    expect(alertSpy).toHaveBeenCalledWith(
      'Successfully installed Test Round Robin'
    );

    alertSpy.mockRestore();
  });

  it('shows correct plugin count', async () => {
    await act(async () => {
      render(<MarketplacePage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Showing 2 of 2 plugins')).toBeInTheDocument();
    });
  });
});
