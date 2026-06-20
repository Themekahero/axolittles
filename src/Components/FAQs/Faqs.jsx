import { useMemo, useRef, useState } from "react";
import "./Faqs.css";
import TypingHeading from "../TypingHeading/TypingHeading";
import useMouseParallax from "../../hooks/useMouseParallax";

const faqItems = [
  {
    category: "Universe",
    question: "What is Axolittles?",
    answer:
      "AXOLITTLES is a playful kids universe built around toys, clothing, storybooks, games, songs, videos, and fun everyday products.",
  },
  {
    category: "Products",
    question: "What kind of products will AXOLITTLES offer?",
    answer:
      "AXOLITTLES will offer plush toys, story books, water toys, school essentials, kids clothing, hoodies, and accessories.",
  },
  {
    category: "Media",
    question: "Will AXOLITTLES have games and videos too?",
    answer:
      "Yes. AXOLITTLES is not limited to physical products. It also includes games, songs, audio content, and kid-friendly videos.",
  },
  {
    category: "Launches",
    question: "Are some products marked as coming soon?",
    answer:
      "Yes. Some collections may be announced before launch and shown as coming soon until they are available.",
  },
  {
    category: "Updates",
    question: "How can I stay updated on new AXOLITTLES launches?",
    answer: "You can follow AXOLITTLES on Instagram and Twitter for updates.",
  },
];

const faqHighlights = [
  { value: "5", label: "quick answers" },
  { value: "4", label: "core topics" },
  { value: "1", label: "playful universe" },
];

const Faqs = ({ onNavigate, mode = "page" }) => {
  const [openIndex, setOpenIndex] = useState(0);
  const isPageMode = mode === "page";
  const faqRef = useRef(null);
  const loreRef = useRef(null);

  useMouseParallax(faqRef, { strength: 24, easing: 0.12 });
  useMouseParallax(loreRef, { strength: 22, easing: 0.12 });
  const categories = useMemo(() => {
    const counts = new Map();

    faqItems.forEach(({ category }) => {
      counts.set(category, (counts.get(category) || 0) + 1);
    });

    return [...counts.entries()];
  }, []);

  const handleNavigate = (event, path) => {
    if (!onNavigate) {
      return;
    }

    event.preventDefault();
    onNavigate(path);
  };

  const toggleItem = (index) => {
    setOpenIndex((currentIndex) => (currentIndex === index ? -1 : index));
  };

  return (
    <section
      className={`faqs-page ${isPageMode ? "faqs-page--page" : "faqs-page--section"}`}
      id={isPageMode ? "faqs-page" : "faq"}
    >
      <div className="container faqs-page__shell">
        {/* <header className="faqs-page__hero" data-reveal>
          <div className="faqs-page__hero-copy">
            <p className="faqs-page__eyebrow">Faqs</p>
            <TypingHeading
              as={isPageMode ? "h1" : "h2"}
              text="Frequently Asked Questions"
              className="faqs-page__title"
            />
            <p className="faqs-page__lead">
              Everything families, shoppers, and curious visitors usually want
              to know about the AXOLITTLES world, all in one brighter and easier
              place.
            </p>
          </div>
        </header> */}
        <section className="faq parallax-surface" id="faq" ref={faqRef}>
          <div className="container">
            <div data-parallax-depth style={{ "--depth": 7 }}>
              <TypingHeading text="Frequently Asked Questions" />
            </div>
            <div
              className="accordion"
              id="faqAccordion"
              data-parallax-depth
              style={{ "--depth": 5 }}
            >
              {faqItems.map((item, index) => {
                const isOpen = openIndex === index;
                const collapseId = `faqCollapse${index}`;
                const headingId = `faqHeading${index}`;

                return (
                  <div
                    className="accordion-item"
                    key={item.question}
                    data-parallax-depth
                    style={{ "--depth": 8 + index }}
                  >
                    <h2 className="accordion-header" id={headingId}>
                      <button
                        className={`accordion-button ${isOpen ? "" : "collapsed"}`}
                        type="button"
                        onClick={() => toggleItem(index)}
                        aria-expanded={isOpen}
                        aria-controls={collapseId}
                      >
                        {item.question}
                      </button>
                    </h2>
                    <div
                      id={collapseId}
                      className={`accordion-collapse collapse ${isOpen ? "show" : ""}`}
                      aria-labelledby={headingId}
                    >
                      <div className="accordion-body">{item.answer}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
        <div className="faqs-page__background" aria-hidden="true">
          <span className="faqs-page__orb faqs-page__orb--mint" />
          <span className="faqs-page__orb faqs-page__orb--sea" />
        </div>
      </div>
    </section>
  );
};

export default Faqs;
