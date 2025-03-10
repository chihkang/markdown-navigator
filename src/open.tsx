import { List, ActionPanel, Action, showToast, Toast, getPreferenceValues } from "@raycast/api";
import { useState, useEffect } from "react";
import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";

// Get Markdown directory from preferences
const { markdownDir } = getPreferenceValues<{ markdownDir: string }>();

interface MarkdownFile {
  title: string;
  path: string;
  modifiedTime: Date;
  detailedTime: string;
}

export default function Command() {
  const [files, setFiles] = useState<MarkdownFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (!fs.existsSync(markdownDir)) {
        fs.mkdirSync(markdownDir, { recursive: true });
      }
      
      const markdownFiles = fs
        .readdirSync(markdownDir)
        .filter((file) => file.endsWith(".md"))
        .map((file) => {
          const filePath = path.join(markdownDir, file);
          const stats = fs.statSync(filePath);
          const modifiedTime = stats.mtime;
          
          // Use unified detailed time format
          const detailedTime = `${modifiedTime.getFullYear()}/${(modifiedTime.getMonth() + 1).toString().padStart(2, '0')}/${modifiedTime.getDate().toString().padStart(2, '0')} ${modifiedTime.getHours().toString().padStart(2, '0')}:${modifiedTime.getMinutes().toString().padStart(2, '0')}`;
          
          return {
            title: file,
            path: filePath,
            modifiedTime,
            detailedTime,
          };
        })
        // Sort by modified time, newest first
        .sort((a, b) => b.modifiedTime.getTime() - a.modifiedTime.getTime());
      
      setFiles(markdownFiles);
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("An unknown error occurred while reading files");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Error",
        message: error,
      });
    }
  }, [error]);

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
    <List isLoading={isLoading} searchBarPlaceholder="Search Markdown files...">
      {files.map((file) => (
        <List.Item
          key={file.path}
          title={file.title}
          subtitle={undefined} // Remove subtitle
          accessories={[{ text: file.detailedTime, tooltip: "Detailed time" }]} // Move time to accessories
          actions={
            <ActionPanel>
              <Action
                title="Open in Typora"
                onAction={() => openInTypora(file.path)}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}