import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Gallery from "./pages/Gallery";
import JudgingDesk from "./pages/JudgingDesk";
import ProjectReview from "./pages/ProjectReview";
import ControlRoom from "./pages/ControlRoom";
import FairnessLab from "./pages/FairnessLab";
import ScoreAnatomy from "./pages/ScoreAnatomy";
import DecisionLedger from "./pages/DecisionLedger";
import JudgingSimulator from "./pages/JudgingSimulator";
import MainLayout from "./layouts/MainLayout";
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />

          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/judge" element={<JudgingDesk />} />
            <Route
              path="/judge/project/:projectId"
              element={<ProjectReview />}
            />
            <Route
              path="/judge/project/:projectId/explain"
              element={<ScoreAnatomy />}
            />
            <Route
              path="/judge/simulator"
              element={<JudgingSimulator />}
            />
            <Route path="/control-room" element={<ControlRoom />} />
            <Route path="/fairness" element={<FairnessLab />} />
            <Route path="/ledger" element={<DecisionLedger />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;