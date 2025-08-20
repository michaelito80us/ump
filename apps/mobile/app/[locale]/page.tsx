import { getTranslations, getMessages } from 'next-intl/server';
import { LanguageSwitcher } from '../../src/components/LanguageSwitcher';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;

  // Try getting translations with explicit locale
  const t = await getTranslations({ locale, namespace: 'common' });
  const messages = await getMessages({ locale });

  // Debug: Check what messages are being loaded
  const commonMessages = messages?.common as Record<string, unknown>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <LanguageSwitcher />

      <div className="mt-6 space-y-4">
        <h1 className="text-3xl font-bold text-blue-600">
          {t('welcome')} - {t('appName')}
        </h1>

        <div className="bg-gray-100 p-4 rounded">
          <p className="text-sm text-gray-600">
            Current locale: <strong>{locale}</strong>
          </p>
          <p className="text-sm text-gray-600">{t('appDescription')}</p>
        </div>

        {/* Navigation Links for Testing */}
        <div className="space-y-2">
          <Link
            href={`/${locale}/test`}
            className="block p-3 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
          >
            📋 i18n Test Page
          </Link>

          <Link
            href={`/${locale}/test-pwa`}
            className="block p-3 bg-green-100 rounded hover:bg-green-200 transition-colors"
          >
            🚀 PWA Test Page
          </Link>

          <Link
            href={`/${locale}/test-graphql`}
            className="block p-3 bg-purple-100 rounded hover:bg-purple-200 transition-colors"
          >
            🔗 GraphQL Test Page
          </Link>
        </div>

        <div className="mt-6 p-4 bg-gray-100 rounded">
          <h2 className="font-semibold mb-2">PWA Features to Test:</h2>
          <ul className="text-sm space-y-1">
            <li>• 📱 Install app prompt</li>
            <li>• 🔄 Offline data storage</li>
            <li>• 📶 Online/offline indicators</li>
            <li>• 🔄 Background sync</li>
          </ul>
        </div>

        {/* Debug information */}
        <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
          <h3 className="font-semibold text-yellow-800">Debug Info:</h3>
          <p className="text-sm">Locale: {locale}</p>
          <p className="text-sm">
            Welcome translation:{' '}
            {String(commonMessages?.welcome || 'NOT FOUND')}
          </p>
          <p className="text-sm">
            App name translation:{' '}
            {String(commonMessages?.appName || 'NOT FOUND')}
          </p>
          <p className="text-sm">Messages loaded: {messages ? 'YES' : 'NO'}</p>
          <p className="text-sm">t('welcome'): {t('welcome')}</p>
          <p className="text-sm">t('appName'): {t('appName')}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-50 p-3 rounded">
            <h3 className="font-semibold text-green-800">{t('success')}</h3>
            <p className="text-sm text-green-800">{t('save')}</p>
          </div>

          <div className="bg-red-50 p-3 rounded">
            <h3 className="font-semibold text-red-800">{t('error')}</h3>
            <p className="text-sm text-red-800">{t('cancel')}</p>
          </div>
        </div>

        <div className="bg-blue-50 p-3 rounded">
          <h3 className="font-semibold text-blue-800">Navigation</h3>
          <div className="text-sm text-blue-600 space-x-2">
            <span>{t('loading')}</span> • <span>{t('search')}</span> •
            <span>{t('filter')}</span> • <span>{t('refresh')}</span>
          </div>
        </div>

        {/* Tournament Registration Section */}
        <div className="bg-green-50 p-4 rounded border border-green-200">
          <h3 className="font-semibold text-green-800 mb-2">Tournament Registration</h3>
          <p className="text-sm text-green-700 mb-3">
            Register your team for upcoming tournaments
          </p>
          <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
            Register Team
          </button>
        </div>
      </div>
    </div>
  );
}
