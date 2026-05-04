import { useEffect, useState } from "react";
import logo from "/src/images/omnidev logo.png";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase";

const ADMIN_EMAIL = "fiyinolaleke@gmail.com";

const NAV_LINKS = [
  { label: "How It Works", scrollKey: "__scrollToHowItWorks" },
  { label: "About Us", scrollKey: "__scrollToAboutUs" },
  { label: "FAQ", scrollKey: "__scrollToFAQ" },
  { label: "Contact", scrollKey: null, path: "/contact" },
];

const SIDEBAR_LINKS = [
  {
    label: "How It Works",
    scrollKey: "__scrollToHowItWorks",
    path: null,
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
    scrollKey: "__scrollToAboutUs",
    path: null,
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
    scrollKey: "__scrollToFAQ",
    path: null,
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
    label: "Contact",
    scrollKey: null,
    path: "/contact",
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
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === "/" || location.pathname === "/home";

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser || null);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
      document.body.style.top = `-${window.scrollY}px`;
    } else {
      const scrollY = document.body.style.top;
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.top = "";
      window.scrollTo(0, parseInt(scrollY || "0") * -1);
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.top = "";
    };
  }, [sidebarOpen]);

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setSidebarOpen(false);
    navigate("/");
  };

  const handleNavClick = (scrollKey, path) => {
    window.dispatchEvent(new Event("cursor-expand"));
    setSidebarOpen(false);

    // If it has a direct path (like /contact), navigate there
    if (path) {
      navigate(path);
      return;
    }

    if (!scrollKey) return;
    if (isHome) {
      setTimeout(() => {
        window[scrollKey]?.();
      }, 50);
    } else {
      navigate("/");
      setTimeout(() => {
        window[scrollKey]?.();
      }, 400);
    }
  };

  const isLoggedIn = !!user;
  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <>
      <div className="bg-[#0d9488] px-4 py-2.5 sm:py-3 flex flex-col sm:flex-row justify-between items-center text-xs sm:text-sm text-white gap-1 text-center">
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

      <nav className="sticky top-0 z-50 backdrop-blur-md bg-[#0a0a0a]/85 border-b border-[#1a1a1a] h-16 flex items-center justify-between px-4">
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            textDecoration: "none",
          }}
        >
          <img
            src={logo}
            alt="Omnidev logo"
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              objectFit: "cover",
            }}
          />
          <span style={{ color: "#fff", fontWeight: 700, fontSize: "17px" }}>
            Omnidev
          </span>
        </Link>

        <div
          className="hidden md:flex"
          style={{ alignItems: "center", gap: "32px" }}
        >
          {NAV_LINKS.map((l) => (
            <button
              key={l.label}
              onClick={() => handleNavClick(l.scrollKey, l.path)}
              onMouseEnter={() => {
                window.dispatchEvent(new Event("cursor-expand"));
              }}
              onMouseLeave={() => {
                window.dispatchEvent(new Event("cursor-shrink"));
              }}
              style={{
                background: "none",
                border: "none",
                color:
                  l.path === "/contact" && location.pathname === "/contact"
                    ? "#0d9488"
                    : "#9ca3af",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
                transition: "color 0.2s",
                padding: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#fff";
                window.dispatchEvent(new Event("cursor-expand"));
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color =
                  l.path === "/contact" && location.pathname === "/contact"
                    ? "#0d9488"
                    : "#9ca3af";
                window.dispatchEvent(new Event("cursor-shrink"));
              }}
            >
              {l.label}
            </button>
          ))}

          {isAdmin && (
            <Link to="/admin">
              <button
                style={{
                  background: "#dc2626",
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
                  e.currentTarget.style.background = "#b91c1c";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#dc2626";
                }}
              >
                Admin
              </button>
            </Link>
          )}

          {isLoggedIn ? (
            <Link to="/dashboard">
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
                Dashboard
              </button>
            </Link>
          ) : (
            <Link to="/login">
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
            </Link>
          )}
        </div>

        <button
          className="md:hidden flex flex-col items-end gap-1.5 p-1"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <span className="w-6 h-[2px] bg-white rounded"></span>
          <span className="w-6 h-[2px] bg-white rounded"></span>
          <span className="w-4 h-[2px] bg-teal-500 rounded"></span>
        </button>
      </nav>

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
              color: "#9ca3af",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "6px",
              transition: "color 0.2s, background 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#fff";
              e.currentTarget.style.background = "rgba(255,255,255,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#9ca3af";
              e.currentTarget.style.background = "transparent";
            }}
            aria-label="Close sidebar"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <nav style={{ padding: "16px 0", flex: 1, overflowY: "auto" }}>
          {SIDEBAR_LINKS.map((item, i) => (
            <button
              key={item.label}
              onClick={() => handleNavClick(item.scrollKey, item.path)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "14px",
                padding: "16px 24px",
                marginBottom: "8px",
                color: "#e5e7eb",
                background: "transparent",
                border: "none",
                fontSize: "15px",
                fontWeight: 600,
                borderLeft: "3px solid transparent",
                cursor: "pointer",
                textAlign: "left",
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
            </button>
          ))}

          {isAdmin && (
            <Link to="/admin" onClick={() => setSidebarOpen(false)}>
              <button
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: "16px 24px",
                  marginBottom: "8px",
                  color: "#ef4444",
                  background: "transparent",
                  border: "none",
                  fontSize: "15px",
                  fontWeight: 600,
                  borderLeft: "3px solid transparent",
                  cursor: "pointer",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(239,68,68,0.07)";
                  e.currentTarget.style.borderLeftColor = "#ef4444";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderLeftColor = "transparent";
                }}
              >
                <span style={{ color: "#ef4444", flexShrink: 0 }}>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </span>
                Admin Dashboard
              </button>
            </Link>
          )}
        </nav>

        <div style={{ padding: "20px", borderTop: "1px solid #1e1e1e" }}>
          {isLoggedIn ? (
            <>
              <div
                style={{
                  padding: "12px 0",
                  marginBottom: "12px",
                  borderBottom: "1px solid #1e1e1e",
                }}
              >
                <p
                  style={{
                    color: "#6b7280",
                    fontSize: "11px",
                    marginBottom: "4px",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Signed in as
                </p>
                <p
                  style={{
                    color: "#fff",
                    fontSize: "14px",
                    fontWeight: 600,
                    wordBreak: "break-all",
                  }}
                >
                  {user?.email}
                </p>
              </div>
              <Link to="/dashboard" onClick={() => setSidebarOpen(false)}>
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
                    transform: sidebarOpen
                      ? "translateY(0)"
                      : "translateY(10px)",
                    transition:
                      "opacity 0.3s ease 0.38s, transform 0.3s ease 0.38s, background 0.2s",
                  }}
                >
                  Go to Dashboard
                </button>
              </Link>
            </>
          ) : (
            <>
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
              <Link to="/signup" onClick={() => setSidebarOpen(false)}>
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
                    marginBottom: "10px",
                    opacity: sidebarOpen ? 1 : 0,
                    transform: sidebarOpen
                      ? "translateY(0)"
                      : "translateY(10px)",
                    transition:
                      "opacity 0.3s ease 0.38s, transform 0.3s ease 0.38s, background 0.2s",
                  }}
                >
                  Get Started
                </button>
              </Link>
              <Link to="/login" onClick={() => setSidebarOpen(false)}>
                <button
                  style={{
                    width: "100%",
                    background: "transparent",
                    color: "#9ca3af",
                    fontWeight: 600,
                    fontSize: "14px",
                    padding: "11px",
                    borderRadius: "10px",
                    border: "1px solid #374151",
                    cursor: "pointer",
                    marginTop: "8px",
                    transition: "all 0.2s",
                  }}
                >
                  Login
                </button>
              </Link>
            </>
          )}
        </div>
      </aside>
    </>
  );
};
