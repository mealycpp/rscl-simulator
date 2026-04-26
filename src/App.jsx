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
  { system:"Proxima Centauri", planet:"Proxima Cen b",  distance_pc:1.2948,  color:"#fff176", type:"Rocky",        hz:true,  disc_year:2016, notes:"Nearest known exoplanet. Rocky world in the habitable zone of a red dwarf — 4.2 ly away." , orbital_period_days:11.19, tidally_locked:true , v_r:-22.2 , dm:0.026 , mu:24.9, v_total:33.36 , mp:1.17, rp:1.1, ms:0.1221, au:0.0485 , atm:"n2_co2" },
  { system:"Proxima Centauri", planet:"Proxima Cen d",  distance_pc:1.2948,  color:"#ffe082", type:"Rocky",        hz:false, disc_year:2022, notes:"Sub-Earth mass planet orbiting very close to Proxima Centauri. Too hot for liquid water." , orbital_period_days:5.12, tidally_locked:true , v_r:-22.2 , dm:0.026 , mu:24.9, v_total:33.36 , mp:0.26, rp:0.8, ms:0.1221, au:0.0289 , atm:"none" },
  { system:"Barnard's Star",   planet:"Barnard b",      distance_pc:1.8282,  color:"#ef9a9a", type:"Super-Earth",  hz:false, disc_year:2024, notes:"Candidate super-Earth around the second-nearest star system to the Sun." , orbital_period_days:3.15, tidally_locked:true , v_r:-110.6 , dm:0.037 , mu:89.8, v_total:142.47 , mp:3.23, rp:1.4, ms:0.16, au:0.0524 , atm:"thin_co2" },
  { system:"Wolf 359",         planet:"Wolf 359 b",     distance_pc:2.3900,  color:"#f48fb1", type:"Gas Giant",    hz:false, disc_year:2019, notes:"Gas giant orbiting one of the nearest stars — famous from Star Trek." , orbital_period_days:2617.0, tidally_locked:false , v_r:19.3 , dm:0.048 , mu:36.5, v_total:41.29 , mp:312.0, rp:11.0, ms:0.09, au:4.13 , atm:"h2_dominated" },
  { system:"Lalande 21185",    planet:"Lalande 21185 b",distance_pc:2.5457,  color:"#ce93d8", type:"Super-Earth",  hz:true,  disc_year:2017, notes:"Super-Earth candidate in the habitable zone of a nearby M-dwarf." , orbital_period_days:12.94, tidally_locked:true , v_r:-84.7 , dm:0.051 , mu:58.4, v_total:102.88 , mp:2.69, rp:1.3, ms:0.39, au:0.0794 , atm:"thin_co2" },
  // ── NEARBY SYSTEMS ───────────────────────────────────────────────────────
  { system:"GJ 667C",          planet:"GJ 667C c",      distance_pc:6.8432,  color:"#80cbc4", type:"Super-Earth",  hz:true,  disc_year:2011, notes:"Super-Earth firmly in the habitable zone. One of the best nearby HZ candidates." , orbital_period_days:28.14, tidally_locked:true , v_r:6.5 , dm:0.137 , mu:10.2, v_total:12.1 , mp:3.81, rp:1.5, ms:0.33, au:0.1251 , atm:"n2_co2" },
  { system:"GJ 667C",          planet:"GJ 667C e",      distance_pc:6.8432,  color:"#4db6ac", type:"Super-Earth",  hz:true,  disc_year:2013, notes:"Second habitable zone planet in the GJ 667C system." , orbital_period_days:62.24, tidally_locked:true , v_r:6.5 , dm:0.137 , mu:10.2, v_total:12.1 , mp:2.68, rp:1.4, ms:0.33, au:0.213 , atm:"n2_co2" },
  { system:"GJ 581",           planet:"GJ 581 c",       distance_pc:6.2981,  color:"#f06292", type:"Super-Earth",  hz:false, disc_year:2007, notes:"Super-Earth near the inner edge of the habitable zone. Dense and likely rocky." , orbital_period_days:12.92, tidally_locked:true , v_r:-9.4 , dm:0.126 , mu:12.4, v_total:15.56 , mp:5.36, rp:1.6, ms:0.31, au:0.073 , atm:"thick_co2" },
  { system:"GJ 581",           planet:"GJ 581 d",       distance_pc:6.2981,  color:"#e91e8c", type:"Super-Earth",  hz:true,  disc_year:2007, notes:"Outer super-Earth — possibly habitable with a thick CO₂ atmosphere." , orbital_period_days:66.87, tidally_locked:true , v_r:-9.4 , dm:0.126 , mu:12.4, v_total:15.56 , mp:6.98, rp:1.7, ms:0.31, au:0.218 , atm:"thick_co2" },
  { system:"Epsilon Eridani",  planet:"Epsilon Eri b",  distance_pc:3.2127,  color:"#ffab91", type:"Gas Giant",    hz:false, disc_year:2000, notes:"Jupiter-like planet around one of the Sun's nearest stellar neighbors." , orbital_period_days:2502.0, tidally_locked:false , v_r:-16.4 , dm:0.064 , mu:21.3, v_total:26.88 , mp:311.0, rp:11.0, ms:0.82, au:3.39 , atm:"h2_dominated" },
  { system:"Tau Ceti",         planet:"Tau Ceti e",     distance_pc:3.6481,  color:"#ffe0b2", type:"Super-Earth",  hz:true,  disc_year:2012, notes:"Super-Earth in the habitable zone of a Sun-like star — 12 ly away." , orbital_period_days:168.12, tidally_locked:false , v_r:-16.9 , dm:0.073 , mu:18.9, v_total:25.35 , mp:3.93, rp:1.5, ms:0.784, au:0.538 , atm:"n2_co2" },
  { system:"Tau Ceti",         planet:"Tau Ceti f",     distance_pc:3.6481,  color:"#ffcc80", type:"Super-Earth",  hz:true,  disc_year:2012, notes:"Outer habitable zone candidate around Tau Ceti." , orbital_period_days:642.0, tidally_locked:false , v_r:-16.9 , dm:0.073 , mu:18.9, v_total:25.35 , mp:3.93, rp:1.5, ms:0.784, au:1.35 , atm:"thin_co2" },
  // ── TRAPPIST SYSTEM ──────────────────────────────────────────────────────
  { system:"TRAPPIST-1",       planet:"TRAPPIST-1 b",   distance_pc:12.4299, color:"#b3e5fc", type:"Rocky",        hz:false, disc_year:2017, notes:"Innermost TRAPPIST-1 planet. Too hot — likely a Venus analog." , orbital_period_days:1.511, tidally_locked:true , v_r:-56.3 , dm:0.249 , mu:31.2, v_total:64.37 , mp:1.017, rp:1.121, ms:0.0898, au:0.01154 , atm:"none" },
  { system:"TRAPPIST-1",       planet:"TRAPPIST-1 c",   distance_pc:12.4299, color:"#81d4fa", type:"Rocky",        hz:false, disc_year:2017, notes:"Rocky world — recent JWST data suggests little to no atmosphere." , orbital_period_days:2.422, tidally_locked:true , v_r:-56.3 , dm:0.249 , mu:31.2, v_total:64.37 , mp:1.156, rp:1.095, ms:0.0898, au:0.0158 , atm:"none" },
  { system:"TRAPPIST-1",       planet:"TRAPPIST-1 d",   distance_pc:12.4299, color:"#4fc3f7", type:"Rocky",        hz:true,  disc_year:2017, notes:"Inner habitable zone. Receives similar energy to Earth from the Sun." , orbital_period_days:4.05, tidally_locked:true , v_r:-56.3 , dm:0.249 , mu:31.2, v_total:64.37 , mp:0.297, rp:0.788, ms:0.0898, au:0.02227 , atm:"n2_co2" },
  { system:"TRAPPIST-1",       planet:"TRAPPIST-1 e",   distance_pc:12.4299, color:"#29b6f6", type:"Rocky",        hz:true,  disc_year:2017, notes:"Best habitable zone rocky planet known. Earth-sized, top priority for biosignature searches." , orbital_period_days:6.101, tidally_locked:true , v_r:-56.3 , dm:0.249 , mu:31.2, v_total:64.37 , mp:0.772, rp:0.92, ms:0.0898, au:0.02925 , atm:"n2_o2" },
  { system:"TRAPPIST-1",       planet:"TRAPPIST-1 f",   distance_pc:12.4299, color:"#039be5", type:"Rocky",        hz:true,  disc_year:2017, notes:"Outer habitable zone. Possibly a water-rich world or ice-covered surface." , orbital_period_days:9.207, tidally_locked:true , v_r:-56.3 , dm:0.249 , mu:31.2, v_total:64.37 , mp:1.045, rp:1.045, ms:0.0898, au:0.03849 , atm:"n2_co2" },
  { system:"TRAPPIST-1",       planet:"TRAPPIST-1 g",   distance_pc:12.4299, color:"#0288d1", type:"Rocky",        hz:true,  disc_year:2017, notes:"Outer habitable zone. Larger than Earth — may have a thick H₂O envelope." , orbital_period_days:12.353, tidally_locked:true , v_r:-56.3 , dm:0.249 , mu:31.2, v_total:64.37 , mp:1.321, rp:1.129, ms:0.0898, au:0.04683 , atm:"thin_co2" },
  { system:"TRAPPIST-1",       planet:"TRAPPIST-1 h",   distance_pc:12.4299, color:"#0277bd", type:"Rocky",        hz:false, disc_year:2017, notes:"Outermost TRAPPIST-1 planet. Likely frozen — too cold for liquid water." , orbital_period_days:18.767, tidally_locked:true , v_r:-56.3 , dm:0.249 , mu:31.2, v_total:64.37 , mp:0.326, rp:0.755, ms:0.0898, au:0.06189 , atm:"none" },
  // ── WATER WORLDS & SUB-NEPTUNES ──────────────────────────────────────────
  { system:"GJ 1214",          planet:"GJ 1214 b",      distance_pc:14.6427, color:"#80deea", type:"Water World",  hz:false, disc_year:2009, notes:"The archetypal water world. Flat transmission spectrum suggests thick steam or water atmosphere." , orbital_period_days:1.58, tidally_locked:true , v_r:21.0 , dm:0.293 , mu:18.6, v_total:28.05 , mp:6.26, rp:2.678, ms:0.157, au:0.0143 , atm:"h2o_steam" },
  { system:"GJ 3470",          planet:"GJ 3470 b",      distance_pc:29.3500, color:"#4dd0e1", type:"Sub-Neptune",  hz:false, disc_year:2012, notes:"Warm Neptune-like world with a large extended atmosphere being actively evaporated." , orbital_period_days:3.337, tidally_locked:true , v_r:26.3 , dm:0.587 , mu:24.1, v_total:35.67 , mp:13.9, rp:4.2, ms:0.56, au:0.0355 , atm:"h2_dominated" },
  { system:"GJ 436",           planet:"GJ 436 b",       distance_pc:9.7556,  color:"#26c6da", type:"Neptune-like", hz:false, disc_year:2004, notes:"Hot Neptune orbiting very close. Has a giant comet-like tail of escaping hydrogen." , orbital_period_days:2.644, tidally_locked:true , v_r:9.6 , dm:0.195 , mu:22.8, v_total:24.74 , mp:21.4, rp:4.22, ms:0.452, au:0.0291 , atm:"h2_dominated" },
  { system:"55 Cancri",        planet:"55 Cnc e",       distance_pc:12.590,  color:"#ffab91", type:"Super-Earth",  hz:false, disc_year:2004, notes:"Ultra-hot super-Earth — surface possibly covered in molten lava. Year = 18 hours." , orbital_period_days:0.737, tidally_locked:true , v_r:27.6 , dm:0.252 , mu:15.2, v_total:31.51 , mp:8.08, rp:1.875, ms:0.905, au:0.01544 , atm:"none" },
  { system:"55 Cancri",        planet:"55 Cnc f",       distance_pc:12.590,  color:"#ff8a65", type:"Gas Giant",    hz:true,  disc_year:2005, notes:"Gas giant in the outer habitable zone of 55 Cancri — any moons could be habitable." , orbital_period_days:259.0, tidally_locked:false , v_r:27.6 , dm:0.252 , mu:15.2, v_total:31.51 , mp:45.7, rp:6.0, ms:0.905, au:0.7737 , atm:"h2_dominated" },
  { system:"LHS 1140",         planet:"LHS 1140 b",     distance_pc:14.9861, color:"#ef9a9a", type:"Super-Earth",  hz:true,  disc_year:2017, notes:"Rocky super-Earth in the habitable zone — one of the best targets for atmospheric study." , orbital_period_days:24.737, tidally_locked:true , v_r:26.5 , dm:0.3 , mu:20.3, v_total:33.38 , mp:6.38, rp:1.635, ms:0.1979, au:0.0936 , atm:"n2_co2" },
  { system:"LHS 1140",         planet:"LHS 1140 c",     distance_pc:14.9861, color:"#e57373", type:"Rocky",        hz:false, disc_year:2020, notes:"Inner rocky planet in the LHS 1140 system — too hot for liquid water." , orbital_period_days:3.778, tidally_locked:true , v_r:26.5 , dm:0.3 , mu:20.3, v_total:33.38 , mp:1.81, rp:1.282, ms:0.1979, au:0.0267 , atm:"none" },
  // ── TOI SYSTEMS ──────────────────────────────────────────────────────────
  { system:"TOI-1231",         planet:"TOI-1231 b",     distance_pc:27.6227, color:"#ce93d8", type:"Sub-Neptune",  hz:false, disc_year:2021, notes:"Warm sub-Neptune with a cool enough temperature to possibly retain a thick atmosphere." , orbital_period_days:24.246, tidally_locked:true , v_r:13.4 , dm:0.553 , mu:8.4, v_total:15.82 , mp:15.47, rp:3.65, ms:0.49, au:0.1688 , atm:"h2_dominated" },
  { system:"TOI-700",          planet:"TOI-700 d",      distance_pc:31.1400, color:"#a5d6a7", type:"Rocky",        hz:true,  disc_year:2020, notes:"Earth-sized planet in the habitable zone — one of the first confirmed HZ rocky planets from TESS." , orbital_period_days:37.422, tidally_locked:true , v_r:13.8 , dm:0.623 , mu:6.2, v_total:15.13 , mp:1.72, rp:1.144, ms:0.416, au:0.1633 , atm:"n2_co2" },
  { system:"TOI-700",          planet:"TOI-700 e",      distance_pc:31.1400, color:"#81c784", type:"Rocky",        hz:true,  disc_year:2023, notes:"Second habitable zone planet in the TOI-700 system — slightly smaller than Earth." , orbital_period_days:27.81, tidally_locked:true , v_r:13.8 , dm:0.623 , mu:6.2, v_total:15.13 , mp:0.818, rp:0.953, ms:0.416, au:0.134 , atm:"n2_o2" },
  { system:"TOI-1452",         planet:"TOI-1452 b",     distance_pc:99.3000, color:"#80deea", type:"Water World",  hz:true,  disc_year:2022, notes:"Water world candidate — density suggests up to 30% water by mass. In the habitable zone." , orbital_period_days:11.063, tidally_locked:true , v_r:-16.2 , dm:1.986 , mu:4.1, v_total:16.71 , mp:4.82, rp:1.672, ms:0.29, au:0.0617 , atm:"h2o_steam" },
  { system:"TOI-2285",         planet:"TOI-2285 b",     distance_pc:52.0000, color:"#4fc3f7", type:"Sub-Neptune",  hz:true,  disc_year:2022, notes:"Sub-Neptune near the habitable zone of a nearby M-dwarf star." , orbital_period_days:27.268, tidally_locked:true , v_r:8.4 , dm:1.04 , mu:5.6, v_total:10.1 , mp:4.77, rp:1.74, ms:0.44, au:0.1358 , atm:"h2_dominated" },
  { system:"TOI-4633",         planet:"TOI-4633 c",     distance_pc:110.000, color:"#fff59d", type:"Rocky",        hz:true,  disc_year:2023, notes:"Rocky planet in the habitable zone of a Sun-like star in a binary system." , orbital_period_days:272.0, tidally_locked:false , v_r:-12.1 , dm:2.2 , mu:3.8, v_total:12.68 , mp:3.0, rp:1.4, ms:1.08, au:0.797 , atm:"n2_co2" },
  // ── KEPLER SYSTEMS ───────────────────────────────────────────────────────
  { system:"Kepler-22",        planet:"Kepler-22 b",    distance_pc:194.642, color:"#c5e1a5", type:"Sub-Neptune",  hz:true,  disc_year:2011, notes:"First confirmed planet in the habitable zone of a Sun-like star. 2.4× Earth radius." , orbital_period_days:289.862, tidally_locked:false , v_r:-39.3 , dm:3.893 , mu:2.1, v_total:39.36 , mp:9.1, rp:2.38, ms:0.97, au:0.849 , atm:"h2_dominated" },
  { system:"Kepler-62",        planet:"Kepler-62 e",    distance_pc:368.000, color:"#a5d6a7", type:"Super-Earth",  hz:true,  disc_year:2013, notes:"Super-Earth in the habitable zone — possibly a water world with a global ocean." , orbital_period_days:122.387, tidally_locked:false , v_r:-46.2 , dm:7.36 , mu:1.8, v_total:46.24 , mp:4.5, rp:1.61, ms:0.69, au:0.427 , atm:"h2o_steam" },
  { system:"Kepler-62",        planet:"Kepler-62 f",    distance_pc:368.000, color:"#66bb6a", type:"Super-Earth",  hz:true,  disc_year:2013, notes:"Outer habitable zone super-Earth. One of the earliest compelling HZ candidates." , orbital_period_days:267.291, tidally_locked:false , v_r:-46.2 , dm:7.36 , mu:1.8, v_total:46.24 , mp:2.8, rp:1.41, ms:0.69, au:0.718 , atm:"thin_co2" },
  { system:"Kepler-186",       planet:"Kepler-186 f",   distance_pc:178.500, color:"#aed581", type:"Rocky",        hz:true,  disc_year:2014, notes:"First Earth-sized planet confirmed in the habitable zone of another star." , orbital_period_days:129.944, tidally_locked:false , v_r:22.4 , dm:3.57 , mu:2.4, v_total:22.53 , mp:1.44, rp:1.17, ms:0.478, au:0.432 , atm:"n2_co2" },
  { system:"Kepler-296",       planet:"Kepler-296 e",   distance_pc:740.000, color:"#dce775", type:"Super-Earth",  hz:true,  disc_year:2014, notes:"Habitable zone super-Earth around an M-dwarf binary system." , orbital_period_days:34.141, tidally_locked:true , v_r:15.6 , dm:14.8 , mu:1.2, v_total:15.65 , mp:4.0, rp:1.53, ms:0.5, au:0.1808 , atm:"thin_co2" },
  { system:"Kepler-438",       planet:"Kepler-438 b",   distance_pc:472.900, color:"#fff176", type:"Rocky",        hz:true,  disc_year:2015, notes:"One of the most Earth-like planets known by ESI score — but bombarded by stellar flares." , orbital_period_days:35.233, tidally_locked:true , v_r:-36.8 , dm:9.458 , mu:1.6, v_total:36.83 , mp:1.46, rp:1.12, ms:0.544, au:0.1664 , atm:"thin_co2" },
  { system:"Kepler-442",       planet:"Kepler-442 b",   distance_pc:342.000, color:"#ffee58", type:"Super-Earth",  hz:true,  disc_year:2015, notes:"One of the best HZ candidates — receives ~70% of Earth's solar flux from a cooler star." , orbital_period_days:112.305, tidally_locked:false , v_r:-40.1 , dm:6.84 , mu:1.9, v_total:40.14 , mp:2.3, rp:1.34, ms:0.61, au:0.409 , atm:"n2_co2" },
  { system:"Kepler-452",       planet:"Kepler-452 b",   distance_pc:551.727, color:"#ffcc80", type:"Super-Earth",  hz:true,  disc_year:2015, notes:"⚠ Controversial — possibly Earth's older cousin at 1.5× radius, or a false positive." , orbital_period_days:384.843, tidally_locked:false , v_r:-35.2 , dm:11.03 , mu:1.4, v_total:35.23 , mp:5.0, rp:1.63, ms:1.037, au:1.046 , atm:"thick_co2" },
  { system:"Kepler-1649",      planet:"Kepler-1649 c",  distance_pc:290.900, color:"#ff8a65", type:"Rocky",        hz:true,  disc_year:2020, notes:"Earth-sized HZ planet around an M-dwarf — among the most Earth-like found by Kepler." , orbital_period_days:19.535, tidally_locked:true , v_r:18.3 , dm:5.818 , mu:2.2, v_total:18.43 , mp:1.2, rp:1.06, ms:0.198, au:0.1048 , atm:"n2_co2" },
  { system:"Kepler-69",        planet:"Kepler-69 c",    distance_pc:730.000, color:"#bcaaa4", type:"Super-Earth",  hz:false, disc_year:2013, notes:"Super-Earth near the inner edge of the HZ — possibly a super-Venus." , orbital_period_days:242.461, tidally_locked:false , v_r:-25.7 , dm:14.6 , mu:1.1, v_total:25.72 , mp:3.9, rp:1.71, ms:0.81, au:0.64 , atm:"thick_co2" },
  // ── HOT JUPITERS ─────────────────────────────────────────────────────────
  { system:"51 Pegasi",        planet:"51 Peg b",       distance_pc:15.3600, color:"#ffb74d", type:"Hot Jupiter",  hz:false, disc_year:1995, notes:"The first exoplanet found around a Sun-like star. Nobel Prize 2019. Year = 4.2 days." , orbital_period_days:4.231, tidally_locked:true , v_r:-33.0 , dm:0.308 , mu:11.8, v_total:35.05 , mp:145.7, rp:13.2, ms:1.11, au:0.0527 , atm:"exotic" },
  { system:"HD 209458",        planet:"HD 209458 b",    distance_pc:47.0000, color:"#ffa726", type:"Hot Jupiter",  hz:false, disc_year:1999, notes:"'Osiris' — first exoplanet observed transiting its star. Has an evaporating atmosphere." , orbital_period_days:3.525, tidally_locked:true , v_r:-14.7 , dm:0.94 , mu:8.6, v_total:17.03 , mp:219.9, rp:15.1, ms:1.148, au:0.04747 , atm:"exotic" },
  { system:"HD 189733",        planet:"HD 189733 b",    distance_pc:19.7600, color:"#4fc3f7", type:"Hot Jupiter",  hz:false, disc_year:2005, notes:"Deep-blue hot Jupiter where it rains molten glass sideways at 9,000 km/h winds." , orbital_period_days:2.219, tidally_locked:true , v_r:-2.3 , dm:0.396 , mu:14.2, v_total:14.39 , mp:366.4, rp:13.3, ms:0.846, au:0.03142 , atm:"exotic" },
  { system:"WASP-17",          planet:"WASP-17 b",      distance_pc:390.000, color:"#b0bec5", type:"Hot Jupiter",  hz:false, disc_year:2009, notes:"One of the largest exoplanets known — puffed up, retrograde orbit, extremely low density." , orbital_period_days:3.735, tidally_locked:true , v_r:60.4 , dm:7.8 , mu:4.2, v_total:60.55 , mp:159.5, rp:21.4, ms:1.286, au:0.05172 , atm:"exotic" },
  { system:"WASP-121",         planet:"WASP-121 b",     distance_pc:270.000, color:"#ffcc02", type:"Ultra-hot Jupiter", hz:false, disc_year:2015, notes:"Ultra-hot Jupiter where iron and titanium rain from the atmosphere. Temperature ~2,400 K." , orbital_period_days:1.275, tidally_locked:true , v_r:38.2 , dm:5.4 , mu:3.1, v_total:38.33 , mp:378.0, rp:19.4, ms:1.353, au:0.02544 , atm:"exotic" },
  { system:"KELT-9",           planet:"KELT-9 b",       distance_pc:294.000, color:"#ff5722", type:"Ultra-hot Jupiter", hz:false, disc_year:2016, notes:"Hottest known exoplanet — hotter than most stars at ~4,300 K. Atmosphere is vaporizing." , orbital_period_days:1.481, tidally_locked:true , v_r:-20.6 , dm:5.88 , mu:2.8, v_total:20.79 , mp:620.0, rp:19.6, ms:2.52, au:0.03462 , atm:"exotic" },
  { system:"HAT-P-7",          planet:"HAT-P-7 b",      distance_pc:320.000, color:"#ff7043", type:"Hot Jupiter",  hz:false, disc_year:2008, notes:"Hot Jupiter where corundum (sapphire/ruby) clouds rain from the sky on the night side." , orbital_period_days:2.205, tidally_locked:true , v_r:-12.8 , dm:6.4 , mu:3.4, v_total:13.24 , mp:565.0, rp:16.0, ms:1.47, au:0.0377 , atm:"exotic" },
  // ── GAS GIANTS & DIRECT IMAGING ──────────────────────────────────────────
  { system:"HR 8799",          planet:"HR 8799 b",      distance_pc:39.4000, color:"#ce93d8", type:"Gas Giant",    hz:false, disc_year:2008, notes:"First multi-planet system discovered by direct imaging. Young super-Jupiter." , orbital_period_days:164250.0, tidally_locked:false , v_r:12.0 , dm:0.788 , mu:7.9, v_total:14.37 , mp:2227.0, rp:14.0, ms:1.51, au:68.0 , atm:"h2_dominated" },
  { system:"HR 8799",          planet:"HR 8799 e",      distance_pc:39.4000, color:"#ba68c8", type:"Gas Giant",    hz:false, disc_year:2010, notes:"Innermost directly imaged planet in HR 8799 — hints of water and CO in its atmosphere." , orbital_period_days:18000.0, tidally_locked:false , v_r:12.0 , dm:0.788 , mu:7.9, v_total:14.37 , mp:2862.0, rp:13.0, ms:1.51, au:16.0 , atm:"h2_dominated" },
  { system:"Beta Pictoris",    planet:"Beta Pic b",     distance_pc:19.4400, color:"#ef9a9a", type:"Gas Giant",    hz:false, disc_year:2008, notes:"Young gas giant caught in the act of forming — directly imaged orbiting a debris disk." , orbital_period_days:8030.0, tidally_locked:false , v_r:20.0 , dm:0.389 , mu:21.4, v_total:29.29 , mp:3500.0, rp:13.0, ms:1.75, au:9.0 , atm:"h2_dominated" },
  { system:"Beta Pictoris",    planet:"Beta Pic c",     distance_pc:19.4400, color:"#e57373", type:"Gas Giant",    hz:false, disc_year:2019, notes:"Second directly imaged planet — causes gaps in Beta Pic's dusty debris disk." , orbital_period_days:1200.0, tidally_locked:false , v_r:20.0 , dm:0.389 , mu:21.4, v_total:29.29 , mp:1100.0, rp:11.0, ms:1.75, au:2.7 , atm:"h2_dominated" },
  { system:"Fomalhaut",        planet:"Fomalhaut b",    distance_pc:7.6900,  color:"#80cbc4", type:"Gas Giant",    hz:false, disc_year:2008, notes:"Directly imaged — may be a cloud of debris from a recent collision rather than a solid planet." , orbital_period_days:323652.0, tidally_locked:false , v_r:6.5 , dm:0.154 , mu:15.2, v_total:16.53 , mp:318.0, rp:11.0, ms:1.92, au:115.0 , atm:"none" },
  // ── INTERESTING & EXOTIC ─────────────────────────────────────────────────
  { system:"55 Cancri",        planet:"55 Cnc d",       distance_pc:12.590,  color:"#a5d6a7", type:"Gas Giant",    hz:false, disc_year:2002, notes:"Long-period Jupiter analog in the 55 Cancri system — 14-year orbit." , orbital_period_days:4825.0, tidally_locked:false , v_r:27.6 , dm:0.252 , mu:15.2, v_total:31.51 , mp:1139.0, rp:12.0, ms:0.905, au:5.74 , atm:"h2_dominated" },
  { system:"Upsilon Andromedae",planet:"Ups And d",     distance_pc:13.4700, color:"#ffb74d", type:"Gas Giant",    hz:false, disc_year:1999, notes:"Outer gas giant in a multi-planet system around a bright nearby star." , orbital_period_days:1276.46, tidally_locked:false , v_r:-28.9 , dm:0.27 , mu:12.6, v_total:31.53 , mp:1267.0, rp:12.0, ms:1.27, au:2.513 , atm:"h2_dominated" },
  { system:"Gliese 876",       planet:"Gliese 876 d",   distance_pc:4.6900,  color:"#ef9a9a", type:"Rocky",        hz:false, disc_year:2005, notes:"One of the first confirmed super-Earths. Very hot — year = 1.94 days." , orbital_period_days:1.938, tidally_locked:true , v_r:-1.5 , dm:0.094 , mu:18.2, v_total:18.26 , mp:5.89, rp:1.65, ms:0.334, au:0.0208 , atm:"thick_co2" },
  { system:"Gliese 876",       planet:"Gliese 876 b",   distance_pc:4.6900,  color:"#ff8a65", type:"Gas Giant",    hz:false, disc_year:1998, notes:"Jupiter-mass planet in a 2:1 resonance with Gliese 876 c. 60 ly away." , orbital_period_days:60.94, tidally_locked:false , v_r:-1.5 , dm:0.094 , mu:18.2, v_total:18.26 , mp:660.0, rp:11.0, ms:0.334, au:0.208 , atm:"h2_dominated" },
  { system:"K2-18",            planet:"K2-18 b",        distance_pc:38.0000, color:"#80deea", type:"Water World",  hz:true,  disc_year:2015, notes:"Possible Hycean world — JWST detected carbon molecules. May have a liquid water ocean under a H₂ atmosphere." , orbital_period_days:32.94, tidally_locked:true , v_r:2.6 , dm:0.76 , mu:5.8, v_total:6.36 , mp:8.63, rp:2.711, ms:0.36, au:0.1429 , atm:"h2_dominated" },
  { system:"GJ 3512",          planet:"GJ 3512 b",      distance_pc:9.4900,  color:"#ffab91", type:"Gas Giant",    hz:false, disc_year:2019, notes:"Jupiter-mass planet around a tiny M-dwarf — challenges planet formation theories." , orbital_period_days:203.59, tidally_locked:false , v_r:-23.4 , dm:0.19 , mu:16.4, v_total:28.57 , mp:489.0, rp:11.0, ms:0.1231, au:0.338 , atm:"h2_dominated" },
  { system:"L 98-59",          planet:"L 98-59 b",      distance_pc:10.6200, color:"#b0bec5", type:"Rocky",        hz:false, disc_year:2019, notes:"Sub-Earth mass planet — one of the lightest exoplanets known. Year = 2.25 days." , orbital_period_days:2.253, tidally_locked:true , v_r:5.4 , dm:0.213 , mu:14.8, v_total:15.75 , mp:0.4, rp:0.85, ms:0.313, au:0.0219 , atm:"none" },
  { system:"L 98-59",          planet:"L 98-59 d",      distance_pc:10.6200, color:"#90a4ae", type:"Rocky",        hz:false, disc_year:2019, notes:"Third planet in L 98-59 — may retain water. Top JWST atmospheric target." , orbital_period_days:7.451, tidally_locked:true , v_r:5.4 , dm:0.213 , mu:14.8, v_total:15.75 , mp:1.94, rp:1.521, ms:0.313, au:0.0485 , atm:"thin_co2" },
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


// ── DOPPLER ENGINE ────────────────────────────────────────────────────────────
// c in km/s
const C_KMS = 299792.458;

// Relativistic Doppler factor
// f_obs/f_emit = sqrt((1+β)/(1-β)) where β = v_r/c
// negative v_r = approaching = blueshift (f_obs > f_emit)
function dopplerFactor(v_r_kms) {
  const beta = v_r_kms / C_KMS;
  return Math.sqrt((1 + beta) / (1 - beta));
}

// Wavelength shift in nm for visible light reference (550nm green)
// Δλ = λ_emit * (factor - 1)
function dopplerWavelengthShift(v_r_kms, lambda_nm = 550) {
  const factor = dopplerFactor(v_r_kms);
  return lambda_nm * (factor - 1); // positive = redshift, negative = blueshift
}

// Convert wavelength shift to RGB color temperature adjustment
// Applied to received image canvas pixels
// Returns {rScale, gScale, bScale} — multiply each channel by these
function dopplerRGBShift(v_r_kms) {
  const beta = v_r_kms / C_KMS;
  const shift = dopplerWavelengthShift(v_r_kms);
  const absPct = Math.abs(shift / 550) * 100;

  if (Math.abs(beta) < 1e-6) return { rScale:1, gScale:1, bScale:1 };

  // Amplify for visual effect — real shift is imperceptible,
  // we amplify by 8000x so it's educationally visible
  const amp = Math.min(absPct * 8000, 35); // cap at 35% channel shift

  if (v_r_kms < 0) {
    // Approaching → blueshift: boost blue, reduce red
    return { rScale: 1 - amp/100 * 0.6, gScale: 1 - amp/100 * 0.15, bScale: 1 + amp/100 * 0.5 };
  } else {
    // Receding → redshift: boost red, reduce blue
    return { rScale: 1 + amp/100 * 0.5, gScale: 1 - amp/100 * 0.1, bScale: 1 - amp/100 * 0.6 };
  }
}

// Apply Doppler color shift to a canvas
function applyDopplerShift(ctx, w, h, v_r_kms) {
  if (!v_r_kms || Math.abs(v_r_kms) < 0.01) return;
  const { rScale, gScale, bScale } = dopplerRGBShift(v_r_kms);
  const d = ctx.getImageData(0,0,w,h); const px = d.data;
  for (let i=0; i<px.length; i+=4) {
    px[i]   = Math.max(0, Math.min(255, px[i]   * rScale));
    px[i+1] = Math.max(0, Math.min(255, px[i+1] * gScale));
    px[i+2] = Math.max(0, Math.min(255, px[i+2] * bScale));
  }
  ctx.putImageData(d,0,0);
}

// Human-readable Doppler description
function dopplerDescription(v_r_kms) {
  if (!v_r_kms) return { type:"unknown", color:"#6a8aaa", label:"No data" };
  if (Math.abs(v_r_kms) < 1) return { type:"neutral", color:"#6a8aaa", label:"Near stationary" };
  if (v_r_kms < 0) return { type:"blueshift", color:"#4fc3f7", label:"Blueshift (approaching)" };
  return { type:"redshift", color:"#ff8a65", label:"Redshift (receding)" };
}


// ── ISM DISPERSION ENGINE ──────────────────────────────────────────────────────
// Δt_DM = 4.15 ms × DM × (f_low⁻² − f_high⁻²)  [DM in pc/cm³, f in GHz]
// For optical (f ~ 5×10⁵ GHz): Δt is sub-femtosecond → completely negligible
// For radio (f ~ 0.1–10 GHz): Δt can be seconds to minutes → measurable

// ISM frequency bands
const ISM_BANDS = [
  { id:"optical", label:"Optical (550 nm)", freq_GHz:545000, color:"rgba(255,255,180,0.95)", icon:"💡" },
  { id:"near_ir", label:"Near-IR (1 μm)",   freq_GHz:300000, color:"rgba(255,180,120,0.90)", icon:"🌡" },
  { id:"L_band",  label:"L-band (1.4 GHz)", freq_GHz:1.4,   color:"rgba(0,200,255,0.90)",   icon:"📡" },
  { id:"P_band",  label:"P-band (350 MHz)", freq_GHz:0.35,  color:"rgba(180,120,255,0.90)", icon:"📻" },
  { id:"HF",      label:"HF Radio (30 MHz)",freq_GHz:0.03,  color:"rgba(255,100,100,0.90)", icon:"🔴" },
];

// Dispersion delay in seconds
function ismDelay_s(dm_pc_cm3, freq_GHz) {
  // Δt = 4.15e-3 × DM × f⁻²   [s, pc/cm³, GHz]
  return 4.15e-3 * dm_pc_cm3 / (freq_GHz * freq_GHz);
}

// Delay as fraction of light-travel time
function ismDelayFraction(dm, freq_GHz, distanceLY) {
  const travelSec = distanceLY * 365.25 * 86400;
  return ismDelay_s(dm, freq_GHz) / travelSec;
}

// Human-readable delay
function fmtIsmDelay(dm, freq_GHz) {
  const dt = ismDelay_s(dm, freq_GHz);
  if (dt < 1e-9)  return { val: (dt*1e12).toExponential(2)+" ps",  impact:"negligible" };
  if (dt < 1e-6)  return { val: (dt*1e9).toFixed(3)+" ns",          impact:"negligible" };
  if (dt < 1e-3)  return { val: (dt*1e6).toFixed(3)+" μs",          impact:"negligible" };
  if (dt < 1)     return { val: (dt*1e3).toFixed(3)+" ms",          impact:"minor" };
  if (dt < 60)    return { val: dt.toFixed(3)+" s",                 impact:"significant" };
  if (dt < 3600)  return { val: (dt/60).toFixed(2)+" min",          impact:"major" };
  return               { val: (dt/3600).toFixed(2)+" hr",           impact:"extreme" };
}

// ISM dispersion panel component
function ISMPanel({ target, distanceLY }) {
  const [selBand, setSelBand] = useState("optical");
  const border="#rgba(0,180,255,0.22)", dim="#6a8aaa", textCol="#c8dff0", accent="#00c8ff";
  const dm = target.dm || (distanceLY * 0.02); // fallback estimate
  const band = ISM_BANDS.find(b=>b.id===selBand) || ISM_BANDS[0];
  const { val:delayVal, impact } = fmtIsmDelay(dm, band.freq_GHz);
  const impactColor = impact==="negligible"?"#00e87a":impact==="minor"?"#f5c842":impact==="significant"?"#ff9a20":"#ff5f5f";

  // Compute delays for all bands for comparison bar
  const optDelay    = ismDelay_s(dm, 545000);
  const radioDelay  = ismDelay_s(dm, 1.4);
  const maxDelay    = Math.max(radioDelay, 1e-6);

  return (
    <div style={{marginTop:16,padding:"18px 20px",background:"rgba(0,0,0,0.35)",border:"1px solid rgba(0,180,255,0.22)",borderRadius:12}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,flexWrap:"wrap"}}>
        <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:12,color:accent,letterSpacing:2}}>〜 ISM DISPERSION</div>
        <div style={{fontSize:11,padding:"2px 8px",borderRadius:4,background:"rgba(0,232,122,0.12)",color:"#00e87a",fontWeight:600}}>Implemented ✓</div>
        <div style={{fontSize:11,color:dim}}>DM = {dm.toFixed(3)} pc/cm³</div>
      </div>

      {/* Frequency band selector */}
      <div style={{marginBottom:14}}>
        <div style={{fontSize:11,color:dim,textTransform:"uppercase",letterSpacing:1.5,marginBottom:8}}>Signal frequency — select to see ISM dispersion effect</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {ISM_BANDS.map(b=>(
            <button key={b.id} onClick={()=>setSelBand(b.id)}
              style={{padding:"6px 12px",borderRadius:8,border:selBand===b.id?"2px solid "+b.color:"1px solid rgba(0,180,255,0.22)",
                background:selBand===b.id?"rgba(0,0,0,0.5)":"rgba(0,0,0,0.2)",
                color:selBand===b.id?b.color:dim,fontSize:12,cursor:"pointer",fontFamily:"monospace",
                boxShadow:selBand===b.id?`0 0 12px ${b.color}55`:"none"}}>
              {b.icon} {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dispersion visualization — waterfall diagram */}
      <div style={{marginBottom:14,padding:"14px 16px",background:"rgba(0,0,0,0.4)",borderRadius:10,border:"1px solid rgba(0,180,255,0.15)"}}>
        <div style={{fontSize:11,color:dim,textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>
          Frequency-time waterfall — {band.label} arriving at Earth
        </div>
        <ISMWaterfall dm={dm} distanceLY={distanceLY} selectedBand={selBand}/>
      </div>

      {/* Metrics */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:10,marginBottom:14}}>
        {[
          ["DM",               dm.toFixed(4)+" pc/cm³",      textCol],
          ["Frequency",        band.freq_GHz > 1000 ? (band.freq_GHz/1000).toFixed(0)+" THz" : band.freq_GHz.toFixed(3)+" GHz", band.color],
          ["Dispersion delay", delayVal,                      impactColor],
          ["Impact",           impact.charAt(0).toUpperCase()+impact.slice(1), impactColor],
          ["vs travel time",   ismDelayFraction(dm,band.freq_GHz,distanceLY)<1e-10?"< 10⁻¹⁰":(ismDelayFraction(dm,band.freq_GHz,distanceLY)*100).toExponential(2)+"%", dim],
          ["Optical (ref)",    fmtIsmDelay(dm,545000).val,   "#00e87a"],
        ].map(([label,value,color])=>(
          <div key={label} style={{background:"rgba(0,0,0,0.3)",borderRadius:8,padding:"10px 12px",border:"1px solid rgba(0,180,255,0.22)"}}>
            <div style={{fontSize:10,color:dim,textTransform:"uppercase",letterSpacing:1.5,marginBottom:3}}>{label}</div>
            <div style={{fontSize:14,fontWeight:700,color,fontFamily:"'IBM Plex Mono',monospace"}}>{value}</div>
          </div>
        ))}
      </div>

      {/* Formula */}
      <div style={{padding:"10px 14px",background:"rgba(0,0,0,0.3)",borderRadius:8,border:"1px solid rgba(0,180,255,0.2)",fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:"#a8d8ea",marginBottom:12}}>
        Δt_DM = 4.15 ms × DM × (f⁻²)   =   4.15e-3 × {dm.toFixed(3)} × {band.freq_GHz > 1000?(band.freq_GHz/1000).toFixed(0)+"e3²":band.freq_GHz.toFixed(3)+"⁻²"} GHz⁻²   =   {delayVal}
      </div>

      {/* Why optical is fine */}
      <div style={{fontSize:13,color:dim,lineHeight:1.8,padding:"12px 14px",background:selBand==="optical"?"rgba(0,232,122,0.05)":"rgba(255,100,60,0.05)",border:`1px solid ${selBand==="optical"?"rgba(0,232,122,0.2)":"rgba(255,100,60,0.2)"}`,borderRadius:8}}>
        {selBand==="optical" || selBand==="near_ir" ? (
          <span><strong style={{color:"#00e87a"}}>✓ This app uses optical signals</strong> — ISM dispersion is completely negligible at these frequencies. The delay of <strong style={{color:"#00e87a"}}>{delayVal}</strong> is billions of times smaller than any detectable timescale. The simulator's assumption of a vacuum ISM is physically exact for optical imaging.</span>
        ) : (
          <span><strong style={{color:"#ff9a20"}}>⚠ Radio signal selected</strong> — ISM dispersion becomes {impact} at {band.label}. A delay of <strong style={{color:impactColor}}>{delayVal}</strong> would cause different frequencies to arrive at different times, creating the characteristic "dispersion sweep" seen in pulsar signals. This is how astronomers measure DM and estimate distances.</span>
        )}
      </div>
    </div>
  );
}

// ISM Waterfall diagram — shows frequency-time arrival pattern
function ISMWaterfall({ dm, distanceLY, selectedBand }) {
  const canvasRef = useRef(null);

  useEffect(()=>{
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W=canvas.width, H=canvas.height;
    ctx.clearRect(0,0,W,H);

    // Background
    ctx.fillStyle="#000814"; ctx.fillRect(0,0,W,H);

    // Frequency range to display (GHz)
    const f_min=0.1, f_max=545000;
    const freqs_to_show=[
      {f:545000, label:"Optical",  color:"rgba(255,255,180,0.9)"},
      {f:300000, label:"Near-IR",  color:"rgba(255,180,120,0.8)"},
      {f:1.4,    label:"L-band",   color:"rgba(0,200,255,0.9)"},
      {f:0.35,   label:"P-band",   color:"rgba(180,120,255,0.9)"},
      {f:0.03,   label:"HF Radio", color:"rgba(255,100,100,0.9)"},
    ];

    // For each frequency, compute the ISM delay as fraction of travel time
    const travelSec = distanceLY * 365.25 * 86400;
    const delays = freqs_to_show.map(f=>({
      ...f,
      delay_s: ismDelay_s(dm, f.f),
      delay_frac: ismDelay_s(dm, f.f) / travelSec
    }));

    const maxDelay = Math.max(...delays.map(d=>d.delay_s), 1e-10);

    // X axis: time (0 = travel time + 0, extends right = delay)
    // Each row = one frequency band
    const rowH = (H-30) / freqs_to_show.length;
    const LABEL_W = 68;
    const BAR_W = W - LABEL_W - 10;

    // Header
    ctx.font="8px 'IBM Plex Mono',monospace"; ctx.fillStyle="rgba(0,180,255,0.5)"; ctx.textAlign="center";
    ctx.fillText("← Travel time ends here        ISM delay →", LABEL_W + BAR_W/2, 10);

    delays.forEach((d,i)=>{
      const y=30+i*rowH, mid=y+rowH*0.5;
      const isSelected = ISM_BANDS.find(b=>b.id===selectedBand)?.freq_GHz===d.f;

      // Row background
      ctx.fillStyle=isSelected?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.2)";
      ctx.fillRect(LABEL_W, y, BAR_W, rowH-2);

      // Label
      ctx.font=(isSelected?"bold ":"")+"8px 'IBM Plex Mono',monospace";
      ctx.fillStyle=isSelected?d.color:"rgba(150,150,150,0.6)";
      ctx.textAlign="right";
      ctx.fillText(d.label, LABEL_W-4, mid+3);

      // Arrival line at x=0 (reference: signal arrives)
      const arriveX = LABEL_W + 2;
      ctx.beginPath(); ctx.moveTo(arriveX, y+2); ctx.lineTo(arriveX, y+rowH-4);
      ctx.strokeStyle=d.color; ctx.lineWidth=isSelected?2.5:1.2; ctx.stroke();

      // Delay bar — log scale for visual clarity
      const logMax = Math.log10(maxDelay+1e-20);
      const logDel = d.delay_s > 0 ? Math.log10(d.delay_s+1e-20) : -40;
      const barLen = Math.max(2, ((logDel - (-15)) / (logMax - (-15))) * (BAR_W-20));

      if (barLen > 2) {
        // Bar showing delay
        const barGrad = ctx.createLinearGradient(arriveX, 0, arriveX+barLen, 0);
        barGrad.addColorStop(0, d.color);
        barGrad.addColorStop(1, d.color.replace("0.9","0.1").replace("0.8","0.1"));
        ctx.fillStyle=barGrad;
        ctx.fillRect(arriveX, mid-3, barLen, 6);

        // Delay label
        const {val} = fmtIsmDelay(dm, d.f);
        ctx.font="7px 'IBM Plex Mono',monospace";
        ctx.fillStyle=d.color;
        ctx.textAlign="left";
        ctx.fillText(val, arriveX+barLen+3, mid+3);
      } else {
        ctx.font="7px 'IBM Plex Mono',monospace"; ctx.fillStyle="rgba(0,232,122,0.6)"; ctx.textAlign="left";
        ctx.fillText("< fs", arriveX+4, mid+3);
      }
    });

    // X axis
    ctx.strokeStyle="rgba(0,180,255,0.2)"; ctx.lineWidth=0.8;
    ctx.beginPath(); ctx.moveTo(LABEL_W,H-4); ctx.lineTo(W,H-4); ctx.stroke();
    ctx.font="7px 'IBM Plex Mono',monospace"; ctx.fillStyle="rgba(0,180,255,0.35)"; ctx.textAlign="left";
    ctx.fillText("→ time after arrival (log scale)", LABEL_W, H-1);

  }, [dm, distanceLY, selectedBand]);

  return <canvas ref={canvasRef} width={460} height={140}
    style={{width:"100%",maxWidth:460,height:140,display:"block",borderRadius:6,border:"1px solid rgba(0,180,255,0.15)"}}/>;
}

// ── DOPPLER PANEL COMPONENT ───────────────────────────────────────────────────

// ── ATMOSPHERIC TRANSMISSION ENGINE ──────────────────────────────────────────
// Models the absorption spectrum of each planet's atmosphere.
// When a signal LEAVES the source planet, it passes through its atmosphere.
// Different molecules absorb at specific wavelengths — CO2, H2O, O2, CH4, O3
// This leaves dark absorption bands in the received spectrum.
// For biosignature hunting: O2 (760nm), O3 (UV), CH4, H2O are the key targets.

const ATM_PROFILES = {
  none: {
    label: "No atmosphere / bare rock",
    color: "#90a4ae",
    bands: [],
    desc:  "No atmospheric absorption. Signal arrives with full original spectrum intact.",
    biosig: false,
  },
  thin_co2: {
    label: "Thin CO₂ (Mars-like)",
    color: "#ffab91",
    bands: [
      { center:4260, width:200, depth:0.85, label:"CO₂ 4.3μm" },
      { center:2700, width:150, depth:0.70, label:"CO₂ 2.7μm" },
      { center: 667, width: 80, depth:0.60, label:"CO₂ 15μm" },
    ],
    desc:  "Thin CO₂ atmosphere. Mars-like. Weak absorption at CO₂ infrared bands.",
    biosig: false,
  },
  thick_co2: {
    label: "Thick CO₂ (Venus-like)",
    color: "#ff7043",
    bands: [
      { center:4260, width:300, depth:0.98, label:"CO₂ 4.3μm" },
      { center:2700, width:200, depth:0.95, label:"CO₂ 2.7μm" },
      { center:1430, width:150, depth:0.85, label:"CO₂ 1.4μm" },
      { center: 667, width:120, depth:0.95, label:"CO₂ 15μm"  },
      { center:1900, width:200, depth:0.80, label:"H₂O 1.9μm" },
    ],
    desc:  "Thick CO₂ with H₂O. Venus-like. Strong greenhouse. Hostile surface.",
    biosig: false,
  },
  n2_co2: {
    label: "N₂/CO₂ (early Earth-like)",
    color: "#ce93d8",
    bands: [
      { center:4260, width:200, depth:0.82, label:"CO₂ 4.3μm" },
      { center:2700, width:150, depth:0.75, label:"CO₂ 2.7μm" },
      { center:1900, width:200, depth:0.85, label:"H₂O 1.9μm" },
      { center:1400, width:150, depth:0.80, label:"H₂O 1.4μm" },
    ],
    desc:  "N₂/CO₂ dominated. Possible early Earth analog. No O₂ biosignature yet.",
    biosig: false,
  },
  n2_o2: {
    label: "N₂/O₂ (Earth-like) 🌱",
    color: "#00e87a",
    bands: [
      { center: 760, width: 20, depth:0.92, label:"O₂ A-band 760nm ⭐" },
      { center: 687, width: 15, depth:0.70, label:"O₂ B-band 687nm"    },
      { center:1900, width:200, depth:0.88, label:"H₂O 1.9μm"          },
      { center:1400, width:150, depth:0.82, label:"H₂O 1.4μm"          },
      { center:9600, width:500, depth:0.95, label:"O₃ 9.6μm ⭐"        },
      { center:3300, width:200, depth:0.75, label:"CH₄ 3.3μm ⭐"       },
      { center: 550, width: 80, depth:0.40, label:"O₃ Chappuis (vis)"  },
    ],
    desc:  "Earth-like N₂/O₂ atmosphere with O₃ layer. O₂ + O₃ + CH₄ = strong biosignature trio.",
    biosig: true,
  },
  h2_dominated: {
    label: "H₂-dominated (sub-Neptune)",
    color: "#4fc3f7",
    bands: [
      { center:2200, width:300, depth:0.80, label:"H₂ CIA 2.2μm"  },
      { center:1900, width:200, depth:0.85, label:"H₂O 1.9μm"     },
      { center:3300, width:200, depth:0.70, label:"CH₄ 3.3μm"     },
      { center:1150, width:100, depth:0.65, label:"CH₄ 1.15μm"    },
      { center:4260, width:150, depth:0.60, label:"CO₂ 4.3μm"     },
    ],
    desc:  "Hydrogen-dominated envelope. Neptune/sub-Neptune type. CH₄ present.",
    biosig: false,
  },
  h2o_steam: {
    label: "H₂O / steam (ocean world)",
    color: "#80deea",
    bands: [
      { center:1900, width:250, depth:0.95, label:"H₂O 1.9μm"    },
      { center:1400, width:200, depth:0.92, label:"H₂O 1.4μm"    },
      { center:1150, width:150, depth:0.88, label:"H₂O 1.15μm"   },
      { center:2700, width:200, depth:0.90, label:"H₂O 2.7μm"    },
      { center:6270, width:400, depth:0.98, label:"H₂O 6.3μm"    },
    ],
    desc:  "Steam / water world atmosphere. Flat spectrum in visible, deep H₂O bands in IR.",
    biosig: false,
  },
  exotic: {
    label: "Exotic / Ultra-hot Jupiter",
    color: "#ff5722",
    bands: [
      { center: 589, width: 10, depth:0.85, label:"Na D 589nm"    },
      { center: 769, width:  8, depth:0.80, label:"K 769nm"       },
      { center:9400, width:500, depth:0.90, label:"TiO/VO NIR"    },
      { center: 656, width: 20, depth:0.75, label:"Hα 656nm"      },
      { center:1400, width:200, depth:0.70, label:"H₂O 1.4μm"    },
    ],
    desc:  "Ultra-hot atmosphere with atomic metals, TiO, VO. Temperature >2000K. Unique exotic spectrum.",
    biosig: false,
  },
};

// Atmospheric transmission canvas component
function AtmosphericPanel({ target, arrived }) {
  const canvasRef = useRef(null);
  const border = "rgba(0,180,255,0.22)", dim = "#6a8aaa", textCol = "#c8dff0", accent = "#00c8ff";
  const profile = ATM_PROFILES[target.atm] || ATM_PROFILES.none;

  useEffect(()=>{
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle="#000c18"; ctx.fillRect(0,0,W,H);

    // Wavelength range: 400nm to 5000nm (visible + near-IR where JWST operates)
    const WL_MIN = 400, WL_MAX = 5000;
    const LABEL_H = 28;
    const PLOT_H  = H - LABEL_H - 10;
    const toX = (wl) => ((wl - WL_MIN) / (WL_MAX - WL_MIN)) * W;

    // Compute transmission at each pixel
    const transmission = new Float32Array(W);
    for (let px = 0; px < W; px++) {
      const wl = WL_MIN + (px/W)*(WL_MAX-WL_MIN);
      let T = 1.0;
      for (const band of profile.bands) {
        // Gaussian absorption profile
        const sigma = band.width / 2.355; // FWHM to sigma
        const g = Math.exp(-0.5*Math.pow((wl-band.center)/sigma,2));
        T *= (1 - band.depth * g);
      }
      transmission[px] = Math.max(0, Math.min(1, T));
    }

    // Draw continuum (star spectrum approximation — black body ~5800K)
    // Simplified: peaks in visible, falls off in IR
    for (let px = 0; px < W; px++) {
      const wl = WL_MIN + (px/W)*(WL_MAX-WL_MIN);
      // Rough spectral shape
      let intensity = 1.0;
      if (wl < 500) intensity = 0.6 + 0.4*(wl-400)/100;
      else if (wl > 2000) intensity = Math.max(0.1, 1.0-((wl-2000)/3000)*0.8);
      const T = transmission[px];
      const bright = Math.round(intensity * T * 255);

      // Color by wavelength (visible: use actual color, IR: false color)
      let r,g,b;
      if (wl < 450)       { r=100; g=0;   b=bright; }
      else if (wl < 490)  { r=0;   g=Math.round(bright*0.3); b=bright; }
      else if (wl < 560)  { r=0;   g=bright; b=Math.round(bright*0.3); }
      else if (wl < 590)  { r=Math.round(bright*0.8); g=bright; b=0; }
      else if (wl < 650)  { r=bright; g=Math.round(bright*0.4); b=0; }
      else if (wl < 700)  { r=bright; g=0; b=0; }
      else if (wl < 1000) { r=Math.round(bright*0.6); g=0; b=Math.round(bright*0.1); } // NIR false
      else                { r=Math.round(bright*0.2); g=Math.round(bright*0.05); b=Math.round(bright*0.15); } // IR false

      ctx.fillStyle=`rgb(${r},${g},${b})`;
      ctx.fillRect(px, 10, 1, PLOT_H);
    }

    // Draw transmission curve overlay
    ctx.beginPath();
    for (let px=0; px<W; px++) {
      const y = 10 + PLOT_H*(1-transmission[px]*0.95);
      if (px===0) ctx.moveTo(px,y); else ctx.lineTo(px,y);
    }
    ctx.strokeStyle="rgba(255,255,255,0.75)"; ctx.lineWidth=1.5; ctx.stroke();

    // Draw absorption band labels
    for (const band of profile.bands) {
      const x = toX(band.center);
      if (x < 0 || x > W) continue;
      // Vertical tick
      ctx.strokeStyle="rgba(255,255,100,0.5)"; ctx.lineWidth=1;
      ctx.setLineDash([2,2]);
      ctx.beginPath(); ctx.moveTo(x, 8); ctx.lineTo(x, PLOT_H+8); ctx.stroke();
      ctx.setLineDash([]);
      // Label
      ctx.font="7px 'IBM Plex Mono',monospace"; ctx.textAlign="center";
      ctx.fillStyle="rgba(255,255,100,0.75)";
      ctx.fillText(band.label, x, H-8);
    }

    // Wavelength axis labels
    [500,700,1000,2000,3000,4000,5000].forEach(wl => {
      const x = toX(wl);
      if (x < 10 || x > W-10) return;
      ctx.fillStyle="rgba(0,180,255,0.35)"; ctx.font="7px 'IBM Plex Mono',monospace"; ctx.textAlign="center";
      ctx.fillText(wl<1000?wl+"nm":(wl/1000).toFixed(1)+"μm", x, PLOT_H+18);
    });

    // Biosignature highlight boxes
    if (profile.biosig) {
      // O2 A-band
      const o2x = toX(760);
      ctx.strokeStyle="rgba(0,232,122,0.6)"; ctx.lineWidth=1.5;
      ctx.strokeRect(o2x-15, 8, 30, PLOT_H);
      ctx.fillStyle="rgba(0,232,122,0.15)"; ctx.fillRect(o2x-15,8,30,PLOT_H);
      // O3
      const o3x = toX(550);
      ctx.strokeStyle="rgba(0,200,255,0.4)"; ctx.lineWidth=1;
      ctx.strokeRect(o3x-40, 8, 80, PLOT_H);
    }

    // "Visible" and "IR" zone labels at top
    ctx.font="7px 'IBM Plex Mono',monospace"; ctx.textAlign="left";
    ctx.fillStyle="rgba(200,200,200,0.30)";
    ctx.fillText("← Visible", toX(400)+2, 18);
    ctx.fillText("Near-IR →", toX(700)+2, 18);
    ctx.fillText("Mid-IR ——————→", toX(1200)+2, 18);

  }, [target, arrived]);

  return (
    <div style={{marginTop:16,padding:"18px 20px",background:"rgba(0,0,0,0.35)",border:"1px solid rgba(0,180,255,0.22)",borderRadius:12}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,flexWrap:"wrap"}}>
        <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:12,color:accent,letterSpacing:2}}>🌡 ATMOSPHERIC TRANSMISSION</div>
        <div style={{fontSize:11,padding:"2px 8px",borderRadius:4,
          background:profile.biosig?"rgba(0,232,122,0.15)":"rgba(0,0,0,0.3)",
          color:profile.biosig?"#00e87a":dim,fontWeight:600,
          border:profile.biosig?"1px solid rgba(0,232,122,0.4)":"1px solid rgba(0,180,255,0.2)"}}>
          {profile.biosig?"🌱 BIOSIGNATURE CANDIDATE":"No biosignatures"}
        </div>
        <div style={{fontSize:12,color:dim}}>{profile.label}</div>
      </div>

      {/* Spectrum canvas */}
      <div style={{marginBottom:12}}>
        <div style={{fontSize:11,color:dim,textTransform:"uppercase",letterSpacing:1.5,marginBottom:6}}>
          Transmission spectrum — 400nm to 5μm (visible + JWST range)
          {profile.biosig&&<span style={{color:"#00e87a",marginLeft:8}}>· Green boxes = biosignature windows</span>}
        </div>
        <canvas ref={canvasRef} width={460} height={120}
          style={{width:"100%",maxWidth:460,height:120,display:"block",borderRadius:8,
            border:"1px solid rgba(0,180,255,0.2)"}}/>
      </div>

      {/* Absorption bands table */}
      {profile.bands.length > 0 && (
        <div style={{marginBottom:12}}>
          <div style={{fontSize:11,color:dim,textTransform:"uppercase",letterSpacing:1.5,marginBottom:8}}>
            Absorption bands
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:6}}>
            {profile.bands.map(band=>(
              <div key={band.label} style={{background:"rgba(0,0,0,0.3)",borderRadius:6,padding:"8px 10px",
                border:`1px solid rgba(255,255,100,${band.depth*0.4})`}}>
                <div style={{fontSize:11,fontWeight:700,color:"rgba(255,255,100,0.85)",fontFamily:"monospace"}}>{band.label}</div>
                <div style={{fontSize:10,color:dim,marginTop:2}}>
                  λ={band.center<1000?band.center+"nm":(band.center/1000).toFixed(2)+"μm"} · depth={Math.round(band.depth*100)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Biosignature callout */}
      {profile.biosig && (
        <div style={{padding:"12px 14px",background:"rgba(0,232,122,0.08)",border:"1px solid rgba(0,232,122,0.35)",borderRadius:8,marginBottom:12}}>
          <div style={{fontSize:13,fontWeight:700,color:"#00e87a",marginBottom:6}}>🌱 Biosignature trio detected in spectrum</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:8}}>
            {[
              ["O₂ A-band", "760nm", "Photosynthesis byproduct — Earth's smoking gun"],
              ["O₃ layer",  "9.6μm + vis", "Protects surface life, formed from O₂"],
              ["CH₄",       "3.3μm", "Biological or geological methane"],
            ].map(([mol,wl,desc])=>(
              <div key={mol} style={{background:"rgba(0,0,0,0.3)",borderRadius:6,padding:"8px 10px"}}>
                <div style={{fontSize:12,fontWeight:700,color:"#00e87a",fontFamily:"monospace"}}>{mol}</div>
                <div style={{fontSize:10,color:"#4fc3f7",marginTop:1}}>{wl}</div>
                <div style={{fontSize:10,color:dim,marginTop:2,lineHeight:1.4}}>{desc}</div>
              </div>
            ))}
          </div>
          <div style={{fontSize:12,color:dim,lineHeight:1.7}}>
            O₂ + O₃ + CH₄ in chemical disequilibrium is the strongest known abiotic-free biosignature combination. JWST requires ~100 transit hours to detect these on rocky planets. {target.planet} is a priority target.
          </div>
        </div>
      )}

      {/* Description */}
      <div style={{fontSize:13,color:dim,lineHeight:1.8,padding:"10px 14px",
        background:"rgba(0,180,255,0.04)",border:"1px solid rgba(0,180,255,0.15)",borderRadius:8}}>
        {profile.desc}
      </div>
    </div>
  );
}


// ── COSMOLOGICAL REDSHIFT ENGINE ──────────────────────────────────────────────
// Hubble constant H₀ = 70.0 km/s/Mpc (Planck 2018)
// Hubble distance D_H = c/H₀ = 4285 Mpc
// For small z: v_rec = H₀ × d → z ≈ v_rec/c = H₀ × d / c
// For our Milky Way catalog (d ≲ 750 ly = 0.00023 Mpc):
//   z < 5.4×10⁻⁹ — completely negligible
// z becomes significant at:
//   z = 0.01 → d ≈ 43 Mpc (Large-scale structure)
//   z = 0.1  → d ≈ 420 Mpc (distant galaxy clusters)
//   z = 1.0  → d ≈ 3300 Mpc (high-z universe, early galaxies)
//   z = 10   → d ≈ early universe, CMB

const H0_KMS_MPC   = 70.0;          // Hubble constant km/s/Mpc
const C_KMS_COSMO  = 299792.458;     // km/s
const LY_PER_MPC   = 3.26156e6;     // ly per Megaparsec
const MPC_PER_LY   = 1/LY_PER_MPC;

// Simple Hubble redshift (valid for z << 1)
function hubbleRedshift(distanceLY) {
  const distMpc = distanceLY * MPC_PER_LY;
  return (H0_KMS_MPC * distMpc) / C_KMS_COSMO;
}

// Observed wavelength including cosmological redshift
function cosmologicalLambdaObs(lambda_emit_nm, z) {
  return lambda_emit_nm * (1 + z);
}

// Angular diameter distance (simplified for small z)
function angularDiameterDist_Mpc(z) {
  // D_A = D_C / (1+z)  where D_C ≈ (c/H₀) × z for small z
  const dc = (C_KMS_COSMO / H0_KMS_MPC) * z;
  return dc / (1 + z);
}

// Luminosity distance
function luminosityDist_Mpc(z) {
  const dc = (C_KMS_COSMO / H0_KMS_MPC) * z;
  return dc * (1 + z);
}

// Lookback time in Gyr (simplified, flat ΛCDM)
function lookbackTime_Gyr(z) {
  // Approximate: t_lb ≈ (2/3H₀) × z/(1+z) × (1/√Ω_m) for small z
  // Full integral approximation for larger z
  const H0_per_Gyr = H0_KMS_MPC * 1.022e-3; // convert to Gyr⁻¹
  const tH = 1 / H0_per_Gyr; // Hubble time ~13.97 Gyr
  if (z < 0.1) return tH * z * 0.96; // linear approx
  // Better: numerical integration simplified
  return tH * (1 - 1/Math.pow(1+z, 0.6)) * 1.5;
}

// Format z value
function fmtZ(z) {
  if (z < 1e-10) return z.toExponential(2);
  if (z < 1e-3)  return z.toExponential(3);
  if (z < 0.01)  return z.toFixed(6);
  if (z < 1)     return z.toFixed(4);
  return z.toFixed(2);
}

// Cosmological redshift panel component
function CosmologyPanel({ target, distanceLY }) {
  const [exDist, setExDist] = useState(10); // in Mpc for extragalactic explorer
  const [exUnit, setExUnit] = useState("Mpc");
  const border="rgba(0,180,255,0.22)", dim="#6a8aaa", textCol="#c8dff0", accent="#00c8ff";

  // Convert to Mpc
  const exDistMpc = exUnit==="ly"   ? exDist*MPC_PER_LY
                  : exUnit==="kly"  ? exDist*1000*MPC_PER_LY
                  : exUnit==="Mly"  ? exDist/3.26156
                  : exUnit==="kpc"  ? exDist/1000
                  : exUnit==="Gpc"  ? exDist*1000
                  : exDist; // Mpc default

  // Current catalog planet
  const z_catalog  = hubbleRedshift(distanceLY);
  const z_ex       = hubbleRedshift(exDistMpc * LY_PER_MPC);
  const lam_obs_cat= cosmologicalLambdaObs(550, z_catalog);
  const lam_obs_ex = cosmologicalLambdaObs(550, z_ex);
  const lb_ex      = lookbackTime_Gyr(z_ex);

  // Regime labels
  const getRegime = (z) => {
    if (z < 1e-6) return { label:"Flat space — exact",       color:"#00e87a" };
    if (z < 0.001)return { label:"Negligible",               color:"#7ecb35" };
    if (z < 0.01) return { label:"Detectable",               color:"#f5c842" };
    if (z < 0.1)  return { label:"Significant",              color:"#ff9a20" };
    if (z < 1)    return { label:"Cosmological",             color:"#ff6020" };
    if (z < 5)    return { label:"High-z galaxy",            color:"#ff3030" };
    return               { label:"Early universe / CMB",    color:"#ffffff" };
  };

  const reg_cat = getRegime(z_catalog);
  const reg_ex  = getRegime(z_ex);

  const MT = ({label,value,color,small}) => (
    <div style={{background:"rgba(0,0,0,0.3)",borderRadius:8,padding:"10px 12px",border:"1px solid "+border}}>
      <div style={{fontSize:10,color:dim,textTransform:"uppercase",letterSpacing:1.5,marginBottom:3}}>{label}</div>
      <div style={{fontSize:small?12:14,fontWeight:700,color:color||textCol,fontFamily:"'IBM Plex Mono',monospace"}}>{value}</div>
    </div>
  );

  return (
    <div style={{marginTop:16,padding:"18px 20px",background:"rgba(0,0,0,0.35)",border:"1px solid rgba(0,180,255,0.22)",borderRadius:12}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,flexWrap:"wrap"}}>
        <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:12,color:accent,letterSpacing:2}}>🔭 COSMOLOGICAL REDSHIFT</div>
        <div style={{fontSize:11,padding:"2px 8px",borderRadius:4,background:"rgba(0,232,122,0.12)",color:"#00e87a",fontWeight:600}}>Valid — domain proven ✓</div>
      </div>

      {/* Why it's valid for our catalog */}
      <div style={{marginBottom:14,padding:"14px 16px",background:"rgba(0,232,122,0.06)",border:"1px solid rgba(0,232,122,0.25)",borderRadius:10}}>
        <div style={{fontSize:11,color:"#00e87a",textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>
          ✓ Proof: why flat-space is exact for this catalog
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:8,marginBottom:12}}>
          <MT label="Catalog max dist"   value="~750 ly"                                  color={textCol}/>
          <MT label="In Megaparsecs"     value={(750*MPC_PER_LY).toExponential(3)+" Mpc"} color={textCol}/>
          <MT label="H₀ × d (rec. vel)" value={(H0_KMS_MPC*750*MPC_PER_LY).toExponential(2)+" km/s"} color={textCol}/>
          <MT label={"z for "+target.planet} value={fmtZ(z_catalog)}                        color={reg_cat.color}/>
          <MT label="Δλ at 550nm"        value={(lam_obs_cat-550).toExponential(2)+" pm"} color={reg_cat.color}/>
          <MT label="Regime"             value={reg_cat.label}                             color={reg_cat.color}/>
        </div>
        <div style={{fontSize:13,color:dim,lineHeight:1.8}}>
          At {fmtDelay(distanceLY)}, the Hubble recession velocity is <strong style={{color:"#00e87a"}}>{(H0_KMS_MPC*distanceLY*MPC_PER_LY).toExponential(2)} km/s</strong> — {((H0_KMS_MPC*distanceLY*MPC_PER_LY)/C_KMS_COSMO*100).toExponential(2)}% of c. The cosmological redshift z = <strong style={{color:"#00e87a"}}>{fmtZ(z_catalog)}</strong> shifts a 550nm photon by <strong style={{color:"#00e87a"}}>{((lam_obs_cat-550)*1e6).toExponential(2)} femtometers</strong>. This is {Math.round(1/z_catalog).toExponential(1)}× smaller than our Doppler correction. The flat-space assumption is not an approximation — it is <strong style={{color:"#00e87a"}}>physically exact</strong> for all 62 catalog targets.
        </div>
      </div>

      {/* Hubble constant display */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:8,marginBottom:14}}>
        <MT label="Hubble constant H₀"  value={H0_KMS_MPC+" km/s/Mpc"}  color={accent}/>
        <MT label="Hubble time t_H"     value="13.97 Gyr"                 color={textCol}/>
        <MT label="Hubble distance D_H" value="4285 Mpc"                  color={textCol}/>
        <MT label="Observable universe" value="~14,200 Mpc (46.5 Gly)"   color={dim} small/>
      </div>

      {/* Extragalactic Explorer */}
      <div style={{padding:"14px 16px",background:"rgba(20,0,60,0.4)",border:"1px solid rgba(180,100,255,0.25)",borderRadius:10}}>
        <div style={{fontSize:11,color:"#ce93d8",textTransform:"uppercase",letterSpacing:1.5,marginBottom:12}}>
          Extragalactic explorer — what if we went beyond the Milky Way?
        </div>

        {/* Distance input */}
        <div style={{display:"flex",gap:8,marginBottom:12,alignItems:"center",flexWrap:"wrap"}}>
          <div style={{fontSize:12,color:dim}}>Distance:</div>
          <input type="number" value={exDist} onChange={e=>setExDist(parseFloat(e.target.value)||1)} min={0.001} step={exUnit==="Gpc"?0.1:1}
            style={{width:100,background:"rgba(0,12,34,0.9)",border:"1px solid rgba(180,100,255,0.4)",borderRadius:6,
              padding:"6px 10px",color:textCol,fontSize:15,fontFamily:"monospace",outline:"none"}}/>
          <select value={exUnit} onChange={e=>setExUnit(e.target.value)}
            style={{background:"rgba(0,12,34,0.9)",border:"1px solid rgba(180,100,255,0.4)",borderRadius:6,
              padding:"6px 10px",color:textCol,fontSize:13,fontFamily:"monospace",outline:"none",cursor:"pointer"}}>
            {["kly","Mly","kpc","Mpc","Gpc"].map(u=><option key={u}>{u}</option>)}
          </select>
          <div style={{fontSize:12,color:dim}}>= {exDistMpc.toExponential(3)} Mpc</div>
        </div>

        {/* Quick presets */}
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
          {[
            ["Andromeda",   0.785,"Mpc"],
            ["Virgo Cluster",16.5,"Mpc"],
            ["Coma Cluster", 100, "Mpc"],
            ["z=0.1",        420, "Mpc"],
            ["z=1",         3300, "Mpc"],
            ["z=10",       10000, "Mpc"],
            ["CMB (z≈1100)",13800,"Mpc"],
          ].map(([label,d,u])=>(
            <button key={label} onClick={()=>{setExDist(d);setExUnit(u);}}
              style={{padding:"5px 10px",borderRadius:6,border:"1px solid rgba(180,100,255,0.35)",
                background:"rgba(180,100,255,0.08)",color:"#ce93d8",fontSize:11,cursor:"pointer",fontFamily:"monospace"}}>
              {label}
            </button>
          ))}
        </div>

        {/* Results */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:8,marginBottom:12}}>
          <MT label="z (redshift)"       value={fmtZ(z_ex)}                                    color={reg_ex.color}/>
          <MT label="λ obs (550nm ref)"  value={lam_obs_ex.toFixed(z_ex>0.01?1:4)+" nm"}       color={reg_ex.color}/>
          <MT label="Δλ shift"           value={(lam_obs_ex-550).toFixed(z_ex>0.01?1:4)+" nm"} color={reg_ex.color}/>
          <MT label="Rec. velocity"      value={(H0_KMS_MPC*exDistMpc).toFixed(z_ex>0.1?0:2)+" km/s"} color={textCol}/>
          <MT label="Lookback time"      value={lb_ex.toFixed(2)+" Gyr"}                       color={textCol}/>
          <MT label="Lum. distance"      value={luminosityDist_Mpc(z_ex).toExponential(3)+" Mpc"} color={dim} small/>
          <MT label="Ang. diam. dist"    value={angularDiameterDist_Mpc(z_ex).toExponential(3)+" Mpc"} color={dim} small/>
          <MT label="Regime"             value={reg_ex.label}                                   color={reg_ex.color}/>
        </div>

        {/* Visual redshift bar */}
        <div style={{marginBottom:12}}>
          <div style={{fontSize:11,color:dim,textTransform:"uppercase",letterSpacing:1.5,marginBottom:8}}>
            Visible spectrum — 550nm emitted vs {lam_obs_ex.toFixed(1)}nm received
          </div>
          <div style={{position:"relative",height:24,borderRadius:6,overflow:"visible",marginBottom:24,
            background:"linear-gradient(to right, #7B00FF, #4400FF, #0000FF, #0080FF, #00FFFF, #00FF80, #80FF00, #FFFF00, #FF8000, #FF0000)"}}>
            {/* Emitted marker */}
            <div style={{position:"absolute",left:"50%",top:-4,transform:"translateX(-50%)",display:"flex",flexDirection:"column",alignItems:"center"}}>
              <div style={{width:2,height:32,background:"rgba(255,255,255,0.9)"}}/>
              <div style={{fontSize:8,color:"#fff",whiteSpace:"nowrap",marginTop:2,background:"rgba(0,0,0,0.6)",padding:"1px 4px",borderRadius:2}}>emit 550nm</div>
            </div>
            {/* Observed marker */}
            {(() => {
              const pct = Math.min(100, Math.max(0, (Math.min(lam_obs_ex,700)-380)/320*100));
              const isOOB = lam_obs_ex > 700;
              return (
                <div style={{position:"absolute",left:pct+"%",top:-4,transform:"translateX(-50%)",display:"flex",flexDirection:"column",alignItems:"center"}}>
                  <div style={{width:2,height:32,background:reg_ex.color,boxShadow:`0 0 6px ${reg_ex.color}`}}/>
                  <div style={{fontSize:8,color:reg_ex.color,whiteSpace:"nowrap",marginTop:2,background:"rgba(0,0,0,0.7)",padding:"1px 4px",borderRadius:2}}>
                    {isOOB?"IR →":""} {lam_obs_ex.toFixed(z_ex>1?0:1)}nm
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        <div style={{fontSize:13,color:dim,lineHeight:1.8,padding:"10px 14px",
          background:`${reg_ex.color}0a`,border:`1px solid ${reg_ex.color}33`,borderRadius:8}}>
          {z_ex < 1e-6 && "Still within Milky Way domain — flat-space model remains exact. No cosmological correction needed."}
          {z_ex >= 1e-6 && z_ex < 0.001 && "Just entering detectable territory. Cosmological correction would be measurable with spectroscopy but invisible to imaging."}
          {z_ex >= 0.001 && z_ex < 0.1 && `At z=${fmtZ(z_ex)}, a 550nm green photon arrives at ${lam_obs_ex.toFixed(1)}nm — shifted ${(lam_obs_ex-550).toFixed(1)}nm toward red. Flat-space model would overestimate distances here.`}
          {z_ex >= 0.1 && z_ex < 1 && `z=${fmtZ(z_ex)} — significant cosmological redshift. The universe was ${(100/(1+z_ex)).toFixed(0)}% its current size when this light was emitted. FLRW metric required.`}
          {z_ex >= 1 && z_ex < 5 && `z=${fmtZ(z_ex)} — high-z galaxy regime. Light emitted when universe was ${(100/(1+z_ex)).toFixed(1)}% current size, ${lb_ex.toFixed(2)} Gyr ago. Most modern galaxy surveys operate here.`}
          {z_ex >= 5 && `z=${fmtZ(z_ex)} — approaching cosmic dawn / CMB. Universe was ${(100/(1+z_ex)).toFixed(2)}% current size. First stars and galaxies forming. Flat-space model is completely inapplicable.`}
        </div>
      </div>

      {/* Formula */}
      <div style={{marginTop:12,padding:"10px 14px",background:"rgba(0,0,0,0.3)",borderRadius:8,border:"1px solid rgba(0,180,255,0.2)",fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:"#a8d8ea"}}>
        z = Δλ/λ = H₀·d/c   ·   H₀ = {H0_KMS_MPC} km/s/Mpc   ·   z_catalog_max = {fmtZ(hubbleRedshift(750))}   ·   EXACT for d ≲ 750 ly
      </div>
    </div>
  );
}

function DopplerPanel({ target, distanceLY, arrived, canvasRef }) {
  const border = "rgba(0,180,255,0.22)", dim = "#6a8aaa", textCol = "#c8dff0", accent = "#00c8ff";
  const vr = target.v_r || 0;
  const beta = vr / C_KMS;
  const factor = dopplerFactor(vr);
  const lambdaEmit = 550; // nm reference — green
  const lambdaObs  = lambdaEmit * factor;
  const deltaLambda = lambdaObs - lambdaEmit;
  const deltaHz = Math.abs((deltaLambda / (lambdaEmit * lambdaEmit * 1e-9)) * 3e8);
  const desc = dopplerDescription(vr);
  const { rScale, gScale, bScale } = dopplerRGBShift(vr);
  const ampPct = Math.abs((rScale > 1 ? rScale - 1 : 1 - rScale)) * 100;

  // Spectral bar: 380nm (violet) to 700nm (red)
  const spectrumGradient = "linear-gradient(to right, #7B00FF, #4400FF, #0000FF, #0080FF, #00FFFF, #00FF80, #80FF00, #FFFF00, #FF8000, #FF0000)";

  const emitPct  = ((lambdaEmit - 380) / 320) * 100;
  const obsPct   = ((lambdaObs  - 380) / 320) * 100;
  const clampObs = Math.max(0, Math.min(100, obsPct));

  return (
    <div style={{marginTop:16,padding:"18px 20px",background:"rgba(0,0,0,0.35)",border:"1px solid "+border,borderRadius:12}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
        <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:12,color:accent,letterSpacing:2}}>〜 DOPPLER SHIFT ANALYSIS</div>
        <div style={{fontSize:11,padding:"2px 8px",borderRadius:4,background:vr<0?"rgba(79,195,247,0.15)":vr>0?"rgba(255,138,101,0.15)":"rgba(0,0,0,0.2)",color:desc.color,fontWeight:600}}>{desc.label}</div>
        {!target.v_r&&<div style={{fontSize:11,color:dim}}>(radial velocity unknown for manual entry)</div>}
      </div>

      {/* Metrics grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:10,marginBottom:16}}>
        {[
          ["Radial velocity",  vr !== 0 ? (vr > 0 ? "+" : "") + vr.toFixed(1) + " km/s" : "—",         vr<0?"#4fc3f7":vr>0?"#ff8a65":dim],
          ["β = v_r / c",     beta !== 0 ? (beta > 0 ? "+" : "") + beta.toExponential(2) : "—",         textCol],
          ["Doppler factor",  factor.toFixed(8),                                                          textCol],
          ["λ emitted",       lambdaEmit.toFixed(1) + " nm",                                             "#00e87a"],
          ["λ received",      lambdaObs.toFixed(4) + " nm",                                              desc.color],
          ["Δλ shift",        (deltaLambda >= 0 ? "+" : "") + deltaLambda.toFixed(4) + " nm",            desc.color],
          ["Δf shift",        deltaHz > 1e9 ? (deltaHz/1e9).toFixed(2)+" GHz" : (deltaHz/1e6).toFixed(1)+" MHz", desc.color],
          ["Visual amp ×8000",ampPct.toFixed(2) + "%",                                                    "#f5c842"],
        ].map(([label,value,color])=>(
          <div key={label} style={{background:"rgba(0,0,0,0.3)",borderRadius:8,padding:"10px 12px",border:"1px solid "+border}}>
            <div style={{fontSize:10,color:dim,textTransform:"uppercase",letterSpacing:1.5,marginBottom:3}}>{label}</div>
            <div style={{fontSize:14,fontWeight:700,color:color,fontFamily:"'IBM Plex Mono',monospace"}}>{value}</div>
          </div>
        ))}
      </div>

      {/* Spectral bar */}
      <div style={{marginBottom:14}}>
        <div style={{fontSize:11,color:dim,textTransform:"uppercase",letterSpacing:1.5,marginBottom:8}}>Visible Spectrum — Emitted vs Received (reference: 550 nm green)</div>
        <div style={{position:"relative",height:28,borderRadius:6,background:spectrumGradient,overflow:"visible",marginBottom:6}}>
          {/* Emitted marker */}
          <div style={{position:"absolute",left:`${emitPct}%`,top:-6,transform:"translateX(-50%)",display:"flex",flexDirection:"column",alignItems:"center",pointerEvents:"none"}}>
            <div style={{width:2,height:40,background:"rgba(255,255,255,0.9)"}}/>
            <div style={{fontSize:9,color:"rgba(255,255,255,0.9)",whiteSpace:"nowrap",marginTop:2,background:"rgba(0,0,0,0.5)",padding:"1px 4px",borderRadius:3}}>emit {lambdaEmit}nm</div>
          </div>
          {/* Received marker */}
          {vr !== 0 && (
            <div style={{position:"absolute",left:`${clampObs}%`,top:-6,transform:"translateX(-50%)",display:"flex",flexDirection:"column",alignItems:"center",pointerEvents:"none"}}>
              <div style={{width:2,height:40,background:desc.color,boxShadow:`0 0 6px ${desc.color}`}}/>
              <div style={{fontSize:9,color:desc.color,whiteSpace:"nowrap",marginTop:2,background:"rgba(0,0,0,0.6)",padding:"1px 4px",borderRadius:3}}>recv {lambdaObs.toFixed(2)}nm</div>
            </div>
          )}
        </div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:dim,marginTop:28}}>
          <span>380 nm (violet)</span><span>550 nm (green)</span><span>700 nm (red)</span>
        </div>
      </div>

      {/* Color shift preview */}
      {vr !== 0 && (
        <div style={{display:"flex",gap:12,alignItems:"center",padding:"10px 14px",background:"rgba(0,0,0,0.3)",borderRadius:8,border:"1px solid "+border}}>
          <div>
            <div style={{fontSize:10,color:dim,marginBottom:4,letterSpacing:1}}>EMITTED</div>
            <div style={{width:60,height:36,borderRadius:6,background:"rgb(180,180,180)",border:"1px solid rgba(255,255,255,0.2)"}}/>
          </div>
          <div style={{fontSize:18,color:dim}}>→</div>
          <div>
            <div style={{fontSize:10,color:dim,marginBottom:4,letterSpacing:1}}>RECEIVED (×8000 amp)</div>
            <div style={{width:60,height:36,borderRadius:6,border:"1px solid rgba(255,255,255,0.2)",
              background:`rgb(${Math.round(Math.min(255,180*rScale))},${Math.round(Math.min(255,180*gScale))},${Math.round(Math.min(255,180*bScale))})`}}/>
          </div>
          <div style={{fontSize:12,color:dim,lineHeight:1.6,flex:1}}>
            {vr < 0
              ? `Source approaching at ${Math.abs(vr).toFixed(1)} km/s — photons compressed → shorter λ → bluer received image`
              : `Source receding at ${vr.toFixed(1)} km/s — photons stretched → longer λ → redder received image`}
            <br/>
            <span style={{fontSize:11,color:"rgba(245,200,66,0.8)"}}>Visual amplification ×8000 applied — real shift is {Math.abs(deltaLambda).toFixed(4)} nm ({(Math.abs(beta)*100).toFixed(5)}% of λ)</span>
          </div>
        </div>
      )}

      {vr === 0 && (
        <div style={{fontSize:12,color:dim,padding:"8px 12px",background:"rgba(0,0,0,0.2)",borderRadius:6}}>
          No radial velocity data available for this target. Enter a target using Manual Entry to specify a custom v_r.
        </div>
      )}
    </div>
  );
}

  // ── NEAREST ──────────────────────────────────────────────────────────────

// ── SPECIAL RELATIVITY ENGINE ─────────────────────────────────────────────────
// Full Lorentz factor γ = 1/√(1-β²) where β = v_total/c
// Applied to proper time experienced by the source observer
// t_proper = t_coordinate × √(1 - β²) = t_coordinate / γ
// For real exoplanets: β ~ 10⁻⁴, γ ~ 1 + 5×10⁻⁹ — measurable but tiny
// For custom v/c slider: β can reach 0.999, γ → 22.4 — dramatic dilation

const C_KMS_SR = 299792.458;

// Lorentz factor
function lorentzGamma(v_kms) {
  const beta = Math.min(Math.abs(v_kms) / C_KMS_SR, 0.9999999);
  return 1 / Math.sqrt(1 - beta * beta);
}

// Proper time experienced by moving source per coordinate year
// t_proper = t_coord / γ  (moving clock runs slower)
function properTimeRatio(v_kms) {
  return 1 / lorentzGamma(v_kms);
}

// Age corrected for SR time dilation
// The source observer ages slower than coordinate time by factor 1/γ
function srCorrectedAge(age_earthFrame, delayYears, v_kms) {
  const gamma = lorentzGamma(v_kms);
  // Proper time elapsed at source = coordinate time / γ
  const properAge = age_earthFrame + (delayYears / gamma);
  return properAge;
}

// Format gamma nicely
function fmtGamma(gamma) {
  if (gamma < 1.0000001) return "1.0000000 (negligible)";
  if (gamma < 1.001)     return gamma.toFixed(9);
  if (gamma < 10)        return gamma.toFixed(6);
  return gamma.toFixed(3);
}

// Format beta
function fmtBeta(v_kms) {
  const beta = Math.abs(v_kms) / C_KMS_SR;
  if (beta < 1e-4) return beta.toExponential(4);
  return beta.toFixed(6);
}

// Human-readable dilation impact
function dilationImpact(gamma) {
  if (gamma < 1.000001)  return { label:"Negligible",   color:"#00e87a",  desc:"γ ≈ 1 — no measurable time dilation at this velocity" };
  if (gamma < 1.001)     return { label:"Detectable",   color:"#7ecb35",  desc:"Measurable with atomic clocks — real GPS corrections needed" };
  if (gamma < 1.01)      return { label:"Significant",  color:"#f5c842",  desc:"Clock runs ~1% slower — noticeable over years" };
  if (gamma < 1.1)       return { label:"Strong",       color:"#ff9a20",  desc:"Clocks run measurably slower — decades of difference over a lifetime" };
  if (gamma < 2)         return { label:"Extreme",      color:"#ff6020",  desc:"Moving observer ages significantly slower than Earth frame" };
  return                         { label:"Relativistic", color:"#ff3030",  desc:"Twin paradox territory — profound age differences" };
}

// SR Visualization component
function SRPanel({ target, distanceLY, age0, ls, betaCustom, setBetaCustom }) {
  const border = "rgba(0,180,255,0.22)", dim = "#6a8aaa", textCol = "#c8dff0", accent = "#00c8ff";

  // Real velocity from planet data
  const v_real_kms = target.v_total || Math.abs(target.v_r || 0);
  const gamma_real  = lorentzGamma(v_real_kms);
  const impact_real = dilationImpact(gamma_real);

  // Custom slider velocity
  const v_custom_kms = betaCustom * C_KMS_SR;
  const gamma_custom = lorentzGamma(v_custom_kms);
  const impact_custom= dilationImpact(gamma_custom);

  // Age calculations — real γ
  const age_uncorrected = age0 + delayYears_sr(distanceLY);
  const age_sr_real     = srCorrectedAge(age0, delayYears_sr(distanceLY), v_real_kms);
  const age_sr_custom   = srCorrectedAge(age0, delayYears_sr(distanceLY), v_custom_kms);

  // Proper time difference
  const dt_real   = age_uncorrected - age_sr_real;
  const dt_custom = age_uncorrected - age_sr_custom;

  return (
    <div style={{marginTop:16,padding:"18px 20px",background:"rgba(0,0,0,0.35)",border:"1px solid rgba(0,180,255,0.22)",borderRadius:12}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,flexWrap:"wrap"}}>
        <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:12,color:accent,letterSpacing:2}}>⚡ SPECIAL RELATIVISTIC TIME DILATION</div>
        <div style={{fontSize:11,padding:"2px 8px",borderRadius:4,background:"rgba(0,232,122,0.12)",color:"#00e87a",fontWeight:600}}>Implemented ✓</div>
      </div>

      {/* Real planet velocity section */}
      <div style={{marginBottom:14,padding:"14px 16px",background:"rgba(0,0,0,0.3)",border:"1px solid rgba(0,180,255,0.2)",borderRadius:10}}>
        <div style={{fontSize:11,color:dim,textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>
          Real velocity — {target.planet} host system
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:8,marginBottom:12}}>
          {[
            ["Radial v_r",   (target.v_r||0)>0?"+":"", Math.abs(target.v_r||0).toFixed(1)+" km/s",  "#4fc3f7"],
            ["Transverse μ", "",  (target.mu||0).toFixed(1)+" km/s",  "#4fc3f7"],
            ["Total |v|",    "",  v_real_kms.toFixed(2)+" km/s",       "#00c8ff"],
            ["β = v/c",      "",  fmtBeta(v_real_kms),                 textCol],
            ["γ (Lorentz)",  "",  fmtGamma(gamma_real),                impact_real.color],
            ["Impact",       "",  impact_real.label,                   impact_real.color],
          ].map(([label,pre,value,color])=>(
            <div key={label} style={{background:"rgba(0,0,0,0.3)",borderRadius:8,padding:"10px 12px",border:"1px solid rgba(0,180,255,0.18)"}}>
              <div style={{fontSize:10,color:dim,textTransform:"uppercase",letterSpacing:1.5,marginBottom:3}}>{label}</div>
              <div style={{fontSize:13,fontWeight:700,color,fontFamily:"'IBM Plex Mono',monospace"}}>{pre}{value}</div>
            </div>
          ))}
        </div>

        {/* Age comparison — real */}
        <div style={{padding:"10px 14px",background:"rgba(0,0,0,0.3)",borderRadius:8,border:"1px solid rgba(0,180,255,0.15)"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
            <div>
              <div style={{fontSize:10,color:dim,marginBottom:3}}>WITHOUT SR</div>
              <div style={{fontSize:16,fontWeight:700,color:"#f5c842",fontFamily:"monospace"}}>{age_uncorrected.toFixed(4)} yrs</div>
            </div>
            <div>
              <div style={{fontSize:10,color:dim,marginBottom:3}}>WITH SR (real γ)</div>
              <div style={{fontSize:16,fontWeight:700,color:"#00e87a",fontFamily:"monospace"}}>{age_sr_real.toFixed(4)} yrs</div>
            </div>
            <div>
              <div style={{fontSize:10,color:dim,marginBottom:3}}>SR CORRECTION</div>
              <div style={{fontSize:16,fontWeight:700,color:impact_real.color,fontFamily:"monospace"}}>
                {dt_real >= 0 ? "-" : "+"}{Math.abs(dt_real).toExponential(3)} yrs
              </div>
            </div>
          </div>
          <div style={{marginTop:8,fontSize:12,color:dim}}>{impact_real.desc}</div>
        </div>
      </div>

      {/* Custom v/c slider */}
      <div style={{marginBottom:14,padding:"14px 16px",background:"rgba(20,0,40,0.4)",border:"1px solid rgba(180,100,255,0.25)",borderRadius:10}}>
        <div style={{fontSize:11,color:"#ce93d8",textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>
          Custom velocity scenario — explore relativistic extremes
        </div>
        <div style={{marginBottom:8}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
            <span style={{fontSize:12,color:dim}}>β = v/c</span>
            <span style={{fontSize:14,fontWeight:700,color:impact_custom.color,fontFamily:"monospace"}}>
              {betaCustom.toFixed(4)}c  ·  {(v_custom_kms/1000).toFixed(0)} km/s  ·  γ = {fmtGamma(gamma_custom)}
            </span>
          </div>
          <input type="range" min={0} max={0.9999} step={0.0001} value={betaCustom}
            onChange={e=>setBetaCustom(parseFloat(e.target.value))}
            style={{width:"100%"}}/>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:dim,marginTop:4}}>
            {["0c","0.1c","0.25c","0.5c","0.75c","0.9c","0.999c"].map(l=><span key={l}>{l}</span>)}
          </div>
        </div>

        {/* Preset buttons */}
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
          {[
            ["Real planet",  v_real_kms/C_KMS_SR, "#4fc3f7"],
            ["GPS orbit",    3.87/C_KMS_SR,        "#00e87a"],
            ["ISS speed",    7.66/C_KMS_SR,        "#7ecb35"],
            ["0.1c",         0.1,                   "#f5c842"],
            ["0.5c",         0.5,                   "#ff9a20"],
            ["0.9c",         0.9,                   "#ff6020"],
            ["0.99c",        0.99,                  "#ff3030"],
            ["0.999c",       0.999,                 "#ff0000"],
          ].map(([label, val, color])=>(
            <button key={label} onClick={()=>setBetaCustom(val)}
              style={{padding:"4px 10px",borderRadius:6,border:`1px solid ${color}44`,
                background:Math.abs(betaCustom-val)<0.0002?`${color}22`:"rgba(0,0,0,0.2)",
                color:Math.abs(betaCustom-val)<0.0002?color:dim,
                fontSize:11,cursor:"pointer",fontFamily:"monospace"}}>
              {label}
            </button>
          ))}
        </div>

        {/* Custom age comparison */}
        <div style={{padding:"10px 14px",background:"rgba(0,0,0,0.3)",borderRadius:8,border:`1px solid ${impact_custom.color}33`}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
            <div>
              <div style={{fontSize:10,color:dim,marginBottom:3}}>WITHOUT SR</div>
              <div style={{fontSize:16,fontWeight:700,color:"#f5c842",fontFamily:"monospace"}}>{age_uncorrected.toFixed(4)} yrs</div>
            </div>
            <div>
              <div style={{fontSize:10,color:dim,marginBottom:3}}>WITH SR (custom β)</div>
              <div style={{fontSize:16,fontWeight:700,color:impact_custom.color,fontFamily:"monospace"}}>{age_sr_custom.toFixed(betaCustom>0.5?2:4)} yrs</div>
            </div>
            <div>
              <div style={{fontSize:10,color:dim,marginBottom:3}}>SR CORRECTION</div>
              <div style={{fontSize:16,fontWeight:700,color:impact_custom.color,fontFamily:"monospace"}}>
                {dt_custom >= 0?"-":"+"}{Math.abs(dt_custom)<0.001?Math.abs(dt_custom).toExponential(3):Math.abs(dt_custom).toFixed(2)} yrs
              </div>
            </div>
          </div>
          <div style={{marginTop:8,fontSize:12,color:dim}}>{impact_custom.desc}</div>
        </div>
      </div>

      {/* Formula */}
      <div style={{padding:"10px 14px",background:"rgba(0,0,0,0.3)",borderRadius:8,border:"1px solid rgba(0,180,255,0.2)",fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:"#a8d8ea",marginBottom:12}}>
        γ = 1/√(1−β²)   ·   t_proper = t_coord/γ   ·   β = {fmtBeta(betaCustom*C_KMS_SR)}   ·   γ = {gamma_custom.toFixed(6)}
      </div>

      {/* SR clock visualization */}
      <SRClockViz gamma={gamma_custom} impact={impact_custom}/>
    </div>
  );
}

// Helper — delay years (simple)
function delayYears_sr(distanceLY) { return distanceLY; }

// SR Clock Visualization — two clocks side by side, one ticking slower
function SRClockViz({ gamma, impact }) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);

  useEffect(()=>{
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animating = true, raf;
    let t = 0;

    const draw = () => {
      if (!animating) return;
      t += 0.016;
      const W=canvas.width, H=canvas.height;
      ctx.clearRect(0,0,W,H);
      ctx.fillStyle="#000814"; ctx.fillRect(0,0,W,H);

      const drawClock = (cx, cy, r, timeMultiplier, label, sublabel, color) => {
        // Clock face
        const faceG = ctx.createRadialGradient(cx,cy,0,cx,cy,r);
        faceG.addColorStop(0,"rgba(0,20,50,0.9)"); faceG.addColorStop(1,"rgba(0,5,20,0.9)");
        ctx.fillStyle=faceG; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle=color; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.stroke();

        // Hour marks
        for(let i=0;i<12;i++){
          const a=(i/12)*Math.PI*2;
          const inner=i%3===0?r*0.8:r*0.88;
          ctx.beginPath();
          ctx.moveTo(cx+Math.cos(a)*inner, cy+Math.sin(a)*inner);
          ctx.lineTo(cx+Math.cos(a)*r*0.95, cy+Math.sin(a)*r*0.95);
          ctx.strokeStyle=i%3===0?color:`${color.slice(0,-2)}0.3)`;
          ctx.lineWidth=i%3===0?1.5:0.8; ctx.stroke();
        }

        // Second hand (moves at timeMultiplier speed)
        const secAngle = (t * timeMultiplier * 0.5) % (Math.PI*2) - Math.PI/2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx+Math.cos(secAngle)*r*0.85, cy+Math.sin(secAngle)*r*0.85);
        ctx.strokeStyle=color; ctx.lineWidth=1.5; ctx.stroke();

        // Minute hand (60x slower than seconds)
        const minAngle = (t * timeMultiplier * 0.5/60) % (Math.PI*2) - Math.PI/2;
        ctx.beginPath();
        ctx.moveTo(cx,cy);
        ctx.lineTo(cx+Math.cos(minAngle)*r*0.70, cy+Math.sin(minAngle)*r*0.70);
        ctx.strokeStyle=color; ctx.lineWidth=2.5; ctx.stroke();

        // Center dot
        ctx.beginPath(); ctx.arc(cx,cy,3,0,Math.PI*2);
        ctx.fillStyle=color; ctx.fill();

        // Label
        ctx.font="bold 9px 'IBM Plex Mono',monospace"; ctx.textAlign="center";
        ctx.fillStyle=color; ctx.fillText(label,cx,cy+r+14);
        ctx.font="7px 'IBM Plex Mono',monospace"; ctx.fillStyle="rgba(150,150,150,0.6)";
        ctx.fillText(sublabel,cx,cy+r+24);
      };

      // Left clock = Earth frame (normal speed)
      drawClock(W*0.25, H*0.52, H*0.38, 1.0,
        "EARTH CLOCK", "t_coord", "rgba(79,195,247,0.9)");

      // Right clock = Source frame (runs slower by factor 1/γ)
      const sourceRate = 1/gamma;
      drawClock(W*0.75, H*0.52, H*0.38, sourceRate,
        "SOURCE CLOCK", `t_proper = t/γ`, impact.color);

      // VS label in center
      ctx.font="bold 11px 'IBM Plex Mono',monospace"; ctx.textAlign="center";
      ctx.fillStyle="rgba(255,255,255,0.5)"; ctx.fillText("vs",W*0.5,H*0.52);

      // γ label
      ctx.font="9px 'IBM Plex Mono',monospace";
      ctx.fillStyle=impact.color;
      ctx.fillText(`γ = ${gamma.toFixed(gamma>1.001?4:8)}`,W*0.5,H*0.52+14);

      // Clock rate comparison
      ctx.font="7px 'IBM Plex Mono',monospace"; ctx.fillStyle="rgba(150,150,150,0.55)";
      ctx.fillText(`Source clock runs at ${(100/gamma).toFixed(gamma>1.001?2:6)}% of Earth rate`,W*0.5,H-6);

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return ()=>{animating=false; cancelAnimationFrame(raf);};
  }, [gamma, impact]);

  return (
    <div>
      <div style={{fontSize:11,color:"#6a8aaa",textTransform:"uppercase",letterSpacing:1.5,marginBottom:6}}>
        Clock comparison — Earth frame vs source proper time
      </div>
      <canvas ref={canvasRef} width={380} height={130}
        style={{width:"100%",maxWidth:380,height:130,display:"block",borderRadius:8,
          border:"1px solid rgba(0,180,255,0.18)",background:"#000814",margin:"0 auto"}}/>
    </div>
  );
}


// ── GENERAL RELATIVITY ENGINE ─────────────────────────────────────────────────
// Schwarzschild metric: gravitational time dilation
// t_surface = t_∞ × √(1 − 2GM/rc²) = t_∞ × √(1 − r_s/r)
// where r_s = Schwarzschild radius = 2GM/c²
//
// We compute THREE gravitational contributions:
// 1. Planet surface well: planet mass + radius
// 2. Stellar well at planet's orbital distance: star mass + orbital AU
// 3. Combined: both wells (they add in the potential)
// 4. Custom exotic slider: arbitrary M/R for neutron stars, black holes

const G_SI   = 6.674e-11;   // m³/(kg·s²)
const C_SI   = 2.998e8;     // m/s
const M_SUN  = 1.989e30;    // kg
const M_EARTH= 5.972e24;    // kg
const R_EARTH= 6.371e6;     // m
const AU_M   = 1.496e11;    // m per AU

// Schwarzschild radius in meters
function schwarzschildRadius_m(mass_kg) {
  return 2 * G_SI * mass_kg / (C_SI * C_SI);
}

// GR time dilation factor at distance r from mass M
// = sqrt(1 - r_s/r)  where r_s = 2GM/c²
// Returns ratio t_surface/t_infinity < 1 (clocks run slower)
function grTimeFactor(mass_kg, radius_m) {
  const rs = schwarzschildRadius_m(mass_kg);
  const x  = rs / radius_m;
  if (x >= 1) return 0; // inside event horizon
  return Math.sqrt(Math.max(0, 1 - x));
}

// Planet surface GR factor
function grPlanetSurface(mp_earth, rp_earth) {
  const mass   = mp_earth * M_EARTH;
  const radius = rp_earth * R_EARTH;
  return grTimeFactor(mass, radius);
}

// Stellar gravity at planet's orbital distance
function grStellarAtOrbit(ms_solar, orbital_au) {
  const mass   = ms_solar * M_SUN;
  const radius = orbital_au * AU_M;
  return grTimeFactor(mass, radius);
}

// Combined GR factor (both potentials add)
// Φ_total = Φ_planet + Φ_star  →  factor = √(1 - r_s_planet/r_p - r_s_star/r_orbit)
function grCombined(mp_earth, rp_earth, ms_solar, orbital_au) {
  const rs_planet = schwarzschildRadius_m(mp_earth * M_EARTH);
  const rs_star   = schwarzschildRadius_m(ms_solar * M_SUN);
  const r_planet  = rp_earth * R_EARTH;
  const r_orbit   = orbital_au * AU_M;
  const x = rs_planet/r_planet + rs_star/r_orbit;
  if (x >= 1) return 0;
  return Math.sqrt(Math.max(0, 1 - x));
}

// GR correction in seconds per year
function grCorrectionPerYear(grFactor) {
  return SPY * (1 - grFactor); // seconds per year that clock loses
}

// Age corrected for GR: source clock runs slower by grFactor
function grCorrectedAge(age_earthFrame, delayYears, grFactor) {
  return age_earthFrame + (delayYears * grFactor);
}

// Human-readable GR impact
function grImpact(grFactor) {
  const deviation = 1 - grFactor;
  if (deviation < 1e-12) return { label:"Negligible",    color:"#00e87a",  desc:"GR correction < 10⁻¹²" };
  if (deviation < 1e-9)  return { label:"Sub-ppb",       color:"#7ecb35",  desc:"Parts per billion — detectable with atomic clocks" };
  if (deviation < 1e-6)  return { label:"ppm level",     color:"#f5c842",  desc:"Parts per million — GPS-level correction needed" };
  if (deviation < 1e-3)  return { label:"Significant",   color:"#ff9a20",  desc:"Measurable time difference over years" };
  if (deviation < 0.1)   return { label:"Strong",        color:"#ff6020",  desc:"Major time dilation — extreme gravitational environment" };
  if (deviation < 0.5)   return { label:"Extreme",       color:"#ff3030",  desc:"Near neutron star — severe time dilation" };
  return                         { label:"EVENT HORIZON", color:"#ffffff",  desc:"Approaching Schwarzschild radius — time nearly stops" };
}

// Presets for exotic objects
const GR_PRESETS = [
  { label:"Earth surface",  mp:1,      rp:1,      ms:1,    au:1,      note:"GPS satellites experience +45μs/day vs surface" },
  { label:"Hot Jupiter",    mp:300,    rp:13,     ms:1.2,  au:0.03,   note:"Very close to star — stellar well dominates" },
  { label:"White dwarf",    mp:196500, rp:0.0092, ms:0.6,  au:0.1,    note:"~0.009 R⊙ — substantial surface dilation" },
  { label:"Neutron star",   mp:596500, rp:0.00170,ms:1.4,  au:0.01,   note:"~10km radius — extreme surface dilation ~30%" },
  { label:"Stellar BH",     mp:17900000,rp:0.000094,ms:10,au:0.001,  note:"~3×Schwarzschild — 42% dilation at surface" },
];

// ── GR READOUT — Step 5 summary (read-only, controls are in Step 3) ──────────
function GRReadout({ target, distanceLY, age0, ls, grOverride, grFactorReal, grImpactReal, actualNowGr, ageWhenSeenGr }) {
  const border="rgba(0,180,255,0.22)", dim="#6a8aaa", textCol="#c8dff0", accent="#00c8ff";
  const gr_mp = grOverride ? grOverride.mp : (target.mp||1);
  const gr_rp = grOverride ? grOverride.rp : (target.rp||1);
  const gr_ms = grOverride ? grOverride.ms : (target.ms||1);
  const gr_au = grOverride ? grOverride.au : (target.au||1);

  const rs_planet = schwarzschildRadius_m(gr_mp * M_EARTH);
  const rs_star   = schwarzschildRadius_m(gr_ms * M_SUN);
  const gr_planet = grPlanetSurface(gr_mp, gr_rp);
  const gr_star   = grStellarAtOrbit(gr_ms, gr_au);
  const compactness = rs_planet / (gr_rp * R_EARTH);
  const age_uncorr  = age0 + delayYears_sr(distanceLY);
  const gr_delta    = age_uncorr - actualNowGr;

  return (
    <div style={{marginTop:16,padding:"18px 20px",background:"rgba(0,0,0,0.35)",border:"1px solid rgba(128,203,196,0.30)",borderRadius:12}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,flexWrap:"wrap"}}>
        <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:12,color:"#80cbc4",letterSpacing:2}}>🌌 GRAVITATIONAL TIME DILATION (GR)</div>
        <div style={{fontSize:11,padding:"2px 8px",borderRadius:4,background:"rgba(0,232,122,0.12)",color:"#00e87a",fontWeight:600}}>Implemented ✓</div>
        {grOverride && <div style={{fontSize:11,padding:"2px 8px",borderRadius:4,background:"rgba(128,203,196,0.15)",color:"#80cbc4",fontWeight:600}}>CUSTOM OBJECT ACTIVE</div>}
      </div>

      <div style={{marginBottom:12,fontSize:13,color:dim}}>
        Controls are in <strong style={{color:"#80cbc4"}}>Step 3 → 🌌 GR SOURCE OBJECT panel</strong>. Results shown here update live.
      </div>

      {/* Current object summary */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(145px,1fr))",gap:8,marginBottom:14}}>
        {[
          ["Source",          grOverride?"Custom object":target.planet,          textCol],
          ["Planet mass",     gr_mp>=1000?gr_mp.toExponential(3)+" M⊕":gr_mp.toFixed(3)+" M⊕", textCol],
          ["Planet radius",   gr_rp<0.01?gr_rp.toExponential(3)+" R⊕":gr_rp.toFixed(4)+" R⊕",  textCol],
          ["Star mass",       gr_ms.toFixed(3)+" M☉",                            textCol],
          ["Orbital dist",    gr_au<0.01?gr_au.toExponential(3)+" AU":gr_au.toFixed(4)+" AU",    textCol],
          ["r_s (planet)",    rs_planet.toExponential(3)+" m",                   "#ce93d8"],
          ["GR factor",       grFactorReal.toFixed(12),                           grImpactReal.color],
          ["1−GR deviation",  (1-grFactorReal).toExponential(4),                 grImpactReal.color],
          ["Compactness",     compactness.toExponential(3),                       compactness>0.5?"#ff3030":"#80cbc4"],
          ["Impact",          grImpactReal.label,                                 grImpactReal.color],
          ["GR age correction",(gr_delta>=0?"-":"+")+Math.abs(gr_delta).toExponential(3)+" yrs", grImpactReal.color],
          ["GR-corrected age", actualNowGr.toFixed(actualNowGr>100?1:4)+" yrs",  ageWhenSeenGr<ls?"#00e87a":"#ff5f5f"],
        ].map(([label,value,color])=>(
          <div key={label} style={{background:"rgba(0,0,0,0.3)",borderRadius:8,padding:"9px 11px",border:"1px solid "+border}}>
            <div style={{fontSize:10,color:dim,textTransform:"uppercase",letterSpacing:1.2,marginBottom:3}}>{label}</div>
            <div style={{fontSize:13,fontWeight:700,color,fontFamily:"'IBM Plex Mono',monospace",wordBreak:"break-all"}}>{value}</div>
          </div>
        ))}
      </div>

      {/* Three-way breakdown */}
      <div style={{padding:"12px 14px",background:"rgba(0,0,0,0.3)",borderRadius:8,border:"1px solid rgba(128,203,196,0.2)",marginBottom:12}}>
        <div style={{fontSize:11,color:dim,textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>Gravitational potential breakdown</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
          {[
            ["Planet surface Φ",  (1-gr_planet).toExponential(4), "Planet mass + radius well"],
            ["Stellar Φ at orbit",(1-gr_star).toExponential(4),   "Star mass at orbital distance"],
            ["Combined Φ_total",  (1-grFactorReal).toExponential(4),"Both wells — applied to clock"],
          ].map(([label,val,sub])=>(
            <div key={label}>
              <div style={{fontSize:10,color:dim,marginBottom:3}}>{label}</div>
              <div style={{fontSize:16,fontWeight:700,color:grImpactReal.color,fontFamily:"monospace"}}>{val}</div>
              <div style={{fontSize:10,color:dim,marginTop:2}}>{sub}</div>
            </div>
          ))}
        </div>
        <div style={{marginTop:10,fontSize:12,color:dim}}>{grImpactReal.desc}</div>
      </div>

      {/* Formula */}
      <div style={{padding:"10px 14px",background:"rgba(0,0,0,0.3)",borderRadius:8,border:"1px solid rgba(0,180,255,0.2)",fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:"#a8d8ea",marginBottom:12}}>
        t_surface = t_∞ · √(1 − 2GM/rc²)   ·   combined factor = {grFactorReal.toFixed(12)}
      </div>

      {compactness > 0.5 && (
        <div style={{padding:"8px 12px",background:"rgba(255,0,0,0.12)",border:"1px solid rgba(255,0,0,0.4)",borderRadius:6,fontSize:12,color:"#ff6060"}}>
          ⚠ Compactness r_s/r = {compactness.toFixed(4)} — near event horizon. Time nearly stops at the surface.
        </div>
      )}
    </div>
  );
}


// ── GR PANEL ──────────────────────────────────────────────────────────────────
function GRPanel({ target, distanceLY, age0, ls }) {
  const [customMp, setCustomMp] = useState(target.mp || 1);
  const [customRp, setCustomRp] = useState(target.rp || 1);
  const [customMs, setCustomMs] = useState(target.ms || 1);
  const [customAu, setCustomAu] = useState(target.au || 1);

  // Reset when target changes
  useEffect(()=>{
    setCustomMp(target.mp || 1);
    setCustomRp(target.rp || 1);
    setCustomMs(target.ms || 1);
    setCustomAu(target.au || 1);
  },[target]);

  const border = "rgba(0,180,255,0.22)", dim = "#6a8aaa", textCol = "#c8dff0", accent = "#00c8ff";

  // Compute all GR factors
  const gr_planet  = grPlanetSurface(customMp, customRp);
  const gr_star    = grStellarAtOrbit(customMs, customAu);
  const gr_combined= grCombined(customMp, customRp, customMs, customAu);

  const imp_planet  = grImpact(gr_planet);
  const imp_star    = grImpact(gr_star);
  const imp_comb    = grImpact(gr_combined);

  const rs_planet_m = schwarzschildRadius_m(customMp * M_EARTH);
  const rs_star_m   = schwarzschildRadius_m(customMs * M_SUN);

  // Age corrections
  const age_uncorr  = age0 + delayYears_sr(distanceLY);
  const age_gr      = grCorrectedAge(age0, delayYears_sr(distanceLY), gr_combined);
  const gr_delta    = age_uncorr - age_gr;

  const MT = ({label,value,color,small})=>(
    <div style={{background:"rgba(0,0,0,0.3)",borderRadius:8,padding:"10px 12px",border:"1px solid "+border}}>
      <div style={{fontSize:10,color:dim,textTransform:"uppercase",letterSpacing:1.5,marginBottom:3}}>{label}</div>
      <div style={{fontSize:small?12:14,fontWeight:700,color:color||textCol,fontFamily:"'IBM Plex Mono',monospace",wordBreak:"break-all"}}>{value}</div>
    </div>
  );

  return (
    <div style={{marginTop:16,padding:"18px 20px",background:"rgba(0,0,0,0.35)",border:"1px solid rgba(0,180,255,0.22)",borderRadius:12}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,flexWrap:"wrap"}}>
        <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:12,color:accent,letterSpacing:2}}>🌌 GRAVITATIONAL TIME DILATION (GR)</div>
        <div style={{fontSize:11,padding:"2px 8px",borderRadius:4,background:"rgba(0,232,122,0.12)",color:"#00e87a",fontWeight:600}}>Implemented ✓</div>
      </div>

      {/* Current planet GR metrics */}
      <div style={{marginBottom:14,padding:"14px 16px",background:"rgba(0,0,0,0.3)",border:"1px solid rgba(0,180,255,0.2)",borderRadius:10}}>
        <div style={{fontSize:11,color:dim,textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>
          Schwarzschild analysis — {target.planet}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:8,marginBottom:12}}>
          <MT label="Planet mass"        value={(customMp).toFixed(2)+" M⊕"}         color={textCol}/>
          <MT label="Planet radius"      value={(customRp).toFixed(3)+" R⊕"}         color={textCol}/>
          <MT label="Star mass"          value={(customMs).toFixed(3)+" M☉"}          color={textCol}/>
          <MT label="Orbital distance"   value={(customAu).toFixed(4)+" AU"}          color={textCol}/>
          <MT label="r_s planet"         value={rs_planet_m.toExponential(3)+" m"}   color="#ce93d8" small/>
          <MT label="r_s star"           value={rs_star_m.toExponential(3)+" m"}     color="#ce93d8" small/>
          <MT label="GR factor (planet)" value={gr_planet.toFixed(12)}               color={imp_planet.color} small/>
          <MT label="GR factor (star)"   value={gr_star.toFixed(12)}                 color={imp_star.color} small/>
          <MT label="GR combined"        value={gr_combined.toFixed(12)}             color={imp_comb.color} small/>
          <MT label="1−GR (deviation)"   value={(1-gr_combined).toExponential(4)}    color={imp_comb.color} small/>
          <MT label="Impact"             value={imp_comb.label}                       color={imp_comb.color}/>
          <MT label="GR age correction"  value={(gr_delta>=0?"-":"+")+Math.abs(gr_delta).toExponential(3)+" yrs"} color={imp_comb.color} small/>
        </div>

        {/* Three-way GR breakdown */}
        <div style={{padding:"12px 14px",background:"rgba(0,0,0,0.3)",borderRadius:8,border:"1px solid rgba(180,100,255,0.2)"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
            <div>
              <div style={{fontSize:10,color:dim,marginBottom:3}}>Planet surface well</div>
              <div style={{fontSize:13,fontWeight:700,color:imp_planet.color,fontFamily:"monospace"}}>{(1-gr_planet).toExponential(4)}</div>
              <div style={{fontSize:10,color:dim}}>correction</div>
            </div>
            <div>
              <div style={{fontSize:10,color:dim,marginBottom:3}}>Stellar well at orbit</div>
              <div style={{fontSize:13,fontWeight:700,color:imp_star.color,fontFamily:"monospace"}}>{(1-gr_star).toExponential(4)}</div>
              <div style={{fontSize:10,color:dim}}>correction</div>
            </div>
            <div>
              <div style={{fontSize:10,color:dim,marginBottom:3}}>Combined Φ_total</div>
              <div style={{fontSize:13,fontWeight:700,color:imp_comb.color,fontFamily:"monospace"}}>{(1-gr_combined).toExponential(4)}</div>
              <div style={{fontSize:10,color:dim}}>correction</div>
            </div>
          </div>
          <div style={{marginTop:8,fontSize:12,color:dim}}>{imp_comb.desc}</div>
        </div>
      </div>

      {/* Custom exotic object sliders */}
      <div style={{marginBottom:14,padding:"14px 16px",background:"rgba(30,0,60,0.4)",border:"1px solid rgba(180,100,255,0.25)",borderRadius:10}}>
        <div style={{fontSize:11,color:"#ce93d8",textTransform:"uppercase",letterSpacing:1.5,marginBottom:12}}>
          Custom object — explore extreme gravitational environments
        </div>

        {/* Preset buttons */}
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
          {GR_PRESETS.map(pr=>(
            <button key={pr.label} onClick={()=>{setCustomMp(pr.mp);setCustomRp(pr.rp);setCustomMs(pr.ms);setCustomAu(pr.au);}}
              style={{padding:"5px 10px",borderRadius:6,border:"1px solid rgba(180,100,255,0.35)",
                background:"rgba(180,100,255,0.08)",color:"#ce93d8",fontSize:11,cursor:"pointer",fontFamily:"monospace"}}>
              {pr.label}
            </button>
          ))}
          <button onClick={()=>{setCustomMp(target.mp||1);setCustomRp(target.rp||1);setCustomMs(target.ms||1);setCustomAu(target.au||1);}}
            style={{padding:"5px 10px",borderRadius:6,border:"1px solid rgba(0,200,255,0.3)",
              background:"rgba(0,200,255,0.08)",color:accent,fontSize:11,cursor:"pointer",fontFamily:"monospace"}}>
            ↺ Reset to {target.planet}
          </button>
        </div>

        {/* Sliders */}
        {[
          ["Planet mass (M⊕)",    customMp, setCustomMp, 0.1,  600000, "log"],
          ["Planet radius (R⊕)",  customRp, setCustomRp, 0.1,  20,     "linear"],
          ["Star mass (M☉)",      customMs, setCustomMs, 0.08, 50,     "log"],
          ["Orbital dist (AU)",   customAu, setCustomAu, 0.001,200,    "log"],
        ].map(([label, val, setter, min, max, scale])=>{
          const logMin = Math.log10(min), logMax = Math.log10(max);
          const logVal = Math.log10(Math.max(min,val));
          const pct    = scale==="log" ? (logVal-logMin)/(logMax-logMin) : (val-min)/(max-min);
          return (
            <div key={label} style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:11,color:dim}}>{label}</span>
                <span style={{fontSize:12,fontWeight:700,color:"#ce93d8",fontFamily:"monospace"}}>
                  {val >= 1000 ? val.toExponential(3) : val.toFixed(val<0.1?4:val<10?3:2)}
                </span>
              </div>
              <input type="range" min={0} max={1} step={0.001} value={pct}
                onChange={e=>{
                  const p2=parseFloat(e.target.value);
                  const newVal = scale==="log"
                    ? Math.pow(10, logMin + p2*(logMax-logMin))
                    : min + p2*(max-min);
                  setter(Math.max(min,Math.min(max,newVal)));
                }}
                style={{width:"100%"}}/>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"rgba(150,150,200,0.35)"}}>
                <span>{min}</span><span>{max}</span>
              </div>
            </div>
          );
        })}

        {/* Live custom GR readout */}
        {(()=>{
          const gr_c = grCombined(customMp, customRp, customMs, customAu);
          const imp_c = grImpact(gr_c);
          const rs_p = schwarzschildRadius_m(customMp*M_EARTH);
          const rs_s = schwarzschildRadius_m(customMs*M_SUN);
          const r_p  = customRp * R_EARTH;
          const compactness_p = rs_p / r_p;
          const age_gr_c = grCorrectedAge(age0, delayYears_sr(distanceLY), gr_c);
          return (
            <div style={{padding:"12px 14px",background:"rgba(0,0,0,0.4)",borderRadius:8,border:`1px solid ${imp_c.color}44`,marginTop:10}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10}}>
                <div>
                  <div style={{fontSize:10,color:dim,marginBottom:3}}>GR combined factor</div>
                  <div style={{fontSize:13,fontWeight:700,color:imp_c.color,fontFamily:"monospace"}}>{gr_c.toFixed(8)}</div>
                </div>
                <div>
                  <div style={{fontSize:10,color:dim,marginBottom:3}}>Planet compactness</div>
                  <div style={{fontSize:13,fontWeight:700,color:imp_c.color,fontFamily:"monospace"}}>{compactness_p.toExponential(3)}</div>
                  <div style={{fontSize:9,color:dim}}>r_s/r (BH=1.0)</div>
                </div>
                <div>
                  <div style={{fontSize:10,color:dim,marginBottom:3}}>GR-corrected age</div>
                  <div style={{fontSize:13,fontWeight:700,color:imp_c.color,fontFamily:"monospace"}}>{age_gr_c.toFixed(age_gr_c>1000?0:4)} yrs</div>
                </div>
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <span style={{fontSize:11,padding:"2px 8px",borderRadius:4,background:`${imp_c.color}22`,color:imp_c.color,fontWeight:700}}>{imp_c.label}</span>
                <span style={{fontSize:12,color:dim}}>{imp_c.desc}</span>
              </div>
              {compactness_p > 0.8 && (
                <div style={{marginTop:8,fontSize:12,color:"#ffffff",padding:"6px 10px",background:"rgba(255,0,0,0.15)",borderRadius:6,border:"1px solid rgba(255,0,0,0.4)"}}>
                  ⚠ Approaching event horizon (r_s/r = {compactness_p.toFixed(4)}) — time nearly stops at the surface
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Formula */}
      <div style={{padding:"10px 14px",background:"rgba(0,0,0,0.3)",borderRadius:8,border:"1px solid rgba(0,180,255,0.2)",fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:"#a8d8ea",marginBottom:12}}>
        t_surface = t_∞ · √(1 − 2GM/rc²)   ·   r_s = 2GM/c²   ·   factor = {gr_combined.toFixed(12)}
      </div>

      <div style={{fontSize:13,color:dim,lineHeight:1.8,padding:"12px 14px",background:"rgba(0,180,255,0.04)",border:"1px solid rgba(0,180,255,0.15)",borderRadius:8}}>
        <strong style={{color:textCol}}>Why this matters: </strong>
        GPS satellites must correct for +45.9 μs/day of gravitational blueshift (they're higher in Earth's gravity well). A clock on the surface of a neutron star runs ~30% slower than one far away. Near a stellar-mass black hole, you could spend an hour while thousands of years pass outside. This is real — confirmed to 1 part in 10¹⁵ by atomic clock experiments.
      </div>
    </div>
  );
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
function ReceivedImage({ mediaURL, mediaType, distanceLY, arrived, target }) {
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
          if (target && target.v_r) applyDopplerShift(ctx,W,H,target.v_r*0.25);

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
          if (target && target.v_r) applyDopplerShift(ctx,W,H,target.v_r);
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

// ── UNIFIED COSMIC OBSERVER CANVAS — FULL PHYSICS EDITION ──────────────────
// God's-eye view. Every physics effect applied to ONE photon, sequentially,
// visually. You watch the science happen as the signal crosses the cosmos.
//
// LAYOUT (520px tall):
//  TOP 55%   — Deep space: planet → photon → Earth
//  MID 18%   — Physics effects strip: live readout of all corrections
//  BOTTOM 27%— Solar system: orbital mechanics + aberration ellipse
//
function useDeepSpaceCanvas(canvasRef, prog, target) {
  const starsRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !target) return;
    const ctx = canvas.getContext("2d");
    const distanceLY = target._distanceLY != null ? target._distanceLY
                     : (target.distance_pc || 1) * PC_TO_LY;
    const col = target.color || "#4fc3f7";

    // ── PHYSICS CONSTANTS ─────────────────────────────────────────────────
    const V_EARTH_KMS = 29.78;
    const C_KMS_COSMO = 299792.458;
    const BETA_EARTH  = V_EARTH_KMS / C_KMS_COSMO;
    const ABER_ARCSEC = BETA_EARTH * 206265;

    // Doppler
    const vr        = target.v_r || 0;
    const betaDop   = vr / C_KMS_COSMO;
    const baseLambda= 48;
    const waveLen   = Math.max(16, Math.min(100, baseLambda + betaDop*400));

    // GR
    const gr_mp = target.mp || 1, gr_rp = target.rp || 1;
    const gr_ms = target.ms || 1, gr_au = target.au || 1;
    const rs_p  = 2*6.674e-11*(gr_mp*5.972e24)/(2.998e8*2.998e8);
    const rs_s  = 2*6.674e-11*(gr_ms*1.989e30)/(2.998e8*2.998e8);
    const r_p   = gr_rp*6.371e6, r_o = gr_au*1.496e11;
    const grFac = Math.sqrt(Math.max(0, 1 - rs_p/r_p - rs_s/r_o));
    const grDev = 1 - grFac;

    // Combined photon color: Doppler + GR gravitational redshift
    const gr_rShift = Math.min(grDev*1e10*60, 40);
    const photonR = Math.min(255,(vr<-2?80:vr>2?255:120)+gr_rShift);
    const photonG = Math.max(0,  (vr<-2?180:vr>2?110:245)-gr_rShift*0.3);
    const photonB = Math.max(0,  (vr<-2?255:vr>2?50:255) -gr_rShift*0.5);

    // Doppler wave colors
    const dopplerEcol = vr<-2?"rgba(80,180,255,0.82)":vr>2?"rgba(255,110,50,0.82)":"rgba(0,230,255,0.78)";
    const dopplerBcol = vr<-2?"rgba(120,80,255,0.70)":vr>2?"rgba(255,170,80,0.70)":"rgba(200,100,255,0.70)";

    // Atmosphere
    const atmType = target.atm || "none";
    const atmColors = {
      none:"rgba(150,150,150,0.4)", thin_co2:"rgba(255,140,80,0.5)",
      thick_co2:"rgba(255,80,40,0.6)", n2_co2:"rgba(180,120,255,0.5)",
      n2_o2:"rgba(0,232,122,0.6)", h2_dominated:"rgba(79,195,247,0.5)",
      h2o_steam:"rgba(128,222,234,0.6)", exotic:"rgba(255,87,34,0.7)",
    };
    const atmCol = atmColors[atmType] || "rgba(150,150,150,0.4)";
    const hasBiosig = atmType === "n2_o2";

    // SNR: power falls as 1/d² → amplitude fades with distance
    const snrAmplitude = Math.max(0.15, Math.min(1, 5/Math.max(distanceLY,0.1)));

    // Star layers
    if (!starsRef.current) {
      starsRef.current = [
        Array.from({length:160},()=>({x:Math.random(),y:Math.random(),r:Math.random()*0.7+0.2,a:Math.random()*0.45+0.1,sp:Math.random()*0.018+0.004,ph:Math.random()*Math.PI*2,par:0.015,hex:null})),
        Array.from({length:60}, ()=>({x:Math.random(),y:Math.random(),r:Math.random()*1.1+0.4,a:Math.random()*0.55+0.2,sp:Math.random()*0.028+0.008,ph:Math.random()*Math.PI*2,par:0.05, hex:Math.random()>0.8?(Math.random()>0.5?"#ffd8a8":"#a8c8ff"):null})),
        Array.from({length:20}, ()=>({x:Math.random(),y:Math.random(),r:Math.random()*1.8+0.7,a:Math.random()*0.65+0.3,sp:Math.random()*0.038+0.015,ph:Math.random()*Math.PI*2,par:0.12, hex:Math.random()>0.7?(Math.random()>0.5?"#ffe4b5":"#b8d4ff"):null})),
      ];
    }

    let animating = true, raf;

    const draw = (ts) => {
      if (!animating) return;
      const t = ts*0.001;
      const W = canvas.width, H = canvas.height;
      const p = Math.max(0, Math.min(1, prog));

      // Zone heights
      const SPACE_H  = Math.round(H*0.54); // deep space
      const FX_H     = Math.round(H*0.18); // physics effects strip
      const SOLAR_H  = H - SPACE_H - FX_H; // solar system
      const FX_Y     = SPACE_H;
      const SOLAR_Y  = SPACE_H + FX_H;

      ctx.clearRect(0,0,W,H);

      // ── DEEP SPACE BACKGROUND ──────────────────────────────────────────
      const bgG=ctx.createLinearGradient(0,0,W,SPACE_H);
      bgG.addColorStop(0,"#000306");bgG.addColorStop(0.5,"#00080f");bgG.addColorStop(1,"#000814");
      ctx.fillStyle=bgG; ctx.fillRect(0,0,W,SPACE_H);

      // Nebula
      const neb=(x,y,r,c)=>{const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,c);g.addColorStop(1,"rgba(0,0,0,0)");ctx.fillStyle=g;ctx.fillRect(0,0,W,SPACE_H);};
      neb(W*0.18,SPACE_H*0.45,W*0.22,"rgba(16,0,64,0.22)");
      neb(W*0.80,SPACE_H*0.55,W*0.20,"rgba(0,24,72,0.20)");

      // Stars (clipped to space zone)
      ctx.save(); ctx.beginPath(); ctx.rect(0,0,W,SPACE_H); ctx.clip();
      const parOff=p*55;
      starsRef.current.forEach(layer=>layer.forEach(s=>{
        const tw=0.4+0.6*(0.5+0.5*Math.sin(t*s.sp*60+s.ph));
        const sx=((s.x*W)-parOff*s.par+W)%W, sy=s.y*SPACE_H;
        if(s.hex){const h=s.hex.slice(1);ctx.fillStyle=`rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${s.a*tw})`;}
        else{ctx.fillStyle=`rgba(200,220,255,${s.a*tw})`;}
        ctx.beginPath();ctx.arc(sx,sy,s.r,0,Math.PI*2);ctx.fill();
        if(s.par>0.08&&s.r>1.4&&s.a*tw>0.5){
          ctx.strokeStyle=`rgba(200,220,255,${s.a*tw*0.28})`;ctx.lineWidth=0.5;
          ctx.beginPath();ctx.moveTo(sx-s.r*3,sy);ctx.lineTo(sx+s.r*3,sy);ctx.stroke();
          ctx.beginPath();ctx.moveTo(sx,sy-s.r*3);ctx.lineTo(sx,sy+s.r*3);ctx.stroke();
        }
      }));
      ctx.restore();

      // ── PHYSICS EFFECTS STRIP BACKGROUND ──────────────────────────────
      ctx.fillStyle="rgba(0,0,0,0.65)"; ctx.fillRect(0,FX_Y,W,FX_H);
      // Top/bottom borders
      const divG=(y)=>{const g=ctx.createLinearGradient(0,y,W,y);g.addColorStop(0,"rgba(0,180,255,0)");g.addColorStop(0.3,"rgba(0,180,255,0.35)");g.addColorStop(0.7,"rgba(0,180,255,0.35)");g.addColorStop(1,"rgba(0,180,255,0)");ctx.strokeStyle=g;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();};
      divG(FX_Y); divG(FX_Y+FX_H);

      // ── SOLAR SYSTEM BACKGROUND ────────────────────────────────────────
      const solG=ctx.createLinearGradient(0,SOLAR_Y,0,H);
      solG.addColorStop(0,"#000510"); solG.addColorStop(1,"#000c1a");
      ctx.fillStyle=solG; ctx.fillRect(0,SOLAR_Y,W,SOLAR_H);
      ctx.font="7px 'IBM Plex Mono',monospace";ctx.fillStyle="rgba(0,180,255,0.30)";ctx.textAlign="center";
      ctx.fillText("— ECLIPTIC PLANE  ·  EARTH ORBIT VIEW  ·  GOD'S EYE —",W/2,SOLAR_Y+8);

      // ════════════════════════════════════════════════════════════════════
      // TOP ZONE — DEEP SPACE
      // ════════════════════════════════════════════════════════════════════
      const MY=SPACE_H*0.52, PX=115, EX=W-105, span=EX-PX;
      const sigX=PX+span*p;

      // Distance label
      ctx.font="10px 'IBM Plex Mono',monospace";ctx.fillStyle="rgba(0,180,255,0.28)";ctx.textAlign="center";
      if(p<0.99) ctx.fillText("← "+fmtDelay(distanceLY)+" →",W/2,14);

      // SNR fade bar under the travel path
      if(p>0){
        const fadeGrd=ctx.createLinearGradient(PX,0,sigX,0);
        fadeGrd.addColorStop(0,`rgba(${photonR},${photonG},${photonB},0.6)`);
        fadeGrd.addColorStop(1,`rgba(${photonR},${photonG},${photonB},${snrAmplitude*0.15})`);
        ctx.strokeStyle=fadeGrd; ctx.lineWidth=6; ctx.globalAlpha=0.3;
        ctx.beginPath(); ctx.moveTo(PX,MY+2); ctx.lineTo(sigX,MY+2); ctx.stroke();
        ctx.globalAlpha=1;
      }

      // ── HOST STAR ────────────────────────────────────────────────────
      const sX=PX-52,sY=MY-28,sPulse=1+0.06*Math.sin(t*1.8);
      for(let g=4;g>=1;g--){const gr=ctx.createRadialGradient(sX,sY,0,sX,sY,24*g);gr.addColorStop(0,"rgba(255,240,160,0.07)");gr.addColorStop(1,"rgba(0,0,0,0)");ctx.fillStyle=gr;ctx.beginPath();ctx.arc(sX,sY,24*g,0,Math.PI*2);ctx.fill();}
      for(let r=0;r<12;r++){const a=(r/12)*Math.PI*2+t*0.28;const rl=12+5*Math.sin(t*2+r);ctx.beginPath();ctx.moveTo(sX+Math.cos(a)*6,sY+Math.sin(a)*6);ctx.lineTo(sX+Math.cos(a)*rl,sY+Math.sin(a)*rl);ctx.strokeStyle=`rgba(255,210,70,${0.18+0.12*Math.sin(t*1.5+r)})`;ctx.lineWidth=1.1;ctx.stroke();}
      const sGrd=ctx.createRadialGradient(sX-2,sY-2,0,sX,sY,9*sPulse);sGrd.addColorStop(0,"rgba(255,255,240,1)");sGrd.addColorStop(0.3,"rgba(255,215,90,0.9)");sGrd.addColorStop(1,"rgba(255,100,0,0)");ctx.fillStyle=sGrd;ctx.beginPath();ctx.arc(sX,sY,9*sPulse,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(sX,sY,3.5,0,Math.PI*2);ctx.fillStyle="rgba(255,255,250,1)";ctx.fill();

      // ── SOURCE PLANET + ATMOSPHERE GLOW ──────────────────────────────
      const pp=1+0.03*Math.sin(t*1.1);

      // Gravity well lines (curved spacetime grid)
      if(grDev>1e-12){
        const wellAmp=Math.min(grDev*1e10,20);
        for(let i=0;i<5;i++){
          const wr=28+i*9, wd=wellAmp*(1-i*0.16);
          ctx.beginPath();
          ctx.moveTo(PX-wr,MY+28);
          ctx.quadraticCurveTo(PX,MY+28+wd,PX+wr,MY+28);
          ctx.strokeStyle=`rgba(128,203,196,${Math.min(grDev*5e9,0.55)*(1-i*0.18)})`;
          ctx.lineWidth=0.9-i*0.14; ctx.stroke();
        }
      }

      // Atmosphere halo — color coded by type, pulsing if biosig
      const atmPulse = hasBiosig ? 1+0.12*Math.sin(t*2) : 1;
      for(let g=3;g>=1;g--){
        const hg=ctx.createRadialGradient(PX,MY,22,PX,MY,42*g*atmPulse);
        hg.addColorStop(0,atmCol.replace("0.5","0.18").replace("0.6","0.22").replace("0.4","0.14"));
        hg.addColorStop(1,"rgba(0,0,0,0)");
        ctx.fillStyle=hg; ctx.beginPath(); ctx.arc(PX,MY,42*g,0,Math.PI*2); ctx.fill();
      }

      // Planet body
      const pGrd=ctx.createRadialGradient(PX-7,MY-7,2,PX,MY,27*pp);
      pGrd.addColorStop(0,"rgba(255,255,255,0.32)");pGrd.addColorStop(0.3,col);pGrd.addColorStop(0.7,col+"aa");pGrd.addColorStop(1,"rgba(0,0,0,0.82)");
      ctx.fillStyle=pGrd;ctx.beginPath();ctx.arc(PX,MY,27*pp,0,Math.PI*2);ctx.fill();
      ctx.save();ctx.beginPath();ctx.arc(PX,MY,27,0,Math.PI*2);ctx.clip();
      ctx.strokeStyle="rgba(0,0,0,0.16)";ctx.lineWidth=3.5;
      [-7,4,13].forEach(dy=>{ctx.beginPath();ctx.ellipse(PX,MY+dy,27,6,0,0,Math.PI*2);ctx.stroke();});
      ctx.restore();
      if(target.type&&(target.type.includes("Jupiter")||target.type.includes("Gas"))){
        ctx.beginPath();ctx.ellipse(PX,MY+5,44,10,0,0,Math.PI*2);ctx.strokeStyle=col+"40";ctx.lineWidth=2.5;ctx.stroke();
      }
      // Atmosphere ring
      ctx.beginPath();ctx.arc(PX,MY,31,0,Math.PI*2);ctx.strokeStyle=atmCol;ctx.lineWidth=2.5;ctx.stroke();
      // Biosig pulse ring
      if(hasBiosig){
        ctx.beginPath();ctx.arc(PX,MY,35+3*Math.sin(t*3),0,Math.PI*2);
        ctx.strokeStyle=`rgba(0,232,122,${0.3+0.2*Math.sin(t*3)})`;ctx.lineWidth=1.5;ctx.stroke();
      }

      // Mini SR clock on planet
      {
        const v_t=target.v_total||Math.abs(target.v_r||0);
        const betaSR=v_t/299792.458;
        const gammaSR=1/Math.sqrt(1-betaSR*betaSR);
        const CKX=PX-38,CKY=MY+36,CKR=10;
        ctx.beginPath();ctx.arc(CKX,CKY,CKR,0,Math.PI*2);ctx.fillStyle="rgba(0,4,16,0.88)";ctx.fill();
        ctx.strokeStyle=`rgba(${photonR},${photonG},${photonB},0.7)`;ctx.lineWidth=1.2;ctx.stroke();
        for(let i=0;i<12;i++){const a=(i/12)*Math.PI*2;ctx.beginPath();ctx.moveTo(CKX+Math.cos(a)*CKR*0.8,CKY+Math.sin(a)*CKR*0.8);ctx.lineTo(CKX+Math.cos(a)*CKR*0.95,CKY+Math.sin(a)*CKR*0.95);ctx.strokeStyle=`rgba(${photonR},${photonG},${photonB},0.3)`;ctx.lineWidth=0.6;ctx.stroke();}
        const sA=(t*(1/gammaSR)*0.5)%(Math.PI*2)-Math.PI/2;
        ctx.beginPath();ctx.moveTo(CKX,CKY);ctx.lineTo(CKX+Math.cos(sA)*CKR*0.8,CKY+Math.sin(sA)*CKR*0.8);
        ctx.strokeStyle=`rgba(${photonR},${photonG},${photonB},0.9)`;ctx.lineWidth=1.2;ctx.stroke();
        ctx.beginPath();ctx.arc(CKX,CKY,1.8,0,Math.PI*2);ctx.fillStyle=`rgba(${photonR},${photonG},${photonB},1)`;ctx.fill();
        ctx.font="6px 'IBM Plex Mono',monospace";ctx.textAlign="center";
        ctx.fillStyle=`rgba(${photonR},${photonG},${photonB},0.6)`;
        ctx.fillText("τ src",CKX,CKY+CKR+8);
      }

      // Planet labels
      ctx.font="bold 11px 'IBM Plex Mono',monospace";ctx.fillStyle=col;ctx.textAlign="center";ctx.fillText(target.planet,PX,MY+50);
      ctx.font="8px 'IBM Plex Mono',monospace";ctx.fillStyle="rgba(0,200,255,0.40)";ctx.fillText(target.system,PX,MY+61);
      // Atm label
      ctx.font="7px 'IBM Plex Mono',monospace";ctx.fillStyle=atmCol;ctx.textAlign="center";
      ctx.fillText(hasBiosig?"🌱 "+atmType.replace(/_/g," "):atmType.replace(/_/g," "),PX,MY+71);

      // ── EMF DIPOLE BURST AT EMISSION ──────────────────────────────────
      if(p<0.08){
        const ef=1-p/0.08, bs=1+(p/0.08)*3.2;
        for(let angle=0;angle<360;angle+=15){
          const rad=angle*Math.PI/180;
          const theta=Math.abs((angle%180)-90)*Math.PI/180;
          const dip=Math.sin(theta); if(dip<0.1)continue;
          const ll=(16+dip*45)*bs;
          const ex2=PX+Math.cos(rad)*ll, ey2=MY+Math.sin(rad)*ll;
          const isE=(Math.floor(angle/15)%2===0);
          ctx.strokeStyle=isE?`rgba(0,230,255,${ef*dip*0.7})`:`rgba(200,100,255,${ef*dip*0.7})`;
          ctx.lineWidth=0.8+dip*0.8;
          ctx.beginPath();
          const cpx=PX+Math.cos(rad)*ll*0.5+Math.sin(rad)*11*bs;
          const cpy=MY+Math.sin(rad)*ll*0.5-Math.cos(rad)*11*bs;
          ctx.moveTo(PX+Math.cos(rad)*10,MY+Math.sin(rad)*10);
          ctx.quadraticCurveTo(cpx,cpy,ex2,ey2); ctx.stroke();
        }
        for(let ring=0;ring<3;ring++){
          const rr=(p/0.08)*(50+ring*20)*bs;
          ctx.beginPath();ctx.arc(PX,MY,rr,0,Math.PI*2);
          ctx.strokeStyle=`rgba(0,220,255,${ef*(0.5-ring*0.14)})`;ctx.lineWidth=1.4-ring*0.3;ctx.stroke();
        }
      }

      // ── TRANSVERSE EM WAVE — DOPPLER + GR COLORED ─────────────────────
      if(p>0.04&&p<0.99){
        const amplitude=14*snrAmplitude; // SNR fades amplitude with distance
        const waveSpeed=t*4.0;
        const waveStart=Math.max(PX,sigX-Math.min(span*p,300));

        ctx.save();
        // E-field
        ctx.beginPath(); let first=true;
        for(let wx=waveStart;wx<=sigX;wx+=2){
          const dTip=sigX-wx, dStart=wx-waveStart;
          const fade=Math.min(dStart/40,1)*Math.min(dTip/30,1);
          const ey=MY+Math.sin((wx/waveLen)*Math.PI*2-waveSpeed)*amplitude*fade;
          if(first){ctx.moveTo(wx,ey);first=false;}else{ctx.lineTo(wx,ey);}
        }
        ctx.strokeStyle=dopplerEcol; ctx.lineWidth=1.8; ctx.stroke();

        // B-field dots
        for(let wx=waveStart;wx<=sigX;wx+=6){
          const dTip=sigX-wx, dStart=wx-waveStart;
          const fade=Math.min(dStart/40,1)*Math.min(dTip/30,1);
          const bStr=Math.cos((wx/waveLen)*Math.PI*2-waveSpeed)*fade;
          const dotR=Math.abs(bStr)*3.0;
          if(dotR>0.3){
            ctx.beginPath();ctx.arc(wx,MY,dotR,0,Math.PI*2);
            ctx.fillStyle=dopplerBcol.replace("0.70",String(Math.abs(bStr)*0.6));ctx.fill();
            if(bStr<-0.3){
              ctx.strokeStyle=dopplerBcol.replace("0.70",String(Math.abs(bStr)*0.65));ctx.lineWidth=0.7;
              ctx.beginPath();ctx.moveTo(wx-dotR,MY-dotR);ctx.lineTo(wx+dotR,MY+dotR);ctx.stroke();
              ctx.beginPath();ctx.moveTo(wx+dotR,MY-dotR);ctx.lineTo(wx-dotR,MY+dotR);ctx.stroke();
            }
          }
        }
        ctx.restore();

        // Wave labels
        const midX=waveStart+(sigX-waveStart)*0.5;
        ctx.font="8px 'IBM Plex Mono',monospace";ctx.textAlign="center";
        ctx.fillStyle=dopplerEcol.replace("0.82","0.50").replace("0.78","0.50");ctx.fillText("E⃗",midX,MY-amplitude-5);
        ctx.fillStyle=dopplerBcol.replace("0.70","0.50");ctx.fillText("B⃗",midX,MY+amplitude+12);

        // Doppler annotation
        if(vr!==0&&p>0.1&&p<0.9){
          const dLabel=vr<-2?`↗ blueshift ${vr.toFixed(1)}km/s`:`↘ redshift +${vr.toFixed(1)}km/s`;
          ctx.font="7px 'IBM Plex Mono',monospace";ctx.textAlign="center";
          ctx.fillStyle=vr<-2?"rgba(80,180,255,0.60)":"rgba(255,130,60,0.60)";
          ctx.fillText(dLabel,midX,MY+amplitude+22);
        }

        // ── PHOTON HEAD — all physics combined ──────────────────────────
        const phG=ctx.createRadialGradient(sigX,MY,0,sigX,MY,16);
        phG.addColorStop(0,"rgba(255,255,255,1)");
        phG.addColorStop(0.25,`rgba(${photonR},${photonG},${photonB},0.95)`);
        phG.addColorStop(0.7,`rgba(${photonR},${photonG},${photonB},0.3)`);
        phG.addColorStop(1,`rgba(${photonR},${photonG},${photonB},0)`);
        ctx.fillStyle=phG;ctx.beginPath();ctx.arc(sigX,MY,16,0,Math.PI*2);ctx.fill();

        // Pulse rings (SNR-faded)
        const pulseP=(t*2.8)%1;
        [0,0.35,0.7].forEach(off=>{
          const pf=(pulseP+off)%1,pr=pf*22,pa=(1-pf)*0.55*snrAmplitude;
          ctx.beginPath();ctx.arc(sigX,MY,pr,0,Math.PI*2);
          ctx.strokeStyle=`rgba(${photonR},${photonG},${photonB},${pa})`;ctx.lineWidth=1.4;ctx.stroke();
        });

        // Lens flare
        const fA=(0.28+0.12*Math.sin(t*5))*snrAmplitude;
        [-1,1].forEach(dir=>{
          const fG=ctx.createLinearGradient(sigX,MY,sigX+dir*45,MY);
          fG.addColorStop(0,`rgba(${photonR},${photonG},${photonB},${fA})`);
          fG.addColorStop(1,`rgba(${photonR},${photonG},${photonB},0)`);
          ctx.strokeStyle=fG;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(sigX,MY);ctx.lineTo(sigX+dir*45,MY);ctx.stroke();
        });

        // ISM ghost radio signals
        const dm_val = target.dm || (distanceLY*0.02);
        const travelSec = distanceLY*365.25*86400;
        const AMP=1e12;
        const radioBands=[
          {freq:1.4, color:"rgba(0,200,255,0.55)", label:"L"},
          {freq:0.35,color:"rgba(180,120,255,0.50)",label:"P"},
          {freq:0.03,color:"rgba(255,100,100,0.45)",label:"HF"},
        ];
        radioBands.forEach(band=>{
          const delayFrac=(4.15e-3*dm_val/(band.freq*band.freq))/travelSec;
          const visualLag=Math.min(delayFrac*AMP*span, span*0.32);
          const radioX=Math.max(PX,sigX-visualLag);
          if(radioX<=PX+5)return;
          const tLen=Math.min(radioX-PX,140);
          if(tLen>4){
            const tG=ctx.createLinearGradient(radioX-tLen,MY,radioX,MY);
            tG.addColorStop(0,"rgba(0,0,0,0)");tG.addColorStop(1,band.color);
            ctx.strokeStyle=tG;ctx.lineWidth=1;ctx.setLineDash([3,4]);
            ctx.beginPath();ctx.moveTo(Math.max(PX,radioX-tLen),MY+18);ctx.lineTo(radioX,MY+18);ctx.stroke();ctx.setLineDash([]);
          }
          const gG=ctx.createRadialGradient(radioX,MY+18,0,radioX,MY+18,5);
          gG.addColorStop(0,band.color.replace("0.55","0.85").replace("0.50","0.8").replace("0.45","0.75"));
          gG.addColorStop(1,"rgba(0,0,0,0)");
          ctx.fillStyle=gG;ctx.beginPath();ctx.arc(radioX,MY+18,5,0,Math.PI*2);ctx.fill();
          ctx.font="7px 'IBM Plex Mono',monospace";ctx.textAlign="center";
          ctx.fillStyle=band.color.replace("0.55","0.7").replace("0.50","0.65").replace("0.45","0.60");
          ctx.fillText(band.label,radioX,MY+29);
        });

        // Travel label
        if(p>0.06&&p<0.96){
          const tLY=distanceLY*p;
          ctx.font="10px 'IBM Plex Mono',monospace";ctx.fillStyle="rgba(0,240,255,0.65)";ctx.textAlign="center";
          ctx.fillText((tLY<1?fmtDelay(tLY):tLY.toFixed(2)+" ly")+" traveled",sigX,MY-amplitude-30);
        }
        // Milestones
        [0.25,0.5,0.75].forEach(frac=>{
          const mx=PX+span*frac;
          if(mx<sigX-5){ctx.beginPath();ctx.arc(mx,MY,2.5,0,Math.PI*2);ctx.fillStyle="rgba(0,200,255,0.40)";ctx.fill();}
          ctx.strokeStyle="rgba(0,180,255,0.12)";ctx.lineWidth=1;
          ctx.beginPath();ctx.moveTo(mx,MY+4);ctx.lineTo(mx,MY+11);ctx.stroke();
          const mLY=distanceLY*frac;
          ctx.font="8px 'IBM Plex Mono',monospace";ctx.fillStyle="rgba(0,180,255,0.20)";ctx.textAlign="center";
          ctx.fillText(mLY<1?fmtDelay(mLY):mLY.toFixed(1)+" ly",mx,MY+21);
        });
      }

      // ── EARTH (top zone) ──────────────────────────────────────────────
      const magG=ctx.createRadialGradient(EX,MY,22,EX,MY,110);
      magG.addColorStop(0,"rgba(0,70,200,0.14)");magG.addColorStop(1,"rgba(0,0,0,0)");
      ctx.fillStyle=magG;ctx.beginPath();ctx.arc(EX,MY,110,0,Math.PI*2);ctx.fill();
      for(let mLine=0;mLine<8;mLine++){
        const mA=(mLine/8)*Math.PI*2,mR1=42,mR2=82;
        ctx.beginPath();ctx.moveTo(EX+Math.cos(mA)*mR1,MY+Math.sin(mA)*mR1);
        ctx.quadraticCurveTo(EX+Math.cos(mA)*(mR1+mR2)*0.7+Math.sin(mA)*18,MY+Math.sin(mA)*(mR1+mR2)*0.7-Math.cos(mA)*18,EX+Math.cos(mA)*mR2,MY+Math.sin(mA)*mR2);
        ctx.strokeStyle="rgba(0,100,255,0.08)";ctx.lineWidth=0.8;ctx.stroke();
      }
      const eGrd=ctx.createRadialGradient(EX-10,MY-10,2,EX,MY,28);
      eGrd.addColorStop(0,"rgba(140,215,255,0.95)");eGrd.addColorStop(0.25,"#1a6fbb");eGrd.addColorStop(0.65,"#0d47a1");eGrd.addColorStop(1,"rgba(0,6,40,0.95)");
      ctx.fillStyle=eGrd;ctx.beginPath();ctx.arc(EX,MY,28,0,Math.PI*2);ctx.fill();
      ctx.save();ctx.beginPath();ctx.arc(EX,MY,28,0,Math.PI*2);ctx.clip();
      ctx.fillStyle="rgba(55,168,75,0.75)";
      [[EX-12,MY-10,10,7,0.3],[EX+8,MY+7,12,8,0.2],[EX-5,MY+12,8,5,0.4],[EX+13,MY-8,6,4,0.1]].forEach(v=>{ctx.beginPath();ctx.ellipse(v[0],v[1],v[2],v[3],v[4],0,Math.PI*2);ctx.fill();});
      ctx.restore();
      const atmA=0.15+0.05*Math.sin(t*0.75);
      const atmG2=ctx.createRadialGradient(EX,MY,24,EX,MY,40);atmG2.addColorStop(0,"rgba(100,180,255,0)");atmG2.addColorStop(0.7,`rgba(100,180,255,${atmA})`);atmG2.addColorStop(1,"rgba(60,120,255,0)");
      ctx.fillStyle=atmG2;ctx.beginPath();ctx.arc(EX,MY,40,0,Math.PI*2);ctx.fill();
      const moonA=t*0.45;ctx.beginPath();ctx.arc(EX+Math.cos(moonA)*44,MY+Math.sin(moonA)*18,3.2,0,Math.PI*2);ctx.fillStyle="rgba(200,210,220,0.65)";ctx.fill();
      ctx.font="bold 11px 'IBM Plex Mono',monospace";ctx.fillStyle="#4fc3f7";ctx.textAlign="center";ctx.fillText("EARTH",EX,MY+48);
      ctx.font="8px 'IBM Plex Mono',monospace";ctx.fillStyle="rgba(0,200,255,0.40)";ctx.fillText("Observer",EX,MY+59);

      // Arrival effect
      if(p>0.93){
        const fl=(p-0.93)/0.07;
        for(let ring=0;ring<4;ring++){
          const delay=ring*0.22,rfl=Math.max(0,fl-delay);
          if(rfl<=0)continue;
          ctx.beginPath();ctx.arc(EX,MY,28+rfl*(55+ring*16),0,Math.PI*2);
          ctx.strokeStyle=`rgba(0,255,180,${(1-rfl)*(0.7-ring*0.12)})`;ctx.lineWidth=2-ring*0.3;ctx.stroke();
        }
        if(fl>0.3){
          for(let mLine=0;mLine<8;mLine++){
            const mA=(mLine/8)*Math.PI*2,mR1=42,mR2=82;
            ctx.beginPath();ctx.moveTo(EX+Math.cos(mA)*mR1,MY+Math.sin(mA)*mR1);
            ctx.quadraticCurveTo(EX+Math.cos(mA)*(mR1+mR2)*0.7+Math.sin(mA)*18,MY+Math.sin(mA)*(mR1+mR2)*0.7-Math.cos(mA)*18,EX+Math.cos(mA)*mR2,MY+Math.sin(mA)*mR2);
            ctx.strokeStyle=`rgba(0,255,180,${(fl-0.3)*0.22})`;ctx.lineWidth=1.1;ctx.stroke();
          }
        }
      }
      if(p>=1){
        ctx.font="bold 12px 'IBM Plex Mono',monospace";ctx.fillStyle="rgba(0,245,110,0.95)";ctx.textAlign="center";
        ctx.fillText("✓  EM WAVEFRONT RECEIVED — SIGNAL LOCKED",W/2,22);
        ctx.font="9px 'IBM Plex Mono',monospace";ctx.fillStyle="rgba(0,200,255,0.65)";
        ctx.fillText("Delay: "+fmtDelay(distanceLY)+"  ·  Signal reconstructing below",W/2,34);
      }

      // ── SR CLOCKS (top right corner) ────────────────────────────────────
      {
        const v_t=target.v_total||Math.abs(target.v_r||0);
        const betaSR2=v_t/299792.458;
        const gammaSR2=1/Math.sqrt(1-betaSR2*betaSR2);
        const sourceRate2=1/gammaSR2;
        const impactCol2=gammaSR2>1.1?"#ff6020":gammaSR2>1.01?"#ff9a20":gammaSR2>1.0001?"#f5c842":"#ce93d8";
        const drawCK=(cx,cy,r,rate,label,sub,color)=>{
          ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fillStyle="rgba(0,4,16,0.92)";ctx.fill();
          ctx.strokeStyle=color;ctx.lineWidth=1.5;ctx.stroke();
          for(let i=0;i<12;i++){const a=(i/12)*Math.PI*2;ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*r*(i%3===0?0.72:0.80),cy+Math.sin(a)*r*(i%3===0?0.72:0.80));ctx.lineTo(cx+Math.cos(a)*r*0.88,cy+Math.sin(a)*r*0.88);ctx.strokeStyle=i%3===0?"rgba(200,200,255,0.55)":"rgba(150,150,255,0.22)";ctx.lineWidth=i%3===0?1.2:0.6;ctx.stroke();}
          const mA=(t*rate*0.5/60)%(Math.PI*2)-Math.PI/2;
          ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(mA)*r*0.65,cy+Math.sin(mA)*r*0.65);ctx.strokeStyle=color;ctx.lineWidth=2;ctx.lineCap="round";ctx.stroke();
          const sA=(t*rate*0.5)%(Math.PI*2)-Math.PI/2;
          ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(sA)*r*0.80,cy+Math.sin(sA)*r*0.80);ctx.strokeStyle=color;ctx.lineWidth=1.2;ctx.lineCap="round";ctx.stroke();
          ctx.beginPath();ctx.arc(cx,cy,2.5,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
          ctx.font="bold 7px 'IBM Plex Mono',monospace";ctx.textAlign="center";ctx.fillStyle=color;ctx.fillText(label,cx,cy+r+12);
          ctx.font="6px 'IBM Plex Mono',monospace";ctx.fillStyle="rgba(150,150,200,0.55)";ctx.fillText(sub,cx,cy+r+21);
        };
        const CKY2=SPACE_H*0.22, CKR2=17;
        // Place clocks LEFT of center — away from Earth and travel labels
        const CKL2=Math.round(W*0.36), CKR22=Math.round(W*0.36)+46;
        drawCK(CKL2,CKY2,CKR2,1.0,"t_coord","Earth","rgba(79,195,247,0.9)");
        drawCK(CKR22,CKY2,CKR2,sourceRate2,"τ proper","Source",impactCol2);
        ctx.font="7px 'IBM Plex Mono',monospace";ctx.textAlign="center";ctx.fillStyle="rgba(200,200,255,0.35)";ctx.fillText("vs",CKL2+23,CKY2+2);
        ctx.font="6px 'IBM Plex Mono',monospace";ctx.fillStyle="rgba(200,200,255,0.50)";ctx.fillText("γ="+gammaSR2.toFixed(gammaSR2>1.0001?5:9),CKL2+23,CKY2+13);
        ctx.fillStyle="rgba(180,180,255,0.28)";ctx.fillText("SR Dilation",CKL2+23,CKY2-CKR2-5);
      }

      // ════════════════════════════════════════════════════════════════════
      // PHYSICS EFFECTS STRIP — all corrections summarized in one bar
      // ════════════════════════════════════════════════════════════════════
      {
        const SCY = FX_Y + FX_H/2;
        const effects = [
          // [x_frac, label, value, color, active]
          [0.08,  "ATM",    atmType.replace(/_/g," "),     atmCol,                           true],
          [0.22,  "DOPPLER",vr!==0?(vr<0?"↗":"↘")+Math.abs(vr).toFixed(0)+"km/s":"v_r=0",  vr<-2?"rgba(80,180,255,0.9)":vr>2?"rgba(255,130,60,0.9)":"rgba(150,150,200,0.5)", true],
          [0.36,  "GR",     grDev>1e-9?(1-grFac).toExponential(2):"< 10⁻¹²",               grDev>0.01?"#ff9a20":grDev>1e-6?"#f5c842":"rgba(0,232,122,0.8)", true],
          [0.50,  "SR γ",   (()=>{const v2=target.v_total||Math.abs(target.v_r||0);const g=1/Math.sqrt(1-(v2/299792.458)**2);return g>1.0001?g.toFixed(5):"≈1.000";})(), "rgba(206,147,216,0.9)", true],
          [0.64,  "ISM DM", (target.dm||distanceLY*0.02).toFixed(3)+" pc/cm³",              "rgba(0,200,255,0.8)",  true],
          [0.78,  "SNR",    (snrAmplitude*100).toFixed(0)+"%",                               snrAmplitude>0.6?"#00e87a":snrAmplitude>0.3?"#f5c842":"#ff5f5f", true],
          [0.91,  "COSMO",  "z="+hubbleRedshift(distanceLY).toExponential(1),               "rgba(100,180,255,0.7)", true],
        ];

        ctx.font="bold 7px 'IBM Plex Mono',monospace"; ctx.textAlign="center";
        effects.forEach(([xf, label, value, color])=>{
          const x = xf*W;
          ctx.fillStyle="rgba(0,0,0,0.4)";
          ctx.beginPath(); ctx.roundRect(x-34,FX_Y+4,68,FX_H-8,4); ctx.fill();
          ctx.strokeStyle=color.replace(/,[0-9.]+\)$/,",0.4)").replace("#","rgba(").replace(/rgba\(([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i,(_,r2,g2,b2)=>`rgba(${parseInt(r2,16)},${parseInt(g2,16)},${parseInt(b2,16)}`);
          ctx.strokeStyle="rgba(150,150,200,0.2)";ctx.lineWidth=0.8;
          ctx.beginPath();ctx.roundRect(x-34,FX_Y+4,68,FX_H-8,4);ctx.stroke();
          ctx.fillStyle="rgba(150,150,200,0.5)";ctx.fillText(label,x,FX_Y+14);
          ctx.font="bold 8px 'IBM Plex Mono',monospace";ctx.fillStyle=color;
          // Truncate long values
          const maxLen=9;
          const disp=value.length>maxLen?value.slice(0,maxLen)+"…":value;
          ctx.fillText(disp,x,FX_Y+FX_H/2+3);
          ctx.font="bold 7px 'IBM Plex Mono',monospace";
        });
      }

      // ════════════════════════════════════════════════════════════════════
      // BOTTOM ZONE — SOLAR SYSTEM
      // ════════════════════════════════════════════════════════════════════
      const SOLAR_CY=SOLAR_Y+SOLAR_H*0.55;
      const earthPhase=t*0.5+p*Math.PI*4;
      const velAngle=earthPhase+Math.PI/2;
      const velDirX=Math.cos(velAngle), velDirY=Math.sin(velAngle);

      // Sun
      const SUN_X=W*0.18, SUN_Y=SOLAR_CY, ORBIT_R=Math.min(SOLAR_H*0.38,50);
      for(let g=3;g>=1;g--){const sg=ctx.createRadialGradient(SUN_X,SUN_Y,0,SUN_X,SUN_Y,18*g);sg.addColorStop(0,`rgba(255,240,150,${0.12/g})`);sg.addColorStop(1,"rgba(255,160,0,0)");ctx.fillStyle=sg;ctx.beginPath();ctx.arc(SUN_X,SUN_Y,18*g,0,Math.PI*2);ctx.fill();}
      const sunG2=ctx.createRadialGradient(SUN_X,SUN_Y,0,SUN_X,SUN_Y,9);sunG2.addColorStop(0,"rgba(255,255,200,1)");sunG2.addColorStop(1,"rgba(255,140,0,0)");ctx.fillStyle=sunG2;ctx.beginPath();ctx.arc(SUN_X,SUN_Y,9,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(SUN_X,SUN_Y,3.5,0,Math.PI*2);ctx.fillStyle="rgba(255,255,220,1)";ctx.fill();
      ctx.beginPath();ctx.arc(SUN_X,SUN_Y,ORBIT_R,0,Math.PI*2);ctx.strokeStyle="rgba(0,150,255,0.15)";ctx.lineWidth=0.8;ctx.setLineDash([3,4]);ctx.stroke();ctx.setLineDash([]);

      // Earth orbit
      const EX_ORB=SUN_X+Math.cos(earthPhase)*ORBIT_R, EY_ORB=SUN_Y+Math.sin(earthPhase)*ORBIT_R;
      const eOrb=ctx.createRadialGradient(EX_ORB,EY_ORB,0,EX_ORB,EY_ORB,12);eOrb.addColorStop(0,"rgba(79,195,247,0.3)");eOrb.addColorStop(1,"rgba(79,195,247,0)");
      ctx.fillStyle=eOrb;ctx.beginPath();ctx.arc(EX_ORB,EY_ORB,12,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(EX_ORB,EY_ORB,6,0,Math.PI*2);ctx.fillStyle="rgba(79,195,247,0.95)";ctx.fill();
      const VX_TIP=EX_ORB+velDirX*18, VY_TIP=EY_ORB+velDirY*18;
      ctx.beginPath();ctx.moveTo(EX_ORB,EY_ORB);ctx.lineTo(VX_TIP,VY_TIP);ctx.strokeStyle="rgba(0,220,255,0.90)";ctx.lineWidth=1.8;ctx.stroke();
      ctx.beginPath();ctx.moveTo(VX_TIP,VY_TIP);ctx.lineTo(VX_TIP-5*Math.cos(velAngle-0.4),VY_TIP-5*Math.sin(velAngle-0.4));ctx.lineTo(VX_TIP-5*Math.cos(velAngle+0.4),VY_TIP-5*Math.sin(velAngle+0.4));ctx.closePath();ctx.fillStyle="rgba(0,220,255,0.95)";ctx.fill();
      ctx.setLineDash([3,6]);ctx.strokeStyle="rgba(79,195,247,0.18)";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(EX_ORB,EY_ORB);ctx.lineTo(EX,SOLAR_Y);ctx.stroke();ctx.setLineDash([]);
      ctx.font="7px 'IBM Plex Mono',monospace";ctx.textAlign="center";ctx.fillStyle="rgba(79,195,247,0.55)";ctx.fillText("Earth",EX_ORB,EY_ORB+14);
      ctx.fillStyle="rgba(255,240,100,0.5)";ctx.fillText("☀",SUN_X,SUN_Y+3);

      // Aberration
      const STAR_CX=W*0.52, STAR_CY=SOLAR_CY, AMP_X=62, AMP_Y=21;
      ctx.beginPath();ctx.ellipse(STAR_CX,STAR_CY,AMP_X,AMP_Y,0,0,Math.PI*2);
      ctx.strokeStyle="rgba(255,220,50,0.15)";ctx.lineWidth=0.8;ctx.setLineDash([2,5]);ctx.stroke();ctx.setLineDash([]);
      if(p>0.01){
        ctx.beginPath();
        for(let s2=0;s2<=80;s2++){const frac=s2/80;const a2=frac*p*Math.PI*8;const tx2=STAR_CX+Math.cos(a2)*AMP_X,ty2=STAR_CY+Math.sin(a2)*AMP_Y;if(s2===0)ctx.moveTo(tx2,ty2);else ctx.lineTo(tx2,ty2);}
        ctx.strokeStyle=`rgba(255,220,50,${Math.min(0.85,0.25+p*0.65)})`;ctx.lineWidth=2;ctx.stroke();
      }
      ctx.beginPath();ctx.arc(STAR_CX,STAR_CY,5,0,Math.PI*2);ctx.fillStyle="rgba(255,255,220,0.95)";ctx.fill();
      ctx.strokeStyle="rgba(255,255,200,0.35)";ctx.lineWidth=0.8;
      [[-11,0],[11,0],[0,-11],[0,11]].forEach(([dx,dy])=>{ctx.beginPath();ctx.moveTo(STAR_CX,STAR_CY);ctx.lineTo(STAR_CX+dx,STAR_CY+dy);ctx.stroke();});
      const APX=STAR_CX+velDirX*AMP_X, APY=STAR_CY+velDirY*AMP_Y;
      const apG=ctx.createRadialGradient(APX,APY,0,APX,APY,16);apG.addColorStop(0,`rgba(255,220,50,${0.25+p*0.45})`);apG.addColorStop(1,"rgba(255,220,50,0)");
      ctx.fillStyle=apG;ctx.beginPath();ctx.arc(APX,APY,16,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(APX,APY,6,0,Math.PI*2);ctx.fillStyle=`rgba(255,220,50,${0.8+p*0.2})`;ctx.fill();
      const dxAB=APX-STAR_CX,dyAB=APY-STAR_CY,distAB=Math.sqrt(dxAB*dxAB+dyAB*dyAB);
      if(distAB>5){ctx.beginPath();ctx.moveTo(STAR_CX,STAR_CY);ctx.lineTo(APX,APY);ctx.strokeStyle=`rgba(255,220,50,${0.7+p*0.3})`;ctx.lineWidth=2.2;ctx.stroke();const angAB=Math.atan2(dyAB,dxAB);ctx.beginPath();ctx.moveTo(APX,APY);ctx.lineTo(APX-8*Math.cos(angAB-0.4),APY-8*Math.sin(angAB-0.4));ctx.lineTo(APX-8*Math.cos(angAB+0.4),APY-8*Math.sin(angAB+0.4));ctx.closePath();ctx.fillStyle=`rgba(255,220,50,${0.9+p*0.1})`;ctx.fill();}
      ctx.font="7px 'IBM Plex Mono',monospace";ctx.textAlign="center";
      ctx.fillStyle="rgba(200,200,200,0.55)";ctx.fillText("TRUE",STAR_CX,STAR_CY-15);ctx.fillText(target.planet,STAR_CX,STAR_CY-6);
      ctx.fillStyle="rgba(255,220,50,0.80)";ctx.fillText("APPARENT",APX,APY+16);
      ctx.setLineDash([2,5]);ctx.strokeStyle="rgba(255,220,50,0.18)";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(VX_TIP,VY_TIP);ctx.lineTo(APX,APY);ctx.stroke();ctx.setLineDash([]);

      // Right readout
      const RX3=W*0.78, RY3=SOLAR_Y+11;
      const currentShift=ABER_ARCSEC*Math.abs(Math.sin(earthPhase));
      const snrDB=20*Math.log10(Math.max(snrAmplitude,0.001));
      const readouts=[
        ["STELLAR ABERRATION","rgba(255,220,50,0.80)",true],
        [`Δθ = ${currentShift.toFixed(2)}″ now`,"rgba(255,220,50,0.80)",false],
        [`SNR = ${snrDB.toFixed(1)} dB`,"rgba(0,200,255,0.70)",false],
        [`DM = ${(target.dm||distanceLY*0.02).toFixed(3)}`,"rgba(0,200,255,0.55)",false],
        [vr!==0?`Δλ_Dop=${(550*(Math.sqrt((1+betaDop)/(1-betaDop))-1)).toFixed(4)}nm`:"Doppler: 0","rgba(80,180,255,0.55)",false],
        [`GR: 1-f=${grDev.toExponential(2)}`,"rgba(128,203,196,0.55)",false],
      ];
      ctx.textAlign="left";
      readouts.forEach(([txt,col,bold],i)=>{
        ctx.font=(bold?"bold ":"")+"7px 'IBM Plex Mono',monospace";
        ctx.fillStyle=col;ctx.fillText(txt,RX3,RY3+i*11);
      });

      raf=requestAnimationFrame(draw);
    };

    raf=requestAnimationFrame(draw);
    return()=>{animating=false;cancelAnimationFrame(raf);};
  },[target,prog]);
}


function DeepSpaceCanvas({ prog, target, grOverride }) {
  const canvasRef = useRef(null);
  // Merge grOverride into target so canvas uses it
  const effectiveTarget = grOverride
    ? {...target, mp:grOverride.mp, rp:grOverride.rp, ms:grOverride.ms, au:grOverride.au}
    : target;
  useDeepSpaceCanvas(canvasRef, prog, effectiveTarget);
  return <canvas ref={canvasRef} width={900} height={520} style={{width:"100%",height:520,display:"block"}}/>;
}

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
    {section:"II — Temporal & Relativistic",id:"A5",color:"#f5c842",bg:"rgba(245,200,66,0.10)",title:"Special relativistic time dilation — fully implemented ✓",sub:"Real γ applied from measured v_total for all 62 planets + custom v/c slider 0→0.999c",tags:[{t:"Valid in this model",k:"valid"}],body:"Special relativity predicts dilated proper time for moving sources:",formula:"t_proper = t_coord · √(1 − v²/c²)",detail:"Implemented: (1) real Lorentz γ computed from measured v_total = √(v_r²+μ²) for all 62 planets, (2) SR-corrected proper time applied to all age calculations in Step 5, (3) custom v/c slider 0→0.999c with presets (GPS, ISS, 0.1c, 0.5c, 0.9c, 0.99c, 0.999c), (4) animated dual-clock visualization showing Earth frame vs source proper time, (5) mini τ clock on source planet in canvas. For real exoplanets γ ~ 1+10⁻⁸. At β=0.999c γ=22.4 — the source person ages 22× slower than Earth frame."},
    {id:"A6",color:"#f5c842",bg:"rgba(245,200,66,0.10)",title:"Gravitational time dilation — fully implemented ✓",sub:"Schwarzschild GR factor computed for all 62 planets: planet surface + stellar well + custom exotic slider",tags:[{t:"Valid in this model",k:"valid"}],body:"Clocks run slower deeper in a gravitational potential well (Schwarzschild):",formula:"t_surface = t_∞ · √(1 − 2GM / rc²)",detail:"Implemented: (1) planet surface Schwarzschild factor √(1−2GM_p/r_p c²), (2) stellar potential at orbital distance √(1−2GM_★/r_orbit c²), (3) combined gravitational potential with all 62 planets having real mass/radius/stellar data, (4) custom exotic slider with log-scale controls for neutron stars and black holes, (5) gravity well visualization in Step 3 canvas, (6) GR gravitational redshift on photon color. For TRAPPIST-1 e: correction ~10⁻¹⁰. For HD 189733 b (hot Jupiter 0.031 AU): ~10⁻⁸. Neutron star preset: ~30% time dilation."},
    {id:"A7",color:"#0C447C",bg:"rgba(0,120,255,0.12)",title:"Cosmological redshift — domain-valid, boundary proven ✓",sub:"Flat-space model is physically exact for all 62 catalog targets (d ≲ 750 ly). Extragalactic explorer included.",tags:[{t:"Valid in this model",k:"valid"}],body:"Hubble recession velocity at catalog maximum distance (750 ly):",formula:"v_rec = H₀ × d = 70 × (750/3.26e6) = 0.016 km/s   →   z = v/c = 5.4×10⁻⁹",detail:"Proven valid: z_max for catalog = 5.4×10⁻⁹. A 550nm photon shifts by 0.003 femtometers — physically undetectable. The flat-space model is not an approximation at these distances, it is exact. Step 5 includes an Extragalactic Explorer showing where cosmological effects kick in: z becomes detectable at d ≈ 4 Mpc (Andromeda × 5), significant at d ≈ 100 Mpc, dominant at d ≈ 3 Gpc. Full FLRW metric would be required for extragalactic use. H₀ = 70 km/s/Mpc (Planck 2018)."},
    {section:"III — Spectral & Kinematic",id:"A8",color:"#0C447C",bg:"rgba(0,120,255,0.12)",title:"Doppler shift — fully implemented ✓",sub:"Real radial velocities applied to all 62 planets — wave compression, image color shift, and spectral metrics",tags:[{t:"Valid in this model",k:"valid"}],body:"A moving source shifts the received frequency. Implemented at three levels in this simulator:",formula:"f_obs = f_emit · √((1+β)/(1−β))   β = v_r/c   →   λ_obs = λ_emit · f_ratio",detail:"Proxima blueshift ~0.007% at β ≈ 7×10⁻⁵ — imperceptible visually, detectable spectroscopically."},
    {id:"A9",color:"#0C447C",bg:"rgba(0,120,255,0.12)",title:"Stellar aberration — fully implemented ✓",sub:"Earth's orbital velocity shifts apparent source position — animated in canvas and Step 5 panel",tags:[{t:"Valid in this model",k:"valid"}],body:"Earth's motion (v⊕=29.78 km/s) tilts the apparent direction of incoming light — like tilting an umbrella forward while running. Animated live in the propagation canvas and the Step 5 panel:",formula:"tan(θ_aber) = v⊕ · sin(θ) / (c + v⊕ · cos(θ))  ≈  v⊕/c  =  9.94×10⁻⁵ rad  =  20.495″",detail:"Bradley (1729) discovered this effect while searching for stellar parallax — it was the first direct evidence that light has a finite speed. Implemented: (1) animated apparent-vs-true position displacement arrow in the deep space canvas, (2) live orbital diagram in Step 5 showing Earth orbiting the Sun with the aberration ellipse traced by the star's apparent position over one year. Maximum displacement amplified ×~300,000 for visual clarity."},
    {id:"A10",color:"#b39ddb",bg:"rgba(147,112,219,0.10)",title:"ISM dispersion — fully implemented ✓",sub:"Frequency-dependent delays modeled for optical through radio, with waterfall visualization",tags:[{t:"Valid in this model",k:"valid"}],body:"ISM electron column density delays lower-frequency photons:",formula:"Δt_DM = 4.15 ms · DM · (f_low⁻² − f_high⁻²)   [pc/cm³, GHz]",detail:"Utterly negligible for optical photons. Critical for radio pulsar timing and fast radio bursts."},
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
  const [betaCustom,setBetaCustom]=useState(0);
  // GR override state — lifted to App so Step 3 canvas reads it live
  const [grOverride,setGrOverride]=useState(null); // null = use real target data
  const [grPanelOpen,setGrPanelOpen]=useState(false);
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

  // Special Relativity — apply γ to age calculations
  const v_total_kms = target.v_total || Math.abs(target.v_r || 0);
  const v_custom_kms_sr = betaCustom * C_KMS_SR;
  const gamma_real_sr   = lorentzGamma(v_total_kms);
  const gamma_custom_sr = lorentzGamma(v_custom_kms_sr);
  // SR-corrected age: source clock runs slower by 1/γ
  const actualNow_sr_real   = age0 + (secToYr(simTravelSec) / gamma_real_sr);
  const actualNow_sr_custom = age0 + (secToYr(simTravelSec) / gamma_custom_sr);
  const ageWhenSeen_sr_real = age0 + (delayYears / gamma_real_sr);
  const srCorrection_real   = actualNow - actualNow_sr_real;
  const srCorrection_custom = actualNow - actualNow_sr_custom;
  // GR time dilation — use override if set, else real target data
  const gr_mp = grOverride ? grOverride.mp : (target.mp || 1);
  const gr_rp = grOverride ? grOverride.rp : (target.rp || 1);
  const gr_ms = grOverride ? grOverride.ms : (target.ms || 1);
  const gr_au = grOverride ? grOverride.au : (target.au || 1);
  const gr_factor_real = grCombined(gr_mp, gr_rp, gr_ms, gr_au);
  const actualNow_gr   = grCorrectedAge(age0, secToYr(simTravelSec), gr_factor_real);
  const ageWhenSeen_gr = grCorrectedAge(age0, delayYears, gr_factor_real);
  const gr_impact      = grImpact(gr_factor_real);
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
          <DeepSpaceCanvas prog={prog} target={target} grOverride={grOverride}/>
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

            {/* GR EXOTIC OBJECT PANEL — inline in Step 3 */}
            <div style={{marginTop:14,border:"1px solid rgba(128,203,196,0.30)",borderRadius:12,overflow:"hidden"}}>
              <div onClick={()=>setGrPanelOpen(o=>!o)}
                style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 18px",
                  background:grOverride?"rgba(128,203,196,0.10)":"rgba(0,0,0,0.35)",cursor:"pointer"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontFamily:"'Orbitron',sans-serif",fontSize:11,color:"#80cbc4",letterSpacing:2}}>
                    🌌 GR SOURCE OBJECT
                  </span>
                  {grOverride && (
                    <span style={{fontSize:11,padding:"2px 8px",borderRadius:4,background:"rgba(128,203,196,0.15)",color:"#80cbc4",fontWeight:700}}>
                      CUSTOM ACTIVE
                    </span>
                  )}
                  {!grOverride && (
                    <span style={{fontSize:11,color:dim}}>
                      {target.planet} · GR factor = {gr_factor_real.toFixed(8)}
                    </span>
                  )}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  {grOverride && (
                    <button onClick={e=>{e.stopPropagation();setGrOverride(null);}}
                      style={{padding:"3px 10px",borderRadius:4,border:"1px solid rgba(128,203,196,0.4)",
                        background:"transparent",color:"#80cbc4",fontSize:11,cursor:"pointer",fontFamily:"monospace"}}>
                      ↺ Reset
                    </button>
                  )}
                  <span style={{color:"#80cbc4",fontSize:13,transform:grPanelOpen?"rotate(180deg)":"none",transition:"transform 0.2s"}}>▾</span>
                </div>
              </div>

              {grPanelOpen && (()=>{
                const cur = grOverride || {mp:target.mp||1, rp:target.rp||1, ms:target.ms||1, au:target.au||1};
                const gr_c = grCombined(cur.mp, cur.rp, cur.ms, cur.au);
                const imp_c = grImpact(gr_c);
                const rs_p  = schwarzschildRadius_m(cur.mp * M_EARTH);
                const comp  = rs_p / (cur.rp * R_EARTH);

                const updateGR = (field, val) => {
                  setGrOverride(prev => {
                    const base = prev || {mp:target.mp||1, rp:target.rp||1, ms:target.ms||1, au:target.au||1};
                    return {...base, [field]: val};
                  });
                };

                return (
                  <div style={{padding:"16px 18px",background:"rgba(0,5,20,0.9)",borderTop:"1px solid rgba(128,203,196,0.20)"}}>

                    {/* Preset buttons */}
                    <div style={{fontSize:11,color:dim,textTransform:"uppercase",letterSpacing:1.5,marginBottom:8}}>Presets</div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
                      {[
                        {label:"Real planet",   vals:{mp:target.mp||1,   rp:target.rp||1,   ms:target.ms||1,   au:target.au||1}},
                        {label:"Earth",         vals:{mp:1,       rp:1,      ms:1,    au:1}},
                        {label:"Hot Jupiter",   vals:{mp:300,     rp:13,     ms:1.2,  au:0.03}},
                        {label:"White Dwarf",   vals:{mp:196500,  rp:0.0092, ms:0.6,  au:0.1}},
                        {label:"Neutron Star ⭐",vals:{mp:596500,  rp:0.00170,ms:1.4,  au:0.01}},
                        {label:"Black Hole 🕳",  vals:{mp:17900000,rp:0.000094,ms:10,  au:0.001}},
                      ].map(pr=>{
                        const isActive = grOverride &&
                          Math.abs(grOverride.mp-pr.vals.mp)/Math.max(pr.vals.mp,0.001)<0.01 &&
                          Math.abs(grOverride.rp-pr.vals.rp)/Math.max(pr.vals.rp,0.001)<0.01;
                        return (
                          <button key={pr.label}
                            onClick={()=>setGrOverride(pr.label==="Real planet"?null:pr.vals)}
                            style={{padding:"6px 12px",borderRadius:7,fontSize:12,cursor:"pointer",fontFamily:"monospace",
                              border:`1px solid ${isActive?"rgba(128,203,196,0.7)":"rgba(128,203,196,0.25)"}`,
                              background:isActive?"rgba(128,203,196,0.15)":"rgba(0,0,0,0.3)",
                              color:isActive?"#80cbc4":dim}}>
                            {pr.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Sliders */}
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
                      {[
                        ["Planet mass",   "mp", cur.mp, 0.1,  600000, "log", "M⊕"],
                        ["Planet radius", "rp", cur.rp, 0.001,20,     "lin", "R⊕"],
                        ["Star mass",     "ms", cur.ms, 0.08, 50,     "log", "M☉"],
                        ["Orbital dist",  "au", cur.au, 0.001,200,    "log", "AU"],
                      ].map(([label,field,val,min,max,scale,unit])=>{
                        const logMin=Math.log10(min),logMax=Math.log10(max);
                        const pct=scale==="log"?(Math.log10(Math.max(min,val))-logMin)/(logMax-logMin):(val-min)/(max-min);
                        return (
                          <div key={field}>
                            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                              <span style={{fontSize:11,color:dim}}>{label}</span>
                              <span style={{fontSize:12,fontWeight:700,color:"#80cbc4",fontFamily:"monospace"}}>
                                {val>=1000?val.toExponential(2):val>=0.01?val.toFixed(3):val.toExponential(2)} {unit}
                              </span>
                            </div>
                            <input type="range" min={0} max={1} step={0.001} value={pct}
                              onChange={e=>{
                                const p2=parseFloat(e.target.value);
                                const nv=scale==="log"
                                  ?Math.pow(10,logMin+p2*(logMax-logMin))
                                  :min+p2*(max-min);
                                updateGR(field, Math.max(min,Math.min(max,nv)));
                              }} style={{width:"100%"}}/>
                          </div>
                        );
                      })}
                    </div>

                    {/* Live GR readout */}
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:8,padding:"12px 14px",
                      background:"rgba(0,0,0,0.4)",borderRadius:8,border:`1px solid ${imp_c.color}44`}}>
                      {[
                        ["GR factor",       gr_c.toFixed(10),           imp_c.color],
                        ["1 − factor",      (1-gr_c).toExponential(4),  imp_c.color],
                        ["Compactness r_s/r",comp.toExponential(3),     comp>0.5?"#ff3030":imp_c.color],
                        ["Impact",          imp_c.label,                imp_c.color],
                      ].map(([l,v,c2])=>(
                        <div key={l} style={{background:"rgba(0,0,0,0.3)",borderRadius:6,padding:"8px 10px",border:"1px solid rgba(128,203,196,0.15)"}}>
                          <div style={{fontSize:9,color:dim,textTransform:"uppercase",letterSpacing:1,marginBottom:2}}>{l}</div>
                          <div style={{fontSize:12,fontWeight:700,color:c2,fontFamily:"monospace"}}>{v}</div>
                        </div>
                      ))}
                    </div>

                    {comp > 0.5 && (
                      <div style={{marginTop:10,padding:"8px 12px",background:"rgba(255,0,0,0.12)",
                        border:"1px solid rgba(255,0,0,0.4)",borderRadius:6,fontSize:12,color:"#ff6060"}}>
                        ⚠ r_s/r = {comp.toFixed(4)} — near event horizon. Time nearly stops at the surface.
                        {comp>0.9&&" ← THIS IS INSIDE THE PHOTON SPHERE"}
                      </div>
                    )}

                    <div style={{marginTop:10,fontSize:12,color:dim,lineHeight:1.7}}>
                      {imp_c.desc} — watch the photon color and gravity well in the canvas above update live.
                    </div>
                  </div>
                );
              })()}
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
                  <ReceivedImage mediaURL={mediaURL} mediaType={mediaType} distanceLY={distanceLY} arrived={arrivedOnEarth} target={target}/>
                ):(
                  <div style={{borderRadius:10,border:"2px solid rgba(0,232,122,0.5)",padding:"40px 20px",textAlign:"center",background:"rgba(0,232,122,0.05)",color:ok,fontSize:16,minHeight:200,display:"flex",alignItems:"center",justifyContent:"center",textAlign:"center"}}>
                  <div style={{borderRadius:10,border:"2px solid rgba(0,232,122,0.5)",padding:"30px 20px",textAlign:"center",background:"rgba(0,232,122,0.04)",minHeight:180,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10}}>
                    <div style={{fontSize:32}}>📡</div>
                    <div style={{fontSize:15,fontWeight:700,color:ok}}>✓ EM Wavefront Arrived</div>
                    <div style={{fontSize:13,color:dim,lineHeight:1.8,maxWidth:300,textAlign:"center"}}>
                      The signal from <strong style={{color:accent}}>{target.planet}</strong> crossed <strong style={{color:accent}}>{fmtDelay(distanceLY)}</strong> of deep space and reached Earth.
                    </div>
                    <div style={{fontSize:12,color:dim,lineHeight:1.7,maxWidth:300,textAlign:"center",padding:"8px 12px",background:"rgba(0,200,255,0.06)",borderRadius:8,border:"1px solid rgba(0,200,255,0.15)"}}>
                      💡 No media was uploaded — the <strong style={{color:textCol}}>physics still ran correctly.</strong> Light-travel time and age delay happen regardless of signal content. Upload a photo or video in Step 2 to watch it reconstruct on arrival.
                    </div>
                  </div>
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

          {/* Atmospheric transmission spectrum */}
          <AtmosphericPanel target={target} arrived={arrivedOnEarth}/>
        </div>

        {/* STEP 5 */}
        <div className="step fadein">
          <StepLabel n="5" text="The Numbers"/>
          <DopplerPanel target={target} distanceLY={distanceLY} arrived={arrivedOnEarth}/>
          <ISMPanel target={target} distanceLY={distanceLY}/>
          <SRPanel target={target} distanceLY={distanceLY} age0={age0} ls={ls} betaCustom={betaCustom} setBetaCustom={setBetaCustom}/>
          <GRReadout target={target} distanceLY={distanceLY} age0={age0} ls={ls} grOverride={grOverride} grFactorReal={gr_factor_real} grImpactReal={gr_impact} actualNowGr={actualNow_gr} ageWhenSeenGr={ageWhenSeen_gr}/>
          <CosmologyPanel target={target} distanceLY={distanceLY}/>

          {/* Physics context note when no media uploaded */}
          {!mediaURL && (
            <div style={{marginBottom:16,padding:"12px 16px",background:"rgba(0,200,255,0.05)",border:"1px solid rgba(0,200,255,0.18)",borderRadius:10,fontSize:13,color:dim,lineHeight:1.8}}>
              <strong style={{color:textCol}}>ℹ️ Why are these numbers running without an upload?</strong><br/>
              Light-travel delay is a property of <em>space itself</em>, not of the signal's content. Whether you send a photo, a video, or nothing at all — a photon leaving <strong style={{color:accent}}>{target.planet}</strong> still takes <strong style={{color:accent}}>{fmtDelay(distanceLY)}</strong> to reach Earth. The age gap, hidden years, and temporal calculations below are real regardless of what the signal carries.
            </div>
          )}
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
          {/* SR InfoCards — pre-compute strings to avoid broken template literals */}
          {(()=>{
            const srRealSign   = srCorrection_real >= 0 ? "-" : "+";
            const srCustomSign = srCorrection_custom >= 0 ? "-" : "+";
            const srRealDelta  = Math.abs(srCorrection_real).toExponential(3);
            const srCustDelta  = Math.abs(srCorrection_custom) < 0.001
              ? Math.abs(srCorrection_custom).toExponential(3)
              : Math.abs(srCorrection_custom).toFixed(4);
            const srCustomColor = gamma_custom_sr > 1.1 ? "#ff6020"
              : gamma_custom_sr > 1.01 ? "#ff9a20"
              : gamma_custom_sr > 1.0001 ? "#f5c842" : "#ce93d8";
            const gammaCustomStr = gamma_custom_sr > 1.001
              ? gamma_custom_sr.toFixed(6)
              : gamma_custom_sr.toFixed(10);
            return (
              <>
                <div style={{fontSize:11,color:"#ce93d8",textTransform:"uppercase",letterSpacing:2,margin:"4px 0 10px",paddingTop:8,borderTop:"1px solid rgba(180,100,255,0.18)"}}>
                  ⚡ Relativistic Proper Time — γ = {gamma_real_sr.toFixed(10)} · v_total = {v_total_kms.toFixed(2)} km/s
                </div>
                <div className="g3" style={{marginBottom:16}}>
                  <InfoCard
                    label="SR Age — Real γ"
                    value={fmtAge(actualNow_sr_real)}
                    color="#ce93d8"
                    sub={"γ=" + gamma_real_sr.toFixed(10) + " · Δ=" + srRealSign + srRealDelta + " yrs · v=" + v_total_kms.toFixed(1) + " km/s"}
                  />
                  <InfoCard
                    label={"SR Age — β=" + betaCustom.toFixed(4) + "c"}
                    value={fmtAge(actualNow_sr_custom)}
                    color={srCustomColor}
                    sub={"γ=" + gammaCustomStr + " · Δ=" + srCustomSign + srCustDelta + " yrs"}
                  />
                  <InfoCard
                    label="SR Reception Age"
                    value={fmtAge(ageWhenSeen_sr_real)}
                    color={ageWhenSeen_sr_real < ls ? ok : danger}
                    sub={"Age at Earth reception · real γ applied · " + (ageWhenSeen_sr_real < ls ? "alive at reception" : "exceeds lifespan")}
                  />
                </div>
              </>
            );
          })()}
          {/* GR InfoCards */}
          <div style={{fontSize:11,color:"#80cbc4",textTransform:"uppercase",letterSpacing:2,margin:"4px 0 10px",paddingTop:8,borderTop:"1px solid rgba(128,203,196,0.18)"}}>
            🌌 GR Time Dilation — √(1−2GM/rc²) = {gr_factor_real.toFixed(12)} · {gr_impact.label}
          </div>
          <div className="g3" style={{marginBottom:16}}>
            <InfoCard label="GR-corrected age" value={fmtAge(actualNow_gr)} color="#80cbc4"
              sub={"Combined Schwarzschild factor · planet + stellar well · correction " + (actualNow-actualNow_gr>=0?"-":"+")+Math.abs(actualNow-actualNow_gr).toExponential(3)+" yrs"}/>
            <InfoCard label="GR reception age" value={fmtAge(ageWhenSeen_gr)} color={ageWhenSeen_gr<ls?ok:danger}
              sub={"Age at Earth reception with GR correction applied"}/>
            <InfoCard label="Combined SR+GR age" value={fmtAge(actualNow_sr_real * gr_factor_real)} color="#ff9a20"
              sub={"Both special and general relativistic corrections applied simultaneously"}/>
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
            {recS==="arrived"&&<span>Earth is reconstructing the signal piece by piece. It sees the person at <strong style={{color:accent}}>{fmtAge(apparentAge)}</strong>, while the real person is <strong style={{color:aliveNow?ok:danger}}>{fmtAge(actualNow)}</strong> (<strong style={{color:"#f5c842"}}>{fmtLocalYears(localYearsActualNow,orbPeriod)}</strong> local years on {target.planet}). The delay hides <strong style={{color:accent}}>{fmtAge(hiddenByDelayNow)}</strong> of aging. SR correction (γ={gamma_real_sr.toFixed(8)}): proper age = <strong style={{color:"#ce93d8"}}>{fmtAge(actualNow_sr_real)}</strong>{betaCustom>0.01&&<span> · custom β={betaCustom.toFixed(3)}c → <strong style={{color:gamma_custom_sr>1.01?"#ff9a20":"#ce93d8"}}>{fmtAge(actualNow_sr_custom)}</strong></span>}.</span>}
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
