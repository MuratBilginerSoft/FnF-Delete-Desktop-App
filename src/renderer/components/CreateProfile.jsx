import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import './CreateProfile.css';

const AVATAR_COLORS = [
  '#004C99', '#0066CC', '#00A3FF', '#2383e2',
  '#9065b0', '#e255a1', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6',
];

export default function CreateProfile({ onBack, onCreated }) {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError(t('profile.namePlaceholder'));
      return;
    }

    try {
      setLoading(true);
      const result = await window.electronAPI.createProfile(name.trim(), selectedColor);

      if (result.success) {
        onCreated({ id: result.id, name: name.trim(), avatar_color: selectedColor });
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-profile-page">
      {/* Window Controls */}
      <div className="profile-window-controls">
        <button className="window-btn minimize-btn" onClick={() => window.electronAPI.minimizeWindow()}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <button className="window-btn maximize-btn" onClick={() => window.electronAPI.maximizeWindow()}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2m8-16h2a2 2 0 012 2v2m-4 12h2a2 2 0 002-2v-2" />
          </svg>
        </button>
        <button className="window-btn close-btn" onClick={() => window.electronAPI.closeWindow()}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Background Shapes */}
      <div className="profile-bg-shape shape-1"></div>
      <div className="profile-bg-shape shape-2"></div>

      <div className="create-profile-container">
        <button className="back-button" onClick={onBack}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('common.back')}
        </button>

        <div className="create-profile-content">
          <h1>{t('profile.createNew')}</h1>
          <p className="subtitle">{t('profile.createSubtitle')}</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>{t('profile.name')}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('profile.namePlaceholder')}
                autoFocus
                maxLength={50}
              />
            </div>

            <div className="form-group">
              <label>{t('profile.color')}</label>
              <div className="color-picker">
                {AVATAR_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`color-option ${selectedColor === color ? 'selected' : ''}`}
                    style={{ background: color }}
                    onClick={() => setSelectedColor(color)}
                  >
                    {selectedColor === color && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="white">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="profile-preview">
              <div className="preview-avatar" style={{ background: selectedColor }}>
                {name.trim() ? name.charAt(0).toUpperCase() : '?'}
              </div>
              <p className="preview-name">{name.trim() || t('profile.namePlaceholder')}</p>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={onBack} disabled={loading}>
                {t('profile.cancel')}
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? t('common.loading') : t('profile.save')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
