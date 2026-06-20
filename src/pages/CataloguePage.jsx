import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "../catalogue/catalogue.css";
import {
  catalogueCategories,
  catalogueProductTypes,
  catalogueProducts,
} from "../catalogue/catalogueData";
import { CatalogueSidebar } from "../catalogue/CatalogueSidebar";
import { SimpleProductCard } from "../catalogue/SimpleProductCard";

const parseListParam = (value) =>
  value
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

const countBy = (items, key) =>
  items.reduce((acc, item) => {
    acc[item[key]] = (acc[item[key]] || 0) + 1;
    return acc;
  }, {});

const bySort = (sort) => {
  switch (sort) {
    case "price-asc":
      return (a, b) => a.price - b.price;
    case "price-desc":
      return (a, b) => b.price - a.price;
    case "title-asc":
      return (a, b) => a.title.localeCompare(b.title);
    default:
      return () => 0;
  }
};

const CataloguePage = () => {
  const [params, setParams] = useSearchParams();
  const [tone, setTone] = useState(params.get("tone") || "");
  const [sort, setSort] = useState(params.get("sort") || "featured");
  const [query, setQuery] = useState(params.get("q") || "");
  const [viewMode, setViewMode] = useState(params.get("view") || "grid");
  const [selectedCategories, setSelectedCategories] = useState(
    parseListParam(params.get("categories")),
  );
  const [selectedTypes, setSelectedTypes] = useState(
    parseListParam(params.get("types")),
  );
  const hasFilters = Boolean(
    tone ||
    query.trim() ||
    sort !== "featured" ||
    selectedCategories.length ||
    selectedTypes.length,
  );

  const categoryCounts = useMemo(
    () => countBy(catalogueProducts, "category"),
    [],
  );
  const typeCounts = useMemo(
    () => countBy(catalogueProducts, "productTypeSlug"),
    [],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalogueProducts
      .filter((p) => (tone ? p.tone === tone : true))
      .filter((p) =>
        selectedCategories.length
          ? selectedCategories.includes(p.category)
          : true,
      )
      .filter((p) =>
        selectedTypes.length ? selectedTypes.includes(p.productTypeSlug) : true,
      )
      .filter((p) => {
        if (!q) return true;
        const haystack =
          `${p.title} ${p.description} ${(p.tags || []).join(" ")}`.toLowerCase();
        return haystack.includes(q);
      })
      .slice()
      .sort(bySort(sort));
  }, [tone, sort, query, selectedCategories, selectedTypes]);

  const applyParams = (next) => {
    const merged = new URLSearchParams(params);
    Object.entries(next).forEach(([key, val]) => {
      if (
        !val ||
        (Array.isArray(val) && val.length === 0) ||
        (typeof val === "string" && val.length === 0)
      ) {
        merged.delete(key);
      } else if (Array.isArray(val)) merged.set(key, val.join(","));
      else merged.set(key, String(val));
    });
    setParams(merged, { replace: true });
  };

  const toggleSelection = (value, current, setter, paramKey) => {
    const next = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
    setter(next);
    applyParams({ [paramKey]: next });
  };

  const removeSelection = (value, current, setter, paramKey) => {
    const next = current.filter((item) => item !== value);
    setter(next);
    applyParams({ [paramKey]: next });
  };

  const handleSort = (next) => {
    setSort(next);
    applyParams({ sort: next });
  };

  const handleViewMode = (next) => {
    setViewMode(next);
    applyParams({ view: next === "grid" ? "" : next });
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    applyParams({ q: query || "" });
  };

  useEffect(() => {
    setTone(params.get("tone") || "");
    setSort(params.get("sort") || "featured");
    setQuery(params.get("q") || "");
    setViewMode(params.get("view") || "grid");
    setSelectedCategories(parseListParam(params.get("categories")));
    setSelectedTypes(parseListParam(params.get("types")));
  }, [params.toString()]);

  const resetFilters = () => {
    setQuery("");
    setTone("");
    setSort("featured");
    setViewMode("grid");
    setSelectedCategories([]);
    setSelectedTypes([]);
    setParams(new URLSearchParams(), { replace: true });
  };

  return (
    <div className="catalogue-listing">
      <nav className="catalogue-listing__crumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span>/</span>
        <span>Shop</span>
      </nav>

      <div className="catalogue-listing__summary">
        <span className="catalogue-listing__summary-count">
          {filtered.length} {filtered.length === 1 ? "item" : "items"}
        </span>
      </div>

      <div className="catalogue-listing__inner">
        <div className="catalogue-listing__layout">
          <CatalogueSidebar
            selectedCategories={selectedCategories}
            selectedTypes={selectedTypes}
            onToggleCategory={(value) =>
              toggleSelection(
                value,
                selectedCategories,
                setSelectedCategories,
                "categories",
              )
            }
            onToggleType={(value) =>
              toggleSelection(value, selectedTypes, setSelectedTypes, "types")
            }
            categoryCounts={categoryCounts}
            typeCounts={typeCounts}
            onResetFilters={resetFilters}
          />

          <div className="catalogue-main">
            {/* <div className="catalogue-main__header">
              <div>
                <p className="catalogue-main__eyebrow">Curated collection</p>
                <h2 className="catalogue-main__headline">
                  Find your next AXO favorite
                </h2>
                <p className="catalogue-main__copy">
                  Search the full catalogue, explore by mood, and sort the
                  collection your way.
                </p>
              </div>

              {hasFilters ? (
                <button
                  type="button"
                  className="catalogue-main__clear"
                  onClick={resetFilters}
                >
                  Clear filters
                </button>
              ) : null}
            </div> */}

            <div className="catalogue-main__toolbar">
              <form
                className="catalogue-main__toolbar-left"
                onSubmit={handleSearchSubmit}
              >
                <label
                  className="catalogue-main__search"
                  aria-label="Search in catalogue"
                >
                  <i
                    className="fa fa-magnifying-glass"
                    style={{ opacity: 0.55 }}
                    aria-hidden
                  />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search this catalogue…"
                  />
                </label>
                <button type="submit" className="catalogue-main__search-button">
                  Search
                </button>
              </form>
              <div className="catalogue-main__sort">
                <label htmlFor="shop-sort">Sort by</label>
                <select
                  id="shop-sort"
                  value={sort}
                  onChange={(e) => handleSort(e.target.value)}
                >
                  <option value="featured">Featured</option>
                  <option value="title-asc">Name A–Z</option>
                  <option value="price-asc">Price — low to high</option>
                  <option value="price-desc">Price — high to low</option>
                </select>
              </div>
              <div
                className="catalogue-main__view-toggle"
                aria-label="View mode"
              >
                <button
                  type="button"
                  className={`catalogue-main__view-button ${viewMode === "grid" ? "is-active" : ""}`}
                  onClick={() => handleViewMode("grid")}
                  aria-label="Grid view"
                >
                  <i className="fa-solid fa-grip" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className={`catalogue-main__view-button ${viewMode === "list" ? "is-active" : ""}`}
                  onClick={() => handleViewMode("list")}
                  aria-label="List view"
                >
                  <i className="fa-solid fa-list" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="catalogue-main__meta">
              <span className="catalogue-main__results">
                Showing <strong>{filtered.length}</strong> product
                {filtered.length === 1 ? "" : "s"}
              </span>
              {selectedCategories.map((slug) => {
                const category = catalogueCategories.find(
                  (item) => item.slug === slug,
                );
                return (
                  <button
                    key={slug}
                    type="button"
                    className="catalogue-main__filter-pill catalogue-main__filter-pill--removable"
                    onClick={() =>
                      removeSelection(
                        slug,
                        selectedCategories,
                        setSelectedCategories,
                        "categories",
                      )
                    }
                  >
                    <span>Category: {category?.title || slug}</span>
                    <i className="fa-solid fa-xmark" aria-hidden="true" />
                  </button>
                );
              })}
              {selectedTypes.map((slug) => {
                const type = catalogueProductTypes.find(
                  (item) => item.slug === slug,
                );
                return (
                  <button
                    key={slug}
                    type="button"
                    className="catalogue-main__filter-pill catalogue-main__filter-pill--removable"
                    onClick={() =>
                      removeSelection(
                        slug,
                        selectedTypes,
                        setSelectedTypes,
                        "types",
                      )
                    }
                  >
                    <span>Type: {type?.title || slug}</span>
                    <i className="fa-solid fa-xmark" aria-hidden="true" />
                  </button>
                );
              })}
              {tone ? (
                <span className="catalogue-main__filter-pill">
                  Tone: {tone}
                </span>
              ) : null}
              {query.trim() ? (
                <span className="catalogue-main__filter-pill">
                  Search: {query.trim()}
                </span>
              ) : null}
            </div>

            {filtered.length === 0 ? (
              <div
                className="empty-state tone-pearl"
                style={{ margin: 0, boxShadow: "none" }}
              >
                <h2>No matches</h2>
                <p>
                  Try another search or clear filters using “All” under color
                  mood.
                </p>
                <button
                  type="button"
                  className="shop-button shop-button--primary"
                  style={{ marginTop: "0.75rem" }}
                  onClick={resetFilters}
                >
                  Reset filters
                </button>
              </div>
            ) : (
              <div
                className={`catalogue-simple-grid catalogue-simple-grid--${viewMode}`}
                aria-label="Products"
              >
                {filtered.map((product) => (
                  <SimpleProductCard
                    key={product.id}
                    product={{ ...product, viewMode }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CataloguePage;
