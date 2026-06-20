import { useEffect } from "react";

const useMouseParallax = (containerRef, options = {}) => {
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return undefined;

    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)");
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const strength = options.strength ?? 20;
    const easing = options.easing ?? 0.14;

    if (!canHover.matches || prefersReducedMotion.matches) {
      node.style.setProperty("--parallax-x", "0px");
      node.style.setProperty("--parallax-y", "0px");
      return undefined;
    }

    let frameId = null;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const update = () => {
      frameId = null;
      currentX += (targetX - currentX) * easing;
      currentY += (targetY - currentY) * easing;

      node.style.setProperty("--parallax-x", `${currentX.toFixed(2)}px`);
      node.style.setProperty("--parallax-y", `${currentY.toFixed(2)}px`);

      if (Math.abs(targetX - currentX) > 0.1 || Math.abs(targetY - currentY) > 0.1) {
        frameId = window.requestAnimationFrame(update);
      }
    };

    const queueUpdate = () => {
      if (!frameId) {
        frameId = window.requestAnimationFrame(update);
      }
    };

    const handleMove = (event) => {
      const rect = node.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;

      targetX = px * strength;
      targetY = py * strength;
      queueUpdate();
    };

    const reset = () => {
      targetX = 0;
      targetY = 0;
      queueUpdate();
    };

    node.addEventListener("pointermove", handleMove);
    node.addEventListener("pointerleave", reset);

    return () => {
      node.removeEventListener("pointermove", handleMove);
      node.removeEventListener("pointerleave", reset);
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [containerRef, options.easing, options.strength]);
};

export default useMouseParallax;
