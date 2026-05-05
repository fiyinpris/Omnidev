import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  applyActionCode,
  verifyPasswordResetCode,
  confirmPasswordReset,
} from "firebase/auth";
import { auth } from "../firebase";
import logo from "/src/images/omnidev logo.png";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");

  const oobCode = searchParams.get("oobCode");
  const mode = searchParams.get("mode"); // "verifyEmail" | "resetPassword" | "recoverEmail"

  useEffect(() => {
    const handleAction = async () => {
      if (!oobCode || !mode) {
        setStatus("error");
        return;
      }

      if (mode === "verifyEmail" || mode === "recoverEmail") {
        try {
          await applyActionCode(auth, oobCode);
          setStatus("success");
        } catch {
          setStatus("error");
        }
      } else if (mode === "resetPassword") {
        // Just validate the code is legit — don't consume it yet
        try {
          await verifyPasswordResetCode(auth, oobCode);
          setStatus("resetPassword"); // show the new password form
        } catch {
          setStatus("error");
        }
      } else {
        setStatus("error");
      }
    };

    handleAction();
  }, [oobCode, mode]);

  const handlePasswordReset = async () => {
    setResetError("");
    if (!newPassword || newPassword.length < 6) {
      setResetError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError("Passwords do not match.");
      return;
    }
    setResetLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setStatus("resetSuccess");
    } catch (err) {
      setResetError(
        err.code === "auth/expired-action-code"
          ? "This reset link has expired. Please request a new one."
          : "Failed to reset password. Please try again.",
      );
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0b0b0f] relative overflow-hidden px-4 py-8">
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

      <div className="relative z-10 flex flex-col items-center text-center w-full max-w-sm sm:max-w-md">
        <img src={logo} alt="logo" className="w-16 sm:w-20 mb-8" />

        {/* ── Loading ── */}
        {status === "loading" && (
          <>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <div
              style={{
                width: "56px",
                height: "56px",
                border: "4px solid #1a1a1a",
                borderTop: "4px solid #0d9488",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                marginBottom: "24px",
              }}
            />
            <h1 className="text-white text-xl font-bold mb-2">
              Please wait...
            </h1>
            <p className="text-gray-500 text-sm">Validating your link.</p>
          </>
        )}

        {/* ── Email verified ── */}
        {status === "success" && (
          <>
            <style>{`@keyframes popIn { from { transform:scale(0); opacity:0; } to { transform:scale(1); opacity:1; } }`}</style>
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
                animation: "popIn 0.4s ease",
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0d9488"
                strokeWidth="2.5"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h1 className="text-white text-2xl font-bold mb-3">
              Email Verified!
            </h1>
            <p className="text-gray-400 text-sm leading-relaxed mb-8 px-4">
              Your email has been successfully verified. You can now log in to
              your Omnidev account.
            </p>
            <Link
              to="/login?verified=true"
              className="w-full py-3.5 rounded-xl font-semibold text-white text-center block bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 transition-all duration-200"
            >
              Log In Now
            </Link>
          </>
        )}

        {/* ── Reset password form ── */}
        {status === "resetPassword" && (
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
                strokeWidth="2.5"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h1 className="text-white text-2xl font-bold mb-2">
              Set New Password
            </h1>
            <p className="text-gray-400 text-sm mb-8 px-4">
              Enter a new password for your account.
            </p>

            <div
              style={{ width: "100%", textAlign: "left", marginBottom: "14px" }}
            >
              <label
                style={{
                  color: "#9ca3af",
                  fontSize: "11px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                New Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Min. 6 characters"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setResetError("");
                  }}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    background: "#1a1a1a",
                    border: "1px solid #333",
                    borderRadius: "12px",
                    padding: "14px 44px 14px 16px",
                    color: "#fff",
                    fontSize: "15px",
                    outline: "none",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  style={{
                    position: "absolute",
                    right: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#6b7280",
                    padding: 0,
                  }}
                >
                  {showPass ? (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div
              style={{ width: "100%", textAlign: "left", marginBottom: "20px" }}
            >
              <label
                style={{
                  color: "#9ca3af",
                  fontSize: "11px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                Confirm Password
              </label>
              <input
                type={showPass ? "text" : "password"}
                placeholder="Repeat your new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setResetError("");
                }}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: "#1a1a1a",
                  border: "1px solid #333",
                  borderRadius: "12px",
                  padding: "14px 16px",
                  color: "#fff",
                  fontSize: "15px",
                  outline: "none",
                }}
              />
            </div>

            {resetError && (
              <div
                style={{
                  width: "100%",
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.25)",
                  borderRadius: "10px",
                  padding: "12px 16px",
                  color: "#f87171",
                  fontSize: "13px",
                  marginBottom: "16px",
                  textAlign: "left",
                }}
              >
                {resetError}
              </div>
            )}

            <button
              onClick={handlePasswordReset}
              disabled={resetLoading}
              style={{
                width: "100%",
                padding: "14px",
                background: resetLoading ? "#0a6b63" : "#0d9488",
                border: "none",
                borderRadius: "12px",
                color: "#fff",
                fontWeight: 700,
                fontSize: "15px",
                cursor: resetLoading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
              }}
            >
              {resetLoading ? (
                <>
                  <span
                    style={{
                      width: "18px",
                      height: "18px",
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTop: "2px solid #fff",
                      borderRadius: "50%",
                      animation: "spin 0.7s linear infinite",
                      display: "inline-block",
                    }}
                  />{" "}
                  Updating...
                </>
              ) : (
                "Update Password"
              )}
            </button>
          </>
        )}

        {/* ── Reset success ── */}
        {status === "resetSuccess" && (
          <>
            <style>{`@keyframes popIn { from { transform:scale(0); opacity:0; } to { transform:scale(1); opacity:1; } }`}</style>
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
                animation: "popIn 0.4s ease",
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0d9488"
                strokeWidth="2.5"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h1 className="text-white text-2xl font-bold mb-3">
              Password Updated!
            </h1>
            <p className="text-gray-400 text-sm leading-relaxed mb-8 px-4">
              Your password has been successfully changed. You can now log in
              with your new password.
            </p>
            <Link
              to="/login"
              className="w-full py-3.5 rounded-xl font-semibold text-white text-center block bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 transition-all duration-200"
            >
              Log In Now
            </Link>
          </>
        )}

        {/* ── Error ── */}
        {status === "error" && (
          <>
            <div
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                background: "rgba(239,68,68,0.1)",
                border: "2px solid rgba(239,68,68,0.4)",
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
                stroke="#ef4444"
                strokeWidth="2.5"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <h1 className="text-white text-2xl font-bold mb-3">Link Expired</h1>
            <p className="text-gray-400 text-sm leading-relaxed mb-8 px-4">
              This link is invalid or has already expired. Password reset links
              expire after 1 hour — please request a new one.
            </p>
            <Link
              to="/login"
              className="w-full py-3.5 rounded-xl font-semibold text-white text-center block bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 transition-all duration-200"
            >
              Back to Login
            </Link>
          </>
        )}

        <Link to="/" className="mt-6 text-teal-400 text-sm hover:underline">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
