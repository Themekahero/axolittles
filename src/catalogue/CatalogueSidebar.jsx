import { useState } from "react";
import {
  catalogueCategories,
  catalogueProductTypes,
} from "./catalogueData";

const FilterSection = ({
  title,
  items,
  selectedValues,
  onToggle,
  counts,
  disabledValues = [],
  defaultOpen = true,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className="catalogue-sidebar__section">
      <button
        type="button"
        className="catalogue-sidebar__section-toggle"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
      >
        <span>{title}</span>
        <i
          className={`fa-solid fa-chevron-${isOpen ? "up" : "down"}`}
          aria-hidden="true"
        />
      </button>

      {isOpen ? (
        <ul className="catalogue-sidebar__filters" role="list">
          {items.map((item) => {
            const checked = selectedValues.includes(item.value);
            const disabled = disabledValues.includes(item.value);
            const count = counts?.[item.value] ?? 0;

            return (
              <li key={item.value}>
                <label
                  className={`catalogue-sidebar__check ${disabled ? "is-disabled" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => onToggle(item.value)}
                  />
                  <span className="catalogue-sidebar__box" aria-hidden="true" />
                  <span className="catalogue-sidebar__check-label">
                    {item.label}
                  </span>
                  <span className="catalogue-sidebar__check-count">
                    ({count})
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
};

export function CatalogueSidebar({
  selectedCategories = [],
  selectedTypes = [],
  onToggleCategory,
  onToggleType,
  categoryCounts,
  typeCounts,
  onResetFilters,
  lockedCategorySlug = "",
}) {
  const categoryItems = catalogueCategories.map((category) => ({
    value: category.slug,
    label: category.title,
  }));

  const productTypeItems = catalogueProductTypes.map((productType) => ({
    value: productType.slug,
    label: productType.title,
  }));

  const activeCategorySelections = lockedCategorySlug
    ? selectedCategories.filter((value) => value !== lockedCategorySlug)
    : selectedCategories;
  const hasFilterSelection =
    activeCategorySelections.length > 0 || selectedTypes.length > 0;

  return (
    <div className="catalogue-sidebar-shell">
      <aside className="catalogue-sidebar" aria-label="Categories and filters">
        <div className="catalogue-sidebar__intro">
          <div className="catalogue-sidebar__intro-top">
            <p className="catalogue-sidebar__eyebrow">More filters</p>
            {hasFilterSelection ? (
              <button
                type="button"
                className="catalogue-sidebar__reset"
                onClick={onResetFilters}
              >
                Reset
              </button>
            ) : null}
          </div>
          <p className="catalogue-sidebar__intro-copy">
            Narrow the catalogue by category or product type.
          </p>
        </div>

        <FilterSection
          title="Categories"
          items={categoryItems}
          selectedValues={selectedCategories}
          onToggle={onToggleCategory}
          counts={categoryCounts}
          disabledValues={lockedCategorySlug ? [lockedCategorySlug] : []}
        />

        <FilterSection
          title="Product Type"
          items={productTypeItems}
          selectedValues={selectedTypes}
          onToggle={onToggleType}
          counts={typeCounts}
        />
      </aside>
    </div>
  );
}
