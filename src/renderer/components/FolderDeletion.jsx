import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import useProfileStore from '../store/useProfileStore';
import './FileDeletion.css';
import './FolderDeletion.css';

export default function FolderDeletion() {
  const { t } = useLanguage();
  const { currentProfile } = useProfileStore();

  const [scanPath, setScanPath] = useState('');
  const [keywords, setKeywords] = useState('');
  const [mode, setMode] = useState('include'); // 'include', 'exclude', 'all'
  const [scanning, setScanning] = useState(false);
  const [scannedFolders, setScannedFolders] = useState([]);
  const [totalSize, setTotalSize] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [selectedFolders, setSelectedFolders] = useState(new Set());

  // Saved paths states
  const [savedPaths, setSavedPaths] = useState([]);
  const [showSavePathModal, setShowSavePathModal] = useState(false);
  const [savePathName, setSavePathName] = useState('');
  const [showSavedPaths, setShowSavedPaths] = useState(true);
  const [showDeletePathModal, setShowDeletePathModal] = useState(false);
  const [pathToDelete, setPathToDelete] = useState(null);
  const [includeSubfolders, setIncludeSubfolders] = useState(false);

  const previewRef = useRef(null);

  // Load saved paths on component mount
  useEffect(() => {
    loadSavedPaths();
  }, [currentProfile]);

  const loadSavedPaths = async () => {
    if (!currentProfile) return;
    try {
      const paths = await window.electronAPI.getAllSavedPaths(currentProfile.id);
      setSavedPaths(paths);
    } catch (error) {
      console.error('Load saved paths error:', error);
    }
  };

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

  // Saved paths functions
  const handleSavePath = () => {
    if (!scanPath.trim()) {
      setNotification({ show: true, type: 'error', message: t('folderDelete.pathPlaceholder') });
      return;
    }
    setShowSavePathModal(true);
  };

  const handleConfirmSavePath = async () => {
    if (!savePathName.trim()) {
      setNotification({ show: true, type: 'error', message: t('savedPaths.pathName') });
      return;
    }

    try {
      const result = await window.electronAPI.createSavedPath(
        currentProfile.id,
        scanPath,
        savePathName.trim()
      );

      if (result.success) {
        setNotification({ show: true, type: 'success', message: t('savedPaths.saveSuccess') });
        setSavePathName('');
        setShowSavePathModal(false);
        loadSavedPaths();
      } else {
        setNotification({ show: true, type: 'error', message: result.message || t('savedPaths.saveError') });
      }
    } catch (error) {
      console.error('Save path error:', error);
      setNotification({ show: true, type: 'error', message: t('savedPaths.saveError') });
    }
  };

  const handleUseSavedPath = (path) => {
    setScanPath(path);
  };

  const handleDeleteSavedPath = (savedPath) => {
    setPathToDelete(savedPath);
    setShowDeletePathModal(true);
  };

  const confirmDeleteSavedPath = async () => {
    if (!pathToDelete) return;

    try {
      const result = await window.electronAPI.deleteSavedPath(pathToDelete.id);
      if (result.success) {
        setNotification({ show: true, type: 'success', message: t('savedPaths.deleteSuccess') });
        loadSavedPaths();
      }
    } catch (error) {
      console.error('Delete saved path error:', error);
      setNotification({ show: true, type: 'error', message: t('folderDelete.error') });
    } finally {
      setShowDeletePathModal(false);
      setPathToDelete(null);
    }
  };

  // Keyword toggle functions
  const toggleKeyword = (kw) => {
    const currentKws = keywords
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    if (currentKws.includes(kw)) {
      const newKws = currentKws.filter((k) => k !== kw);
      setKeywords(newKws.join(', '));
    } else {
      const newKws = [...currentKws, kw];
      setKeywords(newKws.join(', '));
    }
  };

  const isKeywordSelected = (kw) => {
    const currentKws = keywords
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 0);
    return currentKws.includes(kw);
  };

  const selectAllCategory = (category) => {
    const currentKws = keywords
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    const categoryKws = popularFolderNames[category];
    const newKws = [...currentKws];
    categoryKws.forEach((kw) => {
      if (!newKws.includes(kw)) {
        newKws.push(kw);
      }
    });

    setKeywords(newKws.join(', '));
  };

  // Popular folder names by category
  const popularFolderNames = {
    dev: ['node_modules', '.next', '__pycache__', 'vendor', '.nuxt', 'bower_components'],
    cache: ['.cache', '.tmp', 'temp', '.sass-cache', '.parcel-cache'],
    build: ['dist', 'build', 'out', 'target', 'bin', 'obj'],
    vcs: ['.git', '.svn', '.hg', '.vs', '.idea'],
  };

  // Folder selection handlers
  const toggleFolderSelection = (folderPath) => {
    const newSelected = new Set(selectedFolders);
    if (newSelected.has(folderPath)) {
      newSelected.delete(folderPath);
    } else {
      newSelected.add(folderPath);
    }
    setSelectedFolders(newSelected);
  };

  const selectAllFolders = () => {
    const allPaths = new Set(scannedFolders.map(f => f.path));
    setSelectedFolders(allPaths);
  };

  const deselectAllFolders = () => {
    setSelectedFolders(new Set());
  };

  const getSelectedFoldersSize = () => {
    return scannedFolders
      .filter(folder => selectedFolders.has(folder.path))
      .reduce((sum, folder) => sum + folder.size, 0);
  };

  const handleScan = async () => {
    if (!scanPath.trim()) {
      setNotification({ show: true, type: 'error', message: t('folderDelete.pathPlaceholder') });
      return;
    }

    if (mode !== 'all' && !keywords.trim()) {
      setNotification({ show: true, type: 'error', message: t('folderDelete.keywordsPlaceholder') });
      return;
    }

    try {
      setScanning(true);
      setScannedFolders([]);
      setTotalSize(0);

      const result = await window.electronAPI.scanFolders(
        scanPath,
        keywords,
        mode,
        includeSubfolders
      );

      if (result.success) {
        setScannedFolders(result.folders);
        setTotalSize(result.totalSize);

        if (result.folders.length === 0) {
          setNotification({ show: true, type: 'info', message: t('folderDelete.noFolders') });
          return;
        }

        // Select all folders by default
        const allPaths = new Set(result.folders.map(f => f.path));
        setSelectedFolders(allPaths);

        setTimeout(() => {
          if (previewRef.current) {
            previewRef.current.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }
        }, 100);
      } else {
        setNotification({ show: true, type: 'error', message: result.message || t('folderDelete.error') });
      }
    } catch (error) {
      console.error('Scan error:', error);
      setNotification({ show: true, type: 'error', message: t('folderDelete.error') });
    } finally {
      setScanning(false);
    }
  };

  const handleDelete = async () => {
    if (selectedFolders.size === 0) return;

    try {
      setDeleting(true);

      const selectedPaths = Array.from(selectedFolders);
      const deleteResult = await window.electronAPI.moveFoldersToTrash(selectedPaths);

      if (deleteResult.success) {
        const foldersData = scannedFolders
          .filter(f => selectedFolders.has(f.path))
          .map((f) => ({
            path: f.path,
            name: f.name,
            size: f.size,
          }));

        await window.electronAPI.createFolderOperation(
          currentProfile.id,
          scanPath,
          mode,
          keywords,
          foldersData
        );

        setNotification({ show: true, type: 'success', message: t('folderDelete.successMessage') });

        setScannedFolders([]);
        setTotalSize(0);
        setScanPath('');
        setKeywords('');
        setShowConfirm(false);
        setSelectedFolders(new Set());
      } else {
        setNotification({ show: true, type: 'error', message: deleteResult.message || t('folderDelete.error') });
      }
    } catch (error) {
      console.error('Delete error:', error);
      setNotification({ show: true, type: 'error', message: t('folderDelete.error') });
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

  const handleOpenFolder = async (folderPath) => {
    try {
      const result = await window.electronAPI.openWithDefault(folderPath);
      if (!result.success) {
        setNotification({ show: true, type: 'error', message: result.message || t('folderDelete.error') });
      }
    } catch (error) {
      console.error('Open folder error:', error);
      setNotification({ show: true, type: 'error', message: t('folderDelete.error') });
    }
  };

  return (
    <div className="file-deletion">
      <div className="deletion-container">
        {/* Mode Selector */}
        <div className="deletion-mode-section card">
          <label className="mode-selector-label">{t('delete.mode')}</label>
          <div className="mode-selector-grid folder-mode-grid">
            <button
              className={`mode-btn-card ${mode === 'include' ? 'active' : ''}`}
              onClick={() => setMode('include')}
            >
              <div className="mode-btn-icon include-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="24" height="24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="mode-btn-content">
                <h3>{t('folderDelete.modeInclude')}</h3>
                <p>{t('folderDelete.modeIncludeDesc')}</p>
              </div>
            </button>

            <button
              className={`mode-btn-card ${mode === 'exclude' ? 'active' : ''}`}
              onClick={() => setMode('exclude')}
            >
              <div className="mode-btn-icon exclude-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="24" height="24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="mode-btn-content">
                <h3>{t('folderDelete.modeExclude')}</h3>
                <p>{t('folderDelete.modeExcludeDesc')}</p>
              </div>
            </button>

            <button
              className={`mode-btn-card ${mode === 'all' ? 'active' : ''}`}
              onClick={() => setMode('all')}
            >
              <div className="mode-btn-icon all-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="24" height="24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <div className="mode-btn-content">
                <h3>{t('folderDelete.modeAll')}</h3>
                <p>{t('folderDelete.modeAllDesc')}</p>
              </div>
            </button>
          </div>
        </div>

        {/* Configuration Section */}
        <div className="config-section card">
          <div className="form-group">
            <label>{t('folderDelete.scanPath')}</label>
            <div className="path-input-group">
              <div className="input-with-icons">
                <input
                  type="text"
                  value={scanPath}
                  onChange={(e) => setScanPath(e.target.value)}
                  placeholder={t('folderDelete.pathPlaceholder')}
                />
                <button
                  className="input-icon-btn browse-btn"
                  onClick={handleBrowse}
                  title={t('delete.browse')}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="18" height="18">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </button>
                {scanPath && (
                  <button
                    className="input-icon-btn clear-btn"
                    onClick={handleClearPath}
                    title={t('delete.clearPath')}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="18" height="18">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </button>
              <button
                className="btn btn-secondary save-path-btn"
                onClick={handleSavePath}
                disabled={!scanPath.trim()}
                title={t('savedPaths.save')}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </button>
              <label className="compact-checkbox-label" title={t('folderDelete.includeSubfoldersDesc')}>
                <input
                  type="checkbox"
                  checked={includeSubfolders}
                  onChange={(e) => setIncludeSubfolders(e.target.checked)}
                  className="compact-checkbox"
                />
                <span className="compact-checkbox-text">{t('folderDelete.includeSubfolders')}</span>
              </label>
            </div>
          </div>

          {/* Saved Paths Section */}
          {savedPaths.length > 0 && (
            <div className="saved-paths-section">
              <div className="saved-paths-header">
                <h3>{t('savedPaths.title')}</h3>
                <button
                  className="toggle-saved-btn"
                  onClick={() => setShowSavedPaths(!showSavedPaths)}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    width="20"
                    height="20"
                    style={{ transform: showSavedPaths ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              {showSavedPaths && (
                <div className="saved-paths-list">
                  {savedPaths.map((savedPath) => (
                    <div
                      key={savedPath.id}
                      className="saved-path-item"
                      onClick={() => handleUseSavedPath(savedPath.path)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="saved-path-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      </div>
                      <div className="saved-path-info">
                        <div className="saved-path-name">{savedPath.name}</div>
                        <div className="saved-path-path">{savedPath.path}</div>
                      </div>
                      <div className="saved-path-actions">
                        <button
                          className="btn-icon delete-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSavedPath(savedPath);
                          }}
                          title={t('savedPaths.delete')}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="18" height="18">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Keywords Input - Hidden in 'all' mode */}
          <div className="form-group" style={{ display: mode === 'all' ? 'none' : 'block' }}>
            <label>{t('folderDelete.keywords')}</label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder={t('folderDelete.keywordsPlaceholder')}
            />

            <div className="extensions-info">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{t('folderDelete.keywordsHelp')}</span>
            </div>

            <div className="quick-extensions">
              <div className="extension-category">
                <div className="category-header">
                  <span className="category-label">{t('folderDelete.devFolders')}</span>
                  <button type="button" className="add-all-btn" onClick={() => selectAllCategory('dev')}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="14" height="14">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {t('delete.addAll')}
                  </button>
                </div>
                <div className="extension-buttons">
                  {popularFolderNames.dev.map((kw) => (
                    <button key={kw} type="button" className={`ext-btn ${isKeywordSelected(kw) ? 'selected' : ''}`} onClick={() => toggleKeyword(kw)}>
                      {kw}
                    </button>
                  ))}
                </div>
              </div>

              <div className="extension-category">
                <div className="category-header">
                  <span className="category-label">{t('folderDelete.cacheFolders')}</span>
                  <button type="button" className="add-all-btn" onClick={() => selectAllCategory('cache')}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="14" height="14">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {t('delete.addAll')}
                  </button>
                </div>
                <div className="extension-buttons">
                  {popularFolderNames.cache.map((kw) => (
                    <button key={kw} type="button" className={`ext-btn ${isKeywordSelected(kw) ? 'selected' : ''}`} onClick={() => toggleKeyword(kw)}>
                      {kw}
                    </button>
                  ))}
                </div>
              </div>

              <div className="extension-category">
                <div className="category-header">
                  <span className="category-label">{t('folderDelete.buildFolders')}</span>
                  <button type="button" className="add-all-btn" onClick={() => selectAllCategory('build')}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="14" height="14">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {t('delete.addAll')}
                  </button>
                </div>
                <div className="extension-buttons">
                  {popularFolderNames.build.map((kw) => (
                    <button key={kw} type="button" className={`ext-btn ${isKeywordSelected(kw) ? 'selected' : ''}`} onClick={() => toggleKeyword(kw)}>
                      {kw}
                    </button>
                  ))}
                </div>
              </div>

              <div className="extension-category">
                <div className="category-header">
                  <span className="category-label">{t('folderDelete.vcsFolders')}</span>
                  <button type="button" className="add-all-btn" onClick={() => selectAllCategory('vcs')}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="14" height="14">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {t('delete.addAll')}
                  </button>
                </div>
                <div className="extension-buttons">
                  {popularFolderNames.vcs.map((kw) => (
                    <button key={kw} type="button" className={`ext-btn ${isKeywordSelected(kw) ? 'selected' : ''}`} onClick={() => toggleKeyword(kw)}>
                      {kw}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Scan Action */}
          <div className="scan-action-section">
            <button
              className="btn btn-primary scan-btn-full"
              onClick={handleScan}
              disabled={scanning || !scanPath.trim() || (mode !== 'all' && !keywords.trim())}
            >
              {scanning ? (
                <>
                  <div className="spinner"></div>
                  {t('folderDelete.scanning')}
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="22" height="22">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {t('folderDelete.scan')}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Preview Section */}
        {scannedFolders.length > 0 && (
          <div ref={previewRef} className="preview-section card">
            <div className="preview-header">
              <div className="preview-title-row">
                <div className="preview-title-left">
                  <h2>{t('folderDelete.preview')}</h2>
                  <div className={`mode-badge ${mode}`}>
                    {mode === 'include' ? (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {t('folderDelete.includeMode')}
                      </>
                    ) : mode === 'all' ? (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                        {t('folderDelete.allMode')}
                      </>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        {t('folderDelete.excludeMode')}
                      </>
                    )}
                  </div>
                </div>

                <div className="preview-stats">
                  <div className="stat-item">
                    <span className="stat-value">{scannedFolders.length}</span>
                    <span className="stat-label">{t('folderDelete.foldersFound')}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{selectedFolders.size}</span>
                    <span className="stat-label">{t('folderDelete.selectedFolders')}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{formatBytes(getSelectedFoldersSize())}</span>
                    <span className="stat-label">{t('folderDelete.selectedSize')}</span>
                  </div>
                </div>
              </div>

              {/* Selection Controls */}
              <div className="selection-controls">
                <button
                  className="btn btn-secondary"
                  onClick={selectAllFolders}
                  style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="18" height="18">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t('folderDelete.selectAll')}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={deselectAllFolders}
                  style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="18" height="18">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t('folderDelete.deselectAll')}
                </button>
              </div>
            </div>

            <div className="files-list">
              {scannedFolders.slice(0, 100).map((folder, index) => (
                <div key={index} className="file-item">
                  <input
                    type="checkbox"
                    checked={selectedFolders.has(folder.path)}
                    onChange={() => toggleFolderSelection(folder.path)}
                    className="file-checkbox"
                  />
                  <div className="file-icon folder-icon-color">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                  <div
                    className="file-info file-info-clickable"
                    onClick={() => handleOpenFolder(folder.path)}
                    title={t('folderDelete.openFolder')}
                  >
                    <div className="file-name">{folder.name}</div>
                    <div className="file-path">{folder.path}</div>
                  </div>
                  <div className="file-meta">
                    <span className="file-ext folder-file-count">{folder.fileCount} {t('folderDelete.files')}</span>
                    <span className="file-size">{formatBytes(folder.size)}</span>
                  </div>
                  <button
                    className="file-open-btn"
                    onClick={() => handleOpenFolder(folder.path)}
                    title={t('folderDelete.openFolder')}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="18" height="18">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </button>
                </div>
              ))}
              {scannedFolders.length > 100 && (
                <div className="more-files">
                  +{scannedFolders.length - 100} {t('folderDelete.foldersFound')}
                </div>
              )}
            </div>

            <div className="preview-actions">
              <button
                className="btn btn-danger"
                onClick={() => setShowConfirm(true)}
                disabled={selectedFolders.size === 0}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {t('folderDelete.moveToTrash')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showConfirm && (
        <div className="confirm-delete-overlay" onClick={() => setShowConfirm(false)}>
          <div className="confirm-delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-delete-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="64" height="64">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h2>{t('folderDelete.confirmTitle')}</h2>

            <div className="confirm-info-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>{t('folderDelete.confirmMessage')}</p>
            </div>

            <div className="confirm-delete-info">
              <div className="confirm-stat">
                <span className="confirm-label">{t('folderDelete.selectedFolders')}</span>
                <span className="confirm-value">{selectedFolders.size}</span>
              </div>
              <div className="confirm-stat">
                <span className="confirm-label">{t('folderDelete.selectedSize')}</span>
                <span className="confirm-value">{formatBytes(getSelectedFoldersSize())}</span>
              </div>
            </div>
            <div className="confirm-delete-buttons">
              <button
                className="btn btn-secondary"
                onClick={() => setShowConfirm(false)}
                disabled={deleting}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
                    {t('folderDelete.deleting')}
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    {t('folderDelete.confirmDelete')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Path Confirmation Modal */}
      {showDeletePathModal && pathToDelete && (
        <div className="confirm-delete-overlay" onClick={() => setShowDeletePathModal(false)}>
          <div className="confirm-delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-delete-icon delete-warning">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="64" height="64">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h2>{t('savedPaths.deleteConfirm')}</h2>
            <div className="confirm-info-box">
              <div style={{ marginBottom: '8px' }}>
                <strong>{pathToDelete.name}</strong>
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                {pathToDelete.path}
              </div>
            </div>
            <div className="confirm-delete-buttons">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowDeletePathModal(false);
                  setPathToDelete(null);
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                {t('common.cancel')}
              </button>
              <button
                className="btn btn-danger"
                onClick={confirmDeleteSavedPath}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {t('savedPaths.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Path Modal */}
      {showSavePathModal && (
        <div className="confirm-delete-overlay" onClick={() => setShowSavePathModal(false)}>
          <div className="confirm-delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-delete-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="64" height="64">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <h2>{t('savedPaths.savePath')}</h2>
            <div className="confirm-info-box">
              <p>{scanPath}</p>
            </div>
            <div className="form-group" style={{ width: '100%', marginTop: '20px' }}>
              <label>{t('savedPaths.pathName')}</label>
              <input
                type="text"
                value={savePathName}
                onChange={(e) => setSavePathName(e.target.value)}
                placeholder={t('savedPaths.pathNamePlaceholder')}
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleConfirmSavePath();
                  }
                }}
              />
            </div>
            <div className="confirm-delete-buttons">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowSavePathModal(false);
                  setSavePathName('');
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                {t('common.cancel')}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleConfirmSavePath}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {t('savedPaths.save')}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : notification.type === 'info' ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="48" height="48">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="48" height="48">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <h3>
              {notification.type === 'success'
                ? t('common.success')
                : notification.type === 'info'
                ? t('common.info')
                : t('common.error')}
            </h3>
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
