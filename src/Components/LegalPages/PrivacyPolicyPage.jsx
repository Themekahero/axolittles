import LegalPageLayout from "./LegalPageLayout";

const privacySections = [
  {
    id: "information-we-collect",
    title: "Information We Collect",
    content: (
      <>
        <p>
          We may collect basic information that helps us operate the Axolittles
          website, shop pages, and related digital experiences. This may include
          browser type, device information, IP address, referral source, and
          usage data such as the pages you visit, links you click, and time
          spent on the site.
        </p>
        <p>
          If you contact us, sign up for updates, submit a form, or connect with
          us through a third-party platform, we may also receive the information
          you choose to share, such as your name, email address, message
          content, or account details connected to that platform.
        </p>
      </>
    ),
  },
  {
    id: "how-we-use-information",
    title: "How We Use Information",
    content: (
      <>
        <p>
          We use collected information to keep Axolittles useful, safe, and easy to
          improve.
        </p>
        <ul>
          <li>
            Operate, maintain, and improve the website and shop experience
          </li>
          <li>
            Understand which products, categories, and content are most useful
          </li>
          <li>Monitor performance, troubleshoot issues, and prevent misuse</li>
          <li>Respond to inquiries, support requests, or other messages</li>
          <li>
            Share updates about collections, launches, or site improvements
            where permitted
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "cookies-and-analytics",
    title: "Cookies and Analytics",
    content: (
      <>
        <p>
          We may use cookies, analytics tools, and similar technologies to
          understand how visitors use the site. These tools help us improve
          navigation, measure interest in products and content, and make the
          overall experience more useful.
        </p>
        <p>
          You can control cookies through your browser settings. Disabling some
          cookies may affect how certain parts of the website function.
        </p>
      </>
    ),
  },
  {
    id: "sharing-of-information",
    title: "Sharing of Information",
    content: (
      <>
        <p>
          We do not sell your personal information. We may share limited
          information with trusted service providers who help us host the
          website, support store functionality, process communications, analyze
          site performance, or assist with operations.
        </p>
        <p>
          We may also disclose information when required by law or when
          reasonably necessary to protect our rights, users, website security,
          or business operations.
        </p>
      </>
    ),
  },
  {
    id: "childrens-privacy",
    title: "Children’s Privacy",
    content: (
      <>
        <p>
          Axolittles is designed as a family-friendly brand. We encourage parents
          and guardians to supervise children’s online activity. We do not
          knowingly collect personal information from children except where
          permitted by applicable law and with appropriate safeguards.
        </p>
        <p>
          If you believe a child has provided personal information to us in a
          way that should not have happened, please contact us so we can review
          and take appropriate action.
        </p>
      </>
    ),
  },
  {
    id: "your-choices",
    title: "Your Choices",
    content: (
      <>
        <p>
          You can choose how much information you share with us, manage cookies
          through your browser settings, and decide whether to interact with
          optional features such as forms, newsletters, or external platforms.
          If you need help with a privacy-related request, you can contact us
          through our official support or contact channels.
        </p>
      </>
    ),
  },
  {
    id: "updates",
    title: "Updates to This Policy",
    content: (
      <>
        <p>
          We may update this Privacy Policy from time to time as Axolittles grows
          and our website, shop, or services evolve. When we make changes, we
          will update the date shown on this page so visitors can see the latest
          version.
        </p>
      </>
    ),
  },
];

const PrivacyPolicyPage = ({ onNavigate }) => {
  return (
    <LegalPageLayout
      onNavigate={onNavigate}
      eyebrow="AXOLITTLES legal"
      title="Privacy Policy"
      summary="This Privacy Policy explains how Axolittles may collect, use, and protect information when you browse our website, explore our shop pages, sign up for updates, or interact with our digital experiences."
      updatedAt="March 27, 2026"
      sections={privacySections}
    />
  );
};

export default PrivacyPolicyPage;
