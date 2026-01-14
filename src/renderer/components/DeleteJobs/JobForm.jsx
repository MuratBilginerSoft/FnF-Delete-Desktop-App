import { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import useProfileStore from '../../store/useProfileStore';

export default function JobForm({ job, isPremium, onClose, onSave, onUpgradeRequired }) {
  const { t } = useLanguage();
  const { currentProfile } = useProfileStore();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    targetPath: '',
    fileExtensions: '',
    extensionMode: 'include',
    includeSubfolders: true,
    scheduleType: 'manual',
    scheduleTime: '00:00',
    scheduleDay: 0,
    deleteType: 'trash',
    isActive: true
  });

  useEffect(() => {
    if (job) {
      setFormData({
        name: job.name || '',
        targetPath: job.target_path || '',
        fileExtensions: job.file_extensions || '',
        extensionMode: job.extension_mode || 'include',
        includeSubfolders: job.include_subfolders === 1,
        scheduleType: job.schedule_type || 'manual',
        scheduleTime: job.schedule_time || '00:00',
        scheduleDay: job.schedule_day || 0,
        deleteType: job.delete_type || 'trash',
        isActive: job.is_active === 1
      });
    }
  }, [job]);

  const handleChange = (field, value) => {
    // Check premium features
    if (field === 'scheduleType' && value !== 'manual' && !isPremium) {
      onUpgradeRequired();
      return;
    }
    if (field === 'deleteType' && value === 'permanent' && !isPremium) {
      onUpgradeRequired();
      return;
    }

    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleBrowse = async () => {
    try {
      const result = await window.electronAPI.selectFolder();
      if (result.success && result.path) {
        setFormData(prev => ({ ...prev, targetPath: result.path }));
      }
    } catch (error) {
      console.error('Failed to select folder:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.targetPath.trim()) {
      return;
    }

    setSaving(true);
    try {
      let result;
      if (job) {
        result = await window.electronAPI.updateJob(job.id, formData);
      } else {
        result = await window.electronAPI.createJob(currentProfile.id, formData);
      }

      if (result.success) {
        onSave();
      } else {
        console.error('Failed to save job:', result.message);
      }
    } catch (error) {
      console.error('Failed to save job:', error);
    } finally {
      setSaving(false);
    }
  };

  const weekDays = [
    { value: 0, label: t('common.sunday') },
    { value: 1, label: t('common.monday') },
    { value: 2, label: t('common.tuesday') },
    { value: 3, label: t('common.wednesday') },
    { value: 4, label: t('common.thursday') },
    { value: 5, label: t('common.friday') },
    { value: 6, label: t('common.saturday') }
  ];

  const monthDays = Array.from({ length: 31 }, (_, i) => ({
    value: i + 1,
    label: `${i + 1}`
  }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{job ? t('jobs.edit') : t('jobs.create')}</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Job Name */}
            <div className="form-group">
              <label className="form-label">{t('jobs.name')}</label>
              <input
                type="text"
                className="form-input"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder={t('jobs.namePlaceholder')}
                required
              />
            </div>

            {/* Target Path */}
            <div className="form-group">
              <label className="form-label">{t('jobs.targetPath')}</label>
              <div className="path-input-group">
                <input
                  type="text"
                  className="form-input"
                  value={formData.targetPath}
                  onChange={(e) => handleChange('targetPath', e.target.value)}
                  placeholder={t('jobs.targetPathPlaceholder')}
                  required
                />
                <button type="button" className="btn btn-secondary browse-btn" onClick={handleBrowse}>
                  {t('common.browse')}
                </button>
              </div>
            </div>

            {/* Extension Mode and Extensions */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">{t('jobs.extensionMode')}</label>
                <select
                  className="form-select"
                  value={formData.extensionMode}
                  onChange={(e) => handleChange('extensionMode', e.target.value)}
                >
                  <option value="all">{t('jobs.allFiles')}</option>
                  <option value="include">{t('jobs.includeOnly')}</option>
                  <option value="exclude">{t('jobs.excludeOnly')}</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{t('jobs.fileExtensions')}</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.fileExtensions}
                  onChange={(e) => handleChange('fileExtensions', e.target.value)}
                  placeholder="jpg, png, tmp"
                  disabled={formData.extensionMode === 'all'}
                />
                <p className="form-hint">{t('jobs.extensionsHint')}</p>
              </div>
            </div>

            {/* Include Subfolders */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={formData.includeSubfolders}
                    onChange={(e) => handleChange('includeSubfolders', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
                {t('jobs.includeSubfolders')}
              </label>
            </div>

            {/* Schedule Type */}
            <div className="form-group">
              <label className="form-label">
                {t('jobs.scheduleType')}
                {!isPremium && <span className="premium-feature-badge">Premium</span>}
              </label>
              <select
                className="form-select"
                value={formData.scheduleType}
                onChange={(e) => handleChange('scheduleType', e.target.value)}
              >
                <option value="manual">{t('jobs.scheduleManual')}</option>
                <option value="startup" disabled={!isPremium}>
                  {t('jobs.scheduleStartup')} {!isPremium && '(Premium)'}
                </option>
                <option value="daily" disabled={!isPremium}>
                  {t('jobs.scheduleDaily')} {!isPremium && '(Premium)'}
                </option>
                <option value="weekly" disabled={!isPremium}>
                  {t('jobs.scheduleWeekly')} {!isPremium && '(Premium)'}
                </option>
                <option value="monthly" disabled={!isPremium}>
                  {t('jobs.scheduleMonthly')} {!isPremium && '(Premium)'}
                </option>
              </select>
            </div>

            {/* Schedule Time (for daily, weekly, monthly) */}
            {['daily', 'weekly', 'monthly'].includes(formData.scheduleType) && (
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t('jobs.scheduleTime')}</label>
                  <input
                    type="time"
                    className="form-input"
                    value={formData.scheduleTime}
                    onChange={(e) => handleChange('scheduleTime', e.target.value)}
                  />
                </div>

                {formData.scheduleType === 'weekly' && (
                  <div className="form-group">
                    <label className="form-label">{t('jobs.scheduleDay')}</label>
                    <select
                      className="form-select"
                      value={formData.scheduleDay}
                      onChange={(e) => handleChange('scheduleDay', parseInt(e.target.value))}
                    >
                      {weekDays.map(day => (
                        <option key={day.value} value={day.value}>{day.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                {formData.scheduleType === 'monthly' && (
                  <div className="form-group">
                    <label className="form-label">{t('jobs.scheduleDay')}</label>
                    <select
                      className="form-select"
                      value={formData.scheduleDay}
                      onChange={(e) => handleChange('scheduleDay', parseInt(e.target.value))}
                    >
                      {monthDays.map(day => (
                        <option key={day.value} value={day.value}>{day.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Delete Type */}
            <div className="form-group">
              <label className="form-label">
                {t('jobs.deleteType')}
                {!isPremium && <span className="premium-feature-badge">Premium</span>}
              </label>
              <select
                className="form-select"
                value={formData.deleteType}
                onChange={(e) => handleChange('deleteType', e.target.value)}
              >
                <option value="trash">{t('jobs.deleteTypeTrash')}</option>
                <option value="permanent" disabled={!isPremium}>
                  {t('jobs.deleteTypePermanent')} {!isPremium && '(Premium)'}
                </option>
              </select>
            </div>

            {/* Active Toggle */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => handleChange('isActive', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
                {t('jobs.isActive')}
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || !formData.name.trim() || !formData.targetPath.trim()}
            >
              {saving ? t('common.saving') : (job ? t('common.save') : t('common.create'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
