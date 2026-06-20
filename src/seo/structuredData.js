import {
  absoluteUrl,
  defaultImage,
  seoCollections,
  siteName,
  siteUrl,
  socialAccountUrls,
} from "./seoConfig";
import { getCategoryBySlug, getProductBySlug } from "../catalogue/catalogueData";

const compact = (value) => JSON.parse(JSON.stringify(value));

const organizationSchema = {
  "@type": "Organization",
  "@id": `${siteUrl}/#organization`,
  name: siteName,
  url: siteUrl,
  logo: defaultImage,
  sameAs: socialAccountUrls,
};

const websiteSchema = {
  "@type": "WebSite",
  "@id": `${siteUrl}/#website`,
  url: siteUrl,
  name: siteName,
  publisher: { "@id": `${siteUrl}/#organization` },
  potentialAction: {
    "@type": "SearchAction",
    target: `${siteUrl}/search?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

const breadcrumbSchema = (items) => ({
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: absoluteUrl(item.path),
  })),
});

const itemListSchema = (items, listName) => ({
  "@type": "ItemList",
  name: listName,
  itemListElement: items.slice(0, 24).map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    url: absoluteUrl(`/product/${item.slug}`),
    name: item.title,
  })),
});

const productSchema = (product, category) => ({
  "@type": "Product",
  "@id": `${absoluteUrl(`/product/${product.slug}`)}#product`,
  name: product.title,
  description: product.description,
  image: product.images,
  sku: product.id,
  brand: {
    "@type": "Brand",
    name: product.brand || siteName,
  },
  category: category?.title,
});

const faqSchema = {
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is Axolittles?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "AXOLITTLES is a playful kids universe built around toys, clothing, storybooks, games, songs, videos, and everyday products.",
      },
    },
    {
      "@type": "Question",
      name: "What kind of products will AXOLITTLES offer?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "AXOLITTLES will offer plush toys, story books, water toys, school essentials, kids clothing, hoodies, and accessories.",
      },
    },
    {
      "@type": "Question",
      name: "Will AXOLITTLES have games and videos too?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. AXOLITTLES includes games, songs, audio content, and kid-friendly videos alongside physical products.",
      },
    },
  ],
};

export const buildStructuredData = (location, seo) => {
  const path = seo.canonicalPath;
  const parts = path.split("/").filter(Boolean);
  const graph = [organizationSchema, websiteSchema];

  const breadcrumbs = [{ name: "Home", path: "/" }];

  if (path !== "/") {
    // NOTE: Product / ItemList schema is intentionally NOT emitted while the
    // shop is pre-launch (every product is price 0 / "coming soon"). Emitting
    // it would tell search engines this is an active store. Re-enable once
    // real inventory + prices exist. Breadcrumbs (navigational) are kept.
    if (parts[0] === "product") {
      const product = getProductBySlug(parts[1]);
      const category = product ? getCategoryBySlug(product.category) : null;
      breadcrumbs.push({ name: "Shop", path: "/shop" });
      if (category) breadcrumbs.push({ name: category.title, path: `/category/${category.slug}` });
      if (product) breadcrumbs.push({ name: product.title, path });
    } else if (parts[0] === "category") {
      const category = getCategoryBySlug(parts[1]);
      breadcrumbs.push({ name: "Shop", path: "/shop" });
      if (category) breadcrumbs.push({ name: category.title, path });
    } else {
      breadcrumbs.push({
        name: seo.title.replace(` | ${siteName}`, ""),
        path,
      });
    }
  }

  if (path === "/faqs") {
    graph.push(faqSchema);
  }

  graph.push(breadcrumbSchema(breadcrumbs));

  return compact({
    "@context": "https://schema.org",
    "@graph": graph,
  });
};
