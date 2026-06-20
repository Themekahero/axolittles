import TypingHeading from "../Components/TypingHeading/TypingHeading";
import "../Components/ShopPage/ShopPage.css";

const AboutPage = () => {
  return (
    <div className="container-fluid pb-5">
      <section className="shop-sections" style={{ paddingTop: "7.2rem" }}>
        <div className="shop-sections__intro">
          <p className="shop-eyebrow shop-eyebrow--dark">AXOLITTLES</p>
          <TypingHeading as="h2" text="About" className="shop-section-title" />
          <p className="shop-sections__lede shop-sections__lede-new">
            AXOLITTLES is a joyful, design-first world built around characters,
            stories, and thoughtfully crafted products that bring everyday
            moments to life. It’s not just a merch store—it’s a universe where
            play, imagination, and comfort come together in a way that feels
            premium, warm, and consistent from the very first interaction.
            <br />
            At its core, AXOLITTLES is about creating happiness you can see, feel,
            and hold. Every product—whether it’s a hoodie, plushie, storybook,
            or school essential—is designed to carry the same cheerful energy
            and visual identity. Clean shapes, soft colors, expressive
            characters, and high-quality materials all work together to create a
            brand that feels both playful and elevated, never loud or cluttered.
            <br />
            The world of AXOLITTLES is built on characters that feel alive. Each one
            has its own personality, story, and emotional connection, making
            them more than just visuals on a product. They become companions in
            a child’s daily life—on their clothes, in their rooms, in their
            routines, and in the stories they revisit again and again.
            <br />
            Every category within AXOLITTLES is designed with intention. Apparel is
            soft, comfortable, and expressive. Toys and plushies are crafted to
            feel huggable and long-lasting. Books and stationery are made to
            inspire curiosity and creativity. Even everyday essentials like
            bottles, bags, and kits are treated as extensions of the brand’s
            storytelling—turning ordinary items into something meaningful and
            delightful.
            <br />
            AXOLITTLES also stands for consistency. From packaging to product design
            to digital experience, everything follows a unified visual
            language—rounded, friendly, clean, and premium. This ensures that no
            matter where someone interacts with the brand, it always feels like
            the same world.
            <br />
            Beyond products, AXOLITTLES is about building a feeling—a space where
            families and kids can experience joy without overcomplication. It’s
            designed to be approachable yet aspirational, simple yet
            thoughtfully detailed, playful yet refined.
            <br />
            In a world full of fast, disposable products, AXOLITTLES focuses on
            creating pieces that feel special, memorable, and worth keeping.
            It’s a brand that grows with its audience, becoming part of their
            everyday lives while always staying rooted in what matters most:
            joy, imagination, and connection.
          </p>
        </div>

        {/* <div
          className="empty-state tone-pearl"
          style={{
            width: "min(980px, calc(100% - 2rem))",
            margin: "0 auto",
          }}
        >
          <h2>Designed to feel joyful</h2>
          <p>
            AXOLITTLES is where characters turn into everyday companions. Every
            product is designed to carry the same warmth, color, and personality
            you see on screen—into real life. From soft plushies to playful
            school gear, everything is built to feel joyful, safe, and full of
            character.
          </p>
        </div> */}

        {/* <section
          id="axoninja-game"
          className="shop-story-bridge pt-5"
          data-reveal
          style={{
            width: "min(1180px, calc(100% - 2rem))",
            margin: "2rem auto 0",
          }}
        >
          <div className="shop-story-bridge__panel">
            <div className="shop-story-bridge__layout">
              <div className="shop-story-bridge__copy">
                <p className="shop-story-bridge__kicker">AXOLITTLES World</p>
                <h3>
                  Merch gives the world a home. Story and sound give it a pulse.
                </h3>
                <p>
                  AXOLITTLES is designed to feel bigger than a storefront. The shop
                  is still the main destination, but behind every drop sits a
                  wider universe of characters, playful adventures, music,
                  motion, and story-led moments that make the collection feel
                  alive.
                </p>
                <p>
                  Step into AxoNinja to explore the game world, or open
                  AxoStudio to watch the visual and audio side of the brand
                  unfold.
                </p>
                <div className="shop-story-bridge__footer">
                  <a href="/shop" className="shop-button shop-button--primary">
                    Continue shopping
                  </a>
                </div>
              </div>

              <div className="shop-story-bridge__grid">
                <article className="shop-story-bridge__card shop-story-bridge__card--ninja">
                  <video
                    className="shop-story-bridge__media"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    aria-label="AxoNinja game preview"
                  >
                    <source
                      src="https://res.cloudinary.com/dbtsrjssc/video/upload/v1774618283/Axoquest-Trim-Trim-ezgif.com-gif-maker_1_qo1rew.mp4"
                      type="video/mp4"
                    />
                  </video>
                  <div
                    className="shop-story-bridge__scrim"
                    aria-hidden="true"
                  />
                  <div className="shop-story-bridge__card-content">
                    <span className="shop-story-bridge__tag">AXONINJA</span>
                    <p className="shop-story-bridge__eyebrow">Game world</p>
                    <h4>Play through the AXOLITTLES universe.</h4>
                    <p>
                      Discover the characters, the motion, and the energy behind
                      the world that inspires the merch.
                    </p>
                    <a
                      href="/adventure"
                      className="shop-button shop-button--ghost shop-axo-ninja-button"
                    >
                      Play Axo Adventure
                    </a>
                  </div>
                </article>

                <article className="shop-story-bridge__card shop-story-bridge__card--studio">
                  <video
                    className="shop-story-bridge__media"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    aria-label="AxoStudio preview"
                  >
                    <source
                      src="https://res.cloudinary.com/dbtsrjssc/video/upload/v1774617384/WhatsAppVideo2026-03-27at1.08.52PM-ezgif.com-gif-maker_vbzem3.mp4"
                      type="video/mp4"
                    />
                  </video>
                  <div
                    className="shop-story-bridge__scrim"
                    aria-hidden="true"
                  />
                  <div className="shop-story-bridge__card-content">
                    <span className="shop-story-bridge__tag">AXO STUDIO</span>
                    <p className="shop-story-bridge__eyebrow">
                      Audio and video
                    </p>
                    <h4>See the motion side of the brand.</h4>
                    <p>
                      Open the studio to explore music, videos, visuals, and
                      creative drops that expand the AXOLITTLES vibe.
                    </p>
                    <a
                      href="/rhymes"
                      className="shop-button shop-button--ghost"
                    >
                      Watch Axo Rhymes
                    </a>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </section> */}
      </section>
    </div>
  );
};

export default AboutPage;
