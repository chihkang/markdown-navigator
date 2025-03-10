// src/search-system-markdown.tsx
import {
  ActionPanel,
  Action,
  List,
  showToast,
  Toast,
  Icon,
  getPreferenceValues,
  useNavigation,
} from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { useState } from "react";
import { MarkdownFile } from "./types";
import { getMarkdownFiles } from "./utils/fileOperations";
import { getAllUniqueTags } from "./utils/tagOperations";
import { CreateFileForm } from "./components/CreateFileForm";
import { FileListItem } from "./components/FileListItem";
import { PaginationSection } from "./components/PaginationSection";

// 從偏好設置獲取 Markdown 目錄
const { markdownDir } = getPreferenceValues<{ markdownDir: string }>();
const ITEMS_PER_PAGE = 20; // 每頁項目數

export default function Command() {
  const { push } = useNavigation();
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showColorTags, setShowColorTags] = useState(false);

  // 獲取 Markdown 文件
  const { data, isLoading, error, revalidate } = usePromise(getMarkdownFiles);

  // 處理錯誤
  if (error) {
    showToast({
      style: Toast.Style.Failure,
      title: "加載 Markdown 文件失敗",
      message: String(error),
    });
  }

  // 過濾和分頁數據
  const filteredData = data
    ? data.filter(
        (file) =>
          (file.name.toLowerCase().includes(searchText.toLowerCase()) ||
          file.folder.toLowerCase().includes(searchText.toLowerCase())) &&
          (!selectedTag || file.tags.includes(selectedTag))
      )
    : [];

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);

  // 計算當前頁面顯示範圍
  const startItem = currentPage * ITEMS_PER_PAGE + 1;
  const endItem = Math.min((currentPage + 1) * ITEMS_PER_PAGE, filteredData.length);
  const pageInfoText =
    filteredData.length > 0 ? `顯示 ${startItem}-${endItem}，共 ${filteredData.length} 個文件` : "沒有找到文件";

  // 導航到創建文件表單
  const showCreateFileForm = () => {
    push(<CreateFileForm markdownDir={markdownDir} onFileCreated={revalidate} />);
  };

  // 獲取所有標籤
  const allTags = data ? getAllUniqueTags(data, showColorTags) : [];

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="搜尋文件名或資料夾..."
      onSearchTextChange={(text) => {
        setSearchText(text);
        setCurrentPage(0); // 搜尋時重置到第一頁
      }}
      searchText={searchText}
      navigationTitle={`Markdown 文件 (${filteredData.length} 個文件)`}
      searchBarAccessory={
        allTags.length > 0 ? (
          <List.Dropdown
            tooltip="按標籤過濾"
            value={selectedTag || ""}
            onChange={setSelectedTag}
          >
            <List.Dropdown.Item title="所有標籤" value="" />
            {allTags.map((tag) => (
              <List.Dropdown.Item key={tag} title={`#${tag}`} value={tag} />
            ))}
          </List.Dropdown>
        ) : undefined
      }
      actions={
        <ActionPanel>
          <Action
            title="新建 Markdown 文件"
            icon={Icon.NewDocument}
            shortcut={{ modifiers: ["cmd"], key: "n" }}
            onAction={showCreateFileForm}
          />
          <Action
            title={showColorTags ? "隱藏顏色標籤" : "顯示顏色標籤"}
            icon={showColorTags ? Icon.EyeDisabled : Icon.Eye}
            shortcut={{ modifiers: ["cmd", "shift"], key: "t" }}
            onAction={() => setShowColorTags(!showColorTags)}
          />
        </ActionPanel>
      }
    >
      {filteredData.length > 0 ? (
        <>
          {/* 分頁導航 */}
          {totalPages > 1 && (
            <PaginationSection
              currentPage={currentPage}
              totalPages={totalPages}
              setCurrentPage={setCurrentPage}
              revalidate={revalidate}
              pageInfoText={pageInfoText}
            />
          )}

          {/* 按資料夾分組 */}
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
                <FileListItem
                  key={file.path}
                  file={file}
                  showColorTags={showColorTags}
                  revalidate={revalidate}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  setCurrentPage={setCurrentPage}
                  markdownDir={markdownDir}
                />
              ))}
            </List.Section>
          ))}
        </>
      ) : (
        <List.EmptyView
          title={isLoading ? "載入中..." : selectedTag ? `沒有找到帶有標籤 #${selectedTag} 的文件` : "沒有找到 Markdown 文件"}
          description={
            isLoading
              ? "請稍候，正在搜尋 Markdown 文件"
              : selectedTag
              ? "嘗試選擇不同的標籤"
              : "創建一個新的 Markdown 文件開始使用"
          }
          actions={
            <ActionPanel>
              <Action
                title="新建 Markdown 文件"
                icon={Icon.NewDocument}
                onAction={showCreateFileForm}
              />
              <Action
                title="刷新列表"
                icon={Icon.RotateClockwise}
                onAction={revalidate}
              />
              {selectedTag && (
                <Action
                  title="清除標籤過濾"
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
