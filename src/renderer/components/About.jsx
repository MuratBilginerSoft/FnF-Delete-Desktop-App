import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import BrainyTechDarkLogo from '../assets/BrainyTechDarkLogo.png';
import BrainyTechLightLogo from '../assets/BrainyTechLightLogo.png';
import './About.css';

export default function About() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const currentYear = new Date().getFullYear();

  const features = [
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      title: t('about.features.scanning'),
      description: t('about.features.scanningDesc')
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: t('about.features.statistics'),
      description: t('about.features.statisticsDesc')
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      title: t('about.features.profiles'),
      description: t('about.features.profilesDesc')
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      title: t('about.features.themes'),
      description: t('about.features.themesDesc')
    }
  ];

  return (
    <div className="about-page">
      {/* Hero Section */}
      <div className="about-hero">
        <div className="about-logo-container">
          <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="about-app-logo">
            {/* Folder outline */}
            <path
              d="M18 42 L18 90 C18 93 21 96 24 96 L96 96 C99 96 102 93 102 90 L102 42 C102 39 99 36 96 36 L66 36 L57 27 L24 27 C21 27 18 30 18 33 Z"
              stroke="url(#aboutGradient1)"
              strokeWidth="4"
              fill="url(#aboutFolderFill)"
            />
            {/* Trash bin */}
            <g transform="translate(42, 48)">
              <path d="M12 15 L12 60 C12 61.5 13.5 63 15 63 L27 63 C28.5 63 30 61.5 30 60 L30 15"
                    stroke="url(#aboutGradient2)"
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"/>
              <line x1="9" y1="15" x2="33" y2="15" stroke="url(#aboutGradient2)" strokeWidth="4" strokeLinecap="round"/>
              <path d="M16.5 9 L18 15 L24 15 L25.5 9 C25.5 7.5 24.6 6 22.5 6 L19.5 6 C17.4 6 16.5 7.5 16.5 9"
                    stroke="url(#aboutGradient2)" strokeWidth="4" fill="none"/>
              <line x1="18" y1="24" x2="18" y2="51" stroke="url(#aboutGradient2)" strokeWidth="3" strokeLinecap="round"/>
              <line x1="24" y1="24" x2="24" y2="51" stroke="url(#aboutGradient2)" strokeWidth="3" strokeLinecap="round"/>
            </g>
            <defs>
              <linearGradient id="aboutGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00172D" />
                <stop offset="50%" stopColor="#0066CC" />
                <stop offset="100%" stopColor="#00A3FF" />
              </linearGradient>
              <linearGradient id="aboutGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00D9FF" />
                <stop offset="100%" stopColor="#00A3FF" />
              </linearGradient>
              <linearGradient id="aboutFolderFill" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00172D" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#0066CC" stopOpacity="0.1" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <h1 className="about-title">
          <span className="gradient-text">FnF Delete</span>
        </h1>
        <p className="about-subtitle">{t('about.subtitle')}</p>
        <p className="about-version">v1.0.0</p>
      </div>

      {/* Description */}
      <div className="about-section card">
        <h2>{t('about.description')}</h2>
        <p>{t('about.descriptionText')}</p>
      </div>

      {/* Features Grid */}
      <div className="about-section">
        <h2 className="section-title">{t('about.features.title')}</h2>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card card">
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Company Info */}
      <div className="about-section card about-company">
        <img
          src={theme === 'dark' ? BrainyTechDarkLogo : BrainyTechLightLogo}
          alt="Brainy Tech"
          className="company-logo"
        />
        <h2>Brainy Tech</h2>
        <p>{t('about.company')}</p>
      </div>

      {/* Footer */}
      <div className="about-footer">
        <p>© {currentYear} Brainy Tech. {t('about.copyrightText')}</p>
      </div>
    </div>
  );
}
