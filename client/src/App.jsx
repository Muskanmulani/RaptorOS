import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import { AuthProvider, useAuth } from "./context/AuthContext";
import EventManagement from "./pages/EventManagement";

function RoleRoute({ allowedRoles, children }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user?.role)) {
    return <Navigate to="/gallery" replace />;
  }

  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />

          <Route element={<MainLayout />}>
            <Route
              path="/dashboard"
              element={
                <RoleRoute allowedRoles={["admin", "organizer"]}>
                  <Dashboard />
                </RoleRoute>
              }
            />

            <Route
              path="/events"
              element={
                <RoleRoute allowedRoles={["admin", "organizer"]}>
                  <EventManagement />
                </RoleRoute>
              }
            />

            <Route path="/gallery" element={<Gallery />} />

            <Route
              path="/judge"
              element={
                <RoleRoute allowedRoles={["judge"]}>
                  <JudgingDesk />
                </RoleRoute>
              }
            />

            <Route
              path="/judge/project/:projectId"
              element={
                <RoleRoute allowedRoles={["judge"]}>
                  <ProjectReview />
                </RoleRoute>
              }
            />

            <Route
              path="/judge/project/:projectId/explain"
              element={
                <RoleRoute allowedRoles={["judge"]}>
                  <ScoreAnatomy />
                </RoleRoute>
              }
            />

            <Route
              path="/judge/simulator"
              element={
                <RoleRoute allowedRoles={["admin", "organizer", "judge"]}>
                  <JudgingSimulator />
                </RoleRoute>
              }
            />

            <Route
              path="/control-room"
              element={
                <RoleRoute allowedRoles={["admin", "organizer"]}>
                  <ControlRoom />
                </RoleRoute>
              }
            />

            <Route
              path="/fairness"
              element={
                <RoleRoute allowedRoles={["admin", "organizer"]}>
                  <FairnessLab />
                </RoleRoute>
              }
            />

            <Route
              path="/ledger"
              element={
                <RoleRoute allowedRoles={["admin", "organizer"]}>
                  <DecisionLedger />
                </RoleRoute>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;