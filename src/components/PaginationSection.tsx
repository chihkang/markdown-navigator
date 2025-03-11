// src/components/PaginationSection.tsx
import { List, ActionPanel, Action, Icon } from "@raycast/api";

interface PaginationSectionProps {
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  revalidate: () => void;
  pageInfoText: string;
}

export function PaginationSection({
  currentPage,
  totalPages,
  setCurrentPage,
  revalidate,
  pageInfoText
}: PaginationSectionProps) {
  return (
    <List.Section title={`Page ${currentPage + 1} of ${totalPages}`}>
      <List.Item
        title={pageInfoText}
        actions={
          <ActionPanel>
            {currentPage > 0 && (
              <Action
                title="Previous page"
                icon={Icon.ArrowLeft}
                shortcut={{ modifiers: ["cmd"], key: "arrowLeft" }}
                onAction = {() => setCurrentPage(currentPage - 1)}
              />
            )}
            {currentPage < totalPages - 1 && (
              <Action
                title="Next Page"
                icon={Icon.ArrowRight}
                shortcut={{ modifiers: ["cmd"], key: "arrowRight" }}
                onAction = {() => setCurrentPage(currentPage + 1)}
              />
            )}
            <Action
              title="Refresh list"
              icon={Icon.RotateClockwise}
              shortcut={{ modifiers: ["cmd"], key: "r" }}
              onAction={revalidate}
            />
          </ActionPanel>
        }
      />
    </List.Section>
  );
}
