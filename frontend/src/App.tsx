import React, { Suspense, lazy } from 'react';
import GameLobby from './pages/GameLobby';
import { RouteErrorBoundary } from './components/v1/RouteErrorBoundary';
import ProfileSettings from './pages/ProfileSettings';
import { I18nProvider, useI18n } from './i18n/provider';
import LocaleSwitcher from './components/LocaleSwitcher';
import Breadcrumbs from './components/BreadCrumbs';

import { ModalStackProvider } from './components/v1/modal-stack';
import { FeatureFlagsProvider } from './services/feature-flags';
import CommandPalette, { type Command } from './components/v1/CommandPalette';
import { BrowserRouter } from 'react-router-dom';
import { useErrorStore } from './store/errorStore';

const DevContractCallSimulatorPanel = import.meta.env.DEV
  ? lazy(() =>
      import('./components/dev/ContractCallSimulatorPanel').then((m) => ({
        default: m.ContractCallSimulatorPanel,
      })),
    )
  : undefined;

const toneLabelMap = {
  success: 'Success',
  info: 'Info',
  warning: 'Warning',
  error: 'Error',
} as const;

function NotificationCenter(): React.JSX.Element | null {
  const toasts = useErrorStore((state) => state.toasts);
  const toastHistory = useErrorStore((state) => state.toastHistory);
  const dismissToast = useErrorStore((state) => state.dismissToast);
  const clearToastHistory = useErrorStore((state) => state.clearToastHistory);
  const [historyOpen, setHistoryOpen] = React.useState(false);

  if (toasts.length === 0 && toastHistory.length === 0) {
    return null;
  }

  return (
    <aside className="toast-center" aria-label="Notifications">
      <div className="toast-center__stack">
        {toasts.map((toast) => (
          <section
            key={toast.id}
            className={`toast-center__toast toast-center__toast--${toast.tone}`}
            role="status"
            aria-live="polite"
          >
            <div className="toast-center__toast-header">
              <span className="toast-center__tone">{toneLabelMap[toast.tone]}</span>
              <button
                type="button"
                className="toast-center__dismiss"
                aria-label={`Dismiss ${toast.title}`}
                onClick={() => dismissToast(toast.id)}
              >
                Dismiss
              </button>
            </div>
            <strong className="toast-center__title">{toast.title}</strong>
            <p className="toast-center__message">{toast.message}</p>
          </section>
        ))}
      </div>

      {toastHistory.length > 0 && (
        <div className="toast-center__history">
          <button
            type="button"
            className="toast-center__history-toggle"
            aria-expanded={historyOpen}
            onClick={() => setHistoryOpen((current) => !current)}
          >
            {historyOpen ? 'Hide recent notifications' : 'Show recent notifications'}
          </button>
          {historyOpen && (
            <div className="toast-center__history-panel">
              <div className="toast-center__history-header">
                <strong>Recent notifications</strong>
                <button
                  type="button"
                  className="toast-center__history-clear"
                  onClick={clearToastHistory}
                >
                  Clear
                </button>
              </div>
              <ul className="toast-center__history-list">
                {toastHistory.map((toast) => (
                  <li key={toast.id} className="toast-center__history-item">
                    <span>{toast.title}</span>
                    <span>{toast.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}

const AppContent: React.FC = () => {
  const { t } = useI18n();
  const [route, setRoute] = React.useState<'lobby' | 'profile' | 'games'>('lobby');

  const commands: Command[] = [
    {
      id: 'go-lobby',
      label: 'Go to Lobby',
      description: 'Open the game lobby',
      action: () => setRoute('lobby'),
    },
    {
      id: 'go-profile',
      label: 'Go to Profile Settings',
      description: 'Open the profile settings page',
      action: () => setRoute('profile'),
    },
  ];

  return (
    <div className="app-container">
      <CommandPalette commands={commands} />
      <NotificationCenter />
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <header className="app-header" role="banner">
        <div className="logo">{t('app.title')}</div>
        <nav aria-label="Main navigation">
          <ul>
            <li>
              <button type="button" onClick={() => setRoute('lobby')} className={route === 'lobby' ? 'active' : ''}>
                {t('nav.lobby')}
              </button>
            </li>
            <li>
              <button type="button" onClick={() => setRoute('games')} className={route === 'games' ? 'active' : ''}>
                {t('nav.games')}
              </button>
            </li>
            <li>
              <button type="button" onClick={() => setRoute('profile')} className={route === 'profile' ? 'active' : ''}>
                {t('nav.profile')}
              </button>
            </li>
          </ul>
        </nav>
        <LocaleSwitcher />
      </header>
      <Breadcrumbs />
      
      <main className="app-content" id="main-content">
        <RouteErrorBoundary>
          {route === 'profile' ? <ProfileSettings /> : <GameLobby />}
        </RouteErrorBoundary>
      </main>

      <footer className="app-footer" role="contentinfo">
        <div className="footer-content">
          <p>{t('footer.copyright')}</p>
          <div className="footer-links">
            <a href="/terms">{t('footer.terms')}</a>
            <a href="/privacy">{t('footer.privacy')}</a>
          </div>
        </div>
      </footer>

      {import.meta.env.DEV && DevContractCallSimulatorPanel ? (
        <Suspense fallback={null}>
          <DevContractCallSimulatorPanel />
        </Suspense>
      ) : null}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <FeatureFlagsProvider>
        <I18nProvider>
          <ModalStackProvider>
            <AppContent />
          </ModalStackProvider>
        </I18nProvider>
      </FeatureFlagsProvider>
    </BrowserRouter>
  );
};

export default App;
