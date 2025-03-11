// src/components/CreateFileForm.tsx
import { Form, ActionPanel, Action, showToast, Toast, useNavigation } from "@raycast/api";
import { useState } from "react";
import createMarkdown from "../tools/create-markdown";
import path from "path";
import { homedir } from "os";

interface CreateFileFormProps {
  rootDirectory: string;
  currentFolder?: string;
  onFileCreated: () => void;
}

export function CreateFileForm({ rootDirectory, currentFolder, onFileCreated }: CreateFileFormProps) {
  const { pop } = useNavigation();
  const [isCreating, setIsCreating] = useState(false);

  // Calculate target path - use desktop as fallback
  const baseDir = rootDirectory || path.join(homedir(), "Desktop");
  const targetPath = currentFolder
    ? path.join(baseDir, currentFolder)
    : baseDir;

  const handleSubmit = async (values: {
    title: string;
    tags: string;
    template: string;
  }) => {
    if (!values.title) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Title is required",
      });
      return;
    }

    setIsCreating(true);

    try {
      // Display the path where the archive will be created
      await showToast({
        style: Toast.Style.Animated,
        title: "Creating file...",
        message: `Path: ${targetPath}`,
      });

      const tags = values.tags ? values.tags.split(",").map(tag => tag.trim()) : [];

      // Create a Markdown file and open it with Typora
      const result = await createMarkdown({
        title: values.title,
        template: values.template,
        tags,
        targetPath,
      });

      if (result.filePath) {
        onFileCreated();
        pop();
      }
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to create file",
        message: String(error),
      });
    }
    finally {
      setIsCreating(false);
    }
  };

  return (
    <Form
      isLoading={isCreating}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Create File" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField id="title" title="Title" placeholder="Enter file title" />

      <Form.Dropdown id="template" title="Template">
        <Form.Dropdown.Item value="basic" title="Basic Note" />
        <Form.Dropdown.Item value="meeting" title="Meeting Notes" />
        <Form.Dropdown.Item value="blog" title="Blog Post" />
        <Form.Dropdown.Item value="project" title="Project Plan" />
        <Form.Dropdown.Item value="empty" title="Empty File" />
      </Form.Dropdown>

      <Form.TextField id="tags" title="Tags" placeholder="tag1, tag2, tag3" />

      <Form.Description
        title="Save Location"
        text={currentFolder || "Root Directory"}
      />
    </Form>
  );
}