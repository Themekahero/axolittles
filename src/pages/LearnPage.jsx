// /learn and /rhymes — the immersive "Learn & Play" experience.
import { useNavigate } from "react-router-dom";
import LearnApp from "../learn/LearnApp";

export default function LearnPage({ initialScreen = "home" }) {
  const navigate = useNavigate();
  return <LearnApp onNavigate={(p) => navigate(p)} initialScreen={initialScreen} />;
}
