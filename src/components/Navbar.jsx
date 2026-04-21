import { useEffect, useState } from "react";
import logo from "/src/images/omnidev logo.png";

const NAV_LINKS = ["How It Works", "About Us", "FAQ", "Contact"];

const SIDEBAR_LINKS = [
  {
    label: "How It Works",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4l3 3" />
      </svg>
    ),
  },
  {
    label: "About Us",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: "FAQ",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  {
    label: "Markets",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    label: "Trade",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    label: "Contact",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
];

export const Navbar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Lock body scroll when sidebar is open
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  return (
    <>
      {/* ── Top banner ── */}
      <div className="bg-[#0d9488] px-4 py-3 flex flex-col sm:flex-row justify-between items-center text-sm text-white gap-1 text-center">
        <span>
          Join now and get <strong>free $100 credits</strong> on the first
          deposit.
        </span>
        <span className="flex items-center gap-2 text-teal-200">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
          support@omnidev.co
        </span>
      </div>

      {/* ── Main nav ── */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(10,10,10,0.85)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #1a1a1a",
          padding: "0 24px",
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img
            src={logo}
            alt="Omnidev logo"
            style={{
              width: "50px",
              height: "50px",
              borderRadius: "50%",
              objectFit: "cover",
            }}
          />
          <span style={{ color: "#fff", fontWeight: 700, fontSize: "17px" }}>
            Omnidev
          </span>
        </div>

        {/* Desktop links */}
        <div
          className="hidden md:flex"
          style={{ alignItems: "center", gap: "36px" }}
        >
          {NAV_LINKS.map((l) => (
            <a
              key={l}
              href="#"
              style={{
                color: "#9ca3af",
                fontSize: "14px",
                fontWeight: 500,
                textDecoration: "none",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#9ca3af";
              }}
            >
              {l}
            </a>
          ))}
          <button
            style={{
              background: "#0d9488",
              color: "#fff",
              fontWeight: 600,
              fontSize: "14px",
              padding: "9px 22px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#0f766e";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#0d9488";
            }}
          >
            Login
          </button>
        </div>

        {/* Hamburger — mobile only */}
        <button
          className="md:hidden flex flex-col items-end gap-1 p-1"
          onClick={() => setSidebarOpen(true)}
        >
          <span className="w-6 h-[2px] bg-white rounded"></span>
          <span className="w-6 h-[2px] bg-white rounded"></span>
          <span className="w-4 h-[2px] bg-teal-600 rounded"></span>
        </button>
      </nav>

      {/* ── Sidebar overlay ── */}
      <div
        onClick={() => setSidebarOpen(false)}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.65)",
          zIndex: 60,
          opacity: sidebarOpen ? 1 : 0,
          pointerEvents: sidebarOpen ? "auto" : "none",
          transition: "opacity 0.3s ease",
        }}
      />

      {/* ── Sidebar panel — slides in from RIGHT ── */}
      <aside
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100%",
          width: "280px",
          background: "#0a0a0a",
          borderLeft: "1px solid #1e1e1e",
          zIndex: 70,
          display: "flex",
          flexDirection: "column",
          transform: sidebarOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {/* Sidebar header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 20px 16px",
            borderBottom: "1px solid #1e1e1e",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <img
              src={logo}
              alt="Omnidev logo"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
            <span
              style={{
                color: "#0d9488",
                fontWeight: 800,
                fontSize: "17px",
                letterSpacing: "0.04em",
              }}
            >
              OmniDev
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#9ca3af",
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Sidebar nav links with icons */}
        <nav style={{ padding: "16px 0", flex: 1, overflowY: "auto" }}>
          {SIDEBAR_LINKS.map((item, i) => (
            <a
              key={item.label}
              href="#"
              onClick={() => setSidebarOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                padding: "13px 24px",
                color: "#e5e7eb",
                textDecoration: "none",
                fontSize: "15px",
                fontWeight: 600,
                borderLeft: "3px solid transparent",
                opacity: sidebarOpen ? 1 : 0,
                transform: sidebarOpen ? "translateX(0)" : "translateX(12px)",
                transition: `opacity 0.3s ease ${0.07 + i * 0.055}s, transform 0.3s ease ${0.07 + i * 0.055}s, color 0.2s, background 0.2s, border-color 0.2s`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#0d9488";
                e.currentTarget.style.borderLeftColor = "#0d9488";
                e.currentTarget.style.background = "rgba(13,148,136,0.07)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#e5e7eb";
                e.currentTarget.style.borderLeftColor = "transparent";
                e.currentTarget.style.background = "transparent";
              }}
            >
              <span style={{ color: "#0d9488", flexShrink: 0 }}>
                {item.icon}
              </span>
              {item.label}
            </a>
          ))}
        </nav>

        {/* Sidebar CTA */}
        <div style={{ padding: "20px", borderTop: "1px solid #1e1e1e" }}>
          <p
            style={{
              color: "#6b7280",
              fontSize: "12px",
              marginBottom: "12px",
              textAlign: "center",
            }}
          >
            Ready to start trading?
          </p>
          <button
            style={{
              width: "100%",
              background: "#0d9488",
              color: "#fff",
              fontWeight: 700,
              fontSize: "14px",
              padding: "12px",
              borderRadius: "10px",
              border: "none",
              cursor: "pointer",
              opacity: sidebarOpen ? 1 : 0,
              transform: sidebarOpen ? "translateY(0)" : "translateY(10px)",
              transition:
                "opacity 0.3s ease 0.38s, transform 0.3s ease 0.38s, background 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#0f766e";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#0d9488";
            }}
          >
            Get Started
          </button>
        </div>
      </aside>
    </>
  );
};
