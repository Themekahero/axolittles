import { useEffect, useRef, useState } from "react";

const CursorEffect = () => {
  const dotRef = useRef(null);
  const glowRef = useRef(null);
  const frameRef = useRef(null);
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });
  const [enabled, setEnabled] = useState(false);
  const [isHoveringAction, setIsHoveringAction] = useState(false);

  useEffect(() => {
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)");
    const updateEnabled = () => setEnabled(canHover.matches);

    updateEnabled();
    canHover.addEventListener("change", updateEnabled);

    return () => {
      canHover.removeEventListener("change", updateEnabled);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const dot = dotRef.current;
    const glow = glowRef.current;
    if (!dot || !glow) return;

    let isVisible = false;

    const paint = () => {
      frameRef.current = null;
      const current = currentRef.current;
      const target = targetRef.current;

      current.x += (target.x - current.x) * 0.18;
      current.y += (target.y - current.y) * 0.18;

      dot.style.transform = `translate3d(${target.x}px, ${target.y}px, 0)`;
      glow.style.transform = `translate3d(${current.x}px, ${current.y}px, 0)`;

      if (Math.abs(target.x - current.x) > 0.2 || Math.abs(target.y - current.y) > 0.2) {
        frameRef.current = window.requestAnimationFrame(paint);
      }
    };

    const queuePaint = () => {
      if (!frameRef.current) {
        frameRef.current = window.requestAnimationFrame(paint);
      }
    };

    const onMove = (event) => {
      targetRef.current = { x: event.clientX, y: event.clientY };

      if (!isVisible) {
        isVisible = true;
        dot.classList.add("is-visible");
        glow.classList.add("is-visible");
        currentRef.current = { x: event.clientX, y: event.clientY };
      }

      const actionTarget = event.target.closest(
        "a, button, [role='button'], input, textarea, select",
      );
      setIsHoveringAction(Boolean(actionTarget));
      queuePaint();
    };

    const onLeaveWindow = () => {
      isVisible = false;
      dot.classList.remove("is-visible");
      glow.classList.remove("is-visible");
      setIsHoveringAction(false);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseout", onLeaveWindow);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseout", onLeaveWindow);
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <div
        ref={glowRef}
        className={`cursor-glow ${isHoveringAction ? "is-hovering-action" : ""}`}
        aria-hidden="true"
      />
      <div
        ref={dotRef}
        className={`cursor-dot ${isHoveringAction ? "is-hovering-action" : ""}`}
        aria-hidden="true"
      />
    </>
  );
};

export default CursorEffect;
