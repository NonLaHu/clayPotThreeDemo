# 🏺 Hand Gesture Clay Sculpting

### Three.js + MediaPipe Hand Tracking

A real-time 3D clay sculpting experiment built with **Three.js**, **MediaPipe Hand Tracking**, and **WebGL**.

The project lets users interact with a virtual clay pot using hand gestures. The system also supports mouse-based sculpting as a fallback.

### Main interactions

* ☝️ Pointing finger → control sculpting position
* 👌 Pinch → adjust clay radius
* ✌️ Two-finger gesture → stretch/compress clay height
* 🖐️ Open palm → rotate camera
* � Thumbs up → proceed to next room (done button)
* �🖱️ Mouse drag → manual sculpting
* 🔄 Reset → restore the original clay shape
* 📸 Export → save the current pot as a PNG screenshot

---

# 🚀 Installation

## Requirements

* Node.js
* Webcam
* Modern browser
* Browser camera permissions
* WebGL support

Chrome and Firefox are recommended.

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

```text
http://localhost:5173
```

Allow webcam permission when requested.

---

# 📂 Project Structure

```text
src/
│
├── main.js              # Three.js scene, clay system, gestures, animation
├── hand.js              # MediaPipe hand initialization and detection
├── environment.js       # 3D environment setup
├── style.css            # Global styling
│
├── ui/
│   └── ui.js            # UI controls and gesture status HUD
│
└── assets/              # Project assets
```

---

# ✋ Hand Gesture Controls

## 1. ☝️ Index Finger — Sculpt Position

### Gesture

Point with the index finger:

```text
☝️
```

The index fingertip is tracked by MediaPipe and projected into the 3D scene using a raycaster.

```text
Move index finger
        ↓
Raycast into clay
        ↓
Update sculpting position
```

The red sphere represents the 3D finger/tool indicator.

The sculpting brush affects vertices around the detected point.

---

# 2. 👌 Pinch — Clay Radius

### Gesture

Bring the thumb and index finger together:

```text
👌
```

The system calculates the distance between:

```text
Thumb tip  → Landmark 4
Index tip  → Landmark 8
```

When the pinch strength exceeds the activation threshold:

```text
Pinch
  ↓
Move index finger horizontally
  ↓
Change clay radius
```

### Direction

```text
Move right
    ↓
Increase radius


Move left
    ↓
Decrease radius
```

The radius deformation is smoothed through the clay resistance and force limits.

---

# 3. ✌️ Two-Finger Gesture — Height Control

### Gesture

Extend the index and middle fingers while keeping the ring and pinky fingers closed:

```text
✌️
```

Detected configuration:

```text
Index   → Open
Middle  → Open
Ring    → Closed
Pinky   → Closed
```

Action:

```text
Move hand upward
        ↓
Stretch clay


Move hand downward
        ↓
Compress clay
```

The middle finger's vertical movement is used to calculate the height deformation.

The clay height is constrained between:

```text 
0
↓
4 units
```

---

# 4. 🖐️ Open Palm — Camera Control

### Gesture

Open your hand:

```text
🖐️
```

All four fingers must be extended.

The system calculates the average vertical position of:

```text
Wrist
Index base
Middle base
Ring base
Pinky base
```

Then maps that position to the camera angle.

```text
Move palm upward
        ↓
Camera moves upward


Move palm downward
        ↓
Camera moves downward
```

Camera movement is smoothed to prevent abrupt movement.

---

# 5. 👍 Thumbs Up — Done Button

### Gesture

Raise your thumb while keeping other fingers curled:

```text
👍
```

Detected configuration:

```text
Thumb   → Extended upward
Index   → Closed
Middle  → Closed
Ring    → Closed
Pinky   → Closed
```

Action:

```text
Hold thumbs up for 2 seconds
        ↓
Trigger done action
```

The thumbs up gesture is used to transition between rooms:

```text
Sculpt Room → Paint Room → Draw Room
```

A circular timer shows the 2-second countdown when the gesture is detected.

**Note**: Thumbs up is disabled in two scenarios:
1. During color selection mode in the paint room (to prevent accidental room transitions while selecting colors)
2. When pinch strength is above 0.01 (to prevent accidental room transitions while actively sculpting with pinch gesture)

---

# 6. 🖱️ Mouse Sculpting

Hand tracking is not required for basic mouse interaction.

Drag the mouse across the clay:

```text
Mouse drag
    ↓
Horizontal movement
    ↓
Radius deformation
```

Hold:

```text
SHIFT
```

while dragging to control vertical deformation:

```text
SHIFT + drag
      ↓
Height deformation
```

This provides a fallback interaction method when hand tracking is unavailable.

---

# 🎛️ Gesture Priority

The gesture system uses a priority order to prevent multiple controls from fighting each other.

```text
1. Pinch
      ↓
   Radius control

2. Two-finger gesture
      ↓
   Height control

3. Open palm
      ↓
   Camera control

4. Thumbs up
      ↓
   Done button (room transition)

5. Pointing gesture
      ↓
   Sculpting position

6. Unknown gesture
      ↓
   No dedicated gesture action
```

The system therefore prioritizes:

```text
PINCH
  >
HEIGHT
  >
OPEN PALM
  >
THUMBS UP
  >
POINTING
```

For example, an open palm will not activate camera control while the pinch gesture is active.

---

# 🧠 Technical Overview

## Hand Tracking

Hand tracking is handled by:

* MediaPipe Tasks Vision
* MediaPipe Hand Landmark Model

The system receives:

```text
21 hand landmarks
```

Important landmarks:

```text
0  = Wrist

4  = Thumb tip

8  = Index tip

12 = Middle tip

16 = Ring tip

20 = Pinky tip
```

The landmarks are used for:

* Gesture recognition
* Finger positioning
* Pinch detection
* Camera control
* Clay interaction

---

# 🏺 Clay System

The clay pot is generated using:

```javascript
THREE.LatheGeometry
```

A 2D radial profile is created first:

```text
2D profile
    ↓
LatheGeometry
    ↓
3D rotational mesh
    ↓
Clay pot
```

The geometry contains:

```text
Outer wall
Inner wall
Base
```

The clay is dynamically deformed by modifying the geometry's vertex positions directly.

---

## Radius Deformation

For each vertex:

```text
Current vertex
      ↓
Calculate radius
      ↓
Apply deformation
      ↓
Update X/Z position
```

The deformation is influenced by the vertical distance from the sculpting point.

---

## Height Deformation

Height changes modify the Y coordinate:

```text
Current Y
   ↓
Height scale
   ↓
Clamp to MAX_HEIGHT
   ↓
New Y
```

The current maximum height is:

```javascript
const MAX_HEIGHT = 4;
```

---

## Vertex Normals

After deformation:

```javascript
geometry.computeVertexNormals();
```

is called to keep the clay lighting and surface shading updated.

---

# 🔄 Reset System

The original clay vertex positions are stored when the geometry is created.

```javascript
const initialClayPositions =
  geometry.attributes.position.array.slice();
```

When Reset is selected:

```text
Current clay
     ↓
Restore original vertices
     ↓
Recalculate normals
     ↓
Original clay shape
```

A confirmation dialog is displayed before resetting.

---

# 📸 Export System

The current 3D scene can be exported as a PNG image.

The renderer uses:

```javascript
preserveDrawingBuffer: true
```

The export process is:

```text
Current scene
     ↓
Render
     ↓
Canvas
     ↓
PNG
     ↓
Download
```

The generated file uses the format:

```text
clay-pot-TIMESTAMP.png
```

---

# 🖥️ Gesture HUD

The UI displays the current interaction state.

Examples:

```text
Adjusting Radius
Stretching Height
Rotating Camera
Sculpting Point Active
Waiting for hand gesture...
```

The HUD provides immediate feedback about which gesture the application is currently detecting.

---

# 🐞 Debug Mode

Debug mode is controlled by:

```javascript
const DEBUG = true;
```

When enabled, the application displays the webcam feed and a hand landmark debug canvas.

The debug visualization shows:

```text
21 hand landmarks
        +
Hand connections
```

To disable the camera/debug visualization:

```javascript
const DEBUG = false;
```

The gesture tracking system itself can still operate when debug visualization is disabled.

---

# 🌎 Environment

The 3D environment is initialized through:

```javascript
setupEnvironment(scene);
```

The environment is separated into:

```text
environment.js
```

so that scene/environment configuration does not need to be mixed with the clay interaction system.

---

# 🛠️ Current Features

### Implemented

* ✅ Three.js 3D clay pot
* ✅ Real-time MediaPipe hand tracking
* ✅ 21-point hand landmark detection
* ✅ Index finger sculpt positioning
* ✅ Pinch radius control
* ✅ Two-finger height control
* ✅ Open palm camera control
* ✅ Mouse sculpting fallback
* ✅ Shift + mouse height control
* ✅ Gesture priority system
* ✅ Gesture status HUD
* ✅ 3D finger/tool indicator
* ✅ Dynamic clay vertex deformation
* ✅ Dynamic vertex normals
* ✅ Clay reset system
* ✅ PNG screenshot export
* ✅ 3D environment
* ✅ Debug hand visualization
* ✅ Responsive renderer resizing

### Planned / Not Yet Implemented

* ❌ Real-world measurement system
* ❌ Advanced clay textures
* ❌ Sound system
* ❌ Painting/coloring system
* ❌ Advanced sculpting brushes
* ❌ More advanced gesture recognition
* ❌ Persistent clay/project saving

---

# 🧱 Technology Stack

```text
Frontend
    ↓
JavaScript
    ↓
Three.js
    ↓
WebGL
    ↓
MediaPipe Tasks Vision
    ↓
Webcam Hand Tracking
```

### Main technologies

* **Three.js** — 3D rendering and geometry
* **MediaPipe Tasks Vision** — hand tracking
* **WebGL** — GPU-accelerated rendering
* **Vite** — development server and build tooling
* **JavaScript** — application logic

---

# 📦 Credits

Built with:

* Three.js
* MediaPipe Tasks Vision
* WebGL
* Vite

---

# 📄 License

Add your project license here if applicable.
