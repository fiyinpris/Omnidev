import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, form.email, form.password);
      navigate("/dashboard");
    } catch {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
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

      {/* CONTENT */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-md text-center">
        <img src={logo} className="w-20 mb-6" />

        <h1 className="text-white text-xl mb-6">Log in to your account</h1>

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

          {error && <p className="text-red-400 text-sm text-left">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-teal-500 to-teal-600"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="mt-6 text-gray-400 text-sm">
          Don't have an account?{" "}
          <Link to="/signup" className="text-teal-400">
            Create one
          </Link>
        </div>

        <Link to="/forgot-password" className="mt-3 text-sm text-gray-400">
          Forgot password?
        </Link>
        <Link
          to="/"
          className="mt-4 mb-8 text-teal-400 text-sm hover:underline"
        >
          {" "}
          ← Back to Home{" "}
        </Link>
      </div>
    </div>
  );
}
