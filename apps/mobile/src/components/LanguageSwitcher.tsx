'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  const switchLanguage = (newLocale: string) => {
    // Remove the current locale from pathname and add the new one
    const pathWithoutLocale = pathname.replace(`/${locale}`, '');
    router.push(`/${newLocale}${pathWithoutLocale}`);
  };

  return (
    <div className="flex gap-2 p-4">
      <button
        data-testid="language-switcher-en"
        onClick={() => switchLanguage('en')}
        className={`px-3 py-1 rounded ${
          locale === 'en'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        English
      </button>
      <button
        data-testid="language-switcher-es"
        onClick={() => switchLanguage('es')}
        className={`px-3 py-1 rounded ${
          locale === 'es'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        Español
      </button>
    </div>
  );
}
