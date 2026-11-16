"use client";

import { useState } from "react";
import UploadZone from "./UploadZone";
import ChatDrawer from "./ChatDrawer";

export default function RagApp() {
  // أسماء الملفات اللي خلص رفعها، بيعرفها الشات
  const [readyFiles, setReadyFiles] = useState<string[]>([]);

  return (
    <>
      <UploadZone onReadyChange={setReadyFiles} />
      <ChatDrawer files={readyFiles} />
    </>
  );
}