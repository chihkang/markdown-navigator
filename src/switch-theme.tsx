import { List, ActionPanel, Action, showToast, Toast } from "@raycast/api";
import { useState, useEffect } from "react";
import * as fs from "fs";
import * as path from "path";
import { homedir } from "os";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Path to Typora's theme folder on macOS
const THEME_FOLDER = path.join(homedir(), "Library/Application Support/abnerworks.Typora/themes");

// Function to switch Typora theme using defaults write and restart Typora
const switchTheme = async (themeName: string) => {
  try {
    // Update the theme in macOS defaults
    await execAsync(`defaults write abnerworks.Typora theme -string "${themeName}"`);

    // Restart Typora to apply the new theme using AppleScript with a longer delay
    const appleScript = `
      tell application "Typora"
        if it is running then
          quit
        end if
        delay 2 -- Increased delay to ensure proper shutdown
        activate
      end tell
    `;
    await execAsync(`osascript -e '${appleScript}'`);

    showToast({
      style: Toast.Style.Success,
      title: "Theme Switched",
      message: `Typora theme switched to ${themeName}`,
    });
  } catch (e) {
    showToast({
      style: Toast.Style.Failure,
      title: "Failed to Switch Theme",
      message: e instanceof Error ? e.message : "An unknown error occurred",
    });
  }
};

interface Theme {
  name: string;
  filePath: string;
  actualThemeName: string; // Added to store the exact theme name for switching
}

export default function Command() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadThemes() {
      try {
        if (!fs.existsSync(THEME_FOLDER)) {
          throw new Error("Typora theme folder not found. Please ensure Typora is installed.");
        }

        const files = fs
          .readdirSync(THEME_FOLDER)
          .filter((file) => file.endsWith(".css"))
          .map((file) => {
            const themeName = file.replace(".css", ""); // Use exact file name without .css
            return {
              name: themeName.replace(/-/g, " "), // Convert to readable name for display
              filePath: path.join(THEME_FOLDER, file),
              actualThemeName: themeName, // Store actual theme name for switching
            };
          });

        if (files.length === 0) {
          throw new Error("No themes found in Typora theme folder.");
        }

        setThemes(files);
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError("An unknown error occurred while loading themes");
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadThemes();
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

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search Typora themes...">
      {themes.map((theme) => (
        <List.Item
          key={theme.filePath}
          title={theme.name}
          actions={
            <ActionPanel>
              <Action
                title="Switch Theme"
                onAction={() => switchTheme(theme.actualThemeName)} // Use actual theme name
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}