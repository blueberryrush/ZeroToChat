/**
 * PIXEL HAVEN  ·  Cozy 16-Bit City & Proximity Cafe
 * ---------------------------------------------------
 * A polished, full-viewport retro multiplayer toy for the CometChat hackathon.
 *
 *  Scenes :  select  ->  street (city)  ->  cafe (interior)  ->  booth (cinematic close-up)
 *  Net    :  CometChat CustomMessage("SYNC_ALL") @ ~65ms  +  TextMessage for chat
 *
 *  Real-time design notes:
 *   - High-frequency position/costume/scene sync is sent through a throttled
 *     CustomMessage so both clients feel lag-free.
 *   - The booth is *mutually* synchronised: when one player sits down the other
 *     is pulled into the same cinematic screen automatically (and back out again).
 */
import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { CometChat } from "@cometchat/chat-sdk-javascript";

/* ------------------------------------------------------------------ *
 *  Environment / credentials
 * ------------------------------------------------------------------ */
const APP_ID = import.meta.env.VITE_COMETCHAT_APP_ID;
const REGION = import.meta.env.VITE_COMETCHAT_REGION;
const AUTH_KEY = import.meta.env.VITE_COMETCHAT_AUTH_KEY;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

/* ------------------------------------------------------------------ *
 *  Character roster - 2 boys, 2 girls, all hand-tuned pixel palettes
 * ------------------------------------------------------------------ */
const CHARACTERS = [
  {
    id: "alex",
    name: "Alex",
    gender: "Male",
    uid: "cometchat-uid-1",
    target: "cometchat-uid-2",
    title: "Hoodie Wanderer",
    hair: "spiky",
    hairMain: "#f6c445",
    hairDark: "#cf9a1c",
    hairShine: "#ffe59a",
    skin: "#f7c9a0",
    skinShade: "#dfa274",
    eye: "#2f6fdb",
    mouth: "#9a4a3a",
    outfit: "hoodie",
    top: "#12a870",
    topDark: "#0a7a54",
    topTrim: "#5eead4",
    bottom: "#2f68e0",
    bottomDark: "#1e40af",
    shoe: "#f8fafc",
    shoeDark: "#cbd5e1",
    accent: "#34d399",
  },
  {
    id: "maya",
    name: "Maya",
    gender: "Female",
    uid: "cometchat-uid-2",
    target: "cometchat-uid-1",
    title: "Midnight Biker",
    hair: "bob",
    hairMain: "#1a1a1e",
    hairDark: "#000000",
    hairShine: "#52525b",
    skin: "#f4c6a1",
    skinShade: "#dca379",
    eye: "#3f2a1d",
    mouth: "#c2416b",
    outfit: "jacket",
    top: "#e11d48",
    topDark: "#9f1239",
    topTrim: "#fb7185",
    bottom: "#3f4657",
    bottomDark: "#1f2937",
    shoe: "#dc2626",
    shoeDark: "#7f1d1d",
    accent: "#fb7185",
  },
  {
    id: "chloe",
    name: "Chloe",
    gender: "Female",
    uid: "cometchat-uid-3",
    target: "cometchat-uid-1",
    title: "Knit & Honey",
    hair: "buns",
    hairMain: "#b45309",
    hairDark: "#7c2d12",
    hairShine: "#e0892a",
    skin: "#f8cfae",
    skinShade: "#e0ad86",
    eye: "#7a5230",
    mouth: "#c2566f",
    outfit: "sweater",
    top: "#a78bfa",
    topDark: "#7c3aed",
    topTrim: "#ede9fe",
    bottom: "#f472b6",
    bottomDark: "#be185d",
    shoe: "#92400e",
    shoeDark: "#5b2a08",
    accent: "#ddd6fe",
  },
  {
    id: "leo",
    name: "Leo",
    gender: "Male",
    uid: "cometchat-uid-4",
    target: "cometchat-uid-1",
    title: "Neon Courier",
    hair: "parted",
    hairMain: "#e5e7eb",
    hairDark: "#9ca3af",
    hairShine: "#ffffff",
    skin: "#f7c9a0",
    skinShade: "#dfa274",
    eye: "#1f8f9c",
    mouth: "#9a4a3a",
    outfit: "windbreaker",
    top: "#06b6d4",
    topDark: "#0e7490",
    topTrim: "#67e8f9",
    bottom: "#111827",
    bottomDark: "#030712",
    shoe: "#14b8a6",
    shoeDark: "#0f766e",
    accent: "#22d3ee",
  },
];

/* ------------------------------------------------------------------ *
 *  Pixel sprite - layered rects on a 20x28 grid, crisp edges
 * ------------------------------------------------------------------ */
function PixelChar({
  variant = 0,
  facing = "right",
  walking = false,
  sitting = false,
  scale = 4,
}) {
  const c = CHARACTERS[variant] || CHARACTERS[0];
  const girl = c.gender === "Female";
  const flip = facing === "left";
  const w = 20 * scale;
  const h = 28 * scale;

  return (
    <div
      className="pchar"
      style={{ width: w, height: h }}
      aria-hidden="true"
    >
      <div
        className="pchar-flip"
        style={{ transform: flip ? "scaleX(-1)" : "none" }}
      >
        <div className={walking ? "pchar-bob walk" : "pchar-bob idle"}>
          <svg
            viewBox="0 0 20 28"
            width="100%"
            height="100%"
            shapeRendering="crispEdges"
          >
            {/* ground shadow */}
            <ellipse cx="10" cy="27" rx="6.2" ry="1.3" fill="rgba(0,0,0,0.38)" />

            {/* ---- legs ---- */}
            {!sitting ? (
              <>
                <rect x="6.3" y="19" width="2.9" height="4.7" fill={c.bottom} />
                <rect x="10.8" y="19" width="2.9" height="4.7" fill={c.bottom} />
                <rect x="6.3" y="19" width="1" height="4.7" fill={c.bottomDark} />
                <rect x="10.8" y="19" width="1" height="4.7" fill={c.bottomDark} />
                <rect x="5.9" y="23.5" width="3.7" height="2.2" fill={c.shoe} />
                <rect x="10.4" y="23.5" width="3.7" height="2.2" fill={c.shoe} />
                <rect x="5.9" y="25.2" width="3.7" height="0.8" fill={c.shoeDark} />
                <rect x="10.4" y="25.2" width="3.7" height="0.8" fill={c.shoeDark} />
              </>
            ) : (
              <>
                <rect x="6" y="18.6" width="8" height="3" fill={c.bottom} />
                <rect x="6" y="20.8" width="8" height="0.8" fill={c.bottomDark} />
                <rect x="11.4" y="19.2" width="2.9" height="4.5" fill={c.bottom} />
                <rect x="6.1" y="19.2" width="2.7" height="4.5" fill={c.bottomDark} />
                <rect x="11.1" y="23.4" width="3.8" height="2.2" fill={c.shoe} />
                <rect x="11.1" y="25.1" width="3.8" height="0.8" fill={c.shoeDark} />
              </>
            )}

            {/* ---- torso / outfit ---- */}
            {renderOutfit(c)}

            {/* ---- arms ---- */}
            <rect x="3.9" y="14" width="2.1" height="4.9" fill={c.top} />
            <rect x="14" y="14" width="2.1" height="4.9" fill={c.top} />
            <rect x="3.9" y="17.7" width="2.1" height="1.2" fill={c.topDark} />
            <rect x="14" y="17.7" width="2.1" height="1.2" fill={c.topDark} />
            <rect x="3.9" y="18.3" width="2.1" height="1.4" fill={c.skin} />
            <rect x="14" y="18.3" width="2.1" height="1.4" fill={c.skin} />

            {/* ---- back hair ---- */}
            {renderBackHair(c)}

            {/* ---- head ---- */}
            <rect x="4.6" y="4" width="10.8" height="9.3" fill={c.skin} />
            <rect x="4.6" y="11.4" width="10.8" height="1.9" fill={c.skinShade} opacity="0.65" />
            <rect x="3.8" y="8" width="1" height="2.3" fill={c.skin} />
            <rect x="15.2" y="8" width="1" height="2.3" fill={c.skin} />
            <rect x="8.3" y="12.3" width="3.4" height="1.8" fill={c.skinShade} />

            {/* ---- face ---- */}
            <rect x="6.5" y="7.5" width="2.5" height="2.7" fill="#ffffff" />
            <rect x="11" y="7.5" width="2.5" height="2.7" fill="#ffffff" />
            <rect x="7.3" y="8" width="1.5" height="2" fill={c.eye} />
            <rect x="11.2" y="8" width="1.5" height="2" fill={c.eye} />
            <rect x="7.35" y="8.05" width="0.7" height="0.7" fill="#ffffff" />
            <rect x="11.25" y="8.05" width="0.7" height="0.7" fill="#ffffff" />
            {girl ? (
              <>
                <rect x="6.3" y="7.2" width="3" height="0.7" fill={c.hairDark} />
                <rect x="10.7" y="7.2" width="3" height="0.7" fill={c.hairDark} />
                <rect x="6.3" y="7.2" width="0.6" height="1.3" fill={c.hairDark} />
                <rect x="14.1" y="7.2" width="0.6" height="1.3" fill={c.hairDark} />
                <rect x="6.7" y="6.6" width="2" height="0.45" fill={c.hairDark} opacity="0.85" />
                <rect x="11.3" y="6.6" width="2" height="0.45" fill={c.hairDark} opacity="0.85" />
              </>
            ) : (
              <>
                <rect x="6.6" y="6.6" width="2.2" height="0.55" fill={c.hairDark} />
                <rect x="11.2" y="6.6" width="2.2" height="0.55" fill={c.hairDark} />
              </>
            )}
            <rect x="5.1" y="9.6" width="2.1" height="1.2" fill="#f472b6" opacity="0.5" />
            <rect x="12.8" y="9.6" width="2.1" height="1.2" fill="#f472b6" opacity="0.5" />
            <rect x="9.7" y="9.8" width="0.7" height="0.7" fill={c.skinShade} />
            <rect x="9.3" y="10.8" width="1.5" height="0.8" fill={c.mouth} />

            {/* ---- front hair / fringe ---- */}
            {renderFrontHair(c)}
          </svg>
        </div>
      </div>
    </div>
  );
}

/* --- outfit painter: all on the 20x28 grid --- */
function renderOutfit(c) {
  switch (c.outfit) {
    case "hoodie":
      return (
        <>
          <rect x="6.2" y="12.2" width="7.6" height="2.4" fill={c.topDark} />
          <rect x="5.1" y="13" width="9.8" height="6.6" fill={c.top} />
          <rect x="5.1" y="17.6" width="9.8" height="2" fill={c.topDark} />
          <rect x="7.2" y="15.4" width="5.6" height="2.6" fill={c.topDark} opacity="0.8" />
          <rect x="8.6" y="13.4" width="0.5" height="2.3" fill="#f8fafc" />
          <rect x="10.9" y="13.4" width="0.5" height="2.3" fill="#f8fafc" />
          <rect x="7.6" y="13.1" width="3.2" height="0.5" fill={c.topTrim} />
        </>
      );
    case "jacket":
      return (
        <>
          <rect x="6.9" y="12.5" width="6.2" height="1.3" fill={c.topDark} />
          <rect x="5.1" y="13" width="9.8" height="5.7" fill={c.top} />
          <rect x="5.1" y="17.6" width="9.8" height="1.1" fill={c.topDark} />
          <rect x="6.9" y="13" width="1.7" height="4.2" fill={c.topDark} />
          <rect x="11.4" y="13" width="1.7" height="4.2" fill={c.topDark} />
          <rect x="9.7" y="13" width="0.6" height="5.7" fill="#fbbf24" />
          <rect x="9.4" y="13" width="1.2" height="0.7" fill="#fbbf24" />
          <rect x="7.2" y="18.3" width="5.6" height="0.7" fill={c.topTrim} />
        </>
      );
    case "sweater":
      return (
        <>
          <rect x="7" y="12.3" width="6" height="1.3" fill={c.topDark} />
          <rect x="4.9" y="12.9" width="10.2" height="7.4" fill={c.top} />
          <rect x="4.9" y="19.2" width="10.2" height="1.1" fill={c.topDark} />
          <rect x="6.4" y="13.6" width="0.5" height="5.2" fill={c.topDark} opacity="0.7" />
          <rect x="9.4" y="13.6" width="0.5" height="5.2" fill={c.topDark} opacity="0.7" />
          <rect x="12.4" y="13.6" width="0.5" height="5.2" fill={c.topDark} opacity="0.7" />
          <rect x="7" y="12.6" width="6" height="0.5" fill={c.topTrim} />
        </>
      );
    case "windbreaker":
      return (
        <>
          <rect x="6.9" y="12.4" width="6.2" height="1.3" fill={c.topDark} />
          <rect x="5.1" y="13" width="9.8" height="6.4" fill={c.top} />
          <rect x="5.1" y="15.3" width="9.8" height="1.2" fill={c.topTrim} />
          <rect x="5.1" y="17.8" width="9.8" height="1.6" fill={c.topDark} />
          <rect x="9.7" y="13" width="0.6" height="6.4" fill={c.topTrim} />
          <rect x="7" y="12.7" width="6" height="0.5" fill={c.topTrim} />
        </>
      );
    default:
      return <rect x="5.1" y="13" width="9.8" height="6.6" fill={c.top} />;
  }
}

/* --- hair painters --- */
function renderBackHair(c) {
  switch (c.hair) {
    case "spiky":
      return (
        <>
          <rect x="4.2" y="3.3" width="11.6" height="4.6" fill={c.hairMain} />
          <rect x="3.7" y="5" width="2" height="4" fill={c.hairMain} />
          <rect x="14.3" y="5" width="2" height="4" fill={c.hairMain} />
        </>
      );
    case "bob":
      return (
        <>
          <rect x="3.5" y="3.4" width="13" height="7.8" fill={c.hairMain} />
          <rect x="3.1" y="6.4" width="2.7" height="6.4" fill={c.hairMain} />
          <rect x="14.2" y="6.4" width="2.7" height="6.4" fill={c.hairMain} />
        </>
      );
    case "buns":
      return (
        <>
          <rect x="4.3" y="4" width="11.4" height="6.2" fill={c.hairMain} />
          <circle cx="4.6" cy="3.6" r="2.3" fill={c.hairMain} />
          <circle cx="15.4" cy="3.6" r="2.3" fill={c.hairMain} />
          <circle cx="4.6" cy="3.6" r="0.9" fill={c.hairShine} opacity="0.7" />
          <circle cx="15.4" cy="3.6" r="0.9" fill={c.hairShine} opacity="0.7" />
          <rect x="4.3" y="6.9" width="1.8" height="4.4" fill={c.hairMain} />
          <rect x="13.9" y="6.9" width="1.8" height="4.4" fill={c.hairMain} />
        </>
      );
    case "parted":
      return (
        <>
          <rect x="4.3" y="3.4" width="11.4" height="4.8" fill={c.hairMain} />
          <rect x="13.8" y="6.4" width="1.9" height="3.2" fill={c.hairMain} />
        </>
      );
    default:
      return <rect x="4.3" y="3.4" width="11.4" height="5" fill={c.hairMain} />;
  }
}

function renderFrontHair(c) {
  switch (c.hair) {
    case "spiky":
      return (
        <>
          <rect x="5" y="1.7" width="2.2" height="2.3" fill={c.hairMain} />
          <rect x="7.8" y="0.9" width="2.6" height="2.9" fill={c.hairMain} />
          <rect x="10.8" y="1.7" width="2.2" height="2.3" fill={c.hairMain} />
          <rect x="13.2" y="2.9" width="1.9" height="1.9" fill={c.hairMain} />
          <rect x="4.6" y="6" width="10.8" height="1.6" fill={c.hairMain} />
          <rect x="6" y="7.1" width="2.2" height="0.9" fill={c.hairMain} />
          <rect x="8.8" y="7" width="2.6" height="1" fill={c.hairMain} />
          <rect x="12.1" y="7.1" width="2.1" height="0.9" fill={c.hairMain} />
          <rect x="6.4" y="3.9" width="3.2" height="1" fill={c.hairShine} opacity="0.8" />
        </>
      );
    case "bob":
      return (
        <>
          <rect x="4.6" y="5.9" width="10.8" height="1.5" fill={c.hairMain} />
          <rect x="6.1" y="7.1" width="2.1" height="0.8" fill={c.hairMain} />
          <rect x="9" y="7.1" width="2.3" height="0.8" fill={c.hairMain} />
          <rect x="12.1" y="7.1" width="2.1" height="0.8" fill={c.hairMain} />
          <rect x="6.2" y="4.1" width="3" height="1" fill={c.hairShine} opacity="0.75" />
        </>
      );
    case "buns":
      return (
        <>
          <rect x="5.5" y="6.1" width="9" height="1.4" fill={c.hairMain} />
          <rect x="9.6" y="5.9" width="0.7" height="1.7" fill={c.hairShine} opacity="0.5" />
          <rect x="7" y="4.2" width="2.5" height="1" fill={c.hairShine} opacity="0.7" />
        </>
      );
    case "parted":
      return (
        <>
          <rect x="4.6" y="5.5" width="3.3" height="1.7" fill={c.hairMain} />
          <rect x="7.6" y="5.3" width="8" height="2.7" fill={c.hairMain} />
          <rect x="9" y="3.9" width="3.6" height="1" fill={c.hairShine} opacity="0.8" />
        </>
      );
    default:
      return <rect x="4.6" y="5.8" width="10.8" height="1.6" fill={c.hairMain} />;
  }
}

/* ------------------------------------------------------------------ *
 *  Coffee mug with animated steam
 * ------------------------------------------------------------------ */
function Steam({ delay = 0 }) {
  return (
    <svg
      className="steam"
      viewBox="0 0 40 64"
      width="34"
      height="54"
      style={{ animationDelay: `${delay}s` }}
      aria-hidden="true"
    >
      <path
        d="M20 60 C13 50 27 44 20 33 C13 22 27 16 20 5"
        fill="none"
        stroke="#f8fafc"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.85"
      />
      <path
        d="M26 58 C21 50 31 43 26 34"
        fill="none"
        stroke="#f8fafc"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}

function Mug({ size = 60 }) {
  const w = size;
  const h = (size / 34) * 30;
  return (
    <div className="mug" style={{ width: w, height: h + 54 }}>
      <div className="steam-wrap">
        <Steam delay={0} />
        <Steam delay={1.1} />
      </div>
      <svg viewBox="0 0 34 30" width={w} height={h} shapeRendering="geometricPrecision" aria-hidden="true">
        <ellipse cx="17" cy="27" rx="13" ry="3" fill="rgba(0,0,0,0.4)" />
        <path
          d="M27 14 q9 0 9 6 q0 6 -9 6"
          fill="none"
          stroke="#f8fafc"
          strokeWidth="3"
        />
        <rect x="5" y="11" width="24" height="16" rx="3" fill="#f8fafc" />
        <rect x="5" y="11" width="24" height="4" rx="2" fill="#e2e8f0" />
        <ellipse cx="17" cy="12" rx="11" ry="3.2" fill="#3b2417" />
        <ellipse cx="14" cy="11.4" rx="4" ry="1.2" fill="#6b4226" />
        <rect x="5" y="17" width="24" height="10" fill="#f1f5f9" opacity="0.5" />
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  Actor wrapper (shadow, name tag, sprite, speech bubble)
 * ------------------------------------------------------------------ */
function Actor({
  variant,
  pos,
  facing,
  walking,
  sitting,
  label,
  labelColor,
  bubble,
  scale = 4,
  showLabel = true,
}) {
  return (
    <div
      className="actor"
      style={{ left: `${pos.x}%`, top: `${pos.y}%`, zIndex: Math.round(pos.y) + 10 }}
    >
      {bubble && <div className="speech-bubble">{bubble}</div>}
      {showLabel && (
        <div className="nametag" style={{ color: labelColor, borderColor: labelColor }}>
          {label}
        </div>
      )}
      <PixelChar
        variant={variant}
        facing={facing}
        walking={walking}
        sitting={sitting}
        scale={scale}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  Street atmospheric pieces (decor generated once, at module load)
 * ------------------------------------------------------------------ */
const STAR_FIELD = Array.from({ length: 70 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 34,
  s: Math.random() * 2.4 + 1.2,
  d: Math.random() * 3,
  o: Math.random() * 0.6 + 0.4,
}));

const SKYLINE_BUILDINGS = Array.from({ length: 16 }, (_, i) => ({
  id: i,
  left: (i / 16) * 100 - 2,
  w: 5 + Math.random() * 4,
  h: 40 + Math.random() * 60,
  dark: i % 2 === 0 ? "#0c1029" : "#111737",
  lit: Math.random() > 0.35,
}));

function Stars() {
  return (
    <div className="starfield">
      {STAR_FIELD.map((st) => (
        <span
          key={st.id}
          className="star"
          style={{
            left: `${st.x}%`,
            top: `${st.y}%`,
            width: st.s,
            height: st.s,
            opacity: st.o,
            animationDelay: `${st.d}s`,
          }}
        />
      ))}
    </div>
  );
}

function Skyline() {
  return (
    <div className="skyline">
      {SKYLINE_BUILDINGS.map((b) => (
        <div
          key={b.id}
          className="building"
          style={{ left: `${b.left}%`, width: `${b.w}%`, height: `${b.h}%`, background: b.dark }}
        >
          <div className="windows">
            {Array.from({ length: 12 }, (_, wi) => (
              <span
                key={wi}
                className="bwin"
                style={{
                  opacity: b.lit && (wi * 7 + b.id) % 3 === 0 ? 0.9 : 0.12,
                  background: (wi + b.id) % 2 ? "#fcd34d" : "#93c5fd",
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Storefront({ shop, near, parallax }) {
  const neon = shop.neon;
  return (
    <div className="shop" style={{ transform: `translateX(${parallax}px)` }}>
      <div className="shop-roof" style={{ background: shop.roof }} />
      <div className="shop-sign" style={{ background: neon, color: shop.ink, boxShadow: `0 0 14px ${neon}, 0 0 30px ${neon}66` }}>
        <span className="shop-icon">{shop.icon}</span>
        <span className="shop-name">{shop.name}</span>
      </div>
      <div className="shop-body" style={{ background: shop.wall }}>
        <div className="awning" style={{ background: `repeating-linear-gradient(90deg, ${neon} 0 12px, ${shop.wall} 12px 24px)` }} />
        <div className="shop-windows">
          {[0, 1].map((i) => (
            <div key={i} className="window-pane" style={{ background: `linear-gradient(180deg, ${shop.glow}cc, ${shop.glow}55)` }}>
              <span className="window-silhouette" />
            </div>
          ))}
        </div>
        {shop.door ? (
          <div className="shop-door" style={{ boxShadow: `0 0 18px ${shop.glow}` }}>
            <span className="door-glass" style={{ background: `linear-gradient(180deg, ${shop.glow}, ${shop.glow}66)` }} />
            <span className="door-sign">OPEN</span>
          </div>
        ) : (
          <div className="shop-display">{shop.icon}</div>
        )}
      </div>
      {near && (
        <div className="action-prompt">
          <span className="prompt-key">E</span>
          <span className="prompt-text">{shop.prompt}</span>
        </div>
      )}
    </div>
  );
}

const SHOPS = [
  {
    id: "arcade",
    name: "8-BIT ARCADE",
    icon: "🕹️",
    neon: "#8b5cf6",
    ink: "#f5f3ff",
    roof: "#241a3d",
    wall: "#171326",
    glow: "#22d3ee",
  },
  {
    id: "cafe",
    name: "PIXEL CAFE",
    icon: "☕",
    neon: "#f59e0b",
    ink: "#2b1602",
    roof: "#4a2a12",
    wall: "#301a0d",
    glow: "#fcd34d",
    door: true,
    prompt: "Enter Pixel Cafe",
  },
  {
    id: "records",
    name: "VINYL RECORDS",
    icon: "🎵",
    neon: "#ec4899",
    ink: "#2b0416",
    roof: "#3a1230",
    wall: "#240b1d",
    glow: "#f9a8d4",
  },
  {
    id: "bakery",
    name: "NIGHT BAKERY",
    icon: "🥐",
    neon: "#34d399",
    ink: "#04231a",
    roof: "#123a2c",
    wall: "#0c241b",
    glow: "#a7f3d0",
  },
];

function NPC({ x, y, bubble, variant, facing = "right", wander = 8 }) {
  return (
    <div className="actor npc" style={{ left: `${x}%`, top: `${y}%`, zIndex: Math.round(y) + 8 }}>
      {bubble && <div className="speech-bubble npc-bubble">{bubble}</div>}
      <div className="npc-wander" style={{ animationDuration: `${wander}s` }}>
        <PixelChar variant={variant} facing={facing} walking scale={3.1} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  Scene bounds & interaction anchors (percentage space)
 * ------------------------------------------------------------------ */
const BOUNDS = {
  street: { minX: 7, maxX: 93, minY: 66, maxY: 86 },
  cafe: { minX: 9, maxX: 91, minY: 54, maxY: 84 },
};
const STREET = { door: { x: 37.5, y: 66 }, doorR: 9 };
const CAFE = {
  table: { x: 50, y: 60 },
  tableR: 17,
  exit: { x: 14, y: 66 },
  exitR: 9,
  spawn: { x: 26, y: 78 },
};
const STREET_SPAWN = { x: 50, y: 80 };

/* ================================================================== *
 *  Main application
 * ================================================================== */
export default function App() {
  /* ---- selection ---- */
  const [phase, setPhase] = useState("select"); // "select" | "play"
  const [hoverIdx, setHoverIdx] = useState(null);

  /* ---- session ---- */
  const [currentUser, setCurrentUser] = useState(null);
  const [offline, setOffline] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | connecting | online | error
  const [statusMsg, setStatusMsg] = useState("");

  /* ---- game state ---- */
  const [charIdx, setCharIdx] = useState(0);
  const [scene, setScene] = useState("street");
  const [pos, setPos] = useState(STREET_SPAWN);
  const [facing, setFacing] = useState("right");
  const [walking, setWalking] = useState(false);
  const [peer, setPeer] = useState(null);
  const [peerWalking, setPeerWalking] = useState(false);

  /* ---- chat ---- */
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [myBubble, setMyBubble] = useState(null);
  const [peerBubble, setPeerBubble] = useState(null);

  /* ---- refs (always-current values for the RAF loop + listener) ---- */
  const sceneRef = useRef("street");
  const posRef = useRef(STREET_SPAWN);
  const facingRef = useRef("right");
  const charIdxRef = useRef(0);
  const targetUIDRef = useRef("cometchat-uid-2");
  const peerRef = useRef(null);
  const keysRef = useRef(new Set());
  const lastBroadcastRef = useRef(0);
  const movingRef = useRef(false);
  const myBubbleTimer = useRef(null);
  const peerBubbleTimer = useRef(null);
  const interactRef = useRef(() => {});
  const chatEndRef = useRef(null);

  const activeChar = CHARACTERS[hoverIdx !== null ? hoverIdx : charIdx];

  /* ---- viewport-aware booth avatar scale (never clip on split windows) ---- */
  const [vp, setVp] = useState(() => ({
    w: typeof window !== "undefined" ? window.innerWidth : 1280,
    h: typeof window !== "undefined" ? window.innerHeight : 800,
  }));
  useEffect(() => {
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const widthScale = vp.w >= 1100 ? 8 : vp.w >= 780 ? 7 : vp.w >= 640 ? 6 : vp.w >= 480 ? 5 : 4;
  const heightScale = vp.h >= 760 ? 8 : vp.h >= 640 ? 7 : vp.h >= 520 ? 6 : vp.h >= 420 ? 5 : 4;
  const boothScale = Math.min(widthScale, heightScale);

  const credentialsMissing = !APP_ID || !REGION;

  /* ---------------------------------------------------------------- *
   *  Throttled state broadcast (CustomMessage "SYNC_ALL")
   * ---------------------------------------------------------------- */
  const broadcast = useCallback(
    (force = false) => {
      if (!currentUser || offline) return;
      const now = performance.now();
      if (!force && now - lastBroadcastRef.current < 70) return;
      lastBroadcastRef.current = now;
      try {
        const msg = new CometChat.CustomMessage(
          targetUIDRef.current,
          CometChat.RECEIVER_TYPE.USER,
          "SYNC_ALL",
          {
            x: Number(posRef.current.x.toFixed(2)),
            y: Number(posRef.current.y.toFixed(2)),
            facing: facingRef.current,
            charIdx: charIdxRef.current,
            scene: sceneRef.current,
          }
        );
        CometChat.sendCustomMessage(msg).catch(() => {});
      } catch (e) {
        console.warn("broadcast", e);
      }
    },
    [currentUser, offline]
  );

  /* ---------------------------------------------------------------- *
   *  Push a chat line (deduped)
   * ---------------------------------------------------------------- */
  const pushMessage = useCallback((m) => {
    setMessages((prev) => {
      if (prev.some((x) => x.id === m.id)) return prev;
      return [...prev, m].slice(-80);
    });
  }, []);

  /* ---------------------------------------------------------------- *
   *  CometChat init (once)
   * ---------------------------------------------------------------- */
  useEffect(() => {
    if (credentialsMissing) return undefined;
    try {
      const settings = new CometChat.AppSettingsBuilder()
        .subscribePresenceForAllUsers()
        .setRegion(REGION)
        .autoEstablishSocketConnection(true)
        .build();
      CometChat.init(APP_ID, settings).catch(() => {
        /* already-initialised is harmless on hot reload */
      });
    } catch (e) {
      console.warn("CometChat init skipped:", e?.message);
    }
    return undefined;
  }, [credentialsMissing]);

  /* ---------------------------------------------------------------- *
   *  Message listener  -  position sync + text chat + mutual booth sync
   * ---------------------------------------------------------------- */
  useEffect(() => {
    if (!currentUser) return undefined;
    const listenerId = `PIXEL_HAVEN_${currentUser.getUid()}`;

    const applyPeer = (data) => {
      const prev = peerRef.current;
      const changed =
        !prev || Math.abs(prev.x - data.x) > 0.01 || Math.abs(prev.y - data.y) > 0.01;
      const wasNull = !prev;

      const next = {
        x: Number(data.x) || 0,
        y: Number(data.y) || 0,
        facing: data.facing === "left" ? "left" : "right",
        charIdx: Number(data.charIdx) || 0,
        scene: data.scene || "street",
      };
      peerRef.current = next;
      setPeer(next);
      setPeerWalking(changed && !wasNull);
      if (changed) {
        window.clearTimeout(applyPeer._t);
        applyPeer._t = window.setTimeout(() => setPeerWalking(false), 180);
      }

      /* -------- MUTUAL SCENE SYNC (the core hackathon feature) -------- */
      const local = sceneRef.current;
      if (next.scene !== local) {
        if (next.scene === "booth" && local !== "booth") {
          // partner sat down -> pull us into the cinematic booth together
          sceneRef.current = "booth";
          setScene("booth");
          movingRef.current = false;
        } else if (next.scene === "cafe" && local === "booth") {
          // partner left the booth -> return to the cafe floor together
          sceneRef.current = "cafe";
          setScene("cafe");
          const p = { x: 50, y: 78 };
          posRef.current = p;
          setPos(p);
        } else if (next.scene === "street" && local === "cafe") {
          // partner stepped back out to the street -> follow them
          sceneRef.current = "street";
          setScene("street");
          const p = { x: STREET.door.x, y: STREET.door.y + 8 };
          posRef.current = p;
          setPos(p);
        }
      }

      // mutual discovery: if this is the first time we hear from them, say hi back
      if (wasNull) {
        window.setTimeout(() => broadcast(true), 120);
      }
    };

    const listener = new CometChat.MessageListener({
      onCustomMessageReceived: (msg) => {
        try {
          if (msg.getType() !== "SYNC_ALL") return;
          // SDK 4.2.0 nests the payload inside getData().customData
          const data = msg.getData() || {};
          const payload = data && typeof data.customData?.x === "number" ? data.customData : data;
          if (typeof payload.x !== "number" || typeof payload.y !== "number") return;
          applyPeer(payload);
        } catch (e) {
          console.warn("sync parse", e);
        }
      },
      onTextMessageReceived: (msg) => {
        const sender = msg.getSender?.();
        const fromMe = sender?.getUid?.() === currentUser.getUid();
        pushMessage({
          id: msg.getId?.() ?? `t-${Date.now()}`,
          uid: sender?.getUid?.() ?? "peer",
          name: fromMe ? "You" : sender?.getName?.() || "Friend",
          text: msg.getText?.() ?? "",
          self: fromMe,
        });
        if (!fromMe) {
          setPeerBubble(msg.getText?.() ?? "");
          window.clearTimeout(peerBubbleTimer.current);
          peerBubbleTimer.current = window.setTimeout(() => setPeerBubble(null), 4200);
        }
      },
    });

    CometChat.addMessageListener(listenerId, listener);
    return () => CometChat.removeMessageListener(listenerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  /* auto-scroll the log */
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollTop = chatEndRef.current.scrollHeight;
    }
  }, [messages]);

  /* ---------------------------------------------------------------- *
   *  Scene transitions
   * ---------------------------------------------------------------- */
  const transition = useCallback(
    (next, silent = false) => {
      if (sceneRef.current === next) return;
      sceneRef.current = next;
      setScene(next);
      movingRef.current = false;
      setWalking(false);
      if (!silent) broadcast(true);
    },
    [broadcast]
  );

  const enterCafe = useCallback(() => {
    posRef.current = { ...CAFE.spawn };
    setPos({ ...CAFE.spawn });
    facingRef.current = "right";
    setFacing("right");
    transition("cafe");
  }, [transition]);

  const leaveCafe = useCallback(() => {
    posRef.current = { x: STREET.door.x, y: STREET.door.y + 8 };
    setPos({ x: STREET.door.x, y: STREET.door.y + 8 });
    transition("street");
  }, [transition]);

  const enterBooth = useCallback(() => transition("booth"), [transition]);

  const leaveBooth = useCallback(() => {
    posRef.current = { x: 50, y: 78 };
    setPos({ x: 50, y: 78 });
    transition("cafe");
  }, [transition]);

  /* ---------------------------------------------------------------- *
   *  Action key
   * ---------------------------------------------------------------- */
  const interact = useCallback(() => {
    const s = sceneRef.current;
    if (s === "street") {
      if (dist(posRef.current, STREET.door) <= STREET.doorR) enterCafe();
    } else if (s === "cafe") {
      const nearExitNow = dist(posRef.current, CAFE.exit) <= CAFE.exitR;
      const nearTableNow = dist(posRef.current, CAFE.table) <= CAFE.tableR;
      const nearPeerNow =
        peerRef.current &&
        peerRef.current.scene === "cafe" &&
        dist(posRef.current, peerRef.current) <= 15;
      if (nearExitNow) leaveCafe();
      else if (nearTableNow || nearPeerNow) enterBooth();
    } else if (s === "booth") {
      leaveBooth();
    }
  }, [enterCafe, leaveCafe, leaveBooth, enterBooth]);

  useEffect(() => {
    interactRef.current = interact;
  }, [interact]);

  /* ---------------------------------------------------------------- *
   *  Keyboard input
   * ---------------------------------------------------------------- */
  useEffect(() => {
    const isTyping = () => {
      const el = document.activeElement;
      return el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA");
    };
    const onDown = (e) => {
      const el = document.activeElement;
      if (el && el.tagName === "BUTTON") el.blur();
      if (isTyping()) return;
      const k = e.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) {
        e.preventDefault();
      }
      if (k === "e" || k === "enter" || k === " ") {
        interactRef.current();
        return;
      }
      keysRef.current.add(k);
    };
    const onUp = (e) => keysRef.current.delete(e.key.toLowerCase());
    const onBlur = () => keysRef.current.clear();
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  /* ---------------------------------------------------------------- *
   *  Game loop - smooth movement @ RAF, throttled sync
   * ---------------------------------------------------------------- */
  useEffect(() => {
    if (phase !== "play") return undefined;
    let raf = 0;
    let last = performance.now();

    const tick = (t) => {
      const dt = Math.min(48, t - last);
      last = t;

      let dx = 0;
      let dy = 0;
      const k = keysRef.current;
      if (k.has("a") || k.has("arrowleft")) dx -= 1;
      if (k.has("d") || k.has("arrowright")) dx += 1;
      if (k.has("w") || k.has("arrowup")) dy -= 1;
      if (k.has("s") || k.has("arrowdown")) dy += 1;

      const inBooth = sceneRef.current === "booth";
      if ((dx || dy) && !inBooth) {
        const len = Math.hypot(dx, dy) || 1;
        const b = BOUNDS[sceneRef.current] || BOUNDS.street;
        const speed = 0.019 * dt;
        const nx = clamp(posRef.current.x + (dx / len) * speed, b.minX, b.maxX);
        const ny = clamp(posRef.current.y + (dy / len) * speed, b.minY, b.maxY);
        posRef.current = { x: nx, y: ny };
        setPos({ x: nx, y: ny });

        const nf = dx < 0 ? "left" : dx > 0 ? "right" : facingRef.current;
        if (nf !== facingRef.current) {
          facingRef.current = nf;
          setFacing(nf);
        }
        if (!movingRef.current) {
          movingRef.current = true;
          setWalking(true);
        }
        broadcast(false);
      } else if (movingRef.current) {
        movingRef.current = false;
        setWalking(false);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, broadcast]);

  /* ---------------------------------------------------------------- *
   *  Login / spawn
   * ---------------------------------------------------------------- */
  const handleSpawn = async () => {
    setStatus("connecting");
    setStatusMsg("");
    const picked = hoverIdx !== null ? hoverIdx : charIdx;
    setCharIdx(picked);
    charIdxRef.current = picked;

    const char = CHARACTERS[picked];
    const uid = char.uid;
    targetUIDRef.current = char.target;

    const beginGame = () => {
      setPhase("play");
      sceneRef.current = "street";
      posRef.current = { ...STREET_SPAWN };
      setPos({ ...STREET_SPAWN });
      setScene("street");
      setStatus("online");
    };

    try {
      const logged = await CometChat.getLoggedinUser();
      if (logged && logged.getUid() !== uid) {
        await CometChat.logout().catch(() => {});
      }
      const user = logged && logged.getUid() === uid ? logged : await CometChat.login(uid, AUTH_KEY);
      setCurrentUser(user);
      setOffline(false);
      beginGame();
      // announce ourselves once we're on the street
      window.setTimeout(() => broadcast(true), 350);
    } catch (err) {
      console.error(err);
      setStatus("error");
      setStatusMsg("CometChat login failed — check your credentials in .env.");
    }
  };

  const resetToSelect = useCallback((msg = null) => {
    keysRef.current.clear();
    peerRef.current = null;
    setPeer(null);
    setMessages([]);
    setDraft("");
    setPhase("select");
    sceneRef.current = "street";
    setScene("street");
    setCurrentUser(null);
    setOffline(false);
    setStatus(msg ? "error" : "idle");
    setStatusMsg(msg || "");
  }, []);

  /* Watchdog: if the CometChat session is replaced by another tab, send us
     back to the lobby with guidance (CometChat sessions live in shared
     localStorage, so two tabs in the same profile cannot hold two users). */
  useEffect(() => {
    if (phase !== "play" || offline || !currentUser) return undefined;
    const myUid = currentUser.getUid();
    const timer = window.setInterval(async () => {
      try {
        const u = await CometChat.getLoggedinUser();
        if (!u || u.getUid() !== myUid) {
          resetToSelect(
            "This account was signed in from another window. Open the second player in an incognito window or a different browser profile."
          );
        }
      } catch {
        /* transient network hiccup - ignore */
      }
    }, 4000);
    return () => window.clearInterval(timer);
  }, [phase, offline, currentUser, resetToSelect]);

  const handleExit = () => {
    if (!offline && currentUser) CometChat.logout().catch(() => {});
    resetToSelect();
  };

  /* ---------------------------------------------------------------- *
   *  Send a chat message (TextMessage)
   * ---------------------------------------------------------------- */
  const handleSend = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    setMyBubble(text);
    window.clearTimeout(myBubbleTimer.current);
    myBubbleTimer.current = window.setTimeout(() => setMyBubble(null), 4200);

    if (offline || !currentUser) {
      pushMessage({ id: `local-${Date.now()}`, uid: "me", name: "You", text, self: true });
      return;
    }
    try {
      const msg = new CometChat.TextMessage(
        targetUIDRef.current,
        text,
        CometChat.RECEIVER_TYPE.USER
      );
      const sent = await CometChat.sendMessage(msg);
      pushMessage({
        id: sent.getId(),
        uid: currentUser.getUid(),
        name: "You",
        text,
        self: true,
      });
    } catch (err) {
      console.error(err);
      pushMessage({ id: `local-${Date.now()}`, uid: "me", name: "You", text, self: true });
    }
  };

  /* ---------------------------------------------------------------- *
   *  Derived interaction state
   * ---------------------------------------------------------------- */
  const nearDoor = scene === "street" && dist(pos, STREET.door) <= STREET.doorR;
  const nearTable = scene === "cafe" && dist(pos, CAFE.table) <= CAFE.tableR;
  const nearExit = scene === "cafe" && dist(pos, CAFE.exit) <= CAFE.exitR;
  const nearPeerCafe =
    scene === "cafe" && peer && peer.scene === "cafe" && dist(pos, peer) <= 15;
  const canSit = scene === "cafe" && (nearTable || nearPeerCafe);
  const peerElsewhere = peer && peer.scene !== scene;

  const streetParallax = (pos.x - 50) * -0.18;
  const cafeParallax = (pos.x - 50) * -0.09;

  /* ================================================================ *
   *  RENDER
   * ================================================================ */
  return (
    <div className="app">
      <AppStyles />

      {/* ============================================================ */}
      {/* SCENE 1 · CHARACTER SELECT / LOBBY                            */}
      {/* ============================================================ */}
      {phase === "select" && (
        <div className="select-screen">
          <div className="select-cabinet">
            <div className="cabinet-marquee">
              <div className="marquee-lights" />
              <h1 className="game-title">PIXEL HAVEN</h1>
              <p className="game-sub">COZY 16-BIT CITY &amp; PROXIMITY CAFE</p>
            </div>

            <div className="cabinet-body">
              <p className="select-hint">▸ Choose your wanderer — hover to preview, click to lock in</p>

              <div className="char-grid">
                {CHARACTERS.map((c, idx) => {
                  const selected = (hoverIdx !== null ? hoverIdx : charIdx) === idx;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      className={`char-card${selected ? " selected" : ""}`}
                      style={{ "--card-glow": c.accent }}
                      onMouseEnter={() => setHoverIdx(idx)}
                      onMouseLeave={() => setHoverIdx((h) => (h === idx ? null : h))}
                      onFocus={() => setHoverIdx(idx)}
                      onClick={() => setCharIdx(idx)}
                    >
                      <div className="char-stage">
                        <PixelChar variant={idx} scale={selected ? 3.4 : 3} walking={selected} />
                      </div>
                      <div className="char-name">{c.name}</div>
                      <div className="char-gender">{c.gender}</div>
                      <div className="char-title">{c.title}</div>
                      {selected && <div className="char-select-tag">SELECTED</div>}
                    </button>
                  );
                })}
              </div>

              <button type="button" className="spawn-btn" onClick={handleSpawn} disabled={status === "connecting"}>
                {status === "connecting"
                  ? "[ ▶ CONNECTING… ]"
                  : `[ ▶ SPAWN AS ${activeChar.name.toUpperCase()} (${activeChar.gender.toUpperCase()}) ]`}
              </button>

              {status === "error" && statusMsg && (
                <p className="status-line">
                  <span className="bad">{statusMsg}</span>
                </p>
              )}
            </div>
          </div>
          <div className="scanlines" />
          <div className="vignette" />
        </div>
      )}

      {/* ============================================================ */}
      {/* SCENES 2-4 · THE GAME                                         */}
      {/* ============================================================ */}
      {phase === "play" && (
        <div className="game">
          {/* ---------------- HUD ---------------- */}
          <header className="hud">
            <div className="hud-left">
              <div className="hud-logo">☕ PIXEL HAVEN</div>
              <div className="hud-user">
                <span className="hud-avatar">
                  <PixelChar variant={charIdx} scale={1.15} />
                </span>
                <span>
                  <b style={{ color: activeChar.accent }}>{CHARACTERS[charIdx].name}</b>
                  <span className="hud-sub">ONLINE</span>
                </span>
              </div>
            </div>

            <div className="hud-center">
              {["street", "cafe", "booth"].map((s) => (
                <span key={s} className={`loc-pill${scene === s ? " on" : ""}`}>
                  {s === "street" ? "🌆 CITY" : s === "cafe" ? "☕ CAFE" : "🛋️ BOOTH"}
                </span>
              ))}
            </div>

            <div className="hud-right">
              <span className={`net-pill ${offline ? "off" : peer ? "live" : "wait"}`}>
                <span className="net-dot" />
                {offline ? "OFFLINE" : peer ? "LINKED" : "SEARCHING…"}
              </span>
              <button type="button" className="arcade-btn small ghost" onClick={handleExit}>
                EXIT
              </button>
            </div>
          </header>

          {/* ---------------- VIEWPORT ---------------- */}
          <main className="viewport">
            {/* ============ SCENE 2 · CITY STREET ============ */}
            {scene === "street" && (
              <div className="scene street-scene">
                <div className="street-sky" />
                <Stars />
                <div className="moon">
                  <div className="moon-core" />
                  <div className="moon-glow" />
                </div>
                <Skyline />
                <div className="street-far" style={{ transform: `translateX(${streetParallax * 0.5}px)` }} />

                <div className="storefront-row">
                  {SHOPS.map((shop) => (
                    <Storefront
                      key={shop.id}
                      shop={shop}
                      near={shop.door && nearDoor}
                      parallax={streetParallax}
                    />
                  ))}
                </div>

                <div className="sidewalk">
                  {Array.from({ length: 14 }, (_, i) => (
                    <span key={i} className="cobble" />
                  ))}
                </div>

                <div className="road">
                  <div className="road-paint" />
                  <div className="road-paint second" />
                </div>

                <StreetLamps />

                {/* NPC pedestrians */}
                <NPC x={16} y={78} variant={2} facing="right" bubble={nearNpc(pos, { x: 16, y: 78 }) ? "The cocoa here is divine!" : null} />
                <NPC x={70} y={83} variant={3} facing="left" bubble={nearNpc(pos, { x: 70, y: 83 }) ? "Wanna hit the arcade?" : null} />
                <NPC x={86} y={76} variant={1} facing="left" bubble={nearNpc(pos, { x: 86, y: 76 }) ? "Fresh vinyl just dropped~" : null} />

                {/* Actors */}
                <Actor
                  variant={charIdx}
                  pos={pos}
                  facing={facing}
                  walking={walking}
                  label="YOU"
                  labelColor={CHARACTERS[charIdx].accent}
                  bubble={myBubble}
                  scale={4}
                />
                {peer && peer.scene === "street" && (
                  <Actor
                    variant={peer.charIdx}
                    pos={{ x: peer.x, y: peer.y }}
                    facing={peer.facing}
                    walking={peerWalking}
                    label="FRIEND"
                    labelColor={CHARACTERS[peer.charIdx]?.accent || "#fb7185"}
                    bubble={peerBubble}
                    scale={4}
                  />
                )}
              </div>
            )}

            {/* ============ SCENE 3 · CAFE INTERIOR ============ */}
            {scene === "cafe" && (
              <div className="scene cafe-scene">
                <div className="cafe-wall">
                  <div className="cafe-wall-trim" />
                  <div className="shelf">
                    {["🫙", "🍶", "🫖", "🪴", "🏺"].map((e, i) => (
                      <span key={i} className="shelf-item">
                        {e}
                      </span>
                    ))}
                  </div>
                  <div className="cafe-sign">PIXEL CAFE · 24H BREW</div>
                </div>

                <div className="cafe-lights" style={{ transform: `translateX(${cafeParallax}px)` }}>
                  {[12, 37, 62, 87].map((x) => (
                    <div key={x} className="pendant" style={{ left: `${x}%` }}>
                      <div className="pendant-cord" />
                      <div className="pendant-shade" />
                      <div className="pendant-bulb" />
                      <div className="pendant-pool" />
                    </div>
                  ))}
                </div>

                <div className="cafe-floor" />

                {/* Barista counter */}
                <div className="bar-counter" style={{ transform: `translateX(${cafeParallax}px)` }}>
                  <div className="counter-top" />
                  <div className="counter-front">
                    <div className="espresso-machine">
                      <div className="esp-top" />
                      <div className="esp-body">
                        <span className="esp-gauge" />
                        <span className="esp-gauge" />
                      </div>
                      <span className="esp-cup" />
                    </div>
                    <div className="pastry-case">
                      <div className="pastry-glass" />
                      <div className="pastry-items">
                        <span>🥐</span>
                        <span>🍰</span>
                        <span>🍩</span>
                      </div>
                    </div>
                    <div className="counter-register">☕</div>
                  </div>
                </div>

                {/* Plants */}
                <div className="plant plant-a">🪴</div>
                <div className="plant plant-b">🌿</div>

                {/* Exit door */}
                <div className={`cafe-door${nearExit ? " near" : ""}`} onClick={leaveCafe}>
                  <span className="cafe-door-glow" />
                  <span className="cafe-door-sign">← STREET</span>
                </div>

                {/* VIP booth table */}
                <div className={`vip-booth${canSit ? " hot" : ""}`}>
                  <div className="vip-chair left" />
                  <div className="vip-table">
                    <div className="vip-table-top" />
                    <div className="vip-table-leg" />
                    <span className="vip-candle">🕯️</span>
                    <span className="vip-cup">☕</span>
                  </div>
                  <div className="vip-chair right" />
                  {canSit && (
                    <div className="action-prompt cafe-prompt">
                      <span className="prompt-key">E</span>
                      <span className="prompt-text">Join VIP Table</span>
                    </div>
                  )}
                </div>

                {/* Actors */}
                <Actor
                  variant={charIdx}
                  pos={pos}
                  facing={facing}
                  walking={walking}
                  label="YOU"
                  labelColor={CHARACTERS[charIdx].accent}
                  bubble={myBubble}
                  scale={4}
                />
                {peer && peer.scene === "cafe" && (
                  <Actor
                    variant={peer.charIdx}
                    pos={{ x: peer.x, y: peer.y }}
                    facing={peer.facing}
                    walking={peerWalking}
                    label="FRIEND"
                    labelColor={CHARACTERS[peer.charIdx]?.accent || "#fb7185"}
                    bubble={peerBubble}
                    scale={4}
                  />
                )}
              </div>
            )}

            {/* ============ SCENE 4 · CINEMATIC CLOSE-UP BOOTH ============ */}
            {scene === "booth" && (
              <div className="booth-scene">
                <div className="booth-backdrop" />
                <div className="booth-spotlight" />

                <div className="booth-topbar">
                  <span className="booth-tag">🛋️ VIP COFFEE BOOTH · LIVE</span>
                  <button type="button" className="arcade-btn danger" onClick={leaveBooth}>
                    ✕ LEAVE BOOTH
                  </button>
                </div>

                <div className="booth-stage">
                  <div className="booth-avatar left">
                    <div className="booth-chair">
                      <PixelChar variant={charIdx} sitting facing="right" scale={boothScale} />
                    </div>
                    <span className="booth-name" style={{ color: CHARACTERS[charIdx].accent }}>
                      {CHARACTERS[charIdx].name}
                    </span>
                  </div>

                  <div className="booth-table">
                    <div className="booth-table-surface" />
                    <div className="booth-table-edge" />
                    <div className="mug-slot">
                      <Mug size={64} />
                    </div>
                    <div className="mug-slot">
                      <Mug size={64} />
                    </div>
                    <span className="booth-heart">❤</span>
                  </div>

                  <div className="booth-avatar right">
                    <div className="booth-chair">
                      <PixelChar
                        variant={peer ? peer.charIdx : 1}
                        sitting
                        facing="left"
                        scale={boothScale}
                      />
                    </div>
                    <span className="booth-name" style={{ color: peer ? CHARACTERS[peer.charIdx]?.accent || "#fb7185" : "#fb7185" }}>
                      {peer ? CHARACTERS[peer.charIdx].name : "Waiting…"}
                    </span>
                  </div>
                </div>

                {/* Dialogue terminal */}
                <div className="terminal">
                  <div className="terminal-head">
                    <span className="terminal-title">
                      {">"} COMETCHAT DIALOGUE TERMINAL
                    </span>
                    <span className="terminal-status">
                      {offline ? "OFFLINE" : peer ? "2 PLAYERS LINKED" : "SEARCHING FOR FRIEND…"}
                    </span>
                  </div>

                  <div className="terminal-log" ref={chatEndRef}>
                    {messages.length === 0 ? (
                      <div className="log-empty">
                        * Steam curls off two warm mugs. Say something to break the ice… *
                      </div>
                    ) : (
                      messages.map((m, i) => (
                        <div key={m.id ?? i} className={`log-line${m.self ? " me" : " them"}`}>
                          <span className="log-name">{m.name}</span>
                          <span className="log-sep">›</span>
                          <span className="log-text">{m.text}</span>
                        </div>
                      ))
                    )}
                  </div>

                  <form className="terminal-input" onSubmit={handleSend}>
                    <span className="term-caret">&gt;</span>
                    <input
                      type="text"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder="Type your message…"
                      maxLength={220}
                      autoFocus
                    />
                    <button type="submit" className="arcade-btn speak">
                      [Speak]
                    </button>
                  </form>
                </div>

                <div className="scanlines" />
                <div className="vignette" />
              </div>
            )}

            {/* ---------- Overworld chat dock ---------- */}
            {scene !== "booth" && (
              <div className="chat-dock">
                <div className="dock-log" ref={chatEndRef}>
                  {messages.length === 0 ? (
                    <div className="log-empty small">
                      * Press [E] at the cafe to sit together and chat *
                    </div>
                  ) : (
                    messages.slice(-6).map((m, i) => (
                      <div key={m.id ?? i} className={`log-line${m.self ? " me" : " them"}`}>
                        <span className="log-name">{m.name}</span>
                        <span className="log-text">{m.text}</span>
                      </div>
                    ))
                  )}
                </div>
                <form className="dock-input" onSubmit={handleSend}>
                  <input
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Say hi…"
                    maxLength={220}
                  />
                  <button type="submit" className="arcade-btn small">
                    Send
                  </button>
                </form>
              </div>
            )}

            {/* ---------- Controls hint ---------- */}
            {scene !== "booth" && (
              <div className="controls-hint">
                <span className="key">W</span><span className="key">A</span>
                <span className="key">S</span><span className="key">D</span>
                <span className="hint-txt">
                  move &nbsp;·&nbsp; <span className="key sm">E</span> interact
                  {scene === "street" ? " (find the glowing cafe door)" : " (find the VIP booth)"}
                </span>
              </div>
            )}

            {peerElsewhere && (
              <div className="peer-elsewhere">
                Your friend is in the {peer.scene === "cafe" ? "☕ cafe" : peer.scene === "booth" ? "🛋️ booth" : "🌆 city"}…
              </div>
            )}
          </main>

          <div className="scanlines" />
          <div className="vignette" />
        </div>
      )}
    </div>
  );
}

/* proximity helper for NPC bubbles */
function nearNpc(pos, npc, r = 10) {
  return dist(pos, npc) <= r;
}

/* ------------------------------------------------------------------ *
 *  Street lamps (decorative, radial glow pools)
 * ------------------------------------------------------------------ */
function StreetLamps() {
  return (
    <div className="lamps">
      {[10, 30, 50, 70, 90].map((x) => (
        <div key={x} className="lamp" style={{ left: `${x}%` }}>
          <div className="lamp-pole" />
          <div className="lamp-head">
            <span className="lamp-bulb" />
          </div>
          <div className="lamp-pool" />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  All CSS (single source of truth, scoped by class names)
 * ------------------------------------------------------------------ */
function AppStyles() {
  return (
    <style>{`
      /* ================= FONTS & BASE ================= */
      @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap');

      .app {
        position: relative;
        width: 100vw;
        height: 100vh;
        height: 100dvh;
        overflow: hidden;
        background: #05060f;
        color: #fef3c7;
        font-family: 'Press Start 2P', 'VT323', monospace;
        image-rendering: pixelated;
        user-select: none;
      }
      .app * { box-sizing: border-box; }

      /* ================= SHARED FX ================= */
      .scanlines {
        position: absolute; inset: 0; pointer-events: none; z-index: 60;
        background: repeating-linear-gradient(
          to bottom,
          rgba(0,0,0,0) 0px,
          rgba(0,0,0,0) 2px,
          rgba(0,0,0,0.16) 3px,
          rgba(0,0,0,0) 4px
        );
        mix-blend-mode: multiply;
        opacity: .55;
      }
      .vignette {
        position: absolute; inset: 0; pointer-events: none; z-index: 61;
        background: radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,.55) 100%);
      }

      @keyframes pcharIdle { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-2.5%); } }
      @keyframes pcharWalk { 0%,100% { transform: translateY(0) } 25% { transform: translateY(-6%) } 50% { transform: translateY(0) } 75% { transform: translateY(-6%) } }
      @keyframes twinkle { 0%,100% { opacity: .15; transform: scale(.7); } 50% { opacity: 1; transform: scale(1); } }
      @keyframes bulbGlow { 0%,100% { opacity: .8; filter: drop-shadow(0 0 6px #f59e0b); } 50% { opacity: 1; filter: drop-shadow(0 0 14px #fbbf24); } }
      @keyframes promptBob { 0%,100% { transform: translate(-50%, 0); } 50% { transform: translate(-50%, -7px); } }
      @keyframes steamRise {
        0% { transform: translateY(6px) scale(.8); opacity: 0; }
        25% { opacity: .85; }
        100% { transform: translateY(-30px) scale(1.25); opacity: 0; }
      }
      @keyframes neonPulse { 0%,100% { filter: brightness(1); } 50% { filter: brightness(1.35); } }
      @keyframes candleFlicker { 0%,100% { transform: scale(1); opacity: .9; } 40% { transform: scale(1.12); opacity: 1; } 70% { transform: scale(.96); opacity: .8; } }
      @keyframes wander { 0%,100% { transform: translateX(-26px); } 50% { transform: translateX(26px); } }
      @keyframes floatHeart { 0% { transform: translateY(0) scale(1); opacity: .4; } 100% { transform: translateY(-22px) scale(1.3); opacity: 0; } }
      @keyframes floatY { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
      @keyframes marquee { 0% { background-position: 0 0; } 100% { background-position: 56px 0; } }

      /* ================= SPRITE ================= */
      .pchar { position: relative; filter: drop-shadow(0 2px 1px rgba(0,0,0,.35)); }
      .pchar-flip, .pchar-bob { width: 100%; height: 100%; transform-origin: center bottom; }
      .pchar-flip { transform-origin: center bottom; }
      .pchar-bob.idle { animation: pcharIdle 2.4s ease-in-out infinite; }
      .pchar-bob.walk { animation: pcharWalk .42s ease-in-out infinite; }

      /* ================= ACTORS ================= */
      .actor {
        position: absolute;
        transform: translate(-50%, -100%);
        display: flex; flex-direction: column; align-items: center;
        pointer-events: none;
        will-change: left, top;
      }
      .nametag {
        font-size: 8px; letter-spacing: .5px; line-height: 1;
        background: rgba(4,4,10,.82);
        border: 2px solid currentColor;
        padding: 3px 6px; margin-bottom: 4px;
        border-radius: 3px;
        text-shadow: 0 1px 0 #000;
      }
      .speech-bubble {
        position: relative;
        font-family: 'VT323', monospace;
        font-size: 20px; line-height: 1.1;
        color: #101018;
        background: #fdf6e3;
        border: 3px solid #1a1206;
        border-radius: 6px;
        padding: 4px 10px 6px;
        margin-bottom: 6px;
        max-width: 220px;
        box-shadow: 3px 3px 0 rgba(0,0,0,.55);
        white-space: normal; text-align: center;
      }
      .speech-bubble::after {
        content: ""; position: absolute; left: 50%; bottom: -11px; transform: translateX(-50%);
        border-left: 8px solid transparent; border-right: 8px solid transparent;
        border-top: 12px solid #fdf6e3;
        filter: drop-shadow(0 3px 0 #1a1206);
      }
      .npc { opacity: .96; }
      .npc-wander { animation: wander 9s ease-in-out infinite; }
      .npc-bubble { font-size: 17px; }

      /* ================= HUD ================= */
      .game { position: absolute; inset: 0; display: flex; flex-direction: column; }
      .hud {
        position: relative; z-index: 40;
        height: 56px; flex: 0 0 56px;
        display: flex; align-items: center; justify-content: space-between; gap: 10px;
        padding: 0 14px;
        background: linear-gradient(180deg, #160e1f 0%, #0c0813 100%);
        border-bottom: 3px solid #3b2418;
        box-shadow: 0 4px 0 rgba(0,0,0,.6);
      }
      .hud-left { display: flex; align-items: center; gap: 14px; min-width: 0; }
      .hud-logo {
        font-size: 10px; color: #fbbf24; letter-spacing: 1px;
        text-shadow: 0 0 10px rgba(245,158,11,.6), 2px 2px 0 #000;
        white-space: nowrap;
      }
      .hud-user { display: flex; align-items: center; gap: 8px; font-size: 8px; color: #d6d3d1; white-space: nowrap; }
      .hud-user b { font-weight: 400; }
      .hud-sub { display: block; margin-top: 3px; font-size: 6px; color: #6ee7b7; letter-spacing: 1px; }
      .hud-avatar { width: 34px; height: 26px; display: flex; align-items: flex-end; justify-content: center; overflow: hidden; }
      .hud-center { display: flex; gap: 8px; }
      .loc-pill {
        font-size: 8px; padding: 6px 9px; border-radius: 4px;
        background: #1b1524; color: #8b8496; border: 2px solid #2c2438;
        white-space: nowrap;
      }
      .loc-pill.on { background: #3a2410; color: #fcd34d; border-color: #f59e0b; box-shadow: 0 0 12px rgba(245,158,11,.5); }
      .hud-right { display: flex; align-items: center; gap: 10px; }
      .net-pill { display: flex; align-items: center; gap: 6px; font-size: 8px; padding: 6px 9px; border-radius: 4px; border: 2px solid #2c2438; background: #1b1524; white-space: nowrap; }
      .net-dot { width: 8px; height: 8px; border-radius: 50%; background: #6b7280; }
      .net-pill.live { color: #6ee7b7; border-color: #10b981; }
      .net-pill.live .net-dot { background: #10b981; box-shadow: 0 0 8px #10b981; animation: bulbGlow 1.6s infinite; }
      .net-pill.wait { color: #fcd34d; border-color: #f59e0b; }
      .net-pill.wait .net-dot { background: #f59e0b; animation: twinkle 1s infinite; }
      .net-pill.off { color: #fca5a5; border-color: #ef4444; }
      .net-pill.off .net-dot { background: #ef4444; }

      .viewport { position: relative; flex: 1 1 auto; overflow: hidden; background: #05060f; }

      /* ================= SCENE MANAGER ================= */
      .scene { position: absolute; inset: 0; overflow: hidden; }

      /* ---------- STREET ---------- */
      .street-sky {
        position: absolute; inset: 0 0 40% 0;
        background: linear-gradient(180deg, #060814 0%, #0d0f2e 45%, #1e1b4b 100%);
      }
      .starfield { position: absolute; inset: 0 0 50% 0; overflow: hidden; }
      .star { position: absolute; background: #fef9c3; border-radius: 1px; animation: twinkle 3s ease-in-out infinite; }
      .moon { position: absolute; top: 5%; right: 9%; width: 96px; height: 96px; }
      .moon-core {
        position: absolute; inset: 14px; border-radius: 50%;
        background: radial-gradient(circle at 35% 30%, #fffbeb, #fde68a 60%, #fcd34d);
        box-shadow: 0 0 40px 10px rgba(253,224,71,.55), 0 0 90px 30px rgba(253,224,71,.22);
      }
      .moon-glow { position: absolute; inset: -30px; border-radius: 50%; background: radial-gradient(circle, rgba(253,224,71,.22), transparent 70%); }

      .skyline { position: absolute; left: 0; right: 0; bottom: 44%; height: 34%; }
      .building { position: absolute; bottom: 0; border-top: 2px solid #1e2a52; display: flex; align-items: flex-end; }
      .windows { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; padding: 6px; width: 100%; }
      .bwin { width: 100%; height: 5px; display: block; border-radius: 1px; }

      .street-far {
        position: absolute; left: 0; right: 0; bottom: 40%; height: 10%;
        background: #0a0d20;
        clip-path: polygon(0 100%, 0 40%, 6% 40%, 6% 10%, 10% 10%, 10% 55%, 16% 55%, 16% 25%, 22% 25%, 22% 60%, 30% 60%, 30% 15%, 36% 15%, 36% 45%, 44% 45%, 44% 8%, 50% 8%, 50% 50%, 58% 50%, 58% 20%, 66% 20%, 66% 55%, 74% 55%, 74% 12%, 80% 12%, 80% 48%, 88% 48%, 88% 25%, 94% 25%, 94% 55%, 100% 55%, 100% 100%);
      }

      .storefront-row {
        position: absolute; left: 3%; right: 3%; top: 26%; height: 35%;
        display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;
      }
      .shop { position: relative; display: flex; flex-direction: column; align-items: stretch; will-change: transform; }
      .shop-roof { height: 10px; border-radius: 4px 4px 0 0; border: 2px solid #000; border-bottom: none; }
      .shop-sign {
        display: flex; align-items: center; justify-content: center; gap: 6px;
        padding: 7px 4px; font-size: 8px; letter-spacing: .5px;
        border: 3px solid #000; text-shadow: 0 1px 0 rgba(0,0,0,.35);
        animation: neonPulse 3.4s ease-in-out infinite;
        z-index: 3;
      }
      .shop-icon { font-size: 12px; }
      .shop-name { font-size: 7px; white-space: nowrap; }
      .shop-body {
        flex: 1; border: 3px solid #000; border-top: none; border-radius: 0 0 5px 5px;
        position: relative; display: flex; flex-direction: column; overflow: hidden;
      }
      .awning {
        height: 12px; border-bottom: 3px solid #000;
        background-size: 24px 100%;
      }
      .shop-windows { flex: 1; display: flex; gap: 8px; padding: 10px 10px 4px; }
      .window-pane {
        flex: 1; border: 3px solid #000; border-radius: 3px; position: relative; overflow: hidden;
        box-shadow: inset 0 0 14px rgba(0,0,0,.4);
      }
      .window-silhouette {
        position: absolute; left: 50%; bottom: 0; width: 26px; height: 40%;
        transform: translateX(-50%);
        background: rgba(0,0,0,.55);
        border-radius: 40% 40% 0 0;
      }
      .shop-door {
        align-self: center; width: 56%; height: 46%; margin-bottom: -3px; position: relative;
        background: #2a1509; border: 3px solid #000; border-bottom: none;
        border-radius: 5px 5px 0 0; display: flex; align-items: flex-end; justify-content: center;
        overflow: hidden;
      }
      .door-glass { position: absolute; inset: 5px 5px 0 5px; border-radius: 3px; opacity: .85; }
      .door-sign {
        position: relative; z-index: 2; margin-bottom: 6px;
        font-size: 7px; color: #fff8e1; background: rgba(0,0,0,.55);
        padding: 2px 5px; border-radius: 3px;
      }
      .shop-display { flex: 0 0 40%; display: flex; align-items: center; justify-content: center; font-size: 26px; }

      .action-prompt {
        position: absolute; left: 50%; bottom: calc(100% + 10px);
        transform: translateX(-50%);
        display: flex; align-items: center; gap: 8px;
        background: rgba(8,6,14,.92);
        border: 3px solid #f59e0b; border-radius: 6px;
        padding: 8px 12px; white-space: nowrap; z-index: 20;
        box-shadow: 0 0 20px rgba(245,158,11,.6), 3px 3px 0 #000;
        animation: promptBob 1.1s ease-in-out infinite;
      }
      .prompt-key {
        display: grid; place-items: center;
        width: 24px; height: 24px; font-size: 10px;
        background: #f59e0b; color: #2b1602; border-radius: 4px;
        border: 2px solid #000; box-shadow: inset 0 -3px 0 rgba(0,0,0,.3);
      }
      .prompt-text { font-size: 9px; color: #fde68a; }

      .sidewalk {
        position: absolute; left: 0; right: 0; bottom: 30%; height: 9%;
        background: linear-gradient(180deg, #4b4256 0%, #3a3348 100%);
        border-top: 4px solid #2b2536; border-bottom: 5px solid #241f30;
        display: flex; align-items: center; justify-content: space-around; padding: 0 12px;
        background-image: repeating-linear-gradient(90deg, rgba(255,255,255,.06) 0 2px, transparent 2px 46px);
      }
      .cobble { width: 26px; height: 8px; background: rgba(255,255,255,.05); border-radius: 2px; }

      .road {
        position: absolute; left: 0; right: 0; bottom: 0; height: 30%;
        background: linear-gradient(180deg, #1a1c26 0%, #101218 100%);
        border-top: 3px solid #2c2f3d;
      }
      .road-paint {
        position: absolute; left: 0; right: 0; top: 42%; height: 4px;
        background: repeating-linear-gradient(90deg, #f8fafc 0 40px, transparent 40px 80px);
        opacity: .5;
      }
      .road-paint.second { top: 78%; opacity: .3; }

      .lamps { position: absolute; inset: 0; pointer-events: none; z-index: 5; }
      .lamp { position: absolute; bottom: 30%; transform: translateX(-50%); }
      .lamp-pole { width: 6px; height: 74px; margin: 0 auto; background: linear-gradient(90deg, #2b2a33, #55535f 55%, #2b2a33); border-radius: 3px; }
      .lamp-head { width: 26px; height: 12px; margin: -4px auto 0; background: #2b2a33; border: 2px solid #000; border-radius: 6px 6px 3px 3px; position: relative; }
      .lamp-bulb { position: absolute; left: 50%; top: 100%; transform: translateX(-50%); width: 14px; height: 10px; background: radial-gradient(circle, #fff7d6, #fbbf24); border-radius: 50%; box-shadow: 0 0 18px 6px rgba(251,191,36,.8); animation: bulbGlow 2.6s infinite; }
      .lamp-pool {
        position: absolute; left: 50%; top: 100%; transform: translateX(-50%);
        width: 150px; height: 60px;
        background: radial-gradient(ellipse at center top, rgba(251,191,36,.35), rgba(251,191,36,.08) 55%, transparent 75%);
        pointer-events: none;
      }

      /* ---------- CAFE ---------- */
      .cafe-scene { background: #241108; }
      .cafe-wall {
        position: absolute; left: 0; right: 0; top: 0; height: 40%;
        background: linear-gradient(180deg, #2b1206 0%, #3a1c0c 100%);
        border-bottom: 6px solid #150702;
        background-image: repeating-linear-gradient(90deg, rgba(0,0,0,.25) 0 3px, transparent 3px 58px);
      }
      .cafe-wall-trim { position: absolute; left: 0; right: 0; top: 58%; height: 12px; background: #6b3d1c; border-top: 3px solid #8a5227; border-bottom: 3px solid #3d1f0c; }
      .shelf { position: absolute; left: 6%; top: 14%; display: flex; gap: 18px; font-size: 22px; }
      .shelf-item { filter: drop-shadow(0 2px 0 rgba(0,0,0,.5)); }
      .cafe-sign {
        position: absolute; left: 50%; top: 12%; transform: translateX(-50%);
        font-size: 12px; color: #ffd88a; letter-spacing: 3px;
        text-shadow: 0 0 14px rgba(245,158,11,.8), 2px 2px 0 #000;
      }
      .cafe-floor {
        position: absolute; left: 0; right: 0; bottom: 0; height: 62%;
        background: #3a1c0e;
        background-image:
          repeating-linear-gradient(45deg, rgba(0,0,0,.16) 0 2px, transparent 2px 26px),
          repeating-linear-gradient(-45deg, rgba(255,255,255,.03) 0 2px, transparent 2px 26px),
          repeating-linear-gradient(90deg, rgba(0,0,0,.30) 0 3px, transparent 3px 52px),
          repeating-linear-gradient(0deg, rgba(0,0,0,.22) 0 3px, transparent 3px 34px),
          linear-gradient(180deg, #4a2410 0%, #2e1508 100%);
      }

      .cafe-lights { position: absolute; inset: 0; pointer-events: none; }
      .pendant { position: absolute; top: 0; width: 0; }
      .pendant-cord { position: absolute; left: -1px; top: 0; width: 2px; height: 60px; background: #1a0d04; }
      .pendant-shade {
        position: absolute; left: -14px; top: 58px; width: 28px; height: 16px;
        background: linear-gradient(180deg, #7a3f1a, #3d1f0c);
        border: 2px solid #1a0d04; border-radius: 50% 50% 6px 6px;
      }
      .pendant-bulb { position: absolute; left: -4px; top: 72px; width: 8px; height: 8px; background: radial-gradient(circle, #fff6d0, #fbbf24); border-radius: 50%; box-shadow: 0 0 16px 5px rgba(251,191,36,.75); animation: bulbGlow 3s infinite; }
      .pendant-pool {
        position: absolute; left: -90px; top: 74px; width: 180px; height: 150px;
        background: radial-gradient(ellipse at center top, rgba(251,191,36,.30), rgba(251,191,36,.06) 55%, transparent 75%);
      }

      .bar-counter { position: absolute; left: 5%; right: 5%; top: 30%; height: 14%; z-index: 8; }
      .counter-top { height: 42%; background: linear-gradient(180deg, #8a5227, #6b3d1c); border: 3px solid #1a0d04; border-radius: 4px; }
      .counter-front {
        height: 58%; background: linear-gradient(180deg, #4a2610, #34180a); border: 3px solid #1a0d04; border-top: none;
        display: flex; align-items: center; justify-content: space-around; padding: 0 20px; position: relative;
      }
      .espresso-machine { position: relative; width: 78px; height: 46px; }
      .esp-top { height: 8px; background: #c9ccd6; border: 2px solid #1a0d04; border-radius: 3px 3px 0 0; }
      .esp-body { height: 30px; background: linear-gradient(180deg, #8b8f9c, #4b4f5c); border: 2px solid #1a0d04; border-top: none; display: flex; gap: 6px; align-items: center; padding: 0 8px; }
      .esp-gauge { width: 8px; height: 8px; border-radius: 50%; background: #f59e0b; box-shadow: 0 0 6px #f59e0b; }
      .esp-cup { position: absolute; left: 50%; bottom: -8px; transform: translateX(-50%); width: 16px; height: 10px; background: #f8fafc; border: 2px solid #1a0d04; border-radius: 0 0 4px 4px; }
      .pastry-case { position: relative; width: 120px; height: 50px; }
      .pastry-glass { position: absolute; inset: 0 0 10px 0; background: linear-gradient(180deg, rgba(255,247,214,.22), rgba(255,247,214,.06)); border: 3px solid #1a0d04; border-radius: 6px 6px 0 0; }
      .pastry-items { position: absolute; left: 0; right: 0; top: 6px; display: flex; justify-content: space-around; font-size: 15px; }
      .counter-register { font-size: 22px; }

      .plant { position: absolute; font-size: 40px; filter: drop-shadow(0 4px 0 rgba(0,0,0,.4)); }
      .plant-a { left: 2%; bottom: 34%; }
      .plant-b { right: 2%; bottom: 30%; font-size: 34px; }

      .cafe-door {
        position: absolute; left: 3%; top: 33%; width: 76px; height: 96px;
        background: linear-gradient(180deg, #6b3d1c, #3d1f0c);
        border: 3px solid #1a0d04; border-radius: 6px 6px 0 0;
        display: flex; align-items: flex-end; justify-content: center; cursor: pointer;
        z-index: 9; transition: box-shadow .2s;
      }
      .cafe-door.near { box-shadow: 0 0 22px rgba(251,191,36,.8); }
      .cafe-door-glow { position: absolute; inset: 6px 6px 0; background: radial-gradient(ellipse at center, rgba(251,191,36,.35), transparent 70%); border-radius: 4px; }
      .cafe-door-sign { position: relative; z-index: 2; font-size: 8px; color: #ffe9b0; margin-bottom: 8px; text-shadow: 0 1px 0 #000; }

      .vip-booth {
        position: absolute; left: 50%; top: 62%; transform: translate(-50%, -50%);
        display: flex; align-items: center; gap: 6px; z-index: 6;
      }
      .vip-chair {
        width: 40px; height: 62px; background: linear-gradient(180deg, #8a3b1a, #5a2410);
        border: 3px solid #1a0d04; border-radius: 10px 10px 6px 6px;
      }
      .vip-table { position: relative; width: 128px; height: 84px; }
      .vip-table-top {
        position: absolute; left: 0; right: 0; top: 0; height: 20px;
        background: linear-gradient(180deg, #a6602f, #7a3f1a); border: 3px solid #1a0d04; border-radius: 8px;
        box-shadow: 0 6px 0 #3d1f0c;
      }
      .vip-table-leg { position: absolute; left: 50%; top: 20px; transform: translateX(-50%); width: 16px; height: 60px; background: #5a2410; border: 3px solid #1a0d04; border-top: none; }
      .vip-candle { position: absolute; left: 30%; top: -18px; font-size: 22px; animation: candleFlicker 1.4s infinite; }
      .vip-cup { position: absolute; right: 22%; top: -14px; font-size: 20px; }
      .vip-booth.hot .vip-table-top { box-shadow: 0 0 22px rgba(251,191,36,.75), 0 6px 0 #3d1f0c; }
      .cafe-prompt { bottom: calc(100% + 6px); }

      /* ---------- BOOTH (cinematic) ---------- */
      .booth-scene {
        position: absolute; inset: 0; z-index: 30;
        background: radial-gradient(ellipse at 50% 35%, #3a1c0c 0%, #1c0d05 45%, #0a0503 100%);
        display: flex; flex-direction: column;
      }
      .booth-backdrop {
        position: absolute; inset: 0;
        background:
          radial-gradient(circle at 20% 30%, rgba(245,158,11,.10), transparent 40%),
          radial-gradient(circle at 80% 30%, rgba(236,72,153,.08), transparent 40%);
      }
      .booth-spotlight {
        position: absolute; left: 50%; top: -10%; width: 70%; height: 90%; transform: translateX(-50%);
        background: radial-gradient(ellipse at center top, rgba(255,214,140,.22), transparent 62%);
        pointer-events: none;
      }
      .booth-topbar { position: relative; z-index: 5; display: flex; justify-content: space-between; align-items: center; padding: 16px 26px 0; }
      .booth-tag { font-size: 11px; color: #fcd34d; text-shadow: 0 0 12px rgba(245,158,11,.7), 2px 2px 0 #000; }

      .booth-stage { position: relative; z-index: 4; flex: 1; display: flex; align-items: center; justify-content: center; gap: 2vw; padding: 0 4vw; }
      .booth-avatar { display: flex; flex-direction: column; align-items: center; gap: 14px; }
      .booth-avatar.left { transform: translateY(10px); }
      .booth-avatar.right { transform: translateY(10px); }
      .booth-chair { position: relative; display: flex; align-items: flex-end; justify-content: center; }
      .booth-chair::before {
        content: ""; position: absolute; bottom: 6px; left: 50%; transform: translateX(-50%);
        width: 118%; height: 72%; z-index: 0;
        background: linear-gradient(180deg, #8a3b16, #4a1c0a);
        border: 4px solid #2a0f04; border-radius: 26px 26px 10px 10px;
        box-shadow: inset 0 8px 0 rgba(255,255,255,.07), 0 12px 26px rgba(0,0,0,.55);
      }
      .booth-chair::after {
        content: ""; position: absolute; bottom: -2px; left: 50%; transform: translateX(-50%);
        width: 138%; height: 24px; z-index: 1;
        background: linear-gradient(180deg, #b45309, #6b2a0e);
        border: 4px solid #2a0f04; border-radius: 12px;
      }
      .booth-chair > * { position: relative; z-index: 2; }
      .booth-name { font-size: 12px; text-shadow: 0 2px 0 #000; }
      .waiting { font-size: 9px; color: #a8a29e; }

      .booth-table { position: relative; width: min(38vw, 420px); height: 150px; display: flex; align-items: flex-end; justify-content: center; gap: 26px; padding-bottom: 6px; }
      .booth-table-surface {
        position: absolute; left: -10%; right: -10%; top: 38%; height: 60px;
        background: linear-gradient(180deg, #a6602f, #7a3f1a 60%, #5a2410);
        border: 4px solid #2a1206; border-radius: 12px;
        box-shadow: 0 14px 40px rgba(0,0,0,.6), inset 0 4px 0 rgba(255,255,255,.12);
      }
      .booth-table-edge { position: absolute; left: -6%; right: -6%; top: calc(38% + 60px); height: 16px; background: #3d1f0c; border: 4px solid #2a1206; border-top: none; border-radius: 0 0 12px 12px; }
      .mug-slot { position: relative; z-index: 3; }
      .mug { position: relative; display: flex; align-items: flex-end; justify-content: center; }
      .steam-wrap { position: absolute; left: 50%; bottom: 42%; transform: translateX(-50%); display: flex; }
      .steam { position: absolute; left: 50%; margin-left: -17px; bottom: 0; animation: steamRise 2.8s ease-out infinite; }
      .booth-heart {
        position: absolute; left: 50%; margin-left: -10px; top: 4%;
        color: #fb7185; font-size: 20px; opacity: .5;
        animation: floatHeart 2.6s ease-out infinite;
      }

      /* ---------- TERMINAL ---------- */
      .terminal {
        position: relative; z-index: 5;
        margin: 0 26px 20px; background: rgba(10,6,3,.92);
        border: 4px solid #5c2c15; border-radius: 10px;
        box-shadow: 0 0 40px rgba(0,0,0,.6), inset 0 0 40px rgba(0,0,0,.5);
        display: flex; flex-direction: column;
      }
      .terminal-head {
        display: flex; justify-content: space-between; align-items: center;
        padding: 10px 14px; border-bottom: 3px solid #3d1f0c;
        background: linear-gradient(180deg, #2a1206, #1a0b04);
        border-radius: 6px 6px 0 0;
      }
      .terminal-title { font-size: 9px; color: #fcd34d; }
      .terminal-status { font-size: 8px; color: #6ee7b7; }
      .terminal-log {
        height: 22vh; min-height: 120px; max-height: 260px; overflow-y: auto;
        padding: 12px 16px; display: flex; flex-direction: column; gap: 7px;
        font-family: 'VT323', monospace; font-size: 22px; line-height: 1.15;
      }
      .terminal-log::-webkit-scrollbar, .dock-log::-webkit-scrollbar { width: 8px; }
      .terminal-log::-webkit-scrollbar-thumb, .dock-log::-webkit-scrollbar-thumb { background: #5c2c15; border-radius: 4px; }
      .log-empty { color: #a89b8c; font-style: italic; font-size: 20px; }
      .log-empty.small { font-size: 17px; }
      .log-line { display: flex; gap: 8px; align-items: baseline; }
      .log-name { color: #fcd34d; }
      .log-sep { color: #6b7280; }
      .log-text { color: #f5f5f4; word-break: break-word; }
      .log-line.me .log-name { color: #67e8f9; }
      .log-line.me .log-text { color: #e0f2fe; }
      .log-line.them .log-name { color: #fda4af; }

      .terminal-input { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-top: 3px solid #3d1f0c; }
      .term-caret { color: #34d399; font-size: 18px; }
      .terminal-input input {
        flex: 1; min-width: 0; font-family: 'VT323', monospace; font-size: 22px;
        background: #050201; color: #f5f5f4; border: 2px solid #78350f; border-radius: 4px;
        padding: 8px 12px; outline: none;
      }
      .terminal-input input:focus { border-color: #f59e0b; box-shadow: 0 0 12px rgba(245,158,11,.5); }

      /* ---------- CHAT DOCK (overworld) ---------- */
      .chat-dock {
        position: absolute; left: 14px; bottom: 14px; z-index: 45;
        width: min(340px, 44vw);
        background: rgba(10,7,14,.86);
        border: 3px solid #3b2418; border-radius: 8px;
        box-shadow: 0 8px 24px rgba(0,0,0,.5);
        overflow: hidden;
        backdrop-filter: blur(2px);
      }
      .dock-log { max-height: 96px; overflow-y: auto; padding: 8px 10px 2px; font-family: 'VT323', monospace; font-size: 18px; }
      .dock-input { display: flex; gap: 8px; padding: 8px; border-top: 2px solid #3b2418; }
      .dock-input input {
        flex: 1; min-width: 0; font-family: 'VT323', monospace; font-size: 19px;
        background: #050201; color: #f5f5f4; border: 2px solid #4a2a12; border-radius: 4px; padding: 6px 10px; outline: none;
      }
      .dock-input input:focus { border-color: #f59e0b; }

      /* ---------- CONTROLS HINT ---------- */
      .controls-hint {
        position: absolute; left: 50%; bottom: 14px; transform: translateX(-50%); z-index: 44;
        display: flex; align-items: center; gap: 6px;
        background: rgba(8,6,14,.82); border: 2px solid #3b2418; border-radius: 6px;
        padding: 8px 14px; white-space: nowrap;
      }
      .key {
        display: grid; place-items: center; min-width: 22px; height: 22px; padding: 0 5px;
        font-size: 9px; color: #ffe9b0; background: #241a12;
        border: 2px solid #5c3a1e; border-bottom-width: 4px; border-radius: 4px;
      }
      .key.sm { min-width: 18px; height: 18px; font-size: 8px; }
      .hint-txt { font-size: 8px; color: #cbc3ba; margin-left: 8px; }

      .peer-elsewhere {
        position: absolute; right: 14px; bottom: 14px; z-index: 44;
        font-size: 8px; color: #fcd34d; background: rgba(8,6,14,.82);
        border: 2px solid #5c3a1e; border-radius: 6px; padding: 8px 12px;
        animation: floatY 2.4s ease-in-out infinite;
      }

      /* ---------- BUTTONS ---------- */
      .arcade-btn {
        font-family: 'Press Start 2P', monospace;
        border: 3px solid #000; border-radius: 5px;
        box-shadow: 4px 4px 0 #000;
        cursor: pointer; transition: transform .08s ease, box-shadow .08s ease;
        background: #16a34a; color: #fff; padding: 10px 16px; font-size: 10px;
      }
      .arcade-btn:hover { filter: brightness(1.1); }
      .arcade-btn:active { transform: translate(2px, 2px); box-shadow: 1px 1px 0 #000; }
      .arcade-btn.small { padding: 7px 10px; font-size: 8px; }
      .arcade-btn.ghost { background: #3f3f46; }
      .arcade-btn.danger { background: #b91c1c; }
      .arcade-btn.speak { background: #f59e0b; color: #2b1602; }

      /* ================= SELECT SCREEN ================= */
      .select-screen {
        position: absolute; inset: 0; display: grid; place-items: center; padding: 18px;
        background:
          radial-gradient(circle at 50% 22%, #3a1c3e 0%, #1a0f24 40%, #0a0713 100%);
      }
      .select-cabinet {
        position: relative; z-index: 2; width: min(1040px, 96vw); max-height: 94vh;
        display: flex; flex-direction: column;
        background: linear-gradient(180deg, #241a2e 0%, #150e1d 100%);
        border: 4px solid #000;
        border-radius: 16px;
        box-shadow: 0 0 0 4px #3b2418, 0 24px 60px rgba(0,0,0,.8), inset 0 0 60px rgba(0,0,0,.5);
        overflow: hidden;
      }
      .cabinet-marquee {
        position: relative; text-align: center; padding: 22px 18px 18px;
        background: linear-gradient(180deg, #451a03 0%, #2b1102 100%);
        border-bottom: 4px solid #000;
        overflow: hidden;
      }
      .marquee-lights {
        position: absolute; inset: 0;
        background-image: radial-gradient(circle, rgba(253,224,71,.9) 0 2px, transparent 3px);
        background-size: 28px 28px; opacity: .22; animation: marquee 1.6s linear infinite;
      }
      .game-title { position: relative; font-size: clamp(20px, 4vw, 40px); margin: 0; color: #fcd34d; letter-spacing: 2px; text-shadow: 0 0 18px rgba(245,158,11,.8), 4px 4px 0 #000; }
      .game-sub { position: relative; margin: 12px 0 0; font-size: clamp(8px, 1.4vw, 12px); color: #fdba74; letter-spacing: 2px; }
      .cabinet-body { padding: 20px 22px 22px; overflow-y: auto; }
      .select-hint { text-align: center; font-size: 9px; color: #c4b5fd; margin: 0 0 16px; }
      .char-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
      @media (max-width: 720px) { .char-grid { grid-template-columns: repeat(2, 1fr); } }

      .char-card {
        position: relative; cursor: pointer;
        background: linear-gradient(180deg, #241828 0%, #170f1c 100%);
        border: 3px solid #3b2f45; border-radius: 10px;
        padding: 14px 8px 12px; display: flex; flex-direction: column; align-items: center;
        transition: transform .14s ease, border-color .14s ease, box-shadow .14s ease;
        color: inherit; font-family: inherit;
      }
      .char-card:hover { transform: translateY(-5px); border-color: var(--card-glow); }
      .char-card.selected {
        border-color: var(--card-glow); transform: translateY(-6px);
        box-shadow: 0 0 0 2px rgba(0,0,0,.7), 0 0 26px -2px var(--card-glow);
        background: linear-gradient(180deg, #2c1d31 0%, #1c1222 100%);
      }
      .char-stage { height: 108px; display: flex; align-items: flex-end; justify-content: center; }
      .char-name { font-size: 12px; margin-top: 12px; color: #fff; }
      .char-gender { font-size: 7px; color: #a1a1aa; margin-top: 5px; }
      .char-title { font-size: 7px; color: var(--card-glow); margin-top: 4px; }
      .char-select-tag {
        position: absolute; top: 8px; right: 8px; font-size: 6px;
        background: var(--card-glow); color: #0a0713; padding: 3px 5px; border-radius: 3px; border: 2px solid #000;
      }

      .spawn-btn {
        display: block; width: 100%;
        font-family: 'Press Start 2P', monospace; font-size: clamp(10px, 1.6vw, 15px);
        background: linear-gradient(180deg, #22c55e, #15803d); color: #04210f;
        border: 4px solid #000; border-radius: 10px; padding: 18px 16px;
        box-shadow: 0 6px 0 #04210f, 0 0 30px -6px #22c55e; cursor: pointer;
        transition: transform .08s ease, box-shadow .08s ease;
      }
      .spawn-btn:hover { filter: brightness(1.06); }
      .spawn-btn:active { transform: translateY(4px); box-shadow: 0 2px 0 #04210f; }
      .spawn-btn:disabled { filter: grayscale(.4) brightness(.9); cursor: wait; }
      .status-line { text-align: center; font-size: 8px; color: #a1a1aa; margin: 14px 0 0; line-height: 1.6; }
      .status-line .bad { color: #fca5a5; }

      /* ================= RESPONSIVE ================= */
      @media (max-width: 900px) {
        .hud-center { display: none; }
      }
      @media (max-width: 680px) {
        .hud-user { display: none; }
        .controls-hint { display: none; }
        .chat-dock { width: min(300px, 62vw); bottom: 10px; left: 10px; }
        .shop-name { display: none; }
        .moon { width: 64px; height: 64px; }
      }
      @media (max-height: 620px) {
        .terminal-log { height: 16vh; min-height: 90px; }
        .booth-name { font-size: 10px; }
      }
    `}</style>
  );
}
