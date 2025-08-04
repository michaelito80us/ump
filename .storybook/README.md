# Visual Regression Testing with Chromatic

This directory contains the Storybook configuration for visual regression testing using Chromatic.

## Setup

### 1. Chromatic Project Setup

1. Go to [chromatic.com](https://www.chromatic.com/) and sign up with your GitHub account
2. Create a new project and link it to this repository
3. Copy the project token and add it as a GitHub secret named `CHROMATIC_PROJECT_TOKEN`

### 2. Local Development

```bash
# Install dependencies
pnpm install

# Start Storybook locally
pnpm storybook

# Build Storybook for production
pnpm build-storybook

# Run Chromatic locally (requires project token)
pnpm chromatic
```

## How It Works

### Visual Regression Testing

- **Baseline Snapshots**: The first time Chromatic sees a story, it creates a baseline snapshot
- **Change Detection**: On subsequent runs, Chromatic compares new snapshots to baselines
- **Review Process**: Changes are flagged for manual review in the Chromatic UI
- **Approval**: Approved changes become the new baseline

### GitHub Integration

The `.github/workflows/chromatic.yml` workflow:

- Runs on every push to `main` and `develop` branches
- Runs on every pull request
- Uses `onlyChanged: true` to only test changed stories on PRs
- Uses `exitZeroOnChanges: true` to not fail builds on visual changes

### Story Organization

Stories are organized by component type:

- `UI/Button` - Button component variants
- `UI/Card` - Card component layouts
- `UI/Dialog` - Dialog component states

Each story includes:

- **Individual variants** for testing specific props
- **Combination stories** for testing multiple variants together
- **Visual regression scenarios** for comprehensive testing

## Best Practices

### Writing Stories for Visual Regression

1. **Cover all variants**: Include stories for all component variants and states
2. **Test combinations**: Create stories that show multiple components together
3. **Include edge cases**: Test with long text, empty states, error states
4. **Use consistent sizing**: Use fixed widths/heights for consistent snapshots

### Example Story Structure

```typescript
// Individual variants
export const Default: Story = { ... };
export const Secondary: Story = { ... };
export const Disabled: Story = { ... };

// Combination testing
export const AllVariants: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button variant="default">Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="destructive">Destructive</Button>
    </div>
  ),
};
```

### Reviewing Changes

1. **Check the Chromatic build** in the GitHub PR checks
2. **Review flagged changes** in the Chromatic UI
3. **Approve intentional changes** to update baselines
4. **Reject unintentional changes** and fix the code

## Troubleshooting

### Common Issues

1. **Missing project token**: Ensure `CHROMATIC_PROJECT_TOKEN` is set in GitHub secrets
2. **Build failures**: Check that all dependencies are installed and packages build successfully
3. **Inconsistent snapshots**: Ensure stories use consistent sizing and avoid dynamic content

### Local Testing

To test Chromatic locally:

```bash
# Set your project token
export CHROMATIC_PROJECT_TOKEN=your_token_here

# Run Chromatic
pnpm chromatic
```
