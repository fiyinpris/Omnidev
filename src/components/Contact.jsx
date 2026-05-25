import { useNavigate } from "react-router-dom";

export const Contact = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 16px 60px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%       { transform: scale(1.6); opacity: 0; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: scaleX(0); }
          to   { opacity: 1; transform: scaleX(1); }
        }
        @keyframes popIn {
          0%   { opacity: 0; transform: translateY(12px) scale(0.95); }
          70%  { transform: translateY(-3px) scale(1.02); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        .cs-back-btn {
          position: absolute;
          top: 24px; left: 24px;
          background: none;
          border: 1px solid #1e2e2e;
          color: #6b7280;
          border-radius: 10px;
          padding: 8px 16px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: color 0.2s, border-color 0.2s;
          z-index: 10;
        }
        .cs-back-btn:hover { color: #0d9488; border-color: #0d9488; }

        .cs-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #0d9488;
          display: inline-block;
          position: relative;
          flex-shrink: 0;
        }
        .cs-dot::after {
          content: '';
          position: absolute; inset: -4px;
          border-radius: 50%;
          border: 1.5px solid rgba(13,148,136,0.35);
          animation: pulse 2s ease-in-out infinite;
        }

        .cs-tg-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 18px 20px;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.03);
          text-decoration: none;
          color: #fff;
          transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
          margin-bottom: 10px;
          animation: fadeUp 0.55s ease both;
          animation-delay: 0.38s;
        }
        .cs-tg-card:hover {
          border-color: rgba(13,148,136,0.5);
          transform: translateY(-3px);
          box-shadow: 0 12px 28px rgba(13,148,136,0.08);
        }
        .cs-tg-card:hover .cs-arrow {
          color: #0d9488;
          transform: translateX(4px);
        }

        .cs-arrow {
          margin-left: auto;
          color: #374151;
          transition: color 0.2s, transform 0.2s;
          flex-shrink: 0;
        }

        .cs-perk {
          padding: 14px 12px;
          border-radius: 12px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.05);
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
          animation: popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both;
        }
        .cs-perk:nth-child(1) { animation-delay: 0.5s; }
        .cs-perk:nth-child(2) { animation-delay: 0.62s; }
        .cs-perk:nth-child(3) { animation-delay: 0.74s; }
        .cs-perk:hover {
          border-color: rgba(13,148,136,0.4);
          transform: translateY(-4px);
          box-shadow: 0 8px 20px rgba(13,148,136,0.08);
        }
        .cs-perk:hover .cs-perk-icon {
          background: rgba(13,148,136,0.18);
          transform: scale(1.1);
        }

        .cs-perk-icon {
          width: 34px; height: 34px;
          border-radius: 9px;
          background: rgba(13,148,136,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #0d9488;
          transition: background 0.2s, transform 0.2s;
        }
      `}</style>

      {/* Grid background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(13,148,136,0.1) 1px,transparent 1px),linear-gradient(90deg,rgba(13,148,136,0.1) 1px,transparent 1px)",
          backgroundSize: "60px 60px",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 70% at 50% 50%,transparent 20%,black 100%)",
          maskImage:
            "radial-gradient(ellipse 70% 70% at 50% 50%,transparent 20%,black 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Ambient glow */}
      <div
        style={{
          position: "absolute",
          top: "40%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          width: "600px",
          height: "400px",
          background:
            "radial-gradient(ellipse, rgba(13,148,136,0.08) 0%, transparent 65%)",
          pointerEvents: "none",
        }}
      />

      {/* Back button */}
      <button onClick={() => navigate(-1)} className="cs-back-btn">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back
      </button>

      {/* Main content */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: "460px",
          textAlign: "center",
        }}
      >
        {/* Eyebrow */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            marginBottom: "16px",
            animation: "fadeIn 0.5s ease both",
            animationDelay: "0.05s",
          }}
        >
          <span className="cs-dot" />
          <span
            style={{
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "#0d9488",
            }}
          >
            Support · 24/7
          </span>
        </div>

        {/* Heading */}
        <h1
          style={{
            fontSize: "clamp(30px,6vw,44px)",
            fontWeight: 800,
            color: "#fff",
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            margin: "0 0 10px",
            animation: "fadeUp 0.55s ease both",
            animationDelay: "0.12s",
          }}
        >
          Need help with <span style={{ color: "#0d9488" }}>OmniDev?</span>
        </h1>

        {/* Divider */}
        <div
          style={{
            width: "36px",
            height: "3px",
            background: "#0d9488",
            borderRadius: "2px",
            margin: "16px auto 14px",
            transformOrigin: "left center",
            animation: "slideDown 0.45s ease both",
            animationDelay: "0.22s",
          }}
        />

        {/* Subtitle */}
        <p
          style={{
            fontSize: "14px",
            lineHeight: 1.75,
            color: "#6b7280",
            margin: "0 auto 24px",
            maxWidth: "340px",
            animation: "fadeUp 0.55s ease both",
            animationDelay: "0.28s",
          }}
        >
          Our support team is on standby around the clock. Reach out — we'll get
          you sorted fast.
        </p>

        {/* Telegram card */}
        <a
          href="https://t.me/omnidev_support"
          target="_blank"
          rel="noopener noreferrer"
          className="cs-tg-card"
        >
          <div
            style={{
              width: "50px",
              height: "50px",
              borderRadius: "14px",
              background: "#0088cc",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 4px 16px rgba(0,136,204,0.25)",
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.247l-2.02 9.52c-.148.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L6.862 14.48l-2.95-.924c-.642-.2-.654-.642.136-.953l11.527-4.445c.535-.194 1.003.13.987.089z" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
            <p
              style={{
                fontSize: "11px",
                fontWeight: 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#4b5563",
                margin: "0 0 3px",
              }}
            >
              Telegram
            </p>
            <p
              style={{
                fontSize: "17px",
                fontWeight: 700,
                color: "#f3f4f6",
                margin: "0 0 2px",
              }}
            >
              Message us
            </p>
            <p
              style={{
                fontSize: "13px",
                color: "#0d9488",
                fontWeight: 500,
                margin: 0,
              }}
            >
              @omnidev_support
            </p>
          </div>
          <svg
            className="cs-arrow"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </a>

        {/* Perk boxes */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "8px",
          }}
        >
          {[
            {
              icon: (
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#0d9488"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              ),
              title: "Private & secure",
              desc: "End-to-end encrypted",
            },
            {
              icon: (
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#0d9488"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                  <polyline points="16 11 18 13 22 9" />
                </svg>
              ),
              title: "Human support",
              desc: "No bots, ever",
            },
            {
              icon: (
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#0d9488"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              ),
              title: "Transactions",
              desc: "Disputes resolved fast",
            },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="cs-perk">
              <div className="cs-perk-icon">{icon}</div>
              <p
                style={{
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "#f3f4f6",
                  margin: "0 0 2px",
                }}
              >
                {title}
              </p>
              <p
                style={{
                  fontSize: "11px",
                  color: "#6b7280",
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {desc}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: "28px",
            paddingTop: "20px",
            borderTop: "1px solid rgba(255,255,255,0.05)",
            animation: "fadeIn 0.5s ease both",
            animationDelay: "0.88s",
          }}
        >
          <p style={{ fontSize: "11px", color: "#1e3030", margin: 0 }}>
            © {new Date().getFullYear()} Omnidev Exchange Inc. All Rights
            Reserved.
          </p>
        </div>
      </div>
    </div>
  );
};
