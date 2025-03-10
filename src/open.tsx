import { List, ActionPanel, Action, showToast, Toast, getPreferenceValues } from "@raycast/api";
import { useState, useEffect } from "react";
import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";

// 從偏好設定中獲取 Markdown 文件目錄
const { markdownDir } = getPreferenceValues<{ markdownDir: string }>();

interface MarkdownFile {
  title: string;
  path: string;
  modifiedTime: Date;
  detailedTime: string;
}

export default function Command() {
  const [files, setFiles] = useState<MarkdownFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
          
          // 統一使用詳細時間格式
          const detailedTime = `${modifiedTime.getFullYear()}/${(modifiedTime.getMonth() + 1).toString().padStart(2, '0')}/${modifiedTime.getDate().toString().padStart(2, '0')} ${modifiedTime.getHours().toString().padStart(2, '0')}:${modifiedTime.getMinutes().toString().padStart(2, '0')}`;
          
          return {
            title: file,
            path: filePath,
            modifiedTime,
            detailedTime,
          };
        })
        // 按照修改時間排序，最新的在前面
        .sort((a, b) => b.modifiedTime.getTime() - a.modifiedTime.getTime());
      
      setFiles(markdownFiles);
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("讀取文件時發生未知錯誤");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "錯誤",
        message: error,
      });
    }
  }, [error]);

  // 使用 AppleScript 開啟 Typora 並設定視窗大小
  const openInTypora = (filePath: string) => {
    const appleScript = `
      tell application "Typora"
        activate
        open "${filePath}"
        delay 0.5 -- 等待視窗載入
        tell front window
          set bounds to {100, 100, 1400, 850} -- {左邊位置, 上邊位置, 寬度, 高度}
        end tell
      end tell
    `;
    exec(`osascript -e '${appleScript}'`, (error) => {
      if (error) {
        showToast({
          style: Toast.Style.Failure,
          title: "無法開啟 Typora",
          message: "請確保 Typora 已安裝並支援 AppleScript",
        });
      }
    });
  };

  return (
    <List isLoading={isLoading} searchBarPlaceholder="搜尋 Markdown 文件...">
      {files.map((file) => (
        <List.Item
          key={file.path}
          title={file.title}
          subtitle={undefined} // 移除 subtitle
          accessories={[{ text: file.detailedTime, tooltip: "詳細時間" }]} // 將時間移到 accessories
          actions={
            <ActionPanel>
              <Action
                title="在 Typora 中開啟"
                onAction={() => openInTypora(file.path)}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}