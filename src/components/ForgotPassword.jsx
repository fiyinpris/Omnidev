import { useState } from "react";
import { Link } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";
import logo from "/src/images/omnidev logo.png";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const trimmed = email.trim().toLowerCase();

    if (!trimmed) {
      setError("Please enter your email address.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, trimmed);
      // Always show success — don't reveal whether the email exists
      setSent(true);
    } catch (err) {
      if (err.code === "auth/too-many-requests") {
        setError("Too many attempts. Please wait a few minutes and try again.");
      } else if (err.code === "auth/network-request-failed") {
        setError("Network error. Check your connection and try again.");
      } else {
        // Don't expose user-not-found for security — treat as sent
        setSent(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0b0b0f] relative overflow-hidden px-4">
      {/* Grid background */}
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

      <div className="relative z-10 w-full max-w-md text-center flex flex-col items-center">
        <img src={logo} alt="logo" className="w-20 mb-6" />

        {/* ── Email sent state ── */}
        {sent ? (
          <>
            <div
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                background: "rgba(13,148,136,0.15)",
                border: "2px solid #0d9488",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "24px",
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0d9488"
                strokeWidth="2"
              >
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>

            <h1 className="text-white text-2xl font-bold mb-3">
              Check your email
            </h1>
            <p className="text-gray-400 text-sm leading-relaxed mb-2">
              We sent a password reset link to
            </p>
            <p className="text-teal-400 font-semibold text-sm mb-4">
              {email.trim().toLowerCase()}
            </p>
            <p className="text-gray-500 text-xs leading-relaxed mb-8 px-4">
              Click the link in the email to set a new password. The link
              expires in 1 hour. Check your spam folder if you don't see it.
            </p>

            <button
              onClick={async () => {
                try {
                  await sendPasswordResetEmail(
                    auth,
                    email.trim().toLowerCase(),
                  );
                  alert("Reset email resent! Check your inbox.");
                } catch {
                  alert("Please wait a moment before resending.");
                }
              }}
              className="text-gray-500 text-xs hover:text-teal-400 transition-colors mb-6"
            >
              Didn't receive it? Resend email
            </button>

            <Link
              to="/login"
              className="w-full py-3.5 rounded-xl font-semibold text-white text-center block
                bg-gradient-to-r from-teal-500 to-teal-600
                hover:from-teal-400 hover:to-teal-500 transition-all duration-200"
            >
              Back to Login
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-white text-xl mb-2 font-medium">
              Reset your password
            </h1>
            <p className="text-gray-500 text-sm mb-8">
              Enter your account email and we'll send you a reset link.
            </p>

            <form onSubmit={handleSubmit} className="w-full space-y-4">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                className="w-full px-5 py-4 rounded-xl bg-white/90 text-black outline-none"
                autoComplete="email"
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
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          </>
        )}

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
