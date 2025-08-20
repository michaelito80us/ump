import { useTranslations } from 'next-intl';
import { MyScheduleView } from '../../../components/MyScheduleView';
import { OfflineIndicator } from '../../../components/OfflineIndicator';
import Link from 'next/link';

export default function SchedulePage() {
  const t = useTranslations('schedule');

  return (
    <div className="min-h-screen bg-gray-50">
      <OfflineIndicator />
      
      <div className="container mx-auto px-4 py-8">
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {t('title', { default: 'My Schedule' })}
              </h1>
              <p className="text-gray-600">
                {t('subtitle', { default: 'View your upcoming matches and tournament schedule' })}
              </p>
            </div>
            <Link 
              href="/"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {t('backToHome', { default: '← Back to Home' })}
            </Link>
          </div>
        </header>

        <div data-testid="schedule-view">
          <MyScheduleView />
        </div>
      </div>
    </div>
  );
}