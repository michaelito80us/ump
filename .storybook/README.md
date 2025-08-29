# Storybook Configuration

This directory contains the Storybook configuration for component development and documentation.

## Setup

### Local Development

```bash
# Install dependencies
pnpm install

# Start Storybook locally
pnpm storybook

# Build Storybook for production
pnpm build-storybook

# View components in isolation
pnpm storybook
```

## How It Works

### Component Development

- **Isolated Development**: Develop components in isolation without needing the full application
- **Documentation**: Stories serve as living documentation for component usage
- **Testing**: Manual testing of component variants and states
- **Design System**: Maintain consistency across the design system

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

### Writing Stories for Development

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

### Component Review

1. **Test all variants** in Storybook during development
2. **Verify responsive behavior** across different screen sizes
3. **Check accessibility** using Storybook's accessibility addon
4. **Document usage patterns** in story descriptions

## Troubleshooting

### Common Issues

1. **Build failures**: Check that all dependencies are installed and packages build successfully
2. **Missing stories**: Ensure components have corresponding stories for documentation
3. **Import errors**: Verify that component imports are correct in story files

### Local Development

To develop with Storybook:

```bash
# Start Storybook development server
pnpm storybook

# Build Storybook for production
pnpm build-storybook
```
