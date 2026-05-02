import { useEffect, useRef } from "react";

export const CursorDot = () => {
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  const pos = useRef({ x: 0, y: 0 });
  const dotPos = useRef({ x: 0, y: 0 });
  const ringPos = useRef({ x: 0, y: 0 });

  const ringOpacity = useRef(0);
  const targetRingOpacity = useRef(0);

  const raf = useRef(null);

  const isTouchDevice =
    typeof window !== "undefined" &&
    window.matchMedia("(pointer: coarse)").matches;

  useEffect(() => {
    if (isTouchDevice) return;

    const onMove = (e) => {
      pos.current = { x: e.clientX, y: e.clientY };
    };

    const animate = () => {
      // Dot follows cursor tightly
      dotPos.current.x += (pos.current.x - dotPos.current.x) * 0.28;
      dotPos.current.y += (pos.current.y - dotPos.current.y) * 0.28;

      // Ring follows slower (lag effect)
      ringPos.current.x += (pos.current.x - ringPos.current.x) * 0.1;
      ringPos.current.y += (pos.current.y - ringPos.current.y) * 0.1;

      // Ring opacity smooth transition
      ringOpacity.current +=
        (targetRingOpacity.current - ringOpacity.current) * 0.1;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${dotPos.current.x - 5}px, ${dotPos.current.y - 5}px)`;
      }

      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ringPos.current.x - 20}px, ${ringPos.current.y - 20}px)`;
        ringRef.current.style.opacity = ringOpacity.current;
      }

      raf.current = requestAnimationFrame(animate);
    };

    const handleExpand = () => {
      targetRingOpacity.current = 1;
    };

    const handleShrink = () => {
      targetRingOpacity.current = 0;
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("cursor-expand", handleExpand);
    window.addEventListener("cursor-shrink", handleShrink);
    raf.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("cursor-expand", handleExpand);
      window.removeEventListener("cursor-shrink", handleShrink);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  if (isTouchDevice) return null;

  return (
    <>
      {/* Small solid dot — always visible, never transparent */}
      <div
        ref={dotRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "10px",
          height: "10px",
          borderRadius: "50%",
          background: "#2affd0",
          boxShadow: "0 0 8px #2affd0, 0 0 16px rgba(42,255,208,0.5)",
          pointerEvents: "none",
          zIndex: 9999,
          willChange: "transform",
        }}
      />
      {/* Hover ring — separate element, only opacity changes, never scaled */}
      {/* Hover ring — with subtle teal inner fill */}
      <div
        ref={ringRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          border: "1.5px solid rgba(42,255,208,0.5)",
          background: "rgba(2,25,208,0.08)", // ← add this
          boxShadow:
            "0 0 12px rgba(42,255,208,0.2), 0 0 28px rgba(42,255,208,0.12)",
          pointerEvents: "none",
          zIndex: 9998,
          opacity: 0,
          willChange: "transform, opacity",
        }}
      />
    </>
  );
};
