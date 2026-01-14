import { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import useProfileStore from '../../store/useProfileStore';
import JobCard from './JobCard';
import JobForm from './JobForm';
import JobHistory from './JobHistory';
import UpgradeModal from './UpgradeModal';
import './DeleteJobs.css';

export default function DeleteJobs() {
  const { t } = useLanguage();
  const { currentProfile } = useProfileStore();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showJobForm, setShowJobForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedJobForHistory, setSelectedJobForHistory] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [premiumStatus, setPremiumStatus] = useState({
    isPremium: false,
    features: {}
  });

  // Load jobs and premium status
  useEffect(() => {
    if (currentProfile) {
      loadJobs();
      loadPremiumStatus();
    }
  }, [currentProfile]);

  // Listen for job execution events
  useEffect(() => {
    const handleJobExecuted = (data) => {
      console.log('Job executed:', data);
      loadJobs(); // Refresh job list
    };

    if (window.electronAPI?.onJobExecuted) {
      window.electronAPI.onJobExecuted(handleJobExecuted);
    }

    return () => {
      // Cleanup listener if needed
    };
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const jobList = await window.electronAPI.getAllJobs(currentProfile.id);
      setJobs(jobList || []);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPremiumStatus = async () => {
    try {
      const status = await window.electronAPI.getPremiumStatus(currentProfile.id);
      setPremiumStatus(status);
    } catch (error) {
      console.error('Failed to load premium status:', error);
    }
  };

  const handleCreateJob = () => {
    // Check job limit for free users (3 manual jobs allowed)
    if (!premiumStatus.isPremium && jobs.length >= 3) {
      setShowUpgradeModal(true);
      return;
    }
    setEditingJob(null);
    setShowJobForm(true);
  };

  const handleEditJob = (job) => {
    setEditingJob(job);
    setShowJobForm(true);
  };

  const handleDeleteJob = async (jobId) => {
    try {
      const result = await window.electronAPI.deleteJob(jobId);
      if (result.success) {
        loadJobs();
      }
    } catch (error) {
      console.error('Failed to delete job:', error);
    }
  };

  const handleToggleActive = async (jobId, isActive) => {
    try {
      const result = await window.electronAPI.toggleJobActive(jobId, isActive);
      if (result.success) {
        loadJobs();
      }
    } catch (error) {
      console.error('Failed to toggle job:', error);
    }
  };

  const handleRunNow = async (jobId) => {
    try {
      await window.electronAPI.runJobNow(jobId);
      loadJobs();
    } catch (error) {
      console.error('Failed to run job:', error);
    }
  };

  const handleViewHistory = (job) => {
    setSelectedJobForHistory(job);
    setShowHistory(true);
  };

  const handleJobFormClose = () => {
    setShowJobForm(false);
    setEditingJob(null);
  };

  const handleJobSaved = () => {
    loadJobs();
    handleJobFormClose();
  };

  return (
    <div className="delete-jobs-page">
      {/* Header */}
      <div className="jobs-header">
        <div className="jobs-header-content">
          <h1 className="jobs-title gradient-text">{t('jobs.title')}</h1>
          <p className="jobs-subtitle">{t('jobs.subtitle')}</p>
        </div>
        <button className="btn btn-primary create-job-btn" onClick={handleCreateJob}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t('jobs.create')}
        </button>
      </div>

      {/* Premium Badge */}
      {premiumStatus.isPremium && (
        <div className="premium-badge">
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span>{t('premium.active')}</span>
        </div>
      )}

      {/* Job Count Info */}
      {!premiumStatus.isPremium && (
        <div className="job-limit-info">
          <span>{t('jobs.jobCount')}: {jobs.length}/3</span>
          <button className="upgrade-link" onClick={() => setShowUpgradeModal(true)}>
            {t('premium.upgrade')}
          </button>
        </div>
      )}

      {/* Jobs List */}
      <div className="jobs-content">
        {loading ? (
          <div className="jobs-loading">
            <div className="loading-spinner"></div>
            <p>{t('common.loading')}</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="jobs-empty">
            <div className="empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="64" height="64">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3>{t('jobs.noJobs')}</h3>
            <p>{t('jobs.createFirst')}</p>
            <button className="btn btn-primary" onClick={handleCreateJob}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('jobs.create')}
            </button>
          </div>
        ) : (
          <div className="jobs-grid">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                isPremium={premiumStatus.isPremium}
                onEdit={handleEditJob}
                onDelete={handleDeleteJob}
                onToggleActive={handleToggleActive}
                onRunNow={handleRunNow}
                onViewHistory={handleViewHistory}
              />
            ))}
          </div>
        )}
      </div>

      {/* Job Form Modal */}
      {showJobForm && (
        <JobForm
          job={editingJob}
          isPremium={premiumStatus.isPremium}
          onClose={handleJobFormClose}
          onSave={handleJobSaved}
          onUpgradeRequired={() => {
            handleJobFormClose();
            setShowUpgradeModal(true);
          }}
        />
      )}

      {/* Job History Modal */}
      {showHistory && selectedJobForHistory && (
        <JobHistory
          job={selectedJobForHistory}
          isPremium={premiumStatus.isPremium}
          onClose={() => {
            setShowHistory(false);
            setSelectedJobForHistory(null);
          }}
        />
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <UpgradeModal onClose={() => setShowUpgradeModal(false)} />
      )}
    </div>
  );
}
