import "./Section2.css";
import TypingHeading from "../TypingHeading/TypingHeading";

const categoryCards = [
  {
    title: "Plush Toys",
    slug: "plush-toys",
    image:
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776150967/A_premium_toy_product_shot_of_baby_axo_plush_an_ad_delpmaspu_yrtpwl_bil3ex.jpg",
    accent: "peach",
  },
  {
    title: "Story Books",
    slug: "story-books",
    image:
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776151940/Design_a_premium_202603191152_nbwdax_wzyxzh_yhu11x.jpg",
    accent: "lavender",
  },
  {
    title: "Water Toys",
    slug: "water-toys",
    image:
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776151028/Use_the_provided_202603191136_nar3y8_bsg92k.webp",
    accent: "mint",
  },
  {
    title: "School Essentials",
    slug: "school-essentials",
    image:
      "https://res.cloudinary.com/dndqntxob/image/upload/q_auto/f_auto/v1776153715/A_premium_pencil_202603181849_eanouz_g4j1ca.webp",
    accent: "sky",
  },
];

const Section2 = ({ onNavigate }) => {
  const handleCategoryClick = (event, slug) => {
    if (!onNavigate) {
      return;
    }

    event.preventDefault();
    onNavigate(`/shop?categories=${slug}`);
  };

  return (
    <section className="shop-categories" id="shop-categories">
      <div
        className="shop-categories__cloud shop-categories__cloud--top"
        aria-hidden="true"
      />
      <div className="container">
        <div className="shop-categories__intro" data-reveal>
          <p className="shop-eyebrow shop-eyebrow--dark">Shop by collection</p>
          <TypingHeading
            as="h2"
            text="Shop By Categories"
            className="shop-section-title shop-categories__title"
          />
          <p className="shop-categories__text">
            Step into the playful world of AXOLITTLES and discover cheerful
            collections made for cuddles, playtime, learning, bedtime, and
            little everyday adventures.
          </p>
        </div>

        <div className="shop-categories__grid">
          {categoryCards.map((category, index) => (
            <a
              key={category.title}
              href={`/shop?categories=${category.slug}`}
              className="shop-categories__card"
              onClick={(event) => handleCategoryClick(event, category.slug)}
              data-reveal
              style={{ transitionDelay: `${index * 90}ms` }}
            >
              <div
                className={`shop-categories__image-wrap shop-categories__image-wrap--${category.accent}`}
              >
                <div className="shop-categories__orbit" aria-hidden="true" />
                <img
                  src={category.image}
                  alt={category.title}
                  className="shop-categories__image"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <h3>{category.title}</h3>
            </a>
          ))}
        </div>
      </div>
      <div
        className="shop-categories__cloud shop-categories__cloud--bottom"
        aria-hidden="true"
      />
    </section>
  );
};

export default Section2;
