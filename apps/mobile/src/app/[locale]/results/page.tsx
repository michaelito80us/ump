import { useTranslations } from 'next-intl';
import { OfflineIndicator } from '../../../components/OfflineIndicator';
import { TournamentArchiveView } from '../../../components/TournamentArchiveView';
import Link from 'next/link';

export default function ResultsPage() {
  const t = useTranslations('results');

  // Mock tournament data - in real implementation this would come from API
  const tournamentData = {
    name: 'Rugby Championship 2024',
    status: 'completed',
    champion: {
      id: 'team-1',
      name: 'Thunder Bolts',
      logo: '⚡'
    },
    runnerUp: {
      id: 'team-2', 
      name: 'Fire Dragons',
      logo: '🔥'
    },
    completedAt: new Date().toISOString()
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <OfflineIndicator />
      
      <div className="container mx-auto px-4 py-8">
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {t('title', { default: 'Tournament Results' })}
              </h1>
              <p className="text-gray-600">
                {t('subtitle', { default: 'Final results and tournament standings' })}
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

        {/* Tournament Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="text-center">
            <div className="text-4xl mb-4">🏆</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {tournamentData.name}
            </h2>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              {t('tournamentComplete', { default: 'Tournament Complete' })}
            </div>
          </div>
        </div>

        {/* Champion Section */}
        <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg shadow-md p-6 mb-6 text-white">
          <div className="text-center">
            <div className="text-6xl mb-4">👑</div>
            <h3 className="text-2xl font-bold mb-2">
              {t('champion', { default: 'Champion' })}
            </h3>
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl">{tournamentData.champion.logo}</span>
              <span className="text-3xl font-bold">{tournamentData.champion.name}</span>
            </div>
          </div>
        </div>

        {/* Runner-up Section */}
        <div className="bg-gradient-to-r from-gray-400 to-gray-600 rounded-lg shadow-md p-6 mb-6 text-white">
          <div className="text-center">
            <div className="text-4xl mb-4">🥈</div>
            <h3 className="text-xl font-bold mb-2">
              {t('runnerUp', { default: 'Runner-up' })}
            </h3>
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl">{tournamentData.runnerUp.logo}</span>
              <span className="text-2xl font-semibold">{tournamentData.runnerUp.name}</span>
            </div>
          </div>
        </div>

        {/* Tournament Archive */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t('fullResults', { default: 'Full Tournament Results' })}
          </h3>
          <TournamentArchiveView />
        </div>
      </div>
    </div>
  );
}