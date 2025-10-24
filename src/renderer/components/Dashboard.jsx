import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import useProfileStore from '../store/useProfileStore';
import BrainyTechDarkLogo from '../assets/BrainyTechDarkLogo.png';
import BrainyTechLightLogo from '../assets/BrainyTechLightLogo.png';
import './Dashboard.css';

export default function Dashboard({ onNavigate }) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { currentProfile } = useProfileStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (currentProfile) {
      loadStats();
    }
  }, [currentProfile]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const dashboardStats = await window.electronAPI.getDashboardStats(currentProfile.id);
      setStats(dashboardStats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatNumber = (num) => {
    if (!num || num === 0) return '0';
    return num.toLocaleString();
  };

  if (loading) {
    return (
      <div className="dashboard loading-state">
        <div className="spinner"></div>
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Stats Grid */}
      <div className="stats-section">
        <div className="stats-grid">
          <div className="stat-card card">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #004C99, #0066CC)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value">{formatNumber(stats?.total_operations || 0)}</div>
              <div className="stat-label">{t('dashboard.stats.operations')}</div>
            </div>
          </div>

          <div className="stat-card card">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #0066CC, #00A3FF)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value">{formatNumber(stats?.total_files_deleted || 0)}</div>
              <div className="stat-label">{t('dashboard.stats.filesDeleted')}</div>
            </div>
          </div>

          <div className="stat-card card">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #00A3FF, #00D9A3)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                />
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value">{formatBytes(stats?.total_size_deleted || 0)}</div>
              <div className="stat-label">{t('dashboard.stats.sizeDeleted')}</div>
            </div>
          </div>

          <div className="stat-card card">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #9065b0, #e255a1)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                />
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value">{formatNumber(stats?.unique_extensions || 0)}</div>
              <div className="stat-label">{t('dashboard.stats.extensions')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-icon-large">
          <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Outer glow circles */}
            <circle cx="100" cy="100" r="93" stroke="url(#heroGradient1)" strokeWidth="2.5" opacity="0.2" />
            <circle cx="100" cy="100" r="87" stroke="url(#heroGradient1)" strokeWidth="1.5" opacity="0.15" />

            {/* Folder outline */}
            <path
              d="M30 70 L30 150 C30 155 35 160 40 160 L160 160 C165 160 170 155 170 150 L170 70 C170 65 165 60 160 60 L110 60 L95 45 L40 45 C35 45 30 50 30 55 Z"
              stroke="url(#heroGradient1)"
              strokeWidth="6"
              fill="url(#folderFill)"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Trash bin in center */}
            <g transform="translate(70, 80)">
              <path d="M20 25 L20 100 C20 102.5 22.5 105 25 105 L45 105 C47.5 105 50 102.5 50 100 L50 25"
                    stroke="url(#heroGradient3)"
                    strokeWidth="6"
                    fill="none"
                    strokeLinecap="round"/>
              <line x1="15" y1="25" x2="55" y2="25"
                    stroke="url(#heroGradient3)"
                    strokeWidth="6"
                    strokeLinecap="round"/>
              <path d="M27.5 15 L30 25 L40 25 L42.5 15 C42.5 12.5 41 10 37.5 10 L32.5 10 C29 10 27.5 12.5 27.5 15"
                    stroke="url(#heroGradient3)"
                    strokeWidth="6"
                    fill="none"/>
              <line x1="30" y1="40" x2="30" y2="85" stroke="url(#heroGradient3)" strokeWidth="5" strokeLinecap="round"/>
              <line x1="40" y1="40" x2="40" y2="85" stroke="url(#heroGradient3)" strokeWidth="5" strokeLinecap="round"/>
            </g>

            <defs>
              <linearGradient id="heroGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00172D" />
                <stop offset="50%" stopColor="#0066CC" />
                <stop offset="100%" stopColor="#00A3FF" />
              </linearGradient>
              <linearGradient id="heroGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0066CC" />
                <stop offset="100%" stopColor="#00A3FF" />
              </linearGradient>
              <linearGradient id="heroGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00D9FF" />
                <stop offset="100%" stopColor="#00A3FF" />
              </linearGradient>
              <linearGradient id="folderFill" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00172D" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#0066CC" stopOpacity="0.1" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <h1 className="hero-title">
          {t('dashboard.welcome')}, <span className="gradient-text">{currentProfile?.name}</span>!
        </h1>

        <p className="hero-subtitle">
          Dosyalarınızı güvenli bir şekilde silin ve istatistiklerinizi takip edin
        </p>

        <button className="hero-cta-btn" onClick={() => onNavigate('delete')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="24" height="24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          {t('delete.title')}
        </button>
      </div>

      {/* Footer */}
      <footer className="dashboard-footer">
        <div className="footer-content">
          <div className="footer-left">
            <img
              src={theme === 'dark' ? BrainyTechDarkLogo : BrainyTechLightLogo}
              alt="Brainy Tech Solutions"
              className="footer-logo"
            />
            <span className="footer-copyright">© {currentYear}</span>
          </div>
          <div className="footer-right">
            <span className="footer-version">v1.0.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
