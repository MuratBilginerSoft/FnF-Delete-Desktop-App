import { useLanguage } from '../../contexts/LanguageContext';

export default function UpgradeModal({ onClose }) {
  const { t } = useLanguage();

  const features = [
    { key: 'unlimitedJobs', icon: 'layers' },
    { key: 'allSchedules', icon: 'clock' },
    { key: 'permanentDelete', icon: 'trash' },
    { key: 'unlimitedHistory', icon: 'history' }
  ];

  const getIcon = (type) => {
    const icons = {
      layers: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      clock: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      trash: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
      history: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    };
    return icons[type];
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content upgrade-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 450 }}>
        <div className="modal-body" style={{ padding: 32 }}>
          {/* Premium Icon */}
          <div className="upgrade-icon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="40" height="40">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>

          {/* Title */}
          <h2 className="upgrade-title gradient-text">{t('premium.upgrade')}</h2>
          <p className="upgrade-description">{t('premium.description')}</p>

          {/* Features */}
          <div className="upgrade-features">
            {features.map((feature) => (
              <div key={feature.key} className="upgrade-feature">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20" style={{ color: '#22c55e' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{t(`premium.${feature.key}`)}</span>
              </div>
            ))}
          </div>

          {/* Pricing */}
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: 12,
            padding: 20,
            marginBottom: 24,
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{t('payment.lifetime')}</span>
              <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-primary)' }}>
                {t('payment.lifetimePrice')}
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('payment.oneTime')}</span>
            </div>
          </div>

          {/* Coming Soon Notice */}
          <div style={{
            background: 'rgba(251, 191, 36, 0.1)',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            borderRadius: 8,
            padding: 12,
            marginBottom: 24,
            textAlign: 'center'
          }}>
            <span style={{ color: '#fbbf24', fontSize: 13 }}>
              {t('payment.comingSoon')}
            </span>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>
              {t('common.later')}
            </button>
            <button
              className="btn btn-primary"
              style={{ flex: 1, background: 'linear-gradient(135deg, #FFD700, #FFA500)', color: '#000' }}
              disabled
            >
              {t('premium.buyNow')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
