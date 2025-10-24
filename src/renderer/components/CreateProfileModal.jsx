import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../contexts/LanguageContext';
import './CreateProfileModal.css';

const AVATAR_COLORS = [
  '#004C99', '#0066CC', '#00A3FF', '#2383e2',
  '#9065b0', '#e255a1', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6',
];

export default function CreateProfileModal({ onClose, onCreated }) {
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

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal create-profile-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title">{t('profile.createNew')}</h2>
        </div>

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
                <div
                  key={color}
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
                </div>
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

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              {t('profile.cancel')}
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? t('common.loading') : t('profile.save')}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
