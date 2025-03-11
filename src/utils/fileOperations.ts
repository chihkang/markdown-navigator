import { showToast, Toast } from "@raycast/api";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import { MarkdownFile } from "../types";
import { extractTags } from "./tagOperations";
import { markdownDir } from "../search-system-markdown"; // 假設從主檔案導入

const execAsync = promisify(exec);

// Get the Markdown file
export async function getMarkdownFiles(): Promise<MarkdownFile[]> {
  try {
    // Use the mdfind command but exclude VS Code history files
    const { stdout } = await execAsync(
      `mdfind -onlyin ~ "kind:markdown" | grep -v "/Library/Application Support/Code/User/History/" | grep -v "node_modules"`
    );

    const filePaths = stdout.split("\n").filter(Boolean);
    console.log(`Found ${filePaths.length} Markdown files using mdfind`);

    const files: MarkdownFile[] = [];

    for (const filePath of filePaths) {
      try {
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          const dirname = path.dirname(filePath);
          const folder = path.relative(markdownDir, dirname) || path.basename(dirname); // 相對於 markdownDir 的路徑

          files.push({
            path: filePath,
            name: path.basename(filePath),
            lastModified: stats.mtime,
            folder: folder,
            tags: extractTags(filePath),
          });
          console.log(`Processed file: ${filePath}, folder: ${folder}`);
        } else {
          console.warn(`File not found: ${filePath}`);
        }
      } catch (error) {
        console.error(`Error processing file ${filePath}:`, error);
      }
    }

    // Sort by last modified time, with the latest one first
    return files.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
  } catch (error) {
    console.error("Error while searching for Markdown files with mdfind:", error);

    // Fallback to find command
    try {
      console.log("Falling back to find command");
      const { stdout } = await execAsync(
        `find ~ -name "*.md" -type f -not -path "*/\\.*" -not -path "*/node_modules/*" -not -path "*/Library/*"`
      );

      const filePaths = stdout.split("\n").filter(Boolean);
      console.log(`Found ${filePaths.length} Markdown files using find`);

      return filePaths
        .map((filePath) => {
          const stats = fs.statSync(filePath);
          const dirname = path.dirname(filePath);
          const folder = path.relative(markdownDir, dirname) || path.basename(dirname);

          return {
            path: filePath,
            name: path.basename(filePath),
            lastModified: stats.mtime,
            folder: folder,
            tags: extractTags(filePath),
          };
        })
        .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
    } catch (fallbackError) {
      console.error("Alternative method also failed:", fallbackError);
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to load Markdown files",
        message: "Both mdfind and find commands failed. Check console for details.",
      });
      return [];
    }
  }
}

// Open the file in Typora
export async function openWithTypora(filePath: string) {
  try {
    console.log(`Open file: ${filePath}`);
    await execAsync(`open -a Typora "${filePath}"`);

    showToast({
      style: Toast.Style.Success,
      title: "The file has been opened in Typora",
    });
  } catch (error) {
    console.error("Error opening file using Typora:", error);
    showToast({
      style: Toast.Style.Failure,
      title: "Unable to open file",
      message: String(error),
    });
  }
}

// Open the file in Typora and set the window size
export const openInTyporaWithSize = (filePath: string) => {
  const appleScript = `
    tell application "Typora"
      activate
      open "${filePath}"
      delay 0.5 -- wait for the window to load
      tell front window
        set bounds to {100, 100, 1400, 850} -- {left, top, width, height}
      end tell
    end tell
  `;
  exec(`osascript -e '${appleScript}'`, (error) => {
    if (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Cannot open Typora",
        message: "Please make sure Typora is installed and supports AppleScript",
      });
    }
  });
};

// Create a new Markdown file
export const createMarkdownFile = (filePath: string, content: string): boolean => {
  try {
    // Make sure the directory exists
    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Check if the file already exists
    if (fs.existsSync(filePath)) {
      showToast({
        style: Toast.Style.Failure,
        title: "File already exists",
        message: `${path.basename(filePath)} already exists in the directory`,
      });
      return false;
    }

    // Write to file
    fs.writeFileSync(filePath, content);
    return true;
  } catch (error) {
    showToast({
      style: Toast.Style.Failure,
      title: "Error creating file",
      message: error instanceof Error ? error.message : "An unknown error occurred",
    });
    return false;
  }
};

// Move the file to the trash
export async function moveToTrash(file: MarkdownFile) {
  try {
    // Use AppleScript to move files to the Trash
    const escapedPath = file.path.replace(/'/g, "'\\''");
    await execAsync(`osascript -e 'tell application "Finder" to delete POSIX file "${escapedPath}"'`);

    showToast({
      style: Toast.Style.Success,
      title: "The file has been moved to the trash",
      message: `"${file.name}" has been moved to the trash`,
    });
    
    return true;
  } catch (error) {
    console.error("Error moving file to trash:", error);
    showToast({
      style: Toast.Style.Failure,
      title: "Cannot move to trash",
      message: String(error),
    });
    
    return false;
  }
}