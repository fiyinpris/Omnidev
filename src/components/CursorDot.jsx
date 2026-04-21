import { useEffect, useRef } from "react";

export const CursorDot = () => {
  const dotRef = useRef(null);
  const pos = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const raf = useRef(null);

  // Don't render on touch devices
  const isTouchDevice =
    typeof window !== "undefined" &&
    window.matchMedia("(pointer: coarse)").matches;
  if (isTouchDevice) return null;

  useEffect(() => {
    const onMove = (e) => {
      pos.current = { x: e.clientX, y: e.clientY };
    };

    const animate = () => {
      current.current.x += (pos.current.x - current.current.x) * 0.15;
      current.current.y += (pos.current.y - current.current.y) * 0.15;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${current.current.x - 6}px, ${current.current.y - 6}px)`;
      }
      raf.current = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", onMove);
    raf.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <div
      ref={dotRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "12px",
        height: "12px",
        borderRadius: "50%",
        background: "#2affd0",
        pointerEvents: "none",
        zIndex: 9999,
        boxShadow: "0 0 8px #2affd0, 0 0 16px #2affd088",
        transition: "opacity 0.2s",
      }}
    />
  );
};
