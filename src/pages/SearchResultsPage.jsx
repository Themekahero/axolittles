import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "../catalogue/catalogue.css";
import {
  catalogueCategories,
  catalogueProducts,
} from "../catalogue/catalogueData";
import { SimpleProductCard } from "../catalogue/SimpleProductCard";

const SearchResultsPage = () => {
  const [params] = useSearchParams();
  const q = (params.get("q") || "").trim();

  const results = useMemo(() => {
    const needle = q.toLowerCase();
    if (!needle) return [];

    const queryTerms = needle.split(/\s+/).filter(Boolean);

    return catalogueProducts.filter((p) => {
      const category = catalogueCategories.find((entry) => entry.slug === p.category);
      const haystack =
        [
          p.title,
          p.baseTitle,
          p.description,
          p.category,
          category?.title,
          category?.eyebrow,
          category?.blurb,
          ...(p.tags || []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

      return (
        haystack.includes(needle) ||
        queryTerms.every((term) => haystack.includes(term))
      );
    });
  }, [q]);

  return (
    <div className="catalogue-listing">
      <div className="container">
        <nav className="catalogue-listing__crumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/shop">Shop</Link>
          <span>/</span>
          <span>Search</span>
        </nav>

        <div className="catalogue-listing__title-row">
          <h1 className="catalogue-listing__title">
            {q ? `Results for “${q}”` : "Search"}
          </h1>
          {q ? (
            <span className="catalogue-listing__count">
              {results.length} items
            </span>
          ) : null}
        </div>

        <div className="catalogue-listing__inner">
          {!q ? (
            <div className="catalogue-main">
              <p style={{ margin: 0, color: "#696b79", fontSize: "0.92rem" }}>
                Use the navbar search icon or open{" "}
                <Link
                  to="/search?q=plush"
                  style={{ color: "#0a6ead", fontWeight: 700 }}
                >
                  /search?q=plush
                </Link>{" "}
                as an example.
              </p>
              <Link
                to="/shop"
                className="shop-button shop-button--primary"
                style={{
                  marginTop: "1rem",
                  display: "inline-block",
                  textDecoration: "none",
                }}
              >
                Browse full catalogue
              </Link>
            </div>
          ) : results.length === 0 ? (
            <div className="catalogue-main">
              <div
                className="empty-state tone-pearl"
                style={{ margin: 0, boxShadow: "none" }}
              >
                <h2>No results</h2>
                <p>Try another keyword or browse by category.</p>
              </div>
              <div
                className="catalogue-sidebar__chips"
                style={{ marginTop: "1rem", listStyle: "none", padding: 0 }}
              >
                {catalogueCategories.map((c) => (
                  <Link
                    key={c.slug}
                    to={`/category/${c.slug}`}
                    className="catalogue-sidebar__chip"
                    style={{ textDecoration: "none", display: "inline-flex" }}
                  >
                    {c.title}
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="catalogue-main">
              <div
                className="catalogue-simple-grid"
                aria-label="Search results"
              >
                {results.map((p) => (
                  <SimpleProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchResultsPage;
