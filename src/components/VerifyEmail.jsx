import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { applyActionCode } from "firebase/auth";
import { auth } from "../firebase";
import logo from "/src/images/omnidev logo.png";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");
  const oobCode = searchParams.get("oobCode");

  useEffect(() => {
    const verify = async () => {
      if (!oobCode) {
        setStatus("error");
        return;
      }
      try {
        await applyActionCode(auth, oobCode);
        setStatus("success");
      } catch {
        setStatus("error");
      }
    };
    verify();
  }, [oobCode]);

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
        <img src={logo} alt="logo" className="w-16 sm:w-20 mb-8" />

        {status === "loading" && (
          <>
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
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <h1 className="text-white text-xl font-bold mb-2">
              Verifying your email...
            </h1>
            <p className="text-gray-500 text-sm">Please wait a moment.</p>
          </>
        )}

        {status === "success" && (
          <>
            <style>{`@keyframes popIn { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
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
              your Omnidev account and start trading.
            </p>
            <Link
              to="/login?verified=true"
              className="w-full py-3.5 rounded-xl font-semibold text-white text-center block
                bg-gradient-to-r from-teal-500 to-teal-600
                hover:from-teal-400 hover:to-teal-500 transition-all duration-200"
            >
              Log In Now
            </Link>
          </>
        )}

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
            <h1 className="text-white text-2xl font-bold mb-3">
              Verification Failed
            </h1>
            <p className="text-gray-400 text-sm leading-relaxed mb-8 px-4">
              This link is invalid or has already expired. Please sign up again
              or request a new verification email.
            </p>
            <Link
              to="/login"
              className="w-full py-3.5 rounded-xl font-semibold text-white text-center block
                bg-gradient-to-r from-teal-500 to-teal-600
                hover:from-teal-400 hover:to-teal-500 transition-all duration-200"
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
