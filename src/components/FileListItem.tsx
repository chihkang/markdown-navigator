// components/FileListItem.tsx
import {
  List,
  ActionPanel,
  Action,
  Alert,
  Icon,
  Color,
  confirmAlert,
  showToast,
  Toast,
  openCommandPreferences,
} from "@raycast/api";
import { MarkdownFile } from "../types";
import { openWithEditor, moveToTrash } from "../utils/fileOperations";
import path from "path";
import fs from "fs";
import { exec } from "child_process";

interface FileListItemProps {
  file: MarkdownFile;
  showColorTags: boolean;
  revalidate: () => void;
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  markdownDir: string;
  loadMoreFiles: () => void;
  showCreateFileForm: () => void; // Add this prop for creating files
}

export function FileListItem({
  file,
  showColorTags,
  revalidate,
  currentPage,
  totalPages,
  setCurrentPage,
  markdownDir,
  loadMoreFiles,
  showCreateFileForm, // Add this prop
}: FileListItemProps) {
  // Format the date
  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const day = 24 * 60 * 60 * 1000;

    if (diff < day) {
      return `Today, ${date.toLocaleTimeString()}`;
    } else if (diff < 2 * day) {
      return `Yesterday, ${date.toLocaleTimeString()}`;
    } else {
      return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
  };

  // Confirm and delete file
  const confirmDelete = async () => {
    if (
      await confirmAlert({
        title: "Delete this file?",
        message: `Are you sure you want to delete "${file.name}"?`,
        primaryAction: {
          title: "Delete",
          style: Alert.ActionStyle.Destructive,
        },
      })
    ) {
      try {
        fs.unlinkSync(file.path);
        showToast({
          style: Toast.Style.Success,
          title: "File deleted",
          message: `${file.name} has been deleted`,
        });
        revalidate();
      } catch (error) {
        showToast({
          style: Toast.Style.Failure,
          title: "Error deleting file",
          message: String(error),
        });
      }
    }
  };

  // Get the relative path from the markdownDir
  const getRelativePath = () => {
    if (!markdownDir) return file.path;
    try {
      return path.relative(markdownDir, file.path);
    } catch (error) {
      return file.path;
    }
  };

  // Pagination actions
  const paginationActions = (
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
  );

  return (
    <List.Item
      id={file.path}
      title={file.name}
      subtitle={getRelativePath()}
      accessories={[
        {
          text: formatDate(file.lastModified),
          tooltip: `Last modified: ${file.lastModified.toLocaleString()}`,
        },
        ...file.tags.map((tag) => ({
          tag: {
            value: tag,
            color: showColorTags
              ? tag.toLowerCase().includes("important")
                ? Color.Red
                : tag.toLowerCase().includes("draft")
                  ? Color.Yellow
                  : tag.toLowerCase().includes("complete")
                    ? Color.Green
                    : tag.toLowerCase().includes("review")
                      ? Color.Orange
                      : tag.toLowerCase().includes("archive")
                        ? Color.Blue
                        : undefined
              : undefined,
          },
        })),
      ]}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <Action title="Open with Typora" icon={Icon.BlankDocument} onAction={() => openWithEditor(file.path)} />
            <Action
              title="Open in Default App"
              icon={Icon.Document}
              shortcut={{ modifiers: ["cmd"], key: "o" }}
              onAction={() => {
                exec(`open "${file.path}"`);
              }}
            />
            <Action.OpenWith path={file.path} shortcut={{ modifiers: ["cmd", "shift"], key: "o" }} />
            <Action.ShowInFinder path={file.path} shortcut={{ modifiers: ["cmd"], key: "f" }} />
            <Action.CopyToClipboard
              title="Copy Path"
              content={file.path}
              shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
            />
          </ActionPanel.Section>

          <ActionPanel.Section>
            <Action
              title="Create a New Markdown File"
              icon={Icon.NewDocument}
              shortcut={{ modifiers: ["cmd"], key: "n" }}
              onAction={showCreateFileForm}
            />
            <Action
              title="Refresh List"
              icon={Icon.RotateClockwise}
              shortcut={{ modifiers: ["cmd"], key: "r" }}
              onAction={revalidate}
            />
            <Action
              title="Load More Files"
              icon={Icon.Plus}
              shortcut={{ modifiers: ["cmd", "shift"], key: "m" }}
              onAction={loadMoreFiles}
            />
          </ActionPanel.Section>

          <ActionPanel.Section>
            <Action
              title="Move to Trash"
              icon={Icon.Trash}
              style={Action.Style.Destructive}
              shortcut={{ modifiers: ["ctrl"], key: "x" }}
              onAction={() => moveToTrash(file)}
            />
            <Action
              title="Delete File"
              icon={Icon.DeleteDocument}
              style={Action.Style.Destructive}
              shortcut={{ modifiers: ["ctrl", "cmd"], key: "x" }}
              onAction={confirmDelete}
            />
          </ActionPanel.Section>

          <ActionPanel.Section>
            <Action
              title="Open Extension Preferences"
              icon={Icon.Gear}
              shortcut={{ modifiers: ["cmd", "shift"], key: "p" }}
              onAction={openCommandPreferences}
            />
          </ActionPanel.Section>

          <ActionPanel.Section>{paginationActions}</ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}
