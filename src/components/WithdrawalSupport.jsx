import { useNavigate } from "react-router-dom";

export default function WithdrawalSupport() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-5 text-center relative overflow-hidden">
      {/* Background Grid */}
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

      {/* Content */}
      <div className="relative z-10 bg-[#111] border border-[#222] rounded-[20px] px-6 py-8 sm:px-8 sm:py-10 w-full max-w-[520px]">
        <div className="w-16 h-16 rounded-full bg-[rgba(13,148,136,0.15)] border-2 border-[#0d9488] flex items-center justify-center mx-auto mb-5">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#0d9488"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </div>

        <h1 className="text-[22px] sm:text-[24px] font-extrabold mb-3 text-white">
          Withdrawal Support
        </h1>

        <p className="text-[#9ca3af] text-sm sm:text-[15px] leading-7 mb-7">
          Contact our support team to activate your withdrawals. Our team will
          verify your account and enable withdrawal functionality.
        </p>

        <a
          href="https://t.me/your_telegram_username"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2.5 px-5 sm:px-7 py-3.5 bg-[#0d9488] rounded-xl text-white font-bold text-sm sm:text-[15px] cursor-pointer no-underline mb-4 w-full sm:w-auto"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0h-.056zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
          </svg>
          Contact Support on Telegram
        </a>

        <button
          onClick={() => navigate("/dashboard")}
          className="block w-full py-3 bg-transparent border border-[#333] rounded-[10px] text-[#9ca3af] font-semibold text-sm cursor-pointer mt-[15px]"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
