# Changelog

All notable changes to FnF Delete will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2025-01-27

### Added

#### Auto-Update System
- Automatic update detection on app startup
- GitHub Releases integration for update distribution
- Beautiful UEFA-themed update notification modal
- Real-time download progress tracking with percentage and file size
- One-click install and restart functionality
- Release notes display in update modal
- Error handling for update failures
- Background download option
- Multi-language support for update notifications (Turkish & English)
- Production-only update checks with 5-second startup delay
- Lazy loading pattern for electron-updater to prevent initialization issues

### Changed
- Updated app version from 1.2.0 to 1.3.0
- Enhanced About page with v1.3.0 version display
- Updated in-app changelog with auto-update feature details
- Improved README with auto-update feature documentation
- Corrected app descriptions from "File & Folder" to "File" for accuracy

### Technical
- Added electron-updater package (v6.6.2)
- Implemented IPC handlers for update operations (check, download, install)
- Added UpdateNotification React component with state management
- Created glassmorphism-styled update modal with animations
- Extended preload API with updater event listeners
- Added update-related translations to LanguageContext
- Implemented automatic version management system (getAppVersion API)
- Version numbers now automatically sync from package.json across all components

## [1.2.0] - 2025-01-26

### Added

#### Recursive Scanning Control
- Include/Exclude Subfolders toggle feature
- Profile-based subfolder scanning settings
- Persistent storage of subfolder preference per profile
- Separate scanning methods for shallow (current folder only) and recursive (all subfolders)
- Real-time toggle with immediate effect on next scan

#### Enhanced User Interface
- Compact checkbox design for Include Subfolders control
- Browse button integrated into path input as icon
- Improved button alignment and spacing
- Info notification type with custom styling
- Better visual feedback for scanning options

### Changed
- Moved Browse button from standalone to input-integrated icon
- Optimized Include Subfolders control with compact design
- Enhanced notification system with info type support
- Improved deletion mode section spacing

### Fixed
- Text capitalization in Include Subfolders checkbox
- Button alignment issues in path input group
- Notification modal title display for info messages

## [1.1.0] - 2025-01-25

### Added

#### Saved Paths System
- Save and manage frequently used directory paths
- Quick access to saved paths via dropdown menu
- Edit and delete saved paths functionality
- Path list with last used timestamps
- Persistent storage of saved paths per profile

#### All Files Mode
- New "All Files" deletion mode option
- Delete all files in a directory regardless of extension
- Toggle between extension-based and all-files deletion
- Clear warning indicators for all-files mode
- Safety confirmation modal for all-files operations

#### File Selection Features
- Individual file selection with checkboxes
- "Select All" / "Deselect All" quick actions
- Selected files counter and total size display
- Delete only selected files functionality
- Visual feedback for selected items
- Improved file preview with selection controls

#### Enhanced Statistics
- Dynamic statistics that update after each operation
- Real-time data refresh on Statistics page
- Improved chart visualizations with better data handling
- Better empty state handling for statistics

### Changed
- Improved file deletion workflow with selection options
- Enhanced user interface for path management
- Better modal designs for confirmations
- Updated statistics page layout and animations
- Enhanced About page with company contact information (email, phone, website)

### Fixed
- Statistics page "Recent Operations" container alignment
- Proper spacing and margins for UI components
- Footer positioning consistency across pages

## [1.0.0] - 2025-01-24

### Added

#### Profile Management
- Multi-profile management system
- Customizable profile colors and avatars
- Profile deletion feature with confirmation modals
- Profile switching with persistent storage

#### File Deletion
- Two deletion modes: Include only & Exclude all
- Pre-deletion file preview and detailed analysis
- Batch file deletion operations
- Smart file scanning with extension filters
- Move to trash functionality (safe deletion)
- Quick extension selection by category (Media, Images, Documents, Archives)

#### Statistics & Analytics
- Advanced statistics charts (Pie, Line, Bar)
- Date-based deletion operation tracking
- Detailed analysis by file extension
- Real-time operation history
- Total files deleted and size tracking
- Top 10 extensions visualization

#### User Interface
- Modern and elegant user interface
- Dark and light theme support
- Smooth animations and transitions
- Responsive design support
- Glassmorphism effects
- Timeline-based changelog page
- Profile-specific dashboard
- Interactive charts with Chart.js

#### System Features
- SQLite database integration for local data storage
- Multi-language support (Turkish & English)
- Electron.js based desktop application
- Custom window controls
- Splash screen with loading animation
- Error handling with user-friendly modals

#### Developer Experience
- Vite 6 for fast development and building
- React 19 with hooks
- Zustand for state management
- Context API for theme and language
- Better-sqlite3 for database operations
- Modern CSS with custom properties

---

## Future Releases

### Planned Features
- Export statistics to CSV/PDF
- Scheduled deletion tasks
- Duplicate file finder
- Custom file filters
- Cloud backup integration
- More chart types and visualizations

---

**Legend:**
- 🆕 Added - New features
- ⚡ Changed - Changes in existing functionality
- 🐛 Fixed - Bug fixes
- 🗑️ Deprecated - Soon-to-be removed features
- ❌ Removed - Removed features
- 🔒 Security - Security fixes

---

© 2025 Brainy Tech. All rights reserved.
