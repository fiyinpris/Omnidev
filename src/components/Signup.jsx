import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "/src/images/omnidev logo.png";

export default function Signup() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { firstName, lastName, email, username, password } = form;

    if (!firstName || !lastName || !email || !username || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const accounts = JSON.parse(
        localStorage.getItem("omnidev_accounts") || "{}",
      );

      if (accounts[email]) {
        setError("An account with this email already exists.");
        setLoading(false);
        return;
      }

      // Check username uniqueness
      const usernameTaken = Object.values(accounts).some(
        (a) => a.username === username,
      );
      if (usernameTaken) {
        setError("This username is already taken.");
        setLoading(false);
        return;
      }

      // Save account
      accounts[email] = {
        firstName,
        lastName,
        email,
        username,
        password,
        balance: 0,
        transactions: [],
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem("omnidev_accounts", JSON.stringify(accounts));

      setLoading(false);
      // Redirect to login with success flag
      navigate("/login?registered=true");
    }, 800);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0b0b0f] relative overflow-hidden px-4 py-8">
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
        <img src={logo} alt="logo" className="w-16 sm:w-20 mb-5" />

        {/* TITLE */}
        <h1 className="text-white text-lg sm:text-xl md:text-2xl font-medium leading-relaxed px-2">
          Join Omnidev Today! Sign Up to Begin Your Journey into the Exciting
          World of Cryptocurrency.
        </h1>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="w-full mt-8 space-y-4">
          <div className="flex gap-3">
            <input
              type="text"
              name="firstName"
              placeholder="Enter First Name"
              value={form.firstName}
              onChange={handleChange}
              className="w-1/2 px-4 py-3.5 rounded-xl bg-white/90 text-black placeholder-gray-500 outline-none text-sm"
            />
            <input
              type="text"
              name="lastName"
              placeholder="Enter Last Name"
              value={form.lastName}
              onChange={handleChange}
              className="w-1/2 px-4 py-3.5 rounded-xl bg-white/90 text-black placeholder-gray-500 outline-none text-sm"
            />
          </div>

          <input
            type="email"
            name="email"
            placeholder="Enter Email"
            value={form.email}
            onChange={handleChange}
            className="w-full px-5 py-3.5 sm:py-4 rounded-xl bg-white/90 text-black placeholder-gray-500 outline-none text-sm sm:text-base"
          />

          <input
            type="text"
            name="username"
            placeholder="Enter Username"
            value={form.username}
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

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
              <p className="text-red-400 text-sm text-left">{error}</p>
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
                Creating account...
              </span>
            ) : (
              "Sign Up"
            )}
          </button>
        </form>

        <div className="mt-6 text-gray-400 text-sm">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-teal-400 hover:underline font-medium"
          >
            Log in
          </Link>
        </div>

        <Link
          to="/"
          className="mt-4 mb-8 text-teal-400 text-sm hover:underline"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
