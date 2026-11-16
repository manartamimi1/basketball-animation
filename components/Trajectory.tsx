import { arcPoint, type Point } from "./arc";

type Props = {
  start: Point;
  end: Point;
  visible: boolean;
};

export default function Trajectory({ start, end, visible }: Props) {
  // عدد النقط بيزيد مع المسافة، فالمسافة بين النقط تضل متقاربة
  const dist = Math.hypot(end.x - start.x, end.y - start.y);
  const count = Math.min(18, Math.max(6, Math.round(dist / 35)));

  const dots = Array.from({ length: count }, (_, i) =>
    arcPoint(start, end, (i + 1) / (count + 1))
  );

  return (
    <svg
      className={`pointer-events-none absolute inset-0 h-full w-full overflow-visible transition-opacity duration-200 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      aria-hidden="true"
    >
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r="3" fill="#ea580c" opacity="0.6" />
      ))}
    </svg>
  );
}