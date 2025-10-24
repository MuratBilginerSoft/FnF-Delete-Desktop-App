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

    // Create indexes for better performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_profiles_name ON profiles(name);
      CREATE INDEX IF NOT EXISTS idx_deletion_operations_profile ON deletion_operations(profile_id);
      CREATE INDEX IF NOT EXISTS idx_deletion_operations_date ON deletion_operations(operation_date);
      CREATE INDEX IF NOT EXISTS idx_deleted_files_operation ON deleted_files(operation_id);
      CREATE INDEX IF NOT EXISTS idx_deleted_files_profile ON deleted_files(profile_id);
      CREATE INDEX IF NOT EXISTS idx_deleted_files_extension ON deleted_files(file_extension);
      CREATE INDEX IF NOT EXISTS idx_deleted_files_date ON deleted_files(deleted_at);
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
      return {
        success: true,
        id: result.lastInsertRowid,
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
    return this.db.prepare(`
      SELECT
        COUNT(DISTINCT do.id) as total_operations,
        SUM(do.total_files_deleted) as total_files_deleted,
        SUM(do.total_size_bytes) as total_size_deleted,
        (SELECT COUNT(DISTINCT file_extension) FROM deleted_files WHERE profile_id = ?) as unique_extensions
      FROM deletion_operations do
      WHERE do.profile_id = ?
    `).get(profileId, profileId);
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

module.exports = { DatabaseManager };
