import { useTranslations } from 'next-intl';
import { LiveScoresView } from '../../../components/LiveScoresView';
import { OfflineIndicator } from '../../../components/OfflineIndicator';
import Link from 'next/link';

export default function LivePage() {
  const t = useTranslations('live');

  return (
    <div className="min-h-screen bg-gray-50">
      <OfflineIndicator />
      
      <div className="container mx-auto px-4 py-8">
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 bg-red-500 rounded-full animate-pulse"
                  data-testid="live-indicator"
                ></div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {t('title', { default: 'Live Scores' })}
                </h1>
              </div>
            </div>
            <Link 
              href="/"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {t('backToHome', { default: '← Back to Home' })}
            </Link>
          </div>
          <p className="text-gray-600">
            {t('subtitle', { default: 'Real-time match updates and live scores' })}
          </p>
        </header>

        <div data-testid="live-scores-view">
          <LiveScoresView />
        </div>
      </div>
    </div>
  );
}