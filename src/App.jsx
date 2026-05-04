import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
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

  return (
    <>
      <CursorDot />
      {!isAuthPage && !isDashboard && !isAdmin && !isWithdrawalSupport && (
        <TickerBar />
      )}
      {!isAuthPage && !isDashboard && !isAdmin && !isWithdrawalSupport && (
        <Navbar />
      )}
      <Routes>
        <Route index element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/withdrawal-support" element={<WithdrawalSupport />} />
        <Route path="/contact" element={<Contact />} />
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
