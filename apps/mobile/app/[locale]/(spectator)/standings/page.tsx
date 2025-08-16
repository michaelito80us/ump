import { getTranslations } from 'next-intl/server';
import { LeaderboardView } from '../../../../src/components/LeaderboardView';

// Force dynamic rendering to prevent prerendering issues with Apollo subscriptions
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function StandingsPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'standings' });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-3">
          <h1 className="text-xl font-semibold text-gray-900">
            {t('standings')}
          </h1>
          <p className="text-sm text-gray-600 mt-1">{t('currentRankings')}</p>
        </div>
      </div>

      {/* Content */}
      <LeaderboardView />
    </div>
  );
}
