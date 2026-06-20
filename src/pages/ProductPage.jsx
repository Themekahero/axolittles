import { useMemo, useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import "../catalogue/catalogue.css";
import {
  catalogueCategories,
  getProductBySlug,
} from "../catalogue/catalogueData";

const sizeOptionsByCategory = {
  kidswear: ["9-12M", "1-2Y", "2-3Y", "3-4Y", "4-5Y"],
  "baby-essentials": ["0-3M", "3-6M", "6-9M", "9-12M"],
  "school-essentials": ["Compact", "Classic", "Daily"],
  accessories: ["Mini", "Classic", "Gift Set"],
  "story-books": ["Board Book", "Picture Book"],
  "plush-toys": ["Mini", "Classic", "Large"],
  "water-toys": ["Mini", "Play Set", "Splash Set"],
  "room-decor": ["Nursery", "Room Set", "Feature Wall"],
};

const materialByCategory = {
  kidswear: "Soft cotton blend",
  "baby-essentials": "Baby-safe soft-touch fabric",
  "school-essentials": "Durable everyday material",
  accessories: "Premium coated finish",
  "story-books": "Smooth matte pages",
  "plush-toys": "Ultra-soft plush fabric",
  "water-toys": "Lightweight water-friendly material",
  "room-decor": "Easy-care decorative finish",
};

const careByCategory = {
  kidswear: "Machine wash",
  "baby-essentials": "Gentle wash recommended",
  "school-essentials": "Wipe clean",
  accessories: "Spot clean only",
  "story-books": "Keep dry and store flat",
  "plush-toys": "Surface clean only",
  "water-toys": "Rinse and air dry",
  "room-decor": "Dry cloth clean",
};

const fitByCategory = {
  kidswear: "Easy everyday fit",
  "baby-essentials": "Soft newborn fit",
  "school-essentials": "Sized for daily routines",
  accessories: "Collectible everyday size",
  "story-books": "Little-reader friendly",
  "plush-toys": "Hug-ready shape",
  "water-toys": "Playtime-friendly size",
  "room-decor": "Room-ready scale",
};

const useByCategory = {
  kidswear: "Playtime and outings",
  "baby-essentials": "Daily comfort and gifting",
  "school-essentials": "School and activity time",
  accessories: "Collecting and gifting",
  "story-books": "Reading and bedtime",
  "plush-toys": "Cuddles and display",
  "water-toys": "Bath time and splash play",
  "room-decor": "Bedrooms and play corners",
};

const ProductPage = () => {
  const { slug } = useParams();
  const product = getProductBySlug(slug);
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const category = useMemo(() => {
    if (!product) return null;
    return catalogueCategories.find((c) => c.slug === product.category) || null;
  }, [product]);

  useEffect(() => {
    if (!lightboxOpen) return undefined;
    document.body.classList.add("shop-lightbox-open");
    const onKey = (e) => {
      if (e.key === "Escape") setLightboxOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("shop-lightbox-open");
      window.removeEventListener("keydown", onKey);
    };
  }, [lightboxOpen]);

  if (!product) {
    return (
      <div className="catalogue-listing">
        <div
          className="catalogue-listing__inner"
          style={{ paddingTop: "6rem" }}
        >
          <div className="empty-state tone-pearl">
            <h2>Product not found</h2>
            <p>
              <Link to="/shop">Browse shop</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const image = product.images[active] || product.images[0];
  const canBrowse = product.images.length > 1;

  const changeSlide = (dir) => {
    if (!canBrowse) return;
    setActive((i) => (i + dir + product.images.length) % product.images.length);
  };

  const sizeOptions =
    sizeOptionsByCategory[product.category] || ["One size", "Gift Ready"];
  const detailSpecs = [
    {
      label: "Material",
      value: materialByCategory[product.category] || "Premium finish",
    },
    {
      label: "Care",
      value: careByCategory[product.category] || "Easy-care handling",
    },
    {
      label: "Fit / Format",
      value: fitByCategory[product.category] || "Everyday-friendly design",
    },
    {
      label: "Best For",
      value: useByCategory[product.category] || "Gifting and everyday fun",
    },
  ];

  return (
    <div className="catalogue-listing catalogue-listing--compact-top">
      <nav className="catalogue-listing__crumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to="/shop">Shop</Link>
        {category ? (
          <>
            <span>/</span>
            <Link to={`/shop?categories=${category.slug}`}>{category.title}</Link>
          </>
        ) : null}
        <span>/</span>
        <span>{product.title}</span>
      </nav>

      <div className="catalogue-listing__inner">
        <div className="catalogue-main catalogue-product-layout">
          <div>
            <div className="catalogue-product-media">
              <button
                type="button"
                className="catalogue-simple-card__media catalogue-zoomable"
                onClick={() => setLightboxOpen(true)}
                aria-label="Zoom image"
                style={{
                  border: 0,
                  padding: 0,
                  width: "100%",
                  maxWidth: "100%",
                  cursor: "zoom-in",
                  display: "block",
                  textAlign: "left",
                }}
              >
                <img
                  src={image}
                  alt={product.title}
                  loading="eager"
                  decoding="async"
                />
              </button>
              {product.badges?.[0] ? (
                <p className="catalogue-product-media__badge">
                  {product.badges[0]}
                </p>
              ) : null}
            </div>
            {canBrowse ? (
              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  flexWrap: "wrap",
                  marginTop: "1rem",
                }}
              >
                {product.images.map((src, i) => (
                  <button
                    key={`${product.id}-thumb-${i}`}
                    type="button"
                    className="catalogue-lightbox__thumb"
                    onClick={() => setActive(i)}
                    aria-label={`Image ${i + 1}`}
                    style={{
                      borderColor: i === active ? "#0a6ead" : "#eaeaec",
                      width: 72,
                      height: 72,
                    }}
                  >
                    <img src={src} alt="" loading="lazy" decoding="async" />
                  </button>
                ))}
              </div>
            ) : null}
            <p
              style={{
                margin: "1rem 0 0",
                fontSize: "0.8rem",
                color: "#94969f",
              }}
            >
              Tap the main image to zoom in.
            </p>
          </div>

          <div>
            <div className="catalogue-product-details">
              <p className="catalogue-product-details__brand">
                {product.brand || "Axolittles"}
              </p>
              <h1 className="catalogue-product-details__title">
                {product.title}
              </h1>
              <p className="catalogue-product-details__subtitle">
                {product.description}
              </p>

              {category ? (
                <p className="catalogue-product-details__category">
                  Category:{" "}
                  <Link to={`/shop?categories=${category.slug}`}>{category.title}</Link>
                </p>
              ) : null}

              <section className="catalogue-product-details__section">
                <div className="catalogue-product-details__section-head">
                  <h2>Select Size / Option</h2>
                  <span>Best match</span>
                </div>
                <div className="catalogue-product-details__sizes">
                  {sizeOptions.map((option, index) => (
                    <button
                      key={option}
                      type="button"
                      className={`catalogue-product-details__size ${index === 0 ? "is-active" : ""}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </section>

              <div className="catalogue-product-details__cta-row">
                <button
                  type="button"
                  className="shop-button shop-button--primary catalogue-product-details__cta"
                >
                  Coming soon
                </button>
              </div>

              <section className="catalogue-product-details__section">
                <h2>Product Details</h2>
                <p className="catalogue-product-details__copy">
                  {product.description} Designed to feel playful, giftable, and
                  easy to love in the AXOLITTLES world.
                </p>
              </section>

              <section className="catalogue-product-details__section">
                <h2>Material &amp; Care</h2>
                <div className="catalogue-product-details__spec-grid">
                  {detailSpecs.map((spec) => (
                    <div key={spec.label} className="catalogue-product-details__spec">
                      <span>{spec.label}</span>
                      <strong>{spec.value}</strong>
                    </div>
                  ))}
                </div>
              </section>

              <div className="catalogue-product-details__footer">
                <p>Product Code: {product.id}</p>
                <p>Seller: Axolittles Studio</p>
                <Link to="/shop">Continue shopping</Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {lightboxOpen ? (
        <div
          className="catalogue-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${product.title} enlarged`}
          onClick={() => setLightboxOpen(false)}
        >
          <div
            className="catalogue-lightbox__dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="catalogue-lightbox__close"
              onClick={() => setLightboxOpen(false)}
              aria-label="Close"
            >
              <i className="fa fa-close fa-xs" aria-hidden="true" />
            </button>
            <div className="catalogue-lightbox__header">
              <p>{category?.title || "Product"}</p>
              <h3>{product.title}</h3>
            </div>
            <div className="catalogue-lightbox__media">
              <div
                className="catalogue-lightbox__backdrop"
                style={{ backgroundImage: `url(${image})` }}
                aria-hidden="true"
              />
              {canBrowse ? (
                <button
                  type="button"
                  className="catalogue-lightbox__nav catalogue-lightbox__nav--prev"
                  onClick={() => changeSlide(-1)}
                  aria-label="Previous"
                >
                  <i className="fa fa-angle-left fa-xs" />
                </button>
              ) : null}
              <img src={image} alt={product.title} />
              {canBrowse ? (
                <button
                  type="button"
                  className="catalogue-lightbox__nav catalogue-lightbox__nav--next"
                  onClick={() => changeSlide(1)}
                  aria-label="Next"
                >
                  <i className="fa fa-angle-right fa-xs" />
                </button>
              ) : null}
            </div>
            {canBrowse ? (
              <div className="catalogue-lightbox__thumbs">
                {product.images.map((src, i) => (
                  <button
                    key={`${product.id}-lb-${i}`}
                    type="button"
                    className={`catalogue-lightbox__thumb ${i === active ? "is-active" : ""}`}
                    onClick={() => setActive(i)}
                    aria-label={`Thumbnail ${i + 1}`}
                  >
                    <img src={src} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ProductPage;
