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
  markdownDir: string; // 添加 markdownDir 參數
}

export function FileListItem({ 
  file, 
  showColorTags, 
  revalidate, 
  currentPage, 
  totalPages, 
  setCurrentPage,
  markdownDir
}: FileListItemProps) {
  const { push } = useNavigation();

  // 處理移至垃圾桶
  const handleMoveToTrash = async () => {
    const options = {
      title: "移至垃圾桶",
      message: `確定要將 "${file.name}" 移至垃圾桶嗎？`,
      primaryAction: {
        title: "移至垃圾桶",
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

  // 在 Finder 中顯示
  const revealInFinder = async () => {
    try {
      await execAsync(`open -R "${file.path}"`);
    } catch (err) {
      showToast({
        style: Toast.Style.Failure,
        title: "無法在 Finder 中顯示",
        message: String(err),
      });
    }
  };

  // 複製路徑
  const copyPath = () => {
    Clipboard.copy(file.path);
    showToast({
      style: Toast.Style.Success,
      title: "路徑已複製到剪貼板",
    });
  };

  // 導航到創建文件表單
  const showCreateFileForm = () => {
    push(<CreateFileForm markdownDir={markdownDir} onFileCreated={revalidate} />);
  };

  // 過濾顯示的標籤
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
              title="在 Typora 中打開"
              icon={Icon.TextDocument}
              onAction={() => openWithTypora(file.path)}
            />
            <Action
              title="在 Finder 中顯示"
              icon={Icon.Finder}
              shortcut={{ modifiers: ["cmd"], key: "f" }}
              onAction={revealInFinder}
            />
            <Action
              title="複製路徑"
              icon={Icon.Clipboard}
              shortcut={{ modifiers: ["cmd"], key: "c" }}
              onAction={copyPath}
            />
          </ActionPanel.Section>

          <ActionPanel.Section>
            <Action
              title="新建 Markdown 文件"
              icon={Icon.NewDocument}
              shortcut={{ modifiers: ["cmd"], key: "n" }}
              onAction={showCreateFileForm}
            />
            <Action
              title="移至垃圾桶"
              icon={Icon.Trash}
              style={Action.Style.Destructive}
              shortcut={{ modifiers: ["opt"], key: "backspace" }}
              onAction={handleMoveToTrash}
            />
          </ActionPanel.Section>

          <ActionPanel.Section>
            <Action
              title="刷新列表"
              icon={Icon.RotateClockwise}
              shortcut={{ modifiers: ["cmd"], key: "r" }}
              onAction={revalidate}
            />
            {totalPages > 1 && (
              <>
                {currentPage > 0 && (
                  <Action
                    title="上一頁"
                    icon={Icon.ArrowLeft}
                    shortcut={{ modifiers: ["cmd"], key: "arrowLeft" }}
                    onAction={() => setCurrentPage(currentPage - 1)}
                  />
                )}
                {currentPage < totalPages - 1 && (
                  <Action
                    title="下一頁"
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
