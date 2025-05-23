# Design Tokens & Theme (v0.1)

> **Scope** – single‑source design vocabulary used by Tailwind, shadcn/ui stories, and any CSS‑in‑TS utilities.

## 1 · Color system

| Token               | CSS Var              | Light (HSL)   | Dark (HSL)     | Usage                             |
| ------------------- | -------------------- | ------------- | -------------- | --------------------------------- |
| **primary**         | `--color-primary`    | `240 75% 60%` | `240 100% 65%` | brand accents, CTA buttons        |
| **primary‑fg**      | `--color-primary-fg` | `0 0% 100%`   | `0 0% 100%`    | text/icon inside primary surfaces |
| **secondary**       | `--color-secondary`  | `280 60% 55%` | `280 65% 60%`  | secondary buttons, links          |
| **neutral‑bg**      | `--color-bg`         | `0 0% 100%`   | `240 5% 12%`   | app background                    |
| **neutral‑surface** | `--color-surface`    | `240 5% 97%`  | `240 4% 18%`   | cards, sheets                     |
| **neutral‑border**  | `--color-border`     | `240 6% 90%`  | `240 4% 26%`   | divider lines                     |
| **neutral‑fg**      | `--color-fg`         | `240 10% 10%` | `0 0% 100%`    | primary text                      |
| **success**         | `--color-success`    | `140 60% 45%` | `140 70% 50%`  | success messages                  |
| **warning**         | `--color-warning`    | `35 85% 55%`  | `35 95% 60%`   | warnings                          |
| **error**           | `--color-error`      | `0 75% 60%`   | `0 85% 65%`    | errors                            |

> **Why HSL + CSS vars?** Tailwind 3+ supports arbitrary HSL notation, so we can do `bg-[hsl(var(--color-primary)/<alpha-value>)]`. Dark mode just flips var definitions; no class names change.

### Implementation snippet (add to `tailwind.config.ts`)

```ts
import { type Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}', './stories/**/*.{ts,tsx}', './index.html'],
  theme: {
    extend: {
      colors: {
        primary: 'hsl(var(--color-primary) / <alpha-value>)',
        secondary: 'hsl(var(--color-secondary) / <alpha-value>)',
        bg: 'hsl(var(--color-bg) / <alpha-value>)',
        surface: 'hsl(var(--color-surface) / <alpha-value>)',
        border: 'hsl(var(--color-border) / <alpha-value>)',
        fg: 'hsl(var(--color-fg) / <alpha-value>)',
        success: 'hsl(var(--color-success) / <alpha-value>)',
        warning: 'hsl(var(--color-warning) / <alpha-value>)',
        error: 'hsl(var(--color-error) / <alpha-value>)',
      },
      spacing: {
        // 4‑based scale – alias core spacings via tokens
        px: '1px',
        0: '0',
        1: '0.25rem', // 4px
        2: '0.5rem', // 8px
        3: '0.75rem', // 12px
        4: '1rem', // 16px
        5: '1.25rem', // 20px
        6: '1.5rem', // 24px
        8: '2rem', // 32px
        10: '2.5rem', // 40px
        12: '3rem', // 48px
        16: '4rem', // 64px
        20: '5rem', // 80px
        24: '6rem', // 96px
        32: '8rem', //128px
        40: '10rem', //160px
        48: '12rem', //192px
        56: '14rem', //224px
        64: '16rem', //256px
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }], // 12px
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
      },
      borderRadius: {
        none: '0',
        sm: '0.125rem', // 2px
        DEFAULT: '0.5rem', // 8px (matches shadcn/ui default)
        lg: '1rem', // 16px
        xl: '1.5rem', // 24px – hero cards
        full: '9999px',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        DEFAULT:
          '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      },
    },
  },
  plugins: [],
} satisfies Config;
```

---

## 2 · Spacing scale & layout grid

- **Base unit**: `4 px` (0.25 rem). Keeps rhythm tight while mapping naturally to Tailwind’s default scale.
- Use multiples of 4 px for margin/padding; leverage the extended spacing above (tokenised).
- **Grid container**: 12‑column fluid grid; gutters 16 px on mobile, 24 px on ≥ md breakpoint.

## 3 · Typography scale

| Token  | Size (rem) | Notes            |
| ------ | ---------- | ---------------- |
| `xs`   | 0.75       | Caption / helper |
| `sm`   | 0.875      | Form labels      |
| `base` | 1          | Body text        |
| `lg`   | 1.125      | Body L           |
| `xl`   | 1.25       | Section heading  |
| `2xl`  | 1.5        | H4               |
| `3xl`  | 1.875      | H3               |
| `4xl`  | 2.25       | H2               |
| `5xl`  | 3          | H1               |

Font family live in Tailwind preset; we’ll default to `Inter, ui-sans-serif`.

## 4 · Elevation & borders

- **Elevation tiers**: `sm`, `DEFAULT`, `md`, `lg` above — align to Material/Apple guidelines. Use sparingly.
- **Border radius**: see tokens above. Stick to `DEFAULT` (8 px) for most components; `lg` on modals/hero cards.

## 5 · Dark‑mode strategy

1. `html.dark` class toggles dark scheme.
2. Prefer system preference: `@media (prefers-color-scheme: dark)` sets class via a small JS snippet in `index.html` before React mounts (avoids flash).
3. Only CSS variables change; component markup stays identical.

---

### Storybook integration (T-3.3.4)

- Install `@storybook/addon-themes` → allows toggling `light / dark` tokens in the toolbar.
- Create a `Design Tokens` story that renders swatch tables by reading the CSS variables—makes visual QA trivial.

---

**Next**: paste the Tailwind snippet into `tailwind.config.ts`, commit this doc under `/docs/ui/`, and we can move on to integrating shadcn/ui component stories.
