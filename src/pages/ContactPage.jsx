import { useState } from "react";
import TypingHeading from "../Components/TypingHeading/TypingHeading";

const ContactPage = () => {
  const [status, setStatus] = useState("idle");
  const details = [
    {
      label: "Email us",
      value: "support@axolittles.io",
      icon: "fa-regular fa-envelope",
    },
    {
      label: "Company",
      value: "Axolittles LLC ",
      icon: "fa-regular fa-paper-plane",
    },
    {
      label: "Based in",
      value: "Kirkland WA",
      icon: "fa fa-location-dot",
    },
    {
      label: "Response window",
      value: "Within 24-48 hours",
      icon: "fa-regular fa-clock",
    },
  ];

  const handleSubmit = (event) => {
    event.preventDefault();
    setStatus("sent");
  };

  return (
    <div className="container-fluid pb-5 contact-page">
      <section className="shop-sections" style={{ paddingTop: "7.2rem" }}>
        <div className="shop-sections__intro">
          <p className="shop-eyebrow shop-eyebrow--dark">Talk to us</p>
          <TypingHeading
            as="h2"
            text="Contact"
            className="shop-section-title"
          />
          <p className="shop-sections__lede">
            Questions about drops, sizing, or launches? Send a note and we’ll
            get back to you.
          </p>
        </div>

        <div className="contact-page__shell">
          <article className="contact-page__panel">
            <div className="contact-page__panel-copy">
              <span className="contact-page__kicker">Contact us</span>
              <h3>Let&apos;s bring your next drop to life.</h3>
              <p className="contact-page__panel-text">
                Questions about merch, collabs, sizing, launches, or custom
                requests? Drop us a message and our team will get back to you
                with the same polished AXOLITTLES energy.
              </p>

              <div className="contact-page__detail-list">
                {details.map((row) => (
                  <div key={row.label} className="contact-page__detail-row">
                    <span
                      className="contact-page__detail-icon"
                      aria-hidden="true"
                    >
                      <i className={row.icon} />
                    </span>
                    <div>
                      <strong>{row.label}</strong>
                      <span>{row.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="contact-page__form-card">
              <div className="contact-page__form-head">
                <div>
                  <p>We&apos;d love to hear from you</p>
                  <h4>Let&apos;s get in touch</h4>
                </div>
                <span className="contact-page__form-status">
                  {status === "sent" ? "Sent" : "Draft"}
                </span>
              </div>

              <form className="contact-page__form" onSubmit={handleSubmit}>
                <label className="contact-page__field">
                  <span>Full name</span>
                  <input name="name" placeholder="Your name" required />
                </label>

                <label className="contact-page__field">
                  <span>Company</span>
                  <input name="company" placeholder="Studio or brand" />
                </label>

                <label className="contact-page__field">
                  <span>Email</span>
                  <input
                    name="email"
                    type="email"
                    placeholder="you@company.com"
                    required
                  />
                </label>

                <label className="contact-page__field">
                  <span>Phone</span>
                  <input
                    name="phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                  />
                </label>

                <label className="contact-page__field contact-page__field--full">
                  <span>Subject</span>
                  <input
                    name="subject"
                    placeholder="How can we help?"
                    required
                  />
                </label>

                <label className="contact-page__field contact-page__field--full">
                  <span>Your message</span>
                  <textarea
                    name="message"
                    placeholder="Tell us a little about your project, question, or launch."
                    rows={6}
                    required
                  />
                </label>

                <button
                  type="submit"
                  className="shop-button shop-button--primary contact-page__submit"
                >
                  Send message
                </button>
              </form>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
