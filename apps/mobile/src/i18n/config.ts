import { getRequestConfig } from 'next-intl/server';

// Can be imported from a shared config
export const locales = ['en', 'es', 'zh-CN'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming locale is valid and ensure it's never undefined
  const validatedLocale: string =
    locale && locales.includes(locale as Locale) ? locale : defaultLocale;

  return {
    locale: validatedLocale,
    messages: (await import(`./messages/${validatedLocale}.json`)).default,
  };
});
