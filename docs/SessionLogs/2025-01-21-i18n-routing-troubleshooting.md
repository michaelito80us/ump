# Session Log: i18n Routing Troubleshooting

**Date:** January 21, 2025  
**Task:** Troubleshooting next-intl routing issues in UMP Mobile app  
**Status:** In Progress 🔄

## Summary

Continued work from previous session to resolve next-intl internationalization routing issues. The basic dynamic routing with `[locale]` works without next-intl, but adding next-intl features causes 404 errors.

## Issues Encountered

### 1. next-intl Integration Causing 404 Errors

- **Problem:** When adding `getTranslations` and `getMessages` from next-intl, the `/en` route returns 404
- **Root Cause:** Potential conflict between next-intl plugin, middleware, and i18n config validation
- **Current Status:** Investigating step-by-step integration

### 2. Multiple Default Exports Error

- **Problem:** TypeScript error about multiple default exports in `next.config.mjs`
- **Solution:** ✅ Fixed by properly combining configurations with single export
- **Code:** `export default withNextIntl(nextConfig);`

## Progress Made

### ✅ Completed

1. **Basic Dynamic Routing Working**

   - `[locale]` folder structure functional
   - Async params handling in Next.js 15 implemented
   - Routes like `/en` display correct locale parameter

2. **next-intl Plugin Configuration**

   - Successfully enabled next-intl plugin in `next.config.mjs`
   - Plugin compiles without errors
   - Config path correctly set to `'./src/i18n/config.ts'`

3. **Middleware Restoration**
   - Moved `middleware.ts.bak` back to `middleware.ts`
   - Middleware compiles successfully
   - Locale routing configuration appears correct

### 🔄 Current Investigation

- Testing root path (`/`) vs direct locale path (`/en`)
- Investigating if `notFound()` validation in i18n config is too strict
- Step-by-step reintroduction of next-intl features

## Technical Details

### Working Configuration (Without Translations)

```tsx
// apps/mobile/app/[locale]/layout.tsx - Basic version
export default async function Layout({ children, params }: LayoutProps) {
  const { locale } = await params;
  return (
    <html lang={locale}>
      <body>
        <div>
          <p>Locale: {locale}</p>
          {children}
        </div>
      </body>
    </html>
  );
}
```

### Problematic Configuration (With next-intl)

```tsx
// Adding these lines causes 404:
const messages = await getMessages();
const t = await getTranslations('common');
```

### Current File Structure

apps/mobile/
├── app/
│ ├── [locale]/
│ │ ├── layout.tsx
│ │ └── page.tsx
│ └── globals.css
├── src/
│ └── i18n/
│ ├── config.ts
│ └── messages/
│ ├── en.json
│ └── es.json
├── middleware.ts
└── next.config.mjs

## Next Steps

1. Test root path (`/`) to see if middleware redirects properly
2. Temporarily remove `notFound()` validation from i18n config
3. Add next-intl features incrementally to isolate the issue
4. Consider alternative next-intl setup approaches

## Error Logs

GET /en 404 in 7949ms
✓ Compiled /middleware in 415ms (137 modules)
✓ Compiled /[locale] in 5.4s (775 modules)

## Resources

- [next-intl App Router Documentation](https://next-intl.dev/docs/getting-started/app-router)
- Previous session: `2025-01-20-i18n-test-page-integration.md`

---

**Last Updated:** January 21, 2025  
**Next Session:** Continue troubleshooting next-intl integration
