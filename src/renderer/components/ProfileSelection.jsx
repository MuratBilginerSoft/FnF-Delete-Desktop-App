import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import useProfileStore from '../store/useProfileStore';
import CreateProfile from './CreateProfile';
import './ProfileSelection.css';

export default function ProfileSelection({ onProfileSelected }) {
  const { t } = useLanguage();
  const { profiles, setProfiles, setCurrentProfile } = useProfileStore();
  const [showCreatePage, setShowCreatePage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    loadProfiles();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuId]);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const allProfiles = await window.electronAPI.getAllProfiles();
      setProfiles(allProfiles);
    } catch (error) {
      console.error('Failed to load profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSelect = async (profile) => {
    try {
      await window.electronAPI.updateProfileLastUsed(profile.id);
      setCurrentProfile(profile);
      onProfileSelected(profile);
    } catch (error) {
      console.error('Failed to select profile:', error);
    }
  };

  const handleProfileCreated = (newProfile) => {
    setShowCreatePage(false);
    loadProfiles();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleMenuToggle = (e, profileId) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === profileId ? null : profileId);
  };

  const handleDeleteClick = (e, profile) => {
    e.stopPropagation();
    setProfileToDelete(profile);
    setShowDeleteModal(true);
    setOpenMenuId(null);
  };

  const handleConfirmDelete = async () => {
    if (!profileToDelete) return;

    try {
      const result = await window.electronAPI.deleteProfile(profileToDelete.id);
      if (result.success) {
        await loadProfiles();
        setShowDeleteModal(false);
        setProfileToDelete(null);
      } else {
        console.error('Failed to delete profile:', result.message);
      }
    } catch (error) {
      console.error('Error deleting profile:', error);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setProfileToDelete(null);
  };

  if (loading) {
    return (
      <div className="profile-selection">
        <div className="profile-loading">
          <div className="spinner"></div>
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // Show create profile page if triggered
  if (showCreatePage) {
    return (
      <CreateProfile
        onBack={() => setShowCreatePage(false)}
        onCreated={handleProfileCreated}
      />
    );
  }

  return (
    <div className="profile-selection">
      {/* Window Controls */}
      <div className="profile-window-controls">
        <button
          className="window-btn minimize-btn"
          onClick={() => window.electronAPI.minimizeWindow()}
          title="Minimize"
        >
          <svg width="10" height="1" viewBox="0 0 10 1">
            <path d="M0 0h10v1H0z" fill="currentColor" />
          </svg>
        </button>
        <button
          className="window-btn maximize-btn"
          onClick={() => window.electronAPI.maximizeWindow()}
          title="Maximize"
        >
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path d="M0 0v10h10V0H0zm1 1h8v8H1V1z" fill="currentColor" />
          </svg>
        </button>
        <button
          className="window-btn close-btn"
          onClick={() => window.electronAPI.closeWindow()}
          title="Close"
        >
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path
              d="M0 0l10 10M10 0L0 10"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        </button>
      </div>

      {/* Animated background shapes */}
      <div className="profile-bg-shape shape-1"></div>
      <div className="profile-bg-shape shape-2"></div>
      <div className="profile-bg-shape shape-3"></div>
      <div className="profile-bg-shape shape-4"></div>
      <div className="profile-bg-shape shape-5"></div>

      {/* Geometric decorations - rotating squares */}
      <div className="profile-geometric geo-1"></div>
      <div className="profile-geometric geo-2"></div>
      <div className="profile-geometric geo-3"></div>
      <div className="profile-geometric geo-4"></div>
      <div className="profile-geometric geo-5"></div>

      <div className="profile-container">
        <div className="profile-header">
          <h1 className="gradient-text">{t('profile.select')}</h1>
          <p className="profile-subtitle">
            {profiles.length === 0
              ? t('profile.createFirst')
              : t('profile.chooseOrCreate')}
          </p>
        </div>

        {profiles.length > 0 ? (
          <div className="profile-grid">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className="profile-card"
                onClick={() => handleProfileSelect(profile)}
              >
                {/* 3-dot menu button */}
                <button
                  className="profile-card-menu"
                  onClick={(e) => handleMenuToggle(e, profile.id)}
                  title="Options"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="12" cy="19" r="2" />
                  </svg>
                </button>

                {/* Dropdown menu */}
                {openMenuId === profile.id && (
                  <div ref={dropdownRef} className="profile-dropdown">
                    <button
                      className="profile-dropdown-item danger"
                      onClick={(e) => handleDeleteClick(e, profile)}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      {t('profile.delete')}
                    </button>
                  </div>
                )}

                <div
                  className="profile-card-avatar"
                  style={{ background: profile.avatar_color }}
                >
                  {profile.name.charAt(0).toUpperCase()}
                </div>
                <h3 className="profile-card-name">{profile.name}</h3>
                <p className="profile-card-last-used">
                  {t('profile.lastUsed')} {formatDate(profile.last_used_at)}
                </p>
              </div>
            ))}

            {/* Create new profile card */}
            <div
              className="profile-card create-card"
              onClick={() => setShowCreatePage(true)}
            >
              <div className="create-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <h3 className="create-text">{t('profile.create')}</h3>
            </div>
          </div>
        ) : (
          <div className="profile-empty">
            <div className="empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <button className="btn btn-primary" onClick={() => setShowCreatePage(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              {t('profile.createNew')}
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && profileToDelete && (
        <div className="delete-modal-overlay" onClick={handleCancelDelete}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-header">
              <div className="delete-modal-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h2 className="delete-modal-title">{t('profile.delete')}</h2>
            </div>

            <div className="delete-modal-content">
              <div className="delete-modal-profile-info">
                <div
                  className="delete-modal-avatar"
                  style={{ background: profileToDelete.avatar_color }}
                >
                  {profileToDelete.name.charAt(0).toUpperCase()}
                </div>
                <h3 className="delete-modal-profile-name">{profileToDelete.name}</h3>
              </div>

              <p className="delete-modal-message">
                {t('profile.deleteConfirm')}
              </p>

              <div className="delete-modal-warning">
                <svg
                  className="delete-modal-warning-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <p className="delete-modal-warning-text">
                  {t('profile.deleteWarning')}
                </p>
              </div>
            </div>

            <div className="delete-modal-actions">
              <button
                className="delete-modal-btn delete-modal-btn-cancel"
                onClick={handleCancelDelete}
              >
                {t('common.cancel')}
              </button>
              <button
                className="delete-modal-btn delete-modal-btn-delete"
                onClick={handleConfirmDelete}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                {t('profile.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
