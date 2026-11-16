// امتداد الملف بحروف كبيرة (مثلاً "PDF")
export function fileExt(name: string) {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toUpperCase().slice(0, 4) : "FILE";
}

// حجم مقروء (KB / MB)
export function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// لون الشارة حسب نوع الملف
export function badgeClass(ext: string) {
  switch (ext) {
    case "PDF":
      return "bg-red-500";
    case "DOCX":
      return "bg-blue-500";
    case "MD":
      return "bg-violet-500";
    default:
      return "bg-slate-500";
  }
}