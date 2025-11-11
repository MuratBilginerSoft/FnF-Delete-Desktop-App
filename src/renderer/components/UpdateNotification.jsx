import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import './UpdateNotification.css';

export default function UpdateNotification() {
  const { t } = useLanguage();
  const appVersion = window.electronAPI?.getAppVersion() || '1.0.0';
  const [updateState, setUpdateState] = useState({
    show: false,
    version: null,
    releaseNotes: null,
    status: 'available', // available, downloading, downloaded, error
    progress: 0,
    transferred: 0,
    total: 0,
    error: null
  });

  useEffect(() => {
    // Listen for update events
    const cleanupAvailable = window.electronAPI.onUpdateAvailable((data) => {
      console.log('Update available:', data);
      setUpdateState({
        show: true,
        version: data.version,
        releaseNotes: data.releaseNotes,
        status: 'available',
        progress: 0,
        transferred: 0,
        total: 0,
        error: null
      });
    });

    const cleanupProgress = window.electronAPI.onDownloadProgress((data) => {
      console.log('Download progress:', data);
      setUpdateState(prev => ({
        ...prev,
        status: 'downloading',
        progress: Math.round(data.percent),
        transferred: data.transferred,
        total: data.total
      }));
    });

    const cleanupDownloaded = window.electronAPI.onUpdateDownloaded((data) => {
      console.log('Update downloaded:', data);
      setUpdateState(prev => ({
        ...prev,
        status: 'downloaded',
        progress: 100
      }));
    });

    const cleanupError = window.electronAPI.onUpdateError((data) => {
      console.error('Update error:', data);
      setUpdateState(prev => ({
        ...prev,
        status: 'error',
        error: data.message
      }));
    });

    return () => {
      // Cleanup listeners if needed
    };
  }, []);

  const handleDownload = async () => {
    try {
      setUpdateState(prev => ({ ...prev, status: 'downloading', progress: 0 }));
      await window.electronAPI.downloadUpdate();
    } catch (error) {
      console.error('Download error:', error);
      setUpdateState(prev => ({
        ...prev,
        status: 'error',
        error: error.message
      }));
    }
  };

  const handleInstall = async () => {
    try {
      await window.electronAPI.installUpdate();
    } catch (error) {
      console.error('Install error:', error);
    }
  };

  const handleClose = () => {
    setUpdateState(prev => ({ ...prev, show: false }));
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const parseReleaseNotes = (notes) => {
    if (!notes) return null;
    if (typeof notes === 'string') {
      // Simple parsing - split by newlines and look for bullet points
      const lines = notes.split('\n').filter(line => line.trim());
      return lines.map((line, index) => (
        <li key={index}>{line.replace(/^[-*•]\s*/, '')}</li>
      ));
    }
    return null;
  };

  if (!updateState.show) return null;

  return (
    <div className="update-modal-overlay">
      <div className="update-modal card">
        {/* Icon */}
        <div className={`update-icon ${updateState.status}`}>
          {updateState.status === 'available' && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="48" height="48">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          )}
          {updateState.status === 'downloading' && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="48" height="48">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          )}
          {updateState.status === 'downloaded' && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="48" height="48">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {updateState.status === 'error' && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="48" height="48">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>

        {/* Title */}
        <h2 className="update-title">
          {updateState.status === 'available' && t('update.available')}
          {updateState.status === 'downloading' && t('update.downloading')}
          {updateState.status === 'downloaded' && t('update.readyToInstall')}
          {updateState.status === 'error' && t('update.error')}
        </h2>

        {/* Version Info */}
        {updateState.status !== 'error' && (
          <div className="update-version-info">
            <div className="version-row">
              <span className="version-label">{t('update.currentVersion')}:</span>
              <span className="version-value">v{appVersion}</span>
            </div>
            <div className="version-arrow">→</div>
            <div className="version-row">
              <span className="version-label">{t('update.newVersion')}:</span>
              <span className="version-value highlight">v{updateState.version}</span>
            </div>
          </div>
        )}

        {/* Release Notes */}
        {updateState.status === 'available' && updateState.releaseNotes && (
          <div className="update-release-notes">
            <h3>{t('update.releaseNotes')}</h3>
            <ul>
              {parseReleaseNotes(updateState.releaseNotes)}
            </ul>
          </div>
        )}

        {/* Download Progress */}
        {updateState.status === 'downloading' && (
          <div className="update-progress-container">
            <div className="progress-bar-bg">
              <div
                className="progress-bar-fill"
                style={{ width: `${updateState.progress}%` }}
              />
            </div>
            <div className="progress-info">
              <span className="progress-percent">{updateState.progress}%</span>
              {updateState.total > 0 && (
                <span className="progress-size">
                  {formatBytes(updateState.transferred)} / {formatBytes(updateState.total)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {updateState.status === 'error' && (
          <div className="update-error-message">
            <p>{updateState.error || t('update.errorMessage')}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="update-actions">
          {updateState.status === 'available' && (
            <>
              <button className="btn btn-primary" onClick={handleDownload}>
                {t('update.downloadNow')}
              </button>
              <button className="btn btn-secondary" onClick={handleClose}>
                {t('update.later')}
              </button>
            </>
          )}

          {updateState.status === 'downloading' && (
            <button className="btn btn-secondary" onClick={handleClose}>
              {t('update.runInBackground')}
            </button>
          )}

          {updateState.status === 'downloaded' && (
            <>
              <button className="btn btn-primary" onClick={handleInstall}>
                {t('update.installNow')}
              </button>
              <button className="btn btn-secondary" onClick={handleClose}>
                {t('update.installLater')}
              </button>
            </>
          )}

          {updateState.status === 'error' && (
            <button className="btn btn-primary" onClick={handleClose}>
              {t('common.close')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
