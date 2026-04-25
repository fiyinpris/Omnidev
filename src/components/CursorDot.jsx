import { useEffect, useRef } from "react";

export const CursorDot = () => {
  const dotRef = useRef(null);

  const pos = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });

  const scale = useRef(1);
  const targetScale = useRef(1);

  const glow = useRef(0);
  const targetGlow = useRef(0);

  const isHovering = useRef(false);

  const raf = useRef(null);

  const isTouchDevice =
    typeof window !== "undefined" &&
    window.matchMedia("(pointer: coarse)").matches;

  if (isTouchDevice) return null;

  useEffect(() => {
    const onMove = (e) => {
      pos.current = { x: e.clientX, y: e.clientY };
    };

    const animate = () => {
      // smooth follow
      current.current.x += (pos.current.x - current.current.x) * 0.15;
      current.current.y += (pos.current.y - current.current.y) * 0.15;

      // smooth scale
      scale.current += (targetScale.current - scale.current) * 0.15;

      // smooth glow
      glow.current += (targetGlow.current - glow.current) * 0.15;

      if (dotRef.current) {
        const glowSize = 12 + glow.current * 40;
        const glowSpread = 24 + glow.current * 70;

        dotRef.current.style.transform = `
          translate(${current.current.x - 6}px, ${current.current.y - 6}px)
          scale(${scale.current})
        `;

        if (isHovering.current) {
          // 🔥 PURE GLOW (like your reference)
          dotRef.current.style.background = "transparent";
          dotRef.current.style.backdropFilter = "none";

          dotRef.current.style.boxShadow = `
            0 0 ${glowSize}px rgba(42,255,208,0.25),
            0 0 ${glowSpread}px rgba(42,255,208,0.18),
            0 0 ${glowSpread * 1.8}px rgba(42,255,208,0.08)
          `;

          dotRef.current.style.filter = "blur(0.5px)";
        } else {
          // ✅ NORMAL DOT
          dotRef.current.style.background = "#2affd0";
          dotRef.current.style.filter = "none";

          dotRef.current.style.boxShadow = `
            0 0 8px #2affd0,
            0 0 16px rgba(42,255,208,0.5)
          `;
        }
      }

      raf.current = requestAnimationFrame(animate);
    };

    // hover ON
    const handleExpand = () => {
      targetScale.current = 3.2;
      targetGlow.current = 1;
      isHovering.current = true;
    };

    // hover OFF
    const handleShrink = () => {
      targetScale.current = 1;
      targetGlow.current = 0;
      isHovering.current = false;
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
        pointerEvents: "none",
        zIndex: 9999,
        willChange: "transform, box-shadow, filter",
      }}
    />
  );
};
