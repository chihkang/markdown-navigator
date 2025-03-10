// src/utils/tagOperations.ts
import fs from "fs";

// 檢查是否為顏色代碼標籤
export const isColorTag = (tag: string): boolean => {
  // 檢查是否為 3 或 6 位十六進制顏色代碼
  return /^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$/.test(tag);
};

// 從文件中提取標籤的函數
export const extractTags = (filePath: string): string[] => {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const tags: string[] = [];
    
    // 尋找內聯標籤 #tag
    const inlineTagsMatch = content.match(/#([a-zA-Z0-9_\u4e00-\u9fa5-]+)/g); // 支持英文和中文標籤
    if (inlineTagsMatch) {
      const filteredTags = inlineTagsMatch
        .map((t) => t.substring(1))
        .filter((tag) => !isColorTag(tag)); // 過濾掉顏色代碼標籤
      
      tags.push(...filteredTags);
    }
    
    // 尋找 YAML frontmatter 中的標籤
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1];
      const tagsMatch = frontmatter.match(/tags:\s*\[(.*?)\]|tags:\s*(.+)/);
      if (tagsMatch) {
        const tagList = tagsMatch[1] || tagsMatch[2];
        const frontmatterTags = tagList
          .split(/,\s*/)
          .map(t => t.trim().replace(/['"]/g, ''))
          .filter(Boolean);
        tags.push(...frontmatterTags);
      }
    }
    
    // 去重並返回
    return [...new Set(tags)].filter(Boolean);
  } catch (error) {
    console.error(`Error extracting tags from ${filePath}:`, error);
    return [];
  }
};

// 獲取所有唯一標籤
export const getAllUniqueTags = (files: { tags: string[] }[], showColorTags: boolean = false): string[] => {
  const allTags = new Set<string>();
  files.forEach((file) => {
    file.tags.forEach((tag) => {
      // 如果不顯示顏色代碼標籤，則過濾掉
      if (showColorTags || !isColorTag(tag)) {
        allTags.add(tag);
      }
    });
  });
  return Array.from(allTags).sort();
};

// 過濾顯示的標籤
export const filterDisplayTags = (tags: string[], showColorTags: boolean = false): string[] => {
  return showColorTags ? tags : tags.filter(tag => !isColorTag(tag));
};
