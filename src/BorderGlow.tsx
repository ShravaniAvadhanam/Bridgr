import { useCallback, useEffect, useMemo, useRef } from "react";
import "./BorderGlow.css";

type BorderGlowProps = {
  children: React.ReactNode;
  className?: string;
  edgeSensitivity?: number;
  glowColor?: string;
  backgroundColor?: string;
  borderRadius?: number;
  glowRadius?: number;
  glowIntensity?: number;
  coneSpread?: number;
  animated?: boolean;
  colors?: string[];
  fillOpacity?: number;
};

function parseHSL(hslStr: string) {
  const match = hslStr.match(/([\d.]+)\s*([\d.]+)%?\s*([\d.]+)%?/);
  if (!match) return { h: 210, s: 90, l: 68 };
  return { h: Number.parseFloat(match[1]), s: Number.parseFloat(match[2]), l: Number.parseFloat(match[3]) };
}

function buildGlowVars(glowColor: string, intensity: number) {
  const { h, s, l } = parseHSL(glowColor);
  const base = `${h}deg ${s}% ${l}%`;
  const opacities = [100, 60, 50, 40, 30, 20, 10];
  const keys = ["", "-60", "-50", "-40", "-30", "-20", "-10"];
  const vars: Record<string, string> = {};

  for (let i = 0; i < opacities.length; i += 1) {
    vars[`--glow-color${keys[i]}`] = `hsl(${base} / ${Math.min(opacities[i] * intensity, 100)}%)`;
  }

  return vars;
}

const gradientPositions = ["80% 55%", "69% 34%", "8% 6%", "41% 38%", "86% 85%", "82% 18%", "51% 4%"];
const gradientKeys = ["--gradient-one", "--gradient-two", "--gradient-three", "--gradient-four", "--gradient-five", "--gradient-six", "--gradient-seven"];
const colorMap = [0, 1, 2, 0, 1, 2, 1];

function buildGradientVars(colors: string[]) {
  const vars: Record<string, string> = {};

  for (let i = 0; i < gradientKeys.length; i += 1) {
    const color = colors[Math.min(colorMap[i], colors.length - 1)];
    vars[gradientKeys[i]] = `radial-gradient(at ${gradientPositions[i]}, ${color} 0px, transparent 50%)`;
  }

  vars["--gradient-base"] = `linear-gradient(${colors[0]} 0 100%)`;
  return vars;
}

function easeOutCubic(x: number) {
  return 1 - Math.pow(1 - x, 3);
}

function easeInCubic(x: number) {
  return x * x * x;
}

function animateValue({
  start = 0,
  end = 100,
  duration = 1000,
  delay = 0,
  ease = easeOutCubic,
  onUpdate,
  onEnd
}: {
  start?: number;
  end?: number;
  duration?: number;
  delay?: number;
  ease?: (x: number) => number;
  onUpdate: (value: number) => void;
  onEnd?: () => void;
}) {
  const t0 = performance.now() + delay;
  let frameId = 0;
  let timeoutId = 0;
  let cancelled = false;

  function tick() {
    if (cancelled) return;
    const elapsed = performance.now() - t0;
    const t = Math.min(elapsed / duration, 1);
    onUpdate(start + (end - start) * ease(t));

    if (t < 1) frameId = requestAnimationFrame(tick);
    else if (onEnd) onEnd();
  }

  timeoutId = window.setTimeout(() => {
    frameId = requestAnimationFrame(tick);
  }, delay);

  return () => {
    cancelled = true;
    window.clearTimeout(timeoutId);
    if (frameId) window.cancelAnimationFrame(frameId);
  };
}

function getEdgeProximity(width: number, height: number, x: number, y: number) {
  const cx = width / 2;
  const cy = height / 2;
  const dx = x - cx;
  const dy = y - cy;
  let kx = Infinity;
  let ky = Infinity;
  if (dx !== 0) kx = cx / Math.abs(dx);
  if (dy !== 0) ky = cy / Math.abs(dy);
  return Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);
}

function getCursorAngle(width: number, height: number, x: number, y: number) {
  const dx = x - width / 2;
  const dy = y - height / 2;
  if (dx === 0 && dy === 0) return 0;
  const radians = Math.atan2(dy, dx);
  const degrees = radians * (180 / Math.PI) + 90;
  return degrees < 0 ? degrees + 360 : degrees;
}

export default function BorderGlow({
  children,
  className = "",
  edgeSensitivity = 32,
  glowColor = "210 95 68",
  backgroundColor = "#111111",
  borderRadius = 10,
  glowRadius = 26,
  glowIntensity = 0.45,
  coneSpread = 20,
  animated = false,
  colors = ["#60A5FA", "#22C55E", "#F0F0F0"],
  fillOpacity = 0.08
}: BorderGlowProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const pointerRef = useRef<{ clientX: number; clientY: number } | null>(null);
  const reduceMotionRef = useRef(false);
  const colorKey = colors.join("|");
  const glowStyle = useMemo(() => ({
    "--card-bg": backgroundColor,
    "--edge-sensitivity": edgeSensitivity,
    "--border-radius": `${borderRadius}px`,
    "--glow-padding": `${glowRadius}px`,
    "--cone-spread": coneSpread,
    "--fill-opacity": fillOpacity,
    ...buildGlowVars(glowColor, glowIntensity),
    ...buildGradientVars(colors)
  }) as React.CSSProperties, [
    backgroundColor,
    borderRadius,
    colorKey,
    colors,
    coneSpread,
    edgeSensitivity,
    fillOpacity,
    glowColor,
    glowIntensity,
    glowRadius
  ]);

  const updateGlow = useCallback(() => {
    frameRef.current = null;
    const card = cardRef.current;
    const pointer = pointerRef.current;
    if (!card || !pointer || reduceMotionRef.current) return;

    const rect = card.getBoundingClientRect();
    const x = pointer.clientX - rect.left;
    const y = pointer.clientY - rect.top;

    card.style.setProperty("--edge-proximity", `${(getEdgeProximity(rect.width, rect.height, x, y) * 100).toFixed(3)}`);
    card.style.setProperty("--cursor-angle", `${getCursorAngle(rect.width, rect.height, x, y).toFixed(3)}deg`);
  }, []);

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    pointerRef.current = { clientX: event.clientX, clientY: event.clientY };

    if (frameRef.current === null) {
      frameRef.current = window.requestAnimationFrame(updateGlow);
    }
  }, [updateGlow]);

  useEffect(() => {
    const card = cardRef.current;
    if (!animated || !card || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const angleStart = 110;
    const angleEnd = 465;
    card.classList.add("sweep-active");
    card.style.setProperty("--cursor-angle", `${angleStart}deg`);

    const cancelers = [
      animateValue({ duration: 500, onUpdate: (value) => card.style.setProperty("--edge-proximity", `${value}`) }),
      animateValue({
      ease: easeInCubic,
      duration: 1500,
      end: 50,
      onUpdate: (value) => card.style.setProperty("--cursor-angle", `${(angleEnd - angleStart) * (value / 100) + angleStart}deg`)
      }),
      animateValue({
      ease: easeOutCubic,
      delay: 1500,
      duration: 2250,
      start: 50,
      end: 100,
      onUpdate: (value) => card.style.setProperty("--cursor-angle", `${(angleEnd - angleStart) * (value / 100) + angleStart}deg`)
      }),
      animateValue({
      ease: easeInCubic,
      delay: 2500,
      duration: 1500,
      start: 100,
      end: 0,
      onUpdate: (value) => card.style.setProperty("--edge-proximity", `${value}`),
      onEnd: () => card.classList.remove("sweep-active")
      })
    ];

    return () => {
      cancelers.forEach((cancel) => cancel());
      card.classList.remove("sweep-active");
    };
  }, [animated]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotionPreference = () => {
      reduceMotionRef.current = mediaQuery.matches;
    };

    syncMotionPreference();
    mediaQuery.addEventListener("change", syncMotionPreference);

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
      mediaQuery.removeEventListener("change", syncMotionPreference);
    };
  }, []);

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      className={`border-glow-card ${className}`}
      style={glowStyle}
    >
      <span className="edge-light" />
      <div className="border-glow-inner">{children}</div>
    </div>
  );
}
