import { useEffect, useRef, useState } from "react";
import "./TypingHeading.css";

const CHAR_SPEED = 45;
const START_DELAY = 120;

const TypingHeading = ({
  as: Tag = "h2",
  text,
  className = "",
  typingClassName = "",
  ...props
}) => {
  const headingRef = useRef(null);
  const hasCompletedInitialRunRef = useRef(false);
  const canReplayRef = useRef(false);
  const [displayText, setDisplayText] = useState(text);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    const heading = headingRef.current;
    if (!heading || !text?.trim()) return;

    const supportsMotion = !window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (!supportsMotion) {
      setDisplayText(text);
      setIsTyping(false);
      return;
    }

    let timeoutId = null;
    let observer = null;
    let runId = 0;

    const clearTyping = () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    const runTyping = () => {
      runId += 1;
      const currentRun = runId;
      clearTyping();

      setDisplayText("");
      setIsTyping(true);

      let index = 0;

      const tick = () => {
        if (currentRun !== runId) return;
        setDisplayText(text.slice(0, index));

        if (index < text.length) {
          index += 1;
          timeoutId = window.setTimeout(tick, CHAR_SPEED);
          return;
        }

        hasCompletedInitialRunRef.current = true;
        setIsTyping(false);
      };

      timeoutId = window.setTimeout(tick, START_DELAY);
    };

    if (!("IntersectionObserver" in window)) {
      runTyping();
    } else {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              if (!hasCompletedInitialRunRef.current || canReplayRef.current) {
                runTyping();
                canReplayRef.current = false;
              }
              return;
            }

            if (hasCompletedInitialRunRef.current) {
              canReplayRef.current = true;
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -12% 0px" },
      );

      observer.observe(heading);
    }

    return () => {
      if (observer) observer.disconnect();
      clearTyping();
    };
  }, [text]);

  const classes = [
    className,
    "typing-heading",
    typingClassName,
    isTyping ? "is-typing" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag
      ref={headingRef}
      className={classes}
      data-text={text}
      aria-label={text}
      {...props}
    >
      <span className="typing-heading__text">{displayText}</span>
    </Tag>
  );
};

export default TypingHeading;
