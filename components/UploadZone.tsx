"use client";

import { useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import Hoop from "./Hoop";
import PdfIcon from "./PdfIcon";
import Trajectory from "./Trajectory";
import FileRow, { type UploadItem } from "./FileRow";
import { setMuted as setSoundMuted, sounds } from "./sounds";

const ACCEPT = {
  "application/pdf": [".pdf"],
  "text/plain": [".txt"],
  "text/markdown": [".md"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
};
const MAX_SIZE = 20 * 1024 * 1024; // 20 MB
type Props = {
  onReadyChange?: (names: string[]) => void;
};

export default function UploadZone({ onReadyChange }: Props) {
  const [queue, setQueue] = useState<File[]>([]); // ملفات جاهزة للرمي
  const [items, setItems] = useState<UploadItem[]>([]); // ملفات انرمت وبتنرفع
  const [error, setError] = useState<string | null>(null);

  const [count, setCount] = useState(0);
  const [plusKey, setPlusKey] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [over, setOver] = useState(false);
  const [muted, setMuted] = useState(false);
  const [trail, setTrail] = useState({
    start: { x: 70, y: 380 },
    end: { x: 350, y: 355 },
  });

  const hoopRef = useRef<HTMLDivElement>(null);
  const zoneRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);
  const timers = useRef<Set<ReturnType<typeof setInterval>>>(new Set());

  
  useEffect(() => {
    onReadyChange?.(
      items.filter((it) => it.status === "done").map((it) => it.name)
    );
  }, [items, onReadyChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: ACCEPT,
    maxSize: MAX_SIZE,
    onDrop: (accepted, rejected) => {
      if (accepted.length > 0) setQueue((q) => [...q, ...accepted]);
      setError(
        rejected.length > 0
          ? "Only PDF, DOCX, TXT or MD files up to 20 MB."
          : null
      );
    },
  });

  function startUpload(file: File) {
    const id = nextId.current++;
    setItems((prev) => [
      { id, name: file.name, size: file.size, progress: 0, status: "uploading" },
      ...prev,
    ]);

    let p = 0;
    const timer = setInterval(() => {
      p = Math.min(100, p + 4 + Math.random() * 10);
      setItems((prev) =>
        prev.map((it) =>
          it.id === id
      
            ? { ...it, progress: p, status: p >= 100 ? "done" : "uploading" }
            : it
        )
      );
      if (p >= 100) {
        clearInterval(timer);
        timers.current.delete(timer);
        sounds.success();
      }
    }, 150);
    timers.current.add(timer);
  }

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    setSoundMuted(next);
  }

  const active = over || isDragActive;

  return (
    <div
      className={`relative w-full max-w-xl rounded-2xl bg-slate-100 p-8 ${
        items.length > 0 ? "pb-8" : "pb-24"
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Upload files</h2>
          <p className="text-sm text-slate-500">
            Drag and drop, or take the shot.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? "Turn sound on" : "Turn sound off"}
            title={muted ? "Sound off" : "Sound on"}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-slate-600 transition-colors hover:bg-slate-300"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 5L6 9H2v6h4l5 4V5z" />
              {muted ? (
                <>
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </>
              ) : (
                <>
                  <path d="M15.54 8.46a5 5 0 010 7.07" />
                  <path d="M19.07 4.93a10 10 0 010 14.14" />
                </>
              )}
            </svg>
          </button>

          <span className="rounded-full bg-slate-200 px-3 py-1 text-xs">
            Uploaded <b>{count}</b>
          </span>
        </div>
      </div>

      <div ref={zoneRef} className="mt-8">
        <div
          {...getRootProps()}
          className={`relative flex h-48 cursor-pointer flex-col items-center justify-start rounded-xl border-2 border-dashed pt-8 text-center transition-colors duration-200 ${
            active
              ? "border-orange-400 bg-orange-50"
              : "border-slate-300 bg-white"
          }`}
        >
          <input {...getInputProps()} />

          <svg
            className="mb-3 h-6 w-6 text-slate-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 16V4m0 0L7 9m5-5l5 5M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" />
          </svg>

          <p className="font-medium">Drop files here</p>
          <p
            className={`max-w-[80%] truncate text-xs ${
              error ? "text-red-500" : "text-slate-400"
            }`}
          >
            {error ??
              (queue.length > 0
                ? `${queue[0].name}${
                    queue.length > 1 ? ` (+${queue.length - 1} more)` : ""
                  } is ready, take the shot`
                : "or take the shot")}
          </p>

          {/* +1 */}
          {plusKey > 0 && (
            <motion.span
              key={plusKey}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 1, 0], y: [8, 0, -6, -14] }}
              transition={{ duration: 1.1, times: [0, 0.2, 0.7, 1] }}
              className="pointer-events-none absolute left-1/2 top-[128px] ml-12 text-lg font-bold text-orange-600"
            >
              +1
            </motion.span>
          )}

          <div
            ref={hoopRef}
            className="pointer-events-none absolute left-1/2 top-full -translate-x-1/2 -translate-y-[72px]"
          >
            <Hoop />
          </div>
        </div>
      </div>

      {/* قائمة الملفات المرفوعة */}
      {items.length > 0 && (
        <ul className="mt-[112px] space-y-2">
          {items.map((item) => (
            <FileRow key={item.id} item={item} />
          ))}
        </ul>
      )}

      <Trajectory start={trail.start} end={trail.end} visible={dragging} />

      {/* الأيقونة بتظهر بس لما في ملف جاهز للرمي */}
      {queue.length > 0 && (
        <PdfIcon
          file={queue[0]}
          hoopRef={hoopRef}
          zoneRef={zoneRef}
          onDragMove={(start, end) => {
            setTrail({ start, end });
            setDragging(true);
          }}
          onOverChange={setOver}
          onDragStop={() => setDragging(false)}
          onScore={(file) => {
            setCount((c) => c + 1);
            setPlusKey((k) => k + 1);
            startUpload(file);
          }}
          onThrowEnd={() => setQueue((q) => q.slice(1))}
        />
      )}
    </div>
  );
}