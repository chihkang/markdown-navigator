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

  // Create file and open in Typora
  const createAndOpenFile = async (values: CreateFileFormValues) => {
    try {
      setIsCreating(true);

      // Ensure title has .md extension
      let fileName = values.title;
      if (!fileName.endsWith(".md")) {
        fileName += ".md";
      }

      // Create full file path
      const filePath = path.join(markdownDir, fileName);

      // Process tags
      const tags = values.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      // Create file content, including tags
      let fileContent = `# ${values.title.replace(/\.md$/, "")}\n\n`;
      
      // If there are tags, add them to the content
      if (tags.length > 0) {
        fileContent += `Tags: ${tags.map(tag => `#${tag}`).join(" ")}\n\n`;
      }

      // Create file
      const success = createMarkdownFile(filePath, fileContent);
      
      if (success) {
        // Show success toast
        showToast({
          style: Toast.Style.Success,
          title: "File Created",
          message: `Created ${fileName}`,
        });

        // Open in Typora
        openInTyporaWithSize(filePath);
        
        // Return to file list and refresh
        pop();
        onFileCreated();
      }
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Error Creating File",
        message: error instanceof Error ? error.message : "Unknown error occurred",
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
          <Action.SubmitForm title="Create Markdown File" onSubmit={createAndOpenFile} />
        </ActionPanel>
      }
    >
      <Form.TextField id="title" title="File Title" placeholder="Enter title for new Markdown file" autoFocus />
      <Form.TextField 
        id="tags" 
        title="Tags" 
        placeholder="work, important, todo (comma separated)" 
        info="Tags will be added to your document as #tags"
      />
    </Form>
  );
}
