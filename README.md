<div align="center">

# Futurely

**A floating desktop task list for Windows — always on top, out of the way when you don't need it.**

[![Release](https://img.shields.io/github/v/release/LiuZQ802/futurely?style=flat-square&color=818cf8)](https://github.com/LiuZQ802/futurely/releases)
[![Platform](https://img.shields.io/badge/platform-Windows-blue?style=flat-square)](https://github.com/LiuZQ802/futurely/releases)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)

</div>

---

## Features

- **Edge Snap** — drag the widget to any screen edge and it slides out of sight. Hover near the edge to reveal it, move away to hide it again.
- **Always on Top** — floats above all windows without getting in the way.
- **3 Themes** — Dark · Light · Midnight, switched instantly from settings.
- **Bilingual** — Chinese / English UI toggle.
- **Priority & Status** — Urgent / High / Medium / Low priorities with color coding. One-click status cycling (Todo → In Progress → Done).
- **Deadline Reminders** — set advance notice by hours and minutes; notified on app launch.
- **Tags & Assignees** — organize tasks with custom tags and assignees.
- **Resizable** — drag any edge or corner to resize the window.
- **Collapse to Mini Button** — shrink to a 64 px icon when not needed, snap that to an edge too.

---

## Installation

Download the latest `Futurely-Setup-x.x.x.exe` from [Releases](https://github.com/LiuZQ802/futurely/releases) and run it.

> Windows 10 / 11 · No runtime required.

---

## Usage

| Action | How |
|---|---|
| Move window | Drag the title bar |
| Snap to edge | Drag near any screen edge — auto-hides |
| Reveal hidden widget | Hover mouse near the screen edge |
| Resize | Drag any border or corner |
| Collapse | Click **—** button or lose focus |
| Expand | Click the mini button |
| New task | Click **＋** in the header |
| Edit / delete task | Click any task card |
| Cycle task status | Click the circle button on a card |
| Settings | Click **⚙** in the header |

---

## Screenshots

> *(Add screenshots here)*

---

## Tech Stack

| Layer | Technology |
|---|---|
| Shell | [Electron](https://www.electronjs.org/) 28 |
| UI | [Vue 3](https://vuejs.org/) + Composition API |
| State | [Pinia](https://pinia.vuejs.org/) |
| Build | [Vite](https://vitejs.dev/) 5 + electron-builder |
| Icons | Code-generated PNG (no external assets) |

---

## Development

```bash
# Install dependencies
npm install

# Run in dev mode (hot reload)
npm run dev

# Build for production
npm run build

# Package as Windows installer
npm run pack
```

> **Note:** packaging requires Windows Developer Mode enabled (for symlink support in electron-builder).

---

## Project Structure

```
futurely/
├── electron/
│   ├── main.js          # Main process — window, tray, edge-snap, IPC
│   └── preload.js       # Context bridge
├── src/
│   ├── i18n.js          # zh / en locale messages
│   ├── store/tasks.js   # Pinia store — tasks, settings
│   ├── assets/glass.css # Design tokens + themes
│   └── components/
│       ├── FloatingWidget.vue
│       ├── WidgetHeader.vue
│       ├── TaskList.vue
│       ├── TaskCard.vue
│       ├── TaskForm.vue
│       ├── MiniButton.vue
│       └── SettingsPanel.vue
├── scripts/
│   ├── dev.js           # Dev server wait script
│   └── gen-icon.js      # Generates public/icon.png + icon.ico
└── .github/workflows/
    └── release.yml      # Build & publish on git tag push
```

---

## Releasing

Pushing a version tag triggers GitHub Actions to build the installer and create a draft release:

```bash
git tag v0.2.0
git push origin v0.2.0
```

Then review and publish the draft on GitHub.

---

## License

MIT © Ziqi Liu
