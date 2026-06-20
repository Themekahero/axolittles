import { useCallback, useEffect, useState } from "react";

const CATALOGUE_CAROUSEL_AUTO_MS = 4000;
import { Link } from "react-router-dom";
import { catalogueCategories } from "./catalogueData";

/**
 * Catalogue-only card: image, brand/category line, title, price — no cart/wishlist.
 * Add more fields later via `product` (e.g. product.brand, comparePrice).
 */
export function SimpleProductCard({ product }) {
  const [slideIndex, setSlideIndex] = useState(0);
  const catTitle =
    catalogueCategories.find((c) => c.slug === product.category)?.title ||
    "Axolittles";
  const brand = product.brand || "Axolittles";
  const badge = product.badges?.[0];
  const viewMode = product.viewMode || "grid";
  const images = (product.images || []).filter(Boolean);
  const hasCarousel = images.length > 1;
  const productUrl = `/product/${product.slug}`;

  const goSlide = useCallback(
    (direction) => {
      setSlideIndex((i) => (i + direction + images.length) % images.length);
    },
    [images.length],
  );

  useEffect(() => {
    if (!hasCarousel) {
      return undefined;
    }

    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return undefined;
    }

    let timerId;

    const tick = () => {
      setSlideIndex((i) => (i + 1) % images.length);
    };

    const start = () => {
      timerId = window.setInterval(tick, CATALOGUE_CAROUSEL_AUTO_MS);
    };

    const stop = () => {
      if (timerId != null) {
        window.clearInterval(timerId);
        timerId = null;
      }
    };

    const onVisibility = () => {
      stop();
      if (!document.hidden) {
        start();
      }
    };

    start();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [hasCarousel, images.length]);

  return (
    <div className={`catalogue-simple-card catalogue-simple-card--${viewMode}`}>
      <div className="catalogue-simple-card__media">
        {badge ? (
          <span className="catalogue-simple-card__badge">{badge}</span>
        ) : null}
        <div className="catalogue-simple-card__carousel-viewport">
          {hasCarousel ? (
            <div
              className="catalogue-simple-card__carousel-track"
              style={{
                transform: `translate3d(-${slideIndex * 100}%, 0, 0)`,
              }}
            >
              {images.map((src, imageIndex) => (
                <div
                  key={`${product.slug}-slide-${imageIndex}`}
                  className="catalogue-simple-card__carousel-slide"
                  aria-hidden={imageIndex !== slideIndex}
                >
                  <img
                    src={src}
                    alt={imageIndex === slideIndex ? product.title : ""}
                    loading={imageIndex === 0 ? "eager" : "lazy"}
                    decoding="async"
                    draggable={false}
                  />
                </div>
              ))}
            </div>
          ) : (
            <img
              className="catalogue-simple-card__carousel-single"
              src={images[0]}
              alt={product.title}
              loading="lazy"
              decoding="async"
            />
          )}
        </div>
        <Link
          to={productUrl}
          className="catalogue-simple-card__media-link"
          tabIndex={-1}
        />
        {hasCarousel ? (
          <>
            <button
              type="button"
              className="catalogue-simple-card__nav catalogue-simple-card__nav--prev"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                goSlide(-1);
              }}
              aria-label={`Previous image, ${product.title}`}
            >
              <i className="fa fa-angle-left fa-xs" aria-hidden />
            </button>
            <button
              type="button"
              className="catalogue-simple-card__nav catalogue-simple-card__nav--next"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                goSlide(1);
              }}
              aria-label={`Next image, ${product.title}`}
            >
              <i className="fa fa-angle-right fa-xs" aria-hidden />
            </button>
            <div className="catalogue-simple-card__dots" role="tablist">
              {images.map((_, imageIndex) => (
                <button
                  key={`${product.slug}-dot-${imageIndex}`}
                  type="button"
                  role="tab"
                  aria-selected={imageIndex === slideIndex}
                  className={`catalogue-simple-card__dot ${
                    imageIndex === slideIndex ? "is-active" : ""
                  }`}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setSlideIndex(imageIndex);
                  }}
                  aria-label={`${product.title} image ${imageIndex + 1} of ${images.length}`}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
      <Link to={productUrl} className="catalogue-simple-card__body">
        <p className="catalogue-simple-card__brand">{brand}</p>
        <h3 className="catalogue-simple-card__title">{product.title}</h3>
        <p className="catalogue-simple-card__category">{catTitle}</p>
        {viewMode === "list" ? (
          <p className="catalogue-simple-card__description">
            {product.description}
          </p>
        ) : null}
        {/* <p className="catalogue-simple-card__price">{formatPrice(product.price)}</p> */}
      </Link>
    </div>
  );
}
