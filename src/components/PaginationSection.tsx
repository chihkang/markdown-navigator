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
    <List.Section title={`第 ${currentPage + 1} 頁，共 ${totalPages} 頁`}>
      <List.Item
        title={pageInfoText}
        actions={
          <ActionPanel>
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
            <Action
              title="刷新列表"
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
