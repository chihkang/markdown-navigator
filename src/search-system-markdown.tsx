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
import { useState, useEffect } from "react";
import { MarkdownFile } from "./types";
import { getMarkdownFiles } from "./utils/fileOperations";
import { getAllUniqueTags } from "./utils/tagOperations";
import { CreateFileForm } from "./components/CreateFileForm";
import { FileListItem } from "./components/FileListItem";
import { PaginationSection } from "./components/PaginationSection";
import { homedir } from "os";
import path from "path";

// Get the Markdown directory from preferences or use Desktop as default
export let markdownDir: string;
try {
  const prefs = getPreferenceValues<{ markdownDir: string }>();
  markdownDir = prefs.markdownDir || path.join(homedir(), "Desktop");
} catch (error) {
  // Fallback to Desktop if preference is not set
  markdownDir = path.join(homedir(), "Desktop");
  console.error("Error getting preferences, using Desktop as fallback:", error);
}

const ITEMS_PER_PAGE = 20; // Number of items per page

export default function Command() {
  const { push } = useNavigation();
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showColorTags, setShowColorTags] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [rootDirectory, setRootDirectory] = useState<string>(markdownDir);

  // Get the Markdown files
  const { data, isLoading, error, revalidate } = usePromise(async () => {
    const files = await getMarkdownFiles();
    console.log("Loaded Markdown files:", files.map(f => ({ path: f.path, folder: f.folder })));

    // If we have files, determine the root directory from the first file
    if (files && files.length > 0 && !rootDirectory) {
      const firstFilePath = files[0].path;
      const folderPath = path.dirname(firstFilePath);
      const folderName = files[0].folder;

      // Calculate the root directory by removing the folder name from the path
      if (folderName) {
        const rootDir = folderPath.substring(0, folderPath.lastIndexOf(folderName));
        setRootDirectory(rootDir);
        console.log("Set root directory:", rootDir);
      }
    }

    return files;
  });

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
  console.log("Filtered data:", filteredData.map(f => ({ path: f.path, folder: f.folder })));

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);
  console.log("Paginated data:", paginatedData.map(f => ({ path: f.path, folder: f.folder })));

  // Calculate the current page display range
  const startItem = currentPage * ITEMS_PER_PAGE + 1;
  const endItem = Math.min((currentPage + 1) * ITEMS_PER_PAGE, filteredData.length);
  const pageInfoText =
    filteredData.length > 0 ? `Showing ${startItem}-${endItem}, ${filteredData.length} files in total` : "File not found";

  // Navigate to the Create File form with current folder context
  const showCreateFileForm = () => {
    push(<CreateFileForm rootDirectory={rootDirectory} currentFolder={selectedFolder} onFileCreated={revalidate} />);
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
        console.log("Search text changed:", text);
      }}
      searchText={searchText}
      navigationTitle={`Markdown files (${filteredData.length} items)`}
      searchBarAccessory={
        allTags.length > 0 ? (
          <List.Dropdown
            tooltip="Filter by Tags"
            value={selectedTag || ""}
            onChange={(newTag) => {
              setSelectedTag(newTag);
              console.log("Selected tag:", newTag);
            }}
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
      onSelectionChange={(id) => {
        // When selection changes, update the selected folder
        if (id) {
          const file = paginatedData.find((f) => f.path === id);
          if (file) {
            setSelectedFolder(file.folder);
            console.log("Selected folder:", file.folder);
          }
        }
      }}
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
            <List.Section key={folder} title={folder} subtitle={`${files.length} files`}>
              {files.map((file) => (
                <FileListItem
                  key={file.path}
                  file={file}
                  showColorTags={showColorTags}
                  revalidate={revalidate}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  setCurrentPage={setCurrentPage}
                  markdownDir={rootDirectory}
                />
              ))}
            </List.Section>
          ))}
        </>
      ) : (
        <List.EmptyView
          title={
            isLoading
              ? "loading..."
              : selectedTag
              ? `No files with the tag #${selectedTag} were found`
              : "Markdown file not found"
          }
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