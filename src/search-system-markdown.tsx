import { ActionPanel, Action, List, showToast, Toast, Icon, getPreferenceValues, useNavigation } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { useState, useEffect, useCallback } from "react";
import fs from "fs"; // Import fs module
import { MarkdownFile } from "./types";
import { getMarkdownFiles } from "./utils/fileOperations";
import { getAllUniqueTags } from "./utils/tagOperations";
import { CreateFileForm } from "./components/CreateFileForm";
import { FileListItem } from "./components/FileListItem";
import { PaginationSection } from "./components/PaginationSection";
import path from "path";

export const markdownDir = getPreferenceValues<{ markdownDir: string }>().markdownDir;

const ITEMS_PER_PAGE = 20; // Number of items per page
const INITIAL_LOAD_LIMIT = 50; // Initial load limit
const LOAD_INCREMENT = 50; // Number of items to load each time

export default function Command() {
  const { push } = useNavigation();
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showColorTags, setShowColorTags] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [loadLimit, setLoadLimit] = useState<number>(INITIAL_LOAD_LIMIT); // Dynamic load limit
  const [totalFiles, setTotalFiles] = useState<number>(0); // Total file count
  const [rootDirectory, setRootDirectory] = useState<string>(markdownDir);

  // Validate markdownDir
  useEffect(() => {
    if (!markdownDir || !fs.existsSync(markdownDir)) {
      showToast({
        style: Toast.Style.Failure,
        title: "Invalid Markdown Directory",
        message: "Please set a valid directory in preferences.",
      });
    } else {
      setRootDirectory(markdownDir); // Ensure rootDirectory initial value matches markdownDir
    }
  }, [markdownDir]);

  // Initialize total files count separately to ensure it's set correctly
  useEffect(() => {
    const getTotalFiles = async () => {
      try {
        const allFiles = await getMarkdownFiles();
        setTotalFiles(allFiles.length);
        console.log(`Total files: ${allFiles.length}`);
      } catch (error) {
        console.error("Error getting total files:", error);
      }
    };

    getTotalFiles();
  }, []);

  // Define the fetch function with useCallback to use it with usePromise
  const fetchMarkdownFiles = useCallback(async () => {
    console.log(`Fetching files with limit: ${loadLimit}`);
    const files = await getMarkdownFiles(loadLimit);
    console.log(`Loaded ${files.length} files, limit: ${loadLimit}, total: ${totalFiles}`);
    return files;
  }, [loadLimit, totalFiles]);

  // Get the Markdown files
  const { data, isLoading, error, revalidate } = usePromise(fetchMarkdownFiles, [], {
    execute: true, // Execute on mount
  });

  // Handling Errors
  useEffect(() => {
    if (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Loading Markdown files failed",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }, [error]);

  // Debug log for key variables
  useEffect(() => {
    console.log(`loadLimit: ${loadLimit}, totalFiles: ${totalFiles}, selectedTag: ${selectedTag}`);
  }, [loadLimit, totalFiles, selectedTag]);

  // Reload files when loadLimit changes
  useEffect(() => {
    revalidate();
  }, [loadLimit, revalidate]);

  // Filtering and paging data
  const filteredData = data
    ? data.filter(
        (file) =>
          (file.name.toLowerCase().includes(searchText.toLowerCase()) ||
            file.folder.toLowerCase().includes(searchText.toLowerCase())) &&
          (!selectedTag || file.tags.includes(selectedTag)),
      )
    : [];
  console.log("Filtered data count:", filteredData.length);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);
  console.log("Paginated data count:", paginatedData.length);

  // Calculate the current page display range
  const startItem = currentPage * ITEMS_PER_PAGE + 1;
  const endItem = Math.min((currentPage + 1) * ITEMS_PER_PAGE, filteredData.length);
  const pageInfoText =
    filteredData.length > 0
      ? `Showing ${startItem}-${endItem} of ${filteredData.length} (Total ${totalFiles} files)`
      : "File not found";

  // Navigate to the Create File form with current folder context
  const showCreateFileForm = () => {
    push(<CreateFileForm rootDirectory={rootDirectory} currentFolder={selectedFolder} onFileCreated={revalidate} />);
  };

  // Get all tags
  const allTags = data ? getAllUniqueTags(data, showColorTags) : [];

  // Update rootDirectory if data is available
  useEffect(() => {
    if (data && data.length > 0 && !rootDirectory) {
      const firstFilePath = data[0].path;
      const folderPath = path.dirname(firstFilePath);
      setRootDirectory(folderPath === markdownDir ? markdownDir : folderPath);
      console.log("Set root directory:", rootDirectory);
    }
  }, [data, rootDirectory]);

  // Load more files action
  const loadMoreFiles = () => {
    if (loadLimit < totalFiles) {
      setLoadLimit((prevLimit) => {
        const newLimit = prevLimit + LOAD_INCREMENT;
        console.log(`Increasing load limit from ${prevLimit} to ${newLimit}`);
        return newLimit;
      });
      showToast({
        style: Toast.Style.Success,
        title: "Loading more files",
        message: `Increasing limit from ${loadLimit} to ${loadLimit + LOAD_INCREMENT}`,
      });
    } else {
      showToast({
        style: Toast.Style.Failure,
        title: "All files loaded",
        message: `Already loaded all ${totalFiles} files`,
      });
    }
  };

  // Common actions for both main view and empty view
  const commonActions = (
    <ActionPanel>
      <ActionPanel.Section>
        <Action
          title="Create a New Markdown File"
          icon={Icon.NewDocument}
          shortcut={{ modifiers: ["cmd"], key: "n" }}
          onAction={showCreateFileForm}
        />
        <Action
          title="Refresh List"
          icon={Icon.RotateClockwise}
          shortcut={{ modifiers: ["cmd"], key: "r" }}
          onAction={revalidate}
        />
        <Action
          title="Load More Files"
          icon={Icon.Plus}
          shortcut={{ modifiers: ["cmd", "shift"], key: "m" }}
          onAction={loadMoreFiles}
        />
      </ActionPanel.Section>

      <ActionPanel.Section>
        <Action
          title={showColorTags ? "Hide Color Labels" : "Show Color Labels"}
          icon={showColorTags ? Icon.EyeDisabled : Icon.Eye}
          shortcut={{ modifiers: ["cmd", "shift"], key: "t" }}
          onAction={() => setShowColorTags(!showColorTags)}
        />
        {selectedTag && (
          <Action
            title="Clear Tag Filter"
            icon={Icon.XMarkCircle}
            shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
            onAction={() => setSelectedTag(null)}
          />
        )}
      </ActionPanel.Section>
    </ActionPanel>
  );

  // Add a footer section to display load status and provide a load more button
  const renderFooter = () => {
    if (loadLimit < totalFiles) {
      return (
        <List.Item
          title={`Loaded ${loadLimit} of ${totalFiles} files`}
          icon={Icon.Plus}
          actions={
            <ActionPanel>
              <Action
                title="Load More Files"
                icon={Icon.Plus}
                shortcut={{ modifiers: ["cmd", "shift"], key: "m" }}
                onAction={loadMoreFiles}
              />
            </ActionPanel>
          }
        />
      );
    }
    return null;
  };

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
      actions={commonActions}
      onSelectionChange={(id) => {
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
              loadMoreFiles={loadMoreFiles}
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
                  loadMoreFiles={loadMoreFiles}
                  showCreateFileForm={showCreateFileForm} // Pass the function to create files
                />
              ))}
            </List.Section>
          ))}

          {/* Load more footer */}
          {renderFooter()}
        </>
      ) : (
        <List.EmptyView
          title={
            isLoading
              ? "Scanning Markdown files..."
              : error
                ? "Error loading files"
                : selectedTag
                  ? `No files with the tag #${selectedTag} were found`
                  : "Markdown file not found"
          }
          description={
            isLoading
              ? "This may take a moment. Please wait..."
              : error
                ? error instanceof Error
                  ? error.message
                  : String(error)
                : selectedTag
                  ? "Try choosing a different tag"
                  : "Create a new Markdown file to get started or set a valid directory in preferences"
          }
          actions={commonActions}
        />
      )}
    </List>
  );
}
