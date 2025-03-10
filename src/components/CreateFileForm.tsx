// src/components/CreateFileForm.tsx
import { Form, ActionPanel, Action, showToast, Toast, useNavigation } from "@raycast/api";
import { useState } from "react";
import path from "path";
import { CreateFileFormValues } from "../types";
import { createMarkdownFile, openInTyporaWithSize } from "../utils/fileOperations";

interface CreateFileFormProps {
  markdownDir: string;
  onFileCreated: () => void;
}

export function CreateFileForm({ markdownDir, onFileCreated }: CreateFileFormProps) {
  const { pop } = useNavigation();
  const [isCreating, setIsCreating] = useState(false);

  // 創建文件並在 Typora 中打開
  const createAndOpenFile = async (values: CreateFileFormValues) => {
    try {
      setIsCreating(true);

      // 確保標題有 .md 擴展名
      let fileName = values.title;
      if (!fileName.endsWith(".md")) {
        fileName += ".md";
      }

      // 創建完整文件路徑
      const filePath = path.join(markdownDir, fileName);

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

      // 創建文件
      const success = createMarkdownFile(filePath, fileContent);
      
      if (success) {
        // 顯示成功提示
        showToast({
          style: Toast.Style.Success,
          title: "文件已創建",
          message: `已創建 ${fileName}`,
        });

        // 在 Typora 中打開
        openInTyporaWithSize(filePath);
        
        // 返回文件列表並刷新
        pop();
        onFileCreated();
      }
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "創建文件時出錯",
        message: error instanceof Error ? error.message : "發生未知錯誤",
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
          <Action.SubmitForm title="創建 Markdown 文件" onSubmit={createAndOpenFile} />
        </ActionPanel>
      }
    >
      <Form.TextField id="title" title="文件標題" placeholder="輸入新 Markdown 文件的標題" autoFocus />
      <Form.TextField 
        id="tags" 
        title="標籤" 
        placeholder="工作, 重要, 待辦 (逗號分隔)" 
        info="標籤將作為 #tag 添加到您的文檔中"
      />
    </Form>
  );
}
