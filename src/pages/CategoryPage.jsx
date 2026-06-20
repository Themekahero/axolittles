import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import "../catalogue/catalogue.css";
import {
  catalogueProductTypes,
  catalogueProducts,
  getCategoryBySlug,
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

const CategoryPage = () => {
  const { slug } = useParams();
  const category = getCategoryBySlug(slug);
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [tone, setTone] = useState(params.get("tone") || "");
  const [selectedTypes, setSelectedTypes] = useState(
    parseListParam(params.get("types")),
  );

  const globalCategoryCounts = useMemo(
    () => countBy(catalogueProducts, "category"),
    [],
  );
  const categoryItems = useMemo(
    () => catalogueProducts.filter((p) => p.category === category?.slug),
    [category],
  );
  const typeCounts = useMemo(
    () => countBy(categoryItems, "productTypeSlug"),
    [categoryItems],
  );

  const items = useMemo(() => {
    if (!category) return [];
    let list = catalogueProducts.filter((p) => p.category === category.slug);
    if (tone) list = list.filter((p) => p.tone === tone);
    if (selectedTypes.length) {
      list = list.filter((p) => selectedTypes.includes(p.productTypeSlug));
    }
    return list;
  }, [category, tone, selectedTypes]);

  const handleToggleType = (value) => {
    const next = selectedTypes.includes(value)
      ? selectedTypes.filter((item) => item !== value)
      : [...selectedTypes, value];
    setSelectedTypes(next);

    const merged = new URLSearchParams(params);
    if (next.length === 0) merged.delete("types");
    else merged.set("types", next.join(","));
    setParams(merged, { replace: true });
  };

  const navigateToShopFilters = (categories, types) => {
    const next = new URLSearchParams();
    if (categories.length) next.set("categories", categories.join(","));
    if (types.length) next.set("types", types.join(","));
    navigate(`/shop${next.toString() ? `?${next.toString()}` : ""}`);
  };

  const handleToggleCategory = (value) => {
    const current = category ? [category.slug] : [];
    const next = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
    navigateToShopFilters(next, selectedTypes);
  };

  const handleRemoveCurrentCategory = () => {
    navigateToShopFilters([], selectedTypes);
  };

  const handleRemoveType = (value) => {
    const next = selectedTypes.filter((item) => item !== value);
    setSelectedTypes(next);

    const merged = new URLSearchParams(params);
    if (next.length === 0) merged.delete("types");
    else merged.set("types", next.join(","));
    setParams(merged, { replace: true });
  };

  useEffect(() => {
    setTone(params.get("tone") || "");
    setSelectedTypes(parseListParam(params.get("types")));
  }, [slug, params.toString()]);

  const resetFilters = () => {
    navigate("/shop");
  };

  if (!category) {
    return (
      <div className="catalogue-listing">
        <div
          className="catalogue-listing__inner"
          style={{ paddingTop: "6rem" }}
        >
          <div className="empty-state tone-pearl">
            <h2>Category not found</h2>
            <p>
              <Link to="/shop">Back to shop</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="catalogue-listing">
      <nav className="catalogue-listing__crumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to="/shop">Shop</Link>
        <span>/</span>
        <span>{category.title}</span>
      </nav>

      <div className="catalogue-listing__title-row">
        <h1 className="catalogue-listing__title">{category.title}</h1>
        <span className="catalogue-listing__count">{items.length} items</span>
      </div>

      <div className="catalogue-listing__inner">
        <div className="catalogue-listing__layout catalogue-listing__layout--category">
          <CatalogueSidebar
            selectedCategories={category ? [category.slug] : []}
            selectedTypes={selectedTypes}
            onToggleCategory={handleToggleCategory}
            onToggleType={handleToggleType}
            categoryCounts={globalCategoryCounts}
            typeCounts={typeCounts}
            onResetFilters={resetFilters}
          />

          <div className="catalogue-main catalogue-main--category">
            <p className="catalogue-category__blurb">{category.blurb}</p>

            <div className="catalogue-main__meta">
              <span className="catalogue-main__results">
                Showing <strong>{items.length}</strong> product
                {items.length === 1 ? "" : "s"}
              </span>
              <button
                type="button"
                className="catalogue-main__filter-pill catalogue-main__filter-pill--removable"
                onClick={handleRemoveCurrentCategory}
              >
                <span>Category: {category.title}</span>
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
              {selectedTypes.map((typeSlug) => {
                const type = catalogueProductTypes.find(
                  (item) => item.slug === typeSlug,
                );
                return (
                  <button
                    key={typeSlug}
                    type="button"
                    className="catalogue-main__filter-pill catalogue-main__filter-pill--removable"
                    onClick={() => handleRemoveType(typeSlug)}
                  >
                    <span>Type: {type?.title || typeSlug}</span>
                    <i className="fa-solid fa-xmark" aria-hidden="true" />
                  </button>
                );
              })}
            </div>

            {items.length === 0 ? (
              <div
                className="empty-state tone-pearl"
                style={{ margin: 0, boxShadow: "none" }}
              >
                <h2>Coming soon</h2>
                <p>
                  No products in this category yet. Browse{" "}
                  <Link to="/shop">all products</Link>
                </p>
              </div>
            ) : (
              <div
                className="catalogue-simple-grid"
                aria-label={`${category.title} products`}
              >
                {items.map((product) => (
                  <SimpleProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;
