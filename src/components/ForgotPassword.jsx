import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "/src/images/omnidev logo.png";

export default function ForgotPassword() {
  const [form, setForm] = useState({
    identifier: "",
    newPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    let { identifier, newPassword } = form;

    if (!identifier || !newPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    // ✅ normalize input
    identifier = identifier.trim().toLowerCase();

    const accounts = JSON.parse(
      localStorage.getItem("omnidev_accounts") || "{}",
    );

    let accountKey = null;

    // ✅ 1. try email match
    if (accounts[identifier]) {
      accountKey = identifier;
    } else {
      // ✅ 2. try username match (case insensitive)
      const found = Object.entries(accounts).find(([email, acc]) => {
        return acc.username?.toLowerCase() === identifier;
      });

      if (found) {
        accountKey = found[0]; // email key
      }
    }

    if (!accountKey) {
      setError("Account not found.");
      return;
    }

    // ✅ update password
    accounts[accountKey].password = newPassword;
    localStorage.setItem("omnidev_accounts", JSON.stringify(accounts));

    setSuccess("Password reset successful. Redirecting to login...");

    setTimeout(() => {
      navigate("/login");
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0b0b0f] relative overflow-hidden px-4">
      {/* GRID BACKGROUND */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(13,148,136,0.28) 1px,transparent 1px),linear-gradient(90deg,rgba(13,148,136,0.28) 1px,transparent 1px)",
          backgroundSize: "80px 80px",
          maskImage:
            "radial-gradient(ellipse 75% 75% at 50% 50%,transparent 35%,black 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 75% 75% at 50% 50%,transparent 35%,black 70%)",
        }}
      />

      <div className="relative z-10 w-full max-w-md text-center">
        <img src={logo} alt="logo" className="w-20 mx-auto mb-6" />

        <h1 className="text-white text-xl mb-6 font-medium">
          Reset your password
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="identifier"
            placeholder="Enter Email or Username"
            value={form.identifier}
            onChange={handleChange}
            className="w-full px-5 py-4 rounded-xl bg-white/90 text-black outline-none"
          />

          <input
            type="password"
            name="newPassword"
            placeholder="New Password"
            value={form.newPassword}
            onChange={handleChange}
            className="w-full px-5 py-4 rounded-xl bg-white/90 text-black outline-none"
          />

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
              <p className="text-red-400 text-sm text-left">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3">
              <p className="text-green-400 text-sm text-left">{success}</p>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-4 rounded-xl font-semibold text-white
              bg-gradient-to-r from-teal-500 to-teal-600
              hover:from-teal-400 hover:to-teal-500 transition-all duration-200"
          >
            Reset Password
          </button>
        </form>

        <Link
          to="/login"
          className="block mt-6 text-teal-400 text-sm hover:underline"
        >
          ← Back to Login
        </Link>
      </div>
    </div>
  );
}
