
# 🏺 Hand Gesture Clay Sculpting (Three.js + MediaPipe)

A real-time 3D clay sculpting experiment using **Three.js** and **MediaPipe Hand Tracking**.

The project allows users to sculpt a virtual clay pot using hand gestures:
- Move finger → control sculpting point
- Pinch gesture → change clay radius
- Open palm → rotate camera
- Special finger gesture → stretch/compress clay height

---

# 🚀 Installation

## Requirements

- Node.js
- Webcam
- Modern browser (Chrome/Firefox recommended)

---

## Install dependencies

```bash
npm install
```

---

## Run development server

```bash
npm run dev
```

Open:

```
http://localhost:5173
```

Allow camera permission when requested.

---

# 📂 Project Structure

```
src/
│
├── main.js          # Three.js scene + gesture controls
├── hand.js          # MediaPipe initialization and detection
├── environment.js   # Environment view
├── style.css
│
└── assets/
```


---

# ✋ Hand Gesture Controls

## 1. Index Finger Sculpt Tool

### Gesture

Point with index finger:

```
☝️
```

The fingertip becomes the sculpting tool.

Movement controls:

```
Move finger around clay
        ↓
Move sculpt position
```

The red sphere shows the detected fingertip position.

---

# 2. Pinch Gesture - Clay Radius

### Gesture

Pinch:

```
👌
```

Thumb + index finger close together.

Action:

```
Move hand left/right
        ↓
Expand or shrink clay radius
```

Example:

```
Move right
    ↓
Increase radius

Move left
    ↓
Decrease radius
```

---

# 3. Open Palm - Camera Rotation

### Gesture

Open hand:

```
🖐️
```

All fingers extended.

Action:

Move palm vertically:

```
Move hand up
        ↓
Camera rotates upward


Move hand down
        ↓
Camera rotates downward
```

---

# 4. Height Stretch Gesture

### Gesture

Two fingers open:

```
✌️
```

Index + middle finger open.

Ring + pinky closed.

Action:

Move hand vertically:

```
Move hand upward
        ↓
Stretch clay height


Move hand downward
        ↓
Compress clay height
```

---

# Gesture Priority

To prevent conflicts:

```
Open Palm
    |
    └── Camera control


Pinch
    |
    └── Radius sculpting


Peace gesture
    |
    └── Height control


Index finger
    |
    └── Sculpt position
```

Only one major action should activate at a time.

---

# 🧠 Technical Overview

## Hand Tracking

Powered by:

- MediaPipe Tasks Vision
- Hand Landmark Model

The model detects:

```
21 hand landmarks
```

Important landmarks:

```
0  = Wrist

4  = Thumb tip

8  = Index tip

12 = Middle tip

16 = Ring tip

20 = Pinky tip
```

---

# Clay System

The clay object uses:

```
THREE.LatheGeometry
```

A 2D profile is rotated around the Y-axis:

```
Profile points
        |
        ↓
LatheGeometry
        |
        ↓
3D clay pot
```

Vertex positions are modified directly:

```
vertex position
        |
        ↓
radius deformation
        |
        ↓
height deformation
```

---

# Debug Mode

Debug helpers:

- Camera video preview
- Finger mesh

should only appear when:

```javascript
const DEBUG = true;
```

Disable:

```javascript
const DEBUG = false;
```

---

# Current Features

✅ Three.js 3D clay pot    
✅ Real time finger control  
✅ Open palm camera control       
✅ Environment 3D
✅ Gesture guide
✅ Debug feature
❌ Measurement for the real usage
❌ Texture Advanced
❌ Sound system
❌ Printable screenshot 
❌ Painting system

---
# Credits

Built with:

- Three.js
- MediaPipe Tasks Vision
- WebGL
- Vite