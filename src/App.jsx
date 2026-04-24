import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { TickerBar } from "./components/TickerBar";
import { Navbar } from "./components/Navbar";
import { CursorDot } from "./components/CursorDot";
import { Home } from "./components/Home";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Dashboard from "./components/Dashboard";
import ForgotPassword from "./components/ForgotPassword";

function LayoutWrapper() {
  const location = useLocation();

  // ✅ Hide layout on auth pages AND dashboard (dashboard has its own)
  const isAuthPage = ["/login", "/signup", "/forgot-password"].includes(
    location.pathname,
  );
  const isDashboard = location.pathname === "/dashboard";

  return (
    <>
      <CursorDot />

      {/* Only show global TickerBar/Navbar on home page, not dashboard */}
      {!isAuthPage && !isDashboard && <TickerBar />}
      {!isAuthPage && !isDashboard && <Navbar />}

      <Routes>
        <Route index element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <LayoutWrapper />
    </BrowserRouter>
  );
}

export default App;
