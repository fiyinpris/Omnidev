import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
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
  const [verificationSent, setVerificationSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const isUsernameTaken = async (username) => {
    const ref = doc(db, "usernames", username.toLowerCase().trim());
    const snap = await getDoc(ref);
    return snap.exists();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { firstName, lastName, email, username, password } = form;

    if (!firstName || !lastName || !email || !username || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (username.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError("Username can only contain letters, numbers, and underscores.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const taken = await isUsernameTaken(username);
      if (taken) {
        setError("Username already taken. Please choose another.");
        setLoading(false);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      await user.getIdToken(true);

      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`,
      });

      const cleanUsername = username.toLowerCase().trim();

      await setDoc(doc(db, "users", user.uid), {
        firstName,
        lastName,
        username: cleanUsername,
        email,
        createdAt: new Date().toISOString(),
      });

      await setDoc(doc(db, "usernames", cleanUsername), {
        uid: user.uid,
        username: cleanUsername,
      });

      await sendEmailVerification(user, {
        url: "https://omnidev-two.vercel.app/login?verified=true",
        handleCodeInApp: false,
      });

      setVerificationSent(true);
    } catch (err) {
      console.error("SIGNUP ERROR:", err.code, err.message);

      if (err.code === "auth/email-already-in-use") {
        setError("Email already in use. Try logging in instead.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email format.");
      } else if (err.code === "auth/weak-password") {
        setError("Password too weak. Use at least 6 characters.");
      } else if (err.code === "auth/network-request-failed") {
        setError("Network error. Check your connection.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many attempts. Please try later.");
      } else if (err.code === "permission-denied") {
        setError(
          "Permission error. Please check your connection and try again.",
        );
      } else {
        setError(err.message || "Signup failed. Please try again.");
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

  if (verificationSent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0b0b0f] relative overflow-hidden px-4 py-8">
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
          <img src={logo} alt="logo" className="w-16 sm:w-20 mb-6" />

          <div className="w-20 h-20 rounded-full bg-teal-500/20 border border-teal-500/40 flex items-center justify-center mb-6">
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0d9488"
              strokeWidth="1.8"
            >
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </div>

          <h1 className="text-white text-2xl font-bold mb-3">
            Verify Your Email
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed mb-2">
            We sent a verification link to
          </p>
          <p className="text-teal-400 font-semibold text-sm mb-6">
            {form.email}
          </p>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
            <p className="text-yellow-400 text-xs leading-relaxed">
              You must verify your email. Check your inbox (and spam folder) for
              the verification link.
            </p>
          </div>
          <p className="text-gray-500 text-xs mb-4">
            Already verified?{" "}
            <Link to="/login" className="text-teal-400 hover:underline">
              Go to Login
            </Link>
          </p>

          <Link
            to="/login"
            className="w-full py-3.5 rounded-xl font-semibold text-white text-center block
              bg-gradient-to-r from-teal-500 to-teal-600
              hover:from-teal-400 hover:to-teal-500 transition-all duration-200"
          >
            Go to Login
          </Link>

          <p className="mt-4 text-gray-500 text-xs">
            Didn't receive it?{" "}
            <span className="text-gray-400">
              Check your spam folder or sign up again.
            </span>
          </p>

          <Link to="/" className="mt-6 text-teal-400 text-sm hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0b0b0f] relative overflow-hidden px-4 py-8">
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
        <img src={logo} alt="logo" className="w-16 sm:w-20 mb-5" />

        <h1 className="text-white text-lg sm:text-xl md:text-2xl font-medium leading-relaxed px-2">
          Join Omnidev Today! Sign Up to Begin Your Journey into the Exciting
          World of Cryptocurrency.
        </h1>

        <form onSubmit={handleSubmit} className="w-full mt-8 space-y-4">
          <div className="flex gap-3">
            <input
              type="text"
              name="firstName"
              placeholder="Enter First Name"
              value={form.firstName}
              onChange={handleChange}
              className="w-1/2 px-4 py-3.5 rounded-xl bg-white/90 text-black outline-none text-sm"
            />
            <input
              type="text"
              name="lastName"
              placeholder="Enter Last Name"
              value={form.lastName}
              onChange={handleChange}
              className="w-1/2 px-4 py-3.5 rounded-xl bg-white/90 text-black outline-none text-sm"
            />
          </div>

          <input
            type="email"
            name="email"
            placeholder="Enter Email"
            value={form.email}
            onChange={handleChange}
            className="w-full px-5 py-3.5 rounded-xl bg-white/90 text-black outline-none"
          />

          <input
            type="text"
            name="username"
            placeholder="Enter Username"
            value={form.username}
            onChange={handleChange}
            className="w-full px-5 py-3.5 rounded-xl bg-white/90 text-black outline-none"
          />

          {/* Password field with eye toggle */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Enter Password"
              value={form.password}
              onChange={handleChange}
              className="w-full px-5 py-3.5 pr-12 rounded-xl bg-white/90 text-black outline-none"
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
            className="w-full py-3.5 rounded-xl font-semibold text-white
              bg-gradient-to-r from-teal-500 to-teal-600
              hover:from-teal-400 hover:to-teal-500 transition-all duration-200
              disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Sign Up"}
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
