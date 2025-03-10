import { ActionPanel, Action, List, showToast, Toast } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const execAsync = promisify(exec);

interface MarkdownFile {
  path: string;
  name: string;
  lastModified: Date;
}

// 獲取 Markdown 文件
async function getMarkdownFiles(): Promise<MarkdownFile[]> {
  try {
    // 使用最簡單的 mdfind 命令查找所有 .md 文件
    const { stdout } = await execAsync('mdfind -onlyin ~ "kind:markdown"');
    
    const filePaths = stdout.split('\n').filter(Boolean);
    console.log(`Found ${filePaths.length} Markdown files`);
    
    const files: MarkdownFile[] = [];
    
    for (const filePath of filePaths) {
      try {
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          files.push({
            path: filePath,
            name: path.basename(filePath),
            lastModified: stats.mtime
          });
        }
      } catch (error) {
        console.error(`Error processing file ${filePath}:`, error);
      }
    }
    
    // 按最後修改時間排序
    return files.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
  } catch (error) {
    console.error("Error finding Markdown files:", error);
    
    // 如果 mdfind 失敗，嘗試使用 find 命令
    try {
      console.log("Trying fallback method with find command");
      const { stdout } = await execAsync('find ~ -name "*.md" -type f -not -path "*/\\.*" | head -n 100');
      
      const filePaths = stdout.split('\n').filter(Boolean);
      console.log(`Fallback found ${filePaths.length} Markdown files`);
      
      return filePaths.map(filePath => {
        const stats = fs.statSync(filePath);
        return {
          path: filePath,
          name: path.basename(filePath),
          lastModified: stats.mtime
        };
      }).sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
    } catch (fallbackError) {
      console.error("Fallback method also failed:", fallbackError);
      return [];
    }
  }
}

// 使用 Typora 打開文件
async function openWithTypora(filePath: string) {
  try {
    console.log(`Opening file: ${filePath}`);
    await execAsync(`open -a Typora "${filePath}"`);
    
    showToast({
      style: Toast.Style.Success,
      title: "File opened in Typora"
    });
  } catch (error) {
    console.error("Error opening file with Typora:", error);
    showToast({
      style: Toast.Style.Failure,
      title: "Failed to open file",
      message: String(error)
    });
  }
}

export default function Command() {
  const { data, isLoading, error, revalidate } = usePromise(getMarkdownFiles);

  if (error) {
    showToast({
      style: Toast.Style.Failure,
      title: "Failed to load Markdown files",
      message: String(error)
    });
  }

  return (
    <List 
      isLoading={isLoading} 
      searchBarPlaceholder="Search Markdown files..."
    >
      {data && data.length > 0 ? (
        data.map((file) => (
          <List.Item
            key={file.path}
            title={file.name}
            subtitle={file.path}
            accessories={[
              { 
                text: file.lastModified.toLocaleString("en-TW") 
              }
            ]}
            actions={
              <ActionPanel>
                <Action title="Open in Typora" onAction={() => openWithTypora(file.path)} />
                <Action title="Refresh List" onAction={revalidate} />
              </ActionPanel>
            }
          />
        ))
      ) : (
        <List.EmptyView 
          title="No Markdown files found" 
          description="Could not find any Markdown files. Try creating some Markdown files first."
        />
      )}
    </List>
  );
}
