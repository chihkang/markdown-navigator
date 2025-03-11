// tools/open-markdown.ts
type Input = {
  /**
   * The path to the markdown file to open
   */
  path: string;
};

/**
 * Open a markdown file in Typora
 */
export default async function tool(input: Input) {
  // Implement your open logic here
  // This should open the file in Typora

  return `Opened ${input.path} in Typora`;
}
