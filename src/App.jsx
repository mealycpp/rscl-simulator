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

const lyToSec = ly => ly * SPY;
const secToYr = s => s / SPY;
const addSec  = (d, s) => new Date(d.getTime() + s * 1000);

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
  if (s < 120)         return s.toFixed(1) + " seconds";
  if (s < 7200)        return (s / 60).toFixed(1) + " minutes";
  if (s < 172800)      return (s / 3600).toFixed(1) + " hours";
  if (s < SPY)         return (s / 86400).toFixed(1) + " days";
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

// ── CANVAS ───────────────────────────────────────────────────────────────────
function drawScene(canvas, prog, target) {
  if (!canvas || !target) return;
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  const p = Math.max(0, Math.min(1, prog));
  const distanceLY = target._distanceLY != null ? target._distanceLY : target.distance_pc * PC_TO_LY;
  const col = target.color || "#4fc3f7";
  ctx.clearRect(0, 0, W, H);
  const bg = ctx.createLinearGradient(0,0,W,0);
  bg.addColorStop(0,"#010510"); bg.addColorStop(0.5,"#020c1e"); bg.addColorStop(1,"#010510");
  ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
  [[W*.2,H*.3,90,"rgba(20,0,60,0.3)"],[W*.75,H*.6,70,"rgba(0,20,80,0.25)"]].forEach(n=>{
    var g=ctx.createRadialGradient(n[0],n[1],0,n[0],n[1],n[2]);
    g.addColorStop(0,n[3]); g.addColorStop(1,"transparent");
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(n[0],n[1],n[2],0,Math.PI*2); ctx.fill();
  });
  var seed=n=>{var s=n*9301+49297; return(s%233280)/233280;};
  for(var i=0;i<140;i++){
    var sx=seed(i*3)*W,sy=seed(i*3+1)*H,sr=seed(i*3+2)*1.4+0.2;
    ctx.beginPath(); ctx.arc(sx,sy,sr,0,Math.PI*2);
    ctx.fillStyle="rgba(200,220,255,"+(0.2+seed(i*7)*0.65)+")"; ctx.fill();
  }
  var PX=130,EX=W-120,MY=H/2,span=EX-PX;
  ctx.font="bold 13px 'IBM Plex Mono',monospace"; ctx.fillStyle="rgba(0,200,255,0.35)"; ctx.textAlign="center";
  ctx.fillText("✦  "+target.galaxy+"  ✦",W/2,22);
  ctx.strokeStyle="rgba(0,180,255,0.12)"; ctx.lineWidth=1; ctx.setLineDash([6,8]);
  ctx.beginPath(); ctx.moveTo(PX,MY); ctx.lineTo(EX,MY); ctx.stroke(); ctx.setLineDash([]);
  ctx.font="12px 'IBM Plex Mono',monospace"; ctx.fillStyle="rgba(0,180,255,0.3)"; ctx.textAlign="center";
  ctx.fillText("← "+fmtDelay(distanceLY)+" →",W/2,MY-18);
  var sX=PX-55,sY=MY-40;
  var stG=ctx.createRadialGradient(sX,sY,0,sX,sY,22);
  stG.addColorStop(0,"rgba(255,248,200,1)"); stG.addColorStop(0.4,"rgba(255,200,80,0.4)"); stG.addColorStop(1,"transparent");
  ctx.fillStyle=stG; ctx.beginPath(); ctx.arc(sX,sY,22,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(sX,sY,6,0,Math.PI*2); ctx.fillStyle="rgba(255,255,220,1)"; ctx.fill();
  for(var ri=0;ri<8;ri++){
    var ra=ri*Math.PI/4;
    ctx.beginPath(); ctx.moveTo(sX+Math.cos(ra)*8,sY+Math.sin(ra)*8); ctx.lineTo(sX+Math.cos(ra)*18,sY+Math.sin(ra)*18);
    ctx.strokeStyle="rgba(255,230,100,0.35)"; ctx.lineWidth=1; ctx.stroke();
  }
  ctx.beginPath(); ctx.arc(PX,MY,30*2.8,0,Math.PI*2); ctx.fillStyle=col+"18"; ctx.fill();
  var pG=ctx.createRadialGradient(PX-9,MY-9,3,PX,MY,30);
  pG.addColorStop(0,"rgba(255,255,255,0.3)"); pG.addColorStop(0.4,col); pG.addColorStop(1,"rgba(0,0,0,0.7)");
  ctx.beginPath(); ctx.arc(PX,MY,30,0,Math.PI*2); ctx.fillStyle=pG; ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.arc(PX,MY,30,0,Math.PI*2); ctx.clip();
  ctx.strokeStyle="rgba(0,0,0,0.12)"; ctx.lineWidth=3;
  [-10,3,14].forEach(dy=>{ctx.beginPath(); ctx.ellipse(PX,MY+dy,30,6,0,0,Math.PI*2); ctx.stroke();});
  ctx.restore();
  ctx.beginPath(); ctx.arc(PX,MY,34,0,Math.PI*2); ctx.strokeStyle="rgba(255,255,255,0.1)"; ctx.lineWidth=2.5; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(PX,MY+8,46,12,0,0,Math.PI*2); ctx.strokeStyle="rgba(255,255,255,0.08)"; ctx.lineWidth=1.5; ctx.stroke();
  ctx.font="bold 15px 'IBM Plex Mono',monospace"; ctx.fillStyle=col; ctx.textAlign="center";
  ctx.fillText(target.planet,PX,MY+58);
  ctx.font="12px 'IBM Plex Mono',monospace"; ctx.fillStyle="rgba(0,200,255,0.5)";
  ctx.fillText(target.system,PX,MY+74);
  if(p<0.05){var f=1-p/0.05; ctx.beginPath(); ctx.arc(PX,MY,30+f*32,0,Math.PI*2); ctx.strokeStyle="rgba(255,255,255,"+(f*0.55)+")"; ctx.lineWidth=3; ctx.stroke();}
  var sigX=PX+span*p;
  if(p>0){
    var tLen=Math.min(span*p,220);
    var tG=ctx.createLinearGradient(sigX-tLen,MY,sigX,MY);
    tG.addColorStop(0,"transparent"); tG.addColorStop(0.6,"rgba(0,200,255,0.07)"); tG.addColorStop(1,"rgba(0,235,255,0.65)");
    ctx.strokeStyle=tG; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(Math.max(PX,sigX-tLen),MY); ctx.lineTo(sigX,MY); ctx.stroke();
    [0,1,2].forEach(ri=>{ctx.beginPath(); ctx.arc(sigX,MY,6+ri*7,0,Math.PI*2); ctx.strokeStyle="rgba(0,225,255,"+(0.55-ri*0.18)+")"; ctx.lineWidth=1.3; ctx.stroke();});
    var ph=ctx.createRadialGradient(sigX,MY,0,sigX,MY,9);
    ph.addColorStop(0,"rgba(255,255,255,1)"); ph.addColorStop(0.4,"rgba(0,245,255,0.95)"); ph.addColorStop(1,"transparent");
    ctx.fillStyle=ph; ctx.beginPath(); ctx.arc(sigX,MY,9,0,Math.PI*2); ctx.fill();
  }
  if(p>0.04&&p<0.96){
    var traveledLY=distanceLY*p;
    ctx.font="12px 'IBM Plex Mono',monospace"; ctx.fillStyle="rgba(0,240,255,0.85)"; ctx.textAlign="center";
    ctx.fillText((traveledLY<1?fmtDelay(traveledLY):traveledLY.toFixed(1)+" ly")+" traveled",sigX,MY-28);
  }
  [0.25,0.5,0.75].forEach(t=>{
    var tx=PX+span*t;
    ctx.strokeStyle="rgba(0,180,255,0.2)"; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(tx,MY+5); ctx.lineTo(tx,MY+14); ctx.stroke();
    var tickLY=distanceLY*t;
    ctx.font="10px 'IBM Plex Mono',monospace"; ctx.fillStyle="rgba(0,180,255,0.3)"; ctx.textAlign="center";
    ctx.fillText(tickLY<1?fmtDelay(tickLY):tickLY.toFixed(1)+" ly",tx,MY+26);
  });
  var eGl=ctx.createRadialGradient(EX,MY,10,EX,MY,90);
  eGl.addColorStop(0,"rgba(0,100,255,0.2)"); eGl.addColorStop(1,"transparent");
  ctx.fillStyle=eGl; ctx.beginPath(); ctx.arc(EX,MY,90,0,Math.PI*2); ctx.fill();
  var eG=ctx.createRadialGradient(EX-10,MY-10,3,EX,MY,30);
  eG.addColorStop(0,"rgba(140,215,255,0.95)"); eG.addColorStop(0.3,"#1565c0"); eG.addColorStop(0.75,"#0d47a1"); eG.addColorStop(1,"rgba(0,6,40,0.9)");
  ctx.beginPath(); ctx.arc(EX,MY,30,0,Math.PI*2); ctx.fillStyle=eG; ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.arc(EX,MY,30,0,Math.PI*2); ctx.clip();
  ctx.fillStyle="rgba(55,168,75,0.75)";
  [[EX-12,MY-10,10,7,0.3],[EX+8,MY+7,12,8,0.2],[EX-5,MY+12,8,5,0.4]].forEach(v=>{
    ctx.beginPath(); ctx.ellipse(v[0],v[1],v[2],v[3],v[4],0,Math.PI*2); ctx.fill();
  });
  ctx.restore();
  ctx.beginPath(); ctx.arc(EX,MY,35,0,Math.PI*2); ctx.strokeStyle="rgba(110,190,255,0.3)"; ctx.lineWidth=4; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(EX,MY+10,48,13,0,0,Math.PI*2); ctx.strokeStyle="rgba(100,180,255,0.12)"; ctx.lineWidth=1.5; ctx.stroke();
  ctx.font="bold 15px 'IBM Plex Mono',monospace"; ctx.fillStyle="#4fc3f7"; ctx.textAlign="center";
  ctx.fillText("EARTH",EX,MY+58);
  ctx.font="12px 'IBM Plex Mono',monospace"; ctx.fillStyle="rgba(0,200,255,0.5)";
  ctx.fillText("Observer",EX,MY+74);
  if(p>0.95){
    var fl=(p-0.95)/0.05;
    ctx.beginPath(); ctx.arc(EX,MY,30+fl*55,0,Math.PI*2); ctx.strokeStyle="rgba(0,255,200,"+(1-fl)*0.9+")"; ctx.lineWidth=3.5; ctx.stroke();
    var bg2=ctx.createRadialGradient(EX,MY,0,EX,MY,100);
    bg2.addColorStop(0,"rgba(0,255,180,"+(fl*0.3)+")"); bg2.addColorStop(1,"transparent");
    ctx.fillStyle=bg2; ctx.beginPath(); ctx.arc(EX,MY,100,0,Math.PI*2); ctx.fill();
  }
  if(p>=1){
    ctx.font="bold 16px 'IBM Plex Mono',monospace"; ctx.fillStyle="rgba(0,245,110,0.95)"; ctx.textAlign="center";
    ctx.fillText("✓  SIGNAL OBSERVED ON EARTH",EX,MY-66);
    ctx.font="13px 'IBM Plex Mono',monospace"; ctx.fillStyle="rgba(0,200,255,0.75)";
    ctx.fillText("Delay: "+fmtDelay(distanceLY),EX,MY-48);
  }
}

// ── STARFIELD ────────────────────────────────────────────────────────────────
function StarField() {
  const ref = useRef();
  useEffect(() => {
    const c = ref.current, ctx = c.getContext("2d");
    let W, H, stars, raf;
    function init() {
      W = c.width = window.innerWidth; H = c.height = window.innerHeight;
      stars = Array.from({ length: 280 }, () => ({
        x: Math.random()*W, y: Math.random()*H,
        r: Math.random()*1.4+0.2, a: Math.random()*0.6+0.2,
        sp: Math.random()*0.25+0.04, ph: Math.random()*Math.PI*2
      }));
    }
    init();
    let t = 0;
    function draw() {
      ctx.clearRect(0,0,W,H);
      stars.forEach(s => {
        const a = s.a*(0.5+0.5*Math.sin(t*s.sp+s.ph));
        ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
        ctx.fillStyle="rgba(180,220,255,"+a+")"; ctx.fill();
      });
      t+=0.01; raf=requestAnimationFrame(draw);
    }
    draw();
    window.addEventListener("resize",init);
    return ()=>{ cancelAnimationFrame(raf); window.removeEventListener("resize",init); };
  },[]);
  return <canvas ref={ref} style={{position:"fixed",inset:0,width:"100%",height:"100%",zIndex:0,pointerEvents:"none"}}/>;
}

// ── RSCL SEAL ────────────────────────────────────────────────────────────────
function RSCLSeal({ size = 200 }) {
  return (
    <div style={{width:size,height:size*(560/680),display:"block",filter:"drop-shadow(0 0 18px rgba(0,200,255,0.5))"}}>
      <svg width={size} height={size*(560/680)} viewBox="0 0 680 560" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&display=swap');
            @keyframes rsclspin1{from{transform-origin:340px 240px;transform:rotate(0deg)}to{transform-origin:340px 240px;transform:rotate(360deg)}}
            @keyframes rsclspin2{from{transform-origin:340px 240px;transform:rotate(0deg)}to{transform-origin:340px 240px;transform:rotate(-360deg)}}
            @keyframes rsclpulse{0%,100%{opacity:0.6}50%{opacity:1}}
            @keyframes rsclbeam{0%,100%{opacity:0.5;stroke-dashoffset:0}50%{opacity:1;stroke-dashoffset:-14}}
            @keyframes rscltw{0%,100%{opacity:0.2}50%{opacity:1}}
            .rr1{animation:rsclspin1 20s linear infinite}
            .rr2{animation:rsclspin2 30s linear infinite}
            .rpc{animation:rsclpulse 2.6s ease-in-out infinite}
            .rbm{animation:rsclbeam 1.8s ease-in-out infinite;stroke-dasharray:6 4}
            .rtw1{animation:rscltw 2.1s ease-in-out infinite}
            .rtw2{animation:rscltw 3.3s ease-in-out infinite 0.6s}
            .rtw3{animation:rscltw 1.9s ease-in-out infinite 1.2s}
            .rtw4{animation:rscltw 2.8s ease-in-out infinite 0.4s}
            .rtw5{animation:rscltw 3.6s ease-in-out infinite 1.8s}
          `}</style>
          <radialGradient id="sv" cx="50%" cy="50%" r="52%">
            <stop offset="0%" stopColor="#040d1e"/><stop offset="70%" stopColor="#010812"/><stop offset="100%" stopColor="#000408"/>
          </radialGradient>
          <radialGradient id="sn1" cx="38%" cy="42%" r="55%">
            <stop offset="0%" stopColor="#0a1a4a" stopOpacity="0.9"/><stop offset="100%" stopColor="#0a1a4a" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="sn2" cx="65%" cy="60%" r="48%">
            <stop offset="0%" stopColor="#0d0a30" stopOpacity="0.7"/><stop offset="100%" stopColor="#0d0a30" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="ssg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff"/><stop offset="25%" stopColor="#ffe680"/>
            <stop offset="65%" stopColor="#ff9a20" stopOpacity="0.35"/><stop offset="100%" stopColor="#ff6000" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="seg" cx="36%" cy="33%" r="65%">
            <stop offset="0%" stopColor="#4ab8ff"/><stop offset="35%" stopColor="#1560b0"/>
            <stop offset="72%" stopColor="#0b3870"/><stop offset="100%" stopColor="#041428"/>
          </radialGradient>
          <radialGradient id="sat" cx="50%" cy="50%" r="50%">
            <stop offset="74%" stopColor="#4fc3f7" stopOpacity="0"/><stop offset="100%" stopColor="#4fc3f7" stopOpacity="0.38"/>
          </radialGradient>
          <radialGradient id="scg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00eeff" stopOpacity="0.2"/><stop offset="100%" stopColor="#00eeff" stopOpacity="0"/>
          </radialGradient>
          <clipPath id="sec"><circle cx="430" cy="230" r="40"/></clipPath>
          <clipPath id="ssc"><circle cx="340" cy="240" r="228"/></clipPath>
          <filter id="sfg">
            <feGaussianBlur stdDeviation="3.5" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <circle cx="340" cy="240" r="240" fill="#020915" stroke="#00c8ff" strokeWidth="2.8" strokeOpacity="0.55"/>
        <circle cx="340" cy="240" r="237" fill="none" stroke="#00c8ff" strokeWidth="0.6" strokeOpacity="0.18"/>
        <g stroke="#00c8ff" strokeWidth="1.8" strokeOpacity="0.6">
          <line x1="340" y1="2"   x2="340" y2="20"/>
          <line x1="340" y1="460" x2="340" y2="478"/>
          <line x1="100" y1="240" x2="118" y2="240"/>
          <line x1="562" y1="240" x2="580" y2="240"/>
          <line x1="170" y1="70"  x2="182" y2="90"/>
          <line x1="498" y1="390" x2="510" y2="410"/>
          <line x1="510" y1="70"  x2="498" y2="90"/>
          <line x1="182" y1="390" x2="170" y2="410"/>
        </g>
        <polygon points="340,3 346,12 340,21 334,12"      fill="#00c8ff" opacity="0.95"/>
        <polygon points="340,459 346,468 340,477 334,468" fill="#00c8ff" opacity="0.95"/>
        <polygon points="100,240 109,234 118,240 109,246" fill="#00c8ff" opacity="0.95"/>
        <polygon points="562,240 571,234 580,240 571,246" fill="#00c8ff" opacity="0.95"/>
        <g clipPath="url(#ssc)">
          <circle cx="340" cy="240" r="228" fill="url(#sv)"/>
          <circle cx="295" cy="200" r="130" fill="url(#sn1)"/>
          <circle cx="410" cy="275" r="105" fill="url(#sn2)"/>
          <circle className="rtw1" cx="248" cy="148" r="1.6" fill="#c8e8ff" opacity="0.85"/>
          <circle className="rtw2" cx="285" cy="128" r="1.1" fill="#e0f4ff" opacity="0.65"/>
          <circle className="rtw3" cx="432" cy="138" r="1.7" fill="#c8e8ff" opacity="0.75"/>
          <circle className="rtw4" cx="462" cy="172" r="1.0" fill="#e0f4ff" opacity="0.55"/>
          <circle className="rtw5" cx="232" cy="228" r="1.3" fill="#c8e8ff" opacity="0.65"/>
          <circle className="rtw1" cx="464" cy="268" r="1.4" fill="#c8e8ff" opacity="0.70"/>
          <circle className="rtw2" cx="262" cy="298" r="1.0" fill="#e0f4ff" opacity="0.45"/>
          <circle className="rtw3" cx="445" cy="315" r="1.2" fill="#c8e8ff" opacity="0.55"/>
          <circle className="rtw4" cx="298" cy="332" r="1.0" fill="#e0f4ff" opacity="0.50"/>
          <circle className="rtw5" cx="376" cy="142" r="1.5" fill="#c8e8ff" opacity="0.65"/>
          <circle className="rtw1" cx="210" cy="268" r="1.2" fill="#c8e8ff" opacity="0.55"/>
          <circle className="rtw3" cx="325" cy="352" r="1.3" fill="#c8e8ff" opacity="0.60"/>
          <circle className="rtw5" cx="215" cy="190" r="1.4" fill="#c8e8ff" opacity="0.65"/>
        </g>
        <g className="rr1">
          <circle cx="340" cy="240" r="215" fill="none" stroke="#00c8ff" strokeWidth="1" strokeOpacity="0.18" strokeDasharray="2 7"/>
          <circle cx="340" cy="240" r="206" fill="none" stroke="#00c8ff" strokeWidth="0.6" strokeOpacity="0.12" strokeDasharray="1 9"/>
          <g stroke="#00c8ff" strokeOpacity="0.55">
            <line x1="340" y1="27"  x2="340" y2="42"  strokeWidth="2.2"/>
            <line x1="340" y1="438" x2="340" y2="453" strokeWidth="2.2"/>
            <line x1="127" y1="240" x2="142" y2="240" strokeWidth="2.2"/>
            <line x1="538" y1="240" x2="553" y2="240" strokeWidth="2.2"/>
          </g>
        </g>
        <g className="rr2">
          <ellipse cx="340" cy="240" rx="140" ry="42" fill="none" stroke="#00c8ff" strokeWidth="0.9" strokeOpacity="0.28" strokeDasharray="4 6" transform="rotate(-10,340,240)"/>
          <circle cx="340" cy="198" r="5" fill="#00eeff" opacity="0.95" transform="rotate(-10,340,240)"/>
        </g>
        <circle cx="340" cy="240" r="185" fill="none" stroke="#00c8ff" strokeWidth="1.4" strokeOpacity="0.45"/>
        <circle cx="340" cy="240" r="180" fill="none" stroke="#00c8ff" strokeWidth="0.5" strokeOpacity="0.18"/>
        <path id="sarcTop" d="M 130,240 A 210,210 0 0,1 550,240" fill="none"/>
        <text fontFamily="'Orbitron',Georgia,sans-serif" fontSize="15" fontWeight="700" fill="#00c8ff" letterSpacing="4" opacity="0.95">
          <textPath href="#sarcTop" startOffset="7%">RECONFIGURABLE · SPACE · COMPUTING · LAB</textPath>
        </text>
        <path id="sarcBot" d="M 148,240 A 192,192 0 0,0 532,240" fill="none"/>
        <text fontFamily="'Orbitron',Georgia,sans-serif" fontSize="14" fontWeight="700" fill="#7ac8e8" letterSpacing="5" opacity="0.9">
          <textPath href="#sarcBot" startOffset="13%">CAL POLY POMONA · EST. 1938</textPath>
        </text>
        <circle cx="340" cy="240" r="135" fill="url(#scg)" className="rpc"/>
        <circle cx="238" cy="228" r="36" fill="url(#ssg)"/>
        <circle cx="238" cy="228" r="10" fill="#ffffff"/>
        <g stroke="#ffe060" strokeLinecap="round" opacity="0.75">
          <line x1="238" y1="212" x2="238" y2="200" strokeWidth="2"/>
          <line x1="238" y1="244" x2="238" y2="256" strokeWidth="2"/>
          <line x1="222" y1="228" x2="210" y2="228" strokeWidth="2"/>
          <line x1="254" y1="228" x2="266" y2="228" strokeWidth="2"/>
          <line x1="227" y1="217" x2="219" y2="209" strokeWidth="1.4"/>
          <line x1="249" y1="239" x2="257" y2="247" strokeWidth="1.4"/>
          <line x1="249" y1="217" x2="257" y2="209" strokeWidth="1.4"/>
          <line x1="227" y1="239" x2="219" y2="247" strokeWidth="1.4"/>
        </g>
        <text x="238" y="276" textAnchor="middle" fontFamily="'Orbitron',monospace" fontSize="11" fill="#ffd060" letterSpacing="2" opacity="0.9">SOURCE</text>
        <line x1="256" y1="228" x2="388" y2="230" className="rbm" stroke="#00eeff" strokeWidth="2.2" strokeLinecap="round"/>
        <circle cx="322" cy="229" r="5.5" fill="#ffffff" opacity="0.95" filter="url(#sfg)"/>
        <circle cx="322" cy="229" r="11"  fill="#00eeff" opacity="0.22"/>
        <text x="322" y="214" textAnchor="middle" fontFamily="'Orbitron',monospace" fontSize="9" fill="#00c8ff" letterSpacing="2" opacity="0.6">d / c = t</text>
        <circle cx="430" cy="230" r="42" fill="url(#seg)"/>
        <g clipPath="url(#sec)" opacity="0.85">
          <ellipse cx="417" cy="218" rx="12" ry="7.5" fill="#2d8a48" transform="rotate(-20,417,218)"/>
          <ellipse cx="436" cy="235" rx="14" ry="6.5" fill="#2d8a48" transform="rotate(15,436,235)"/>
          <ellipse cx="413" cy="242" rx="8"  ry="5"   fill="#2d8a48" transform="rotate(-5,413,242)"/>
          <ellipse cx="445" cy="218" rx="7"  ry="4"   fill="#2d8a48" transform="rotate(25,445,218)"/>
        </g>
        <circle cx="430" cy="230" r="42" fill="url(#sat)"/>
        <circle cx="430" cy="230" r="47" fill="none" stroke="#4fc3f7" strokeWidth="3" strokeOpacity="0.22"/>
        <text x="430" y="284" textAnchor="middle" fontFamily="'Orbitron',monospace" fontSize="11" fill="#4fc3f7" letterSpacing="2" opacity="0.9">OBSERVER</text>
        <line x1="220" y1="326" x2="460" y2="326" stroke="#00c8ff" strokeWidth="0.8" strokeOpacity="0.4"/>
        <text x="340" y="322" textAnchor="middle" fontFamily="'Orbitron',Georgia,sans-serif" fontSize="30" fontWeight="900" fill="#00eeff" letterSpacing="4" opacity="1">RSCL@CPP</text>
        <line x1="220" y1="336" x2="460" y2="336" stroke="#00c8ff" strokeWidth="0.8" strokeOpacity="0.4"/>
        <text x="340" y="354" textAnchor="middle" fontFamily="'Orbitron',monospace" fontSize="9" fill="#4a8aaa" letterSpacing="4" opacity="0.85">EARTH LOOKBACK SIMULATOR</text>
      </svg>
    </div>
  );
}

// ── SCIENTIFIC ASSUMPTIONS PANEL ─────────────────────────────────────────────
function ScientificAssumptions() {
  const [openCards, setOpenCards] = useState({});
  const [allOpen, setAllOpen] = useState(false);

  const toggle = (id) => setOpenCards(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleAll = () => {
    const next = !allOpen;
    setAllOpen(next);
    const state = {};
    assumptions.forEach((_, i) => { state[i] = next; });
    setOpenCards(state);
  };

  const tagStyle = (type) => {
    if (type === "valid")  return { background:"rgba(0,232,122,0.12)", color:"#00e87a", border:"1px solid rgba(0,232,122,0.3)" };
    if (type === "limit")  return { background:"rgba(245,200,66,0.12)", color:"#f5c842", border:"1px solid rgba(245,200,66,0.3)" };
    if (type === "future") return { background:"rgba(147,112,219,0.12)", color:"#b39ddb", border:"1px solid rgba(147,112,219,0.3)" };
    return {};
  };

  const assumptions = [
    {
      section: "I — Geometry & Propagation",
      id:"A1", color:"#0C447C", bg:"rgba(0,120,255,0.12)",
      title:"Rectilinear photon propagation in flat spacetime",
      sub:"Light travels in a straight line at exactly c between source and observer",
      tags:[{t:"Valid in this model",k:"valid"}],
      body:`Light is modeled as a point signal traveling at the invariant speed of light in vacuum:`,
      formula:"c = 299,792,458 m/s  =  1 ly/yr  (natural units)",
      detail:"The propagation path is assumed perfectly straight — no gravitational lensing, no refraction. Valid for stellar distances where spacetime curvature from intervening masses is negligible."
    },
    {
      id:"A2", color:"#0C447C", bg:"rgba(0,120,255,0.12)",
      title:"Light-travel time equals distance divided by c",
      sub:"When d is in light-years, t_travel numerically equals d in years",
      tags:[{t:"Valid in this model",k:"valid"}],
      body:"The fundamental relation driving all temporal calculations in the simulator:",
      formula:"t_travel = d / c   ⟹   t_travel [yr] = d [ly]",
      detail:"This identity holds exactly in natural units and is the core of every age-delay computation shown in Step 5."
    },
    {
      id:"A3", color:"#0C447C", bg:"rgba(0,120,255,0.12)",
      title:"Point-source signal model",
      sub:"Every pixel in the uploaded media shares a single travel time",
      tags:[{t:"Valid in this model",k:"valid"}],
      body:"The uploaded image or video is treated as originating from a single point in space at catalog distance d. All photons in the frame are assigned identical delay:",
      formula:"Δt_pixel = 0   (all pixels co-emitted)",
      detail:"A physically extended source (e.g. a planet 12,000 km across at 4.2 ly) would introduce sub-nanosecond differential delays — negligible at any human-relevant timescale."
    },
    {
      id:"A4", color:"#0C447C", bg:"rgba(0,120,255,0.12)",
      title:"Static source-observer distance",
      sub:"Catalog distance d is treated as fixed throughout the simulation",
      tags:[{t:"Valid in this model",k:"valid"},{t:"Limitation for nearby fast movers",k:"limit"}],
      body:"The host-system parallax distance is used as a constant. In reality proper motion changes d over time:",
      formula:"d(t) = d₀ + v_r · t   ⟹   t_travel = ∫ dd / c",
      detail:"For Proxima Centauri (v_r ≈ −22 km/s), the distance changes by ~0.02 ly per century — negligible for human timescales but non-trivial over millennia."
    },
    {
      section: "II — Temporal & Relativistic",
      id:"A5", color:"#f5c842", bg:"rgba(245,200,66,0.10)",
      title:"No special relativistic time dilation",
      sub:"Lorentz factor γ = 1 assumed throughout",
      tags:[{t:"Limitation",k:"limit"},{t:"Future: add v/c slider",k:"future"}],
      body:"Special relativity predicts that a moving source experiences dilated proper time relative to the observer frame:",
      formula:"t_proper = t_coord · √(1 − v²/c²)   where γ = 1/√(1 − v²/c²)",
      detail:"This model sets v_source = 0 and γ = 1. For exoplanets orbiting at typical stellar velocities (v ≲ 30 km/s ≈ 10⁻⁴c), the fractional dilation is of order 10⁻⁸ — fully negligible for educational purposes."
    },
    {
      id:"A6", color:"#f5c842", bg:"rgba(245,200,66,0.10)",
      title:"No gravitational time dilation",
      sub:"General relativistic corrections to clock rates are omitted",
      tags:[{t:"Limitation",k:"limit"}],
      body:"General relativity predicts that clocks run slower deeper in a gravitational potential well (Schwarzschild metric):",
      formula:"t_surface = t_∞ · √(1 − 2GM / rc²)",
      detail:"For an Earth-mass planet orbiting a Sun-like star, the fractional correction is ~10⁻⁹ per year — negligible here. Would become significant for observations near neutron stars or black holes."
    },
    {
      id:"A7", color:"#f5c842", bg:"rgba(245,200,66,0.10)",
      title:"No cosmological redshift or expansion",
      sub:"Hubble flow is not modeled — all targets are within the Milky Way",
      tags:[{t:"Limitation for extragalactic use",k:"limit"}],
      body:"At cosmological distances the expansion of space stretches photon wavelengths and increases effective light-travel time beyond d/c:",
      formula:"z = (λ_obs − λ_emit) / λ_emit   ⟹   1 + z = a(t_obs) / a(t_emit)",
      detail:"All current catalog targets are within the Milky Way (d ≲ 600 ly), where Hubble flow contributes less than 1 part in 10⁶ to the delay. The non-expanding flat-space model is exact at these scales."
    },
    {
      section: "III — Spectral & Kinematic Effects",
      id:"A8", color:"#b39ddb", bg:"rgba(147,112,219,0.10)",
      title:"Doppler shift not modeled",
      sub:"Radial velocity of the source does not alter the received signal frequency",
      tags:[{t:"Future work",k:"future"}],
      body:"A source moving radially toward or away from Earth shifts the received frequency:",
      formula:"f_obs = f_emit · √((1 + β)/(1 − β))   where β = v_r / c",
      detail:"For Proxima Centauri (v_r ≈ −22 km/s, β ≈ 7×10⁻⁵), the blueshift is ~0.007% — imperceptible to the eye but detectable spectroscopically. A future version could apply a color-temperature shift to the received image."
    },
    {
      id:"A9", color:"#b39ddb", bg:"rgba(147,112,219,0.10)",
      title:"Stellar aberration not modeled",
      sub:"Earth's orbital velocity does not shift the apparent sky position of the source",
      tags:[{t:"Future work",k:"future"}],
      body:"Due to Earth's orbital velocity (v_⊕ ≈ 29.8 km/s), the apparent direction of incoming light is displaced from the true direction by the aberration angle:",
      formula:"tan(θ_aber) = v_⊕ sin(θ) / (c + v_⊕ cos(θ))   ≈ 20.5″ maximum",
      detail:"The maximum displacement of ~20.5 arcseconds was historically used to first measure the speed of light (Bradley, 1729). The simulator treats all source positions as fixed on the celestial sphere."
    },
    {
      id:"A10", color:"#b39ddb", bg:"rgba(147,112,219,0.10)",
      title:"Interstellar medium dispersion not modeled",
      sub:"The ISM is treated as a perfect vacuum — no frequency-dependent delay",
      tags:[{t:"Future work",k:"future"}],
      body:"The interstellar medium has a non-zero electron column density (dispersion measure, DM) that causes lower-frequency photons to arrive later:",
      formula:"Δt_DM = 4.15 ms · DM · (f_low⁻² − f_high⁻²)   [DM in pc/cm³, f in GHz]",
      detail:"For optical photons this effect is utterly negligible. It is significant for radio pulsar timing and fast radio bursts. Optical imaging as used here is unaffected."
    },
  ];

  const accent="#00c8ff", border="rgba(0,180,255,0.22)", dim="#6a8aaa", textCol="#c8dff0";

  let sectionSeen = {};
  return (
    <div>
      {/* legend + toggle */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {[["Valid in this model","valid"],["Limitation","limit"],["Future work","future"]].map(([t,k])=>(
            <span key={k} style={{fontSize:11,padding:"3px 10px",borderRadius:4,fontWeight:600,letterSpacing:1,...tagStyle(k)}}>{t}</span>
          ))}
        </div>
        <button onClick={toggleAll} style={{fontSize:13,color:accent,background:"none",border:"1px solid rgba(0,200,255,0.3)",borderRadius:6,cursor:"pointer",padding:"4px 14px"}}>
          {allOpen?"Collapse all":"Expand all"}
        </button>
      </div>

      {assumptions.map((a, i) => (
        <div key={i}>
          {a.section && !sectionSeen[a.section] && (()=>{sectionSeen[a.section]=true; return (
            <div style={{fontSize:11,fontWeight:600,letterSpacing:"2.5px",textTransform:"uppercase",color:dim,margin:"18px 0 8px"}}>{a.section}</div>
          );})()}
          <div style={{border:"1px solid "+border,borderRadius:12,overflow:"hidden",marginBottom:8,background:"rgba(4,18,38,0.96)"}}>
            {/* header */}
            <div onClick={()=>toggle(i)} style={{display:"flex",alignItems:"flex-start",gap:14,padding:"14px 18px",cursor:"pointer",background:openCards[i]?"rgba(0,180,255,0.06)":"transparent"}}>
              <div style={{width:32,height:32,borderRadius:"50%",background:a.bg,border:"1px solid "+a.color+"55",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:a.color,flexShrink:0,marginTop:2,fontFamily:"monospace"}}>{a.id}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:15,fontWeight:600,color:textCol,marginBottom:3}}>{a.title}</div>
                <div style={{fontSize:13,color:dim}}>{a.sub}</div>
              </div>
              <div style={{color:dim,fontSize:14,marginTop:6,flexShrink:0,transition:"transform 0.2s",transform:openCards[i]?"rotate(180deg)":"none"}}>▾</div>
            </div>
            {/* body */}
            {openCards[i] && (
              <div style={{padding:"14px 18px 16px 64px",borderTop:"1px solid "+border,fontSize:14,color:dim,lineHeight:1.8}}>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
                  {a.tags.map((tag,ti)=>(
                    <span key={ti} style={{fontSize:11,padding:"2px 10px",borderRadius:4,fontWeight:600,...tagStyle(tag.k)}}>{tag.t}</span>
                  ))}
                </div>
                <p style={{marginBottom:10}}>{a.body}</p>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:13,background:"rgba(0,0,0,0.3)",border:"1px solid "+border,borderRadius:6,padding:"10px 14px",marginBottom:10,color:"#a8d8ea",letterSpacing:"0.5px"}}>{a.formula}</div>
                <p>{a.detail}</p>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* validity footer */}
      <div style={{marginTop:16,padding:"14px 18px",borderRadius:10,border:"1px solid "+border,background:"rgba(0,200,255,0.04)",fontSize:13,color:dim,lineHeight:1.8}}>
        <strong style={{color:textCol}}>Validity domain: </strong>
        This model is physically exact for optical observation of stellar targets at d ≲ 600 ly with source velocities v ≪ c. All approximation errors are below 1 part in 10⁴ within this regime.
      </div>
    </div>
  );
}

// ── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tIdx, setTIdx] = useState(0);
  const [manualMode, setManualMode] = useState(false);
  const [mGal, setMGal] = useState("Milky Way");
  const [mSys, setMSys] = useState("Solar System");
  const [mPla, setMPla] = useState("Mars");
  const [mDist, setMDist] = useState("12.5");
  const [mUnit, setMUnit] = useState("light-minutes");
  const [ageEv, setAgeEv] = useState("25");
  const [lspan, setLspan] = useState("80");
  const [autoTime, setAutoTime] = useState(true);
  const [evD, setEvD] = useState("2026-01-01");
  const [evT, setEvT] = useState("00:00");
  const [obsD, setObsD] = useState(new Date().toISOString().slice(0,10));
  const [obsT, setObsT] = useState(new Date().toISOString().slice(11,16));
  const [clipV, setClipV] = useState("30");
  const [clipU, setClipU] = useState("seconds");
  const [mediaURL, setMediaURL] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [mediaName, setMediaName] = useState("");
  const [videoDur, setVideoDur] = useState(0);

  const fileRef     = useRef();
  const videoSrcRef = useRef();
  const videoRcvRef = useRef();
  const [prog, setProg]       = useState(0);
  const [playing, setPlaying] = useState(false);
  const [spd, setSpd]         = useState(1);
  const playR  = useRef(false);
  const spdR   = useRef(1);
  const progR  = useRef(0);
  const rafR   = useRef();
  const lastT  = useRef(null);
  const canvasRef = useRef();

  useEffect(()=>{ spdR.current=spd; },[spd]);
  useEffect(()=>{ progR.current=prog; },[prog]);

  useEffect(()=>{
    if(!playing){ playR.current=false; cancelAnimationFrame(rafR.current); lastT.current=null; return; }
    playR.current=true;
    const tick=now=>{
      if(!playR.current) return;
      if(lastT.current===null) lastT.current=now;
      const dt=(now-lastT.current)/1000; lastT.current=now;
      const next=Math.min(progR.current+dt*spdR.current*0.032,1);
      progR.current=next; setProg(next);
      if(next>=1){ playR.current=false; setPlaying(false); return; }
      rafR.current=requestAnimationFrame(tick);
    };
    rafR.current=requestAnimationFrame(tick);
    return()=>{ playR.current=false; cancelAnimationFrame(rafR.current); };
  },[playing]);

  const target = manualMode
    ? {galaxy:mGal,system:mSys,planet:mPla,color:"#80cbc4",status:"Manual",notes:"User-supplied distance.",disc_year:NaN,_distanceLY:toDistanceLY(parseFloat(mDist)||0,mUnit)}
    : TARGETS[tIdx];

  const distanceLY  = target._distanceLY!=null ? target._distanceLY : target.distance_pc*PC_TO_LY;
  const delaySec    = lyToSec(distanceLY);
  const delayYears  = delaySec/SPY;

  useEffect(()=>{ drawScene(canvasRef.current,prog,target); },[prog,target]);

  const obsDT   = new Date(obsD+"T"+(obsT||"00:00")+":00Z");
  const evDT    = autoTime ? addSec(obsDT,-delaySec) : new Date(evD+"T"+(evT||"00:00")+":00Z");
  const arrStart= addSec(evDT,delaySec);
  const clipSec = videoDur>0 ? videoDur : (parseFloat(clipV)||0)*({seconds:1,minutes:60,hours:3600,days:86400,years:SPY}[clipU]||1);

  const age0            = parseFloat(ageEv)||0;
  const ls              = parseFloat(lspan)||80;
  const simProg         = Math.max(0,Math.min(1,prog));
  const simTravelSec    = delaySec*simProg;
  const simDT           = addSec(evDT,simTravelSec);
  const arrivedOnEarth  = simProg>=1;
  const apparentAge     = arrivedOnEarth ? age0 : NaN;
  const actualNow       = age0+secToYr(simTravelSec);
  const ageWhenSeen     = age0+delayYears;
  const hiddenByDelayNow= actualNow-age0;
  const aliveWhenSeen   = ageWhenSeen<ls;
  const aliveNow        = actualNow<ls;

  let recS="not_emitted";
  if(simProg>0&&simProg<1) recS="traveling";
  if(arrivedOnEarth) recS="arrived";

  useEffect(()=>{
    const v=videoRcvRef.current;
    if(!v||mediaType!=="video") return;
    if(!arrivedOnEarth){ v.currentTime=0; v.pause(); return; }
    v.currentTime=0;
  },[arrivedOnEarth,mediaType]);

  const handleMedia=useCallback(file=>{
    if(!file) return;
    if(mediaURL) URL.revokeObjectURL(mediaURL);
    const url=URL.createObjectURL(file);
    setMediaURL(url); setMediaName(file.name);
    const isVid=file.type.startsWith("video");
    setMediaType(isVid?"video":"image"); setVideoDur(0);
    if(isVid){
      const tmp=document.createElement("video"); tmp.src=url;
      tmp.onloadedmetadata=()=>{ setVideoDur(tmp.duration); setClipV(Math.round(tmp.duration).toString()); setClipU("seconds"); };
    }
  },[mediaURL]);

  const handlePP=()=>{ if(prog>=1){ setProg(0); progR.current=0; } setPlaying(p=>!p); lastT.current=null; };
  const handleProg=v=>{ setProg(v); progR.current=v; };

  const accent="#00c8ff",panel="rgba(4,18,38,0.96)",border="rgba(0,180,255,0.22)",dim="#6a8aaa",bright="#e8f4ff",textCol="#c8dff0",ok="#00e87a",danger="#ff5f5f",warn="#f5c842";
  const inp={background:"rgba(0,12,34,0.9)",border:"1px solid "+border,borderRadius:8,padding:"12px 16px",color:textCol,fontSize:17,fontFamily:"'IBM Plex Mono',monospace",outline:"none",width:"100%"};
  const sel={...inp,appearance:"none",cursor:"pointer"};

  const StepLabel=({n,text})=>(
    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
      <div style={{width:32,height:32,borderRadius:"50%",background:"rgba(0,200,255,0.15)",border:"2px solid "+accent,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"monospace",fontSize:15,fontWeight:700,color:accent,flexShrink:0}}>{n}</div>
      <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:13,color:accent,letterSpacing:3,textTransform:"uppercase",fontWeight:700}}>{text}</div>
    </div>
  );

  const InfoCard=({label,value,color,sub})=>(
    <div style={{background:"rgba(0,200,255,0.06)",border:"1px solid "+border,borderRadius:10,padding:"14px 18px"}}>
      <div style={{fontSize:12,color:dim,textTransform:"uppercase",letterSpacing:1.5,marginBottom:6}}>{label}</div>
      <div style={{fontSize:22,fontWeight:700,color:color||accent,fontFamily:"'IBM Plex Mono',monospace",lineHeight:1.2}}>{value}</div>
      {sub&&<div style={{fontSize:13,color:dim,marginTop:6,lineHeight:1.5}}>{sub}</div>}
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@600;700;900&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{background:#020811;color:${textCol};font-family:'IBM Plex Mono',monospace;font-size:16px;line-height:1.65;min-height:100vh;}
        h1,h2,h3{font-family:'Orbitron',sans-serif;}
        select option{background:#020811;color:${textCol};}
        input[type=date],input[type=time]{background:rgba(0,12,34,0.9);color:${textCol};border:1px solid ${border};border-radius:8px;padding:12px 16px;outline:none;width:100%;font-size:17px;font-family:'IBM Plex Mono',monospace;color-scheme:dark;}
        input[type=range]{-webkit-appearance:none;appearance:none;width:100%;height:8px;border-radius:4px;background:rgba(0,180,255,0.18);outline:none;cursor:pointer;}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:24px;height:24px;border-radius:50%;background:${accent};border:3px solid #fff;cursor:pointer;box-shadow:0 0 12px ${accent}99;}
        ::-webkit-scrollbar{width:6px;}::-webkit-scrollbar-thumb{background:rgba(0,180,255,0.25);border-radius:3px;}
        @keyframes fadein{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
        @keyframes glow{0%,100%{box-shadow:0 0 20px rgba(0,232,122,0.3)}50%{box-shadow:0 0 40px rgba(0,232,122,0.6)}}
        .fadein{animation:fadein 0.5s ease;}
        .step{background:${panel};border:1px solid ${border};border-radius:16px;padding:28px 30px;margin-bottom:20px;}
        .g2{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
        .g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;}
        @media(max-width:700px){.g2,.g3{grid-template-columns:1fr;}}
        details>summary{list-style:none;cursor:pointer;}
        details>summary::-webkit-details-marker{display:none;}
      `}</style>

      <StarField/>

      <div style={{position:"relative",zIndex:1,maxWidth:900,margin:"0 auto",padding:"40px 20px 100px"}}>

        {/* HEADER */}
        <div style={{textAlign:"center",marginBottom:40}}>
          <div style={{display:"flex",justifyContent:"center",marginBottom:20}}>
            <RSCLSeal size={260}/>
          </div>
          <div style={{fontSize:13,letterSpacing:5,color:dim,textTransform:"uppercase",marginBottom:10}}>
            Reconfigurable Space Computing Lab · Cal Poly Pomona
          </div>
          <h1 style={{fontSize:"clamp(32px,6vw,56px)",fontWeight:900,color:"#fff",textShadow:"0 0 60px "+accent+"55",lineHeight:1.0,marginBottom:6}}>
            EARTH LOOKBACK
          </h1>
          <h2 style={{fontSize:"clamp(15px,3vw,24px)",fontWeight:600,color:accent,letterSpacing:12,marginBottom:16}}>
            SIMULATOR
          </h2>
          <p style={{color:dim,fontSize:17,lineHeight:1.8,maxWidth:540,margin:"0 auto"}}>
            Choose a real exoplanet, upload a photo or video, and watch your signal travel across the cosmos to Earth.
          </p>
        </div>

        {/* STEP 1 */}
        <div className="step">
          <StepLabel n="1" text="Choose Your World"/>
          <div style={{display:"flex",gap:8,marginBottom:18,flexWrap:"wrap"}}>
            <button onClick={()=>setManualMode(false)} style={{padding:"9px 18px",borderRadius:8,border:"none",background:!manualMode?accent:"rgba(0,180,255,0.09)",color:!manualMode?"#000":dim,fontFamily:"monospace",fontSize:14,fontWeight:700,cursor:"pointer"}}>Catalog</button>
            <button onClick={()=>setManualMode(true)}  style={{padding:"9px 18px",borderRadius:8,border:"none",background:manualMode?accent:"rgba(0,180,255,0.09)",color:manualMode?"#000":dim,fontFamily:"monospace",fontSize:14,fontWeight:700,cursor:"pointer"}}>Manual Entry</button>
          </div>
          {!manualMode ? (
            <>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:10,marginBottom:18}}>
                {TARGETS.map((t,i)=>(
                  <button key={i} onClick={()=>{setTIdx(i);setProg(0);setPlaying(false);progR.current=0;}}
                    style={{padding:"12px 14px",borderRadius:10,border:"2px solid "+(tIdx===i?t.color:"rgba(0,180,255,0.15)"),background:tIdx===i?"rgba(0,200,255,0.1)":"rgba(0,10,30,0.6)",cursor:"pointer",textAlign:"left",transition:"all 0.15s"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                      <div style={{width:11,height:11,borderRadius:"50%",background:t.color,boxShadow:"0 0 7px "+t.color,flexShrink:0}}/>
                      <span style={{fontSize:14,fontWeight:700,color:tIdx===i?t.color:bright,fontFamily:"monospace"}}>{t.planet}</span>
                    </div>
                    <div style={{fontSize:12,color:dim}}>{t.system}</div>
                    <div style={{fontSize:12,color:tIdx===i?accent:dim,marginTop:2}}>{fmtDelay(t.distance_pc*PC_TO_LY)}</div>
                    {t.status.includes("⚠")&&<div style={{fontSize:11,color:warn,marginTop:3}}>⚠ Controversial</div>}
                  </button>
                ))}
              </div>
              <div style={{padding:"14px 18px",background:"rgba(0,200,255,0.05)",border:"1px solid "+border,borderRadius:10,fontSize:15,color:dim,lineHeight:1.7}}>
                <span style={{color:bright,fontWeight:600}}>{target.planet}</span> · {target.galaxy} · <span style={{color:accent}}>{fmtDelay(distanceLY)} away</span>
                {target.disc_year&&!isNaN(target.disc_year)&&<span> · Discovered {target.disc_year}</span>}
                <br/>{target.notes}
              </div>
            </>
          ) : (
            <div className="g2">
              {[["Galaxy",mGal,setMGal],["System / Star",mSys,setMSys],["Planet / Target",mPla,setMPla]].map(([l,v,s])=>(
                <div key={l}>
                  <div style={{fontSize:13,color:dim,marginBottom:6,letterSpacing:1,textTransform:"uppercase"}}>{l}</div>
                  <input value={v} onChange={e=>s(e.target.value)} style={inp}/>
                </div>
              ))}
              <div>
                <div style={{fontSize:13,color:dim,marginBottom:6,letterSpacing:1,textTransform:"uppercase"}}>Distance</div>
                <div style={{display:"flex",gap:8}}>
                  <input type="number" value={mDist} onChange={e=>setMDist(e.target.value)} min="0" step="0.1" style={{...inp,width:"50%"}}/>
                  <select value={mUnit} onChange={e=>setMUnit(e.target.value)} style={{...sel,width:"50%"}}>
                    {["light-minutes","light-hours","light-days","light-years","parsecs"].map(u=><option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* STEP 2 */}
        <div className="step">
          <StepLabel n="2" text="Your Event"/>
          <div onClick={()=>fileRef.current&&fileRef.current.click()}
            style={{border:"2px dashed "+(mediaURL?"rgba(0,232,122,0.5)":border),borderRadius:12,padding:"24px",textAlign:"center",cursor:"pointer",background:mediaURL?"rgba(0,232,122,0.04)":"rgba(0,10,30,0.5)",marginBottom:20,transition:"all 0.2s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=accent;e.currentTarget.style.background="rgba(0,200,255,0.06)";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=mediaURL?"rgba(0,232,122,0.5)":border;e.currentTarget.style.background=mediaURL?"rgba(0,232,122,0.04)":"rgba(0,10,30,0.5)";}}>
            {mediaURL?(
              <div>
                <div style={{fontSize:28,marginBottom:6}}>{mediaType==="video"?"🎬":"🖼️"}</div>
                <div style={{fontSize:16,color:ok,fontWeight:600,marginBottom:4}}>✓  {mediaName}</div>
                <div style={{fontSize:14,color:dim}}>{mediaType==="video"&&videoDur>0?"Duration: "+videoDur.toFixed(1)+"s — ":""}Click to change</div>
              </div>
            ):(
              <div>
                <div style={{fontSize:36,marginBottom:8}}>📷</div>
                <div style={{fontSize:17,color:bright,fontWeight:600,marginBottom:6}}>Upload your image or video</div>
                <div style={{fontSize:15,color:dim}}>This is what you're sending from {target.planet} — watch it travel to Earth</div>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*,video/mp4,video/webm,video/ogg" style={{display:"none"}} onChange={e=>handleMedia(e.target.files[0])}/>
          <div className="g2" style={{marginBottom:14}}>
            <div>
              <div style={{fontSize:13,color:dim,marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>Person's age at this event</div>
              <input type="number" value={ageEv} onChange={e=>setAgeEv(e.target.value)} min="0" step="1" style={inp}/>
            </div>
            <div>
              <div style={{fontSize:13,color:dim,marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>Expected lifespan (years)</div>
              <input type="number" value={lspan} onChange={e=>setLspan(e.target.value)} min="1" step="1" style={inp}/>
            </div>
          </div>
          <div style={{display:"flex",gap:8,marginBottom:14}}>
            <button onClick={()=>setAutoTime(true)}  style={{flex:1,padding:"10px",borderRadius:8,border:"none",background:autoTime?accent:"rgba(0,180,255,0.09)",color:autoTime?"#000":dim,fontSize:15,fontWeight:700,cursor:"pointer"}}>Auto timing</button>
            <button onClick={()=>setAutoTime(false)} style={{flex:1,padding:"10px",borderRadius:8,border:"none",background:!autoTime?accent:"rgba(0,180,255,0.09)",color:!autoTime?"#000":dim,fontSize:15,fontWeight:700,cursor:"pointer"}}>Set event date</button>
          </div>
          {autoTime?(
            <div style={{padding:"12px 16px",background:"rgba(0,232,122,0.07)",border:"1px solid rgba(0,232,122,0.25)",borderRadius:8,fontSize:15,color:ok}}>
              ✓ Auto mode — event is set so the signal arrives at Earth right now ({fmtDT(obsDT)})
            </div>
          ):(
            <div className="g2">
              <div><div style={{fontSize:13,color:dim,marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>Event date at {target.planet}</div><input type="date" value={evD} onChange={e=>setEvD(e.target.value)}/></div>
              <div><div style={{fontSize:13,color:dim,marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>Event time (UTC)</div><input type="time" value={evT} onChange={e=>setEvT(e.target.value)}/></div>
            </div>
          )}
          {mediaType!=="video"&&(
            <div className="g2" style={{marginTop:14}}>
              <div><div style={{fontSize:13,color:dim,marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>Earth observation date</div><input type="date" value={obsD} onChange={e=>setObsD(e.target.value)}/></div>
              <div><div style={{fontSize:13,color:dim,marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>Earth observation time (UTC)</div><input type="time" value={obsT} onChange={e=>setObsT(e.target.value)}/></div>
            </div>
          )}
        </div>

        {/* STEP 3 */}
        <div style={{background:"rgba(1,4,16,0.98)",border:"1px solid "+border,borderRadius:18,overflow:"hidden",marginBottom:20}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"13px 24px",background:"rgba(0,15,45,0.9)",borderBottom:"1px solid "+border}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:10,height:10,borderRadius:"50%",background:target.color,boxShadow:"0 0 8px "+target.color}}/>
              <span style={{fontFamily:"'Orbitron',sans-serif",fontSize:13,color:accent,letterSpacing:3,fontWeight:700}}>STEP 3 — WATCH THE SIGNAL TRAVEL</span>
            </div>
            <span style={{fontSize:14,color:dim}}>{target.planet}  →  Earth</span>
          </div>
          <canvas ref={canvasRef} width={900} height={220} style={{width:"100%",height:220,display:"block"}}/>
          <div style={{padding:"18px 24px",background:"rgba(0,6,22,0.95)",borderTop:"1px solid "+border}}>
            <div style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                <span style={{fontSize:14,color:dim}}>Emitted from {target.planet}</span>
                <span style={{fontSize:16,color:accent,fontWeight:700}}>{(prog*100).toFixed(1)}%  ·  {fmtDelay(distanceLY*Math.max(prog,0.00001))} of {fmtDelay(distanceLY)}</span>
                <span style={{fontSize:14,color:dim}}>Received on Earth</span>
              </div>
              <input type="range" min={0} max={1} step={0.0005} value={prog} onChange={e=>handleProg(parseFloat(e.target.value))}/>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:5}}>
                {["0%","25%","50%","75%","100%"].map(l=><span key={l} style={{fontSize:12,color:"rgba(0,180,255,0.3)"}}>{l}</span>)}
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
              <button onClick={()=>handleProg(0)} style={{padding:"9px 18px",background:"rgba(0,180,255,0.08)",border:"1px solid "+border,borderRadius:8,color:dim,fontSize:15,cursor:"pointer"}}>⏮ Reset</button>
              <button onClick={handlePP} style={{padding:"10px 30px",background:playing?"rgba(0,232,122,0.15)":"rgba(0,200,255,0.15)",border:"2px solid "+(playing?"rgba(0,232,122,0.5)":accent),borderRadius:8,color:playing?ok:accent,fontFamily:"monospace",fontSize:17,letterSpacing:2,fontWeight:800,cursor:"pointer"}}>
                {playing?"⏸  PAUSE":"▶  PLAY"}
              </button>
              <button onClick={()=>handleProg(1)} style={{padding:"9px 18px",background:"rgba(0,180,255,0.08)",border:"1px solid "+border,borderRadius:8,color:dim,fontSize:15,cursor:"pointer"}}>⏭ Arrive</button>
              <div style={{display:"flex",alignItems:"center",gap:8,marginLeft:"auto"}}>
                <span style={{fontSize:14,color:dim}}>Speed:</span>
                {[0.5,1,2,5,10].map(s=>(
                  <button key={s} onClick={()=>setSpd(s)} style={{padding:"7px 12px",borderRadius:7,fontSize:14,cursor:"pointer",border:"1px solid "+(spd===s?accent:border),background:spd===s?"rgba(0,200,255,0.2)":"rgba(0,180,255,0.05)",color:spd===s?accent:dim}}>{s}×</button>
                ))}
              </div>
            </div>
            <div style={{marginTop:14,padding:"12px 18px",borderRadius:8,fontSize:15,fontFamily:"monospace",background:prog>=1?"rgba(0,232,122,0.07)":prog>0?"rgba(0,200,255,0.05)":"rgba(0,0,0,0.25)",border:"1px solid "+(prog>=1?"rgba(0,232,122,0.3)":prog>0?border:"rgba(255,255,255,0.04)"),color:prog>=1?ok:prog>0?textCol:dim}}>
              {prog===0&&"⚡  Ready — press PLAY to emit the signal from "+target.planet}
              {prog>0&&prog<1&&"🔵  Signal traveling… "+fmtDelay(distanceLY*prog)+" covered · "+fmtDelay(distanceLY*(1-prog))+" remaining"}
              {prog>=1&&"✅  Signal arrived on Earth after "+fmtDelay(distanceLY)+" — see what Earth receives below"}
            </div>
          </div>
        </div>

        {/* STEP 4 */}
        <div className="step">
          <StepLabel n="4" text="What Earth Sees"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <div>
              <div style={{fontSize:14,color:dim,marginBottom:10,textAlign:"center",textTransform:"uppercase",letterSpacing:1.5}}>📡  You sent this from {target.planet}</div>
              {mediaURL?(
                mediaType==="image"
                  ? <img src={mediaURL} alt="source" style={{width:"100%",borderRadius:10,border:"2px solid "+border,display:"block"}}/>
                  : <video ref={videoSrcRef} src={mediaURL} controls style={{width:"100%",borderRadius:10,border:"2px solid "+border,display:"block"}}/>
              ):(
                <div style={{borderRadius:10,border:"2px dashed "+border,padding:"40px 20px",textAlign:"center",color:dim,fontSize:15}}>Upload a photo or video in Step 2 to see it here</div>
              )}
              <div style={{marginTop:10,padding:"10px 14px",background:"rgba(0,200,255,0.05)",borderRadius:8,fontSize:14,color:dim,textAlign:"center"}}>
                Age at event: <strong style={{color:accent}}>{fmtAge(age0)}</strong>{" · "}Year: <strong style={{color:accent}}>{evDT.getFullYear()}</strong>
              </div>
            </div>
            <div>
              <div style={{fontSize:14,color:dim,marginBottom:10,textAlign:"center",textTransform:"uppercase",letterSpacing:1.5}}>🌍  Earth receives — {fmtDelay(distanceLY)} later</div>
              {!arrivedOnEarth?(
                <div style={{borderRadius:10,border:"2px dashed rgba(245,200,66,0.3)",padding:"30px 20px",textAlign:"center",background:"rgba(245,200,66,0.04)",minHeight:200,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12}}>
                  <div style={{fontSize:40}}>📡</div>
                  <div style={{fontSize:17,color:warn,fontWeight:700}}>{prog===0?"Signal not yet emitted":"Signal in transit…"}</div>
                  <div style={{fontSize:15,color:dim,lineHeight:1.7}}>{prog===0?"Press PLAY above to send the signal":(prog*100).toFixed(1)+"% of the way · "+fmtDelay(distanceLY*(1-prog))+" remaining"}</div>
                  {prog>0&&<div style={{width:"80%",height:8,borderRadius:4,background:"rgba(0,180,255,0.15)",overflow:"hidden",marginTop:4}}><div style={{height:"100%",width:(prog*100)+"%",background:"linear-gradient(90deg,rgba(0,200,255,0.5),"+accent+")",borderRadius:4,transition:"width 0.1s"}}/></div>}
                </div>
              ):(
                <>
                  {!mediaURL?(
                    <div style={{borderRadius:10,border:"2px solid rgba(0,232,122,0.5)",padding:"40px 20px",textAlign:"center",background:"rgba(0,232,122,0.05)",color:ok,fontSize:16,minHeight:200,display:"flex",alignItems:"center",justifyContent:"center"}}>✓  Signal arrived! Upload a photo or video in Step 2 to see it here.</div>
                  ):mediaType==="image"?(
                    <img src={mediaURL} alt="received" style={{width:"100%",borderRadius:10,display:"block",border:"2px solid rgba(0,232,122,0.6)",boxShadow:"0 0 30px rgba(0,232,122,0.15)",filter:distanceLY>500?"sepia(0.6) brightness(0.78)":"none",animation:"glow 2s ease-in-out infinite"}}/>
                  ):(
                    <video ref={videoRcvRef} src={mediaURL} autoPlay loop style={{width:"100%",borderRadius:10,display:"block",border:"2px solid rgba(0,232,122,0.6)",boxShadow:"0 0 30px rgba(0,232,122,0.15)"}}/>
                  )}
                  <div style={{marginTop:10,padding:"10px 14px",background:"rgba(0,232,122,0.06)",borderRadius:8,fontSize:14,color:ok,textAlign:"center",fontWeight:600,lineHeight:1.7}}>
                    ✓ Earth receives it in <strong>{arrStart.getFullYear()}</strong>{" · "}Emitted in <strong>{evDT.getFullYear()}</strong>{" · "}Travel time: <strong>{delayYears.toFixed(3)} years</strong>{distanceLY>500&&" · Ancient signal"}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* STEP 5 */}
        <div className="step fadein">
          <StepLabel n="5" text="The Numbers"/>
          <div className="g3" style={{marginBottom:16}}>
            <InfoCard label="What Earth sees now" value={arrivedOnEarth?fmtAge(apparentAge):"No signal yet"} color={arrivedOnEarth?accent:warn} sub={arrivedOnEarth?"The arriving photons still show the event-start age.":"Earth cannot see the event until the photon reaches 100%."}/>
            <InfoCard label="Actual age right now" value={fmtAge(actualNow)} color={aliveNow?ok:danger} sub={aliveNow?"Alive at this simulated moment.":"Would have exceeded the chosen lifespan."}/>
            <InfoCard label="Age hidden by delay" value={fmtAge(hiddenByDelayNow)} color={accent} sub="This grows while the photon is traveling."/>
          </div>
          <div className="g3" style={{marginBottom:16}}>
            <InfoCard label="Actual target age at first Earth reception" value={fmtAge(ageWhenSeen)} color={aliveWhenSeen?ok:danger} sub={aliveWhenSeen?"Still alive when Earth first receives the signal.":"Already beyond lifespan when Earth first receives the signal."}/>
            <InfoCard label="Photon simulation time" value={fmtDT(simDT)} color={bright} sub="This is the live time controlled by PLAY and the slider."/>
            <InfoCard label="Reception state" value={recS==="not_emitted"?"Not emitted":recS==="traveling"?"Traveling":"Arrived"} color={recS==="arrived"?ok:recS==="traveling"?accent:dim} sub={recS==="arrived"?"Earth can finally observe the signal.":recS==="traveling"?"Photon is still crossing space.":"Press PLAY to emit the signal."}/>
          </div>
          <div className="g2" style={{marginBottom:16}}>
            <InfoCard label="Signal emitted"           value={fmtDT(evDT)}    color={bright}/>
            <InfoCard label="Arrives on Earth"          value={fmtDT(arrStart)} color={accent}/>
            <InfoCard label="One-way light-travel time" value={fmtDelay(distanceLY)} color={accent}/>
            <InfoCard label="Distance" value={(distanceLY/PC_TO_LY).toFixed(4)+" pc  ·  "+(distanceLY<10?distanceLY.toFixed(3):Math.round(distanceLY).toLocaleString())+" ly"} color={bright}/>
          </div>
          <div style={{padding:"18px 22px",background:"rgba(0,200,255,0.05)",borderRadius:12,borderLeft:"4px solid rgba(0,200,255,0.4)",fontSize:16,color:dim,lineHeight:1.9}}>
            <strong style={{color:bright}}>Live interpretation: </strong>
            {recS==="not_emitted"&&<span>The event is defined at <strong style={{color:target.color}}>{target.planet}</strong>, but no photon has been launched yet.</span>}
            {recS==="traveling"&&<span>The photon has traveled <strong style={{color:accent}}>{fmtDelay(distanceLY*simProg)}</strong>. During that travel time, the real person has aged to <strong style={{color:aliveNow?ok:danger}}>{fmtAge(actualNow)}</strong>, but Earth still sees <strong style={{color:warn}}>nothing</strong>.</span>}
            {recS==="arrived"&&<span>Earth is now seeing the person at <strong style={{color:accent}}>{fmtAge(apparentAge)}</strong>, while the real person is <strong style={{color:aliveNow?ok:danger}}>{fmtAge(actualNow)}</strong>. The delay hides <strong style={{color:accent}}>{fmtAge(hiddenByDelayNow)}</strong> of aging.</span>}
          </div>
        </div>

        {/* QUICK EXAMPLES */}
        <details style={{background:panel,border:"1px solid "+border,borderRadius:14,padding:"16px 22px",marginBottom:14}}>
          <summary style={{fontFamily:"'Orbitron',sans-serif",fontSize:13,color:accent,letterSpacing:2}}>💡  QUICK EXAMPLES</summary>
          <div style={{marginTop:14,fontSize:16,color:dim,lineHeight:2.2}}>
            <strong style={{color:bright}}>Kepler-452 b (~1,799 ly) · age 25:</strong> Earth sees 25 — they're actually about 1,824. Long dead.<br/>
            <strong style={{color:bright}}>TOI-1231 b (~90 ly) · age 25:</strong> Earth sees 25 — actually about 115. Likely dead.<br/>
            <strong style={{color:bright}}>Proxima Cen b (~4.2 ly) · age 25:</strong> Earth sees 25 — actually about 29.2. Probably still alive.<br/>
            <strong style={{color:bright}}>Mars (Manual · ~12.5 light-minutes) · age 25:</strong> Delay is tiny — nearly real-time.
          </div>
        </details>

        {/* SCIENTIFIC ASSUMPTIONS — full panel */}
        <details style={{background:panel,border:"1px solid "+border,borderRadius:14,padding:"16px 22px",marginBottom:14}}>
          <summary style={{fontFamily:"'Orbitron',sans-serif",fontSize:13,color:accent,letterSpacing:2}}>🔬  SCIENTIFIC ASSUMPTIONS & MODEL LIMITATIONS</summary>
          <div style={{marginTop:16}}>
            <ScientificAssumptions/>
          </div>
        </details>

        {/* FOOTER */}
        <div style={{textAlign:"center",marginTop:50}}>
          <div style={{fontSize:13,color:"rgba(0,200,255,0.55)",marginBottom:10,lineHeight:1.8}}>
            Designed by <strong style={{color:"rgba(255,255,255,0.9)"}}>Dr. Mohamed El-Hadedy</strong>,
            Director of the <strong style={{color:"rgba(0,200,255,0.9)"}}>Reconfigurable Space Computing Lab (RSCL)</strong>,
            California State Polytechnic University, Pomona.
          </div>
          <div style={{textAlign:"center",fontSize:13,color:"rgba(0,180,255,0.2)",letterSpacing:2}}>
            RSCL@CPP · EARTH LOOKBACK SIMULATOR · distance / c = travel time · 1 pc = 3.26156 ly
          </div>
        </div>

      </div>
    </>
  );
}
