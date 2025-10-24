import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import useProfileStore from '../store/useProfileStore';
import Dashboard from './Dashboard';
import FileDeletion from './FileDeletion';
import Statistics from './Statistics';
import Changelog from './Changelog';
import About from './About';
import './MainApp.css';

export default function MainApp({ onLogout }) {
  const { t, language, changeLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { currentProfile, clearProfile } = useProfileStore();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    clearProfile();
    onLogout();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />;
      case 'delete':
        return <FileDeletion />;
      case 'statistics':
        return <Statistics />;
      case 'changelog':
        return <Changelog />;
      case 'about':
        return <About />;
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="main-app">
      {/* Animated background shapes */}
      <div className="app-bg-shape shape-1"></div>
      <div className="app-bg-shape shape-2"></div>
      <div className="app-bg-shape shape-3"></div>
      <div className="app-bg-shape shape-4"></div>
      <div className="app-bg-shape shape-5"></div>

      {/* Geometric decorations - rotating squares */}
      <div className="app-geometric geo-1"></div>
      <div className="app-geometric geo-2"></div>
      <div className="app-geometric geo-3"></div>
      <div className="app-geometric geo-4"></div>
      <div className="app-geometric geo-5"></div>

      {/* Header */}
      <header className="app-header">
        {/* Logo */}
        <div className="header-logo">
          <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Folder outline */}
            <path
              d="M6 14 L6 30 C6 31 7 32 8 32 L32 32 C33 32 34 31 34 30 L34 14 C34 13 33 12 32 12 L22 12 L19 9 L8 9 C7 9 6 10 6 11 Z"
              stroke="url(#logo-gradient)"
              strokeWidth="1.5"
              fill="url(#folder-fill)"
            />
            {/* Trash bin in center */}
            <g transform="translate(14, 16)">
              <path d="M4 5 L4 20 C4 20.5 4.5 21 5 21 L9 21 C9.5 21 10 20.5 10 20 L10 5"
                    stroke="url(#logo-gradient2)"
                    strokeWidth="1.5"
                    fill="none"
                    strokeLinecap="round"/>
              <line x1="3" y1="5" x2="11" y2="5"
                    stroke="url(#logo-gradient2)"
                    strokeWidth="1.5"
                    strokeLinecap="round"/>
              <path d="M5.5 3 L6 5 L8 5 L8.5 3 C8.5 2.5 8.2 2 7.5 2 L6.5 2 C5.8 2 5.5 2.5 5.5 3"
                    stroke="url(#logo-gradient2)"
                    strokeWidth="1.5"
                    fill="none"/>
              <line x1="6" y1="8" x2="6" y2="17" stroke="url(#logo-gradient2)" strokeWidth="1" strokeLinecap="round"/>
              <line x1="8" y1="8" x2="8" y2="17" stroke="url(#logo-gradient2)" strokeWidth="1" strokeLinecap="round"/>
            </g>
            <defs>
              <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00172D" />
                <stop offset="50%" stopColor="#0066CC" />
                <stop offset="100%" stopColor="#00A3FF" />
              </linearGradient>
              <linearGradient id="logo-gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00D9FF" />
                <stop offset="100%" stopColor="#00A3FF" />
              </linearGradient>
              <linearGradient id="folder-fill" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00172D" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#0066CC" stopOpacity="0.1" />
              </linearGradient>
            </defs>
          </svg>
          <span className="gradient-text">FnF Delete</span>
        </div>

        {/* Centered Navigation */}
        <nav className="header-nav">
          <button
            className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentPage('dashboard')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            {t('nav.dashboard')}
          </button>

          <button
            className={`nav-item ${currentPage === 'delete' ? 'active' : ''}`}
            onClick={() => setCurrentPage('delete')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            {t('nav.delete')}
          </button>

          <button
            className={`nav-item ${currentPage === 'statistics' ? 'active' : ''}`}
            onClick={() => setCurrentPage('statistics')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            {t('nav.statistics')}
          </button>
        </nav>

        {/* Right Side Controls */}
        <div className="header-controls">
          {/* Profile Button with Dropdown */}
          <div className="profile-dropdown-container" ref={dropdownRef}>
            <button
              className="profile-btn"
              onClick={() => setShowUserMenu(!showUserMenu)}
              title={t('profile.select')}
            >
              <div
                className="profile-avatar"
                style={{ background: currentProfile?.avatar_color }}
              >
                {currentProfile?.name.charAt(0).toUpperCase()}
              </div>
              <span className="profile-name">{currentProfile?.name}</span>
              <svg
                className="dropdown-arrow"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6l4 4 4-4"
                />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="profile-dropdown-menu">
                {/* Language Option */}
                <button
                  className="dropdown-item"
                  onClick={() => {
                    changeLanguage(language === 'tr' ? 'en' : 'tr');
                    setShowUserMenu(false);
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="18" height="18">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                    />
                  </svg>
                  <span>{t('settings.language')}: {language.toUpperCase()}</span>
                </button>

                {/* Theme Option */}
                <button
                  className="dropdown-item"
                  onClick={() => {
                    toggleTheme();
                    setShowUserMenu(false);
                  }}
                >
                  {theme === 'dark' ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="18" height="18">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="18" height="18">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                      />
                    </svg>
                  )}
                  <span>{t('settings.theme')}: {theme === 'dark' ? t('settings.dark') : t('settings.light')}</span>
                </button>

                <div className="dropdown-divider"></div>

                {/* Changelog */}
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setCurrentPage('changelog');
                    setShowUserMenu(false);
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="18" height="18">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                    />
                  </svg>
                  <span>{t('nav.changelog')}</span>
                </button>

                {/* About */}
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setCurrentPage('about');
                    setShowUserMenu(false);
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="18" height="18">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{t('common.about')}</span>
                </button>

                {/* Change Profile */}
                <button
                  className="dropdown-item"
                  onClick={() => {
                    handleLogout();
                    setShowUserMenu(false);
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="18" height="18">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  <span>{t('profile.select')}</span>
                </button>
              </div>
            )}
          </div>

          {/* Window Controls */}
          <div className="window-controls">
            <button
              className="window-btn minimize-btn"
              onClick={() => window.electronAPI.minimizeWindow()}
              title="Minimize"
            >
              <svg width="10" height="1" viewBox="0 0 10 1">
                <path d="M0 0h10v1H0z" fill="currentColor" />
              </svg>
            </button>
            <button
              className="window-btn maximize-btn"
              onClick={() => window.electronAPI.maximizeWindow()}
              title="Maximize"
            >
              <svg width="10" height="10" viewBox="0 0 10 10">
                <path d="M0 0v10h10V0H0zm1 1h8v8H1V1z" fill="currentColor" />
              </svg>
            </button>
            <button
              className="window-btn close-btn"
              onClick={() => window.electronAPI.closeWindow()}
              title="Close"
            >
              <svg width="10" height="10" viewBox="0 0 10 10">
                <path
                  d="M0 0l10 10M10 0L0 10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <div className="page-content">
        {renderPage()}
      </div>
    </div>
  );
}
