// src/utils/formatters.ts

// 格式化日期為相對時間
export const formatRelativeDate = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
    if (diffDays === 0) {
      return "今天, " + date.toLocaleTimeString("en-TW", { hour: "2-digit", minute: "2-digit" });
    } else if (diffDays === 1) {
      return "昨天, " + date.toLocaleTimeString("en-TW", { hour: "2-digit", minute: "2-digit" });
    } else if (diffDays < 7) {
      return `${diffDays} 天前`;
    } else {
      return date.toLocaleDateString("en-TW");
    }
  };
  