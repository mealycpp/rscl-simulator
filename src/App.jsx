import { useState, useRef, useEffect, useCallback } from "react";

const PC_TO_LY = 3.26156;
const SPY = 365.25 * 86400;

const TARGETS = [
  { galaxy:"Milky Way", system:"Proxima Centauri", planet:"Proxima Cen b", distance_pc:1.2948,  color:"#fff176", status:"Confirmed", disc_year:2016, notes:"Nearest known exoplanet — just 4.2 light-years away." },
  { galaxy:"Milky Way", system:"GJ 581",            planet:"GJ 581 c",      distance_pc:6.2981,  color:"#f48fb1", status:"Confirmed", disc_year:2007, notes:"Super-Earth near the inner edge of the habitable zone." },
  { galaxy:"Milky Way", system:"TRAPPIST-1",        planet:"TRAPPIST-1 e",  distance_pc:12.4299, color:"#4fc3f7", status:"Confirmed", disc_year:2017, notes:"Best habitable-zone rocky planet candidate known." },
  { galaxy:"Milky Way", system:"GJ 1214",           planet:"GJ 1214 b",     distance_pc:14.6427, color:"#80cbc4", status:"Confirmed", disc_year:2009, notes:"Likely a water-world or steam-atmosphere planet." },
  { galaxy:"Milky Way", system:"LHS 1140",          planet:"LHS 1140 b",    distance_pc:14.9861, color:"#ef9a9a", status:"Confirmed", disc_year:2017, notes:"Rocky super-Earth in the habitable zone of a red dwarf." },
  { galaxy:"Milky Way", system:"55 Cancri",         planet:"55 Cnc e",      distance_pc:12.590,  color:"#ffab91", status:"Confirmed", disc_year:2004, notes:"Ultra-hot super-Earth — possibly a lava world." },
  { galaxy:"Milky Way", system:"TOI-1231",          planet:"TOI-1231 b",    distance_pc:27.6227, color:"#ce93d8", status:"Confirmed", disc_year:2021, notes:"Warm sub-Neptune orbiting an M-dwarf star." },
  { galaxy:"Milky Way", system:"Kepler-22",         planet:"Kepler-22 b",   distance_pc:194.642, color:"#a5d6a7", status:"Confirmed", disc_year:2011, notes:"First confirmed planet in the habitable zone of a sun-like star." },
  { galaxy:"Milky Way", system:"Kepler-452",        planet:"Kepler-452 b",  distance_pc:551.727, color:"#ffcc80", status:"⚠ Controversial", disc_year:2015, notes:"Flagged as controversial by NASA — may be a false positive." },
];

const lyToSec    = ly => ly * SPY;
const secToYr    = s  => s / SPY;
const addSec     = (d, s) => new Date(d.getTime() + s * 1000);
const secBetween = (a, b) => (b.getTime() - a.getTime()) / 1000;

function toDistanceLY(v, u) {
  if (u === "light-minutes") return (v * 60) / SPY;
  if (u === "light-hours")   return (v * 3600) / SPY;
  if (u === "light-days")    return (v * 86400) / SPY;
  if (u === "light-years")   return v;
  if (u === "parsecs")       return v * PC_TO_LY;
  return v;
}
function fmtDelay(distanceLY) {
  const s = lyToSec(distanceLY);
  if (s < 120)    return s.toFixed(1) + " seconds";
  if (s < 7200)   return (s / 60).toFixed(1) + " minutes";
  if (s < 172800) return (s / 3600).toFixed(1) + " hours";
  if (s < SPY)    return (s / 86400).toFixed(1) + " days";
  if (distanceLY < 10) return distanceLY.toFixed(3) + " light-years";
  return Math.round(distanceLY).toLocaleString() + " light-years";
}
function fmtDT(d) {
  if (!d || isNaN(d.getTime())) return "—";
  return d.toISOString().replace("T", " ").slice(0, 19) + " UTC";
}
function fmtAge(n) {
  if (isNaN(n)) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: 1 }) + " yrs";
}

// ── CANVAS DRAW ──────────────────────────────────────────────────────────────
function drawScene(canvas, prog, target) {
  if (!canvas || !target) return;
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  const p = Math.max(0, Math.min(1, prog));
  const distanceLY = target._distanceLY != null ? target._distanceLY : target.distance_pc * PC_TO_LY;
  const col = target.color || "#4fc3f7";

  ctx.clearRect(0, 0, W, H);

  const bg = ctx.createLinearGradient(0, 0, W, 0);
  bg.addColorStop(0, "#010510");
  bg.addColorStop(0.5, "#020c1e");
  bg.addColorStop(1, "#010510");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  [[W * 0.2, H * 0.3, 90, "rgba(20,0,60,0.3)"], [W * 0.75, H * 0.6, 70, "rgba(0,20,80,0.25)"]].forEach(function(n) {
    var g = ctx.createRadialGradient(n[0], n[1], 0, n[0], n[1], n[2]);
    g.addColorStop(0, n[3]);
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(n[0], n[1], n[2], 0, Math.PI * 2);
    ctx.fill();
  });

  var seed = function(n) { var s = n * 9301 + 49297; return (s % 233280) / 233280; };
  for (var i = 0; i < 140; i++) {
    var sx = seed(i * 3) * W, sy = seed(i * 3 + 1) * H, sr = seed(i * 3 + 2) * 1.4 + 0.2;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(200,220,255," + (0.2 + seed(i * 7) * 0.65) + ")";
    ctx.fill();
  }

  var PX = 130, EX = W - 120, MY = H / 2, span = EX - PX;

  ctx.font = "bold 13px 'IBM Plex Mono',monospace";
  ctx.fillStyle = "rgba(0,200,255,0.35)";
  ctx.textAlign = "center";
  ctx.fillText("✦  " + target.galaxy + "  ✦", W / 2, 22);

  ctx.strokeStyle = "rgba(0,180,255,0.12)";
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 8]);
  ctx.beginPath();
  ctx.moveTo(PX, MY);
  ctx.lineTo(EX, MY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.font = "12px 'IBM Plex Mono',monospace";
  ctx.fillStyle = "rgba(0,180,255,0.3)";
  ctx.textAlign = "center";
  ctx.fillText("← " + fmtDelay(distanceLY) + " →", W / 2, MY - 18);

  var sX = PX - 55, sY = MY - 40;
  var stG = ctx.createRadialGradient(sX, sY, 0, sX, sY, 22);
  stG.addColorStop(0, "rgba(255,248,200,1)");
  stG.addColorStop(0.4, "rgba(255,200,80,0.4)");
  stG.addColorStop(1, "transparent");
  ctx.fillStyle = stG;
  ctx.beginPath();
  ctx.arc(sX, sY, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(sX, sY, 6, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,220,1)";
  ctx.fill();
  for (var ri = 0; ri < 8; ri++) {
    var ra = ri * Math.PI / 4;
    ctx.beginPath();
    ctx.moveTo(sX + Math.cos(ra) * 8, sY + Math.sin(ra) * 8);
    ctx.lineTo(sX + Math.cos(ra) * 18, sY + Math.sin(ra) * 18);
    ctx.strokeStyle = "rgba(255,230,100,0.35)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(PX, MY, 30 * 2.8, 0, Math.PI * 2);
  ctx.fillStyle = col + "18";
  ctx.fill();

  var pG = ctx.createRadialGradient(PX - 9, MY - 9, 3, PX, MY, 30);
  pG.addColorStop(0, "rgba(255,255,255,0.3)");
  pG.addColorStop(0.4, col);
  pG.addColorStop(1, "rgba(0,0,0,0.7)");
  ctx.beginPath();
  ctx.arc(PX, MY, 30, 0, Math.PI * 2);
  ctx.fillStyle = pG;
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(PX, MY, 30, 0, Math.PI * 2);
  ctx.clip();
  ctx.strokeStyle = "rgba(0,0,0,0.12)";
  ctx.lineWidth = 3;
  [-10, 3, 14].forEach(function(dy) {
    ctx.beginPath();
    ctx.ellipse(PX, MY + dy, 30, 6, 0, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.restore();

  ctx.beginPath();
  ctx.arc(PX, MY, 34, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(PX, MY + 8, 46, 12, 0, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.font = "bold 15px 'IBM Plex Mono',monospace";
  ctx.fillStyle = col;
  ctx.textAlign = "center";
  ctx.fillText(target.planet, PX, MY + 58);
  ctx.font = "12px 'IBM Plex Mono',monospace";
  ctx.fillStyle = "rgba(0,200,255,0.5)";
  ctx.fillText(target.system, PX, MY + 74);

  if (p < 0.05) {
    var f = 1 - p / 0.05;
    ctx.beginPath();
    ctx.arc(PX, MY, 30 + f * 32, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255," + (f * 0.55) + ")";
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  var sigX = PX + span * p;
  if (p > 0) {
    var tLen = Math.min(span * p, 220);
    var tG = ctx.createLinearGradient(sigX - tLen, MY, sigX, MY);
    tG.addColorStop(0, "transparent");
    tG.addColorStop(0.6, "rgba(0,200,255,0.07)");
    tG.addColorStop(1, "rgba(0,235,255,0.65)");
    ctx.strokeStyle = tG;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(Math.max(PX, sigX - tLen), MY);
    ctx.lineTo(sigX, MY);
    ctx.stroke();

    [0, 1, 2].forEach(function(ri) {
      ctx.beginPath();
      ctx.arc(sigX, MY, 6 + ri * 7, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(0,225,255," + (0.55 - ri * 0.18) + ")";
      ctx.lineWidth = 1.3;
      ctx.stroke();
    });

    var ph = ctx.createRadialGradient(sigX, MY, 0, sigX, MY, 9);
    ph.addColorStop(0, "rgba(255,255,255,1)");
    ph.addColorStop(0.4, "rgba(0,245,255,0.95)");
    ph.addColorStop(1, "transparent");
    ctx.fillStyle = ph;
    ctx.beginPath();
    ctx.arc(sigX, MY, 9, 0, Math.PI * 2);
    ctx.fill();
  }

  if (p > 0.04 && p < 0.96) {
    var traveledLY = distanceLY * p;
    ctx.font = "12px 'IBM Plex Mono',monospace";
    ctx.fillStyle = "rgba(0,240,255,0.85)";
    ctx.textAlign = "center";
    ctx.fillText((traveledLY < 1 ? fmtDelay(traveledLY) : traveledLY.toFixed(1) + " ly") + " traveled", sigX, MY - 28);
  }

  [0.25, 0.5, 0.75].forEach(function(t) {
    var tx = PX + span * t;
    ctx.strokeStyle = "rgba(0,180,255,0.2)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tx, MY + 5);
    ctx.lineTo(tx, MY + 14);
    ctx.stroke();
    var tickLY = distanceLY * t;
    ctx.font = "10px 'IBM Plex Mono',monospace";
    ctx.fillStyle = "rgba(0,180,255,0.3)";
    ctx.textAlign = "center";
    ctx.fillText(tickLY < 1 ? fmtDelay(tickLY) : tickLY.toFixed(1) + " ly", tx, MY + 26);
  });

  var eGl = ctx.createRadialGradient(EX, MY, 10, EX, MY, 90);
  eGl.addColorStop(0, "rgba(0,100,255,0.2)");
  eGl.addColorStop(1, "transparent");
  ctx.fillStyle = eGl;
  ctx.beginPath();
  ctx.arc(EX, MY, 90, 0, Math.PI * 2);
  ctx.fill();

  var eG = ctx.createRadialGradient(EX - 10, MY - 10, 3, EX, MY, 30);
  eG.addColorStop(0, "rgba(140,215,255,0.95)");
  eG.addColorStop(0.3, "#1565c0");
  eG.addColorStop(0.75, "#0d47a1");
  eG.addColorStop(1, "rgba(0,6,40,0.9)");
  ctx.beginPath();
  ctx.arc(EX, MY, 30, 0, Math.PI * 2);
  ctx.fillStyle = eG;
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(EX, MY, 30, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = "rgba(55,168,75,0.75)";
  [[EX - 12, MY - 10, 10, 7, 0.3], [EX + 8, MY + 7, 12, 8, 0.2], [EX - 5, MY + 12, 8, 5, 0.4]].forEach(function(v) {
    ctx.beginPath();
    ctx.ellipse(v[0], v[1], v[2], v[3], v[4], 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();

  ctx.beginPath();
  ctx.arc(EX, MY, 35, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(110,190,255,0.3)";
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(EX, MY + 10, 48, 13, 0, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(100,180,255,0.12)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.font = "bold 15px 'IBM Plex Mono',monospace";
  ctx.fillStyle = "#4fc3f7";
  ctx.textAlign = "center";
  ctx.fillText("EARTH", EX, MY + 58);
  ctx.font = "12px 'IBM Plex Mono',monospace";
  ctx.fillStyle = "rgba(0,200,255,0.5)";
  ctx.fillText("Observer", EX, MY + 74);

  if (p > 0.95) {
    var fl = (p - 0.95) / 0.05;
    ctx.beginPath();
    ctx.arc(EX, MY, 30 + fl * 55, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(0,255,200," + ((1 - fl) * 0.9) + ")";
    ctx.lineWidth = 3.5;
    ctx.stroke();
    var bg2 = ctx.createRadialGradient(EX, MY, 0, EX, MY, 100);
    bg2.addColorStop(0, "rgba(0,255,180," + (fl * 0.3) + ")");
    bg2.addColorStop(1, "transparent");
    ctx.fillStyle = bg2;
    ctx.beginPath();
    ctx.arc(EX, MY, 100, 0, Math.PI * 2);
    ctx.fill();
  }

  if (p >= 1) {
    ctx.font = "bold 16px 'IBM Plex Mono',monospace";
    ctx.fillStyle = "rgba(0,245,110,0.95)";
    ctx.textAlign = "center";
    ctx.fillText("✓  SIGNAL OBSERVED ON EARTH", EX, MY - 66);
    ctx.font = "13px 'IBM Plex Mono',monospace";
    ctx.fillStyle = "rgba(0,200,255,0.75)";
    ctx.fillText("Delay: " + fmtDelay(distanceLY), EX, MY - 48);
  }
}

// ── STARFIELD ────────────────────────────────────────────────────────────────
function StarField() {
  const ref = useRef();
  useEffect(() => {
    const c = ref.current, ctx = c.getContext("2d");
    let W, H, stars, raf;
    function init() {
      W = c.width = window.innerWidth;
      H = c.height = window.innerHeight;
      stars = Array.from({ length: 280 }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        r: Math.random() * 1.4 + 0.2,
        a: Math.random() * 0.6 + 0.2,
        sp: Math.random() * 0.25 + 0.04,
        ph: Math.random() * Math.PI * 2
      }));
    }
    init();
    let t = 0;
    function draw() {
      ctx.clearRect(0, 0, W, H);
      stars.forEach(s => {
        const a = s.a * (0.5 + 0.5 * Math.sin(t * s.sp + s.ph));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(180,220,255," + a + ")";
        ctx.fill();
      });
      t += 0.01;
      raf = requestAnimationFrame(draw);
    }
    draw();
    window.addEventListener("resize", init);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", init); };
  }, []);
  return <canvas ref={ref} style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: 0, pointerEvents: "none" }} />;
}

// ── RSCL SEAL ────────────────────────────────────────────────────────────────
function RSCLSeal({ size = 130 }) {
  const r = size / 2, cx = r, cy = r, outerR = r - 2, innerR = r - 14, coreR = r - 28;
  const arcText = (text, radius, startAngle, ls = 8.2) => text.split("").map((ch, i) => {
    const total = (text.length - 1) * ls, angle = startAngle + i * ls - total / 2, rad = angle * Math.PI / 180;
    const x = cx + radius * Math.sin(rad), y = cy - radius * Math.cos(rad);
    return (
      <text
        key={i}
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="middle"
        transform={"rotate(" + angle + "," + x + "," + y + ")"}
        style={{ fontSize: size * 0.073, fontFamily: "Georgia,serif", fill: "#c8dff0", fontWeight: 600 }}
      >
        {ch}
      </text>
    );
  });
  const g = coreR * 0.38;
  return (
    <svg width={size} height={size} viewBox={"0 0 " + size + " " + size}
      style={{ display: "block", filter: "drop-shadow(0 0 14px rgba(0,200,255,0.4))" }}>
      <defs>
        <radialGradient id="sg"><stop offset="0%" stopColor="#0a2a4a" /><stop offset="100%" stopColor="#020811" /></radialGradient>
        <radialGradient id="cg"><stop offset="0%" stopColor="#0d3560" /><stop offset="100%" stopColor="#041830" /></radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={outerR} fill="url(#sg)" stroke="rgba(0,200,255,0.65)" strokeWidth={1.5} />
      <circle cx={cx} cy={cy} r={outerR - 6} fill="none" stroke="rgba(0,200,255,0.2)" strokeWidth={0.8} strokeDasharray="3 4" />
      <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="rgba(0,200,255,0.4)" strokeWidth={1} />
      <circle cx={cx} cy={cy} r={coreR} fill="url(#cg)" stroke="rgba(0,200,255,0.5)" strokeWidth={1} />
      {arcText("RECONFIGURABLE · SPACE · COMPUTING · LAB", outerR - 9, 0, 8.2)}
      {arcText("CAL POLY POMONA", outerR - 9, 180, 10.5)}
      <rect x={cx - g} y={cy - g} width={g * 2} height={g * 2} rx={3} fill="rgba(0,200,255,0.1)" stroke="rgba(0,200,255,0.7)" strokeWidth={1.2} />
      {[1, 2].map(i => [
        <line key={"h" + i} x1={cx - g} y1={cy - g + i * (g * 2 / 3)} x2={cx + g} y2={cy - g + i * (g * 2 / 3)} stroke="rgba(0,200,255,0.25)" strokeWidth={0.6} />,
        <line key={"v" + i} x1={cx - g + i * (g * 2 / 3)} y1={cy - g} x2={cx - g + i * (g * 2 / 3)} y2={cy + g} stroke="rgba(0,200,255,0.25)" strokeWidth={0.6} />
      ])}
      {[-1, 0, 1].map(pp => [
        <line key={"pl" + pp} x1={cx - g} y1={cy + pp * g * 0.55} x2={cx - g - g * 0.35} y2={cy + pp * g * 0.55} stroke="rgba(0,200,255,0.6)" strokeWidth={1} />,
        <line key={"pr" + pp} x1={cx + g} y1={cy + pp * g * 0.55} x2={cx + g + g * 0.35} y2={cy + pp * g * 0.55} stroke="rgba(0,200,255,0.6)" strokeWidth={1} />,
        <line key={"pt" + pp} x1={cx + pp * g * 0.55} y1={cy - g} x2={cx + pp * g * 0.55} y2={cy - g - g * 0.35} stroke="rgba(0,200,255,0.6)" strokeWidth={1} />,
        <line key={"pb" + pp} x1={cx + pp * g * 0.55} y1={cy + g} x2={cx + pp * g * 0.55} y2={cy + g + g * 0.35} stroke="rgba(0,200,255,0.6)" strokeWidth={1} />
      ])}
      <circle cx={cx} cy={cy} r={g * 1.5} fill="none" stroke="rgba(0,200,255,0.15)" strokeWidth={0.8} strokeDasharray="2 3" />
      <circle cx={cx + g * 1.5 * Math.cos(-40 * Math.PI / 180)} cy={cy + g * 1.5 * Math.sin(-40 * Math.PI / 180)} r={2.5} fill="#00c8ff" opacity={0.85} />
      <text x={cx} y={cy + coreR * 0.68} textAnchor="middle" dominantBaseline="middle"
        style={{ fontSize: size * 0.108, fontFamily: "Georgia,serif", fill: "rgba(0,200,255,0.92)", fontWeight: 700, letterSpacing: 1 }}>
        RSCL@CPP
      </text>
      {[0, 90, 180, 270].map(a => {
        const rad = (a - 90) * Math.PI / 180;
        return <circle key={a} cx={cx + outerR * Math.cos(rad)} cy={cy + outerR * Math.sin(rad)} r={2.2} fill="#00c8ff" opacity={0.85} />;
      })}
    </svg>
  );
}

// ── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  // target
  const [tIdx, setTIdx]     = useState(0);
  const [manualMode, setManualMode] = useState(false);
  const [mGal, setMGal]     = useState("Milky Way");
  const [mSys, setMSys]     = useState("Solar System");
  const [mPla, setMPla]     = useState("Mars");
  const [mDist, setMDist]   = useState("12.5");
  const [mUnit, setMUnit]   = useState("light-minutes");

  // event
  const [ageEv, setAgeEv]   = useState("25");
  const [lspan, setLspan]   = useState("80");
  const [autoTime, setAutoTime] = useState(true);
  const [evD, setEvD]       = useState("2026-01-01");
  const [evT, setEvT]       = useState("00:00");
  const [obsD, setObsD]     = useState(new Date().toISOString().slice(0, 10));
  const [obsT, setObsT]     = useState(new Date().toISOString().slice(11, 16));
  const [clipV, setClipV]   = useState("30");
  const [clipU, setClipU]   = useState("seconds");

  // media
  const [mediaURL, setMediaURL]   = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [mediaName, setMediaName] = useState("");
  const [videoDur, setVideoDur]   = useState(0);
  const fileRef  = useRef();
  const videoSrcRef = useRef();
  const videoRcvRef = useRef();

  // playback
  const [prog, setProg]     = useState(0);
  const [playing, setPlaying] = useState(false);
  const [spd, setSpd]       = useState(1);
  const playR = useRef(false), spdR = useRef(1), progR = useRef(0);
  const rafR = useRef(), lastT = useRef(null);
  const canvasRef = useRef();

  useEffect(() => { spdR.current = spd; }, [spd]);
  useEffect(() => { progR.current = prog; }, [prog]);

  useEffect(() => {
    if (!playing) {
      playR.current = false;
      cancelAnimationFrame(rafR.current);
      lastT.current = null;
      return;
    }
    playR.current = true;
    const tick = now => {
      if (!playR.current) return;
      if (lastT.current === null) lastT.current = now;
      const dt = (now - lastT.current) / 1000;
      lastT.current = now;
      const next = Math.min(progR.current + dt * spdR.current * 0.032, 1);
      progR.current = next;
      setProg(next);
      if (next >= 1) {
        playR.current = false;
        setPlaying(false);
        return;
      }
      rafR.current = requestAnimationFrame(tick);
    };
    rafR.current = requestAnimationFrame(tick);
    return () => {
      playR.current = false;
      cancelAnimationFrame(rafR.current);
    };
  }, [playing]);

  const target = manualMode
    ? {
        galaxy: mGal,
        system: mSys,
        planet: mPla,
        color: "#80cbc4",
        status: "Manual",
        notes: "User-supplied distance.",
        disc_year: NaN,
        _distanceLY: toDistanceLY(parseFloat(mDist) || 0, mUnit)
      }
    : TARGETS[tIdx];

  const distanceLY = target._distanceLY != null ? target._distanceLY : target.distance_pc * PC_TO_LY;
  const delaySec   = lyToSec(distanceLY);
  const delayYears = delaySec / SPY;

  useEffect(() => { drawScene(canvasRef.current, prog, target); }, [prog, target]);

  // dates
  const obsDT    = new Date(obsD + "T" + (obsT || "00:00") + ":00Z");
  const evDT     = autoTime ? addSec(obsDT, -delaySec) : new Date(evD + "T" + (evT || "00:00") + ":00Z");
  const arrStart = addSec(evDT, delaySec);
  const clipSec  = videoDur > 0 ? videoDur : (parseFloat(clipV) || 0) * ({ seconds: 1, minutes: 60, hours: 3600, days: 86400, years: SPY }[clipU] || 1);
  const arrEnd   = addSec(arrStart, clipSec);

  // ── simulation state driven by button + slider ──
  const age0 = parseFloat(ageEv) || 0;
  const ls   = parseFloat(lspan) || 80;

  const simProg      = Math.max(0, Math.min(1, prog));
  const simTravelSec = delaySec * simProg;
  const simDT        = addSec(evDT, simTravelSec);
  const arrivedOnEarth = simProg >= 1;

  const apparentAge      = arrivedOnEarth ? age0 : NaN;
  const actualNow        = age0 + secToYr(simTravelSec);
  const ageWhenSeen      = age0 + delayYears;
  const hiddenByDelayNow = actualNow - age0;

  const aliveWhenSeen = ageWhenSeen < ls;
  const aliveNow      = actualNow < ls;

  let recS = "not_emitted";
  if (simProg > 0 && simProg < 1) recS = "traveling";
  if (arrivedOnEarth) recS = "arrived";

  useEffect(() => {
    const v = videoRcvRef.current;
    if (!v || mediaType !== "video") return;
    if (!arrivedOnEarth) {
      v.currentTime = 0;
      v.pause();
      return;
    }
    v.currentTime = 0;
  }, [arrivedOnEarth, mediaType]);

  const handleMedia = useCallback(file => {
    if (!file) return;
    if (mediaURL) URL.revokeObjectURL(mediaURL);
    const url = URL.createObjectURL(file);
    setMediaURL(url);
    setMediaName(file.name);
    const isVid = file.type.startsWith("video");
    setMediaType(isVid ? "video" : "image");
    setVideoDur(0);
    if (isVid) {
      const tmp = document.createElement("video");
      tmp.src = url;
      tmp.onloadedmetadata = () => {
        setVideoDur(tmp.duration);
        setClipV(Math.round(tmp.duration).toString());
        setClipU("seconds");
      };
    }
  }, [mediaURL]);

  const handlePP = () => {
    if (prog >= 1) {
      setProg(0);
      progR.current = 0;
    }
    setPlaying(p => !p);
    lastT.current = null;
  };

  const handleProg = v => {
    setProg(v);
    progR.current = v;
  };

  const accent = "#00c8ff";
  const panel = "rgba(4,18,38,0.96)";
  const border = "rgba(0,180,255,0.22)";
  const dim = "#6a8aaa";
  const bright = "#e8f4ff";
  const textCol = "#c8dff0";
  const ok = "#00e87a";
  const danger = "#ff5f5f";
  const warn = "#f5c842";

  const inp = {
    background: "rgba(0,12,34,0.9)",
    border: "1px solid " + border,
    borderRadius: 8,
    padding: "12px 16px",
    color: textCol,
    fontSize: 17,
    fontFamily: "'IBM Plex Mono',monospace",
    outline: "none",
    width: "100%"
  };
  const sel = { ...inp, appearance: "none", cursor: "pointer" };

  const StepLabel = ({ n, text }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(0,200,255,0.15)", border: "2px solid " + accent, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace", fontSize: 15, fontWeight: 700, color: accent, flexShrink: 0 }}>{n}</div>
      <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 13, color: accent, letterSpacing: 3, textTransform: "uppercase", fontWeight: 700 }}>{text}</div>
    </div>
  );

  const InfoCard = ({ label, value, color, sub }) => (
    <div style={{ background: "rgba(0,200,255,0.06)", border: "1px solid " + border, borderRadius: 10, padding: "14px 18px" }}>
      <div style={{ fontSize: 12, color: dim, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || accent, fontFamily: "'IBM Plex Mono',monospace", lineHeight: 1.2 }}>{value}</div>
      {sub && <div style={{ fontSize: 13, color: dim, marginTop: 6, lineHeight: 1.5 }}>{sub}</div>}
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@600;700;900&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #020811; color: ${textCol}; font-family: 'IBM Plex Mono', monospace; font-size: 16px; line-height: 1.65; min-height: 100vh; }
        h1, h2, h3 { font-family: 'Orbitron', sans-serif; }
        select option { background: #020811; color: ${textCol}; }
        input[type=date], input[type=time] {
          background: rgba(0,12,34,0.9);
          color: ${textCol};
          border: 1px solid ${border};
          border-radius: 8px;
          padding: 12px 16px;
          outline: none;
          width: 100%;
          font-size: 17px;
          font-family: 'IBM Plex Mono', monospace;
          color-scheme: dark;
        }
        input[type=range] {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 8px;
          border-radius: 4px;
          background: rgba(0,180,255,0.18);
          outline: none;
          cursor: pointer;
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: ${accent};
          border: 3px solid #fff;
          cursor: pointer;
          box-shadow: 0 0 12px ${accent}99;
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: rgba(0,180,255,0.25); border-radius: 3px; }
        @keyframes fadein { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
        @keyframes glow { 0%,100% { box-shadow: 0 0 20px rgba(0,232,122,0.3); } 50% { box-shadow: 0 0 40px rgba(0,232,122,0.6); } }
        .fadein { animation: fadein 0.5s ease; }
        .step { background: ${panel}; border: 1px solid ${border}; border-radius: 16px; padding: 28px 30px; margin-bottom: 20px; }
        .g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .g3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
        @media (max-width: 700px) { .g2, .g3 { grid-template-columns: 1fr; } }
        details > summary { list-style: none; cursor: pointer; }
        details > summary::-webkit-details-marker { display: none; }
      `}</style>

      <StarField />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 900, margin: "0 auto", padding: "40px 20px 100px" }}>

        {/* ── HEADER ── */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}><RSCLSeal size={140} /></div>
          <div style={{ fontSize: 13, letterSpacing: 5, color: dim, textTransform: "uppercase", marginBottom: 10 }}>
            Reconfigurable Space Computing Lab · Cal Poly Pomona
          </div>
          <h1 style={{ fontSize: "clamp(32px,6vw,56px)", fontWeight: 900, color: "#fff", textShadow: "0 0 60px " + accent + "55", lineHeight: 1.0, marginBottom: 6 }}>
            EARTH LOOKBACK
          </h1>
          <h2 style={{ fontSize: "clamp(15px,3vw,24px)", fontWeight: 600, color: accent, letterSpacing: 12, marginBottom: 16 }}>
            SIMULATOR
          </h2>
          <p style={{ color: dim, fontSize: 17, lineHeight: 1.8, maxWidth: 540, margin: "0 auto" }}>
            Choose a real exoplanet, upload a photo or video, and watch your signal travel across the cosmos to Earth.
          </p>
        </div>

        {/* ── STEP 1: CHOOSE WORLD ── */}
        <div className="step">
          <StepLabel n="1" text="Choose Your World" />

          <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
            <button onClick={() => setManualMode(false)} style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: !manualMode ? accent : "rgba(0,180,255,0.09)", color: !manualMode ? "#000" : dim, fontFamily: "monospace", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              Catalog
            </button>
            <button onClick={() => setManualMode(true)} style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: manualMode ? accent : "rgba(0,180,255,0.09)", color: manualMode ? "#000" : dim, fontFamily: "monospace", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              Manual Entry
            </button>
          </div>

          {!manualMode ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10, marginBottom: 18 }}>
                {TARGETS.map((t, i) => (
                  <button key={i} onClick={() => { setTIdx(i); setProg(0); setPlaying(false); progR.current = 0; }}
                    style={{ padding: "12px 14px", borderRadius: 10, border: "2px solid " + (tIdx === i ? t.color : "rgba(0,180,255,0.15)"), background: tIdx === i ? "rgba(0,200,255,0.1)" : "rgba(0,10,30,0.6)", cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <div style={{ width: 11, height: 11, borderRadius: "50%", background: t.color, boxShadow: "0 0 7px " + t.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 14, fontWeight: 700, color: tIdx === i ? t.color : bright, fontFamily: "monospace" }}>{t.planet}</span>
                    </div>
                    <div style={{ fontSize: 12, color: dim }}>{t.system}</div>
                    <div style={{ fontSize: 12, color: tIdx === i ? accent : dim, marginTop: 2 }}>
                      {fmtDelay(t.distance_pc * PC_TO_LY)}
                    </div>
                    {t.status.includes("⚠") && <div style={{ fontSize: 11, color: warn, marginTop: 3 }}>⚠ Controversial</div>}
                  </button>
                ))}
              </div>
              <div style={{ padding: "14px 18px", background: "rgba(0,200,255,0.05)", border: "1px solid " + border, borderRadius: 10, fontSize: 15, color: dim, lineHeight: 1.7 }}>
                <span style={{ color: bright, fontWeight: 600 }}>{target.planet}</span> · {target.galaxy} · <span style={{ color: accent }}>{fmtDelay(distanceLY)} away</span>
                {target.disc_year && !isNaN(target.disc_year) && <span> · Discovered {target.disc_year}</span>}
                <br />{target.notes}
              </div>
            </>
          ) : (
            <div className="g2">
              {[["Galaxy", mGal, setMGal], ["System / Star", mSys, setMSys], ["Planet / Target", mPla, setMPla]].map(([l, v, s]) => (
                <div key={l}>
                  <div style={{ fontSize: 13, color: dim, marginBottom: 6, letterSpacing: 1, textTransform: "uppercase" }}>{l}</div>
                  <input value={v} onChange={e => s(e.target.value)} style={inp} />
                </div>
              ))}
              <div>
                <div style={{ fontSize: 13, color: dim, marginBottom: 6, letterSpacing: 1, textTransform: "uppercase" }}>Distance</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input type="number" value={mDist} onChange={e => setMDist(e.target.value)} min="0" step="0.1" style={{ ...inp, width: "50%" }} />
                  <select value={mUnit} onChange={e => setMUnit(e.target.value)} style={{ ...sel, width: "50%" }}>
                    {["light-minutes", "light-hours", "light-days", "light-years", "parsecs"].map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── STEP 2: YOUR EVENT ── */}
        <div className="step">
          <StepLabel n="2" text="Your Event" />

          <div
            onClick={() => fileRef.current && fileRef.current.click()}
            style={{ border: "2px dashed " + (mediaURL ? "rgba(0,232,122,0.5)" : border), borderRadius: 12, padding: "24px", textAlign: "center", cursor: "pointer", background: mediaURL ? "rgba(0,232,122,0.04)" : "rgba(0,10,30,0.5)", marginBottom: 20, transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.background = "rgba(0,200,255,0.06)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = mediaURL ? "rgba(0,232,122,0.5)" : border; e.currentTarget.style.background = mediaURL ? "rgba(0,232,122,0.04)" : "rgba(0,10,30,0.5)"; }}
          >
            {mediaURL ? (
              <div>
                <div style={{ fontSize: 28, marginBottom: 6 }}>{mediaType === "video" ? "🎬" : "🖼️"}</div>
                <div style={{ fontSize: 16, color: ok, fontWeight: 600, marginBottom: 4 }}>✓  {mediaName}</div>
                <div style={{ fontSize: 14, color: dim }}>
                  {mediaType === "video" && videoDur > 0 ? "Duration: " + videoDur.toFixed(1) + "s — " : ""}
                  Click to change
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 36, marginBottom: 8 }}>📷</div>
                <div style={{ fontSize: 17, color: bright, fontWeight: 600, marginBottom: 6 }}>Upload your image or video</div>
                <div style={{ fontSize: 15, color: dim }}>This is what you're sending from {target.planet} — watch it travel to Earth</div>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*,video/mp4,video/webm,video/ogg" style={{ display: "none" }} onChange={e => handleMedia(e.target.files[0])} />

          <div className="g2" style={{ marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 13, color: dim, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Person's age at this event</div>
              <input type="number" value={ageEv} onChange={e => setAgeEv(e.target.value)} min="0" step="1" style={inp} />
            </div>
            <div>
              <div style={{ fontSize: 13, color: dim, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Expected lifespan (years)</div>
              <input type="number" value={lspan} onChange={e => setLspan(e.target.value)} min="1" step="1" style={inp} />
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <button onClick={() => setAutoTime(true)} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", background: autoTime ? accent : "rgba(0,180,255,0.09)", color: autoTime ? "#000" : dim, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
              Auto timing
            </button>
            <button onClick={() => setAutoTime(false)} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", background: !autoTime ? accent : "rgba(0,180,255,0.09)", color: !autoTime ? "#000" : dim, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
              Set event date
            </button>
          </div>

          {autoTime ? (
            <div style={{ padding: "12px 16px", background: "rgba(0,232,122,0.07)", border: "1px solid rgba(0,232,122,0.25)", borderRadius: 8, fontSize: 15, color: ok }}>
              ✓ Auto mode — event is set so the signal arrives at Earth right now ({fmtDT(obsDT)})
            </div>
          ) : (
            <div className="g2">
              <div><div style={{ fontSize: 13, color: dim, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Event date at {target.planet}</div><input type="date" value={evD} onChange={e => setEvD(e.target.value)} /></div>
              <div><div style={{ fontSize: 13, color: dim, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Event time (UTC)</div><input type="time" value={evT} onChange={e => setEvT(e.target.value)} /></div>
            </div>
          )}

          {mediaType !== "video" && (
            <div className="g2" style={{ marginTop: 14 }}>
              <div>
                <div style={{ fontSize: 13, color: dim, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Earth observation date</div>
                <input type="date" value={obsD} onChange={e => setObsD(e.target.value)} />
              </div>
              <div>
                <div style={{ fontSize: 13, color: dim, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Earth observation time (UTC)</div>
                <input type="time" value={obsT} onChange={e => setObsT(e.target.value)} />
              </div>
            </div>
          )}
        </div>

        {/* ── STEP 3: VISUALIZER ── */}
        <div style={{ background: "rgba(1,4,16,0.98)", border: "1px solid " + border, borderRadius: 18, overflow: "hidden", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 24px", background: "rgba(0,15,45,0.9)", borderBottom: "1px solid " + border }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: target.color, boxShadow: "0 0 8px " + target.color }} />
              <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 13, color: accent, letterSpacing: 3, fontWeight: 700 }}>STEP 3 — WATCH THE SIGNAL TRAVEL</span>
            </div>
            <span style={{ fontSize: 14, color: dim }}>{target.planet}  →  Earth</span>
          </div>

          <canvas ref={canvasRef} width={900} height={220} style={{ width: "100%", height: 220, display: "block" }} />

          <div style={{ padding: "18px 24px", background: "rgba(0,6,22,0.95)", borderTop: "1px solid " + border }}>
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 14, color: dim }}>Emitted from {target.planet}</span>
                <span style={{ fontSize: 16, color: accent, fontWeight: 700 }}>
                  {(prog * 100).toFixed(1)}%  ·  {fmtDelay(distanceLY * Math.max(prog, 0.00001))} of {fmtDelay(distanceLY)}
                </span>
                <span style={{ fontSize: 14, color: dim }}>Received on Earth</span>
              </div>
              <input type="range" min={0} max={1} step={0.0005} value={prog} onChange={e => handleProg(parseFloat(e.target.value))} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
                {["0%", "25%", "50%", "75%", "100%"].map(l => <span key={l} style={{ fontSize: 12, color: "rgba(0,180,255,0.3)" }}>{l}</span>)}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <button onClick={() => handleProg(0)} style={{ padding: "9px 18px", background: "rgba(0,180,255,0.08)", border: "1px solid " + border, borderRadius: 8, color: dim, fontSize: 15, cursor: "pointer" }}>⏮ Reset</button>
              <button onClick={handlePP} style={{ padding: "10px 30px", background: playing ? "rgba(0,232,122,0.15)" : "rgba(0,200,255,0.15)", border: "2px solid " + (playing ? "rgba(0,232,122,0.5)" : accent), borderRadius: 8, color: playing ? ok : accent, fontFamily: "monospace", fontSize: 17, letterSpacing: 2, fontWeight: 800, cursor: "pointer" }}>
                {playing ? "⏸  PAUSE" : "▶  PLAY"}
              </button>
              <button onClick={() => handleProg(1)} style={{ padding: "9px 18px", background: "rgba(0,180,255,0.08)", border: "1px solid " + border, borderRadius: 8, color: dim, fontSize: 15, cursor: "pointer" }}>⏭ Arrive</button>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
                <span style={{ fontSize: 14, color: dim }}>Speed:</span>
                {[0.5, 1, 2, 5, 10].map(s => (
                  <button key={s} onClick={() => setSpd(s)} style={{ padding: "7px 12px", borderRadius: 7, fontSize: 14, cursor: "pointer", border: "1px solid " + (spd === s ? accent : border), background: spd === s ? "rgba(0,200,255,0.2)" : "rgba(0,180,255,0.05)", color: spd === s ? accent : dim }}>
                    {s}×
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 14, padding: "12px 18px", borderRadius: 8, fontSize: 15, fontFamily: "monospace", background: prog >= 1 ? "rgba(0,232,122,0.07)" : prog > 0 ? "rgba(0,200,255,0.05)" : "rgba(0,0,0,0.25)", border: "1px solid " + (prog >= 1 ? "rgba(0,232,122,0.3)" : prog > 0 ? border : "rgba(255,255,255,0.04)"), color: prog >= 1 ? ok : prog > 0 ? textCol : dim }}>
              {prog === 0 && "⚡  Ready — press PLAY to emit the signal from " + target.planet}
              {prog > 0 && prog < 1 && "🔵  Signal traveling… " + fmtDelay(distanceLY * prog) + " covered · " + fmtDelay(distanceLY * (1 - prog)) + " remaining"}
              {prog >= 1 && "✅  Signal arrived on Earth after " + fmtDelay(distanceLY) + " — see what Earth receives below"}
            </div>
          </div>
        </div>

        {/* ── STEP 4: WHAT EARTH SEES ── */}
        <div className="step">
          <StepLabel n="4" text="What Earth Sees" />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <div style={{ fontSize: 14, color: dim, marginBottom: 10, textAlign: "center", textTransform: "uppercase", letterSpacing: 1.5 }}>
                📡  You sent this from {target.planet}
              </div>
              {mediaURL ? (
                mediaType === "image"
                  ? <img src={mediaURL} alt="source" style={{ width: "100%", borderRadius: 10, border: "2px solid " + border, display: "block" }} />
                  : <video ref={videoSrcRef} src={mediaURL} controls style={{ width: "100%", borderRadius: 10, border: "2px solid " + border, display: "block" }} />
              ) : (
                <div style={{ borderRadius: 10, border: "2px dashed " + border, padding: "40px 20px", textAlign: "center", color: dim, fontSize: 15 }}>
                  Upload a photo or video in Step 2 to see it here
                </div>
              )}
              <div style={{ marginTop: 10, padding: "10px 14px", background: "rgba(0,200,255,0.05)", borderRadius: 8, fontSize: 14, color: dim, textAlign: "center" }}>
                Age at event: <strong style={{ color: accent }}>{fmtAge(age0)}</strong>
                {" · "}Year: <strong style={{ color: accent }}>{evDT.getFullYear()}</strong>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 14, color: dim, marginBottom: 10, textAlign: "center", textTransform: "uppercase", letterSpacing: 1.5 }}>
                🌍  Earth receives — {fmtDelay(distanceLY)} later
              </div>

              {!arrivedOnEarth ? (
                <div style={{ borderRadius: 10, border: "2px dashed rgba(245,200,66,0.3)", padding: "30px 20px", textAlign: "center", background: "rgba(245,200,66,0.04)", minHeight: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
                  <div style={{ fontSize: 40 }}>📡</div>
                  <div style={{ fontSize: 17, color: warn, fontWeight: 700 }}>
                    {prog === 0 ? "Signal not yet emitted" : "Signal in transit…"}
                  </div>
                  <div style={{ fontSize: 15, color: dim, lineHeight: 1.7 }}>
                    {prog === 0
                      ? "Press PLAY above to send the signal"
                      : (prog * 100).toFixed(1) + "% of the way · " + fmtDelay(distanceLY * (1 - prog)) + " remaining"}
                  </div>
                  {prog > 0 && (
                    <div style={{ width: "80%", height: 8, borderRadius: 4, background: "rgba(0,180,255,0.15)", overflow: "hidden", marginTop: 4 }}>
                      <div style={{ height: "100%", width: (prog * 100) + "%", background: "linear-gradient(90deg, rgba(0,200,255,0.5), " + accent + ")", borderRadius: 4, transition: "width 0.1s" }} />
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {!mediaURL ? (
                    <div style={{ borderRadius: 10, border: "2px solid rgba(0,232,122,0.5)", padding: "40px 20px", textAlign: "center", background: "rgba(0,232,122,0.05)", color: ok, fontSize: 16, minHeight: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      ✓  Signal arrived! Upload a photo or video in Step 2 to see it here.
                    </div>
                  ) : mediaType === "image" ? (
                    <img src={mediaURL} alt="received" style={{ width: "100%", borderRadius: 10, display: "block", border: "2px solid rgba(0,232,122,0.6)", boxShadow: "0 0 30px rgba(0,232,122,0.15)", filter: distanceLY > 500 ? "sepia(0.6) brightness(0.78)" : "none", animation: "glow 2s ease-in-out infinite" }} />
                  ) : (
                    <video ref={videoRcvRef} src={mediaURL} autoPlay loop style={{ width: "100%", borderRadius: 10, display: "block", border: "2px solid rgba(0,232,122,0.6)", boxShadow: "0 0 30px rgba(0,232,122,0.15)" }} />
                  )}
                  <div style={{ marginTop: 10, padding: "10px 14px", background: "rgba(0,232,122,0.06)", borderRadius: 8, fontSize: 14, color: ok, textAlign: "center", fontWeight: 600 }}>
                    ✓  Received on Earth in year {arrStart.getFullYear()}
                    {distanceLY > 500 && " · Ancient signal — age filter applied"}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── STEP 5: THE NUMBERS ── */}
        <div className="step fadein">
          <StepLabel n="5" text="The Numbers" />

          <div className="g3" style={{ marginBottom: 16 }}>
            <InfoCard
              label="What Earth sees now"
              value={arrivedOnEarth ? fmtAge(apparentAge) : "No signal yet"}
              color={arrivedOnEarth ? accent : warn}
              sub={arrivedOnEarth ? "The arriving photons still show the event-start age." : "Earth cannot see the event until the photon reaches 100%."}
            />

            <InfoCard
              label="Actual age right now"
              value={fmtAge(actualNow)}
              color={aliveNow ? ok : danger}
              sub={aliveNow ? "Alive at this simulated moment." : "Would have exceeded the chosen lifespan."}
            />

            <InfoCard
              label="Age hidden by delay"
              value={fmtAge(hiddenByDelayNow)}
              color={accent}
              sub="This grows while the photon is traveling."
            />
          </div>

          <div className="g3" style={{ marginBottom: 16 }}>
            <InfoCard
              label="Age when first seen on Earth"
              value={fmtAge(ageWhenSeen)}
              color={aliveWhenSeen ? ok : danger}
              sub={aliveWhenSeen ? "Still alive when Earth first receives the signal." : "Already beyond lifespan when Earth first receives the signal."}
            />

            <InfoCard
              label="Photon simulation time"
              value={fmtDT(simDT)}
              color={bright}
              sub="This is the live time controlled by PLAY and the slider."
            />

            <InfoCard
              label="Reception state"
              value={
                recS === "not_emitted" ? "Not emitted" :
                recS === "traveling" ? "Traveling" :
                "Arrived"
              }
              color={
                recS === "arrived" ? ok :
                recS === "traveling" ? accent :
                dim
              }
              sub={
                recS === "arrived"
                  ? "Earth can finally observe the signal."
                  : recS === "traveling"
                  ? "Photon is still crossing space."
                  : "Press PLAY to emit the signal."
              }
            />
          </div>

          <div className="g2" style={{ marginBottom: 16 }}>
            <InfoCard label="Signal emitted" value={fmtDT(evDT)} color={bright} />
            <InfoCard label="Arrives on Earth" value={fmtDT(arrStart)} color={accent} />
            <InfoCard label="One-way light-travel time" value={fmtDelay(distanceLY)} color={accent} />
            <InfoCard
              label="Distance"
              value={(distanceLY / PC_TO_LY).toFixed(4) + " pc  ·  " + (distanceLY < 10 ? distanceLY.toFixed(3) : Math.round(distanceLY).toLocaleString()) + " ly"}
              color={bright}
            />
          </div>

          <div style={{ padding: "18px 22px", background: "rgba(0,200,255,0.05)", borderRadius: 12, borderLeft: "4px solid rgba(0,200,255,0.4)", fontSize: 16, color: dim, lineHeight: 1.9 }}>
            <strong style={{ color: bright }}>Live interpretation: </strong>
            {recS === "not_emitted" && (
              <span>
                The event is defined at <strong style={{ color: target.color }}>{target.planet}</strong>, but no photon has been launched yet.
              </span>
            )}
            {recS === "traveling" && (
              <span>
                The photon has traveled <strong style={{ color: accent }}>{fmtDelay(distanceLY * simProg)}</strong>.
                During that travel time, the real person has aged to <strong style={{ color: aliveNow ? ok : danger }}>{fmtAge(actualNow)}</strong>,
                but Earth still sees <strong style={{ color: warn }}>nothing</strong>.
              </span>
            )}
            {recS === "arrived" && (
              <span>
                Earth is now seeing the person at <strong style={{ color: accent }}>{fmtAge(apparentAge)}</strong>,
                while the real person is <strong style={{ color: aliveNow ? ok : danger }}>{fmtAge(actualNow)}</strong>.
                The delay hides <strong style={{ color: accent }}>{fmtAge(hiddenByDelayNow)}</strong> of aging.
              </span>
            )}
          </div>
        </div>

        <details style={{ background: panel, border: "1px solid " + border, borderRadius: 14, padding: "16px 22px", marginBottom: 14 }}>
          <summary style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 13, color: accent, letterSpacing: 2 }}>💡  QUICK EXAMPLES</summary>
          <div style={{ marginTop: 14, fontSize: 16, color: dim, lineHeight: 2.2 }}>
            <strong style={{ color: bright }}>Kepler-452 b (~1,799 ly) · age 25:</strong> Earth sees 25 — they're actually about 1,824. Long dead.<br />
            <strong style={{ color: bright }}>TOI-1231 b (~90 ly) · age 25:</strong> Earth sees 25 — actually about 115. Likely dead.<br />
            <strong style={{ color: bright }}>Proxima Cen b (~4.2 ly) · age 25:</strong> Earth sees 25 — actually about 29. Probably still alive.<br />
            <strong style={{ color: bright }}>Mars (Manual · ~12.5 light-minutes) · age 25:</strong> Delay is tiny — nearly real-time.
          </div>
        </details>

        <details style={{ background: panel, border: "1px solid " + border, borderRadius: 14, padding: "16px 22px" }}>
          <summary style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 13, color: accent, letterSpacing: 2 }}>🔬  SCIENTIFIC ASSUMPTIONS</summary>
          <div style={{ marginTop: 14, fontSize: 16, color: dim, lineHeight: 2.2 }}>
            • A light-year is a distance, not a time unit.<br />
            • Travel time is computed from distance ÷ c. When distance is expressed in light-years, the numeric travel time in years is the same value.<br />
            • Point-source model: every pixel in the image/video shares the same light-travel delay.<br />
            • Host-system catalog distance is used as the Earth ↔ target distance.<br />
            • No cosmological expansion, gravitational redshift, or relativistic time dilation modeled.
          </div>
        </details>

        <div style={{ textAlign: "center", marginTop: 50, fontSize: 13, color: "rgba(0,180,255,0.2)", letterSpacing: 2 }}>
          RSCL@CPP · EARTH LOOKBACK SIMULATOR · distance / c = travel time · 1 pc = 3.26156 ly
        </div>
      </div>
    </>
  );
}
