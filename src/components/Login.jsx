import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../firebase";
import logo from "/src/images/omnidev logo.png";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const registered = new URLSearchParams(location.search).get("registered");
  const verified = new URLSearchParams(location.search).get("verified");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(
        auth,
        form.email,
        form.password,
      );

      if (!userCredential.user.emailVerified) {
        await signOut(auth);
        setError(
          "Please verify your email before logging in.",
        );
        return;
      }

      navigate("/dashboard");
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        setError("No account found with this email.");
      } else if (err.code === "auth/wrong-password") {
        setError("Incorrect password.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email format.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many attempts. Try again later.");
      } else {
        setError("Invalid email or password.");
      }
    } finally {
      setLoading(false);
    }
  };

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

        {registered && !verified && (
          <div className="w-full bg-teal-500/10 border border-teal-500/30 rounded-xl px-4 py-3 mb-4">
            <p className="text-teal-400 text-sm">
              ✅ Account created! Check your email to verify before logging in.
            </p>
          </div>
        )}
        {verified && (
          <div className="w-full bg-teal-500/10 border border-teal-500/30 rounded-xl px-4 py-3 mb-4">
            <p className="text-teal-400 text-sm">
              🎉 Email verified! You can now log in.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <input
            name="email"
            placeholder="Email"
            onChange={handleChange}
            className="w-full px-5 py-4 rounded-xl bg-white/90 text-black outline-none"
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            onChange={handleChange}
            className="w-full px-5 py-4 rounded-xl bg-white/90 text-black outline-none"
          />

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
