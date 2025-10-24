import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import useProfileStore from '../store/useProfileStore';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import './Statistics.css';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

export default function Statistics() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { currentProfile } = useProfileStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentProfile) {
      loadStats();
    }
  }, [currentProfile]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const profileStats = await window.electronAPI.getProfileStatistics(currentProfile.id);
      setStats(profileStats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // Chart theme colors
  const getChartColors = () => {
    if (theme === 'dark') {
      return {
        text: '#FFFFFF',
        grid: '#003A7D',
        background: [
          'rgba(0, 76, 153, 0.8)',
          'rgba(0, 102, 204, 0.8)',
          'rgba(0, 163, 255, 0.8)',
          'rgba(35, 131, 226, 0.8)',
          'rgba(144, 101, 176, 0.8)',
          'rgba(226, 85, 161, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
        border: [
          '#004C99',
          '#0066CC',
          '#00A3FF',
          '#2383e2',
          '#9065b0',
          '#e255a1',
          '#10b981',
          '#f59e0b',
          '#ef4444',
          '#8b5cf6',
        ],
      };
    } else {
      return {
        text: '#37352f',
        grid: '#e2e8f0',
        background: [
          'rgba(35, 131, 226, 0.6)',
          'rgba(144, 101, 176, 0.6)',
          'rgba(226, 85, 161, 0.6)',
          'rgba(16, 185, 129, 0.6)',
          'rgba(245, 158, 11, 0.6)',
          'rgba(239, 68, 68, 0.6)',
          'rgba(139, 92, 246, 0.6)',
          'rgba(236, 72, 153, 0.6)',
          'rgba(20, 184, 166, 0.6)',
          'rgba(99, 102, 241, 0.6)',
        ],
        border: [
          '#2383e2',
          '#9065b0',
          '#e255a1',
          '#10b981',
          '#f59e0b',
          '#ef4444',
          '#8b5cf6',
          '#ec4899',
          '#14b8a6',
          '#6366f1',
        ],
      };
    }
  };

  const colors = getChartColors();

  // Prepare chart data
  const getExtensionChartData = () => {
    if (!stats?.byExtension || stats.byExtension.length === 0) return null;

    const top10 = stats.byExtension.slice(0, 10);

    return {
      labels: top10.map((item) => `.${item.file_extension}`),
      datasets: [
        {
          label: t('stats.files'),
          data: top10.map((item) => item.count),
          backgroundColor: colors.background,
          borderColor: colors.border,
          borderWidth: 2,
        },
      ],
    };
  };

  const getDateChartData = () => {
    if (!stats?.byDate || stats.byDate.length === 0) return null;

    return {
      labels: stats.byDate.map((item) => new Date(item.date).toLocaleDateString()),
      datasets: [
        {
          label: t('stats.files'),
          data: stats.byDate.map((item) => item.count),
          backgroundColor: 'rgba(0, 163, 255, 0.6)',
          borderColor: '#00A3FF',
          borderWidth: 2,
          tension: 0.4,
        },
      ],
    };
  };

  const getSizeChartData = () => {
    if (!stats?.byExtension || stats.byExtension.length === 0) return null;

    const top10 = stats.byExtension.slice(0, 10);

    return {
      labels: top10.map((item) => `.${item.file_extension}`),
      datasets: [
        {
          label: t('stats.size'),
          data: top10.map((item) => (item.total_size / 1024 / 1024).toFixed(2)), // MB
          backgroundColor: colors.background,
          borderColor: colors.border,
          borderWidth: 2,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: colors.text,
          font: {
            family: 'Montserrat',
            size: 12,
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: colors.text },
        grid: { color: colors.grid },
      },
      y: {
        ticks: { color: colors.text },
        grid: { color: colors.grid },
      },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: colors.text,
          font: {
            family: 'Montserrat',
            size: 11,
          },
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="statistics loading-state">
        <div className="spinner"></div>
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  if (!stats || (stats.byExtension.length === 0 && stats.byDate.length === 0)) {
    return (
      <div className="statistics">
        <div className="page-header">
          <h1>{t('stats.title')}</h1>
        </div>
        <div className="empty-state card">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="80" height="80">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <h2>{t('stats.noData')}</h2>
          <p>{t('delete.selectPath')}</p>
        </div>
      </div>
    );
  }

  const extensionData = getExtensionChartData();
  const dateData = getDateChartData();
  const sizeData = getSizeChartData();

  return (
    <div className="statistics">
      <div className="stats-header">
        <div className="stats-header-content">
          <div className="stats-profile-info">
            <div
              className="stats-profile-avatar"
              style={{
                background: currentProfile?.color || '#00A3FF',
                boxShadow: `0 8px 24px ${currentProfile?.color}40`
              }}
            >
              {currentProfile?.emoji || '📊'}
            </div>
            <div className="stats-profile-details">
              <div className="stats-profile-name">{currentProfile?.name}</div>
              <div className="stats-page-title">{t('stats.title')}</div>
            </div>
          </div>
          <div className="stats-header-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card card">
          <h3>{t('dashboard.stats.operations')}</h3>
          <div className="summary-value">{stats.total?.total_operations || 0}</div>
        </div>
        <div className="summary-card card">
          <h3>{t('dashboard.stats.filesDeleted')}</h3>
          <div className="summary-value">{stats.total?.total_files_deleted || 0}</div>
        </div>
        <div className="summary-card card">
          <h3>{t('dashboard.stats.sizeDeleted')}</h3>
          <div className="summary-value">{formatBytes(stats.total?.total_size_deleted || 0)}</div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        {/* Extension Pie Chart */}
        {extensionData && (
          <div className="chart-card card">
            <h2>{t('stats.byExtension')}</h2>
            <div className="chart-container">
              <Pie data={extensionData} options={pieOptions} />
            </div>
          </div>
        )}

        {/* Date Line Chart */}
        {dateData && (
          <div className="chart-card card">
            <h2>{t('stats.byDate')} (30 {t('stats.date')})</h2>
            <div className="chart-container">
              <Line data={dateData} options={chartOptions} />
            </div>
          </div>
        )}

        {/* Size Bar Chart */}
        {sizeData && (
          <div className="chart-card card">
            <h2>{t('stats.size')} (MB)</h2>
            <div className="chart-container">
              <Bar data={sizeData} options={chartOptions} />
            </div>
          </div>
        )}
      </div>

      {/* Recent Operations */}
      {stats.recentOperations && stats.recentOperations.length > 0 && (
        <div className="recent-operations card">
          <h2>{t('stats.recentOperations')}</h2>
          <div className="operations-list">
            {stats.recentOperations.map((op) => (
              <div key={op.id} className="operation-item">
                <div className="operation-info">
                  <div className="operation-path">{op.scan_path}</div>
                  <div className="operation-meta">
                    {new Date(op.operation_date).toLocaleString()} • {op.total_files_deleted} {t('stats.files')} • {formatBytes(op.total_size_bytes)}
                  </div>
                </div>
                <div className="operation-mode">
                  <span className={`mode-badge ${op.deletion_mode}`}>
                    {op.deletion_mode === 'include' ? t('delete.modeInclude') : t('delete.modeExclude')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
