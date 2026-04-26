import { useState, useRef, useEffect, useCallback } from "react";

const PC_TO_LY = 3.26156;
const SPY = 365.25 * 86400;

// ── LOCAL YEAR UTILITIES ───────────────────────────────────────────────────────
function earthYearsToLocalYears(earthYears, orbitalPeriodDays) {
  if (!orbitalPeriodDays || orbitalPeriodDays <= 0) return null;
  return (earthYears * 365.25) / orbitalPeriodDays;
}
function fmtLocalYears(localYears, orbitalPeriodDays) {
  if (localYears === null || isNaN(localYears)) return "Unknown";
  if (localYears < 0.01) return ((localYears * orbitalPeriodDays * 24)).toFixed(1) + " local hrs";
  if (localYears < 1)    return (localYears * orbitalPeriodDays).toFixed(1) + " local days";
  if (localYears < 1000) return localYears.toFixed(1) + " local yrs";
  return Math.round(localYears).toLocaleString() + " local yrs";
}


// 50+ real confirmed exoplanets — all within the Milky Way
// distance_pc = parallax distance in parsecs
// type: Rocky | Super-Earth | Water World | Sub-Neptune | Neptune-like | Gas Giant | Hot Jupiter | Ultra-hot Jupiter
const TARGETS = [
  // ── NEAREST ──────────────────────────────────────────────────────────────
  { system:"Proxima Centauri", planet:"Proxima Cen b",  distance_pc:1.2948,  color:"#fff176", type:"Rocky",        hz:true,  disc_year:2016, notes:"Nearest known exoplanet. Rocky world in the habitable zone of a red dwarf — 4.2 ly away." , orbital_period_days:11.19, tidally_locked:true },
  { system:"Proxima Centauri", planet:"Proxima Cen d",  distance_pc:1.2948,  color:"#ffe082", type:"Rocky",        hz:false, disc_year:2022, notes:"Sub-Earth mass planet orbiting very close to Proxima Centauri. Too hot for liquid water." , orbital_period_days:5.12, tidally_locked:true },
  { system:"Barnard's Star",   planet:"Barnard b",      distance_pc:1.8282,  color:"#ef9a9a", type:"Super-Earth",  hz:false, disc_year:2024, notes:"Candidate super-Earth around the second-nearest star system to the Sun." , orbital_period_days:3.15, tidally_locked:true },
  { system:"Wolf 359",         planet:"Wolf 359 b",     distance_pc:2.3900,  color:"#f48fb1", type:"Gas Giant",    hz:false, disc_year:2019, notes:"Gas giant orbiting one of the nearest stars — famous from Star Trek." , orbital_period_days:2617.0, tidally_locked:false },
  { system:"Lalande 21185",    planet:"Lalande 21185 b",distance_pc:2.5457,  color:"#ce93d8", type:"Super-Earth",  hz:true,  disc_year:2017, notes:"Super-Earth candidate in the habitable zone of a nearby M-dwarf." , orbital_period_days:12.94, tidally_locked:true },
  // ── NEARBY SYSTEMS ───────────────────────────────────────────────────────
  { system:"GJ 667C",          planet:"GJ 667C c",      distance_pc:6.8432,  color:"#80cbc4", type:"Super-Earth",  hz:true,  disc_year:2011, notes:"Super-Earth firmly in the habitable zone. One of the best nearby HZ candidates." , orbital_period_days:28.14, tidally_locked:true },
  { system:"GJ 667C",          planet:"GJ 667C e",      distance_pc:6.8432,  color:"#4db6ac", type:"Super-Earth",  hz:true,  disc_year:2013, notes:"Second habitable zone planet in the GJ 667C system." , orbital_period_days:62.24, tidally_locked:true },
  { system:"GJ 581",           planet:"GJ 581 c",       distance_pc:6.2981,  color:"#f06292", type:"Super-Earth",  hz:false, disc_year:2007, notes:"Super-Earth near the inner edge of the habitable zone. Dense and likely rocky." , orbital_period_days:12.92, tidally_locked:true },
  { system:"GJ 581",           planet:"GJ 581 d",       distance_pc:6.2981,  color:"#e91e8c", type:"Super-Earth",  hz:true,  disc_year:2007, notes:"Outer super-Earth — possibly habitable with a thick CO₂ atmosphere." , orbital_period_days:66.87, tidally_locked:true },
  { system:"Epsilon Eridani",  planet:"Epsilon Eri b",  distance_pc:3.2127,  color:"#ffab91", type:"Gas Giant",    hz:false, disc_year:2000, notes:"Jupiter-like planet around one of the Sun's nearest stellar neighbors." , orbital_period_days:2502.0, tidally_locked:false },
  { system:"Tau Ceti",         planet:"Tau Ceti e",     distance_pc:3.6481,  color:"#ffe0b2", type:"Super-Earth",  hz:true,  disc_year:2012, notes:"Super-Earth in the habitable zone of a Sun-like star — 12 ly away." , orbital_period_days:168.12, tidally_locked:false },
  { system:"Tau Ceti",         planet:"Tau Ceti f",     distance_pc:3.6481,  color:"#ffcc80", type:"Super-Earth",  hz:true,  disc_year:2012, notes:"Outer habitable zone candidate around Tau Ceti." , orbital_period_days:642.0, tidally_locked:false },
  // ── TRAPPIST SYSTEM ──────────────────────────────────────────────────────
  { system:"TRAPPIST-1",       planet:"TRAPPIST-1 b",   distance_pc:12.4299, color:"#b3e5fc", type:"Rocky",        hz:false, disc_year:2017, notes:"Innermost TRAPPIST-1 planet. Too hot — likely a Venus analog." , orbital_period_days:1.511, tidally_locked:true },
  { system:"TRAPPIST-1",       planet:"TRAPPIST-1 c",   distance_pc:12.4299, color:"#81d4fa", type:"Rocky",        hz:false, disc_year:2017, notes:"Rocky world — recent JWST data suggests little to no atmosphere." , orbital_period_days:2.422, tidally_locked:true },
  { system:"TRAPPIST-1",       planet:"TRAPPIST-1 d",   distance_pc:12.4299, color:"#4fc3f7", type:"Rocky",        hz:true,  disc_year:2017, notes:"Inner habitable zone. Receives similar energy to Earth from the Sun." , orbital_period_days:4.05, tidally_locked:true },
  { system:"TRAPPIST-1",       planet:"TRAPPIST-1 e",   distance_pc:12.4299, color:"#29b6f6", type:"Rocky",        hz:true,  disc_year:2017, notes:"Best habitable zone rocky planet known. Earth-sized, top priority for biosignature searches." , orbital_period_days:6.101, tidally_locked:true },
  { system:"TRAPPIST-1",       planet:"TRAPPIST-1 f",   distance_pc:12.4299, color:"#039be5", type:"Rocky",        hz:true,  disc_year:2017, notes:"Outer habitable zone. Possibly a water-rich world or ice-covered surface." , orbital_period_days:9.207, tidally_locked:true },
  { system:"TRAPPIST-1",       planet:"TRAPPIST-1 g",   distance_pc:12.4299, color:"#0288d1", type:"Rocky",        hz:true,  disc_year:2017, notes:"Outer habitable zone. Larger than Earth — may have a thick H₂O envelope." , orbital_period_days:12.353, tidally_locked:true },
  { system:"TRAPPIST-1",       planet:"TRAPPIST-1 h",   distance_pc:12.4299, color:"#0277bd", type:"Rocky",        hz:false, disc_year:2017, notes:"Outermost TRAPPIST-1 planet. Likely frozen — too cold for liquid water." , orbital_period_days:18.767, tidally_locked:true },
  // ── WATER WORLDS & SUB-NEPTUNES ──────────────────────────────────────────
  { system:"GJ 1214",          planet:"GJ 1214 b",      distance_pc:14.6427, color:"#80deea", type:"Water World",  hz:false, disc_year:2009, notes:"The archetypal water world. Flat transmission spectrum suggests thick steam or water atmosphere." , orbital_period_days:1.58, tidally_locked:true },
  { system:"GJ 3470",          planet:"GJ 3470 b",      distance_pc:29.3500, color:"#4dd0e1", type:"Sub-Neptune",  hz:false, disc_year:2012, notes:"Warm Neptune-like world with a large extended atmosphere being actively evaporated." , orbital_period_days:3.337, tidally_locked:true },
  { system:"GJ 436",           planet:"GJ 436 b",       distance_pc:9.7556,  color:"#26c6da", type:"Neptune-like", hz:false, disc_year:2004, notes:"Hot Neptune orbiting very close. Has a giant comet-like tail of escaping hydrogen." , orbital_period_days:2.644, tidally_locked:true },
  { system:"55 Cancri",        planet:"55 Cnc e",       distance_pc:12.590,  color:"#ffab91", type:"Super-Earth",  hz:false, disc_year:2004, notes:"Ultra-hot super-Earth — surface possibly covered in molten lava. Year = 18 hours." , orbital_period_days:0.737, tidally_locked:true },
  { system:"55 Cancri",        planet:"55 Cnc f",       distance_pc:12.590,  color:"#ff8a65", type:"Gas Giant",    hz:true,  disc_year:2005, notes:"Gas giant in the outer habitable zone of 55 Cancri — any moons could be habitable." , orbital_period_days:259.0, tidally_locked:false },
  { system:"LHS 1140",         planet:"LHS 1140 b",     distance_pc:14.9861, color:"#ef9a9a", type:"Super-Earth",  hz:true,  disc_year:2017, notes:"Rocky super-Earth in the habitable zone — one of the best targets for atmospheric study." , orbital_period_days:24.737, tidally_locked:true },
  { system:"LHS 1140",         planet:"LHS 1140 c",     distance_pc:14.9861, color:"#e57373", type:"Rocky",        hz:false, disc_year:2020, notes:"Inner rocky planet in the LHS 1140 system — too hot for liquid water." , orbital_period_days:3.778, tidally_locked:true },
  // ── TOI SYSTEMS ──────────────────────────────────────────────────────────
  { system:"TOI-1231",         planet:"TOI-1231 b",     distance_pc:27.6227, color:"#ce93d8", type:"Sub-Neptune",  hz:false, disc_year:2021, notes:"Warm sub-Neptune with a cool enough temperature to possibly retain a thick atmosphere." , orbital_period_days:24.246, tidally_locked:true },
  { system:"TOI-700",          planet:"TOI-700 d",      distance_pc:31.1400, color:"#a5d6a7", type:"Rocky",        hz:true,  disc_year:2020, notes:"Earth-sized planet in the habitable zone — one of the first confirmed HZ rocky planets from TESS." , orbital_period_days:37.422, tidally_locked:true },
  { system:"TOI-700",          planet:"TOI-700 e",      distance_pc:31.1400, color:"#81c784", type:"Rocky",        hz:true,  disc_year:2023, notes:"Second habitable zone planet in the TOI-700 system — slightly smaller than Earth." , orbital_period_days:27.81, tidally_locked:true },
  { system:"TOI-1452",         planet:"TOI-1452 b",     distance_pc:99.3000, color:"#80deea", type:"Water World",  hz:true,  disc_year:2022, notes:"Water world candidate — density suggests up to 30% water by mass. In the habitable zone." , orbital_period_days:11.063, tidally_locked:true },
  { system:"TOI-2285",         planet:"TOI-2285 b",     distance_pc:52.0000, color:"#4fc3f7", type:"Sub-Neptune",  hz:true,  disc_year:2022, notes:"Sub-Neptune near the habitable zone of a nearby M-dwarf star." , orbital_period_days:27.268, tidally_locked:true },
  { system:"TOI-4633",         planet:"TOI-4633 c",     distance_pc:110.000, color:"#fff59d", type:"Rocky",        hz:true,  disc_year:2023, notes:"Rocky planet in the habitable zone of a Sun-like star in a binary system." , orbital_period_days:272.0, tidally_locked:false },
  // ── KEPLER SYSTEMS ───────────────────────────────────────────────────────
  { system:"Kepler-22",        planet:"Kepler-22 b",    distance_pc:194.642, color:"#c5e1a5", type:"Sub-Neptune",  hz:true,  disc_year:2011, notes:"First confirmed planet in the habitable zone of a Sun-like star. 2.4× Earth radius." , orbital_period_days:289.862, tidally_locked:false },
  { system:"Kepler-62",        planet:"Kepler-62 e",    distance_pc:368.000, color:"#a5d6a7", type:"Super-Earth",  hz:true,  disc_year:2013, notes:"Super-Earth in the habitable zone — possibly a water world with a global ocean." , orbital_period_days:122.387, tidally_locked:false },
  { system:"Kepler-62",        planet:"Kepler-62 f",    distance_pc:368.000, color:"#66bb6a", type:"Super-Earth",  hz:true,  disc_year:2013, notes:"Outer habitable zone super-Earth. One of the earliest compelling HZ candidates." , orbital_period_days:267.291, tidally_locked:false },
  { system:"Kepler-186",       planet:"Kepler-186 f",   distance_pc:178.500, color:"#aed581", type:"Rocky",        hz:true,  disc_year:2014, notes:"First Earth-sized planet confirmed in the habitable zone of another star." , orbital_period_days:129.944, tidally_locked:false },
  { system:"Kepler-296",       planet:"Kepler-296 e",   distance_pc:740.000, color:"#dce775", type:"Super-Earth",  hz:true,  disc_year:2014, notes:"Habitable zone super-Earth around an M-dwarf binary system." , orbital_period_days:34.141, tidally_locked:true },
  { system:"Kepler-438",       planet:"Kepler-438 b",   distance_pc:472.900, color:"#fff176", type:"Rocky",        hz:true,  disc_year:2015, notes:"One of the most Earth-like planets known by ESI score — but bombarded by stellar flares." , orbital_period_days:35.233, tidally_locked:true },
  { system:"Kepler-442",       planet:"Kepler-442 b",   distance_pc:342.000, color:"#ffee58", type:"Super-Earth",  hz:true,  disc_year:2015, notes:"One of the best HZ candidates — receives ~70% of Earth's solar flux from a cooler star." , orbital_period_days:112.305, tidally_locked:false },
  { system:"Kepler-452",       planet:"Kepler-452 b",   distance_pc:551.727, color:"#ffcc80", type:"Super-Earth",  hz:true,  disc_year:2015, notes:"⚠ Controversial — possibly Earth's older cousin at 1.5× radius, or a false positive." , orbital_period_days:384.843, tidally_locked:false },
  { system:"Kepler-1649",      planet:"Kepler-1649 c",  distance_pc:290.900, color:"#ff8a65", type:"Rocky",        hz:true,  disc_year:2020, notes:"Earth-sized HZ planet around an M-dwarf — among the most Earth-like found by Kepler." , orbital_period_days:19.535, tidally_locked:true },
  { system:"Kepler-69",        planet:"Kepler-69 c",    distance_pc:730.000, color:"#bcaaa4", type:"Super-Earth",  hz:false, disc_year:2013, notes:"Super-Earth near the inner edge of the HZ — possibly a super-Venus." , orbital_period_days:242.461, tidally_locked:false },
  // ── HOT JUPITERS ─────────────────────────────────────────────────────────
  { system:"51 Pegasi",        planet:"51 Peg b",       distance_pc:15.3600, color:"#ffb74d", type:"Hot Jupiter",  hz:false, disc_year:1995, notes:"The first exoplanet found around a Sun-like star. Nobel Prize 2019. Year = 4.2 days." , orbital_period_days:4.231, tidally_locked:true },
  { system:"HD 209458",        planet:"HD 209458 b",    distance_pc:47.0000, color:"#ffa726", type:"Hot Jupiter",  hz:false, disc_year:1999, notes:"'Osiris' — first exoplanet observed transiting its star. Has an evaporating atmosphere." , orbital_period_days:3.525, tidally_locked:true },
  { system:"HD 189733",        planet:"HD 189733 b",    distance_pc:19.7600, color:"#4fc3f7", type:"Hot Jupiter",  hz:false, disc_year:2005, notes:"Deep-blue hot Jupiter where it rains molten glass sideways at 9,000 km/h winds." , orbital_period_days:2.219, tidally_locked:true },
  { system:"WASP-17",          planet:"WASP-17 b",      distance_pc:390.000, color:"#b0bec5", type:"Hot Jupiter",  hz:false, disc_year:2009, notes:"One of the largest exoplanets known — puffed up, retrograde orbit, extremely low density." , orbital_period_days:3.735, tidally_locked:true },
  { system:"WASP-121",         planet:"WASP-121 b",     distance_pc:270.000, color:"#ffcc02", type:"Ultra-hot Jupiter", hz:false, disc_year:2015, notes:"Ultra-hot Jupiter where iron and titanium rain from the atmosphere. Temperature ~2,400 K." , orbital_period_days:1.275, tidally_locked:true },
  { system:"KELT-9",           planet:"KELT-9 b",       distance_pc:294.000, color:"#ff5722", type:"Ultra-hot Jupiter", hz:false, disc_year:2016, notes:"Hottest known exoplanet — hotter than most stars at ~4,300 K. Atmosphere is vaporizing." , orbital_period_days:1.481, tidally_locked:true },
  { system:"HAT-P-7",          planet:"HAT-P-7 b",      distance_pc:320.000, color:"#ff7043", type:"Hot Jupiter",  hz:false, disc_year:2008, notes:"Hot Jupiter where corundum (sapphire/ruby) clouds rain from the sky on the night side." , orbital_period_days:2.205, tidally_locked:true },
  // ── GAS GIANTS & DIRECT IMAGING ──────────────────────────────────────────
  { system:"HR 8799",          planet:"HR 8799 b",      distance_pc:39.4000, color:"#ce93d8", type:"Gas Giant",    hz:false, disc_year:2008, notes:"First multi-planet system discovered by direct imaging. Young super-Jupiter." , orbital_period_days:164250.0, tidally_locked:false },
  { system:"HR 8799",          planet:"HR 8799 e",      distance_pc:39.4000, color:"#ba68c8", type:"Gas Giant",    hz:false, disc_year:2010, notes:"Innermost directly imaged planet in HR 8799 — hints of water and CO in its atmosphere." , orbital_period_days:18000.0, tidally_locked:false },
  { system:"Beta Pictoris",    planet:"Beta Pic b",     distance_pc:19.4400, color:"#ef9a9a", type:"Gas Giant",    hz:false, disc_year:2008, notes:"Young gas giant caught in the act of forming — directly imaged orbiting a debris disk." , orbital_period_days:8030.0, tidally_locked:false },
  { system:"Beta Pictoris",    planet:"Beta Pic c",     distance_pc:19.4400, color:"#e57373", type:"Gas Giant",    hz:false, disc_year:2019, notes:"Second directly imaged planet — causes gaps in Beta Pic's dusty debris disk." , orbital_period_days:1200.0, tidally_locked:false },
  { system:"Fomalhaut",        planet:"Fomalhaut b",    distance_pc:7.6900,  color:"#80cbc4", type:"Gas Giant",    hz:false, disc_year:2008, notes:"Directly imaged — may be a cloud of debris from a recent collision rather than a solid planet." , orbital_period_days:323652.0, tidally_locked:false },
  // ── INTERESTING & EXOTIC ─────────────────────────────────────────────────
  { system:"55 Cancri",        planet:"55 Cnc d",       distance_pc:12.590,  color:"#a5d6a7", type:"Gas Giant",    hz:false, disc_year:2002, notes:"Long-period Jupiter analog in the 55 Cancri system — 14-year orbit." , orbital_period_days:4825.0, tidally_locked:false },
  { system:"Upsilon Andromedae",planet:"Ups And d",     distance_pc:13.4700, color:"#ffb74d", type:"Gas Giant",    hz:false, disc_year:1999, notes:"Outer gas giant in a multi-planet system around a bright nearby star." , orbital_period_days:1276.46, tidally_locked:false },
  { system:"Gliese 876",       planet:"Gliese 876 d",   distance_pc:4.6900,  color:"#ef9a9a", type:"Rocky",        hz:false, disc_year:2005, notes:"One of the first confirmed super-Earths. Very hot — year = 1.94 days." , orbital_period_days:1.938, tidally_locked:true },
  { system:"Gliese 876",       planet:"Gliese 876 b",   distance_pc:4.6900,  color:"#ff8a65", type:"Gas Giant",    hz:false, disc_year:1998, notes:"Jupiter-mass planet in a 2:1 resonance with Gliese 876 c. 60 ly away." , orbital_period_days:60.94, tidally_locked:false },
  { system:"K2-18",            planet:"K2-18 b",        distance_pc:38.0000, color:"#80deea", type:"Water World",  hz:true,  disc_year:2015, notes:"Possible Hycean world — JWST detected carbon molecules. May have a liquid water ocean under a H₂ atmosphere." , orbital_period_days:32.94, tidally_locked:true },
  { system:"GJ 3512",          planet:"GJ 3512 b",      distance_pc:9.4900,  color:"#ffab91", type:"Gas Giant",    hz:false, disc_year:2019, notes:"Jupiter-mass planet around a tiny M-dwarf — challenges planet formation theories." , orbital_period_days:203.59, tidally_locked:false },
  { system:"L 98-59",          planet:"L 98-59 b",      distance_pc:10.6200, color:"#b0bec5", type:"Rocky",        hz:false, disc_year:2019, notes:"Sub-Earth mass planet — one of the lightest exoplanets known. Year = 2.25 days." , orbital_period_days:2.253, tidally_locked:true },
  { system:"L 98-59",          planet:"L 98-59 d",      distance_pc:10.6200, color:"#90a4ae", type:"Rocky",        hz:false, disc_year:2019, notes:"Third planet in L 98-59 — may retain water. Top JWST atmospheric target." , orbital_period_days:7.451, tidally_locked:true },
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

function signalQuality(distanceLY) {
  if (distanceLY < 0.01)  return 1.00;
  if (distanceLY < 5)     return 0.92;
  if (distanceLY < 15)    return 0.80;
  if (distanceLY < 40)    return 0.66;
  if (distanceLY < 100)   return 0.50;
  if (distanceLY < 300)   return 0.36;
  if (distanceLY < 600)   return 0.22;
  return 0.12;
}

function signalLabel(q) {
  if (q > 0.88) return { label:"STRONG",    col:"#00e87a" };
  if (q > 0.72) return { label:"GOOD",      col:"#7ecb35" };
  if (q > 0.54) return { label:"MODERATE",  col:"#f5c842" };
  if (q > 0.36) return { label:"WEAK",      col:"#ff9a20" };
  if (q > 0.18) return { label:"VERY WEAK", col:"#ff5f5f" };
  return              { label:"ANCIENT",    col:"#b39ddb" };
}

// ── SIGNAL STRENGTH BADGE ────────────────────────────────────────────────────
function SignalBadge({ quality }) {
  const sig = signalLabel(quality);
  const bars = 5;
  const filled = Math.round(quality * bars);
  return (
    <div style={{display:"flex",alignItems:"center",gap:8,marginTop:8,padding:"6px 12px",background:"rgba(0,0,0,0.5)",borderRadius:6,border:"1px solid rgba(0,180,255,0.2)"}}>
      <div style={{fontSize:11,color:"#6a8aaa",fontFamily:"monospace",letterSpacing:1}}>SIGNAL</div>
      <div style={{display:"flex",gap:2,alignItems:"flex-end"}}>
        {Array.from({length:bars},(_,i)=>(
          <div key={i} style={{width:5,height:6+i*3,borderRadius:1,background:i<filled?sig.col:"rgba(255,255,255,0.1)"}}/>
        ))}
      </div>
      <div style={{fontSize:11,fontWeight:700,color:sig.col,fontFamily:"monospace",letterSpacing:1}}>{sig.label}</div>
      <div style={{fontSize:11,color:"#6a8aaa",fontFamily:"monospace",marginLeft:"auto"}}>{Math.round(quality*100)}%</div>
    </div>
  );
}

// ── RECEIVED IMAGE — realistic piece-by-piece signal arrival ─────────────────
function ReceivedImage({ mediaURL, mediaType, distanceLY, arrived }) {
  const canvasRef     = useRef(null);
  const rafRef        = useRef(null);
  const phaseRef      = useRef("idle");
  const colRef        = useRef(0);
  const noiseFrameRef = useRef(0);
  const imgRef        = useRef(null);
  const startedRef    = useRef(false);
  const [revealPct, setRevealPct] = useState(0);
  const [phase, setPhase]         = useState("idle");

  const quality        = signalQuality(distanceLY);
  const permanentNoise = Math.max(0, (1 - quality) * 0.45);
  const sepiaAmount    = distanceLY > 400 ? Math.min((distanceLY - 400) / 1400, 0.72) : 0;
  const noiseFrames    = Math.round(20 + (1 - quality) * 65);
  const colsPerFrame   = Math.max(1, Math.round(480 * (0.006 + quality * 0.016)));

  const applySepia = (ctx, w, h, amt) => {
    if (amt <= 0) return;
    const d = ctx.getImageData(0,0,w,h); const px = d.data;
    for (let i = 0; i < px.length; i+=4) {
      const r=px[i],g=px[i+1],b=px[i+2];
      px[i]   = Math.min(255, r*.393+g*.769+b*.189)*amt + r*(1-amt);
      px[i+1] = Math.min(255, r*.349+g*.686+b*.168)*amt + g*(1-amt);
      px[i+2] = Math.min(255, r*.272+g*.534+b*.131)*amt + b*(1-amt);
    }
    ctx.putImageData(d,0,0);
  };

  const applyNoise = (ctx, w, h, amt) => {
    if (amt <= 0) return;
    const d = ctx.getImageData(0,0,w,h); const px = d.data;
    for (let i = 0; i < px.length; i+=4) {
      const n=(Math.random()-.5)*255*amt;
      px[i]  =Math.max(0,Math.min(255,px[i]+n));
      px[i+1]=Math.max(0,Math.min(255,px[i+1]+n));
      px[i+2]=Math.max(0,Math.min(255,px[i+2]+n));
    }
    ctx.putImageData(d,0,0);
  };

  const startAnimation = useCallback((img) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    cancelAnimationFrame(rafRef.current);

    const maxW=480, maxH=360;
    const scale = Math.min(maxW/img.naturalWidth, maxH/img.naturalHeight, 1);
    const W = Math.round(img.naturalWidth*scale);
    const H = Math.round(img.naturalHeight*scale);
    canvas.width=W; canvas.height=H;
    const ctx = canvas.getContext("2d");

    // PHASE 1: paint solid black — nothing received yet
    ctx.fillStyle="#000";
    ctx.fillRect(0,0,W,H);

    phaseRef.current="noise"; noiseFrameRef.current=0; colRef.current=0;
    setPhase("noise"); setRevealPct(0);

    const frame = () => {
      const ph = phaseRef.current;

      if (ph === "noise") {
        // PHASE 2: pure static/interference before signal locks
        const d = ctx.createImageData(W,H);
        for (let i=0;i<d.data.length;i+=4) {
          const v=Math.random()*255*(0.55+(1-quality)*0.45);
          d.data[i]=v*0.5; d.data[i+1]=v*0.75; d.data[i+2]=v; d.data[i+3]=240;
        }
        ctx.putImageData(d,0,0);
        for (let g=0;g<3;g++) {
          const gy=Math.floor(Math.random()*H);
          ctx.fillStyle="rgba(0,220,255,"+(Math.random()*0.4)+")";
          ctx.fillRect(0,gy,W,1+Math.floor(Math.random()*2));
        }
        noiseFrameRef.current++;
        if (noiseFrameRef.current >= noiseFrames) {
          phaseRef.current="reveal"; setPhase("reveal");
        }
        rafRef.current=requestAnimationFrame(frame);
        return;
      }

      if (ph === "reveal") {
        // PHASE 3: draw full image, cover unrevealed right portion with static
        const col = colRef.current;
        ctx.drawImage(img,0,0,W,H);
        if (sepiaAmount>0) applySepia(ctx,W,H,sepiaAmount);
        if (permanentNoise>0) applyNoise(ctx,W,H,permanentNoise*0.35);

        // cover the unrevealed columns with fresh noise
        const rem = W - col;
        if (rem > 0) {
          const nd = ctx.createImageData(rem,H);
          for (let i=0;i<nd.data.length;i+=4) {
            const v=Math.random()*255*(0.5+(1-quality)*0.5);
            nd.data[i]=v*0.5; nd.data[i+1]=v*0.75; nd.data[i+2]=v; nd.data[i+3]=240;
          }
          ctx.putImageData(nd, col, 0);
        }

        // glowing wavefront scanline at the reveal edge
        if (col < W) {
          const grd=ctx.createLinearGradient(Math.max(0,col-18),0,col+4,0);
          grd.addColorStop(0,"rgba(0,232,255,0)");
          grd.addColorStop(0.5,"rgba(0,232,255,0.6)");
          grd.addColorStop(1,"rgba(255,255,255,0.95)");
          ctx.fillStyle=grd;
          ctx.fillRect(Math.max(0,col-18),0,22,H);
          for (let g=0;g<4;g++) {
            const gy=Math.floor(Math.random()*H);
            const gw=Math.floor(Math.random()*20)+4;
            ctx.fillStyle="rgba(0,232,255,"+(0.4+Math.random()*0.5)+")";
            ctx.fillRect(Math.max(0,col-gw),gy,gw,1);
          }
        }

        const pct=Math.min(100,Math.round((col/W)*100));
        setRevealPct(pct);
        colRef.current += colsPerFrame;

        if (colRef.current >= W) {
          // PHASE 4: fully arrived — render final image with permanent effects
          ctx.drawImage(img,0,0,W,H);
          if (sepiaAmount>0) applySepia(ctx,W,H,sepiaAmount);
          if (permanentNoise>0) applyNoise(ctx,W,H,permanentNoise*0.22);
          phaseRef.current="done"; setPhase("done"); setRevealPct(100);
          return;
        }
        rafRef.current=requestAnimationFrame(frame);
      }
    };
    rafRef.current=requestAnimationFrame(frame);
  }, [quality, sepiaAmount, permanentNoise, noiseFrames, colsPerFrame]);

  // Load image once when mediaURL changes
  useEffect(()=>{
    startedRef.current=false;
    imgRef.current=null;
    phaseRef.current="idle";
    setPhase("idle"); setRevealPct(0);
    if (!mediaURL || mediaType==="video") return;
    const img = new Image();
    img.crossOrigin="anonymous";
    img.onload=()=>{ imgRef.current=img; };
    img.src=mediaURL;
  }, [mediaURL, mediaType]);

  // Start animation when arrived becomes true AND image is loaded
  useEffect(()=>{
    if (!arrived || !mediaURL || mediaType==="video") return;
    if (startedRef.current) return;

    const tryStart = () => {
      if (imgRef.current && canvasRef.current) {
        startedRef.current=true;
        startAnimation(imgRef.current);
      } else {
        // poll until both image and canvas are ready
        setTimeout(tryStart, 50);
      }
    };
    tryStart();
    return ()=>cancelAnimationFrame(rafRef.current);
  }, [arrived, mediaURL, mediaType, startAnimation]);

  // Video handling
  if (mediaType==="video" && arrived) {
    const fp=[];
    if (sepiaAmount>0) fp.push(`sepia(${Math.round(sepiaAmount*100)}%)`);
    if (permanentNoise>0.25) fp.push(`contrast(${Math.round(90+permanentNoise*15)}%) brightness(${Math.round(88-permanentNoise*12)}%)`);
    return (
      <div>
        <video src={mediaURL} autoPlay loop style={{width:"100%",borderRadius:10,display:"block",border:"2px solid rgba(0,232,122,0.6)",filter:fp.join(" ")||"none"}}/>
        <SignalBadge quality={quality}/>
      </div>
    );
  }

  if (!arrived) return null;

  return (
    <div>
      <div style={{position:"relative",borderRadius:10,overflow:"hidden",border:"2px solid "+(phase==="done"?"rgba(0,232,122,0.6)":"rgba(0,200,255,0.5)"),background:"#000",minHeight:120}}>
        <canvas ref={canvasRef} style={{display:"block",width:"100%"}}/>
        {(phase==="noise"||phase==="reveal") && (
          <div style={{position:"absolute",bottom:8,left:8,right:8,background:"rgba(0,0,0,0.85)",borderRadius:6,padding:"7px 12px",display:"flex",alignItems:"center",gap:10}}>
            <div style={{fontSize:11,color:"#00c8ff",fontFamily:"monospace",letterSpacing:1,flexShrink:0}}>{phase==="noise"?"LOCKING SIGNAL…":"RECONSTRUCTING…"}</div>
            <div style={{flex:1,height:3,background:"rgba(0,180,255,0.2)",borderRadius:2,overflow:"hidden"}}>
              <div style={{height:"100%",width:(phase==="noise"?"2":revealPct)+"%",background:"#00c8ff",borderRadius:2,transition:"width 0.06s"}}/>
            </div>
            <div style={{fontSize:11,color:"#00c8ff",fontFamily:"monospace",flexShrink:0}}>{phase==="noise"?"–":revealPct+"%"}</div>
          </div>
        )}
      </div>
      <SignalBadge quality={quality}/>
      {phase==="done" && distanceLY>400 && (
        <div style={{marginTop:6,padding:"6px 12px",background:"rgba(179,157,219,0.1)",border:"1px solid rgba(179,157,219,0.3)",borderRadius:6,fontSize:12,color:"#b39ddb",fontFamily:"monospace"}}>
          ⚠ Permanently degraded — {Math.round(distanceLY).toLocaleString()} ly traveled. Ancient photons.
        </div>
      )}
    </div>
  );
}

// ── CINEMATIC DEEP SPACE CANVAS ──────────────────────────────────────────────
function useDeepSpaceCanvas(canvasRef, prog, target) {
  const starsRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !target) return;
    const ctx = canvas.getContext("2d");
    const distanceLY = target._distanceLY != null ? target._distanceLY : target.distance_pc * PC_TO_LY;
    const col = target.color || "#4fc3f7";

    // Generate three parallax star layers once
    if (!starsRef.current) {
      starsRef.current = [
        Array.from({length:200}, () => ({ x:Math.random(), y:Math.random(), r:Math.random()*0.8+0.2, a:Math.random()*0.5+0.1, sp:Math.random()*0.02+0.005, ph:Math.random()*Math.PI*2, par:0.02, hex:null })),
        Array.from({length:80},  () => ({ x:Math.random(), y:Math.random(), r:Math.random()*1.2+0.4, a:Math.random()*0.6+0.2, sp:Math.random()*0.03+0.01,  ph:Math.random()*Math.PI*2, par:0.06, hex:Math.random()>0.8?(Math.random()>0.5?"#ffd8a8":"#a8c8ff"):null })),
        Array.from({length:30},  () => ({ x:Math.random(), y:Math.random(), r:Math.random()*2.0+0.8, a:Math.random()*0.7+0.3, sp:Math.random()*0.04+0.02,  ph:Math.random()*Math.PI*2, par:0.14, hex:Math.random()>0.7?(Math.random()>0.5?"#ffe4b5":"#b8d4ff"):null }))
      ];
    }

    let animating = true;
    let raf;

    const draw = (ts) => {
      if (!animating) return;
      const t = ts * 0.001;
      const W = canvas.width, H = canvas.height;
      const p = Math.max(0, Math.min(1, prog));
      ctx.clearRect(0,0,W,H);

      // Background
      const bgG = ctx.createLinearGradient(0,0,W,H);
      bgG.addColorStop(0,"#000408"); bgG.addColorStop(0.4,"#010810"); bgG.addColorStop(1,"#000408");
      ctx.fillStyle=bgG; ctx.fillRect(0,0,W,H);

      // Nebula clouds
      const drawNebula = (x, y, r, c) => {
        const g = ctx.createRadialGradient(x,y,0,x,y,r);
        g.addColorStop(0,c); g.addColorStop(1,"rgba(0,0,0,0)");
        ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      };
      drawNebula(W*0.18+Math.sin(t*0.05)*3, H*0.45, W*0.22, "rgba(20,0,80,0.20)");
      drawNebula(W*0.82+Math.sin(t*0.04)*3, H*0.55, W*0.20, "rgba(0,30,80,0.18)");
      drawNebula(W*0.50, H*0.50, W*0.35, "rgba(0,10,40,0.12)");

      // Parallax stars
      const par = p * 60;
      starsRef.current.forEach(layer => layer.forEach(s => {
        const tw = 0.4 + 0.6*(0.5+0.5*Math.sin(t*s.sp*60+s.ph));
        const alpha = s.a * tw;
        const sx = ((s.x*W) - par*s.par + W) % W;
        const sy = s.y * H;
        if (s.hex) {
          const h=s.hex.slice(1);
          ctx.fillStyle=`rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${alpha})`;
        } else {
          ctx.fillStyle=`rgba(200,220,255,${alpha})`;
        }
        ctx.beginPath(); ctx.arc(sx,sy,s.r,0,Math.PI*2); ctx.fill();
        if (s.par>0.1 && s.r>1.5 && alpha>0.5) {
          ctx.strokeStyle=`rgba(200,220,255,${alpha*0.3})`; ctx.lineWidth=0.5;
          ctx.beginPath(); ctx.moveTo(sx-s.r*3,sy); ctx.lineTo(sx+s.r*3,sy); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(sx,sy-s.r*3); ctx.lineTo(sx,sy+s.r*3); ctx.stroke();
        }
      }));

      const PX=110, EX=W-100, MY=H/2, span=EX-PX;

      // Galaxy label
      ctx.font="bold 11px 'IBM Plex Mono',monospace"; ctx.fillStyle="rgba(0,200,255,0.22)"; ctx.textAlign="center";
      ctx.fillText("✦  MILKY WAY GALAXY  ✦", W/2, 16);

      // Travel path
      ctx.strokeStyle="rgba(0,180,255,0.07)"; ctx.lineWidth=1; ctx.setLineDash([4,8]);
      ctx.beginPath(); ctx.moveTo(PX,MY); ctx.lineTo(EX,MY); ctx.stroke(); ctx.setLineDash([]);
      ctx.font="11px 'IBM Plex Mono',monospace"; ctx.fillStyle="rgba(0,180,255,0.32)"; ctx.textAlign="center";
      ctx.fillText("← "+fmtDelay(distanceLY)+" →", W/2, MY-20);

      // SOURCE STAR
      const sX=PX-50, sY=MY-28, sp2=1+0.06*Math.sin(t*1.8);
      for(let g=4;g>=1;g--){ const gr=ctx.createRadialGradient(sX,sY,0,sX,sY,26*g); gr.addColorStop(0,"rgba(255,240,160,0.07)"); gr.addColorStop(1,"rgba(0,0,0,0)"); ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(sX,sY,26*g,0,Math.PI*2); ctx.fill(); }
      for(let r=0;r<12;r++){ const a=(r/12)*Math.PI*2+t*0.3; const rl=13+5*Math.sin(t*2+r); ctx.beginPath(); ctx.moveTo(sX+Math.cos(a)*7,sY+Math.sin(a)*7); ctx.lineTo(sX+Math.cos(a)*rl,sY+Math.sin(a)*rl); ctx.strokeStyle=`rgba(255,220,80,${0.18+0.12*Math.sin(t*1.5+r)})`; ctx.lineWidth=1.2; ctx.stroke(); }
      const sGrd=ctx.createRadialGradient(sX-2,sY-2,0,sX,sY,10*sp2); sGrd.addColorStop(0,"rgba(255,255,240,1)"); sGrd.addColorStop(0.3,"rgba(255,220,100,0.9)"); sGrd.addColorStop(0.7,"rgba(255,160,30,0.4)"); sGrd.addColorStop(1,"rgba(255,100,0,0)"); ctx.fillStyle=sGrd; ctx.beginPath(); ctx.arc(sX,sY,10*sp2,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(sX,sY,4,0,Math.PI*2); ctx.fillStyle="rgba(255,255,250,1)"; ctx.fill();

      // SOURCE PLANET
      const pp=1+0.03*Math.sin(t*1.2);
      for(let g=3;g>=1;g--){ const hg=ctx.createRadialGradient(PX,MY,24,PX,MY,38*g); hg.addColorStop(0,col+"22"); hg.addColorStop(1,"rgba(0,0,0,0)"); ctx.fillStyle=hg; ctx.beginPath(); ctx.arc(PX,MY,38*g,0,Math.PI*2); ctx.fill(); }
      const pGrd=ctx.createRadialGradient(PX-8,MY-8,2,PX,MY,28*pp); pGrd.addColorStop(0,"rgba(255,255,255,0.35)"); pGrd.addColorStop(0.3,col); pGrd.addColorStop(0.7,col+"aa"); pGrd.addColorStop(1,"rgba(0,0,0,0.8)"); ctx.fillStyle=pGrd; ctx.beginPath(); ctx.arc(PX,MY,28*pp,0,Math.PI*2); ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.arc(PX,MY,28,0,Math.PI*2); ctx.clip(); ctx.strokeStyle="rgba(0,0,0,0.18)"; ctx.lineWidth=4; [-8,4,14].forEach(dy=>{ctx.beginPath();ctx.ellipse(PX,MY+dy,28,7,0,0,Math.PI*2);ctx.stroke();}); ctx.restore();
      if(target.type&&(target.type.includes("Jupiter")||target.type.includes("Gas"))){ ctx.beginPath(); ctx.ellipse(PX,MY+6,46,10,0,0,Math.PI*2); ctx.strokeStyle=col+"44"; ctx.lineWidth=3; ctx.stroke(); }
      ctx.beginPath(); ctx.arc(PX,MY,32,0,Math.PI*2); ctx.strokeStyle=col+"33"; ctx.lineWidth=4; ctx.stroke();
      if(p<0.04){ const ef=1-p/0.04; ctx.beginPath(); ctx.arc(PX,MY,28+ef*40,0,Math.PI*2); ctx.strokeStyle=`rgba(255,255,255,${ef*0.6})`; ctx.lineWidth=2.5; ctx.stroke(); ctx.beginPath(); ctx.arc(PX,MY,28+ef*70,0,Math.PI*2); ctx.strokeStyle=`rgba(255,255,255,${ef*0.25})`; ctx.lineWidth=1.5; ctx.stroke(); }
      ctx.font="bold 13px 'IBM Plex Mono',monospace"; ctx.fillStyle=col; ctx.textAlign="center"; ctx.fillText(target.planet,PX,MY+50);
      ctx.font="10px 'IBM Plex Mono',monospace"; ctx.fillStyle="rgba(0,200,255,0.45)"; ctx.fillText(target.system,PX,MY+63);

      // PHOTON SIGNAL
      if(p>0){
        const sigX=PX+span*p;
        const trailLen=Math.min(span*p,300);
        const tGrd=ctx.createLinearGradient(Math.max(PX,sigX-trailLen),MY,sigX,MY);
        tGrd.addColorStop(0,"rgba(0,200,255,0)"); tGrd.addColorStop(0.6,"rgba(0,220,255,0.04)"); tGrd.addColorStop(1,"rgba(0,240,255,0.55)");
        ctx.strokeStyle=tGrd; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(Math.max(PX,sigX-trailLen),MY); ctx.lineTo(sigX,MY); ctx.stroke();
        const pulseP=(t*3)%1;
        [0,0.33,0.66].forEach(off=>{ const pf=(pulseP+off)%1; const pr=pf*22; const pa=(1-pf)*0.5; ctx.beginPath(); ctx.arc(sigX,MY,pr,0,Math.PI*2); ctx.strokeStyle=`rgba(0,232,255,${pa})`; ctx.lineWidth=1.5; ctx.stroke(); });
        const phG=ctx.createRadialGradient(sigX,MY,0,sigX,MY,14); phG.addColorStop(0,"rgba(255,255,255,1)"); phG.addColorStop(0.3,"rgba(100,240,255,0.9)"); phG.addColorStop(0.7,"rgba(0,200,255,0.4)"); phG.addColorStop(1,"rgba(0,150,255,0)"); ctx.fillStyle=phG; ctx.beginPath(); ctx.arc(sigX,MY,14,0,Math.PI*2); ctx.fill();
        const fA=0.35+0.15*Math.sin(t*4);
        [-1,1].forEach(dir=>{ const fG=ctx.createLinearGradient(sigX,MY,sigX+dir*40,MY); fG.addColorStop(0,`rgba(180,240,255,${fA})`); fG.addColorStop(1,"rgba(0,200,255,0)"); ctx.strokeStyle=fG; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(sigX,MY); ctx.lineTo(sigX+dir*40,MY); ctx.stroke(); });
        if(p>0.04&&p<0.96){ const tLY=distanceLY*p; ctx.font="11px 'IBM Plex Mono',monospace"; ctx.fillStyle="rgba(0,240,255,0.8)"; ctx.textAlign="center"; ctx.fillText((tLY<1?fmtDelay(tLY):tLY.toFixed(2)+" ly")+" traveled",sigX,MY-26); }
        [0.25,0.5,0.75].forEach(frac=>{ const mx=PX+span*frac; if(mx<sigX){ctx.beginPath();ctx.arc(mx,MY,3,0,Math.PI*2);ctx.fillStyle="rgba(0,200,255,0.5)";ctx.fill();} ctx.strokeStyle="rgba(0,180,255,0.15)";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(mx,MY+4);ctx.lineTo(mx,MY+12);ctx.stroke(); const mLY=distanceLY*frac; ctx.font="9px 'IBM Plex Mono',monospace";ctx.fillStyle="rgba(0,180,255,0.25)";ctx.textAlign="center";ctx.fillText(mLY<1?fmtDelay(mLY):mLY.toFixed(1)+" ly",mx,MY+22); });
      }

      // EARTH
      const magG=ctx.createRadialGradient(EX,MY,20,EX,MY,110); magG.addColorStop(0,"rgba(0,80,200,0.12)"); magG.addColorStop(1,"rgba(0,0,0,0)"); ctx.fillStyle=magG; ctx.beginPath(); ctx.arc(EX,MY,110,0,Math.PI*2); ctx.fill();
      const eGrd=ctx.createRadialGradient(EX-10,MY-10,2,EX,MY,28); eGrd.addColorStop(0,"rgba(140,215,255,0.95)"); eGrd.addColorStop(0.25,"#1a6fbb"); eGrd.addColorStop(0.6,"#0d47a1"); eGrd.addColorStop(1,"rgba(0,6,40,0.95)"); ctx.fillStyle=eGrd; ctx.beginPath(); ctx.arc(EX,MY,28,0,Math.PI*2); ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.arc(EX,MY,28,0,Math.PI*2); ctx.clip(); ctx.fillStyle="rgba(55,168,75,0.75)"; [[EX-12,MY-10,10,7,0.3],[EX+8,MY+7,12,8,0.2],[EX-5,MY+12,8,5,0.4],[EX+14,MY-8,6,4,0.1]].forEach(v=>{ctx.beginPath();ctx.ellipse(v[0],v[1],v[2],v[3],v[4],0,Math.PI*2);ctx.fill();}); ctx.restore();
      const atmA=0.18+0.05*Math.sin(t*0.8); const atmG=ctx.createRadialGradient(EX,MY,24,EX,MY,40); atmG.addColorStop(0,"rgba(100,180,255,0)"); atmG.addColorStop(0.7,`rgba(100,180,255,${atmA})`); atmG.addColorStop(1,"rgba(60,120,255,0)"); ctx.fillStyle=atmG; ctx.beginPath(); ctx.arc(EX,MY,40,0,Math.PI*2); ctx.fill();
      const moonA=t*0.5; const moonX=EX+Math.cos(moonA)*44; const moonY=MY+Math.sin(moonA)*18; ctx.beginPath(); ctx.arc(moonX,moonY,3.5,0,Math.PI*2); ctx.fillStyle="rgba(200,210,220,0.7)"; ctx.fill();
      ctx.font="bold 13px 'IBM Plex Mono',monospace"; ctx.fillStyle="#4fc3f7"; ctx.textAlign="center"; ctx.fillText("EARTH",EX,MY+50);
      ctx.font="10px 'IBM Plex Mono',monospace"; ctx.fillStyle="rgba(0,200,255,0.45)"; ctx.fillText("Observer",EX,MY+63);

      // Arrival effect
      if(p>0.95){ const fl=(p-0.95)/0.05; ctx.beginPath(); ctx.arc(EX,MY,28+fl*60,0,Math.PI*2); ctx.strokeStyle=`rgba(0,255,180,${(1-fl)*0.8})`; ctx.lineWidth=3; ctx.stroke(); ctx.beginPath(); ctx.arc(EX,MY,28+fl*100,0,Math.PI*2); ctx.strokeStyle=`rgba(0,255,180,${(1-fl)*0.3})`; ctx.lineWidth=2; ctx.stroke(); }
      if(p>=1){ ctx.font="bold 14px 'IBM Plex Mono',monospace"; ctx.fillStyle="rgba(0,245,110,0.95)"; ctx.textAlign="center"; ctx.fillText("✓  SIGNAL WAVEFRONT REACHED EARTH",EX,MY-52); ctx.font="11px 'IBM Plex Mono',monospace"; ctx.fillStyle="rgba(0,200,255,0.7)"; ctx.fillText("Delay: "+fmtDelay(distanceLY),EX,MY-38); }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => { animating=false; cancelAnimationFrame(raf); };
  }, [target, prog]);
}

function DeepSpaceCanvas({ prog, target }) {
  const canvasRef = useRef(null);
  useDeepSpaceCanvas(canvasRef, prog, target);
  return <canvas ref={canvasRef} width={900} height={240} style={{width:"100%",height:240,display:"block"}}/>;
}

// ── STARFIELD ─────────────────────────────────────────────────────────────────
// ── STARFIELD ────────────────────────────────────────────────────────────────
function StarField() {
  const ref=useRef();
  useEffect(()=>{
    const c=ref.current,ctx=c.getContext("2d");let W,H,stars,raf;
    function init(){W=c.width=window.innerWidth;H=c.height=window.innerHeight;stars=Array.from({length:280},()=>({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.4+0.2,a:Math.random()*0.6+0.2,sp:Math.random()*0.25+0.04,ph:Math.random()*Math.PI*2}));}
    init();let t=0;
    function draw(){ctx.clearRect(0,0,W,H);stars.forEach(s=>{const a=s.a*(0.5+0.5*Math.sin(t*s.sp+s.ph));ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fillStyle="rgba(180,220,255,"+a+")";ctx.fill();});t+=0.01;raf=requestAnimationFrame(draw);}
    draw();window.addEventListener("resize",init);
    return()=>{cancelAnimationFrame(raf);window.removeEventListener("resize",init);};
  },[]);
  return <canvas ref={ref} style={{position:"fixed",inset:0,width:"100%",height:"100%",zIndex:0,pointerEvents:"none"}}/>;
}

// ── RSCL SEAL ────────────────────────────────────────────────────────────────
function RSCLSeal({size=200}) {
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
            .rr1{animation:rsclspin1 20s linear infinite}.rr2{animation:rsclspin2 30s linear infinite}
            .rpc{animation:rsclpulse 2.6s ease-in-out infinite}.rbm{animation:rsclbeam 1.8s ease-in-out infinite;stroke-dasharray:6 4}
            .rtw1{animation:rscltw 2.1s ease-in-out infinite}.rtw2{animation:rscltw 3.3s ease-in-out infinite 0.6s}
            .rtw3{animation:rscltw 1.9s ease-in-out infinite 1.2s}.rtw4{animation:rscltw 2.8s ease-in-out infinite 0.4s}
            .rtw5{animation:rscltw 3.6s ease-in-out infinite 1.8s}
          `}</style>
          <radialGradient id="sv" cx="50%" cy="50%" r="52%"><stop offset="0%" stopColor="#040d1e"/><stop offset="70%" stopColor="#010812"/><stop offset="100%" stopColor="#000408"/></radialGradient>
          <radialGradient id="sn1" cx="38%" cy="42%" r="55%"><stop offset="0%" stopColor="#0a1a4a" stopOpacity="0.9"/><stop offset="100%" stopColor="#0a1a4a" stopOpacity="0"/></radialGradient>
          <radialGradient id="sn2" cx="65%" cy="60%" r="48%"><stop offset="0%" stopColor="#0d0a30" stopOpacity="0.7"/><stop offset="100%" stopColor="#0d0a30" stopOpacity="0"/></radialGradient>
          <radialGradient id="ssg" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#ffffff"/><stop offset="25%" stopColor="#ffe680"/><stop offset="65%" stopColor="#ff9a20" stopOpacity="0.35"/><stop offset="100%" stopColor="#ff6000" stopOpacity="0"/></radialGradient>
          <radialGradient id="seg" cx="36%" cy="33%" r="65%"><stop offset="0%" stopColor="#4ab8ff"/><stop offset="35%" stopColor="#1560b0"/><stop offset="72%" stopColor="#0b3870"/><stop offset="100%" stopColor="#041428"/></radialGradient>
          <radialGradient id="sat" cx="50%" cy="50%" r="50%"><stop offset="74%" stopColor="#4fc3f7" stopOpacity="0"/><stop offset="100%" stopColor="#4fc3f7" stopOpacity="0.38"/></radialGradient>
          <radialGradient id="scg" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#00eeff" stopOpacity="0.2"/><stop offset="100%" stopColor="#00eeff" stopOpacity="0"/></radialGradient>
          <clipPath id="sec"><circle cx="430" cy="230" r="40"/></clipPath>
          <clipPath id="ssc"><circle cx="340" cy="240" r="228"/></clipPath>
          <filter id="sfg"><feGaussianBlur stdDeviation="3.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        <circle cx="340" cy="240" r="240" fill="#020915" stroke="#00c8ff" strokeWidth="2.8" strokeOpacity="0.55"/>
        <circle cx="340" cy="240" r="237" fill="none" stroke="#00c8ff" strokeWidth="0.6" strokeOpacity="0.18"/>
        <g stroke="#00c8ff" strokeWidth="1.8" strokeOpacity="0.6">
          <line x1="340" y1="2" x2="340" y2="20"/><line x1="340" y1="460" x2="340" y2="478"/>
          <line x1="100" y1="240" x2="118" y2="240"/><line x1="562" y1="240" x2="580" y2="240"/>
          <line x1="170" y1="70" x2="182" y2="90"/><line x1="498" y1="390" x2="510" y2="410"/>
          <line x1="510" y1="70" x2="498" y2="90"/><line x1="182" y1="390" x2="170" y2="410"/>
        </g>
        <polygon points="340,3 346,12 340,21 334,12" fill="#00c8ff" opacity="0.95"/>
        <polygon points="340,459 346,468 340,477 334,468" fill="#00c8ff" opacity="0.95"/>
        <polygon points="100,240 109,234 118,240 109,246" fill="#00c8ff" opacity="0.95"/>
        <polygon points="562,240 571,234 580,240 571,246" fill="#00c8ff" opacity="0.95"/>
        <g clipPath="url(#ssc)">
          <circle cx="340" cy="240" r="228" fill="url(#sv)"/>
          <circle cx="295" cy="200" r="130" fill="url(#sn1)"/>
          <circle cx="410" cy="275" r="105" fill="url(#sn2)"/>
          {[["rtw1",248,148,1.6],["rtw2",285,128,1.1],["rtw3",432,138,1.7],["rtw4",462,172,1.0],["rtw5",232,228,1.3],["rtw1",464,268,1.4],["rtw2",262,298,1.0],["rtw3",445,315,1.2],["rtw4",298,332,1.0],["rtw5",376,142,1.5],["rtw1",210,268,1.2],["rtw3",325,352,1.3],["rtw5",215,190,1.4]].map(([cls,x,y,r],i)=>(
            <circle key={i} className={cls} cx={x} cy={y} r={r} fill="#c8e8ff" opacity="0.7"/>
          ))}
        </g>
        <g className="rr1">
          <circle cx="340" cy="240" r="215" fill="none" stroke="#00c8ff" strokeWidth="1" strokeOpacity="0.18" strokeDasharray="2 7"/>
          <circle cx="340" cy="240" r="206" fill="none" stroke="#00c8ff" strokeWidth="0.6" strokeOpacity="0.12" strokeDasharray="1 9"/>
          <g stroke="#00c8ff" strokeOpacity="0.55">
            <line x1="340" y1="27" x2="340" y2="42" strokeWidth="2.2"/>
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
          <line x1="238" y1="212" x2="238" y2="200" strokeWidth="2"/><line x1="238" y1="244" x2="238" y2="256" strokeWidth="2"/>
          <line x1="222" y1="228" x2="210" y2="228" strokeWidth="2"/><line x1="254" y1="228" x2="266" y2="228" strokeWidth="2"/>
          <line x1="227" y1="217" x2="219" y2="209" strokeWidth="1.4"/><line x1="249" y1="239" x2="257" y2="247" strokeWidth="1.4"/>
          <line x1="249" y1="217" x2="257" y2="209" strokeWidth="1.4"/><line x1="227" y1="239" x2="219" y2="247" strokeWidth="1.4"/>
        </g>
        <text x="238" y="276" textAnchor="middle" fontFamily="'Orbitron',monospace" fontSize="11" fill="#ffd060" letterSpacing="2" opacity="0.9">SOURCE</text>
        <line x1="256" y1="228" x2="388" y2="230" className="rbm" stroke="#00eeff" strokeWidth="2.2" strokeLinecap="round"/>
        <circle cx="322" cy="229" r="5.5" fill="#ffffff" opacity="0.95" filter="url(#sfg)"/>
        <circle cx="322" cy="229" r="11" fill="#00eeff" opacity="0.22"/>
        <text x="322" y="214" textAnchor="middle" fontFamily="'Orbitron',monospace" fontSize="9" fill="#00c8ff" letterSpacing="2" opacity="0.6">d / c = t</text>
        <circle cx="430" cy="230" r="42" fill="url(#seg)"/>
        <g clipPath="url(#sec)" opacity="0.85">
          <ellipse cx="417" cy="218" rx="12" ry="7.5" fill="#2d8a48" transform="rotate(-20,417,218)"/>
          <ellipse cx="436" cy="235" rx="14" ry="6.5" fill="#2d8a48" transform="rotate(15,436,235)"/>
          <ellipse cx="413" cy="242" rx="8" ry="5" fill="#2d8a48" transform="rotate(-5,413,242)"/>
          <ellipse cx="445" cy="218" rx="7" ry="4" fill="#2d8a48" transform="rotate(25,445,218)"/>
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

// ── PLANET EXPLORER — all catalog planets, interactive, open by default ────────
function PlanetExplorer() {
  const [sel, setSel]             = useState(null);
  const [age, setAge]             = useState(25);
  const [lifespan, setLifespan]   = useState(80);
  const [exType, setExType]       = useState("All");
  const [exHz, setExHz]           = useState(false);

  const border="rgba(0,180,255,0.22)",dim="#6a8aaa",textCol="#c8dff0",accent="#00c8ff",ok="#00e87a",warn="#f5c842",danger="#ff5f5f";
  const allTypes=["All",...Array.from(new Set(TARGETS.map(t=>t.type))).sort()];
  const filtered=TARGETS.filter(t=>(exHz?t.hz:true)&&(exType==="All"||t.type===exType));

  function stOf(distLY) {
    const actual=age+distLY, ds=distLY*SPY;
    if(ds<3600) return{label:"Near real-time",bg:"rgba(0,200,255,0.12)",col:"#00c8ff"};
    if(actual<lifespan) return{label:"Likely alive",bg:"rgba(0,232,122,0.12)",col:ok};
    if(actual<lifespan+20) return{label:"Borderline",bg:"rgba(245,200,66,0.12)",col:warn};
    return{label:"Long dead",bg:"rgba(255,95,95,0.12)",col:danger};
  }

  const MT=({label,value,color})=>(
    <div style={{background:"rgba(0,0,0,0.3)",borderRadius:8,padding:"12px 14px",border:"1px solid "+border}}>
      <div style={{fontSize:11,color:dim,textTransform:"uppercase",letterSpacing:1.5,marginBottom:4}}>{label}</div>
      <div style={{fontSize:17,fontWeight:700,color:color||textCol,fontFamily:"'IBM Plex Mono',monospace"}}>{value}</div>
    </div>
  );

  const selT = sel!==null ? filtered[sel] : null;

  return (
    <div>
      {/* controls row */}
      <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap",alignItems:"center",padding:"12px 16px",background:"rgba(0,0,0,0.3)",borderRadius:10,border:"1px solid "+border}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{fontSize:12,color:dim,textTransform:"uppercase",letterSpacing:1,whiteSpace:"nowrap"}}>Age at event</div>
          <input type="number" value={age} onChange={e=>setAge(parseFloat(e.target.value)||0)} min="0" max="150" step="1"
            style={{width:68,background:"rgba(0,12,34,0.9)",border:"1px solid "+border,borderRadius:6,padding:"6px 10px",color:textCol,fontSize:15,fontFamily:"monospace",outline:"none"}}/>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{fontSize:12,color:dim,textTransform:"uppercase",letterSpacing:1,whiteSpace:"nowrap"}}>Lifespan</div>
          <input type="number" value={lifespan} onChange={e=>setLifespan(parseFloat(e.target.value)||80)} min="1" max="200" step="1"
            style={{width:68,background:"rgba(0,12,34,0.9)",border:"1px solid "+border,borderRadius:6,padding:"6px 10px",color:textCol,fontSize:15,fontFamily:"monospace",outline:"none"}}/>
        </div>
        <select value={exType} onChange={e=>setExType(e.target.value)}
          style={{background:"rgba(0,12,34,0.9)",border:"1px solid "+border,borderRadius:6,padding:"6px 10px",color:textCol,fontSize:13,fontFamily:"monospace",outline:"none",cursor:"pointer"}}>
          {allTypes.map(t=><option key={t}>{t}</option>)}
        </select>
        <button onClick={()=>setExHz(h=>!h)}
          style={{padding:"6px 12px",borderRadius:6,border:"1px solid "+(exHz?"rgba(0,232,122,0.6)":border),background:exHz?"rgba(0,232,122,0.12)":"transparent",color:exHz?ok:dim,fontSize:13,cursor:"pointer",fontFamily:"monospace"}}>
          🌱 HZ only
        </button>
        <div style={{fontSize:12,color:dim,marginLeft:"auto"}}>{filtered.length} planets</div>
      </div>

      {/* planet grid — all matching planets */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(158px,1fr))",gap:8,marginBottom:sel!==null?14:0,maxHeight:460,overflowY:"auto",paddingRight:4}}>
        {filtered.map((t,i)=>{
          const distLY=t.distance_pc*PC_TO_LY;
          const actual=age+distLY;
          const st=stOf(distLY);
          const pct=Math.min((age/Math.max(actual,0.0001))*100,100);
          return(
            <div key={i} onClick={()=>setSel(sel===i?null:i)}
              style={{padding:"11px 13px",borderRadius:10,border:sel===i?"2px solid "+accent:"1px solid "+border,background:sel===i?"rgba(0,200,255,0.08)":"rgba(0,5,20,0.8)",cursor:"pointer",transition:"all 0.15s"}}>
              <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:5}}>
                <div style={{width:9,height:9,borderRadius:"50%",background:t.color,boxShadow:"0 0 5px "+t.color,flexShrink:0}}/>
                <div style={{fontSize:12,fontWeight:700,color:sel===i?accent:textCol,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.planet}</div>
              </div>
              <div style={{fontSize:11,color:dim,marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.system}</div>
              <div style={{fontSize:11,color:sel===i?accent:dim,marginBottom:7}}>{fmtDelay(distLY)}</div>
              <div style={{height:4,borderRadius:2,background:"rgba(0,180,255,0.15)",overflow:"hidden",marginBottom:5}}>
                <div style={{height:"100%",width:pct.toFixed(1)+"%",background:st.col,borderRadius:2}}/>
              </div>
              <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:5}}>
                <span style={{fontSize:10,padding:"1px 5px",borderRadius:3,background:"rgba(0,180,255,0.1)",color:dim}}>{t.type}</span>
                {t.hz&&<span style={{fontSize:10,padding:"1px 5px",borderRadius:3,background:"rgba(0,232,122,0.1)",color:ok}}>HZ</span>}
              </div>
              <span style={{fontSize:10,padding:"2px 7px",borderRadius:99,fontWeight:600,background:st.bg,color:st.col}}>{st.label}</span>
            </div>
          );
        })}
      </div>

      {/* detail panel */}
      {selT&&(()=>{
        const distLY=selT.distance_pc*PC_TO_LY;
        const actual=age+distLY;
        const st=stOf(distLY);
        const pct=Math.min((age/Math.max(actual,0.0001))*100+2,100);
        return(
          <div style={{border:"1px solid "+border,borderRadius:12,padding:"20px 22px",background:"rgba(0,5,20,0.95)"}}>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:8}}>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
                  <div style={{width:12,height:12,borderRadius:"50%",background:selT.color,boxShadow:"0 0 8px "+selT.color}}/>
                  <div style={{fontSize:17,fontWeight:700,color:selT.color,fontFamily:"'Orbitron',sans-serif"}}>{selT.planet}</div>
                </div>
                <div style={{fontSize:13,color:dim}}>{selT.system} · {selT.type}{selT.hz?" · Habitable Zone":""}</div>
                {selT.disc_year&&!isNaN(selT.disc_year)&&<div style={{fontSize:12,color:dim,marginTop:2}}>Discovered {selT.disc_year}</div>}
              </div>
              <span style={{fontSize:12,padding:"5px 14px",borderRadius:99,fontWeight:700,background:st.bg,color:st.col}}>{st.label}</span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:10,marginBottom:16}}>
              <MT label="Distance"     value={fmtDelay(distLY)}                                      color={textCol}/>
              <MT label="Earth sees"   value={"age "+age}                                            color={accent}/>
              <MT label="Actual age"   value={distLY<0.001?"~"+age+" yrs":actual.toFixed(1)+" yrs"} color={st.col}/>
              <MT label="Hidden delay" value={distLY<0.001?"< 1 hr":distLY.toFixed(2)+" yrs"}      color={accent}/>
              <MT label="Round-trip"   value={distLY<0.001?"< 2 hrs":(distLY*2).toFixed(1)+" yrs"} color={dim}/>
              <MT label="Signal"       value={Math.round(signalQuality(distLY)*100)+"%"}             color={signalLabel(signalQuality(distLY)).col}/>
            </div>
            <div style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:dim,marginBottom:5}}>
                <span>Age at event — {age} yrs</span>
                <span>Actual age received — {distLY<0.001?"~"+age:actual.toFixed(1)} yrs</span>
              </div>
              <div style={{height:8,borderRadius:4,background:"rgba(0,180,255,0.15)",overflow:"hidden",marginBottom:4}}>
                <div style={{height:"100%",width:pct.toFixed(1)+"%",background:st.col,borderRadius:4,transition:"width 0.3s"}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:dim}}><span>emitted</span><span>Earth receives</span></div>
            </div>
            <div style={{padding:"12px 16px",background:"rgba(0,200,255,0.05)",borderLeft:"3px solid "+accent,fontSize:14,color:dim,lineHeight:1.8}}>
              {selT.notes}
            </div>
          </div>
        );
      })()}
    </div>
  );
}


// ── SCIENTIFIC ASSUMPTIONS ────────────────────────────────────────────────────
function ScientificAssumptions(){
  const [open,setOpen]=useState({});const [allOpen,setAllOpen]=useState(false);
  const tog=id=>setOpen(p=>({...p,[id]:!p[id]}));
  const togAll=()=>{const n=!allOpen;setAllOpen(n);const s={};assumptions.forEach((_,i)=>{s[i]=n;});setOpen(s);};
  const ts=k=>{if(k==="valid")return{background:"rgba(0,232,122,0.12)",color:"#00e87a",border:"1px solid rgba(0,232,122,0.3)"};if(k==="limit")return{background:"rgba(245,200,66,0.12)",color:"#f5c842",border:"1px solid rgba(245,200,66,0.3)"};if(k==="future")return{background:"rgba(147,112,219,0.12)",color:"#b39ddb",border:"1px solid rgba(147,112,219,0.3)"};return{};};
  const border="rgba(0,180,255,0.22)",dim="#6a8aaa",textCol="#c8dff0";
  const assumptions=[
    {section:"I — Geometry & Propagation",id:"A1",color:"#0C447C",bg:"rgba(0,120,255,0.12)",title:"Rectilinear photon propagation in flat spacetime",sub:"Light travels in a straight line at exactly c",tags:[{t:"Valid in this model",k:"valid"}],body:"Light is modeled as a point signal at the invariant speed of light in vacuum:",formula:"c = 299,792,458 m/s  =  1 ly/yr",detail:"No gravitational lensing or refraction modeled. Valid for stellar distances where spacetime curvature is negligible."},
    {id:"A2",color:"#0C447C",bg:"rgba(0,120,255,0.12)",title:"Light-travel time equals distance divided by c",sub:"t_travel [yr] = d [ly] in natural units",tags:[{t:"Valid in this model",k:"valid"}],body:"The fundamental relation driving all temporal calculations:",formula:"t_travel = d / c   ⟹   t_travel [yr] = d [ly]",detail:"This identity holds exactly in natural units and underlies every age-delay computation in Step 5."},
    {id:"A3",color:"#0C447C",bg:"rgba(0,120,255,0.12)",title:"Point-source signal model",sub:"Every pixel shares a single travel time",tags:[{t:"Valid in this model",k:"valid"}],body:"All photons in the frame are assigned identical delay:",formula:"Δt_pixel = 0   (all pixels co-emitted)",detail:"Differential delays across a planet-sized source at stellar distances are sub-nanosecond — negligible at human timescales."},
    {id:"A4",color:"#0C447C",bg:"rgba(0,120,255,0.12)",title:"Static source-observer distance",sub:"Catalog parallax distance treated as fixed",tags:[{t:"Valid in this model",k:"valid"},{t:"Limitation for fast movers",k:"limit"}],body:"In reality proper motion changes d over time:",formula:"d(t) = d₀ + v_r · t   ⟹   t_travel = ∫ dd / c",detail:"For Proxima Centauri (v_r ≈ −22 km/s), distance changes ~0.02 ly per century — negligible for human timescales."},
    {section:"II — Temporal & Relativistic",id:"A5",color:"#f5c842",bg:"rgba(245,200,66,0.10)",title:"No special relativistic time dilation",sub:"Lorentz factor γ = 1 assumed throughout",tags:[{t:"Limitation",k:"limit"},{t:"Future: add v/c slider",k:"future"}],body:"Special relativity predicts dilated proper time for moving sources:",formula:"t_proper = t_coord · √(1 − v²/c²)",detail:"For exoplanets at typical stellar velocities (v ≲ 10⁻⁴c), dilation is ~10⁻⁸ — negligible for educational purposes."},
    {id:"A6",color:"#f5c842",bg:"rgba(245,200,66,0.10)",title:"No gravitational time dilation",sub:"GR corrections to clock rates are omitted",tags:[{t:"Limitation",k:"limit"}],body:"Clocks run slower deeper in a gravitational potential well (Schwarzschild):",formula:"t_surface = t_∞ · √(1 − 2GM / rc²)",detail:"~10⁻⁹ per year for Earth-mass planets. Significant only near neutron stars or black holes."},
    {id:"A7",color:"#f5c842",bg:"rgba(245,200,66,0.10)",title:"No cosmological redshift or expansion",sub:"Hubble flow not modeled — all targets within Milky Way",tags:[{t:"Limitation for extragalactic use",k:"limit"}],body:"At cosmological distances space expansion stretches photon wavelengths:",formula:"z = (λ_obs − λ_emit) / λ_emit",detail:"All catalog targets at d ≲ 750 ly. Hubble flow contributes < 1 part in 10⁶. Flat-space model is exact here."},
    {section:"III — Spectral & Kinematic",id:"A8",color:"#b39ddb",bg:"rgba(147,112,219,0.10)",title:"Doppler shift not modeled",sub:"Source radial velocity does not alter received frequency",tags:[{t:"Future work",k:"future"}],body:"A moving source shifts the received frequency:",formula:"f_obs = f_emit · √((1 + β)/(1 − β))   β = v_r / c",detail:"Proxima blueshift ~0.007% at β ≈ 7×10⁻⁵ — imperceptible visually, detectable spectroscopically."},
    {id:"A9",color:"#b39ddb",bg:"rgba(147,112,219,0.10)",title:"Stellar aberration not modeled",sub:"Earth's orbital velocity does not shift apparent source position",tags:[{t:"Future work",k:"future"}],body:"Earth's orbital motion displaces apparent light direction by:",formula:"tan(θ_aber) = v_⊕ sin(θ) / (c + v_⊕ cos(θ))   ≈ 20.5″ max",detail:"Bradley (1729) used this 20.5 arcsecond shift to first measure the speed of light."},
    {id:"A10",color:"#b39ddb",bg:"rgba(147,112,219,0.10)",title:"Interstellar medium dispersion not modeled",sub:"ISM treated as perfect vacuum",tags:[{t:"Future work",k:"future"}],body:"ISM electron column density delays lower-frequency photons:",formula:"Δt_DM = 4.15 ms · DM · (f_low⁻² − f_high⁻²)   [pc/cm³, GHz]",detail:"Utterly negligible for optical photons. Critical for radio pulsar timing and fast radio bursts."},
  ];
  let seen={};
  return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{[["Valid in this model","valid"],["Limitation","limit"],["Future work","future"]].map(([t,k])=>(<span key={k} style={{fontSize:11,padding:"3px 10px",borderRadius:4,fontWeight:600,letterSpacing:1,...ts(k)}}>{t}</span>))}</div>
        <button onClick={togAll} style={{fontSize:13,color:"#00c8ff",background:"none",border:"1px solid rgba(0,200,255,0.3)",borderRadius:6,cursor:"pointer",padding:"4px 14px"}}>{allOpen?"Collapse all":"Expand all"}</button>
      </div>
      {assumptions.map((a,i)=>(
        <div key={i}>
          {a.section&&!seen[a.section]&&(seen[a.section]=true)&&(<div style={{fontSize:11,fontWeight:600,letterSpacing:"2.5px",textTransform:"uppercase",color:dim,margin:"18px 0 8px"}}>{a.section}</div>)}
          <div style={{border:"1px solid "+border,borderRadius:12,overflow:"hidden",marginBottom:8,background:"rgba(4,18,38,0.96)"}}>
            <div onClick={()=>tog(i)} style={{display:"flex",alignItems:"flex-start",gap:14,padding:"14px 18px",cursor:"pointer",background:open[i]?"rgba(0,180,255,0.06)":"transparent"}}>
              <div style={{width:32,height:32,borderRadius:"50%",background:a.bg,border:"1px solid "+a.color+"55",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:a.color,flexShrink:0,marginTop:2,fontFamily:"monospace"}}>{a.id}</div>
              <div style={{flex:1}}><div style={{fontSize:15,fontWeight:600,color:textCol,marginBottom:3}}>{a.title}</div><div style={{fontSize:13,color:dim}}>{a.sub}</div></div>
              <div style={{color:dim,fontSize:14,marginTop:6,flexShrink:0,transition:"transform 0.2s",transform:open[i]?"rotate(180deg)":"none"}}>▾</div>
            </div>
            {open[i]&&(
              <div style={{padding:"14px 18px 16px 64px",borderTop:"1px solid "+border,fontSize:14,color:dim,lineHeight:1.8}}>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>{a.tags.map((tag,ti)=>(<span key={ti} style={{fontSize:11,padding:"2px 10px",borderRadius:4,fontWeight:600,...ts(tag.k)}}>{tag.t}</span>))}</div>
                <p style={{marginBottom:10}}>{a.body}</p>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:13,background:"rgba(0,0,0,0.3)",border:"1px solid "+border,borderRadius:6,padding:"10px 14px",marginBottom:10,color:"#a8d8ea"}}>{a.formula}</div>
                <p>{a.detail}</p>
              </div>
            )}
          </div>
        </div>
      ))}
      <div style={{marginTop:16,padding:"14px 18px",borderRadius:10,border:"1px solid "+border,background:"rgba(0,200,255,0.04)",fontSize:13,color:dim,lineHeight:1.8}}>
        <strong style={{color:textCol}}>Validity domain: </strong>Physically exact for optical observation of stellar targets at d ≲ 750 ly with source velocities v ≪ c. All approximation errors below 1 part in 10⁴.
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [tIdx,setTIdx]=useState(0);
  const [manualMode,setManualMode]=useState(false);
  const [mGal,setMGal]=useState("Milky Way");
  const [mSys,setMSys]=useState("Solar System");
  const [mPla,setMPla]=useState("Mars");
  const [mDist,setMDist]=useState("12.5");
  const [mUnit,setMUnit]=useState("light-minutes");
  const [ageEv,setAgeEv]=useState("25");
  const [lspan,setLspan]=useState("80");
  const [autoTime,setAutoTime]=useState(true);
  const [evD,setEvD]=useState("2026-01-01");
  const [evT,setEvT]=useState("00:00");
  const [obsD,setObsD]=useState(new Date().toISOString().slice(0,10));
  const [obsT,setObsT]=useState(new Date().toISOString().slice(11,16));
  const [clipV,setClipV]=useState("30");
  const [clipU,setClipU]=useState("seconds");
  const [mediaURL,setMediaURL]=useState(null);
  const [mediaType,setMediaType]=useState(null);
  const [mediaName,setMediaName]=useState("");
  const [videoDur,setVideoDur]=useState(0);
  const [typeFilter,setTypeFilter]=useState("All");
  const [hzFilter,setHzFilter]=useState(false);
  const fileRef=useRef();
  const videoSrcRef=useRef();
  const [prog,setProg]=useState(0);
  const [playing,setPlaying]=useState(false);
  const [spd,setSpd]=useState(1);
  const playR=useRef(false),spdR=useRef(1),progR=useRef(0),rafR=useRef(),lastT=useRef(null);

  useEffect(()=>{spdR.current=spd;},[spd]);
  useEffect(()=>{progR.current=prog;},[prog]);
  useEffect(()=>{
    if(!playing){playR.current=false;cancelAnimationFrame(rafR.current);lastT.current=null;return;}
    playR.current=true;
    const tick=now=>{
      if(!playR.current)return;
      if(lastT.current===null)lastT.current=now;
      const dt=(now-lastT.current)/1000;lastT.current=now;
      const next=Math.min(progR.current+dt*spdR.current*0.032,1);
      progR.current=next;setProg(next);
      if(next>=1){playR.current=false;setPlaying(false);return;}
      rafR.current=requestAnimationFrame(tick);
    };
    rafR.current=requestAnimationFrame(tick);
    return()=>{playR.current=false;cancelAnimationFrame(rafR.current);};
  },[playing]);

  // filtered planet list
  const allTypes=["All",...Array.from(new Set(TARGETS.map(t=>t.type))).sort()];
  const filtered=TARGETS.filter(t=>{
    if(hzFilter&&!t.hz)return false;
    if(typeFilter!=="All"&&t.type!==typeFilter)return false;
    return true;
  });
  const safeIdx=Math.min(tIdx,filtered.length-1);
  const target=manualMode
    ?{system:mSys,planet:mPla,color:"#80cbc4",type:"Manual",hz:false,notes:"User-supplied distance.",disc_year:NaN,_distanceLY:toDistanceLY(parseFloat(mDist)||0,mUnit)}
    :(filtered[safeIdx]||TARGETS[0]);

  const distanceLY=target._distanceLY!=null?target._distanceLY:target.distance_pc*PC_TO_LY;
  const delaySec=lyToSec(distanceLY);
  const delayYears=delaySec/SPY;

  // canvas rendered by DeepSpaceCanvas component

  const obsDT=new Date(obsD+"T"+(obsT||"00:00")+":00Z");
  const evDT=autoTime?addSec(obsDT,-delaySec):new Date(evD+"T"+(evT||"00:00")+":00Z");
  const arrStart=addSec(evDT,delaySec);
  const clipSec=videoDur>0?videoDur:(parseFloat(clipV)||0)*({seconds:1,minutes:60,hours:3600,days:86400,years:SPY}[clipU]||1);
  const age0=parseFloat(ageEv)||0;
  const ls=parseFloat(lspan)||80;
  const simProg=Math.max(0,Math.min(1,prog));
  const simTravelSec=delaySec*simProg;
  const simDT=addSec(evDT,simTravelSec);
  const arrivedOnEarth=simProg>=1;
  const apparentAge=arrivedOnEarth?age0:NaN;
  const actualNow=age0+secToYr(simTravelSec);
  const ageWhenSeen=age0+delayYears;
  const hiddenByDelayNow=actualNow-age0;
  const aliveWhenSeen=ageWhenSeen<ls;
  // Local planetary year calculations
  const orbPeriod = (target.orbital_period_days && !isNaN(target.orbital_period_days)) ? target.orbital_period_days : 365.25;
  const localYearsTravelTime = earthYearsToLocalYears(delayYears, orbPeriod);
  const localYearsActualNow  = earthYearsToLocalYears(actualNow, orbPeriod);
  const localYearsHidden     = earthYearsToLocalYears(hiddenByDelayNow, orbPeriod);

  const aliveNow=actualNow<ls;
  let recS="not_emitted";
  if(simProg>0&&simProg<1)recS="traveling";
  if(arrivedOnEarth)recS="arrived";

  const handleMedia=useCallback(file=>{
    if(!file)return;
    if(mediaURL)URL.revokeObjectURL(mediaURL);
    const url=URL.createObjectURL(file);
    setMediaURL(url);setMediaName(file.name);
    const isVid=file.type.startsWith("video");
    setMediaType(isVid?"video":"image");setVideoDur(0);
    if(isVid){const tmp=document.createElement("video");tmp.src=url;tmp.onloadedmetadata=()=>{setVideoDur(tmp.duration);setClipV(Math.round(tmp.duration).toString());setClipU("seconds");};}
  },[mediaURL]);

  const handlePP=()=>{if(prog>=1){setProg(0);progR.current=0;}setPlaying(p=>!p);lastT.current=null;};
  const handleProg=v=>{setProg(v);progR.current=v;};

  const accent="#00c8ff",panel="rgba(4,18,38,0.96)",border="rgba(0,180,255,0.22)",dim="#6a8aaa",bright="#e8f4ff",textCol="#c8dff0",ok="#00e87a",danger="#ff5f5f",warn="#f5c842";
  const inp={background:"rgba(0,12,34,0.9)",border:"1px solid "+border,borderRadius:8,padding:"12px 16px",color:textCol,fontSize:17,fontFamily:"'IBM Plex Mono',monospace",outline:"none",width:"100%"};
  const sel={...inp,appearance:"none",cursor:"pointer"};

  const StepLabel=({n,text})=>(<div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}><div style={{width:32,height:32,borderRadius:"50%",background:"rgba(0,200,255,0.15)",border:"2px solid "+accent,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"monospace",fontSize:15,fontWeight:700,color:accent,flexShrink:0}}>{n}</div><div style={{fontFamily:"'Orbitron',sans-serif",fontSize:13,color:accent,letterSpacing:3,textTransform:"uppercase",fontWeight:700}}>{text}</div></div>);
  const InfoCard=({label,value,color,sub})=>(<div style={{background:"rgba(0,200,255,0.06)",border:"1px solid "+border,borderRadius:10,padding:"14px 18px"}}><div style={{fontSize:12,color:dim,textTransform:"uppercase",letterSpacing:1.5,marginBottom:6}}>{label}</div><div style={{fontSize:22,fontWeight:700,color:color||accent,fontFamily:"'IBM Plex Mono',monospace",lineHeight:1.2}}>{value}</div>{sub&&<div style={{fontSize:13,color:dim,marginTop:6,lineHeight:1.5}}>{sub}</div>}</div>);

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
          <div style={{display:"flex",justifyContent:"center",marginBottom:20}}><RSCLSeal size={260}/></div>
          <div style={{fontSize:13,letterSpacing:5,color:dim,textTransform:"uppercase",marginBottom:10}}>Reconfigurable Space Computing Lab · Cal Poly Pomona</div>
          <h1 style={{fontSize:"clamp(32px,6vw,56px)",fontWeight:900,color:"#fff",textShadow:"0 0 60px "+accent+"55",lineHeight:1.0,marginBottom:6}}>EARTH LOOKBACK</h1>
          <h2 style={{fontSize:"clamp(15px,3vw,24px)",fontWeight:600,color:accent,letterSpacing:12,marginBottom:16}}>SIMULATOR</h2>
          <p style={{color:dim,fontSize:17,lineHeight:1.8,maxWidth:540,margin:"0 auto"}}>Choose a real exoplanet from our Milky Way catalog, upload a photo or video, and watch your signal travel across the cosmos to Earth.</p>
        </div>

        {/* STEP 1 */}
        <div className="step">
          <StepLabel n="1" text="Choose Your World"/>
          <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
            <button onClick={()=>setManualMode(false)} style={{padding:"9px 18px",borderRadius:8,border:"none",background:!manualMode?accent:"rgba(0,180,255,0.09)",color:!manualMode?"#000":dim,fontFamily:"monospace",fontSize:14,fontWeight:700,cursor:"pointer"}}>Catalog ({TARGETS.length} planets)</button>
            <button onClick={()=>setManualMode(true)}  style={{padding:"9px 18px",borderRadius:8,border:"none",background:manualMode?accent:"rgba(0,180,255,0.09)",color:manualMode?"#000":dim,fontFamily:"monospace",fontSize:14,fontWeight:700,cursor:"pointer"}}>Manual Entry</button>
          </div>

          {!manualMode&&(
            <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
              <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} style={{...sel,width:"auto",padding:"8px 14px",fontSize:14}}>
                {allTypes.map(t=><option key={t}>{t}</option>)}
              </select>
              <button onClick={()=>setHzFilter(h=>!h)} style={{padding:"8px 14px",borderRadius:8,border:"1px solid "+(hzFilter?"rgba(0,232,122,0.6)":border),background:hzFilter?"rgba(0,232,122,0.12)":"transparent",color:hzFilter?ok:dim,fontSize:13,cursor:"pointer",fontFamily:"monospace"}}>
                🌱 Habitable Zone Only
              </button>
              <div style={{fontSize:13,color:dim,marginLeft:"auto"}}>{filtered.length} planets</div>
            </div>
          )}

          {!manualMode?(
            <>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))",gap:8,marginBottom:14,maxHeight:380,overflowY:"auto",paddingRight:4}}>
                {filtered.map((t,i)=>(
                  <button key={i} onClick={()=>{setTIdx(i);setProg(0);setPlaying(false);progR.current=0;}}
                    style={{padding:"10px 12px",borderRadius:10,border:"2px solid "+(safeIdx===i?t.color:"rgba(0,180,255,0.15)"),background:safeIdx===i?"rgba(0,200,255,0.1)":"rgba(0,10,30,0.6)",cursor:"pointer",textAlign:"left",transition:"all 0.15s"}}>
                    <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:4}}>
                      <div style={{width:9,height:9,borderRadius:"50%",background:t.color,boxShadow:"0 0 5px "+t.color,flexShrink:0}}/>
                      <span style={{fontSize:12,fontWeight:700,color:safeIdx===i?t.color:bright,fontFamily:"monospace",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.planet}</span>
                    </div>
                    <div style={{fontSize:11,color:dim,marginBottom:2}}>{t.system}</div>
                    <div style={{fontSize:11,color:safeIdx===i?accent:dim}}>{fmtDelay(t.distance_pc*PC_TO_LY)}</div>
                    <div style={{display:"flex",gap:4,marginTop:5,flexWrap:"wrap"}}>
                      <span style={{fontSize:10,padding:"1px 6px",borderRadius:3,background:"rgba(0,180,255,0.1)",color:dim}}>{t.type}</span>
                      {t.hz&&<span style={{fontSize:10,padding:"1px 6px",borderRadius:3,background:"rgba(0,232,122,0.12)",color:ok}}>HZ</span>}
                      {t.notes&&t.notes.startsWith("⚠")&&<span style={{fontSize:10,padding:"1px 6px",borderRadius:3,background:"rgba(245,200,66,0.12)",color:warn}}>⚠</span>}
                    </div>
                  </button>
                ))}
              </div>
              <div style={{padding:"12px 16px",background:"rgba(0,200,255,0.05)",border:"1px solid "+border,borderRadius:10,fontSize:14,color:dim,lineHeight:1.7}}>
                <span style={{color:bright,fontWeight:700}}>{target.planet}</span> · {target.system} · <span style={{color:accent}}>{fmtDelay(distanceLY)} away</span>
                {target.type&&<span> · <span style={{color:dim}}>{target.type}</span></span>}
                {target.hz&&<span> · <span style={{color:ok}}>Habitable Zone</span></span>}
                {target.disc_year&&!isNaN(target.disc_year)&&<span> · Discovered {target.disc_year}</span>}
                <br/>{target.notes&&target.notes.replace("⚠ ","").replace("⚠","").trim()}
              </div>
            </>
          ):(
            <div className="g2">
              {[["Galaxy","Milky Way",()=>{},"readonly"],["System / Star",mSys,setMSys,""],["Planet / Target",mPla,setMPla,""]].map(([l,v,s,ro])=>(
                <div key={l}>
                  <div style={{fontSize:13,color:dim,marginBottom:6,letterSpacing:1,textTransform:"uppercase"}}>{l}</div>
                  <input value={v} onChange={e=>s&&s(e.target.value)} readOnly={ro==="readonly"} style={{...inp,opacity:ro?"0.5":1}}/>
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
            {mediaURL?(<div><div style={{fontSize:28,marginBottom:6}}>{mediaType==="video"?"🎬":"🖼️"}</div><div style={{fontSize:16,color:ok,fontWeight:600,marginBottom:4}}>✓  {mediaName}</div><div style={{fontSize:14,color:dim}}>{mediaType==="video"&&videoDur>0?"Duration: "+videoDur.toFixed(1)+"s — ":""}Click to change</div></div>)
            :(<div><div style={{fontSize:36,marginBottom:8}}>📷</div><div style={{fontSize:17,color:bright,fontWeight:600,marginBottom:6}}>Upload your image or video (optional)</div><div style={{fontSize:15,color:dim}}>This is what you're sending from {target.planet} — watch it arrive piece by piece on Earth</div></div>)}
          </div>
          <input ref={fileRef} type="file" accept="image/*,video/mp4,video/webm,video/ogg" style={{display:"none"}} onChange={e=>handleMedia(e.target.files[0])}/>
          <div className="g2" style={{marginBottom:14}}>
            <div><div style={{fontSize:13,color:dim,marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>Person's age at this event</div><input type="number" value={ageEv} onChange={e=>setAgeEv(e.target.value)} min="0" step="1" style={inp}/></div>
            <div><div style={{fontSize:13,color:dim,marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>Expected lifespan (years)</div><input type="number" value={lspan} onChange={e=>setLspan(e.target.value)} min="1" step="1" style={inp}/></div>
          </div>
          <div style={{display:"flex",gap:8,marginBottom:14}}>
            <button onClick={()=>setAutoTime(true)}  style={{flex:1,padding:"10px",borderRadius:8,border:"none",background:autoTime?accent:"rgba(0,180,255,0.09)",color:autoTime?"#000":dim,fontSize:15,fontWeight:700,cursor:"pointer"}}>Auto timing</button>
            <button onClick={()=>setAutoTime(false)} style={{flex:1,padding:"10px",borderRadius:8,border:"none",background:!autoTime?accent:"rgba(0,180,255,0.09)",color:!autoTime?"#000":dim,fontSize:15,fontWeight:700,cursor:"pointer"}}>Set event date</button>
          </div>
          {autoTime?(<div style={{padding:"12px 16px",background:"rgba(0,232,122,0.07)",border:"1px solid rgba(0,232,122,0.25)",borderRadius:8,fontSize:15,color:ok}}>✓ Auto mode — event is set so the signal arrives at Earth right now ({fmtDT(obsDT)})</div>)
          :(<div className="g2"><div><div style={{fontSize:13,color:dim,marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>Event date at {target.planet}</div><input type="date" value={evD} onChange={e=>setEvD(e.target.value)}/></div><div><div style={{fontSize:13,color:dim,marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>Event time (UTC)</div><input type="time" value={evT} onChange={e=>setEvT(e.target.value)}/></div></div>)}
          {mediaType!=="video"&&(<div className="g2" style={{marginTop:14}}>
            <div><div style={{fontSize:13,color:dim,marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>Earth observation date</div><input type="date" value={obsD} onChange={e=>setObsD(e.target.value)}/></div>
            <div><div style={{fontSize:13,color:dim,marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>Earth observation time (UTC)</div><input type="time" value={obsT} onChange={e=>setObsT(e.target.value)}/></div>
          </div>)}
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
          <DeepSpaceCanvas prog={prog} target={target}/>
          <div style={{padding:"18px 24px",background:"rgba(0,6,22,0.95)",borderTop:"1px solid "+border}}>
            <div style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                <span style={{fontSize:14,color:dim}}>Emitted from {target.planet}</span>
                <span style={{fontSize:16,color:accent,fontWeight:700}}>{(prog*100).toFixed(1)}%  ·  {fmtDelay(distanceLY*Math.max(prog,0.00001))} of {fmtDelay(distanceLY)}</span>
                <span style={{fontSize:14,color:dim}}>Received on Earth</span>
              </div>
              <input type="range" min={0} max={1} step={0.0005} value={prog} onChange={e=>handleProg(parseFloat(e.target.value))}/>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:5}}>{["0%","25%","50%","75%","100%"].map(l=><span key={l} style={{fontSize:12,color:"rgba(0,180,255,0.3)"}}>{l}</span>)}</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
              <button onClick={()=>handleProg(0)} style={{padding:"9px 18px",background:"rgba(0,180,255,0.08)",border:"1px solid "+border,borderRadius:8,color:dim,fontSize:15,cursor:"pointer"}}>⏮ Reset</button>
              <button onClick={handlePP} style={{padding:"10px 30px",background:playing?"rgba(0,232,122,0.15)":"rgba(0,200,255,0.15)",border:"2px solid "+(playing?"rgba(0,232,122,0.5)":accent),borderRadius:8,color:playing?ok:accent,fontFamily:"monospace",fontSize:17,letterSpacing:2,fontWeight:800,cursor:"pointer"}}>{playing?"⏸  PAUSE":"▶  PLAY"}</button>
              <button onClick={()=>handleProg(1)} style={{padding:"9px 18px",background:"rgba(0,180,255,0.08)",border:"1px solid "+border,borderRadius:8,color:dim,fontSize:15,cursor:"pointer"}}>⏭ Arrive</button>
              <div style={{display:"flex",alignItems:"center",gap:8,marginLeft:"auto"}}>
                <span style={{fontSize:14,color:dim}}>Speed:</span>
                {[0.5,1,2,5,10].map(s=>(<button key={s} onClick={()=>setSpd(s)} style={{padding:"7px 12px",borderRadius:7,fontSize:14,cursor:"pointer",border:"1px solid "+(spd===s?accent:border),background:spd===s?"rgba(0,200,255,0.2)":"rgba(0,180,255,0.05)",color:spd===s?accent:dim}}>{s}×</button>))}
              </div>
            </div>
            <div style={{marginTop:14,padding:"12px 18px",borderRadius:8,fontSize:15,fontFamily:"monospace",background:prog>=1?"rgba(0,232,122,0.07)":prog>0?"rgba(0,200,255,0.05)":"rgba(0,0,0,0.25)",border:"1px solid "+(prog>=1?"rgba(0,232,122,0.3)":prog>0?border:"rgba(255,255,255,0.04)"),color:prog>=1?ok:prog>0?textCol:dim}}>
              {prog===0&&"⚡  Ready — press PLAY to emit the signal from "+target.planet}
              {prog>0&&prog<1&&"🔵  Signal wavefront traveling… "+fmtDelay(distanceLY*prog)+" covered · "+fmtDelay(distanceLY*(1-prog))+" remaining"}
              {prog>=1&&"✅  Wavefront reached Earth — signal reconstructing piece by piece below"}
            </div>
          </div>
        </div>

        {/* STEP 4 */}
        <div className="step">
          <StepLabel n="4" text="What Earth Sees"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <div>
              <div style={{fontSize:14,color:dim,marginBottom:10,textAlign:"center",textTransform:"uppercase",letterSpacing:1.5}}>📡  Original signal — sent from {target.planet}</div>
              {mediaURL?(
                mediaType==="image"
                  ?<img src={mediaURL} alt="Original signal" style={{width:"100%",borderRadius:10,border:"2px solid "+border,display:"block",maxHeight:360,objectFit:"contain",background:"#000"}}/>
                  :<video src={mediaURL} controls style={{width:"100%",borderRadius:10,border:"2px solid "+border,display:"block"}}/>
              ):(
                <div style={{borderRadius:10,border:"2px dashed "+border,padding:"40px 20px",textAlign:"center",color:dim,fontSize:15}}>Upload a photo or video in Step 2 to see it here</div>
              )}
              <div style={{marginTop:10,padding:"10px 14px",background:"rgba(0,200,255,0.05)",borderRadius:8,fontSize:14,color:dim,textAlign:"center"}}>
                Age at event: <strong style={{color:accent}}>{fmtAge(age0)}</strong>{" · "}Year: <strong style={{color:accent}}>{evDT.getFullYear()}</strong>
              </div>
            </div>
            <div>
              <div style={{fontSize:14,color:dim,marginBottom:10,textAlign:"center",textTransform:"uppercase",letterSpacing:1.5}}>
                🌍  Earth reconstructs — {fmtDelay(distanceLY)} later
              </div>
              {!arrivedOnEarth?(
                <div style={{borderRadius:10,border:"2px dashed rgba(245,200,66,0.3)",padding:"30px 20px",textAlign:"center",background:"rgba(0,0,0,0.6)",minHeight:200,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12}}>
                  <div style={{fontSize:40}}>📡</div>
                  <div style={{fontSize:17,color:warn,fontWeight:700}}>{prog===0?"Signal not yet emitted":"Wavefront in transit…"}</div>
                  <div style={{fontSize:15,color:dim,lineHeight:1.7}}>{prog===0?"Press PLAY above to emit the signal":(prog*100).toFixed(1)+"% of the way · "+fmtDelay(distanceLY*(1-prog))+" remaining"}</div>
                  {prog>0&&<div style={{width:"80%",height:8,borderRadius:4,background:"rgba(0,180,255,0.15)",overflow:"hidden",marginTop:4}}><div style={{height:"100%",width:(prog*100)+"%",background:"linear-gradient(90deg,rgba(0,200,255,0.5),"+accent+")",borderRadius:4,transition:"width 0.1s"}}/></div>}
                </div>
              ):(
                mediaURL?(
                  <ReceivedImage mediaURL={mediaURL} mediaType={mediaType} distanceLY={distanceLY} arrived={arrivedOnEarth}/>
                ):(
                  <div style={{borderRadius:10,border:"2px solid rgba(0,232,122,0.5)",padding:"40px 20px",textAlign:"center",background:"rgba(0,232,122,0.05)",color:ok,fontSize:16,minHeight:200,display:"flex",alignItems:"center",justifyContent:"center",textAlign:"center"}}>
                    ✓ Wavefront arrived! Upload a photo or video in Step 2 to watch it reconstruct piece by piece from black.
                  </div>
                )
              )}
              {arrivedOnEarth&&(
                <div style={{marginTop:10,padding:"10px 14px",background:"rgba(0,232,122,0.06)",borderRadius:8,fontSize:14,color:ok,textAlign:"center",fontWeight:600,lineHeight:1.7}}>
                  ✓ Earth receives in <strong>{arrStart.getFullYear()}</strong>{" · "}Emitted <strong>{evDT.getFullYear()}</strong>{" · "}Travel: <strong>{delayYears.toFixed(3)} years</strong>{distanceLY>400&&" · Ancient signal"}
                </div>
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
          <div style={{fontSize:11,color:dim,textTransform:"uppercase",letterSpacing:2,margin:"4px 0 10px",paddingTop:8,borderTop:"1px solid rgba(0,180,255,0.1)"}}>
            🪐 Local Planetary Time on {target.planet} — 1 local year = {target.orbital_period_days < 1 ? (target.orbital_period_days*24).toFixed(1)+" Earth hours" : (target.orbital_period_days||365.25).toFixed(2)+" Earth days"}{target.tidally_locked?" · Tidally locked":""}
          </div>
          <div className="g3" style={{marginBottom:16}}>
            <InfoCard label="Transit (local years)" value={fmtLocalYears(localYearsTravelTime, orbPeriod)} color={"#f5c842"} sub={"How many "+target.planet+" years the signal traveled"}/>
            <InfoCard label="Hidden age (local yrs)" value={fmtLocalYears(localYearsHidden, orbPeriod)} color={"#ce93d8"} sub={"Local years the delay conceals"}/>
            <InfoCard label="Actual age (local yrs)" value={fmtLocalYears(localYearsActualNow, orbPeriod)} color={aliveNow?ok:danger} sub={"Person's age in "+target.planet+" local years"}/>
          </div>
          <div className="g3" style={{marginBottom:16}}>
            <InfoCard label="Actual target age at first Earth reception" value={fmtAge(ageWhenSeen)} color={aliveWhenSeen?ok:danger} sub={aliveWhenSeen?"Still alive when Earth first receives the signal.":"Already beyond lifespan when Earth first receives the signal."}/>
            <InfoCard label="Photon simulation time" value={fmtDT(simDT)} color={bright} sub="Live time controlled by PLAY and the slider."/>
            <InfoCard label="Reception state" value={recS==="not_emitted"?"Not emitted":recS==="traveling"?"Traveling":"Arrived"} color={recS==="arrived"?ok:recS==="traveling"?accent:dim} sub={recS==="arrived"?"Earth can finally observe the signal.":recS==="traveling"?"Photon wavefront still crossing space.":"Press PLAY to emit the signal."}/>
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
            {recS==="traveling"&&<span>The photon wavefront has traveled <strong style={{color:accent}}>{fmtDelay(distanceLY*simProg)}</strong>. During that time, the real person has aged to <strong style={{color:aliveNow?ok:danger}}>{fmtAge(actualNow)}</strong> (<strong style={{color:"#f5c842"}}>{fmtLocalYears(localYearsActualNow,orbPeriod)}</strong> on {target.planet}), but Earth still sees <strong style={{color:warn}}>nothing</strong>.</span>}
            {recS==="arrived"&&<span>Earth is reconstructing the signal piece by piece. It sees the person at <strong style={{color:accent}}>{fmtAge(apparentAge)}</strong>, while the real person is <strong style={{color:aliveNow?ok:danger}}>{fmtAge(actualNow)}</strong> (<strong style={{color:"#f5c842"}}>{fmtLocalYears(localYearsActualNow,orbPeriod)}</strong> local years on {target.planet}). The delay hides <strong style={{color:accent}}>{fmtAge(hiddenByDelayNow)}</strong> ({fmtLocalYears(localYearsHidden,orbPeriod)} local years) of aging.</span>}
          </div>
        </div>



        {/* SCIENTIFIC ASSUMPTIONS */}
        <details style={{background:panel,border:"1px solid "+border,borderRadius:14,padding:"16px 22px",marginBottom:14}}>
          <summary style={{fontFamily:"'Orbitron',sans-serif",fontSize:13,color:accent,letterSpacing:2}}>🔬  SCIENTIFIC ASSUMPTIONS & MODEL LIMITATIONS</summary>
          <div style={{marginTop:16}}><ScientificAssumptions/></div>
        </details>

        {/* FOOTER */}
        <div style={{textAlign:"center",marginTop:50}}>
          <div style={{fontSize:13,color:"rgba(0,200,255,0.55)",marginBottom:10,lineHeight:1.8}}>
            Designed by <strong style={{color:"rgba(255,255,255,0.9)"}}>Dr. Mohamed El-Hadedy</strong>, Director of the <strong style={{color:"rgba(0,200,255,0.9)"}}>Reconfigurable Space Computing Lab (RSCL)</strong>, California State Polytechnic University, Pomona.
          </div>
          <div style={{textAlign:"center",fontSize:13,color:"rgba(0,180,255,0.2)",letterSpacing:2}}>
            RSCL@CPP · EARTH LOOKBACK SIMULATOR · distance / c = travel time · 1 pc = 3.26156 ly
          </div>
        </div>
      </div>
    </>
  );
}
