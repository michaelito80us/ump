import { getTranslations } from 'next-intl/server';
import { MyScheduleView } from '../../../src/components/MyScheduleView';

// Force dynamic rendering to prevent prerendering issues
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function SchedulePage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'schedule' });

  return (
    <div className="min-h-screen bg-gray-50" data-testid="schedule-view">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-3">
          <h1 className="text-xl font-semibold text-gray-900">
            {t('title')}
          </h1>
          <p className="text-sm text-gray-600 mt-1">{t('upcomingMatches')}</p>
        </div>
      </div>

      {/* Content */}
      <MyScheduleView />
    </div>
  );
}