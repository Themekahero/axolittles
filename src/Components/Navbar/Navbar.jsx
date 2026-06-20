import "./Navbar.css";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  mobileBottomNav,
  primaryNav,
  shopMenu,
  utilityLinks,
} from "../../storefront/navigationData";

const isPathActive = (pathname, href) =>
  href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);

const getDesktopMenuItems = (item) => {
  if (item.label === "Shop") {
    return [
      ...(shopMenu.featured || []).map((entry) => ({
        ...entry,
        eyebrow: "Category",
      })),
      ...(shopMenu.spotlight || []).map((entry) => ({
        ...entry,
        eyebrow: "Spotlight",
      })),
    ];
  }

  return (item.sections || []).map((entry) => ({
    ...entry,
    eyebrow: item.label,
  }));
};

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const navRef = useRef(null);
  const [q, setQ] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSections, setMobileSections] = useState({ shop: true });
  const [openDesktopMenu, setOpenDesktopMenu] = useState(null);
  const [previewByMenu, setPreviewByMenu] = useState({});

  useEffect(() => {
    setMobileOpen(false);
    setOpenDesktopMenu(null);
    setQ("");
  }, [location.pathname, location.search, location.hash]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!navRef.current?.contains(event.target)) {
        setOpenDesktopMenu(null);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpenDesktopMenu(null);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const submitSearch = (event) => {
    event.preventDefault();
    const term = q.trim();
    navigate(term ? `/search?q=${encodeURIComponent(term)}` : "/search");
  };

  const desktopMenus = useMemo(
    () =>
      primaryNav.map((item) => ({
        ...item,
        menuItems: getDesktopMenuItems(item),
      })),
    [],
  );

  const toggleSection = (key) => {
    setMobileSections((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const toggleDesktopMenu = (label, items) => {
    setOpenDesktopMenu((current) => (current === label ? null : label));
    setPreviewByMenu((current) =>
      current[label]
        ? current
        : {
            ...current,
            [label]: items[0]?.href || null,
          },
    );
  };

  const activeDesktopMenu = desktopMenus.find(
    (item) => item.label === openDesktopMenu,
  );
  const activePreviewHref = activeDesktopMenu
    ? previewByMenu[activeDesktopMenu.label] ||
      activeDesktopMenu.menuItems[0]?.href
    : null;
  const activePreviewItem =
    activeDesktopMenu?.menuItems.find(
      (entry) => entry.href === activePreviewHref,
    ) || activeDesktopMenu?.menuItems[0];

  return (
    <>
      <header className="site-nav" ref={navRef}>
        <nav className="site-nav__primary" aria-label="Primary navigation">
          <div className="site-nav__primary-shell">
            <Link to="/" className="site-nav__brand" aria-label="AXOLITTLES home">
              <img
                src="/axo-logo.svg"
                alt="AXOLITTLES"
                className="site-nav__brand-mark"
              />
              <span className="site-nav__brand-text">AXOLITTLES</span>
            </Link>

            <div className="site-nav__desktop-links">
              {desktopMenus.map((item) => (
                <div
                  key={item.label}
                  className={`site-nav__dropdown ${openDesktopMenu === item.label ? "is-open" : ""} ${isPathActive(location.pathname, item.href) ? "is-active" : ""}`}
                >
                  <button
                    type="button"
                    className="site-nav__primary-trigger"
                    onClick={() =>
                      toggleDesktopMenu(item.label, item.menuItems)
                    }
                    aria-expanded={openDesktopMenu === item.label}
                    aria-controls={`desktop-menu-${item.label}`}
                  >
                    <span>{item.label}</span>
                    <i
                      className={`fa-solid ${openDesktopMenu === item.label ? "fa-angle-up" : "fa-angle-down"} fa-xs`}
                      aria-hidden="true"
                    />
                  </button>
                </div>
              ))}
            </div>

            <form
              className="site-nav__desktop-search"
              onSubmit={submitSearch}
              role="search"
              aria-label="Search products"
            >
              <label className="site-nav__desktop-search-field">
                <i
                  className="fa-solid fa-magnifying-glass"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={q}
                  onChange={(event) => setQ(event.target.value)}
                  placeholder="Search"
                />
              </label>
            </form>

            <button
              type="button"
              className={`site-nav__hamburger ${mobileOpen ? "is-open" : ""}`}
              onClick={() => setMobileOpen((current) => !current)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav-panel"
              aria-label="Toggle navigation"
            >
              <span />
              <span />
              <span />
            </button>
          </div>

          <div
            className={`site-nav__desktop-panel ${activeDesktopMenu ? "is-open" : ""}`}
            id={
              activeDesktopMenu
                ? `desktop-menu-${activeDesktopMenu.label}`
                : undefined
            }
          >
            {activeDesktopMenu ? (
              <div className="site-nav__desktop-panel-inner">
                <div className="site-nav__desktop-copy">
                  <span className="site-nav__desktop-copy-label">
                    {activeDesktopMenu.panelTitle || activeDesktopMenu.label}
                  </span>
                  <p>{activeDesktopMenu.panelDescription}</p>
                  {activeDesktopMenu.label === "Shop" ? (
                    <Link
                      to={activeDesktopMenu.href}
                      className="site-nav__desktop-overview"
                    >
                      Open all {activeDesktopMenu.label.toLowerCase()}
                    </Link>
                  ) : null}
                  {activeDesktopMenu.label === "Collections" ? (
                    <Link to="/shop" className="site-nav__desktop-overview">
                      Open all {activeDesktopMenu.label.toLowerCase()}
                    </Link>
                  ) : null}
                </div>

                <div className="site-nav__desktop-menu-list">
                  {activeDesktopMenu.menuItems.map((entry) => (
                    <Link
                      key={entry.href}
                      to={entry.href}
                      className={`site-nav__desktop-item ${activePreviewItem?.href === entry.href ? "is-previewing" : ""}`}
                      onMouseEnter={() =>
                        setPreviewByMenu((current) => ({
                          ...current,
                          [activeDesktopMenu.label]: entry.href,
                        }))
                      }
                      onFocus={() =>
                        setPreviewByMenu((current) => ({
                          ...current,
                          [activeDesktopMenu.label]: entry.href,
                        }))
                      }
                    >
                      <span>{entry.title}</span>
                    </Link>
                  ))}
                </div>

                <div className="site-nav__desktop-preview">
                  {activePreviewItem?.previewImage ? (
                    <img
                      src={activePreviewItem.previewImage}
                      alt={activePreviewItem.title}
                      className="site-nav__desktop-preview-image"
                    />
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          <div
            id="mobile-nav-panel"
            className={`site-nav__mobile-panel ${mobileOpen ? "is-open" : ""}`}
          >
            <div className="site-nav__mobile-search">
              <form
                className="site-nav__search-form"
                onSubmit={submitSearch}
                role="search"
              >
                <label
                  className="site-nav__search-field"
                  aria-label="Search products"
                >
                  <i
                    className="fa-solid fa-magnifying-glass"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={q}
                    onChange={(event) => setQ(event.target.value)}
                    placeholder="Search AXOLITTLES"
                  />
                </label>
              </form>
            </div>

            <div className="site-nav__mobile-links">
              {desktopMenus.map((item) => (
                <div key={item.label} className="site-nav__accordion-item">
                  <button
                    type="button"
                    className={`site-nav__accordion-trigger ${mobileSections[item.label] ? "is-open" : ""}`}
                    onClick={() => toggleSection(item.label)}
                    aria-expanded={Boolean(mobileSections[item.label])}
                  >
                    <span>{item.label}</span>
                    <i
                      className={`fa-solid ${mobileSections[item.label] ? "fa-angle-up" : "fa-angle-down"} fa-xs`}
                      aria-hidden="true"
                    />
                  </button>
                  <div
                    className={`site-nav__accordion-panel ${mobileSections[item.label] ? "is-open" : ""}`}
                  >
                    <div className="site-nav__mobile-copy">
                      <span className="site-nav__mobile-copy-label">
                        {item.panelTitle || item.label}
                      </span>
                      <p>{item.panelDescription}</p>
                    </div>

                    {item.label === "Shop" ? (
                      <Link
                        to={item.href}
                        className="site-nav__mobile-sublink site-nav__mobile-sublink--overview"
                      >
                        <strong>Open all {item.label.toLowerCase()}</strong>
                        <span>Browse the full shop landing page.</span>
                      </Link>
                    ) : null}

                    {item.menuItems.map((entry) => (
                      <Link
                        key={entry.href}
                        to={entry.href}
                        className="site-nav__mobile-sublink"
                      >
                        <strong>{entry.title}</strong>
                        <span>{entry.description}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* <div className="site-nav__mobile-utility">
              {utilityLinks.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="site-nav__mobile-utility-link"
                >
                  <i className={item.icon} aria-hidden="true" />
                  <span>{item.label}</span>
                  {typeof item.count === "number" ? (
                    <span className="site-nav__count">{item.count}</span>
                  ) : null}
                </Link>
              ))}
            </div> */}
          </div>
        </nav>
      </header>

      {/* <div className="site-nav__bottom-bar">
        {mobileBottomNav.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className="site-nav__bottom-link"
          >
            <span className="site-nav__bottom-icon-wrap">
              <i className={item.icon} aria-hidden="true" />
              {typeof item.count === "number" ? (
                <span className="site-nav__count site-nav__count--bottom">
                  {item.count}
                </span>
              ) : null}
            </span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div> */}
    </>
  );
};

export default Navbar;
