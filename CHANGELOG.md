# Markdown Navigator Changelog

## [1.0.0] - {PR_MERGE_DATE}

### Added
- Initial release of Markdown Navigator extension
- "Browse Project Markdown Files" command to manage files in a specific directory
- "Search System Markdown Files" command with pagination and folder grouping
- File management features including:
  - Opening files in your preferred Markdown editor
  - Moving files to trash
  - Revealing files in Finder
  - Copying file paths
- Pagination for handling large file collections
- Folder-based grouping for better organization
- Relative time display for file modification dates
- Search functionality by filename or folder
- Keyboard shortcuts for all major actions
- Confirmation dialogs for destructive actions
- Progressive file loading for better performance with large collections

### Technical
- Built with TypeScript and React
- Uses Raycast API and utilities
- Implements macOS native features via AppleScript
- Fallback mechanisms for file searching
- Configurable default editor preference

## Future Plans
- Template selection when creating new files
- Enhanced tag-based file organization
- Favorites/bookmarks for frequently accessed files
- Preview content in Raycast before opening
- Additional editor integrations and customizations

---

*Note: This extension works best with a Markdown editor installed on your system. By default, it's configured to use Typora, but you can change this in the extension preferences.*
