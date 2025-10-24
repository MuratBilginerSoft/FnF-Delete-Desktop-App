import { useState, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import useProfileStore from '../store/useProfileStore';
import './FileDeletion.css';

export default function FileDeletion() {
  const { t } = useLanguage();
  const { currentProfile } = useProfileStore();

  const [scanPath, setScanPath] = useState('');
  const [extensions, setExtensions] = useState('');
  const [mode, setMode] = useState('include'); // 'include' or 'exclude'
  const [scanning, setScanning] = useState(false);
  const [scannedFiles, setScannedFiles] = useState([]);
  const [totalSize, setTotalSize] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });

  const previewRef = useRef(null);

  const handleBrowse = async () => {
    try {
      const result = await window.electronAPI.selectFolder();
      if (result.success && result.path) {
        setScanPath(result.path);
      }
    } catch (error) {
      console.error('Browse error:', error);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        setScanPath(text.trim());
      }
    } catch (error) {
      console.error('Clipboard read error:', error);
    }
  };

  const handleClearPath = () => {
    setScanPath('');
  };

  const toggleExtension = (ext) => {
    const currentExts = extensions
      .split(',')
      .map((e) => e.trim())
      .filter((e) => e.length > 0);

    if (currentExts.includes(ext)) {
      // Remove extension
      const newExts = currentExts.filter((e) => e !== ext);
      setExtensions(newExts.join(', '));
    } else {
      // Add extension
      const newExts = [...currentExts, ext];
      setExtensions(newExts.join(', '));
    }
  };

  const isExtensionSelected = (ext) => {
    const currentExts = extensions
      .split(',')
      .map((e) => e.trim())
      .filter((e) => e.length > 0);
    return currentExts.includes(ext);
  };

  const selectAllCategory = (category) => {
    const currentExts = extensions
      .split(',')
      .map((e) => e.trim())
      .filter((e) => e.length > 0);

    const categoryExts = popularExtensions[category];

    // Add all extensions from category that aren't already selected
    const newExts = [...currentExts];
    categoryExts.forEach((ext) => {
      if (!newExts.includes(ext)) {
        newExts.push(ext);
      }
    });

    setExtensions(newExts.join(', '));
  };

  // Popular file extensions by category
  const popularExtensions = {
    media: ['mp3', 'mp4', 'avi', 'mkv', 'flac', 'wav', 'wma'],
    images: ['jpg', 'png', 'gif', 'webp', 'svg', 'bmp'],
    documents: ['pdf', 'doc', 'docx', 'txt', 'xlsx', 'pptx'],
    archives: ['zip', 'rar', '7z', 'tar', 'gz'],
  };

  const handleScan = async () => {
    if (!scanPath.trim()) {
      setNotification({ show: true, type: 'error', message: t('delete.pathPlaceholder') });
      return;
    }

    if (!extensions.trim()) {
      setNotification({ show: true, type: 'error', message: t('delete.extensionsPlaceholder') });
      return;
    }

    try {
      setScanning(true);
      setScannedFiles([]);
      setTotalSize(0);

      const result = await window.electronAPI.scanFiles(
        scanPath,
        extensions,
        mode
      );

      if (result.success) {
        setScannedFiles(result.files);
        setTotalSize(result.totalSize);

        // Scroll to preview section smoothly after scan completes
        setTimeout(() => {
          if (previewRef.current) {
            previewRef.current.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }
        }, 100);
      } else {
        setNotification({ show: true, type: 'error', message: result.message || t('delete.error') });
      }
    } catch (error) {
      console.error('Scan error:', error);
      setNotification({ show: true, type: 'error', message: t('delete.error') });
    } finally {
      setScanning(false);
    }
  };

  const handleDelete = async () => {
    if (scannedFiles.length === 0) return;

    try {
      setDeleting(true);

      // Move files to trash
      const filePaths = scannedFiles.map((f) => f.path);
      const deleteResult = await window.electronAPI.moveToTrash(filePaths);

      if (deleteResult.success) {
        // Save operation to database
        const filesData = scannedFiles.map((f) => ({
          path: f.path,
          name: f.name,
          extension: f.extension,
          size: f.size,
        }));

        await window.electronAPI.createOperation(
          currentProfile.id,
          scanPath,
          mode,
          extensions,
          filesData
        );

        setNotification({ show: true, type: 'success', message: t('delete.successMessage') });

        // Reset state
        setScannedFiles([]);
        setTotalSize(0);
        setScanPath('');
        setExtensions('');
        setShowConfirm(false);
      } else {
        setNotification({ show: true, type: 'error', message: deleteResult.message || t('delete.error') });
      }
    } catch (error) {
      console.error('Delete error:', error);
      setNotification({ show: true, type: 'error', message: t('delete.error') });
    } finally {
      setDeleting(false);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="file-deletion">
      <div className="deletion-container">
        {/* Info Section - Mode Explanation */}
        <div className="mode-info-section">
          <div className="mode-info-card">
            <div className="mode-info-icon include-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="24" height="24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <h3>{t('delete.modeInclude')}</h3>
              <p>{t('delete.modeIncludeDesc')}</p>
            </div>
          </div>

          <div className="mode-info-card">
            <div className="mode-info-icon exclude-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="24" height="24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <div>
              <h3>{t('delete.modeExclude')}</h3>
              <p>{t('delete.modeExcludeDesc')}</p>
            </div>
          </div>
        </div>

        {/* Configuration Section */}
        <div className="config-section card">
          <div className="form-group">
            <label>{t('delete.scanPath')}</label>
            <div className="path-input-group">
              <div className="input-with-icons">
                <input
                  type="text"
                  value={scanPath}
                  onChange={(e) => setScanPath(e.target.value)}
                  placeholder={t('delete.pathPlaceholder')}
                />
                {scanPath && (
                  <button
                    className="input-icon-btn clear-btn"
                    onClick={handleClearPath}
                    title={t('delete.clearPath')}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="18" height="18">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
              <button
                className="btn btn-secondary paste-btn"
                onClick={handlePasteFromClipboard}
                title={t('delete.pasteFromClipboard')}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </button>
              <button className="btn btn-secondary" onClick={handleBrowse}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
                {t('delete.browse')}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>{t('delete.extensions')}</label>
            <input
              type="text"
              value={extensions}
              onChange={(e) => setExtensions(e.target.value)}
              placeholder={t('delete.extensionsPlaceholder')}
            />

            {/* Quick Select Extensions */}
            <div className="extensions-info">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{t('delete.extensionsHelp')}</span>
            </div>

            <div className="quick-extensions">
              <div className="extension-category">
                <div className="category-header">
                  <span className="category-label">{t('delete.mediaFiles')}</span>
                  <button
                    type="button"
                    className="add-all-btn"
                    onClick={() => selectAllCategory('media')}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="14" height="14">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    {t('delete.addAll')}
                  </button>
                </div>
                <div className="extension-buttons">
                  {popularExtensions.media.map((ext) => (
                    <button
                      key={ext}
                      type="button"
                      className={`ext-btn ${isExtensionSelected(ext) ? 'selected' : ''}`}
                      onClick={() => toggleExtension(ext)}
                    >
                      {ext}
                    </button>
                  ))}
                </div>
              </div>

              <div className="extension-category">
                <div className="category-header">
                  <span className="category-label">{t('delete.imageFiles')}</span>
                  <button
                    type="button"
                    className="add-all-btn"
                    onClick={() => selectAllCategory('images')}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="14" height="14">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    {t('delete.addAll')}
                  </button>
                </div>
                <div className="extension-buttons">
                  {popularExtensions.images.map((ext) => (
                    <button
                      key={ext}
                      type="button"
                      className={`ext-btn ${isExtensionSelected(ext) ? 'selected' : ''}`}
                      onClick={() => toggleExtension(ext)}
                    >
                      {ext}
                    </button>
                  ))}
                </div>
              </div>

              <div className="extension-category">
                <div className="category-header">
                  <span className="category-label">{t('delete.documentFiles')}</span>
                  <button
                    type="button"
                    className="add-all-btn"
                    onClick={() => selectAllCategory('documents')}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="14" height="14">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    {t('delete.addAll')}
                  </button>
                </div>
                <div className="extension-buttons">
                  {popularExtensions.documents.map((ext) => (
                    <button
                      key={ext}
                      type="button"
                      className={`ext-btn ${isExtensionSelected(ext) ? 'selected' : ''}`}
                      onClick={() => toggleExtension(ext)}
                    >
                      {ext}
                    </button>
                  ))}
                </div>
              </div>

              <div className="extension-category">
                <div className="category-header">
                  <span className="category-label">{t('delete.archiveFiles')}</span>
                  <button
                    type="button"
                    className="add-all-btn"
                    onClick={() => selectAllCategory('archives')}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="14" height="14">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    {t('delete.addAll')}
                  </button>
                </div>
                <div className="extension-buttons">
                  {popularExtensions.archives.map((ext) => (
                    <button
                      key={ext}
                      type="button"
                      className={`ext-btn ${isExtensionSelected(ext) ? 'selected' : ''}`}
                      onClick={() => toggleExtension(ext)}
                    >
                      {ext}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>{t('delete.mode')}</label>
            <div className="mode-selector">
              <button
                className={`mode-btn ${mode === 'include' ? 'active' : ''}`}
                onClick={() => setMode('include')}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {t('delete.modeInclude')}
              </button>
              <button
                className={`mode-btn ${mode === 'exclude' ? 'active' : ''}`}
                onClick={() => setMode('exclude')}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                {t('delete.modeExclude')}
              </button>
            </div>
          </div>

          <button
            className="btn btn-primary scan-btn"
            onClick={handleScan}
            disabled={scanning || !scanPath.trim() || !extensions.trim()}
          >
            {scanning ? (
              <>
                <div className="spinner"></div>
                {t('delete.scanning')}
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                {t('delete.scan')}
              </>
            )}
          </button>
        </div>

        {/* Preview Section */}
        {scannedFiles.length > 0 && (
          <div ref={previewRef} className="preview-section card">
            <div className="preview-header">
              <div className="preview-title-row">
                <h2>{t('delete.preview')}</h2>
                <div className={`mode-badge ${mode}`}>
                  {mode === 'include' ? (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {t('delete.includeMode')}
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      {t('delete.excludeMode')}
                    </>
                  )}
                </div>
              </div>
              <div className="preview-stats">
                <div className="stat-item">
                  <span className="stat-value">{scannedFiles.length}</span>
                  <span className="stat-label">{t('delete.filesFound')}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{formatBytes(totalSize)}</span>
                  <span className="stat-label">{t('delete.totalSize')}</span>
                </div>
              </div>
            </div>

            <div className="files-list">
              {scannedFiles.slice(0, 100).map((file, index) => (
                <div key={index} className="file-item">
                  <div className="file-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div className="file-info">
                    <div className="file-name">{file.name}</div>
                    <div className="file-path">{file.path}</div>
                  </div>
                  <div className="file-meta">
                    <span className="file-ext">.{file.extension}</span>
                    <span className="file-size">{formatBytes(file.size)}</span>
                  </div>
                </div>
              ))}
              {scannedFiles.length > 100 && (
                <div className="more-files">
                  +{scannedFiles.length - 100} {t('stats.files')}
                </div>
              )}
            </div>

            <div className="preview-actions">
              <button
                className="btn btn-danger"
                onClick={() => setShowConfirm(true)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                {t('delete.moveToTrash')}
              </button>
            </div>
          </div>
        )}

        {/* No files message */}
        {!scanning && scannedFiles.length === 0 && scanPath && extensions && (
          <div className="no-files-message card">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="64" height="64">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p>{t('delete.noFiles')}</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showConfirm && (
        <div className="confirm-delete-overlay" onClick={() => setShowConfirm(false)}>
          <div className="confirm-delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-delete-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="64" height="64">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </div>
            <h2>{t('delete.confirmTitle')}</h2>

            <div className="confirm-info-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p>{t('delete.confirmMessage')}</p>
            </div>

            <div className="confirm-delete-info">
              <div className="confirm-stat">
                <span className="confirm-label">{t('delete.fileCount')}</span>
                <span className="confirm-value">{scannedFiles.length}</span>
              </div>
              <div className="confirm-stat">
                <span className="confirm-label">{t('delete.totalSize')}</span>
                <span className="confirm-value">{formatBytes(scannedFiles.reduce((sum, file) => sum + file.size, 0))}</span>
              </div>
            </div>
            <div className="confirm-delete-buttons">
              <button
                className="btn btn-secondary"
                onClick={() => setShowConfirm(false)}
                disabled={deleting}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                {t('common.cancel')}
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <div className="spinner"></div>
                    {t('delete.deleting')}
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    {t('delete.confirmDelete')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {notification.show && (
        <div className="notification-overlay" onClick={() => setNotification({ show: false, type: '', message: '' })}>
          <div className={`notification-modal ${notification.type}`} onClick={(e) => e.stopPropagation()}>
            <div className="notification-icon">
              {notification.type === 'success' ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="48" height="48">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="48" height="48">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
            </div>
            <h3>{notification.type === 'success' ? t('common.success') : t('common.error')}</h3>
            <p>{notification.message}</p>
            <button className="btn btn-primary" onClick={() => setNotification({ show: false, type: '', message: '' })}>
              {t('common.close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
