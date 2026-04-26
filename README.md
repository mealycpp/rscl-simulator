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

A **light-year is a distance**, not a time unit. Once the propagation speed is fixed at $c$, that distance immediately implies a **light-travel time**.

This simulator was built to make that relationship computationally explicit, visually intuitive, and scientifically grounded.

---

## 🧮 Mathematical Model

### Quick Summary

$$t_{\text{travel}} = \frac{d}{c}$$

$$t_{\text{arrival}} = t_{\text{event}} + t_{\text{travel}}$$

$$t_{\text{apparent}} = \text{age at event}, \qquad t_{\text{actual}} = \text{age at event} + t_{\text{travel}}, \qquad t_{\text{hidden}} = t_{\text{travel}}$$

> When distance $d$ is expressed in light-years and $c = 1 \, \text{ly/yr}$,
> the travel time in years equals the distance in light-years numerically.

---

### Full Breakdown

#### Variables

| Symbol | Description | Units |
|---|---|---|
| $d$ | Distance from source to Earth | light-years (ly) |
| $c$ | Speed of light $= 1$ | ly / yr (natural units) |
| $t_{\text{event}}$ | Time at which the event occurs at the source | years (yr) |
| $t_{\text{travel}}$ | Light-travel time from source to Earth | yr |
| $t_{\text{arrival}}$ | Time the signal arrives at Earth | yr |
| $\text{age}_{\text{event}}$ | Age of subject when the event occurs | yr |
| $\text{age}_{\text{apparent}}$ | Age Earth perceives the subject to be | yr |
| $\text{age}_{\text{actual}}$ | True age of subject when signal arrives at Earth | yr |
| $\text{age}_{\text{hidden}}$ | Temporal gap concealed by light-travel delay | yr |

---

#### 1. Light-Travel Time

The time for a photon to travel from the source to Earth:

$$\boxed{t_{\text{travel}} = \frac{d}{c}}$$

In natural units where $c = 1 \, \text{ly/yr}$:

$$t_{\text{travel}} \, [\text{yr}] = d \, [\text{ly}]$$

A source $4.223$ light-years away produces a signal that takes exactly $4.223$ years to reach Earth — no approximation needed.

---

#### 2. Signal Arrival Time

If the event occurs at time $t_{\text{event}}$ measured from some reference epoch:

$$\boxed{t_{\text{arrival}} = t_{\text{event}} + \frac{d}{c}}$$

Earth cannot observe the event until $t_{\text{arrival}}$. Everything in the interval $[t_{\text{event}},\ t_{\text{arrival}})$ is invisible to Earth.

---

#### 3. Apparent Age vs. Actual Age

When the signal arrives, Earth sees the subject frozen at the age they were when the event occurred:

$$\text{age}_{\text{apparent}} = \text{age}_{\text{event}}$$

But time has continued passing at the source. The subject's true age at the moment Earth receives the signal is:

$$\boxed{\text{age}_{\text{actual}} = \text{age}_{\text{event}} + \frac{d}{c}}$$

The temporal gap hidden by propagation delay:

$$\boxed{\text{age}_{\text{hidden}} = \text{age}_{\text{actual}} - \text{age}_{\text{apparent}} = \frac{d}{c} = t_{\text{travel}}}$$

The hidden age is exactly equal to the light-travel time.

---

#### 4. Worked Example

Let the target be **Proxima Centauri b** at $d = 4.223 \, \text{ly}$, with $c = 1 \, \text{ly/yr}$, and a subject aged $25$ years at the time of the event ($t_{\text{event}} = 0$):

$$t_{\text{travel}} = \frac{4.223}{1} = 4.223 \, \text{yr}$$

$$t_{\text{arrival}} = 0 + 4.223 = 4.223 \, \text{yr}$$

$$\text{age}_{\text{apparent}} = 25 \, \text{yr}$$

$$\text{age}_{\text{actual}} = 25 + 4.223 = 29.223 \, \text{yr}$$

$$\text{age}_{\text{hidden}} = 4.223 \, \text{yr}$$

---

#### 5. Relativistic Notes and Model Limitations

This simulator operates in the **non-relativistic limit**, valid when:

$$v_{\text{source}} \ll c$$

In this regime: no time dilation ($\gamma = 1$), no gravitational redshift, and the source and Earth share a common inertial reference frame.

**What this model does NOT account for:**

| Effect | Formula | When it matters |
|---|---|---|
| Special relativistic time dilation | $t_{\text{proper}} = t_{\text{coord}} \cdot \sqrt{1 - v^2/c^2}$ | Source moving at significant fraction of $c$ |
| Gravitational time dilation (GR) | $t_{\text{surface}} = t_{\infty} \cdot \sqrt{1 - \dfrac{2GM}{rc^2}}$ | Near neutron stars or black holes |
| Cosmological redshift | $z = \dfrac{\lambda_{\text{obs}} - \lambda_{\text{emit}}}{\lambda_{\text{emit}}}$ | Extragalactic / cosmological distances |
| Proper motion of source | $d = d(t)$, so $t_{\text{travel}} = \int \frac{dd}{c}$ | Fast-moving or nearby sources |

For stellar distances $d \lesssim 100 \, \text{ly}$ with low relative velocities, the non-relativistic model introduces negligible error and is fully appropriate for educational and visualization purposes.

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
- more advanced signal models (including relativistic corrections)
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
