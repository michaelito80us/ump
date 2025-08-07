import { getTranslations } from 'next-intl/server';
import { LiveScoresView } from '../../../../src/components/LiveScoresView';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function LiveScoresPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'live' });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-3">
          <h1 className="text-xl font-semibold text-gray-900">
            {t('liveScores')}
          </h1>
          <p className="text-sm text-gray-600 mt-1">{t('currentMatches')}</p>
        </div>
      </div>

      {/* Content */}
      <LiveScoresView />
    </div>
  );
}
