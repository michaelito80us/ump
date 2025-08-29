import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

// Force dynamic rendering to prevent prerendering issues
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function TestPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'test' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4 text-gray-900">{t('title')}</h1>
        <p className="text-lg text-gray-600 mb-2">{t('description')}</p>
        <p className="text-sm text-blue-600">{t('i18nIntegration')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-green-800 mb-3">
            ✅ {t('layoutFixed')}
          </h2>
          <p className="text-green-700 text-sm">{t('layoutDescription')}</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-800 mb-3">
            🌍 {t('currentLocale')}
          </h2>
          <p className="text-blue-700 text-lg font-mono">
            {locale.toUpperCase()}
          </p>
          <p className="text-blue-600 text-sm mt-2">{tCommon('appName')}</p>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          🚀 Translation Features Demo
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-white p-3 rounded border">
            <strong className="text-gray-700">{tCommon('success')}:</strong>
            <p className="text-green-800">{tCommon('save')}</p>
          </div>
          <div className="bg-white p-3 rounded border">
            <strong className="text-gray-700">{tCommon('error')}:</strong>
            <p className="text-red-800">{tCommon('cancel')}</p>
          </div>
          <div className="bg-white p-3 rounded border">
            <strong className="text-gray-700">Action:</strong>
            <p className="text-blue-600">{tCommon('search')}</p>
          </div>
          <div className="bg-white p-3 rounded border">
            <strong className="text-gray-700">Navigation:</strong>
            <p className="text-purple-600">{tCommon('refresh')}</p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <Link
          href={`/${locale}`}
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          ← {t('backToHome')}
        </Link>
      </div>
    </div>
  );
}
