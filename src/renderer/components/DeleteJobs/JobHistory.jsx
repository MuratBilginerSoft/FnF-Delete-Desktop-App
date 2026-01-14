import { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function JobHistory({ job, isPremium, onClose }) {
  const { t } = useLanguage();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExecution, setSelectedExecution] = useState(null);
  const [executionDetails, setExecutionDetails] = useState(null);

  useEffect(() => {
    loadHistory();
  }, [job]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const limit = isPremium ? 100 : 5;
      const data = await window.electronAPI.getJobHistory(job.id, limit);
      setHistory(data || []);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExecutionDetails = async (executionId) => {
    try {
      const details = await window.electronAPI.getJobExecutionDetails(executionId);
      setExecutionDetails(details);
      setSelectedExecution(executionId);
    } catch (error) {
      console.error('Failed to load execution details:', error);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  const getStatusClass = (status) => {
    const classes = {
      success: 'success',
      failed: 'failed',
      partial: 'partial'
    };
    return classes[status] || 'success';
  };

  const getStatusLabel = (status) => {
    const labels = {
      success: t('jobs.executionSuccess'),
      failed: t('jobs.executionFailed'),
      partial: t('jobs.executionPartial')
    };
    return labels[status] || status;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 700 }}>
        <div className="modal-header">
          <h2>{t('jobs.executionHistory')} - {job.name}</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="jobs-loading">
              <div className="loading-spinner"></div>
              <p>{t('common.loading')}</p>
            </div>
          ) : history.length === 0 ? (
            <div className="jobs-empty" style={{ padding: 40 }}>
              <p>{t('jobs.noHistory')}</p>
            </div>
          ) : (
            <>
              {!isPremium && history.length >= 5 && (
                <div className="job-limit-info" style={{ marginBottom: 16 }}>
                  <span>{t('jobs.historyLimitFree')}</span>
                </div>
              )}

              <div className="history-list">
                {history.map((execution) => (
                  <div
                    key={execution.id}
                    className="history-item"
                    style={{ cursor: 'pointer' }}
                    onClick={() => loadExecutionDetails(execution.id)}
                  >
                    <div className="history-item-info">
                      <span className="history-date">{formatDate(execution.execution_date)}</span>
                      <span className="history-stats">
                        {execution.files_deleted} / {execution.files_found} {t('jobs.filesDeleted')} • {formatSize(execution.total_size_bytes)}
                      </span>
                      {execution.error_message && (
                        <span className="history-error" style={{ color: '#ef4444', fontSize: 12 }}>
                          {execution.error_message}
                        </span>
                      )}
                    </div>
                    <span className={`history-status ${getStatusClass(execution.status)}`}>
                      {getStatusLabel(execution.status)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Execution Details Modal */}
          {selectedExecution && executionDetails && (
            <div className="execution-details" style={{ marginTop: 20, padding: 16, background: 'var(--bg-secondary)', borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h4 style={{ margin: 0 }}>{t('jobs.executionDetails')}</h4>
                <button
                  className="modal-close-btn"
                  onClick={() => {
                    setSelectedExecution(null);
                    setExecutionDetails(null);
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {executionDetails.files && executionDetails.files.length > 0 ? (
                <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                  {executionDetails.files.map((file, index) => (
                    <div key={index} style={{ padding: '6px 0', borderBottom: '1px solid var(--border-color)', fontSize: 12 }}>
                      <span style={{ color: 'var(--text-primary)' }}>{file.file_name}</span>
                      <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>({formatSize(file.file_size_bytes)})</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{t('jobs.noFilesDeleted')}</p>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
