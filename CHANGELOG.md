# Typora Changelog

## [1.0.0] - {PR_MERGE_DATE}

### Added
- Initial release of Typora Markdown Editor extension
- "Browse Project Markdown Files" command to manage files in a specific directory
- "Search System Markdown Files" command with pagination and folder grouping
- "Create Markdown File" command with automatic Typora opening
- File management features including:
  - Opening files in Typora
  - Moving files to trash
  - Revealing files in Finder
  - Copying file paths
- Pagination for handling large file collections
- Folder-based grouping for better organization
- Relative time display for file modification dates
- Search functionality by filename or folder
- Keyboard shortcuts for all major actions
- Confirmation dialogs for destructive actions

### Technical
- Built with TypeScript and React
- Uses Raycast API and utilities
- Implements macOS native features via AppleScript
- Fallback mechanisms for file searching

## Future Plans
- Theme switching support for Typora
- Template selection when creating new files
- Tag-based file organization
- Favorites/bookmarks for frequently accessed files
- Preview content in Raycast before opening

---

*Note: This extension requires Typora to be installed on your system.*

