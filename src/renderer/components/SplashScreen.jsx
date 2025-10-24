import { useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import './SplashScreen.css';

export default function SplashScreen({ onComplete }) {
  const { t } = useLanguage();

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="splash-screen">
      {/* Animated background shapes */}
      <div className="splash-bg-shape shape-1"></div>
      <div className="splash-bg-shape shape-2"></div>
      <div className="splash-bg-shape shape-3"></div>

      {/* Main content */}
      <div className="splash-content">
        {/* Logo/Icon */}
        <div className="splash-icon">
          <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Outer glow circles for depth */}
            <circle cx="60" cy="60" r="56" stroke="url(#gradient1)" strokeWidth="1.5" opacity="0.2" />
            <circle cx="60" cy="60" r="52" stroke="url(#gradient1)" strokeWidth="1" opacity="0.15" />

            {/* Folder outline */}
            <path
              d="M18 42 L18 90 C18 93 21 96 24 96 L96 96 C99 96 102 93 102 90 L102 42 C102 39 99 36 96 36 L66 36 L57 27 L24 27 C21 27 18 30 18 33 Z"
              stroke="url(#gradient1)"
              strokeWidth="4"
              fill="url(#folder-fill)"
            />

            {/* Trash bin in center */}
            <g transform="translate(42, 48)">
              <path d="M12 15 L12 60 C12 61.5 13.5 63 15 63 L27 63 C28.5 63 30 61.5 30 60 L30 15"
                    stroke="url(#gradient2)"
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"/>
              <line x1="9" y1="15" x2="33" y2="15"
                    stroke="url(#gradient2)"
                    strokeWidth="4"
                    strokeLinecap="round"/>
              <path d="M16.5 9 L18 15 L24 15 L25.5 9 C25.5 7.5 24.6 6 22.5 6 L19.5 6 C17.4 6 16.5 7.5 16.5 9"
                    stroke="url(#gradient2)"
                    strokeWidth="4"
                    fill="none"/>
              <line x1="18" y1="24" x2="18" y2="51" stroke="url(#gradient2)" strokeWidth="3" strokeLinecap="round"/>
              <line x1="24" y1="24" x2="24" y2="51" stroke="url(#gradient2)" strokeWidth="3" strokeLinecap="round"/>
            </g>

            <defs>
              <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00172D" />
                <stop offset="50%" stopColor="#0066CC" />
                <stop offset="100%" stopColor="#00A3FF" />
              </linearGradient>
              <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00D9FF" />
                <stop offset="100%" stopColor="#00A3FF" />
              </linearGradient>
              <linearGradient id="folder-fill" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00172D" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#0066CC" stopOpacity="0.1" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* App name */}
        <h1 className="splash-title gradient-text">{t('splash.appName')}</h1>

        {/* Tagline */}
        <p className="splash-tagline">{t('splash.tagline')}</p>

        {/* Loading indicator */}
        <div className="splash-loading">
          <div className="loading-bar">
            <div className="loading-progress"></div>
          </div>
          <p className="loading-text">{t('splash.loading')}</p>
        </div>

        {/* Brand */}
        <div className="splash-brand">
          <span>by</span>
          <span className="brand-name gradient-text">Brainy Tech</span>
        </div>
      </div>
    </div>
  );
}
