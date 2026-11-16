"use client";

import { motion } from "framer-motion";
import { badgeClass, fileExt, formatSize } from "./fileUtils";

export type UploadItem = {
  id: number;
  name: string;
  size: number;
  progress: number; // 0 إلى 100
  status: "uploading" | "done";
};

export default function FileRow({ item }: { item: UploadItem }) {
  const done = item.status === "done";
  const ext = fileExt(item.name);

  return (
    <motion.li
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm"
    >
      {/* أيقونة الملف */}
      <div className="flex h-10 w-8 shrink-0 items-center justify-center rounded bg-slate-100">
        <span
          className={`rounded px-1 py-0.5 text-[8px] font-bold text-white ${badgeClass(ext)}`}
        >
          {ext}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-sm font-medium">{item.name}</p>
          <span
            className={`shrink-0 text-xs font-medium ${
              done ? "text-green-600" : "text-orange-600"
            }`}
          >
            {done ? "Uploaded" : "Uploading..."}
          </span>
        </div>

        <p className="text-xs text-slate-400">{formatSize(item.size)}</p>

        {/* شريط التقدم */}
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-[width,background-color] duration-150 ${
              done ? "bg-green-500" : "bg-orange-500"
            }`}
            style={{ width: `${item.progress}%` }}
          />
        </div>
      </div>

      {done && (
        <svg
          className="h-5 w-5 shrink-0 text-green-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M8 12.5l2.7 2.7L16 9.5" />
        </svg>
      )}
    </motion.li>
  );
}