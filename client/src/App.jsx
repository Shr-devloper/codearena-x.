import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import AppLayout from "./components/layout/AppLayout.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import AuthCallback from "./pages/AuthCallback.jsx";
import Plan from "./pages/Plan.jsx";
import ProblemsList from "./pages/ProblemsList.jsx";
import ProblemSolve from "./pages/ProblemSolve.jsx";
import ChambersHub from "./pages/ChambersHub.jsx";
import ChamberDetail from "./pages/ChamberDetail.jsx";
import InterviewSetup from "./pages/InterviewSetup.jsx";
import InterviewSession from "./pages/InterviewSession.jsx";
import InterviewResult from "./pages/InterviewResult.jsx";

function Protected({ children }) {
  const { user, ready } = useAuth();
  if (!ready) {
    return <div className="p-8 text-slate-500 text-sm">Loading…</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function PublicOnly({ children }) {
  const { user, ready } = useAuth();
  if (!ready) {
    return <div className="p-8 text-slate-500 text-sm">Loading…</div>;
  }
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route
        path="/login"
        element={
          <PublicOnly>
            <Login />
          </PublicOnly>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnly>
            <Register />
          </PublicOnly>
        }
      />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route
        path="/dashboard"
        element={
          <Protected>
            <AppLayout />
          </Protected>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="plan" element={<Plan />} />
        <Route path="chambers" element={<ChambersHub />} />
        <Route path="chambers/:chamberId" element={<ChamberDetail />} />
        <Route path="problems" element={<ProblemsList />} />
        <Route path="problems/:slug" element={<ProblemSolve />} />
        <Route path="interview" element={<InterviewSetup />} />
        <Route path="interview/session/:sessionId" element={<InterviewSession />} />
        <Route path="interview/result/:sessionId" element={<InterviewResult />} />
      </Route>
    </Routes>
  );
}
