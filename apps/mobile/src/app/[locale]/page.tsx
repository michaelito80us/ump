import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { OfflineIndicator } from '../../components/OfflineIndicator';

export default function HomePage() {
  const t = useTranslations('common');

  return (
    <div className="min-h-screen bg-gray-50">
      <OfflineIndicator />

      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('appTitle', { default: 'Tournament Management' })}
          </h1>
          <p className="text-gray-600">
            {t('appSubtitle', {
              default: 'Live scores, schedules, and results',
            })}
          </p>
        </header>

        <nav className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link
            href="/schedule"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            data-testid="nav-schedule"
          >
            <div className="text-center">
              <div className="text-2xl mb-2">📅</div>
              <h3 className="font-semibold text-gray-900">
                {t('schedule', { default: 'Schedule' })}
              </h3>
              <p className="text-sm text-gray-600">
                {t('scheduleDesc', { default: 'View match schedule' })}
              </p>
            </div>
          </Link>

          <Link
            href="/live"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            data-testid="nav-live"
          >
            <div className="text-center">
              <div className="text-2xl mb-2">🔴</div>
              <h3 className="font-semibold text-gray-900">
                {t('liveScores', { default: 'Live Scores' })}
              </h3>
              <p className="text-sm text-gray-600">
                {t('liveScoresDesc', { default: 'Real-time match updates' })}
              </p>
            </div>
          </Link>

          <Link
            href="/results"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            data-testid="nav-results"
          >
            <div className="text-center">
              <div className="text-2xl mb-2">🏆</div>
              <h3 className="font-semibold text-gray-900">
                {t('results', { default: 'Results' })}
              </h3>
              <p className="text-sm text-gray-600">
                {t('resultsDesc', { default: 'Final results and standings' })}
              </p>
            </div>
          </Link>

          <Link
            href="/setup"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            data-testid="nav-setup"
          >
            <div className="text-center">
              <div className="text-2xl mb-2">⚙️</div>
              <h3 className="font-semibold text-gray-900">
                {t('setup', { default: 'Setup' })}
              </h3>
              <p className="text-sm text-gray-600">
                {t('setupDesc', { default: 'Create tournament' })}
              </p>
            </div>
          </Link>
        </nav>

        <section className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {t('tournamentRegistration', {
              default: 'Tournament Registration',
            })}
          </h2>
          <p className="text-gray-600 mb-4">
            {t('registrationDesc', {
              default: 'Register your team for upcoming tournaments',
            })}
          </p>
          <div className="text-center">
            <span className="text-sm text-gray-500">
              {t('registrationAvailable', {
                default: 'Registration available for upcoming tournaments',
              })}
            </span>
          </div>
        </section>

        <footer className="text-center mt-8 text-gray-500 text-sm">
          <p>{t('footer', { default: 'Tournament Management Platform' })}</p>
          <div className="mt-2">
            <span data-testid="language-indicator">
              {t('language', { default: 'English' })}
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
