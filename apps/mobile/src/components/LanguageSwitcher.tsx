'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  const switchLanguage = (newLocale: string) => {
    // Split the pathname into segments
    const segments = pathname.split('/').filter(Boolean);

    // If the first segment is a locale, replace it
    if (
      segments.length > 0 &&
      (segments[0] === 'en' || segments[0] === 'es' || segments[0] === 'zh-CN')
    ) {
      segments[0] = newLocale;
    } else {
      // If no locale in path, add it at the beginning
      segments.unshift(newLocale);
    }

    // Reconstruct the path
    const newPath = '/' + segments.join('/');
    router.push(newPath);
  };

  return (
    <div className="flex gap-2 p-4">
      <button
        data-testid="language-switcher-en"
        onClick={() => switchLanguage('en')}
        className={`px-3 py-1 rounded ${
          locale === 'en'
            ? 'bg-blue-700 text-white'
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
            ? 'bg-blue-700 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        Español
      </button>
      <button
        data-testid="language-switcher-zh-CN"
        onClick={() => switchLanguage('zh-CN')}
        className={`px-3 py-1 rounded ${
          locale === 'zh-CN'
            ? 'bg-blue-700 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        中文
      </button>
    </div>
  );
}
