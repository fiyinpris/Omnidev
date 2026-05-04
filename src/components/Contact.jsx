import { useNavigate } from "react-router-dom";

export const Contact = () => {
  const navigate = useNavigate();

  const gridBg = {
    position: "absolute",
    inset: 0,
    backgroundImage:
      "linear-gradient(rgba(13,148,136,0.18) 1px,transparent 1px),linear-gradient(90deg,rgba(13,148,136,0.18) 1px,transparent 1px)",
    backgroundSize: "60px 60px",
    WebkitMaskImage:
      "radial-gradient(ellipse 80% 80% at 50% 50%,transparent 30%,black 100%)",
    maskImage:
      "radial-gradient(ellipse 80% 80% at 50% 50%,transparent 30%,black 100%)",
    pointerEvents: "none",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        color: "#fff",
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
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .contact-card {
          display: flex;
          align-items: center;
          gap: 16px;
          border-radius: 16px;
          padding: 20px 24px;
          text-decoration: none;
          color: #fff;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          cursor: pointer;
        }
        .contact-card:hover {
          transform: translateY(-2px);
        }
        .contact-card-tg {
          background: rgba(13,148,136,0.07);
          border: 1px solid rgba(13,148,136,0.22);
        }
        .contact-card-tg:hover {
          background: rgba(13,148,136,0.14);
          border-color: rgba(13,148,136,0.5);
          box-shadow: 0 8px 32px rgba(13,148,136,0.12);
        }
        .contact-card-wa {
          background: rgba(37,211,102,0.06);
          border: 1px solid rgba(37,211,102,0.18);
        }
        .contact-card-wa:hover {
          background: rgba(37,211,102,0.12);
          border-color: rgba(37,211,102,0.4);
          box-shadow: 0 8px 32px rgba(37,211,102,0.10);
        }
      `}</style>

      {/* Grid background */}
      <div style={gridBg} />

      {/* Ambient glow */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          width: "700px",
          height: "350px",
          background:
            "radial-gradient(ellipse, rgba(13,148,136,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        style={{
          position: "absolute",
          top: "24px",
          left: "24px",
          background: "none",
          border: "1px solid #1e2e2e",
          color: "#6b7280",
          borderRadius: "10px",
          padding: "8px 16px",
          cursor: "pointer",
          fontSize: "13px",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: "6px",
          transition: "color 0.2s, border-color 0.2s",
          zIndex: 10,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "#0d9488";
          e.currentTarget.style.borderColor = "#0d9488";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "#6b7280";
          e.currentTarget.style.borderColor = "#1e2e2e";
        }}
      >
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
          maxWidth: "460px",
          width: "100%",
          textAlign: "center",
          animation: "fadeUp 0.6s ease both",
        }}
      >
        {/* Badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "rgba(13,148,136,0.1)",
            border: "1px solid rgba(13,148,136,0.25)",
            borderRadius: "999px",
            padding: "5px 14px",
            marginBottom: "20px",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#0d9488",
              boxShadow: "0 0 8px rgba(13,148,136,0.8)",
              display: "inline-block",
            }}
          />
          <span
            style={{
              color: "#0d9488",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            Support · 24/7
          </span>
        </div>

        <h1
          style={{
            fontSize: "clamp(30px,6vw,48px)",
            fontWeight: 900,
            color: "#fff",
            marginBottom: "12px",
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
          }}
        >
          Contact <span style={{ color: "#0d9488" }}>OmniDev</span> Support
        </h1>
        <p
          style={{
            color: "#6b7280",
            fontSize: "15px",
            lineHeight: 1.75,
            marginBottom: "36px",
            maxWidth: "380px",
            margin: "0 auto 36px",
          }}
        >
          Have questions or need help? Our support team is available around the
          clock via Telegram and WhatsApp.
        </p>

        {/* Contact cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Telegram */}
          <a
            href="https://t.me/YOUR_TELEGRAM_HANDLE"
            target="_blank"
            rel="noopener noreferrer"
            className="contact-card contact-card-tg"
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
                boxShadow: "0 4px 16px rgba(0,136,204,0.3)",
              }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.247l-2.02 9.52c-.148.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L6.862 14.48l-2.95-.924c-.642-.2-.654-.642.136-.953l11.527-4.445c.535-.194 1.003.13.987.089z" />
              </svg>
            </div>
            <div style={{ flex: 1, textAlign: "left" }}>
              <p
                style={{
                  fontWeight: 700,
                  fontSize: "15px",
                  margin: "0 0 3px",
                  color: "#f3f4f6",
                }}
              >
                Telegram
              </p>
              <p style={{ color: "#6b7280", fontSize: "13px", margin: 0 }}>
                @YOUR_TELEGRAM_HANDLE
              </p>
            </div>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0d9488"
              strokeWidth="2.5"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </a>

          {/* WhatsApp */}
          <a
            href="https://wa.me/YOUR_WHATSAPP_NUMBER"
            target="_blank"
            rel="noopener noreferrer"
            className="contact-card contact-card-wa"
          >
            <div
              style={{
                width: "50px",
                height: "50px",
                borderRadius: "14px",
                background: "#25D366",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: "0 4px 16px rgba(37,211,102,0.28)",
              }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </div>
            <div style={{ flex: 1, textAlign: "left" }}>
              <p
                style={{
                  fontWeight: 700,
                  fontSize: "15px",
                  margin: "0 0 3px",
                  color: "#f3f4f6",
                }}
              >
                WhatsApp
              </p>
              <p style={{ color: "#6b7280", fontSize: "13px", margin: 0 }}>
                Chat with our support team
              </p>
            </div>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#25D366"
              strokeWidth="2.5"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </a>
        </div>

        {/* Response time note */}
        <p
          style={{
            color: "#2e4040",
            fontSize: "12px",
            marginTop: "28px",
            lineHeight: 1.6,
          }}
        >
          Average response time: under 5 minutes
        </p>

        <div
          style={{
            width: "100%",
            height: "1px",
            background:
              "linear-gradient(to right, transparent, rgba(13,148,136,0.25), transparent)",
            margin: "28px 0 20px",
          }}
        />

        <p style={{ color: "#1e3030", fontSize: "11px" }}>
          © {new Date().getFullYear()} Omnidev Exchange Inc. All Rights
          Reserved.
        </p>
      </div>
    </div>
  );
};
