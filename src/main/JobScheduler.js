const { shell } = require('electron');
const fs = require('fs');
const path = require('path');

class JobScheduler {
  constructor(database, fileScanner, mainWindow) {
    this.database = database;
    this.fileScanner = fileScanner;
    this.mainWindow = mainWindow;
    this.checkInterval = null;
    this.isRunning = false;
  }

  setMainWindow(mainWindow) {
    this.mainWindow = mainWindow;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;

    // Run startup jobs immediately
    this.runStartupJobs();

    // Check for due jobs every minute
    this.checkInterval = setInterval(() => {
      this.checkAndRunDueJobs();
    }, 60000); // 1 minute

    console.log('Job Scheduler started');
  }

  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isRunning = false;
    console.log('Job Scheduler stopped');
  }

  async runStartupJobs() {
    try {
      const startupJobs = this.database.getActiveJobsByScheduleType('startup');
      console.log(`Found ${startupJobs.length} startup jobs to run`);

      for (const job of startupJobs) {
        await this.executeJob(job);
      }
    } catch (error) {
      console.error('Error running startup jobs:', error);
    }
  }

  async checkAndRunDueJobs() {
    try {
      const now = new Date();
      const dueJobs = this.database.getDueJobs(now);

      if (dueJobs.length > 0) {
        console.log(`Found ${dueJobs.length} due jobs to run`);
      }

      for (const job of dueJobs) {
        await this.executeJob(job);
      }
    } catch (error) {
      console.error('Error checking due jobs:', error);
    }
  }

  async executeJob(job) {
    console.log(`Executing job: ${job.name} (ID: ${job.id})`);

    const executionId = this.database.createJobExecution(job.id, job.profile_id);

    if (!executionId) {
      console.error(`Failed to create execution record for job ${job.id}`);
      return;
    }

    try {
      // Check if target path exists
      if (!fs.existsSync(job.target_path)) {
        this.database.updateJobExecution(executionId, {
          status: 'failed',
          filesFound: 0,
          filesDeleted: 0,
          totalSize: 0,
          errorMessage: 'Target path does not exist'
        });
        this.updateJobNextRun(job);
        this.notifyRenderer('job-executed', {
          jobId: job.id,
          jobName: job.name,
          status: 'failed',
          error: 'Target path does not exist'
        });
        return;
      }

      // Pass extensions as string - FileScanner will parse them
      const extensions = job.file_extensions || '';

      // Scan files based on job configuration
      const scanResult = await this.fileScanner.scanDirectory(
        job.target_path,
        extensions,
        job.extension_mode,
        job.include_subfolders === 1
      );

      if (!scanResult.success) {
        this.database.updateJobExecution(executionId, {
          status: 'failed',
          filesFound: 0,
          filesDeleted: 0,
          totalSize: 0,
          errorMessage: scanResult.message || 'Scan failed'
        });
        this.updateJobNextRun(job);
        this.notifyRenderer('job-executed', {
          jobId: job.id,
          jobName: job.name,
          status: 'failed',
          error: scanResult.message
        });
        return;
      }

      if (scanResult.files.length === 0) {
        this.database.updateJobExecution(executionId, {
          status: 'success',
          filesFound: 0,
          filesDeleted: 0,
          totalSize: 0
        });
        this.updateJobNextRun(job);
        this.notifyRenderer('job-executed', {
          jobId: job.id,
          jobName: job.name,
          status: 'success',
          filesDeleted: 0,
          totalSize: 0
        });
        return;
      }

      // Delete files
      let deletedCount = 0;
      let totalSize = 0;
      const errors = [];

      for (const file of scanResult.files) {
        try {
          if (job.delete_type === 'permanent') {
            // Permanent delete
            const stat = fs.statSync(file.path);
            if (stat.isDirectory()) {
              fs.rmSync(file.path, { recursive: true, force: true });
            } else {
              fs.unlinkSync(file.path);
            }
          } else {
            // Move to trash
            await shell.trashItem(file.path);
          }

          deletedCount++;
          totalSize += file.size || 0;

          // Log file to execution
          this.database.addJobExecutionFile(executionId, {
            filePath: file.path,
            fileName: file.name,
            fileExtension: file.extension || '',
            fileSize: file.size || 0
          });
        } catch (fileError) {
          console.error(`Failed to delete ${file.path}:`, fileError);
          errors.push(`${file.name}: ${fileError.message}`);
        }
      }

      // Determine status
      let status = 'success';
      if (deletedCount === 0 && scanResult.files.length > 0) {
        status = 'failed';
      } else if (deletedCount < scanResult.files.length) {
        status = 'partial';
      }

      this.database.updateJobExecution(executionId, {
        status,
        filesFound: scanResult.files.length,
        filesDeleted: deletedCount,
        totalSize,
        errorMessage: errors.length > 0 ? errors.slice(0, 5).join('; ') : null
      });

      // Notify renderer
      this.notifyRenderer('job-executed', {
        jobId: job.id,
        jobName: job.name,
        status,
        filesFound: scanResult.files.length,
        filesDeleted: deletedCount,
        totalSize
      });

      console.log(`Job ${job.name} completed: ${deletedCount}/${scanResult.files.length} files deleted`);

    } catch (error) {
      console.error(`Error executing job ${job.id}:`, error);
      this.database.updateJobExecution(executionId, {
        status: 'failed',
        errorMessage: error.message
      });
      this.notifyRenderer('job-executed', {
        jobId: job.id,
        jobName: job.name,
        status: 'failed',
        error: error.message
      });
    }

    // Update next run time
    this.updateJobNextRun(job);
  }

  async runJobNow(jobId) {
    const job = this.database.getJob(jobId);
    if (!job) {
      return { success: false, message: 'Job not found' };
    }

    await this.executeJob(job);
    return { success: true, message: 'Job executed' };
  }

  updateJobNextRun(job) {
    const nextRun = this.calculateNextRun(job);
    this.database.updateJobLastRun(job.id, nextRun);
  }

  calculateNextRun(job) {
    const now = new Date();

    switch (job.schedule_type) {
      case 'manual':
      case 'startup':
        return null;

      case 'daily': {
        if (!job.schedule_time) return null;
        const [hours, minutes] = job.schedule_time.split(':').map(Number);
        const nextDaily = new Date(now);
        nextDaily.setHours(hours, minutes, 0, 0);
        if (nextDaily <= now) {
          nextDaily.setDate(nextDaily.getDate() + 1);
        }
        return nextDaily.toISOString();
      }

      case 'weekly': {
        if (!job.schedule_time || job.schedule_day === null) return null;
        const [hours, minutes] = job.schedule_time.split(':').map(Number);
        const nextWeekly = new Date(now);
        nextWeekly.setHours(hours, minutes, 0, 0);

        // Calculate days until target day (0 = Sunday, 6 = Saturday)
        const currentDay = nextWeekly.getDay();
        let daysUntilTarget = job.schedule_day - currentDay;
        if (daysUntilTarget < 0 || (daysUntilTarget === 0 && nextWeekly <= now)) {
          daysUntilTarget += 7;
        }
        nextWeekly.setDate(nextWeekly.getDate() + daysUntilTarget);
        return nextWeekly.toISOString();
      }

      case 'monthly': {
        if (!job.schedule_time || !job.schedule_day) return null;
        const [hours, minutes] = job.schedule_time.split(':').map(Number);
        const nextMonthly = new Date(now);
        nextMonthly.setDate(job.schedule_day);
        nextMonthly.setHours(hours, minutes, 0, 0);

        if (nextMonthly <= now) {
          nextMonthly.setMonth(nextMonthly.getMonth() + 1);
        }

        // Handle months with fewer days
        const targetDay = job.schedule_day;
        const daysInMonth = new Date(nextMonthly.getFullYear(), nextMonthly.getMonth() + 1, 0).getDate();
        if (targetDay > daysInMonth) {
          nextMonthly.setDate(daysInMonth);
        }

        return nextMonthly.toISOString();
      }

      default:
        return null;
    }
  }

  calculateInitialNextRun(scheduleType, scheduleTime, scheduleDay) {
    const job = {
      schedule_type: scheduleType,
      schedule_time: scheduleTime,
      schedule_day: scheduleDay
    };
    return this.calculateNextRun(job);
  }

  notifyRenderer(channel, data) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data);
    }
  }
}

module.exports = { JobScheduler };
