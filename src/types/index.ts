// src/types/index.ts
export interface MarkdownFile {
    path: string;
    name: string;
    lastModified: Date;
    folder: string;
    tags: string[];
  }
  
  export interface CreateFileFormValues {
    title: string;
    tags: string;
  }
  