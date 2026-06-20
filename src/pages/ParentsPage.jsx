// /parents — Parents Control dashboard (parental gate + progress + settings).
import { useNavigate } from "react-router-dom";
import ParentsDashboard from "../learn/screens/ParentsDashboard";

export default function ParentsPage() {
  const navigate = useNavigate();
  return <ParentsDashboard onExit={() => navigate("/")} />;
}
