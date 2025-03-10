# Typora

![Typora](./assets/extension-icon.png)

A Raycast extension that helps you search, create, and edit Markdown files with Typora.

## Features

This extension provides three main commands to help you manage your Markdown files:

### 1. Browse Project Markdown Files

![Browse Project](./assets/extension-icon-1.png)

Browse and manage Markdown files in your designated project directory.

- **View files**: List all Markdown files in your configured directory
- **Open files**: Open selected files directly in Typora
- **Delete files**: Move files to trash with confirmation
- **Sort by date**: Files are sorted by modification date, newest first

### 2. Search System Markdown Files

![Search System](./assets/extension-icon-2.png)

Find and manage Markdown files across your entire system.

- **System-wide search**: Find Markdown files anywhere on your Mac
- **Pagination**: Navigate through large file collections with ease
- **Folder grouping**: Files are organized by their parent folders
- **Advanced filtering**: Search by filename or folder name
- **File management**: Open, reveal in Finder, copy path, or move to trash
- **Relative time display**: See when files were modified (Today, Yesterday, etc.)

## Installation

1. Install [Raycast](https://raycast.com/)
2. Open Raycast and search for "Extensions"
3. Click "Store" and search for "Typora Markdown Editor"
4. Install the extension

## Configuration

After installation, you'll need to configure the extension:

1. Open Raycast preferences
2. Navigate to Extensions > Typora Markdown Editor
3. Set the "Markdown Files Directory" to your preferred location for storing Markdown files

## Requirements

- [Typora](https://typora.io/) must be installed on your system
- macOS 10.15 or later
- Raycast 1.50.0 or later

## Keyboard Shortcuts

### Browse Project & Search System Commands
- `Enter` - Open selected file in Typora
- `Cmd+F` - Reveal file in Finder
- `Cmd+C` - Copy file path to clipboard
- `Opt+Backspace` - Move file to trash
- `Cmd+R` - Refresh file list
- `Cmd+←` - Previous page (when pagination is active)
- `Cmd+→` - Next page (when pagination is active)


## How It Works

- **Browse Project**: Lists Markdown files from your configured directory using Node.js file system operations
- **Search System**: Uses macOS `mdfind` command to search for Markdown files across your system, with a fallback to the `find` command

## Troubleshooting

- **Files not opening**: Ensure Typora is installed and accessible
- **No files found**: Check your configured directory path or search permissions
- **Error creating files**: Verify write permissions for your configured directory

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Author

Created by [chihkang](https://github.com/chihkang)

---

## Development

This extension is built with:
- TypeScript
- React
- Raycast API
- Node.js file system modules

### Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build the extension
npm run build

# Lint the code
npm run lint

# Fix linting issues
npm run fix-lint

# Publish to Raycast Store
npm run publish
```

### Project Structure

- `src/browse-project-markdown.tsx` - Browse files in project directory
- `src/search-system-markdown.tsx` - Search files across system
- `src/create-markdown.tsx` - Create new Markdown files

### Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

