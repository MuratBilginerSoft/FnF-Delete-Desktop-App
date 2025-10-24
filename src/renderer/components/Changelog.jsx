import { useLanguage } from '../contexts/LanguageContext';
import './Changelog.css';

export default function Changelog() {
  const { t } = useLanguage();

  const changelogData = [
    {
      version: '1.0.0',
      date: '2025-01-24',
      type: 'major',
      changes: [
        {
          category: 'feature',
          items: [
            'changelog.v1.profile.management',
            'changelog.v1.profile.custom',
            'changelog.v1.profile.delete',
          ]
        },
        {
          category: 'feature',
          items: [
            'changelog.v1.deletion.modes',
            'changelog.v1.deletion.preview',
            'changelog.v1.deletion.batch',
          ]
        },
        {
          category: 'feature',
          items: [
            'changelog.v1.stats.charts',
            'changelog.v1.stats.timeline',
            'changelog.v1.stats.extension',
          ]
        },
        {
          category: 'feature',
          items: [
            'changelog.v1.ui.modern',
            'changelog.v1.ui.theme',
            'changelog.v1.ui.animations',
            'changelog.v1.ui.responsive',
          ]
        },
        {
          category: 'feature',
          items: [
            'changelog.v1.system.sqlite',
            'changelog.v1.system.multilang',
            'changelog.v1.system.electron',
          ]
        }
      ]
    }
  ];

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'feature':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        );
      case 'improvement':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'fix':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getVersionBadge = (type) => {
    return <span className={`version-badge ${type}`}>{type.toUpperCase()}</span>;
  };

  return (
    <div className="changelog">
      <div className="changelog-header">
        <div className="changelog-header-content">
          <div className="changelog-title-wrapper">
            <div className="changelog-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
            </div>
            <div>
              <h1>{t('changelog.title')}</h1>
              <p className="changelog-subtitle">{t('changelog.subtitle')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="changelog-timeline">
        {changelogData.map((release, index) => (
          <div key={release.version} className="timeline-item" style={{ animationDelay: `${index * 0.1}s` }}>
            <div className="timeline-marker">
              <div className="timeline-dot"></div>
              {index < changelogData.length - 1 && <div className="timeline-line"></div>}
            </div>

            <div className="timeline-content card">
              <div className="timeline-header">
                <div className="version-info">
                  <h2>v{release.version}</h2>
                  {getVersionBadge(release.type)}
                </div>
                <div className="release-date">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  {new Date(release.date).toLocaleDateString('tr-TR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>

              <div className="changes-list">
                {release.changes.map((group, groupIndex) => (
                  <div key={groupIndex} className="change-group">
                    <div className="change-category">
                      <div className={`category-icon ${group.category}`}>
                        {getCategoryIcon(group.category)}
                      </div>
                      <span className="category-label">{t(`changelog.category.${group.category}`)}</span>
                    </div>
                    <ul className="change-items">
                      {group.items.map((item, itemIndex) => (
                        <li key={itemIndex}>
                          <span className="bullet">•</span>
                          <span>{t(item)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
