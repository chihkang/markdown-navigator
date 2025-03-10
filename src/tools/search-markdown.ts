// tools/search-markdown.ts
type Input = {
    /**
     * The search query to find markdown files
     */
    query: string;
    /**
     * Whether to search only in the current project or across the entire system
     */
    scope?: "project" | "system";
    /**
     * Tags to filter by (only applicable for project search)
     */
    tags?: string[];
  };
  
  /**
   * Search for markdown files based on query, scope, and optional tags
   */
  export default async function tool(input: Input) {
    const { query, scope = "project", tags = [] } = input;
    
    // Implement your search logic here, reusing code from your existing commands
    // Return formatted results with file paths, titles, and snippets
    
    return {
      files: [
        // Example result format
        {
          path: "/path/to/file.md",
          title: "Document Title",
          snippet: "Matching text snippet...",
          tags: ["tag1", "tag2"]
        }
        // ...more results
      ]
    };
  }
  