# PROTOCOLO ORIÓN: ENLACE NEURONAL

A high-fidelity, minimalist, and extremely addictive web game built with React + Vite.

## Concept
Cyber-Terminal aesthetic programming game where you build logic programs to control a bot through enemy-filled grid levels.

## Tech Stack
- **React 18** + Vite
- **Redux Toolkit** — full game state + program state
- **React DnD** — drag & drop logic block builder  
- **Canvas API** — viewport rendering with animations
- **VT323 + Share Tech Mono** — authentic CRT fonts

## Features
- 🤖 Bot controlled via visual programming (MOVE, ROTATE, IF_SENSOR, LOOP_UNTIL)
- 🧠 A* pathfinding enemies that adapt and chase you
- ⚡ Energy system: E = v² × t
- 💾 Memory Buffer limit per level — optimize your program
- 🔀 Logic Gates: AND, OR, NOT, XOR as physical obstacles
- 🔁 RECURSE block for recursive program calls
- 📟 Live console with stack traces on failure
- 5 progressive levels with increasing difficulty

## Setup
```bash
npm install
npm run dev
```

## How to Play
1. Drag blocks from the palette to the Logic Deck
2. Configure block parameters (steps, direction, range)
3. Hit EXEC to run your program
4. Bot executes step by step — collect all data nodes then reach the exit
5. Watch out for enemies! Use IF_SENSOR to detect threats

## Levels
1. **BOOT SEQUENCE** — Learn the basics, no enemies
2. **SENSOR PROTOCOL** — One patrol enemy, use IF_SENSOR
3. **LOOP MATRIX** — Memory limited to 64KB, use LOOP_UNTIL
4. **GATE PROTOCOL** — Logic gate obstacles, 2 enemies
5. **NEURAL SIEGE** — 3 A* hunters, 48KB memory, recursion required

Built by Hello Kitty Vibe Coder Agent 🎀
