<div align="center">

# 🌍 Earth Lookback Simulator
### *A scientific visualization platform for light-travel delay, remote observation, and temporal interpretation*

<p>
  <img src="https://img.shields.io/badge/RSCL-Cal%20Poly%20Pomona-0a6cff?style=for-the-badge" alt="RSCL CPP" />
  <img src="https://img.shields.io/badge/Scientific%20Visualization-Astrophysics-7b61ff?style=for-the-badge" alt="Scientific Visualization" />
  <img src="https://img.shields.io/badge/Frontend-React%20%2B%20Vite-00c8ff?style=for-the-badge" alt="React Vite" />
  <img src="https://img.shields.io/badge/License-MIT-00b894?style=for-the-badge" alt="MIT License" />
</p>

<p>
  <b>Designed by Dr. Mohamed El-Hadedy</b><br/>
  Director of the <b>Reconfigurable Space Computing Lab (RSCL)</b><br/>
  California State Polytechnic University, Pomona
</p>

</div>

---

## ✨ Overview

**Earth Lookback Simulator** is an interactive astrophysical visualization tool that models a fundamental reality of remote observation:

> When Earth observes a distant target, it does **not** observe that target in its instantaneous present state.  
> It observes the target through a delay imposed by the **finite speed of light**.

This platform allows a user to choose a planetary target, define an event at the source, upload an image or video, and watch a photon signal propagate toward Earth. The simulator distinguishes between:

- the **apparent state embedded in the received signal**
- the **actual physical state at the source**
- the **temporal gap hidden by light-travel delay**

---

## 🚀 Why this project matters

Astronomical distances are often quoted in **light-years**, but that term is frequently misunderstood.

A **light-year is a distance**, not a time unit. Once the propagation speed is fixed at `c`, that distance immediately implies a **light-travel time**.

This simulator was built to make that relationship computationally explicit, visually intuitive, and scientifically grounded.

---

## 🔭 Core Capabilities

### 🪐 Target selection
Choose from catalog-based exoplanetary systems or enter a custom target manually.

### ⚡ Photon propagation
Watch a signal leave the source and travel toward Earth through an animated visual model.

### 🖼️ Media-based event modeling
Upload an image or video to represent the event occurring at the remote source.

### ⏳ Temporal interpretation
See the difference between:
- **what Earth sees**
- **the actual state at the source**
- **the age hidden by propagation delay**

### 📊 Scientific reasoning
Quantify:
- source-to-Earth distance
- one-way light-travel time
- event time
- arrival time
- apparent age vs. actual age

---

## 🧠 Scientific Model

The simulator currently uses a simplified but physically meaningful model:

- A target is assigned a distance from Earth.
- Light-travel time is computed as:

```text
travel time = distance / c
```

If distance is expressed in light-years, then the numerical travel time in years is equal to that distance.

The received signal therefore represents a past state of the source.

### Example

If a person is 25 years old when an event occurs on a target 4.223 light-years away:

- Earth sees the person at age **25**
- Actual target age at first Earth reception is about **29.223**
- Age hidden by delay is about **4.223 years**

---

## 🛠️ Tech Stack

- React
- Vite
- HTML5 Canvas
- GitHub Pages for static hosting
- GitHub Actions for deployment

---

## 📁 Repository Structure

```
rscl-simulator/
├── src/
│   └── App.jsx
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
└── .github/
    └── workflows/
```

---

## ▶️ Local Development

```bash
npm install
npm run dev
```

**Build locally:**

```bash
npm run build
npm run preview
```

---

## 🌐 Deployment

This repository is designed for deployment through GitHub Pages using GitHub Actions.

The site is intended to publish as a project page under:

```
https://mealycpp.github.io/rscl-simulator/
```

---

## 🔬 Current Scope

This version is an early research-driven prototype focused on:

- light-travel delay visualization
- temporal interpretation of remote observation
- exoplanet-inspired interaction
- scientific user experience design

Future expansions may include:

- richer astrophysical catalogs
- stronger physical parameterization
- more advanced signal models
- server-backed data collection for end-user interaction studies

---

## 🏛️ RSCL

This project is part of the broader vision of the **Reconfigurable Space Computing Lab (RSCL)** at Cal Poly Pomona, where we explore computational systems, scientific platforms, and interactive tools that make complex space-related concepts more explicit, rigorous, and usable.

---

## 🙏 Acknowledgment

Supported in part by **AFRL** and **US NAVY**.

---

## 📜 License

This project is released under the [MIT License](LICENSE).
