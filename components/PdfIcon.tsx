"use client";

import {
  animate,
  motion,
  useAnimationControls,
  useMotionValue,
} from "framer-motion";
import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import { arcPoint, type Point } from "./arc";
import { badgeClass, fileExt } from "./fileUtils";
import { sounds, unlockAudio } from "./sounds";

type Props = {
  file: File;
  hoopRef: RefObject<HTMLDivElement | null>;
  zoneRef: RefObject<HTMLDivElement | null>;
  onDragMove: (start: Point, end: Point) => void;
  onOverChange: (over: boolean) => void;
  onDragStop: () => void;
  onScore: (file: File) => void;
  onThrowEnd: () => void;
};

const MIN_THROW = 40; // أقل مسافة سحب بتحسب رمية (بالبكسل)

function inside(p: Point, r: DOMRect) {
  return p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom;
}

export default function PdfIcon({
  file,
  hoopRef,
  zoneRef,
  onDragMove,
  onOverChange,
  onDragStop,
  onScore,
  onThrowEnd,
}: Props) {
  const controls = useAnimationControls();
  const iconRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const ext = fileExt(file.name);

  // لما الأيقونة تظهر أول مرة: تنط بحركة نابضة
  useEffect(() => {
    controls.start({
      scale: 1,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 18 },
    });
  }, [controls]);

  // مركز الأيقونة الحالي على الشاشة
  function iconCenter(): Point | null {
    const r = iconRef.current?.getBoundingClientRect();
    if (!r) return null;
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  // الهدف: فوق الحلقة بقليل (بإحداثيات الشاشة)
  function rimTarget(): Point | null {
    const hoop = hoopRef.current?.getBoundingClientRect();
    if (!hoop) return null;
    return { x: hoop.left + hoop.width / 2, y: hoop.top + 20 };
  }

  function handleDragStart() {
    sounds.grab();
    controls.start({
      scale: 1.1,
      rotate: -8,
      transition: { duration: 0.15 },
    });
    handleDrag();
  }

  function handleDrag() {
    const card = iconRef.current?.offsetParent?.getBoundingClientRect();
    const zone = zoneRef.current?.getBoundingClientRect();
    const c = iconCenter();
    const t = rimTarget();
    if (!card || !c || !t) return;

    // القوس بينرسم نسبةً لزاوية الكرت
    onDragMove(
      { x: c.x - card.left, y: c.y - card.top },
      { x: t.x - card.left, y: t.y - card.top }
    );

    // المربع بيتلوّن لما الملف يمر فوقه
    onOverChange(!!zone && inside(c, zone));
  }

  async function handleDragEnd() {
    onDragStop();

    const thrown = file; // الملف اللي انرمى
    const c = iconCenter();
    const target = rimTarget();
    if (!c || !target) return;

    const x0 = x.get();
    const y0 = y.get();

    // سحبة قصيرة: مش رمية، ترجع لمكانها
    if (Math.hypot(x0, y0) < MIN_THROW) {
      onOverChange(false);
      controls.start({
        x: 0,
        y: 0,
        rotate: 0,
        scale: 1,
        transition: { type: "spring" },
      });
      return;
    }

    // المسافة بتحدد مدة الطيران وعدد اللفّات
    const dist = Math.hypot(target.x - c.x, target.y - c.y);
    const flight = Math.min(1, Math.max(0.55, dist / 900));
    const spin = Math.max(1, Math.round(dist / 300)) * 360;

    onOverChange(true);
    sounds.throw(flight);

    // 1) يطير على نفس قوس النقط وهو يلف مثل الكرة
    await Promise.all([
      animate(0, 1, {
        duration: flight,
        ease: "easeInOut",
        onUpdate: (t) => {
          const p = arcPoint(c, target, t);
          x.set(x0 + (p.x - c.x));
          y.set(y0 + (p.y - c.y));
        },
      }),
      controls.start({
        rotate: spin,
        scale: 0.75,
        transition: { duration: flight, ease: "linear" },
      }),
    ]);

    sounds.rim();
    onScore(thrown); // +1 والعداد وبداية الرفع
    sounds.swish();

    // 2) ينزل من جوا الشبكة ويضل يلف شوي
    await controls.start({
      y: y.get() + 120,
      rotate: spin + 200,
      scale: 0.5,
      opacity: 0,
      transition: { duration: 0.5, ease: "easeIn" },
    });

    onOverChange(false);

    // 3) يرجع لمكانه (وبيظهر بالملف اللي بعده إذا في)
    controls.set({ x: 0, y: 0, rotate: 0, scale: 1, opacity: 0 });
    onThrowEnd();
    controls.start({ opacity: 1, transition: { duration: 0.3, delay: 0.4 } });
  }

  return (
    <motion.div
      ref={iconRef}
      drag
      dragMomentum={false}
      title={file.name}
      initial={{ scale: 0.4, opacity: 0 }}
      style={{ x, y }}
      animate={controls}
      onPointerDown={unlockAudio}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      className="absolute left-6 top-[316px] z-10 flex h-20 w-16 cursor-grab flex-col items-center justify-center rounded-lg bg-white shadow-md active:cursor-grabbing"
    >
      <div className="mb-1 h-1 w-8 rounded bg-slate-200" />
      <div className="mb-2 h-1 w-6 rounded bg-slate-200" />
      <span
        className={`rounded px-1.5 py-0.5 text-[10px] font-bold text-white ${badgeClass(ext)}`}
      >
        {ext}
      </span>
    </motion.div>
  );
}