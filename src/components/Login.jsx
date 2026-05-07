import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
} from "firebase/auth";
import { auth } from "../firebase";
import logo from "/src/images/omnidev logo.png";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const registered = new URLSearchParams(location.search).get("registered");
  const verified = new URLSearchParams(location.search).get("verified");
  const unverified = new URLSearchParams(location.search).get("unverified");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: name === "email" ? value.trim() : value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const email = form.email.trim().toLowerCase();
    const password = form.password;

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );

      if (!userCredential.user.emailVerified) {
        try {
          await sendEmailVerification(userCredential.user, {
            url: "https://omnidev-two.vercel.app/login?verified=true",
            handleCodeInApp: false,
          });
        } catch (e) {
          console.log("Could not resend verification:", e);
        }
        await signOut(auth);
        setError(
          "Please verify your email before logging in. A new verification link has been sent.",
        );
        return;
      }

      navigate("/dashboard", { replace: true });
    } catch (err) {
      if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential"
      ) {
        setError("Incorrect email or password.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address. Check for typos or extra spaces.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many attempts. Try again later.");
      } else if (err.code === "auth/network-request-failed") {
        setError("Network error. Check your connection.");
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const EyeIcon = ({ open }) =>
    open ? (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ) : (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0b0b0f] relative overflow-hidden px-4">
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

      <div className="relative z-10 flex flex-col items-center w-full max-w-md text-center">
        <img src={logo} className="w-20 mb-6" alt="logo" />

        <h1 className="text-white text-xl mb-6">Log in to your account</h1>

        {unverified && (
          <div className="w-full bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3 mb-4">
            <p className="text-yellow-400 text-sm">
              Your email is not verified. Please check your inbox (and spam
              folder) for the verification link. A new verification email has
              been sent.
            </p>
          </div>
        )}
        {registered && (
          <div className="w-full bg-teal-500/10 border border-teal-500/30 rounded-xl px-4 py-3 mb-4">
            <p className="text-teal-400 text-sm">
              ✅ Account created! Check your email to verify before logging in.
            </p>
          </div>
        )}
        {verified && (
          <div className="w-full bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 mb-4">
            <p className="text-green-400 text-sm">
              Email verified! You can now log in.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <input
            name="email"
            type="email"
            inputMode="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck="false"
            className="w-full px-5 py-4 rounded-xl bg-white/90 text-black outline-none"
          />

          {/* Password field with eye toggle */}
          <div className="relative">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
              className="w-full px-5 py-4 pr-12 rounded-xl bg-white/90 text-black outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
              tabIndex={-1}
            >
              <EyeIcon open={showPassword} />
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
              <p className="text-red-400 text-sm text-left">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl font-semibold text-white
              bg-gradient-to-r from-teal-500 to-teal-600
              hover:from-teal-400 hover:to-teal-500 transition-all duration-200
              disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="mt-6 text-gray-400 text-sm">
          Don't have an account?{" "}
          <Link to="/signup" className="text-teal-400 hover:underline">
            Create one
          </Link>
        </div>

        <Link
          to="/forgot-password"
          className="mt-3 text-sm text-gray-400 hover:text-teal-400"
        >
          Forgot password?
        </Link>

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
