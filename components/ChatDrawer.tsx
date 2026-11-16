"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { badgeClass, fileExt } from "./fileUtils";

type Source = { file: string; page: number };

type Message = {
  id: number;
  role: "user" | "assistant";
  text: string;
  sources?: Source[];
};

type Props = {
  files: string[]; // أسماء الملفات الجاهزة (خلص رفعها)
};

const SUGGESTIONS = ["Summarize my files", "What are the key points?"];

// مؤقتاً: رد تجريبي. بعدين منستبدله باستدعاء الـ backend
function fakeAnswer(question: string, fileCount: number) {
  const q = question.length > 60 ? question.slice(0, 60) + "..." : question;
  const target = fileCount === 1 ? "your file" : `your ${fileCount} files`;
  return `This is a demo reply. Once the backend is connected, I will search ${target} and answer "${q}" from the most relevant passages.`;
}

export default function ChatDrawer({ files }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const nextId = useRef(1);
  const endRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const noFiles = files.length === 0;
  const typing = busy && messages[messages.length - 1]?.role === "user";

  // نظّف المؤقتات لما المكوّن يختفي
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Escape بيسكّر اللوحة
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // نزّل لآخر رسالة
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy, open]);

  function send(text: string = input) {
    const q = text.trim();
    if (!q || busy || noFiles) return;

    const userMsg: Message = { id: nextId.current++, role: "user", text: q };
    const replyId = nextId.current++;
    const full = fakeAnswer(q, files.length);
    const sources: Source[] = files
      .slice(0, 2)
      .map((file, i) => ({ file, page: 2 + i * 5 }));

    setMessages((m) => [...m, userMsg]);
    setInput("");
    setBusy(true);

    // 1) "typing..." لحظة، 2) بعدين الرد بينكتب كلمة كلمة
    timeoutRef.current = setTimeout(() => {
      setMessages((m) => [
        ...m,
        { id: replyId, role: "assistant", text: "" },
      ]);

      const words = full.split(" ");
      let i = 0;
      intervalRef.current = setInterval(() => {
        i++;
        const partial = words.slice(0, i).join(" ");
        setMessages((m) =>
          m.map((msg) => (msg.id === replyId ? { ...msg, text: partial } : msg))
        );

        if (i >= words.length) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          // لما يخلص الرد، بتظهر المصادر
          setMessages((m) =>
            m.map((msg) => (msg.id === replyId ? { ...msg, sources } : msg))
          );
          setBusy(false);
        }
      }, 45);
    }, 700);
  }

  return (
    <>
      {/* الزر العائم */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="fab"
            type="button"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            onClick={() => setOpen(true)}
            aria-label="Open chat"
            className="fixed bottom-6 left-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg transition-colors hover:bg-orange-600"
          >
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
            </svg>
            {files.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1 text-[10px] font-bold">
                {files.length}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* لوحة الشات (من الشمال) */}
      <AnimatePresence>
        {open && (
          <motion.aside
            key="drawer"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="fixed inset-y-0 left-0 z-50 flex w-full max-w-sm flex-col border-r border-slate-200 bg-white shadow-2xl"
          >
            {/* الهيدر */}
            <div className="flex items-start justify-between border-b border-slate-200 p-4">
              <div>
                <h2 className="text-lg font-semibold">Chat</h2>
                <p className="text-xs text-slate-500">
                  {noFiles
                    ? "No files ready yet"
                    : `Ask about ${files.length} ${
                        files.length === 1 ? "file" : "files"
                      }`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* شريط الملفات الجاهزة */}
            {!noFiles && (
              <div className="flex gap-2 overflow-x-auto border-b border-slate-100 px-4 py-2">
                {files.map((name, i) => (
                  <span
                    key={`${name}-${i}`}
                    className="flex shrink-0 items-center gap-1.5 rounded-full bg-slate-100 py-1 pl-1 pr-3 text-xs text-slate-600"
                  >
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white ${badgeClass(
                        fileExt(name)
                      )}`}
                    >
                      {fileExt(name)}
                    </span>
                    <span className="max-w-[120px] truncate">{name}</span>
                  </span>
                ))}
              </div>
            )}

            {/* الرسائل */}
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.length === 0 && (
                <div className="mt-8 text-center">
                  <p className="text-sm text-slate-500">
                    {noFiles
                      ? "Upload a file and take the shot, then ask me about it."
                      : "Ask anything about your files."}
                  </p>
                  {!noFiles && (
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      {SUGGESTIONS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => send(s)}
                          className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition-colors hover:bg-slate-50"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={msg.role === "user" ? "flex justify-end" : "flex"}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                      msg.role === "user"
                        ? "rounded-br-sm bg-slate-900 text-white"
                        : "rounded-bl-sm bg-slate-100 text-slate-800"
                    }`}
                  >
                    <p dir="auto" className="whitespace-pre-wrap">
                      {msg.text}
                    </p>

                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {msg.sources.map((s) => (
                          <span
                            key={`${s.file}-${s.page}`}
                            className="max-w-full truncate rounded-full bg-white px-2 py-0.5 text-[11px] text-slate-500 ring-1 ring-slate-200"
                          >
                            {s.file} · p.{s.page}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* typing... */}
              {typing && (
                <div className="flex">
                  <div className="flex gap-1 rounded-2xl rounded-bl-sm bg-slate-100 px-3 py-3">
                    {[0, 150, 300].map((delay) => (
                      <span
                        key={delay}
                        className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div ref={endRef} />
            </div>

            {/* حقل الكتابة */}
            <div className="border-t border-slate-200 p-3">
              <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2">
                <input
                  dir="auto"
                  value={input}
                  disabled={noFiles}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder={
                    noFiles
                      ? "Upload a file to start chatting"
                      : "Ask about your files..."
                  }
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => send()}
                  disabled={!input.trim() || busy || noFiles}
                  aria-label="Send"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-500 text-white transition-colors hover:bg-orange-600 disabled:bg-slate-300"
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 19V5m0 0l-6 6m6-6l6 6" />
                  </svg>
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}