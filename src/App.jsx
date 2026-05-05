import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import { TickerBar } from "./components/TickerBar";
import { Navbar } from "./components/Navbar";
import { CursorDot } from "./components/CursorDot";
import { Home } from "./components/Home";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Dashboard from "./components/Dashboard";
import AdminDashboard from "./components/AdminDashboard";
import ForgotPassword from "./components/ForgotPassword";
import VerifyEmail from "./components/VerifyEmail";
import WithdrawalSupport from "./components/WithdrawalSupport";
import { Contact } from "./components/Contact";

const ADMIN_EMAIL = "fiyinolaleke@gmail.com";

/**
 * Shows a full-screen spinner while Firebase confirms auth state.
 * Without this, the guard sees "no user" for ~200ms and redirects
 * before Firebase has even responded — causing the back-button loop.
 */
function AuthLoader({ children }) {
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, () => setAuthReady(true));
    return () => unsub();
  }, []);

  if (!authReady) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0a0a0a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div
          style={{
            width: "36px",
            height: "36px",
            border: "3px solid #1a1a1a",
            borderTop: "3px solid #0d9488",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
      </div>
    );
  }

  return children;
}

/**
 * Protects routes that require login.
 * Uses replace:true so pressing back never lands on /login.
 */
function ProtectedRoute({ children, adminOnly = false }) {
  const [user, setUser] = useState(undefined); // undefined = loading
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setChecked(true);
    });
    return () => unsub();
  }, []);

  if (!checked) return null; // AuthLoader already showed spinner

  if (!user) return <Navigate to="/login" replace />;

  if (adminOnly && user.email !== ADMIN_EMAIL) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

/**
 * Redirects already-logged-in users away from login/signup
 * so they never land back on auth pages after logging in.
 */
function PublicRoute({ children }) {
  const [user, setUser] = useState(undefined);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setChecked(true);
    });
    return () => unsub();
  }, []);

  if (!checked) return null;

  if (user) return <Navigate to="/dashboard" replace />;

  return children;
}

function LayoutWrapper() {
  const location = useLocation();

  const isAuthPage = [
    "/login",
    "/signup",
    "/forgot-password",
    "/verify-email",
  ].includes(location.pathname);

  const isDashboard = location.pathname === "/dashboard";
  const isAdmin = location.pathname === "/admin";
  const isWithdrawalSupport = location.pathname === "/withdrawal-support";

  const hideChrome =
    isAuthPage || isDashboard || isAdmin || isWithdrawalSupport;

  return (
    <>
      <CursorDot />
      {!hideChrome && <TickerBar />}
      {!hideChrome && <Navbar />}

      <Routes>
        {/* ── Public pages ── */}
        <Route index element={<Home />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/contact" element={<Contact />} />

        {/* ── Auth pages — redirect away if already logged in ── */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          }
        />

        {/* ── Protected pages — redirect to login if not logged in ── */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/withdrawal-support"
          element={
            <ProtectedRoute>
              <WithdrawalSupport />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthLoader>
        <LayoutWrapper />
      </AuthLoader>
    </BrowserRouter>
  );
}

export default App;
