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

// Get the Markdown table of contents from preferences
const { markdownDir } = getPreferenceValues<{ markdownDir: string }>();
const ITEMS_PER_PAGE = 20; // Number of items per page

export default function Command() {
  const { push } = useNavigation();
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showColorTags, setShowColorTags] = useState(false);

  // Get the Markdown files
  const { data, isLoading, error, revalidate } = usePromise(getMarkdownFiles);

  // Handling Errors
  if (error) {
    showToast({
      style: Toast.Style.Failure,
      title: "Loading Markdown files failed",
      message: String(error),
    });
  }

  // Filtering and paging data
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

  // Calculate the current page display range
  const startItem = currentPage * ITEMS_PER_PAGE + 1;
  const endItem = Math.min((currentPage + 1) * ITEMS_PER_PAGE, filteredData.length);
  const pageInfoText =
    filteredData.length > 0 ? `Showing ${startItem}-${endItem}, ${filteredData.length} files in total` : "File not found";

  // Navigate to the Create File form
  const showCreateFileForm = () => {
    push(<CreateFileForm markdownDir={markdownDir} onFileCreated={revalidate} />);
  };

  // Get all tags
  const allTags = data ? getAllUniqueTags(data, showColorTags) : [];

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search file name or folder..."
      onSearchTextChange={(text) => {
        setSearchText(text);
        setCurrentPage(0); // Reset to first page when searching
      }}
      searchText={searchText}
      navigationTitle={`Markdown files (${filteredData.length} items)`}
      searchBarAccessory={
        allTags.length > 0 ? (
          <List.Dropdown
            tooltip="Filter by Tags"
            value={selectedTag || ""}
            onChange={setSelectedTag}
          >
            <List.Dropdown.Item title="All tags" value="" />
            {allTags.map((tag) => (
              <List.Dropdown.Item key={tag} title={`#${tag}`} value={tag} />
            ))}
          </List.Dropdown>
        ) : undefined
      }
      actions={
        <ActionPanel>
          <Action
            title="Create a new Markdown file"
            icon={Icon.NewDocument}
            shortcut={{ modifiers: ["cmd"], key: "n" }}
            onAction={showCreateFileForm}
          />
          <Action
            title={showColorTags ? "Hide Color Labels" : "Show Color Labels"}
            icon={showColorTags ? Icon.EyeDisabled : Icon.Eye}
            shortcut={{ modifiers: ["cmd", "shift"], key: "t" }}
            onAction={() => setShowColorTags(!showColorTags)}
          />
        </ActionPanel>
      }
    >
      {filteredData.length > 0 ? (
        <>
          {/* Page navigation */}
          {totalPages > 1 && (
            <PaginationSection
              currentPage={currentPage}
              totalPages={totalPages}
              setCurrentPage={setCurrentPage}
              revalidate={revalidate}
              pageInfoText={pageInfoText}
            />
          )}

          {/* Group by folder */}
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
          title={isLoading ? "loading..." : selectedTag ? `No files with the tag #${selectedTag}were found` : "Markdown file not found Markdown"}
          description={
            isLoading
              ? "Try choosing a different tag"
              : selectedTag
              ? "Try choosing a different tag"
              : "Create a new Markdown file to get started"
          }
          actions={
            <ActionPanel>
              <Action
                title="Create a new Markdown file"
                icon={Icon.NewDocument}
                onAction={showCreateFileForm}
              />
              <Action
                title="Refresh List"
                icon={Icon.RotateClockwise}
                onAction={revalidate}
              />
              {selectedTag && (
                <Action
                  title="Clear Tag Filter"
                  icon={Icon.XMarkCircle}
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
