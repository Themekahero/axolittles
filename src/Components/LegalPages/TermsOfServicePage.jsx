import LegalPageLayout from "./LegalPageLayout";

const termsSections = [
  {
    id: "acceptance-of-terms",
    title: "Acceptance of Terms",
    content: (
      <>
        <p>
          By accessing or using the Axolittles website, shop pages, or related
          digital experiences, you agree to these Terms of Service. If you do
          not agree, please do not use the site or any services made available
          through it.
        </p>
      </>
    ),
  },
  {
    id: "site-use",
    title: "Use of the Site",
    content: (
      <>
        <p>
          You agree to use the site only for lawful purposes and in a way that
          does not interfere with the experience of other visitors. You must not
          misuse the website, attempt unauthorized access, disrupt services, or
          use the site in a manner that could harm Axolittles, its users, or its
          operations.
        </p>
      </>
    ),
  },
  {
    id: "products-and-availability",
    title: "Products and Availability",
    content: (
      <>
        <p>
          Products, collections, content, and features shown on the Axolittles
          website may change over time. Some items may be marked as coming soon,
          limited release, or temporarily unavailable. We reserve the right to
          update, replace, suspend, or discontinue products, content, pricing,
          or availability at any time without prior notice.
        </p>
      </>
    ),
  },
  {
    id: "intellectual-property",
    title: "Intellectual Property",
    content: (
      <>
        <p>
          Unless otherwise stated, all Axolittles branding, characters, artwork,
          product designs, visuals, copy, videos, audio, games, and other site
          content are owned by or licensed to Axolittles. These materials may not
          be copied, republished, distributed, modified, or used commercially
          without prior written permission.
        </p>
      </>
    ),
  },
  {
    id: "third-party-links",
    title: "Third-Party Links and Platforms",
    content: (
      <>
        <p>
          The website may contain links to third-party websites, stores,
          platforms, social channels, payment providers, or external services.
          We are not responsible for the content, policies, availability, or
          practices of those third parties. Your use of external services is
          governed by their own terms and policies.
        </p>
      </>
    ),
  },
  {
    id: "family-friendly-use",
    title: "Family-Friendly Use",
    content: (
      <>
        <p>
          Axolittles is presented as a family-friendly brand. Parents and guardians
          are encouraged to supervise children’s use of online content,
          shopping-related activity, and interactions with any connected
          external platforms or services.
        </p>
      </>
    ),
  },
  {
    id: "disclaimers",
    title: "Disclaimers",
    content: (
      <>
        <p>
          The site and its content are provided on an &quot;as is&quot; and
          &quot;as available&quot; basis. We do not guarantee uninterrupted
          access, complete accuracy, continuous availability, or that every
          feature, product, or release will always remain available in its
          current form.
        </p>
      </>
    ),
  },
  {
    id: "limitation-of-liability",
    title: "Limitation of Liability",
    content: (
      <>
        <p>
          To the fullest extent permitted by law, Axolittles and its operators will
          not be liable for indirect, incidental, special, consequential, or
          similar damages arising from your use of the website, products,
          content, linked services, or reliance on materials made available
          through the site.
        </p>
      </>
    ),
  },
  {
    id: "changes-to-terms",
    title: "Changes to These Terms",
    content: (
      <>
        <p>
          We may revise these Terms of Service from time to time as Axolittles
          grows and evolves. Updated versions will be posted on this page with a
          revised effective date.
        </p>
      </>
    ),
  },
];

const TermsOfServicePage = ({ onNavigate }) => {
  return (
    <LegalPageLayout
      onNavigate={onNavigate}
      eyebrow="AXOLITTLES legal"
      title="Terms of Service"
      summary="These Terms of Service govern access to the Axolittles website, its content, shop pages, and related digital experiences. They are designed to keep the platform clear, safe, and respectful for all visitors."
      updatedAt="March 27, 2026"
      sections={termsSections}
    />
  );
};

export default TermsOfServicePage;
