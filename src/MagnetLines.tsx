import { useEffect, useMemo, useRef } from "react";
import "./MagnetLines.css";

type MagnetLinesProps = {
  rows?: number;
  columns?: number;
  containerSize?: string;
  lineColor?: string;
  lineWidth?: string;
  lineHeight?: string;
  baseAngle?: number;
  className?: string;
  style?: React.CSSProperties;
};

export default function MagnetLines({
  rows = 9,
  columns = 9,
  containerSize = "80vmin",
  lineColor = "#efefef",
  lineWidth = "1vmin",
  lineHeight = "6vmin",
  baseAngle = -10,
  className = "",
  style = {}
}: MagnetLinesProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const centersRef = useRef<Array<{ element: HTMLSpanElement; x: number; y: number }>>([]);
  const frameRef = useRef<number | null>(null);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const items = Array.from(container.querySelectorAll("span"));

    const cacheCenters = () => {
      centersRef.current = items.map((item) => {
        const rect = item.getBoundingClientRect();
        return {
          element: item,
          x: rect.x + rect.width / 2,
          y: rect.y + rect.height / 2
        };
      });
    };

    const applyRotation = () => {
      frameRef.current = null;
      const pointer = pointerRef.current;
      if (!pointer) return;

      centersRef.current.forEach(({ element, x, y }) => {
        const b = pointer.x - x;
        const a = pointer.y - y;
        const c = Math.sqrt(a * a + b * b) || 1;
        const r = ((Math.acos(b / c) * 180) / Math.PI) * (pointer.y > y ? 1 : -1);

        element.style.setProperty("--rotate", `${r}deg`);
      });
    };

    const queueRotation = (pointer: { x: number; y: number }) => {
      pointerRef.current = pointer;
      if (frameRef.current === null) {
        frameRef.current = window.requestAnimationFrame(applyRotation);
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      queueRotation({ x: event.clientX, y: event.clientY });
    };

    cacheCenters();
    if (items.length) {
      const middleIndex = Math.floor(items.length / 2);
      queueRotation({ x: centersRef.current[middleIndex].x, y: centersRef.current[middleIndex].y });
    }

    const resizeObserver = new ResizeObserver(cacheCenters);
    resizeObserver.observe(container);
    window.addEventListener("resize", cacheCenters);
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
      resizeObserver.disconnect();
      window.removeEventListener("resize", cacheCenters);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, [rows, columns]);

  const spans = useMemo(() => Array.from({ length: rows * columns }, (_, index) => (
    <span
      key={index}
      style={{
        "--rotate": `${baseAngle}deg`,
        backgroundColor: lineColor,
        width: lineWidth,
        height: lineHeight
      } as React.CSSProperties}
    />
  )), [baseAngle, columns, lineColor, lineHeight, lineWidth, rows]);

  return (
    <div
      ref={containerRef}
      className={`magnetLines-container ${className}`}
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        width: containerSize,
        height: containerSize,
        ...style
      }}
    >
      {spans}
    </div>
  );
}
