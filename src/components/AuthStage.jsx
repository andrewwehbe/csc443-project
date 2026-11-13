import { useEffect, useMemo, useRef } from 'react';

// The liquid panel behind Sign in and Register. The page is the same paper as the rest of the app.
// The bubbles are navy, and the goo filter joins them where they meet without a second blur.
export default function AuthStage({ kicker = 'Ghurfa', title, hint, children, links }) {
  const blobRefs = useRef([]);
  const blobs = useMemo(() => Array.from({ length: 6 }, () => ({
    size: Math.random() * 200 + 150,
    left: Math.random() * 80 + 10,
    top: Math.random() * 80 + 10,
    animationDelay: Math.random() * -20,
    animationDuration: Math.random() * 15 + 15,
  })), []);

  useEffect(() => {
    function handleMouseMove(e) {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      blobRefs.current.forEach((blob, index) => {
        if (!blob) return;
        const speed = (index + 1) * 16;
        blob.style.marginLeft = `${x * speed}px`;
        blob.style.marginTop = `${y * speed}px`;
      });
    }
    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section className="auth-stage">
      <style>{`
        .auth-stage {
          --bg: var(--color-paper);
          --mercury: var(--color-brand-400);
          --text: var(--color-ink);
          --text-dim: var(--color-muted);
          position: relative;
          display: flex;
          flex: 1;
          align-items: safe center;
          justify-content: center;
          overflow: auto;
          min-height: 100%;
          background: var(--bg);
          color: var(--text);
          font-family: var(--font-body);
        }
        .auth-stage .stage {
          position: absolute;
          inset: 0;
          z-index: 0;
          overflow: hidden;
          pointer-events: none;
          filter: url('#auth-goo');
        }
        .auth-stage .blob {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle at 32% 28%, var(--color-brand-100), var(--color-brand-400) 34%, var(--color-brand-700) 72%, var(--color-brand-900));
          animation: auth-float 20s infinite alternate ease-in-out;
          transition: margin 0.1s ease-out;
        }
        @keyframes auth-float {
          0% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(8vw, 16vh) scale(1.15); }
          66% { transform: translate(-4vw, 8vh) scale(0.85); }
          100% { transform: translate(4vw, -8vh) scale(1.05); }
        }
        .auth-stage .auth {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 28rem;
          padding: 3rem 1.5rem;
        }
        .auth-stage .kicker {
          display: block;
          margin-bottom: 0.75rem;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--text-dim);
        }
        .auth-stage h1 {
          margin: 0;
          font-family: var(--font-display);
          font-size: clamp(3rem, 8vw, 4.5rem);
          font-weight: 700;
          line-height: 0.9;
          letter-spacing: -0.04em;
        }
        .auth-stage .hint {
          margin-top: 1rem;
          font-size: 0.875rem;
          color: var(--text-dim);
        }
        .auth-stage .field {
          position: relative;
          margin-top: 1.6rem;
          transition: transform 0.4s cubic-bezier(0.2, 1, 0.3, 1);
        }
        .auth-stage .field:focus-within { transform: translateX(8px); }
        .auth-stage label {
          display: block;
          margin-bottom: 0.6rem;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--text-dim);
        }
        .auth-stage input {
          width: 100%;
          border: none;
          border-bottom: 1px solid var(--color-line);
          background: transparent;
          padding: 0.7rem 0;
          font-size: 1.05rem;
          color: var(--text);
          outline: none;
        }
        .auth-stage input::placeholder { color: var(--color-muted); }
        .auth-stage .control { position: relative; }
        .auth-stage .glow {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 2px;
          background: var(--color-accent-400);
          box-shadow: 0 0 14px var(--color-accent-400);
          transition: width 0.5s cubic-bezier(0.2, 1, 0.3, 1);
        }
        .auth-stage input:focus + .glow { width: 100%; }
        .auth-stage .note {
          margin-top: 0.45rem;
          font-size: 0.75rem;
          color: var(--text-dim);
        }
        .auth-stage .error {
          margin-top: 1.25rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: rgb(185 28 28);
        }
        .auth-stage .submit {
          position: relative;
          margin-top: 2.25rem;
          filter: url('#auth-button');
        }
        .auth-stage .drop {
          position: absolute;
          top: 50%;
          left: 50%;
          z-index: 0;
          width: 100%;
          height: 100%;
          border-radius: 2px;
          background: var(--mercury);
          transform: translate(-50%, -50%);
          transition: transform 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .auth-stage .submit:hover .drop { transform: translate(-50%, -50%) scale(1.04, 1.18); }
        .auth-stage button {
          position: relative;
          z-index: 1;
          width: 100%;
          border: none;
          background: var(--color-brand-800);
          padding: 1.05rem 1.5rem;
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--color-paper);
          cursor: pointer;
          transition: letter-spacing 0.3s;
        }
        .auth-stage button:hover { letter-spacing: 0.22em; }
        .auth-stage .links {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          margin-top: 2rem;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
        .auth-stage .links a {
          color: var(--text-dim);
          text-decoration: none;
        }
        .auth-stage .links a:hover { color: var(--text); }
      `}</style>

      <svg className="absolute h-0 w-0" aria-hidden="true">
        <defs>
          <filter id="auth-goo" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation="16" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9" result="goo" />
          </filter>
          <filter id="auth-button" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      <div className="stage" aria-hidden="true">
        {blobs.map((blob, index) => (
          <div
            key={index}
            ref={(el) => { blobRefs.current[index] = el; }}
            className="blob"
            style={{
              width: `${blob.size}px`,
              height: `${blob.size}px`,
              left: `${blob.left}%`,
              top: `${blob.top}%`,
              animationDelay: `${blob.animationDelay}s`,
              animationDuration: `${blob.animationDuration}s`,
            }}
          />
        ))}
      </div>

      <div className="auth">
        <span className="kicker">{kicker}</span>
        <h1>{title}</h1>
        {hint && <p className="hint">{hint}</p>}
        {children}
        {links && <p className="links">{links}</p>}
      </div>
    </section>
  );
}

export function AuthField({ id, label, note, ...inputProps }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="control">
        <input id={id} {...inputProps} />
        <div className="glow" />
      </div>
      {note && <p className="note">{note}</p>}
    </div>
  );
}
