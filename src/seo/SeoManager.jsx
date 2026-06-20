import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { buildStructuredData } from "./structuredData";
import { getSeoForLocation } from "./seoConfig";

const managedAttribute = "data-axo-seo";

const upsertMeta = (selector, attributes) => {
  let element = document.head.querySelector(selector);

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(managedAttribute, "true");
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    if (value) element.setAttribute(key, value);
  });
};

const upsertLink = (rel, href) => {
  let element = document.head.querySelector(`link[rel="${rel}"]`);

  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    element.setAttribute(managedAttribute, "true");
    document.head.appendChild(element);
  }

  element.setAttribute("href", href);
};

const upsertJsonLd = (data) => {
  let element = document.head.querySelector(
    `script[type="application/ld+json"][${managedAttribute}]`,
  );

  if (!element) {
    element = document.createElement("script");
    element.setAttribute("type", "application/ld+json");
    element.setAttribute(managedAttribute, "true");
    document.head.appendChild(element);
  }

  element.textContent = JSON.stringify(data);
};

const SeoManager = () => {
  const location = useLocation();

  useEffect(() => {
    let isActive = true;

    const applySeo = (seo) => {
      if (!isActive) {
        return;
      }

    const structuredData = buildStructuredData(location, seo);
    const keywords = seo.keywords?.length ? seo.keywords.join(", ") : "";

    document.documentElement.setAttribute("lang", "en");
    document.title = seo.title;

    upsertMeta('meta[name="description"]', {
      name: "description",
      content: seo.description,
    });
    upsertMeta('meta[name="robots"]', {
      name: "robots",
      content: seo.robots,
    });

    upsertMeta('meta[name="keywords"]', {
      name: "keywords",
      content: keywords,
    });

    upsertMeta('meta[property="og:site_name"]', {
      property: "og:site_name",
      content: seo.siteName,
    });
    upsertMeta('meta[property="og:type"]', {
      property: "og:type",
      content: seo.type || "website",
    });
    upsertMeta('meta[property="og:title"]', {
      property: "og:title",
      content: seo.title,
    });
    upsertMeta('meta[property="og:description"]', {
      property: "og:description",
      content: seo.description,
    });
    upsertMeta('meta[property="og:url"]', {
      property: "og:url",
      content: seo.canonicalUrl,
    });
    upsertMeta('meta[property="og:image"]', {
      property: "og:image",
      content: seo.image,
    });
    upsertMeta('meta[name="twitter:card"]', {
      name: "twitter:card",
      content: "summary_large_image",
    });
    upsertMeta('meta[name="twitter:title"]', {
      name: "twitter:title",
      content: seo.title,
    });
    upsertMeta('meta[name="twitter:description"]', {
      name: "twitter:description",
      content: seo.description,
    });
    upsertMeta('meta[name="twitter:image"]', {
      name: "twitter:image",
      content: seo.image,
    });

    upsertLink("canonical", seo.canonicalUrl);
    upsertJsonLd(structuredData);
    };

    const initialSeo = getSeoForLocation(location);
    applySeo(initialSeo);

    return () => {
      isActive = false;
    };
  }, [location]);

  return null;
};

export default SeoManager;
