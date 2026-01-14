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

      // Use different database for development and production
      const isDev = !app.isPackaged;
      const dbName = isDev ? 'fnf-delete-dev.db' : 'fnf-delete.db';
      const dbPath = path.join(userDataPath, dbName);

      // Ensure directory exists
      if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, { recursive: true });
      }

      this.db = new Database(dbPath);
      this.db.pragma('journal_mode = WAL');
      this.createTables();

      console.log(`Database initialized at: ${dbPath} (${isDev ? 'DEVELOPMENT' : 'PRODUCTION'})`);
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

  // ============ BACKUP / RESTORE OPERATIONS ============

  /**
   * Export all database data to JSON format
   */
  exportAllData() {
    try {
      const profiles = this.db.prepare('SELECT * FROM profiles').all();
      const profileSettings = this.db.prepare('SELECT * FROM profile_settings').all();
      const savedPaths = this.db.prepare('SELECT * FROM saved_paths').all();
      const deletionOperations = this.db.prepare('SELECT * FROM deletion_operations').all();
      const deletedFiles = this.db.prepare('SELECT * FROM deleted_files').all();
      const permanentDeletions = this.db.prepare('SELECT * FROM permanent_deletions').all();
      const permanentlyDeletedFiles = this.db.prepare('SELECT * FROM permanently_deleted_files').all();

      return {
        version: '1.0',
        appVersion: '1.4.2',
        exportDate: new Date().toISOString(),
        data: {
          profiles,
          profileSettings,
          savedPaths,
          deletionOperations,
          deletedFiles,
          permanentDeletions,
          permanentlyDeletedFiles
        }
      };
    } catch (error) {
      console.error('Export data error:', error);
      throw error;
    }
  }

  /**
   * Validate backup data structure
   */
  validateBackupData(jsonData) {
    try {
      // Check version
      if (!jsonData.version) {
        return { valid: false, error: 'Missing version field' };
      }

      // Check data object
      if (!jsonData.data) {
        return { valid: false, error: 'Missing data field' };
      }

      // Check required tables
      const requiredTables = [
        'profiles',
        'profileSettings',
        'savedPaths',
        'deletionOperations',
        'deletedFiles',
        'permanentDeletions',
        'permanentlyDeletedFiles'
      ];

      for (const table of requiredTables) {
        if (!Array.isArray(jsonData.data[table])) {
          return { valid: false, error: `Missing or invalid table: ${table}` };
        }
      }

      // Check profiles have required fields
      for (const profile of jsonData.data.profiles) {
        if (!profile.name) {
          return { valid: false, error: 'Profile missing name field' };
        }
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Import data from JSON backup (replaces all existing data)
   */
  importAllData(jsonData) {
    const transaction = this.db.transaction(() => {
      // Clear all existing data (in reverse order of dependencies)
      this.db.exec('DELETE FROM permanently_deleted_files');
      this.db.exec('DELETE FROM permanent_deletions');
      this.db.exec('DELETE FROM deleted_files');
      this.db.exec('DELETE FROM deletion_operations');
      this.db.exec('DELETE FROM saved_paths');
      this.db.exec('DELETE FROM profile_settings');
      this.db.exec('DELETE FROM profiles');

      // Reset autoincrement counters
      this.db.exec("DELETE FROM sqlite_sequence WHERE name IN ('profiles', 'profile_settings', 'saved_paths', 'deletion_operations', 'deleted_files', 'permanent_deletions', 'permanently_deleted_files')");

      const data = jsonData.data;

      // Create ID mapping for profiles (old ID -> new ID)
      const profileIdMap = new Map();

      // Import profiles
      const insertProfile = this.db.prepare(`
        INSERT INTO profiles (name, avatar_color, created_at, last_used_at)
        VALUES (?, ?, ?, ?)
      `);
      for (const profile of data.profiles) {
        const result = insertProfile.run(
          profile.name,
          profile.avatar_color || '#004C99',
          profile.created_at || new Date().toISOString(),
          profile.last_used_at || new Date().toISOString()
        );
        profileIdMap.set(profile.id, result.lastInsertRowid);
      }

      // Import profile settings
      const insertSettings = this.db.prepare(`
        INSERT INTO profile_settings (profile_id, include_subfolders)
        VALUES (?, ?)
      `);
      for (const setting of data.profileSettings) {
        const newProfileId = profileIdMap.get(setting.profile_id);
        if (newProfileId) {
          insertSettings.run(newProfileId, setting.include_subfolders ?? 1);
        }
      }

      // Import saved paths
      const insertSavedPath = this.db.prepare(`
        INSERT INTO saved_paths (profile_id, path, name, created_at)
        VALUES (?, ?, ?, ?)
      `);
      for (const savedPath of data.savedPaths) {
        const newProfileId = profileIdMap.get(savedPath.profile_id);
        if (newProfileId) {
          insertSavedPath.run(
            newProfileId,
            savedPath.path,
            savedPath.name,
            savedPath.created_at || new Date().toISOString()
          );
        }
      }

      // Create ID mapping for deletion operations (old ID -> new ID)
      const operationIdMap = new Map();

      // Import deletion operations
      const insertOperation = this.db.prepare(`
        INSERT INTO deletion_operations (profile_id, operation_date, scan_path, deletion_mode, file_extensions, total_files_found, total_files_deleted, total_size_bytes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const op of data.deletionOperations) {
        const newProfileId = profileIdMap.get(op.profile_id);
        if (newProfileId) {
          const result = insertOperation.run(
            newProfileId,
            op.operation_date,
            op.scan_path,
            op.deletion_mode,
            op.file_extensions,
            op.total_files_found || 0,
            op.total_files_deleted || 0,
            op.total_size_bytes || 0
          );
          operationIdMap.set(op.id, result.lastInsertRowid);
        }
      }

      // Import deleted files
      const insertDeletedFile = this.db.prepare(`
        INSERT INTO deleted_files (operation_id, profile_id, file_path, file_name, file_extension, file_size_bytes, deleted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      for (const file of data.deletedFiles) {
        const newProfileId = profileIdMap.get(file.profile_id);
        const newOperationId = operationIdMap.get(file.operation_id);
        if (newProfileId && newOperationId) {
          insertDeletedFile.run(
            newOperationId,
            newProfileId,
            file.file_path,
            file.file_name,
            file.file_extension,
            file.file_size_bytes,
            file.deleted_at
          );
        }
      }

      // Create ID mapping for permanent deletions (old ID -> new ID)
      const permanentOpIdMap = new Map();

      // Import permanent deletions
      const insertPermanentOp = this.db.prepare(`
        INSERT INTO permanent_deletions (profile_id, operation_date, total_files_deleted, total_size_bytes)
        VALUES (?, ?, ?, ?)
      `);
      for (const op of data.permanentDeletions) {
        const newProfileId = profileIdMap.get(op.profile_id);
        if (newProfileId) {
          const result = insertPermanentOp.run(
            newProfileId,
            op.operation_date,
            op.total_files_deleted || 0,
            op.total_size_bytes || 0
          );
          permanentOpIdMap.set(op.id, result.lastInsertRowid);
        }
      }

      // Import permanently deleted files
      const insertPermanentFile = this.db.prepare(`
        INSERT INTO permanently_deleted_files (operation_id, profile_id, file_path, file_name, file_extension, file_size_bytes, original_path, deleted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const file of data.permanentlyDeletedFiles) {
        const newProfileId = profileIdMap.get(file.profile_id);
        const newOperationId = permanentOpIdMap.get(file.operation_id);
        if (newProfileId && newOperationId) {
          insertPermanentFile.run(
            newOperationId,
            newProfileId,
            file.file_path,
            file.file_name,
            file.file_extension,
            file.file_size_bytes,
            file.original_path,
            file.deleted_at
          );
        }
      }
    });

    try {
      transaction();
      return { success: true };
    } catch (error) {
      console.error('Import data error:', error);
      throw error;
    }
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

module.exports = { DatabaseManager };
