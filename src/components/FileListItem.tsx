// src/components/FileListItem.tsx
import { List, ActionPanel, Action, Icon, Clipboard, showToast, Toast, confirmAlert, Alert, useNavigation } from "@raycast/api";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { MarkdownFile } from "../types";
import { formatRelativeDate } from "../utils/formatters";
import { filterDisplayTags } from "../utils/tagOperations";
import { openWithTypora, moveToTrash } from "../utils/fileOperations";
import { CreateFileForm } from "./CreateFileForm";

const execAsync = promisify(exec);

interface FileListItemProps {
  file: MarkdownFile;
  showColorTags: boolean;
  revalidate: () => void;
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  markdownDir: string;
  setCurrentFolder?: (folder: string) => void; // Change to setCurrentFolder function
}

export function FileListItem({ 
  file, 
  showColorTags, 
  revalidate, 
  currentPage, 
  totalPages, 
  setCurrentPage,
  markdownDir,
  setCurrentFolder
}: FileListItemProps) {
  const { push } = useNavigation();

  // Handle move to trash
  const handleMoveToTrash = async () => {
    const options = {
      title: "Move to Trash",
      message: `Are you sure you want to move "${file.name}" to trash?`,
      primaryAction: {
        title: "Move to Trash",
        style: Alert.ActionStyle.Destructive,
      },
    };

    if (await confirmAlert(options)) {
      const success = await moveToTrash(file);
      if (success) {
        revalidate();
      }
    }
  };

  // Show in Finder
  const revealInFinder = async () => {
    try {
      await execAsync(`open -R "${file.path}"`);
    } catch (err) {
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to Show in Finder",
        message: String(err),
      });
    }
  };

  // Copy path
  const copyPath = () => {
    Clipboard.copy(file.path);
    showToast({
      style: Toast.Style.Success,
      title: "Path Copied to Clipboard",
    });
  };

  // Navigate to create file form with current folder context
  const showCreateFileForm = () => {
    // Update current folder before navigating
    if (setCurrentFolder) {
      setCurrentFolder(file.folder);
    }
    push(<CreateFileForm markdownDir={markdownDir} currentFolder={file.folder} onFileCreated={revalidate} />);
  };

  // Filter displayed tags
  const displayTags = filterDisplayTags(file.tags, showColorTags);
  const tagsSubtitle = displayTags.length > 0 ? displayTags.map(tag => `#${tag}`).join(" ") : undefined;

  return (
    <List.Item
      key={file.path}
      title={file.name}
      subtitle={tagsSubtitle}
      accessories={[
        {
          text: formatRelativeDate(file.lastModified),
          tooltip: file.lastModified.toLocaleString("en-TW"),
        },
      ]}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <Action
              title="Open in Typora"
              icon={Icon.TextDocument}
              onAction={() => {
                // Update current folder when opening a file
                if (setCurrentFolder) {
                  setCurrentFolder(file.folder);
                }
                openWithTypora(file.path);
              }}
            />
            <Action
              title="Show in Finder"
              icon={Icon.Finder}
              shortcut={{ modifiers: ["cmd"], key: "f" }}
              onAction={revealInFinder}
            />
            <Action
              title="Copy Path"
              icon={Icon.Clipboard}
              shortcut={{ modifiers: ["cmd"], key: "c" }}
              onAction={copyPath}
            />
          </ActionPanel.Section>

          <ActionPanel.Section>
            <Action
              title="New Markdown File"
              icon={Icon.NewDocument}
              shortcut={{ modifiers: ["cmd"], key: "n" }}
              onAction={showCreateFileForm}
            />
            <Action
              title="Move to Trash"
              icon={Icon.Trash}
              style={Action.Style.Destructive}
              shortcut={{ modifiers: ["opt"], key: "backspace" }}
              onAction={handleMoveToTrash}
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
                    onAction={() => setCurrentPage(currentPage - 1)}
                  />
                )}
                {currentPage < totalPages - 1 && (
                  <Action
                    title="Next Page"
                    icon={Icon.ArrowRight}
                    shortcut={{ modifiers: ["cmd"], key: "arrowRight" }}
                    onAction={() => setCurrentPage(currentPage + 1)}
                  />
                )}
              </>
            )}
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}
