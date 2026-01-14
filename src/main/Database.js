const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');
const fs = require('fs');

class DatabaseManager {
  constructor() {
    this.db = null;
  }

  initialize() {
    try {
      const userDataPath = app.getPath('userData');
      const dbPath = path.join(userDataPath, 'fnf-delete.db');

      // Ensure directory exists
      if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, { recursive: true });
      }

      this.db = new Database(dbPath);
      this.db.pragma('journal_mode = WAL');
      this.createTables();

      console.log('Database initialized at:', dbPath);
      return true;
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  createTables() {
    // Profiles table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        avatar_color TEXT DEFAULT '#004C99',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_used_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Profile settings table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS profile_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        profile_id INTEGER NOT NULL UNIQUE,
        include_subfolders INTEGER DEFAULT 1,
        FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
      )
    `);

    // Saved paths table (favorites)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS saved_paths (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        profile_id INTEGER NOT NULL,
        path TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
      )
    `);

    // Deletion operations table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS deletion_operations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        profile_id INTEGER NOT NULL,
        operation_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        scan_path TEXT NOT NULL,
        deletion_mode TEXT NOT NULL, -- 'include' or 'exclude'
        file_extensions TEXT NOT NULL, -- comma-separated
        total_files_found INTEGER DEFAULT 0,
        total_files_deleted INTEGER DEFAULT 0,
        total_size_bytes INTEGER DEFAULT 0,
        FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
      )
    `);

    // Deleted files details table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS deleted_files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        operation_id INTEGER NOT NULL,
        profile_id INTEGER NOT NULL,
        file_path TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_extension TEXT NOT NULL,
        file_size_bytes INTEGER NOT NULL,
        deleted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (operation_id) REFERENCES deletion_operations(id) ON DELETE CASCADE,
        FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
      )
    `);

    // Permanent deletions table (for recycle bin emptying)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS permanent_deletions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        profile_id INTEGER NOT NULL,
        operation_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        total_files_deleted INTEGER DEFAULT 0,
        total_size_bytes INTEGER DEFAULT 0,
        FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
      )
    `);

    // Permanently deleted files details table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS permanently_deleted_files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        operation_id INTEGER NOT NULL,
        profile_id INTEGER NOT NULL,
        file_path TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_extension TEXT NOT NULL,
        file_size_bytes INTEGER NOT NULL,
        original_path TEXT,
        deleted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (operation_id) REFERENCES permanent_deletions(id) ON DELETE CASCADE,
        FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
      )
    `);

    // Delete Jobs table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS delete_jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        profile_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        target_path TEXT NOT NULL,
        file_extensions TEXT DEFAULT '',
        extension_mode TEXT DEFAULT 'include',
        include_subfolders INTEGER DEFAULT 1,
        schedule_type TEXT DEFAULT 'manual',
        schedule_time TEXT DEFAULT NULL,
        schedule_day INTEGER DEFAULT NULL,
        delete_type TEXT DEFAULT 'trash',
        is_active INTEGER DEFAULT 1,
        last_run_at DATETIME DEFAULT NULL,
        next_run_at DATETIME DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
      )
    `);

    // Job Executions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS job_executions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id INTEGER NOT NULL,
        profile_id INTEGER NOT NULL,
        execution_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'success',
        files_found INTEGER DEFAULT 0,
        files_deleted INTEGER DEFAULT 0,
        total_size_bytes INTEGER DEFAULT 0,
        error_message TEXT DEFAULT NULL,
        FOREIGN KEY (job_id) REFERENCES delete_jobs(id) ON DELETE CASCADE,
        FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
      )
    `);

    // Job Execution Files table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS job_execution_files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        execution_id INTEGER NOT NULL,
        file_path TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_extension TEXT NOT NULL,
        file_size_bytes INTEGER NOT NULL,
        deleted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (execution_id) REFERENCES job_executions(id) ON DELETE CASCADE
      )
    `);

    // Premium License table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS premium_license (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        profile_id INTEGER NOT NULL UNIQUE,
        is_premium INTEGER DEFAULT 0,
        license_key TEXT DEFAULT NULL,
        license_type TEXT DEFAULT 'free',
        purchase_date DATETIME DEFAULT NULL,
        expiry_date DATETIME DEFAULT NULL,
        payment_reference TEXT DEFAULT NULL,
        last_validated_at DATETIME DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for better performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_profiles_name ON profiles(name);
      CREATE INDEX IF NOT EXISTS idx_profile_settings_profile ON profile_settings(profile_id);
      CREATE INDEX IF NOT EXISTS idx_deletion_operations_profile ON deletion_operations(profile_id);
      CREATE INDEX IF NOT EXISTS idx_deletion_operations_date ON deletion_operations(operation_date);
      CREATE INDEX IF NOT EXISTS idx_deleted_files_operation ON deleted_files(operation_id);
      CREATE INDEX IF NOT EXISTS idx_deleted_files_profile ON deleted_files(profile_id);
      CREATE INDEX IF NOT EXISTS idx_deleted_files_extension ON deleted_files(file_extension);
      CREATE INDEX IF NOT EXISTS idx_deleted_files_date ON deleted_files(deleted_at);
      CREATE INDEX IF NOT EXISTS idx_saved_paths_profile ON saved_paths(profile_id);
      CREATE INDEX IF NOT EXISTS idx_permanent_deletions_profile ON permanent_deletions(profile_id);
      CREATE INDEX IF NOT EXISTS idx_permanent_deletions_date ON permanent_deletions(operation_date);
      CREATE INDEX IF NOT EXISTS idx_permanently_deleted_files_operation ON permanently_deleted_files(operation_id);
      CREATE INDEX IF NOT EXISTS idx_permanently_deleted_files_profile ON permanently_deleted_files(profile_id);
      CREATE INDEX IF NOT EXISTS idx_delete_jobs_profile ON delete_jobs(profile_id);
      CREATE INDEX IF NOT EXISTS idx_delete_jobs_schedule ON delete_jobs(schedule_type, is_active);
      CREATE INDEX IF NOT EXISTS idx_delete_jobs_next_run ON delete_jobs(next_run_at);
      CREATE INDEX IF NOT EXISTS idx_job_executions_job ON job_executions(job_id);
      CREATE INDEX IF NOT EXISTS idx_job_executions_profile ON job_executions(profile_id);
      CREATE INDEX IF NOT EXISTS idx_job_executions_date ON job_executions(execution_date);
      CREATE INDEX IF NOT EXISTS idx_premium_license_profile ON premium_license(profile_id);
    `);
  }

  // ============ PROFILE OPERATIONS ============

  createProfile(name, avatarColor = '#004C99') {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO profiles (name, avatar_color)
        VALUES (?, ?)
      `);
      const result = stmt.run(name, avatarColor);
      const profileId = result.lastInsertRowid;

      // Create default settings for the new profile
      const settingsStmt = this.db.prepare(`
        INSERT INTO profile_settings (profile_id, include_subfolders)
        VALUES (?, 1)
      `);
      settingsStmt.run(profileId);

      return {
        success: true,
        id: profileId,
        message: 'Profile created successfully'
      };
    } catch (error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        return {
          success: false,
          message: 'Profile name already exists'
        };
      }
      throw error;
    }
  }

  getAllProfiles() {
    const stmt = this.db.prepare(`
      SELECT * FROM profiles ORDER BY last_used_at DESC
    `);
    return stmt.all();
  }

  getProfile(id) {
    const stmt = this.db.prepare(`
      SELECT * FROM profiles WHERE id = ?
    `);
    return stmt.get(id);
  }

  updateProfileLastUsed(id) {
    const stmt = this.db.prepare(`
      UPDATE profiles SET last_used_at = CURRENT_TIMESTAMP WHERE id = ?
    `);
    stmt.run(id);
  }

  deleteProfile(id) {
    const stmt = this.db.prepare(`
      DELETE FROM profiles WHERE id = ?
    `);
    const result = stmt.run(id);
    return {
      success: result.changes > 0,
      message: result.changes > 0 ? 'Profile deleted' : 'Profile not found'
    };
  }

  updateProfile(id, name, avatarColor) {
    try {
      const stmt = this.db.prepare(`
        UPDATE profiles SET name = ?, avatar_color = ? WHERE id = ?
      `);
      const result = stmt.run(name, avatarColor, id);
      return {
        success: result.changes > 0,
        message: result.changes > 0 ? 'Profile updated' : 'Profile not found'
      };
    } catch (error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        return {
          success: false,
          message: 'Profile name already exists'
        };
      }
      throw error;
    }
  }

  // ============ DELETION OPERATIONS ============

  createDeletionOperation(profileId, scanPath, deletionMode, fileExtensions) {
    const stmt = this.db.prepare(`
      INSERT INTO deletion_operations
      (profile_id, scan_path, deletion_mode, file_extensions)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(profileId, scanPath, deletionMode, fileExtensions);
    return result.lastInsertRowid;
  }

  updateDeletionOperation(operationId, totalFilesFound, totalFilesDeleted, totalSizeBytes) {
    const stmt = this.db.prepare(`
      UPDATE deletion_operations
      SET total_files_found = ?,
          total_files_deleted = ?,
          total_size_bytes = ?
      WHERE id = ?
    `);
    stmt.run(totalFilesFound, totalFilesDeleted, totalSizeBytes, operationId);
  }

  addDeletedFile(operationId, profileId, filePath, fileName, fileExtension, fileSizeBytes) {
    const stmt = this.db.prepare(`
      INSERT INTO deleted_files
      (operation_id, profile_id, file_path, file_name, file_extension, file_size_bytes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(operationId, profileId, filePath, fileName, fileExtension, fileSizeBytes);
  }

  // ============ PERMANENT DELETION OPERATIONS ============

  createPermanentDeletionOperation(profileId) {
    const stmt = this.db.prepare(`
      INSERT INTO permanent_deletions (profile_id)
      VALUES (?)
    `);
    const result = stmt.run(profileId);
    return result.lastInsertRowid;
  }

  updatePermanentDeletionOperation(operationId, totalFilesDeleted, totalSizeBytes) {
    const stmt = this.db.prepare(`
      UPDATE permanent_deletions
      SET total_files_deleted = ?,
          total_size_bytes = ?
      WHERE id = ?
    `);
    stmt.run(totalFilesDeleted, totalSizeBytes, operationId);
  }

  addPermanentlyDeletedFile(operationId, profileId, filePath, fileName, fileExtension, fileSizeBytes, originalPath) {
    const stmt = this.db.prepare(`
      INSERT INTO permanently_deleted_files
      (operation_id, profile_id, file_path, file_name, file_extension, file_size_bytes, original_path)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(operationId, profileId, filePath, fileName, fileExtension, fileSizeBytes, originalPath || null);
  }

  getPermanentDeletionStats(profileId) {
    return this.db.prepare(`
      SELECT
        COUNT(*) as total_operations,
        SUM(total_files_deleted) as total_files_deleted,
        SUM(total_size_bytes) as total_size_deleted
      FROM permanent_deletions
      WHERE profile_id = ?
    `).get(profileId);
  }

  // ============ STATISTICS OPERATIONS ============

  getProfileStatistics(profileId) {
    // Total statistics
    const totalStats = this.db.prepare(`
      SELECT
        COUNT(*) as total_operations,
        SUM(total_files_deleted) as total_files_deleted,
        SUM(total_size_bytes) as total_size_deleted
      FROM deletion_operations
      WHERE profile_id = ?
    `).get(profileId);

    // Statistics by extension
    const extensionStats = this.db.prepare(`
      SELECT
        file_extension,
        COUNT(*) as count,
        SUM(file_size_bytes) as total_size
      FROM deleted_files
      WHERE profile_id = ?
      GROUP BY file_extension
      ORDER BY count DESC
    `).all(profileId);

    // Statistics by date (last 30 days)
    const dateStats = this.db.prepare(`
      SELECT
        DATE(deleted_at) as date,
        COUNT(*) as count,
        SUM(file_size_bytes) as total_size
      FROM deleted_files
      WHERE profile_id = ? AND deleted_at >= date('now', '-30 days')
      GROUP BY DATE(deleted_at)
      ORDER BY date DESC
    `).all(profileId);

    // Recent operations
    const recentOperations = this.db.prepare(`
      SELECT * FROM deletion_operations
      WHERE profile_id = ?
      ORDER BY operation_date DESC
      LIMIT 10
    `).all(profileId);

    return {
      total: totalStats,
      byExtension: extensionStats,
      byDate: dateStats,
      recentOperations
    };
  }

  getOperationDetails(operationId) {
    const operation = this.db.prepare(`
      SELECT * FROM deletion_operations WHERE id = ?
    `).get(operationId);

    const files = this.db.prepare(`
      SELECT * FROM deleted_files WHERE operation_id = ?
    `).all(operationId);

    return {
      operation,
      files
    };
  }

  // Get all-time statistics for dashboard
  getDashboardStats(profileId) {
    // Regular deletion stats (to recycle bin)
    const regularStats = this.db.prepare(`
      SELECT
        COUNT(DISTINCT do.id) as total_operations,
        COALESCE(SUM(do.total_files_deleted), 0) as total_files_deleted,
        COALESCE(SUM(do.total_size_bytes), 0) as total_size_deleted,
        (SELECT COUNT(DISTINCT file_extension) FROM deleted_files WHERE profile_id = ?) as unique_extensions
      FROM deletion_operations do
      WHERE do.profile_id = ?
    `).get(profileId, profileId);

    // Permanent deletion stats (from recycle bin)
    const permanentStats = this.db.prepare(`
      SELECT
        COUNT(*) as total_operations,
        COALESCE(SUM(total_files_deleted), 0) as total_files_deleted,
        COALESCE(SUM(total_size_bytes), 0) as total_size_deleted
      FROM permanent_deletions
      WHERE profile_id = ?
    `).get(profileId);

    return {
      ...regularStats,
      permanent_operations: permanentStats.total_operations || 0,
      permanent_files_deleted: permanentStats.total_files_deleted || 0,
      permanent_size_deleted: permanentStats.total_size_deleted || 0
    };
  }

  // ============ SAVED PATHS OPERATIONS ============

  createSavedPath(profileId, path, name) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO saved_paths (profile_id, path, name)
        VALUES (?, ?, ?)
      `);
      const result = stmt.run(profileId, path, name);
      return {
        success: true,
        id: result.lastInsertRowid,
        message: 'Path saved successfully'
      };
    } catch (error) {
      console.error('Create saved path error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  getSavedPaths(profileId) {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM saved_paths
        WHERE profile_id = ?
        ORDER BY created_at DESC
      `);
      return stmt.all(profileId);
    } catch (error) {
      console.error('Get saved paths error:', error);
      return [];
    }
  }

  deleteSavedPath(id) {
    try {
      const stmt = this.db.prepare(`
        DELETE FROM saved_paths WHERE id = ?
      `);
      const result = stmt.run(id);
      return {
        success: result.changes > 0,
        message: result.changes > 0 ? 'Path deleted' : 'Path not found'
      };
    } catch (error) {
      console.error('Delete saved path error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  updateSavedPath(id, name) {
    try {
      const stmt = this.db.prepare(`
        UPDATE saved_paths SET name = ? WHERE id = ?
      `);
      const result = stmt.run(name, id);
      return {
        success: result.changes > 0,
        message: result.changes > 0 ? 'Path updated' : 'Path not found'
      };
    } catch (error) {
      console.error('Update saved path error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // ============ PROFILE SETTINGS OPERATIONS ============

  getProfileSettings(profileId) {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM profile_settings WHERE profile_id = ?
      `);
      let settings = stmt.get(profileId);

      // If no settings exist for this profile, create default ones
      if (!settings) {
        const insertStmt = this.db.prepare(`
          INSERT INTO profile_settings (profile_id, include_subfolders)
          VALUES (?, 1)
        `);
        insertStmt.run(profileId);
        settings = stmt.get(profileId);
      }

      return settings;
    } catch (error) {
      console.error('Get profile settings error:', error);
      return null;
    }
  }

  updateProfileSettings(profileId, includeSubfolders) {
    try {
      const stmt = this.db.prepare(`
        UPDATE profile_settings
        SET include_subfolders = ?
        WHERE profile_id = ?
      `);
      const result = stmt.run(includeSubfolders ? 1 : 0, profileId);

      // If no row was updated, insert new settings
      if (result.changes === 0) {
        const insertStmt = this.db.prepare(`
          INSERT INTO profile_settings (profile_id, include_subfolders)
          VALUES (?, ?)
        `);
        insertStmt.run(profileId, includeSubfolders ? 1 : 0);
      }

      return { success: true };
    } catch (error) {
      console.error('Update profile settings error:', error);
      return { success: false, message: error.message };
    }
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }

  // ============ DELETE JOBS OPERATIONS ============

  createJob(profileId, jobData) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO delete_jobs (
          profile_id, name, target_path, file_extensions, extension_mode,
          include_subfolders, schedule_type, schedule_time, schedule_day,
          delete_type, is_active, next_run_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const result = stmt.run(
        profileId,
        jobData.name,
        jobData.targetPath,
        jobData.fileExtensions || '',
        jobData.extensionMode || 'include',
        jobData.includeSubfolders ? 1 : 0,
        jobData.scheduleType || 'manual',
        jobData.scheduleTime || null,
        jobData.scheduleDay || null,
        jobData.deleteType || 'trash',
        jobData.isActive ? 1 : 0,
        jobData.nextRunAt || null
      );
      return {
        success: true,
        id: result.lastInsertRowid,
        message: 'Job created successfully'
      };
    } catch (error) {
      console.error('Create job error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  getAllJobs(profileId) {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM delete_jobs
        WHERE profile_id = ?
        ORDER BY created_at DESC
      `);
      return stmt.all(profileId);
    } catch (error) {
      console.error('Get all jobs error:', error);
      return [];
    }
  }

  getJob(jobId) {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM delete_jobs WHERE id = ?
      `);
      return stmt.get(jobId);
    } catch (error) {
      console.error('Get job error:', error);
      return null;
    }
  }

  updateJob(jobId, jobData) {
    try {
      const stmt = this.db.prepare(`
        UPDATE delete_jobs SET
          name = ?,
          target_path = ?,
          file_extensions = ?,
          extension_mode = ?,
          include_subfolders = ?,
          schedule_type = ?,
          schedule_time = ?,
          schedule_day = ?,
          delete_type = ?,
          is_active = ?,
          next_run_at = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      const result = stmt.run(
        jobData.name,
        jobData.targetPath,
        jobData.fileExtensions || '',
        jobData.extensionMode || 'include',
        jobData.includeSubfolders ? 1 : 0,
        jobData.scheduleType || 'manual',
        jobData.scheduleTime || null,
        jobData.scheduleDay || null,
        jobData.deleteType || 'trash',
        jobData.isActive ? 1 : 0,
        jobData.nextRunAt || null,
        jobId
      );
      return {
        success: result.changes > 0,
        message: result.changes > 0 ? 'Job updated' : 'Job not found'
      };
    } catch (error) {
      console.error('Update job error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  deleteJob(jobId) {
    try {
      const stmt = this.db.prepare(`
        DELETE FROM delete_jobs WHERE id = ?
      `);
      const result = stmt.run(jobId);
      return {
        success: result.changes > 0,
        message: result.changes > 0 ? 'Job deleted' : 'Job not found'
      };
    } catch (error) {
      console.error('Delete job error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  toggleJobActive(jobId, isActive) {
    try {
      const stmt = this.db.prepare(`
        UPDATE delete_jobs SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `);
      const result = stmt.run(isActive ? 1 : 0, jobId);
      return {
        success: result.changes > 0,
        message: result.changes > 0 ? 'Job status updated' : 'Job not found'
      };
    } catch (error) {
      console.error('Toggle job active error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  updateJobLastRun(jobId, nextRunAt = null) {
    try {
      const stmt = this.db.prepare(`
        UPDATE delete_jobs SET
          last_run_at = CURRENT_TIMESTAMP,
          next_run_at = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      stmt.run(nextRunAt, jobId);
      return { success: true };
    } catch (error) {
      console.error('Update job last run error:', error);
      return { success: false };
    }
  }

  getActiveJobsByScheduleType(scheduleType) {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM delete_jobs
        WHERE schedule_type = ? AND is_active = 1
      `);
      return stmt.all(scheduleType);
    } catch (error) {
      console.error('Get active jobs by schedule type error:', error);
      return [];
    }
  }

  getDueJobs(currentTime) {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM delete_jobs
        WHERE is_active = 1
          AND schedule_type != 'manual'
          AND schedule_type != 'startup'
          AND next_run_at IS NOT NULL
          AND next_run_at <= ?
      `);
      return stmt.all(currentTime.toISOString());
    } catch (error) {
      console.error('Get due jobs error:', error);
      return [];
    }
  }

  getJobCount(profileId) {
    try {
      const stmt = this.db.prepare(`
        SELECT COUNT(*) as count FROM delete_jobs WHERE profile_id = ?
      `);
      const result = stmt.get(profileId);
      return result ? result.count : 0;
    } catch (error) {
      console.error('Get job count error:', error);
      return 0;
    }
  }

  // ============ JOB EXECUTION OPERATIONS ============

  createJobExecution(jobId, profileId) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO job_executions (job_id, profile_id)
        VALUES (?, ?)
      `);
      const result = stmt.run(jobId, profileId);
      return result.lastInsertRowid;
    } catch (error) {
      console.error('Create job execution error:', error);
      return null;
    }
  }

  updateJobExecution(executionId, data) {
    try {
      const stmt = this.db.prepare(`
        UPDATE job_executions SET
          status = ?,
          files_found = ?,
          files_deleted = ?,
          total_size_bytes = ?,
          error_message = ?
        WHERE id = ?
      `);
      stmt.run(
        data.status || 'success',
        data.filesFound || 0,
        data.filesDeleted || 0,
        data.totalSize || 0,
        data.errorMessage || null,
        executionId
      );
      return { success: true };
    } catch (error) {
      console.error('Update job execution error:', error);
      return { success: false };
    }
  }

  addJobExecutionFile(executionId, fileData) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO job_execution_files (
          execution_id, file_path, file_name, file_extension, file_size_bytes
        ) VALUES (?, ?, ?, ?, ?)
      `);
      stmt.run(
        executionId,
        fileData.filePath,
        fileData.fileName,
        fileData.fileExtension,
        fileData.fileSize
      );
      return { success: true };
    } catch (error) {
      console.error('Add job execution file error:', error);
      return { success: false };
    }
  }

  getJobExecutionHistory(jobId, limit = 20) {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM job_executions
        WHERE job_id = ?
        ORDER BY execution_date DESC
        LIMIT ?
      `);
      return stmt.all(jobId, limit);
    } catch (error) {
      console.error('Get job execution history error:', error);
      return [];
    }
  }

  getJobExecutionDetails(executionId) {
    try {
      const execution = this.db.prepare(`
        SELECT * FROM job_executions WHERE id = ?
      `).get(executionId);

      const files = this.db.prepare(`
        SELECT * FROM job_execution_files WHERE execution_id = ?
      `).all(executionId);

      return { execution, files };
    } catch (error) {
      console.error('Get job execution details error:', error);
      return { execution: null, files: [] };
    }
  }

  // ============ PREMIUM LICENSE OPERATIONS ============

  getPremiumStatus(profileId) {
    try {
      let license = this.db.prepare(`
        SELECT * FROM premium_license WHERE profile_id = ?
      `).get(profileId);

      // If no license exists, create a free one
      if (!license) {
        this.db.prepare(`
          INSERT INTO premium_license (profile_id, is_premium, license_type)
          VALUES (?, 0, 'free')
        `).run(profileId);
        license = this.db.prepare(`
          SELECT * FROM premium_license WHERE profile_id = ?
        `).get(profileId);
      }

      // Check expiry
      if (license.is_premium && license.expiry_date) {
        const expiryDate = new Date(license.expiry_date);
        if (expiryDate < new Date()) {
          // License expired
          this.db.prepare(`
            UPDATE premium_license SET is_premium = 0, updated_at = CURRENT_TIMESTAMP
            WHERE profile_id = ?
          `).run(profileId);
          license.is_premium = 0;
        }
      }

      return {
        isPremium: license.is_premium === 1,
        licenseType: license.license_type,
        expiryDate: license.expiry_date,
        purchaseDate: license.purchase_date,
        features: {
          unlimitedJobs: license.is_premium === 1,
          allScheduleTypes: license.is_premium === 1,
          permanentDeleteJobs: license.is_premium === 1,
          unlimitedHistory: license.is_premium === 1
        }
      };
    } catch (error) {
      console.error('Get premium status error:', error);
      return {
        isPremium: false,
        licenseType: 'free',
        expiryDate: null,
        features: {
          unlimitedJobs: false,
          allScheduleTypes: false,
          permanentDeleteJobs: false,
          unlimitedHistory: false
        }
      };
    }
  }

  activatePremium(profileId, licenseData) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO premium_license (
          profile_id, is_premium, license_key, license_type,
          purchase_date, expiry_date, payment_reference, last_validated_at
        ) VALUES (?, 1, ?, ?, CURRENT_TIMESTAMP, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(profile_id) DO UPDATE SET
          is_premium = 1,
          license_key = ?,
          license_type = ?,
          purchase_date = CURRENT_TIMESTAMP,
          expiry_date = ?,
          payment_reference = ?,
          last_validated_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      `);
      stmt.run(
        profileId,
        licenseData.licenseKey,
        licenseData.licenseType,
        licenseData.expiryDate || null,
        licenseData.paymentReference || null,
        // For UPDATE
        licenseData.licenseKey,
        licenseData.licenseType,
        licenseData.expiryDate || null,
        licenseData.paymentReference || null
      );
      return { success: true, message: 'Premium activated successfully' };
    } catch (error) {
      console.error('Activate premium error:', error);
      return { success: false, message: error.message };
    }
  }

  deactivatePremium(profileId) {
    try {
      const stmt = this.db.prepare(`
        UPDATE premium_license SET
          is_premium = 0,
          updated_at = CURRENT_TIMESTAMP
        WHERE profile_id = ?
      `);
      stmt.run(profileId);
      return { success: true, message: 'Premium deactivated' };
    } catch (error) {
      console.error('Deactivate premium error:', error);
      return { success: false, message: error.message };
    }
  }

  updatePremiumValidation(profileId) {
    try {
      const stmt = this.db.prepare(`
        UPDATE premium_license SET
          last_validated_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE profile_id = ?
      `);
      stmt.run(profileId);
      return { success: true };
    } catch (error) {
      console.error('Update premium validation error:', error);
      return { success: false };
    }
  }
}

module.exports = { DatabaseManager };
