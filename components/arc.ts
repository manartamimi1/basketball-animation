export type Point = { x: number; y: number };

// ارتفاع القوس بيتناسب مع المسافة الأفقية
export function arcLift(start: Point, end: Point) {
  return Math.max(60, Math.abs(end.x - start.x) * 0.5);
}

// نقطة على القوس: t من 0 (البداية) إلى 1 (النهاية)
export function arcPoint(start: Point, end: Point, t: number): Point {
  const lift = arcLift(start, end);
  return {
    x: start.x + (end.x - start.x) * t,
    y: start.y + (end.y - start.y) * t - lift * 4 * t * (1 - t),
  };
}