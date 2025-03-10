// tools/create-markdown.ts
import { Tool } from "@raycast/api";
type Input = {
    /**
     * The title of the new markdown file
     */
    title: string;
    /**
     * The content to include in the markdown file
     */
    content?: string;
    /**
     * Tags to assign to the new file
     */
    tags?: string[];
    /**
     * The directory to save the file in (defaults to current project root)
     */
    directory?: string;
  };
  
  export const confirmation: Tool.Confirmation<Input> = async (input) => {
    return {
      title: "Create Markdown File",
      message: `Create a new markdown file "${input.title}" ${input.tags?.length ? `with tags: ${input.tags.join(", ")}` : ""}?`,
      icon: { source: { light: "light-icon.png", dark: "dark-icon.png" } }
    };
  };
  
  /**
   * Create a new markdown file with the specified title, content, and tags
   */
  export default async function tool(input: Input) {
    const { title, content = "", tags = [], directory } = input;
    
    // Implement your file creation logic
    // This should create a new markdown file with the given parameters
    
    return {
      path: "/path/to/new/file.md",
      title: title,
      tags: tags
    };
  }
  