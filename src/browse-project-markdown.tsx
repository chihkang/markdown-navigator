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

// 擴展 MarkdownFile 接口以包含標籤
interface MarkdownFile {
  title: string;
  path: string;
  modifiedTime: Date;
  detailedTime: string;
  tags: string[]; // 添加標籤數組
}

interface CreateFileFormValues {
  title: string;
  tags: string; // 添加標籤字段
}

// 檢查是否為顏色代碼標籤
const isColorTag = (tag: string): boolean => {
  // 檢查是否為 3 或 6 位十六進制顏色代碼
  return /^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$/.test(tag);
};

// 從文件中提取標籤的函數
const extractTags = (filePath: string): string[] => {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const tags: string[] = [];
    
    // 尋找內聯標籤 #tag
    const inlineTagsMatch = content.match(/#([a-zA-Z0-9_\u4e00-\u9fa5-]+)/g); // 支持英文和中文標籤
    if (inlineTagsMatch) {
      const filteredTags = inlineTagsMatch
        .map((t) => t.substring(1))
        .filter((tag) => !isColorTag(tag)); // 過濾掉顏色代碼標籤
      
      tags.push(...filteredTags);
    }
    
    // 去重並返回
    return [...new Set(tags)].filter(Boolean);
  } catch (error) {
    console.error(`Error extracting tags from ${filePath}:`, error);
    return [];
  }
};

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

      // 處理標籤
      const tags = values.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      // 創建文件內容，包括標籤
      let fileContent = `# ${values.title.replace(/\.md$/, "")}\n\n`;
      
      // 如果有標籤，添加到內容中
      if (tags.length > 0) {
        fileContent += `Tags: ${tags.map(tag => `#${tag}`).join(" ")}\n\n`;
      }

      fs.writeFileSync(filePath, fileContent);

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
      <Form.TextField 
        id="tags" 
        title="Tags" 
        placeholder="work, important, todo (comma separated)" 
        info="Tags will be added as #tag in your document"
      />
    </Form>
  );
}

export default function Command() {
  const { push } = useNavigation();
  const [files, setFiles] = useState<MarkdownFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showColorTags, setShowColorTags] = useState(false); // 是否顯示顏色代碼標籤

  // 獲取所有唯一標籤
  const getAllTags = (): string[] => {
    const allTags = new Set<string>();
    files.forEach((file) => {
      file.tags.forEach((tag) => {
        // 如果不顯示顏色代碼標籤，則過濾掉
        if (showColorTags || !isColorTag(tag)) {
          allTags.add(tag);
        }
      });
    });
    return Array.from(allTags).sort();
  };

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

          // 提取標籤
          const tags = extractTags(filePath);

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
            tags,
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

  // 過濾文件
  const filteredFiles = selectedTag
    ? files.filter((file) => file.tags.includes(selectedTag))
    : files;

  // 過濾顯示的標籤
  const displayTags = (tags: string[]): string[] => {
    return showColorTags ? tags : tags.filter(tag => !isColorTag(tag));
  };

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search Markdown files..."
      searchBarAccessory={
        getAllTags().length > 0 ? (
          <List.Dropdown
            tooltip="Filter by tag"
            value={selectedTag || ""}
            onChange={setSelectedTag}
          >
            <List.Dropdown.Item title="All Tags" value="" />
            {getAllTags().map((tag) => (
              <List.Dropdown.Item key={tag} title={`#${tag}`} value={tag} />
            ))}
          </List.Dropdown>
        ) : undefined
      }
      actions={
        <ActionPanel>
          <Action
            title="New Markdown File"
            icon={Icon.NewDocument}
            shortcut={{ modifiers: ["cmd"], key: "n" }}
            onAction={showCreateFileForm}
          />
          <Action
            title={showColorTags ? "Hide Color Tags" : "Show Color Tags"}
            icon={showColorTags ? Icon.EyeDisabled : Icon.Eye}
            shortcut={{ modifiers: ["cmd", "shift"], key: "t" }}
            onAction={() => setShowColorTags(!showColorTags)}
          />
        </ActionPanel>
      }
    >
      {filteredFiles.length > 0 ? (
        filteredFiles.map((file) => (
          <List.Item
            key={file.path}
            id={file.path}
            title={file.title}
            subtitle={displayTags(file.tags).length > 0 ? displayTags(file.tags).map(tag => `#${tag}`).join(" ") : undefined}
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
                  {selectedTag && (
                    <Action
                      title="Clear Tag Filter"
                      icon={Icon.XmarkCircle}
                      onAction={() => setSelectedTag(null)}
                    />
                  )}
                </ActionPanel.Section>
              </ActionPanel>
            }
          />
        ))
      ) : (
        <List.EmptyView
          title={selectedTag ? `No files with tag #${selectedTag}` : "No Markdown files found"}
          description={selectedTag ? "Try selecting a different tag" : "Create a new Markdown file to get started"}
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
              {selectedTag && (
                <Action
                  title="Clear Tag Filter"
                  icon={Icon.XmarkCircle}
                  onAction={() => setSelectedTag(null)}
                />
              )}
            </ActionPanel>
          }
        />
      )}
    </List>
  );
}
