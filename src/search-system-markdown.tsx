import { ActionPanel, Action, List, showToast, Toast, confirmAlert, Icon, Alert } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";
import { useState } from "react";
import { Clipboard } from "@raycast/api";

const execAsync = promisify(exec);
const ITEMS_PER_PAGE = 20; // Number of items per page

interface MarkdownFile {
  path: string;
  name: string;
  lastModified: Date;
  folder: string; // Add folder information
}

// Get Markdown files
async function getMarkdownFiles(): Promise<MarkdownFile[]> {
  try {
    // Use mdfind command but exclude VS Code history files
    const { stdout } = await execAsync('mdfind -onlyin ~ "kind:markdown" | grep -v "/Library/Application Support/Code/User/History/" | head -n 200');

    const filePaths = stdout.split("\n").filter(Boolean);
    console.log(`Found ${filePaths.length} Markdown files`);

    const files: MarkdownFile[] = [];

    for (const filePath of filePaths) {
      try {
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          const dirname = path.dirname(filePath);
          const folderName = path.basename(dirname);

          files.push({
            path: filePath,
            name: path.basename(filePath),
            lastModified: stats.mtime,
            folder: folderName,
          });
        }
      } catch (error) {
        console.error(`Error processing file ${filePath}:`, error);
      }
    }

    // Sort by last modified time, newest first
    return files.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
  } catch (error) {
    console.error("Error finding Markdown files:", error);

    // If mdfind fails, try using find command
    try {
      console.log("Trying fallback method with find command");
      const { stdout } = await execAsync('find ~ -name "*.md" -type f -not -path "*/\\.*" | head -n 200');

      const filePaths = stdout.split("\n").filter(Boolean);
      console.log(`Fallback found ${filePaths.length} Markdown files`);

      return filePaths
        .map((filePath) => {
          const stats = fs.statSync(filePath);
          const dirname = path.dirname(filePath);
          const folderName = path.basename(dirname);

          return {
            path: filePath,
            name: path.basename(filePath),
            lastModified: stats.mtime,
            folder: folderName,
          };
        })
        .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
    } catch (fallbackError) {
      console.error("Fallback method also failed:", fallbackError);
      return [];
    }
  }
}

// Open file in Typora
async function openWithTypora(filePath: string) {
  try {
    console.log(`Opening file: ${filePath}`);
    await execAsync(`open -a Typora "${filePath}"`);

    showToast({
      style: Toast.Style.Success,
      title: "File opened in Typora",
    });
  } catch (error) {
    console.error("Error opening file with Typora:", error);
    showToast({
      style: Toast.Style.Failure,
      title: "Failed to open file",
      message: String(error),
    });
  }
}

// Move file to trash
async function moveToTrash(file: MarkdownFile, revalidate: () => void) {
  const options = {
    title: "Move to Trash",
    message: `Are you sure you want to move "${file.name}" to the trash?`,
    primaryAction: {
      title: "Move to Trash",
      style: Alert.ActionStyle.Destructive,
    },
  };

  if (await confirmAlert(options)) {
    try {
      // Use AppleScript to move file to trash
      const escapedPath = file.path.replace(/'/g, "'\\''");
      await execAsync(`osascript -e 'tell application "Finder" to delete POSIX file "${escapedPath}"'`);

      showToast({
        style: Toast.Style.Success,
        title: "File Moved to Trash",
        message: `"${file.name}" has been moved to the trash`,
      });

      // Reload file list
      revalidate();
    } catch (error) {
      console.error("Error moving file to trash:", error);
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to Move to Trash",
        message: String(error),
      });
    }
  }
}

export default function Command() {
  const { data, isLoading, error, revalidate } = usePromise(getMarkdownFiles);
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(0);

  if (error) {
    showToast({
      style: Toast.Style.Failure,
      title: "Failed to load Markdown files",
      message: String(error),
    });
  }

  // Filter and paginate data
  const filteredData = data
    ? data.filter(
        (file) =>
          file.name.toLowerCase().includes(searchText.toLowerCase()) ||
          file.folder.toLowerCase().includes(searchText.toLowerCase()),
      )
    : [];

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);

  // Calculate current page display range
  const startItem = currentPage * ITEMS_PER_PAGE + 1;
  const endItem = Math.min((currentPage + 1) * ITEMS_PER_PAGE, filteredData.length);
  const pageInfoText =
    filteredData.length > 0 ? `Showing ${startItem}-${endItem} of ${filteredData.length} files` : "No files found";

  // Format date to show relative time
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today, " + date.toLocaleTimeString("en-TW", { hour: "2-digit", minute: "2-digit" });
    } else if (diffDays === 1) {
      return "Yesterday, " + date.toLocaleTimeString("en-TW", { hour: "2-digit", minute: "2-digit" });
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString("en-TW");
    }
  };

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search by filename or folder..."
      onSearchTextChange={(text) => {
        setSearchText(text);
        setCurrentPage(0); // Reset to first page when searching
      }}
      searchText={searchText}
      navigationTitle={`Recent Markdown Files (${filteredData.length} files)`}
    >
      {filteredData.length > 0 ? (
        <>
          {/* Pagination navigation */}
          {totalPages > 1 && (
            <List.Section title={`Page ${currentPage + 1} of ${totalPages}`}>
              <List.Item
                title={pageInfoText}
                actions={
                  <ActionPanel>
                    {currentPage > 0 && (
                      <Action
                        title="Previous Page"
                        icon={Icon.ArrowLeft}
                        shortcut={{ modifiers: ["cmd"], key: "arrowLeft" }}
                        onAction={() => setCurrentPage((p) => p - 1)}
                      />
                    )}
                    {currentPage < totalPages - 1 && (
                      <Action
                        title="Next Page"
                        icon={Icon.ArrowRight}
                        shortcut={{ modifiers: ["cmd"], key: "arrowRight" }}
                        onAction={() => setCurrentPage((p) => p + 1)}
                      />
                    )}
                    <Action
                      title="Refresh List"
                      icon={Icon.RotateClockwise}
                      shortcut={{ modifiers: ["cmd"], key: "r" }}
                      onAction={revalidate}
                    />
                  </ActionPanel>
                }
              />
            </List.Section>
          )}

          {/* Group by folder */}
          {Object.entries(
            paginatedData.reduce<Record<string, MarkdownFile[]>>((groups, file) => {
              const key = file.folder;
              if (!groups[key]) {
                groups[key] = [];
              }
              groups[key].push(file);
              return groups;
            }, {}),
          ).map(([folder, files]) => (
            <List.Section key={folder} title={folder}>
              {files.map((file) => (
                <List.Item
                  key={file.path}
                  title={file.name}
                  subtitle={path.dirname(file.path)}
                  accessories={[
                    {
                      text: formatDate(file.lastModified),
                      tooltip: file.lastModified.toLocaleString("en-TW"),
                    },
                  ]}
                  actions={
                    <ActionPanel>
                      <ActionPanel.Section>
                        <Action
                          title="Open in Typora"
                          icon={Icon.TextDocument}
                          onAction={() => openWithTypora(file.path)}
                        />
                        <Action
                          title="Reveal in Finder"
                          icon={Icon.Finder}
                          shortcut={{ modifiers: ["cmd"], key: "f" }}
                          onAction={() => {
                            execAsync(`open -R "${file.path}"`).catch((err) => {
                              showToast({
                                style: Toast.Style.Failure,
                                title: "Failed to reveal in Finder",
                                message: String(err),
                              });
                            });
                          }}
                        />
                        <Action
                          title="Copy Path"
                          icon={Icon.Clipboard}
                          shortcut={{ modifiers: ["cmd"], key: "c" }}
                          onAction={() => {
                            Clipboard.copy(file.path);
                            showToast({
                              style: Toast.Style.Success,
                              title: "Path copied to clipboard",
                            });
                          }}
                        />
                      </ActionPanel.Section>

                      <ActionPanel.Section>
                        <Action
                          title="Move to Trash"
                          icon={Icon.Trash}
                          style={Action.Style.Destructive}
                          shortcut={{ modifiers: ["opt"], key: "backspace" }}
                          onAction={() => moveToTrash(file, revalidate)}
                        />
                      </ActionPanel.Section>

                      <ActionPanel.Section>
                        <Action
                          title="Refresh List"
                          icon={Icon.RotateClockwise}
                          shortcut={{ modifiers: ["cmd"], key: "r" }}
                          onAction={revalidate}
                        />
                        {totalPages > 1 && (
                          <>
                            {currentPage > 0 && (
                              <Action
                                title="Previous Page"
                                icon={Icon.ArrowLeft}
                                shortcut={{ modifiers: ["cmd"], key: "arrowLeft" }}
                                onAction={() => setCurrentPage((p) => p - 1)}
                              />
                            )}
                            {currentPage < totalPages - 1 && (
                              <Action
                                title="Next Page"
                                icon={Icon.ArrowRight}
                                shortcut={{ modifiers: ["cmd"], key: "arrowRight" }}
                                onAction={() => setCurrentPage((p) => p + 1)}
                              />
                            )}
                          </>
                        )}
                      </ActionPanel.Section>
                    </ActionPanel>
                  }
                />
              ))}
            </List.Section>
          ))}
        </>
      ) : (
        <List.EmptyView
          title={isLoading ? "Loading..." : "No Markdown files found"}
          description={
            isLoading
              ? "Please wait while we search for Markdown files"
              : "Could not find any Markdown files matching your search."
          }
        />
      )}
    </List>
  );
}
