# Markdown Navigator

A powerful Raycast extension for managing and navigating your Markdown files with ease.

## Features

- **Fast File Browsing**: Quickly browse and search through all your Markdown files
- **Pagination**: Navigate through large collections of files with easy pagination
- **Tag Filtering**: Filter files by tags extracted from your Markdown content
- **Color-coded Tags**: Visually identify important, draft, complete, review, and archive tags
- **Folder Organization**: Files are automatically grouped by folder for better organization
- **File Management**: Create, open, delete, and move files to trash directly from Raycast
- **Editor Integration**: Open files in your preferred Markdown editor, including Typora
- **Progressive Loading**: Initially loads a subset of files for performance, with option to load more as needed

## Installation

1. Install [Raycast](https://raycast.com/)
2. Open Raycast and search for "Extensions"
3. Click "+" and search for "Markdown Navigator"
4. Install the extension
5. Configure the extension with your Markdown directory in preferences

## Configuration

The extension requires a valid Markdown directory to be set in preferences:

1. Open Raycast
2. Search for "Markdown Navigator"
3. Press `⌘` + `,` to open preferences
4. Set your Markdown directory path

## Usage

### Basic Navigation

- **Search**: Type to search for file names or folders
- **Browse**: Use arrow keys to navigate through the list
- **Pagination**: Use `⌘` + `←` and `⌘` + `→` to navigate between pages
- **Load More Files**: Press `⌘` + `⇧` + `M` to load more files when needed

### File Actions

- **Open with Typora**: Select a file and press `Enter`
- **Open in Default App**: Press `⌘` + `O`
- **Open With...**: Press `⌘` + `⇧` + `O` to choose an application
- **Show in Finder**: Press `⌘` + `F`
- **Copy Path**: Press `⌘` + `⇧` + `C`
- **Move to Trash**: Press `⌃` + `X`
- **Delete File**: Press `⌃` + `⌘` + `X`

### File Creation

- **Create New File**: Press `⌘` + `N` to create a new Markdown file
- Specify file name and optional content
- Choose a directory or use the current folder

### Template-Based File Creation

- **Multiple Templates**: Choose from various pre-defined templates when creating files:
  - Basic: Simple structure with title, date, and tags
  - Meeting: Template for meeting notes with agenda and action items
  - Blog: Front matter format suitable for blog posts
  - Project: Project planning template with goals and timeline
  - Empty: Blank file with no pre-defined content

- **Context-Aware Creation**: Create new files directly in the folder you're currently browsing
  - When viewing files in a specific folder, new files will be created in that location
  - Press `⌘` + `N` while browsing to create a file in the current context
  - Templates automatically include current date and specified tags


### Tag Management

- **Filter by Tags**: Use the dropdown in the search bar to filter by tags
- **Toggle Color Tags**: Press `⌘` + `⇧` + `T` to show/hide color-coded tags
- **Clear Tag Filter**: Press `⌘` + `⇧` + `C` when a tag is selected

### Other Actions

- **Refresh List**: Press `⌘` + `R` to refresh the file list
- **Load More Files**: Press `⌘` + `⇧` + `M` to load more files
- **Open Preferences**: Press `⌘` + `⇧` + `P` to open extension preferences

## Performance Considerations

The extension initially loads a limited number of files for better performance. If you have a large collection of Markdown files, you can:

1. Use the "Load More Files" action to progressively load more files
2. Use search and tag filtering to narrow down results
3. Navigate through pages to browse all loaded files

## Requirements

- [Raycast](https://raycast.com/)
- macOS
- A Markdown editor (Typora is recommended but not required)

## Support

If you encounter any issues or have suggestions for improvements, please submit an issue on the [GitHub repository](https://github.com/yourusername/markdown-navigator).

## License

MIT