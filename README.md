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

## 🧮 Mathematical Model

### Quick Summary

```
t_travel = d / c

t_arrival = t_event + t_travel

age_apparent = age_at_event
age_actual   = age_at_event + t_travel
age_hidden   = t_travel
```

If distance is given in light-years and speed of light is 1 ly/yr,
then t_travel (in years) equals d (in light-years) numerically.

---

### Full Breakdown

#### Variables

```
d            = distance from source to Earth                    [light-years, ly]
c            = speed of light = 1                              [ly / yr]  (natural units)
t_event      = time at which the event occurs                  [years, yr]
t_travel     = time for light to travel from source to Earth   [yr]
t_arrival    = time at which the signal arrives at Earth       [yr]
age_event    = age of the subject at the moment the event occurs        [yr]
age_apparent = age Earth perceives the subject to be upon signal arrival
age_actual   = true age of the subject at the moment Earth receives the signal
age_hidden   = temporal gap concealed by light-travel delay
```

---

#### 1. Light-Travel Time

The time it takes for a photon to travel from the source to Earth:

```
t_travel = d / c
```

In natural units where c = 1 ly/yr:

```
t_travel [yr] = d [ly]
```

This means a source 4.223 light-years away produces a signal that takes
exactly 4.223 years to reach Earth — no approximation needed.

---

#### 2. Signal Arrival Time

If the event occurs at time t_event (measured from some reference epoch):

```
t_arrival = t_event + t_travel
          = t_event + d / c
```

Earth cannot observe the event until t_arrival.
Everything between t_event and t_arrival is invisible to Earth.

---

#### 3. Apparent Age vs. Actual Age

When Earth receives the signal, the subject in the signal appears to be:

```
age_apparent = age_event
```

Earth sees the subject frozen at the age they were when the event occurred.
But in reality, time has continued to pass at the source:

```
age_actual = age_event + t_travel
           = age_event + d / c
```

The gap between what Earth sees and what is actually true:

```
age_hidden = age_actual - age_apparent
           = t_travel
           = d / c
```

The hidden age is exactly equal to the light-travel time.

---

#### 4. Worked Example

```
Target distance      d          = 4.223 ly        (Proxima Centauri b, approx.)
Speed of light       c          = 1 ly/yr
Age at event         age_event  = 25 yr
Event time           t_event    = 0 yr             (reference epoch)

Light-travel time:
  t_travel  = d / c  =  4.223 / 1  =  4.223 yr

Signal arrival time:
  t_arrival = t_event + t_travel  =  0 + 4.223  =  4.223 yr

Apparent age (what Earth sees):
  age_apparent = 25 yr

Actual age at arrival:
  age_actual = 25 + 4.223  =  29.223 yr

Age hidden by delay:
  age_hidden = 4.223 yr
```

---

#### 5. Relativistic Notes and Model Limitations

This simulator operates in the **non-relativistic limit**, which is valid when:

```
v_source << c       (source velocity is negligible relative to c)
```

In this regime:

- No time dilation is applied (Lorentz factor gamma = 1)
- No gravitational redshift is modeled
- The source and Earth share a common reference frame
- The speed of light is treated as exactly c in all directions

**What this model does NOT account for:**

```
1. Special relativistic time dilation
      t_proper = t_coordinate * sqrt(1 - v^2/c^2)
      -- relevant only if the source is moving at a significant fraction of c

2. Gravitational time dilation (General Relativity)
      t_surface = t_infinity * sqrt(1 - 2GM / rc^2)
      -- relevant near massive compact objects (neutron stars, black holes)

3. Cosmological redshift
      z = (lambda_observed - lambda_emitted) / lambda_emitted
      -- relevant for extragalactic sources at cosmological distances

4. Proper motion of the source
      -- changes d over time, making t_travel a function of t_event
```

For targets at stellar distances (< ~100 ly) with low relative velocities,
the non-relativistic model used here introduces negligible error
and is appropriate for educational and visualization purposes.

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
