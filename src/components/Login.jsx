import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "/src/images/omnidev logo.png";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { email, password } = form;

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const accounts = JSON.parse(
        localStorage.getItem("omnidev_accounts") || "{}",
      );

      // Try matching by email or username
      const account =
        accounts[email] ||
        Object.values(accounts).find((a) => a.username === email);

      if (!account) {
        setError("No account found. Please create one first.");
        setLoading(false);
        return;
      }

      if (account.password !== password) {
        setError("Incorrect password. Please try again.");
        setLoading(false);
        return;
      }

      // Save session
      localStorage.setItem(
        "omnidev_session",
        JSON.stringify({
          email: account.email,
          username: account.username,
          firstName: account.firstName,
          lastName: account.lastName,
          loggedIn: true,
        }),
      );

      navigate("/dashboard");
    }, 700);
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

      <div className="relative z-10 flex flex-col items-center text-center w-full max-w-sm sm:max-w-md">
        {/* LOGO */}
        <img src={logo} alt="logo" className="w-16 sm:w-20 mt-6 mb-5" />

        {/* TITLE */}
        <h1 className="text-white text-lg sm:text-xl md:text-2xl font-medium leading-relaxed px-2">
          Log in to access your account and explore cryptocurrency
          opportunities.
        </h1>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="w-full mt-8 space-y-4">
          <input
            type="text"
            name="email"
            placeholder="Enter Email or Username"
            value={form.email}
            onChange={handleChange}
            className="w-full px-5 py-3.5 sm:py-4 rounded-xl bg-white/90 text-black placeholder-gray-500 outline-none text-sm sm:text-base"
          />
          <input
            type="password"
            name="password"
            placeholder="Enter Password"
            value={form.password}
            onChange={handleChange}
            className="w-full px-5 py-3.5 sm:py-4 rounded-xl bg-white/90 text-black placeholder-gray-500 outline-none text-sm sm:text-base"
          />

          {/* ERROR */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
              <p className="text-red-400 text-sm text-left">{error}</p>
              {error.includes("No account") && (
                <Link
                  to="/signup"
                  className="mt-1 block text-teal-400 text-sm font-semibold hover:underline"
                >
                  → Create an account
                </Link>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 sm:py-4 rounded-xl font-semibold text-white text-sm sm:text-base
              bg-gradient-to-r from-teal-500 to-teal-600
              hover:from-teal-400 hover:to-teal-500 transition-all duration-200
              disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  />
                </svg>
                Logging in...
              </span>
            ) : (
              "Login"
            )}
          </button>
        </form>

        {/* LINKS */}
        <div className="mt-8 text-gray-400 text-sm space-y-2">
          <p>
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-teal-400 hover:underline font-medium"
            >
              Create one
            </Link>
          </p>
          <Link
            to="/forgot-password"
            className="hover:text-white cursor-pointer transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <Link
          to="/"
          className="mt-6 mb-8 text-teal-400 text-sm hover:underline"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
