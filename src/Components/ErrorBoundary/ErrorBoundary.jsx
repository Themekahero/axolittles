// Top-level error boundary so a render/effect throw (e.g. a localStorage quota
// error in Safari Private mode, mid-lesson) degrades to a friendly "tap to
// restart" screen instead of a blank white page in a toddler's hands.
import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    // Stop any speech that may be mid-sentence, and log for diagnostics.
    try {
      window.speechSynthesis?.cancel();
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line no-console
    console.error("Axolittles crashed:", error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          textAlign: "center",
          padding: "2rem",
          fontFamily: '"Fredoka", system-ui, sans-serif',
          background: "linear-gradient(180deg,#c8edff 0%,#a5dcff 55%,#bdeccf 100%)",
          color: "#3b2f5e",
        }}
      >
        <div style={{ maxWidth: 420 }}>
          <img
            src="/axo-logo.svg"
            alt=""
            style={{ width: 120, height: "auto", marginBottom: 12 }}
          />
          <h1 style={{ fontFamily: '"Baloo 2","Fredoka",sans-serif', fontSize: "2rem", margin: "0 0 .5rem" }}>
            Oops! Axo tripped.
          </h1>
          <p style={{ color: "#2f4858", fontWeight: 500, margin: "0 0 1.4rem" }}>
            Something went a little wonky. Let's try again!
          </p>
          <button
            onClick={() => {
              window.location.href = "/";
            }}
            style={{
              fontFamily: '"Fredoka",sans-serif',
              fontWeight: 700,
              fontSize: "1.15rem",
              padding: ".9rem 1.8rem 1rem",
              borderRadius: 999,
              border: "none",
              cursor: "pointer",
              background: "#ffd23f",
              color: "#5b3d00",
              boxShadow: "0 7px 0 #e0a800",
            }}
          >
            ▶ Start again
          </button>
        </div>
      </div>
    );
  }
}
