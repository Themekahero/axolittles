import "./LegalPages.css";

const LegalPageLayout = ({
  eyebrow,
  title,
  summary,
  updatedAt,
  sections,
  onNavigate,
}) => {
  const handleBackHome = (event) => {
    if (!onNavigate) {
      return;
    }

    event.preventDefault();
    onNavigate("/");
  };

  return (
    <div className="legal-page">
      <main className="legal-page__main">
        <section className="legal-page__hero">
          {/* <a className="legal-page__back-link" href="/" onClick={handleBackHome}>
            Back to Shop
          </a> */}
          <p className="legal-page__eyebrow">{eyebrow}</p>
          <h1 className="legal-page__title">{title}</h1>
          <p className="legal-page__summary">{summary}</p>
          <div className="legal-page__meta">
            <span className="legal-page__pill">Last updated: {updatedAt}</span>
            <span className="legal-page__pill">Axo legal overview</span>
          </div>
        </section>

        <section className="legal-page__content">
          <aside className="legal-page__toc" aria-label="Table of contents">
            <p className="legal-page__toc-title">On this page</p>
            <nav className="legal-page__toc-list">
              {sections.map((section) => (
                <a key={section.id} href={`#${section.id}`}>
                  {section.title}
                </a>
              ))}
            </nav>
          </aside>

          <article className="legal-page__article">
            <p className="legal-page__intro">{summary}</p>
            {sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                className="legal-page__section"
              >
                <h2>{section.title}</h2>
                {section.content}
              </section>
            ))}
          </article>
        </section>
      </main>
    </div>
  );
};

export default LegalPageLayout;
