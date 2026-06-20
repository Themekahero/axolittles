import { Link } from "react-router-dom";

/* Self-contained, on-brand 404. Scoped styles use the global brand tokens
   from brand.css (no hardcoded hexes for brand colors). Candy sky→mint
   gradient mirrors the homepage hero; clay buttons match the playful brand. */
const styles = `
.nf-surface {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 7.2rem 1.25rem 4rem;
  background: linear-gradient(180deg, #c8edff 0%, #a5dcff 48%, #bdeccf 100%);
  font-family: var(--brand-font-body);
}
.nf-card {
  width: 100%;
  max-width: 560px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.1rem;
}
.nf-mascot {
  width: clamp(140px, 32vw, 200px);
  height: auto;
  filter: drop-shadow(0 10px 0 rgba(59, 47, 94, 0.12));
  animation: nf-bob 3s ease-in-out infinite;
}
@keyframes nf-bob {
  0%, 100% { transform: translateY(0) rotate(-2deg); }
  50% { transform: translateY(-12px) rotate(2deg); }
}
.nf-eyebrow {
  font-family: var(--brand-font-display);
  font-weight: 800;
  font-size: clamp(2.6rem, 9vw, 4rem);
  line-height: 1;
  letter-spacing: 0.02em;
  color: var(--brand-pink);
  text-shadow: 0 3px 0 rgba(255, 255, 255, 0.6);
  margin: 0;
}
.nf-title {
  font-family: var(--brand-font-display);
  font-weight: 800;
  font-size: clamp(1.5rem, 5vw, 2.25rem);
  line-height: 1.15;
  color: var(--brand-ink);
  text-shadow: 0 3px 0 rgba(255, 255, 255, 0.6);
  margin: 0;
}
.nf-copy {
  font-family: var(--brand-font-body);
  font-size: clamp(1.02rem, 2vw, 1.18rem);
  font-weight: 500;
  line-height: 1.55;
  color: var(--brand-ink-soft);
  max-width: 26rem;
  margin: 0;
}
.nf-cta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
  justify-content: center;
  margin-top: 0.6rem;
}
.nf-btn {
  display: inline-block;
  border: none;
  border-radius: 999px;
  font-family: var(--brand-font-display);
  font-weight: 700;
  font-size: 1.02rem;
  padding: 0.8rem 1.6rem;
  cursor: pointer;
  text-decoration: none;
  transition: transform 0.14s ease, box-shadow 0.14s ease;
}
.nf-btn--primary {
  background: var(--brand-sun);
  color: #5b3d00;
  box-shadow: 0 7px 0 var(--brand-sun-deep);
}
.nf-btn--ghost {
  background: #fff;
  color: var(--brand-ink);
  box-shadow: var(--brand-clay-shadow);
}
.nf-btn:hover { transform: translateY(-2px); }
.nf-btn--primary:active { transform: translateY(3px); box-shadow: 0 2px 0 var(--brand-sun-deep); }
.nf-btn--ghost:active { transform: translateY(3px); box-shadow: 0 2px 0 rgba(59, 47, 94, 0.18); }
@media (prefers-reduced-motion: reduce) {
  .nf-mascot { animation: none; }
  .nf-btn:hover { transform: none; }
}
`;

const NotFoundPage = () => {
  return (
    <div className="nf-surface">
      <style>{styles}</style>
      <div className="nf-card">
        <img
          className="nf-mascot"
          src="/axo-logo.svg"
          alt="Axo the axolotl looking puzzled"
        />
        <p className="nf-eyebrow">Oops!</p>
        <h1 className="nf-title">Axo can&rsquo;t find that page</h1>
        <p className="nf-copy">
          This little page must have wiggled away! Don&rsquo;t worry &mdash;
          let&rsquo;s splash back somewhere fun.
        </p>
        <div className="nf-cta">
          <Link to="/" className="nf-btn nf-btn--primary">
            Back home
          </Link>
          <Link to="/learn" className="nf-btn nf-btn--ghost">
            Play &amp; Learn
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
