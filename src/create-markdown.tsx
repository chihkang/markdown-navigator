import { Form, ActionPanel, Action, showToast, Toast, getPreferenceValues } from "@raycast/api";
import { useState } from "react";
import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";

// Get Markdown directory from preferences
const { markdownDir } = getPreferenceValues<{ markdownDir: string }>();

interface FormValues {
  title: string;
}

export default function Command() {
  const [isCreating, setIsCreating] = useState(false);

  // Create file and open in Typora
  const createAndOpenFile = async (values: FormValues) => {
    try {
      setIsCreating(true);

      // Ensure title has .md extension
      let fileName = values.title;
      if (!fileName.endsWith(".md")) {
        fileName += ".md";
      }

      // Create full file path
      const filePath = path.join(markdownDir, fileName);

      // Check if directory exists, create if not
      if (!fs.existsSync(markdownDir)) {
        fs.mkdirSync(markdownDir, { recursive: true });
      }

      // Check if file already exists
      if (fs.existsSync(filePath)) {
        showToast({
          style: Toast.Style.Failure,
          title: "File already exists",
          message: `${fileName} already exists in the directory`,
        });
        setIsCreating(false);
        return;
      }

      // Create empty file
      fs.writeFileSync(filePath, `# ${values.title.replace(/\.md$/, "")}\n\n`);

      // Show success toast
      showToast({
        style: Toast.Style.Success,
        title: "File created",
        message: `Created ${fileName}`,
      });

      // Open in Typora
      openInTypora(filePath);
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Error creating file",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Open file in Typora using AppleScript and set window size
  const openInTypora = (filePath: string) => {
    const appleScript = `
      tell application "Typora"
        activate
        open "${filePath}"
        delay 0.5 -- Wait for window to load
        tell front window
          set bounds to {100, 100, 1400, 850} -- {left, top, width, height}
        end tell
      end tell
    `;
    exec(`osascript -e '${appleScript}'`, (error) => {
      if (error) {
        showToast({
          style: Toast.Style.Failure,
          title: "Failed to open Typora",
          message: "Please ensure Typora is installed and supports AppleScript",
        });
      }
    });
  };

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Create Markdown File" onSubmit={createAndOpenFile} isLoading={isCreating} />
        </ActionPanel>
      }
    >
      <Form.TextField id="title" title="File Title" placeholder="Enter title for new markdown file" autoFocus />
    </Form>
  );
}
