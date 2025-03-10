// src/utils/fileOperations.ts
import { showToast, Toast } from "@raycast/api";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import { MarkdownFile } from "../types";
import { extractTags } from "./tagOperations";

const execAsync = promisify(exec);

// 獲取 Markdown 文件
export async function getMarkdownFiles(): Promise<MarkdownFile[]> {
  try {
    // 使用 mdfind 命令但排除 VS Code 歷史文件
    const { stdout } = await execAsync('mdfind -onlyin ~ "kind:markdown" | grep -v "/Library/Application Support/Code/User/History/" | grep -v "node_modules" | head -n 200');

    const filePaths = stdout.split("\n").filter(Boolean);
    console.log(`找到 ${filePaths.length} 個 Markdown 文件`);

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
            tags: extractTags(filePath),
          });
        }
      } catch (error) {
        console.error(`處理文件 ${filePath} 時出錯:`, error);
      }
    }

    // 按最後修改時間排序，最新的在前
    return files.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
  } catch (error) {
    console.error("查找 Markdown 文件時出錯:", error);

    // 如果 mdfind 失敗，嘗試使用 find 命令
    try {
      console.log("嘗試使用 find 命令作為備用方法");
      const { stdout } = await execAsync('find ~ -name "*.md" -type f -not -path "*/\\.*" | head -n 200');

      const filePaths = stdout.split("\n").filter(Boolean);
      console.log(`備用方法找到 ${filePaths.length} 個 Markdown 文件`);

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
            tags: extractTags(filePath),
          };
        })
        .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
    } catch (fallbackError) {
      console.error("備用方法也失敗:", fallbackError);
      return [];
    }
  }
}

// 在 Typora 中打開文件
export async function openWithTypora(filePath: string) {
  try {
    console.log(`打開文件: ${filePath}`);
    await execAsync(`open -a Typora "${filePath}"`);

    showToast({
      style: Toast.Style.Success,
      title: "文件已在 Typora 中打開",
    });
  } catch (error) {
    console.error("使用 Typora 打開文件時出錯:", error);
    showToast({
      style: Toast.Style.Failure,
      title: "無法打開文件",
      message: String(error),
    });
  }
}

// 在 Typora 中打開文件並設置窗口大小
export const openInTyporaWithSize = (filePath: string) => {
  const appleScript = `
    tell application "Typora"
      activate
      open "${filePath}"
      delay 0.5 -- 等待窗口加載
      tell front window
        set bounds to {100, 100, 1400, 850} -- {左, 上, 寬, 高}
      end tell
    end tell
  `;
  exec(`osascript -e '${appleScript}'`, (error) => {
    if (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "無法打開 Typora",
        message: "請確保 Typora 已安裝並支持 AppleScript",
      });
    }
  });
};

// 創建新的 Markdown 文件
export const createMarkdownFile = (filePath: string, content: string): boolean => {
  try {
    // 確保目錄存在
    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // 檢查文件是否已存在
    if (fs.existsSync(filePath)) {
      showToast({
        style: Toast.Style.Failure,
        title: "文件已存在",
        message: `${path.basename(filePath)} 已存在於目錄中`,
      });
      return false;
    }

    // 寫入文件
    fs.writeFileSync(filePath, content);
    return true;
  } catch (error) {
    showToast({
      style: Toast.Style.Failure,
      title: "創建文件時出錯",
      message: error instanceof Error ? error.message : "發生未知錯誤",
    });
    return false;
  }
};

// 將文件移到垃圾桶
export async function moveToTrash(file: MarkdownFile) {
  try {
    // 使用 AppleScript 將文件移到垃圾桶
    const escapedPath = file.path.replace(/'/g, "'\\''");
    await execAsync(`osascript -e 'tell application "Finder" to delete POSIX file "${escapedPath}"'`);

    showToast({
      style: Toast.Style.Success,
      title: "文件已移至垃圾桶",
      message: `"${file.name}" 已被移至垃圾桶`,
    });
    
    return true;
  } catch (error) {
    console.error("將文件移至垃圾桶時出錯:", error);
    showToast({
      style: Toast.Style.Failure,
      title: "無法移至垃圾桶",
      message: String(error),
    });
    
    return false;
  }
}
