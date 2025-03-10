import {
  List,
  ActionPanel,
  Action,
  showToast,
  Toast,
  Alert,
  getPreferenceValues,
  confirmAlert,
  Icon,
  Form,
  useNavigation,
} from "@raycast/api";
import { useState, useEffect } from "react";
import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";

// Get Markdown directory from preferences
const { markdownDir } = getPreferenceValues<{ markdownDir: string }>();

interface MarkdownFile {
  title: string;
  path: string;
  modifiedTime: Date;
  detailedTime: string;
}

interface CreateFileFormValues {
  title: string;
}

// Open file in Typora using AppleScript and set window size
const openInTypora = (filePath: string) => {
  const appleScript = `
    tell application "Typora"
      activate
      open "${filePath}"
      delay 0.5 -- Wait for window to load
      tell front window
        set bounds to {100, 100, 1400, 850} -- {left, top, width, height}
      end tell
    end tell
  `;
  exec(`osascript -e '${appleScript}'`, (error) => {
    if (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to open Typora",
        message: "Please ensure Typora is installed and supports AppleScript",
      });
    }
  });
};

// Create File Form Component
function CreateFileForm({ onFileCreated }: { onFileCreated: () => void }) {
  const { pop } = useNavigation();
  const [isCreating, setIsCreating] = useState(false);

  // Create file and open in Typora
  const createAndOpenFile = async (values: CreateFileFormValues) => {
    try {
      setIsCreating(true);

      // Ensure title has .md extension
      let fileName = values.title;
      if (!fileName.endsWith(".md")) {
        fileName += ".md";
      }

      // Create full file path
      const filePath = path.join(markdownDir, fileName);

      // Check if directory exists, create if not
      if (!fs.existsSync(markdownDir)) {
        fs.mkdirSync(markdownDir, { recursive: true });
      }

      // Check if file already exists
      if (fs.existsSync(filePath)) {
        showToast({
          style: Toast.Style.Failure,
          title: "File already exists",
          message: `${fileName} already exists in the directory`,
        });
        setIsCreating(false);
        return;
      }

      // Create empty file with title as header
      fs.writeFileSync(filePath, `# ${values.title.replace(/\.md$/, "")}\n\n`);

      // Show success toast
      showToast({
        style: Toast.Style.Success,
        title: "File created",
        message: `Created ${fileName}`,
      });

      // Open in Typora
      openInTypora(filePath);
      
      // Return to file list and refresh
      pop();
      onFileCreated();
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Error creating file",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Form
      isLoading={isCreating}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Create Markdown File" onSubmit={createAndOpenFile} />
        </ActionPanel>
      }
    >
      <Form.TextField id="title" title="File Title" placeholder="Enter title for new markdown file" autoFocus />
    </Form>
  );
}

export default function Command() {
  const { push } = useNavigation();
  const [files, setFiles] = useState<MarkdownFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFiles = () => {
    setIsLoading(true);
    try {
      if (!fs.existsSync(markdownDir)) {
        fs.mkdirSync(markdownDir, { recursive: true });
      }

      const markdownFiles = fs
        .readdirSync(markdownDir)
        .filter((file) => file.endsWith(".md"))
        .map((file) => {
          const filePath = path.join(markdownDir, file);
          const stats = fs.statSync(filePath);
          const modifiedTime = stats.mtime;

          // Use unified detailed time format
          const detailedTime = `${modifiedTime.getFullYear()}/${(modifiedTime.getMonth() + 1)
            .toString()
            .padStart(2, "0")}/${modifiedTime.getDate().toString().padStart(2, "0")} ${modifiedTime
            .getHours()
            .toString()
            .padStart(2, "0")}:${modifiedTime.getMinutes().toString().padStart(2, "0")}`;

          return {
            title: file,
            path: filePath,
            modifiedTime,
            detailedTime,
          };
        })
        // Sort by modified time, newest first
        .sort((a, b) => b.modifiedTime.getTime() - a.modifiedTime.getTime());

      setFiles(markdownFiles);
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("An unknown error occurred while reading files");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  useEffect(() => {
    if (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Error",
        message: error,
      });
    }
  }, [error]);

  // Move file to trash with confirmation
  const moveToTrash = async (file: MarkdownFile) => {
    const options = {
      title: "Move to Trash",
      message: `Are you sure you want to move "${file.title}" to the trash?`,
      primaryAction: {
        title: "Move to Trash",
        style: Alert.ActionStyle.Destructive,
      },
    };

    if (await confirmAlert(options)) {
      try {
        // Use AppleScript to move file to trash (more reliable than Node.js methods)
        const escapedPath = file.path.replace(/'/g, "'\\''");
        exec(`osascript -e 'tell application "Finder" to delete POSIX file "${escapedPath}"'`, (error) => {
          if (error) {
            showToast({
              style: Toast.Style.Failure,
              title: "Failed to Move to Trash",
              message: error.message,
            });
          } else {
            showToast({
              style: Toast.Style.Success,
              title: "File Moved to Trash",
              message: `"${file.title}" has been moved to the trash`,
            });
            // Refresh file list
            loadFiles();
          }
        });
      } catch (e) {
        showToast({
          style: Toast.Style.Failure,
          title: "Failed to Move to Trash",
          message: e instanceof Error ? e.message : "Unknown error occurred",
        });
      }
    }
  };

  // Navigate to create file form
  const showCreateFileForm = () => {
    push(<CreateFileForm onFileCreated={loadFiles} />);
  };

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search Markdown files..."
      actions={
        <ActionPanel>
          <Action
            title="New Markdown File"
            icon={Icon.NewDocument}
            shortcut={{ modifiers: ["cmd"], key: "n" }}
            onAction={showCreateFileForm}
          />
        </ActionPanel>
      }
    >
      {files.length > 0 ? (
        files.map((file) => (
          <List.Item
            key={file.path}
            id={file.path}
            title={file.title}
            accessories={[{ text: file.detailedTime, tooltip: "Last modified" }]}
            actions={
              <ActionPanel>
                <ActionPanel.Section>
                  <Action title="Open in Typora" onAction={() => openInTypora(file.path)} icon={Icon.ArrowRight} />
                  <Action
                    title="Move to Trash"
                    icon={Icon.Trash}
                    style={Action.Style.Destructive}
                    shortcut={{ modifiers: ["opt"], key: "backspace" }}
                    onAction={() => moveToTrash(file)}
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
                    title="Refresh List"
                    icon={Icon.RotateClockwise}
                    shortcut={{ modifiers: ["cmd"], key: "r" }}
                    onAction={loadFiles}
                  />
                </ActionPanel.Section>
              </ActionPanel>
            }
          />
        ))
      ) : (
        <List.EmptyView
          title="No Markdown files found"
          description="Create a new Markdown file to get started"
          icon={Icon.Document}
          actions={
            <ActionPanel>
              <Action
                title="New Markdown File"
                icon={Icon.NewDocument}
                onAction={showCreateFileForm}
              />
              <Action
                title="Refresh List"
                icon={Icon.RotateClockwise}
                onAction={loadFiles}
              />
            </ActionPanel>
          }
        />
      )}
    </List>
  );
}
