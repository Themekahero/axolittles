import {
  catalogueCategories,
  catalogueProducts,
  getCategoryBySlug,
  getProductBySlug,
} from "../catalogue/catalogueData";
import {
  blogPageContent,
  collectionPageContent,
  navGroups,
  shopShellPages,
} from "../storefront/navigationData";

export const siteName = "Axolittles";
export const siteUrl =
  import.meta.env.VITE_SITE_URL?.replace(/\/$/, "") || "https://axolittles.io";
export const socialAccountUrls = ["https://x.com/Axolittles"];
export const defaultImage = `${siteUrl}/og-image.png`;

const defaultDescription =
  "Explore AXOLITTLES's playful world of kids merch, plush toys, story books, games, videos, and character-led collectibles.";

const staticPages = {
  "/": {
    title: "AXOLITTLES | Kids Merch, Toys, Stories and Play",
    description: defaultDescription,
    keywords: [
      "AXOLITTLES",
      "Axo merch",
      "kids toys",
      "plush toys",
      "story books",
      "kidswear",
    ],
  },
  "/shop": {
    title: "Shop AXOLITTLES Merch | Toys, Kidswear, Books and Accessories",
    description:
      "Browse AXOLITTLES products including kidswear, plush toys, story books, water toys, school essentials, accessories, baby essentials, and room decor.",
    keywords: ["AXOLITTLES shop", "kids merch", "Axo toys", "Axo hoodies"],
  },
  "/about": {
    title: "About AXOLITTLES | The Axo Universe",
    description:
      "Learn how AXOLITTLES connects character merch, games, stories, videos, and a playful family-friendly universe.",
  },
  "/learn": {
    title: "Learn & Play with Axo | Axolittles",
    description:
      "Eleven playful learning worlds for ages 2-5 — letters, numbers, colors, animals, shapes and more, with friendly voice guides, stars, and stickers.",
    keywords: ["kids learning", "preschool ABC", "learn numbers", "Axolittles learn"],
  },
  "/games": {
    title: "Axo Games | 12 Tiny Games for Little Ones",
    description:
      "Twelve gentle tap-and-play games — balloon pop, animal match, memory pairs, counting, coloring and more — made for tiny hands.",
    keywords: ["kids games", "toddler games", "Axo games"],
  },
  "/adventure": {
    title: "Axo Adventure | Ninja Run Platformer",
    description:
      "Join Axo on a four-world ninja run adventure — jump, dash, collect coins and beat the bosses across Coral Cove, Blue Depths, Ice Peak and Shadow Hollow.",
    keywords: ["Axo adventure", "ninja run game", "kids platformer"],
  },
  "/rhymes": {
    title: "Axo Rhymes | Sing-Along Songs & Videos",
    description:
      "Curated sing-along nursery rhymes and friendly learning videos starring Axo — songs, ABC & 123, and animal friends.",
    keywords: ["nursery rhymes", "kids songs", "Axo rhymes"],
  },
  "/parents": {
    title: "Parents Control | Axolittles",
    description:
      "A grown-up dashboard to track your child's learning progress, set daily goals and screen-time limits, choose teacher voices, and gate purchases.",
    robots: "noindex,follow",
  },
  "/axo-universe": {
    title: "Axo Universe | Games, Stories, Videos and Merch",
    description:
      "Step into the Axo Universe with character stories, games, YouTube-style content, and the wider AXOLITTLES merch world.",
  },
  "/axo-game": {
    title: "Axo Game | Play in the AXOLITTLES Universe",
    description:
      "Play the Axo game and explore a fun, character-led experience connected to the AXOLITTLES world.",
  },
  "/axo-studio": {
    title: "AXO Studio | Motion, Video and Story Worlds",
    description:
      "Explore AXO Studio, the cinematic creative space for AXOLITTLES videos, audio, ads, motion stories, and future media drops.",
    image:
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776165606/water1_l7pmui_yljwym.webp",
  },
  "/collections": {
    title: "AXOLITTLES Collections | Curated Merch Drops",
    description:
      navGroups.collections?.description ||
      "Explore curated AXOLITTLES merch collections for gifts, seasonal drops, classics, and budget-friendly picks.",
  },
  "/blog": {
    title: "AXOLITTLES Blog | Style Guides, Reviews and Behind the Scenes",
    description:
      navGroups.blog?.description ||
      "Read AXOLITTLES updates, styling inspiration, haul reviews, decor tips, and behind-the-scenes stories.",
  },
  "/contact": {
    title: "Contact AXOLITTLES | Support and Collaborations",
    description:
      "Contact AXOLITTLES for support, collaborations, product questions, and brand partnership conversations.",
  },
  "/faqs": {
    title: "AXOLITTLES FAQs | Products, Games and Launch Questions",
    description:
      "Find quick answers about AXOLITTLES products, plush toys, story books, games, videos, launches, and updates.",
  },
  "/shipping-returns": {
    title: "Shipping and Returns | AXOLITTLES Help",
    description:
      "Review AXOLITTLES shipping and returns information, delivery expectations, and support options.",
  },
  "/privacy-policy": {
    title: "Privacy Policy | AXOLITTLES",
    description:
      "Read the AXOLITTLES privacy policy for information about data, privacy, and customer trust.",
  },
  "/terms-of-service": {
    title: "Terms of Service | AXOLITTLES",
    description: "Read the AXOLITTLES terms of service for using the storefront.",
  },
  "/refund-policy": {
    title: "Refund Policy | AXOLITTLES",
    description:
      "Review the AXOLITTLES refund policy framework and customer support process.",
  },
  "/search": {
    title: "Search AXOLITTLES",
    description: "Search AXOLITTLES products, collections, stories, and pages.",
    robots: "noindex,follow",
  },
  "/track-order": {
    title: "Track Order | AXOLITTLES",
    description: "Track an AXOLITTLES order or find support for shipment updates.",
    robots: "noindex,follow",
  },
  "/wishlist": {
    title: "Wishlist | AXOLITTLES",
    description: "View saved AXOLITTLES favorites and continue shopping.",
    robots: "noindex,follow",
  },
  "/cart": {
    title: "Cart | AXOLITTLES",
    description: "Review AXOLITTLES cart items and continue shopping.",
    robots: "noindex,follow",
  },
};

const titleWithBrand = (title) =>
  title.toLowerCase().includes(siteName.toLowerCase())
    ? title
    : `${title} | ${siteName}`;

const cleanPath = (pathname) => {
  if (!pathname || pathname === "/") return "/";
  return pathname.replace(/\/+$/, "");
};

const truncate = (value, max = 155) => {
  if (!value || value.length <= max) return value;
  return `${value.slice(0, max - 1).trim()}...`;
};

export const absoluteUrl = (path = "/") => {
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${siteUrl}${normalized}`;
};

const buildBaseMeta = (path, overrides = {}) => {
  const title = overrides.title || staticPages[path]?.title || siteName;
  const description =
    overrides.description ||
    staticPages[path]?.description ||
    defaultDescription;

  return {
    type: "website",
    siteName,
    title: titleWithBrand(title),
    description: truncate(description),
    canonicalPath: path,
    canonicalUrl: absoluteUrl(path),
    image: overrides.image || staticPages[path]?.image || defaultImage,
    keywords: overrides.keywords || staticPages[path]?.keywords || [],
    robots: overrides.robots || staticPages[path]?.robots || "index,follow",
  };
};

export const getSeoForLocation = (location, blogPost = null) => {
  const path = cleanPath(location.pathname);
  const parts = path.split("/").filter(Boolean);

  if (path === "/shop" && location.search) {
    return buildBaseMeta("/shop", {
      robots: "noindex,follow",
    });
  }

  if (parts[0] === "product" && parts[1]) {
    const product = getProductBySlug(parts[1]);
    if (product) {
      const category = getCategoryBySlug(product.category);

      return buildBaseMeta(path, {
        type: "product",
        title: `${product.title} | AXOLITTLES ${category?.title || "Product"}`,
        description: `${product.description} View images, details, care notes, and category information for ${product.title}.`,
        image: product.images?.[0],
        keywords: [
          product.title,
          product.baseTitle,
          category?.title,
          ...(product.tags || []),
        ].filter(Boolean),
      });
    }
  }

  if (parts[0] === "category" && parts[1]) {
    const category = getCategoryBySlug(parts[1]);
    if (category) {
      return buildBaseMeta(path, {
        title: `${category.title} | AXOLITTLES Shop`,
        description: category.blurb,
        image: category.heroImage,
        keywords: [category.title, "AXOLITTLES category", "kids merch"],
      });
    }
  }

  if (parts[0] === "shop" && parts[1]) {
    const page = shopShellPages[parts[1]];
    if (page) {
      return buildBaseMeta(path, {
        title: `${page.title} | AXOLITTLES Shop`,
        description: page.summary,
      });
    }
  }

  if (parts[0] === "collections" && parts[1]) {
    const page = collectionPageContent[parts[1]];
    if (page) {
      return buildBaseMeta(path, {
        title: `${page.title} | AXOLITTLES Collection`,
        description: page.summary,
      });
    }
  }

  if (parts[0] === "blog" && parts[1]) {
    const post = blogPost?.slug === parts[1] ? blogPost : null;

    if (post) {
      return buildBaseMeta(path, {
        type: "article",
        title: `${post.title} | AXOLITTLES Blog`,
        description: post.excerpt,
        image: post.coverImage,
        robots: post.status === "draft" ? "noindex,nofollow" : "index,follow",
        keywords: [post.title, post.category, "AXOLITTLES blog"].filter(Boolean),
      });
    }

    const page = blogPageContent[parts[1]];
    if (page) {
      return buildBaseMeta(path, {
        type: "article",
        title: `${page.title} | AXOLITTLES Blog`,
        description: page.summary,
      });
    }
  }

  if (staticPages[path]) {
    return buildBaseMeta(path, staticPages[path]);
  }

  return buildBaseMeta(path, {
    title: "Page Not Found | AXOLITTLES",
    description:
      "This AXOLITTLES page could not be found. Return to the shop, collections, or the Axo Universe.",
    robots: "noindex,follow",
  });
};

export const seoCollections = {
  categories: catalogueCategories,
  products: catalogueProducts,
};
