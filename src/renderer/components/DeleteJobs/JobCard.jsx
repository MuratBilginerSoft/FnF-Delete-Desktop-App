import { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function JobCard({ job, isPremium, onEdit, onDelete, onToggleActive, onRunNow, onViewHistory }) {
  const { t } = useLanguage();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const getScheduleTypeLabel = (type) => {
    const labels = {
      manual: t('jobs.scheduleManual'),
      daily: t('jobs.scheduleDaily'),
      weekly: t('jobs.scheduleWeekly'),
      monthly: t('jobs.scheduleMonthly'),
      startup: t('jobs.scheduleStartup')
    };
    return labels[type] || type;
  };

  const getDeleteTypeLabel = (type) => {
    return type === 'permanent' ? t('jobs.deleteTypePermanent') : t('jobs.deleteTypeTrash');
  };

  const getDayLabel = (day, scheduleType) => {
    if (scheduleType === 'weekly') {
      const days = [
        t('common.sunday'),
        t('common.monday'),
        t('common.tuesday'),
        t('common.wednesday'),
        t('common.thursday'),
        t('common.friday'),
        t('common.saturday')
      ];
      return days[day] || '';
    }
    if (scheduleType === 'monthly') {
      return `${day}. ${t('common.day')}`;
    }
    return '';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  const handleRunNow = async () => {
    setIsRunning(true);
    try {
      await onRunNow(job.id);
    } finally {
      setIsRunning(false);
    }
  };

  const handleDelete = () => {
    onDelete(job.id);
    setShowDeleteConfirm(false);
  };

  return (
    <div className={`job-card ${job.is_active ? '' : 'inactive'}`}>
      {/* Header */}
      <div className="job-card-header">
        <div className="job-card-title">
          <h3>{job.name}</h3>
          <span className={`job-status-badge ${job.is_active ? 'active' : 'inactive'}`}>
            {job.is_active ? t('jobs.active') : t('jobs.inactive')}
          </span>
        </div>
        <div className="job-card-actions">
          <button
            className="job-action-btn"
            onClick={() => onViewHistory(job)}
            title={t('jobs.history')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <button
            className="job-action-btn"
            onClick={() => onEdit(job)}
            title={t('jobs.edit')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            className="job-action-btn danger"
            onClick={() => setShowDeleteConfirm(true)}
            title={t('jobs.delete')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="job-card-info">
        <div className="job-info-row">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <span className="value" title={job.target_path}>
            {job.target_path.length > 40 ? '...' + job.target_path.slice(-40) : job.target_path}
          </span>
        </div>
        <div className="job-info-row">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="value">
            {getScheduleTypeLabel(job.schedule_type)}
            {job.schedule_time && ` - ${job.schedule_time}`}
            {job.schedule_day !== null && job.schedule_type !== 'daily' && ` (${getDayLabel(job.schedule_day, job.schedule_type)})`}
          </span>
        </div>
        <div className="job-info-row">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span className="value">{getDeleteTypeLabel(job.delete_type)}</span>
        </div>
        {job.file_extensions && (
          <div className="job-info-row">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="value">
              {job.extension_mode === 'all' ? t('jobs.allFiles') : job.file_extensions}
            </span>
          </div>
        )}
      </div>

      {/* Schedule Info */}
      <div className="job-card-schedule">
        <div className="schedule-info">
          <span className="schedule-label">{t('jobs.lastRun')}</span>
          <span className="schedule-value">{formatDate(job.last_run_at)}</span>
        </div>
        <div className="schedule-info">
          <span className="schedule-label">{t('jobs.nextRun')}</span>
          <span className="schedule-value">{formatDate(job.next_run_at)}</span>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="job-card-footer">
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={job.is_active === 1}
            onChange={(e) => onToggleActive(job.id, e.target.checked)}
          />
          <span className="toggle-slider"></span>
        </label>
        <button
          className="btn btn-primary"
          onClick={handleRunNow}
          disabled={isRunning}
        >
          {isRunning ? (
            <>
              <span className="loading-spinner" style={{ width: 16, height: 16 }}></span>
              {t('jobs.running')}
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t('jobs.runNow')}
            </>
          )}
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2>{t('jobs.delete')}</h2>
              <button className="modal-close-btn" onClick={() => setShowDeleteConfirm(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <p>{t('jobs.deleteConfirm')}</p>
              <p style={{ fontWeight: 600, marginTop: 8 }}>{job.name}</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)}>
                {t('common.cancel')}
              </button>
              <button className="btn btn-danger" onClick={handleDelete}>
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
