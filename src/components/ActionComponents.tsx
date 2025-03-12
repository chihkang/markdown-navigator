// src/components/ActionComponents.tsx
import { ActionPanel, Action, Icon } from "@raycast/api";

interface CommonActionsProps {
  showCreateFileForm: () => void;
  revalidate: () => void;
  loadMoreFiles: () => void;
  showColorTags: boolean;
  setShowColorTags: (show: boolean) => void;
  selectedTag: string | null;
  setSelectedTag: (tag: string | null) => void;
}

export function CommonActions({
  showCreateFileForm,
  revalidate,
  loadMoreFiles,
  showColorTags,
  setShowColorTags,
  selectedTag,
  setSelectedTag,
}: CommonActionsProps) {
  return (
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
}

export function LoadMoreAction({ loadMoreFiles }: { loadMoreFiles: () => void }) {
  return (
    <ActionPanel>
      <Action
        title="Load More Files"
        icon={Icon.Plus}
        shortcut={{ modifiers: ["cmd", "shift"], key: "m" }}
        onAction={loadMoreFiles}
      />
    </ActionPanel>
  );
}
