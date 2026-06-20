import { useEffect } from "react";
import "./App.css";
import Navbar from "./Components/Navbar/Navbar";
import AudioControl from "./Components/AudioControl/AudioControl";
import Footer from "./Components/Footer/Footer";
import ErrorBoundary from "./Components/ErrorBoundary/ErrorBoundary";
import PrivacyPolicyPage from "./Components/LegalPages/PrivacyPolicyPage";
import TermsOfServicePage from "./Components/LegalPages/TermsOfServicePage";
import {
  BrowserRouter,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import HomePage from "./pages/HomePage";
import Faqs from "./Components/FAQs/Faqs";
import CataloguePage from "./pages/CataloguePage";
import CategoryPage from "./pages/CategoryPage";
import ProductPage from "./pages/ProductPage";
import SearchResultsPage from "./pages/SearchResultsPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import NotFoundPage from "./pages/NotFoundPage";
import SeoManager from "./seo/SeoManager";
import LearnPage from "./pages/LearnPage";
import GamesPage from "./pages/GamesPage";
import AdventurePage from "./pages/AdventurePage";
import RhymesPage from "./pages/RhymesPage";
import ParentsPage from "./pages/ParentsPage";
const scrollToHashTarget = (hash, behavior = "smooth") => {
  if (!hash) {
    return false;
  }

  const targetId = hash.replace(/^#/, "");
  const target = document.getElementById(targetId);

  if (!target) {
    return false;
  }

  target.scrollIntoView({ behavior, block: "start" });
  return true;
};

function RouteEffects() {
  const location = useLocation();

  useEffect(() => {
    const handleContextMenu = (event) => {
      event.preventDefault();
    };

    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);

  useEffect(() => {
    const revealItems = [...document.querySelectorAll("[data-reveal]")];
    if (revealItems.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -10% 0px" },
    );

    revealItems.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, [location.pathname, location.search, location.hash]);

  useEffect(() => {
    const { hash } = location;

    if (!hash) {
      return;
    }

    let retryTimeout;
    const frame = window.requestAnimationFrame(() => {
      if (scrollToHashTarget(hash, "smooth")) {
        return;
      }

      retryTimeout = window.setTimeout(() => {
        scrollToHashTarget(hash, "smooth");
      }, 180);
    });

    return () => {
      window.cancelAnimationFrame(frame);

      if (retryTimeout) {
        window.clearTimeout(retryTimeout);
      }
    };
  }, [location]);

  useEffect(() => {
    if (!location.hash) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [location.pathname, location.search]);

  return null;
}

// Routes that render their own full-screen experience (no global nav/footer).
const IMMERSIVE_PATHS = new Set([
  "/learn",
  "/games",
  "/adventure",
  "/rhymes",
  "/parents",
]);

function RoutedShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const isImmersive = IMMERSIVE_PATHS.has(location.pathname);

  const handleNavigate = (path) => {
    const [pathname, hashFragment] = String(path || "/").split("#");
    const nextPath = pathname || "/";
    const nextHash = hashFragment ? `#${hashFragment}` : "";
    navigate(`${nextPath}${nextHash}`);
  };

  return (
    <div className="site-shell site-shell--shop">
      <a className="skip-link" href="#main">Skip to content</a>
      {/* Polite announcer — audio.js mirrors every spoken line here for screen readers */}
      <div id="axo-live" className="sr-only" aria-live="polite" aria-atomic="true"></div>
      {!isImmersive ? <Navbar /> : null}
      {/* Global music toggle — on every page incl. games/learn (compact + raised there). */}
      <AudioControl raised={isImmersive} />
      <SeoManager />
      <RouteEffects />
      <main id="main">
      <Routes>
        <Route path="/" element={<HomePage onNavigate={handleNavigate} />} />
        <Route path="/learn" element={<LearnPage />} />
        <Route path="/games" element={<GamesPage />} />
        <Route path="/adventure" element={<AdventurePage />} />
        <Route path="/rhymes" element={<RhymesPage />} />
        <Route path="/parents" element={<ParentsPage />} />
        <Route path="/shop" element={<CataloguePage />} />
        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="/product/:slug" element={<ProductPage />} />
        <Route path="/search" element={<SearchResultsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/faqs" element={<Faqs />} />
        <Route
          path="/privacy-policy"
          element={<PrivacyPolicyPage onNavigate={handleNavigate} />}
        />
        <Route
          path="/terms-of-service"
          element={<TermsOfServicePage onNavigate={handleNavigate} />}
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </main>
      {!isImmersive ? <Footer onNavigate={handleNavigate} /> : null}
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <RoutedShell />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
