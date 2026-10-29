# Replay Forge

A local-first Rocket League replay studio. **Electron + React + TypeScript** desktop foundation with a restrained technical dark UI, navigation rail, searchable replay library, detail inspector, and import progress.

## Desktop (current path)

Requirements: Node.js 20.19+ or 22+, Windows 10/11.

```powershell
npm install
npm run dev
```

Build a Windows installer:

```powershell
npm run build
```

Installer output: `release/`. GitHub Actions: [Electron Windows installer](.github/workflows/electron-windows.yml) (manually run for an installer build artifact, or tag `desktop-v*` to trigger a prerelease). A GitHub-hosted Windows build is **not yet verified**.

### Currently implemented

- Native Electron window with context-isolated, sandboxed renderer and narrow IPC bridge
- React/TypeScript dark UI in the shared studio design language
- Library table and grid, filename/path search, contextual file inspector
- Directory picker, recursive `.replay` indexing, incremental rescans, SHA-256 fingerprinting, progress messages
- Persistent local catalog in Electron app user-data folder (JSON, an interim store)

### Not yet implemented

- Boxcars/Rocket League physics decoding
- Advanced metadata and real match statistics
- Analytics dashboard, replay reconstruction, Three.js viewer, mechanics detection
- Scalable SQLite data layer, automatic parser installation, cancellation and paging

These planned surfaces are **explicitly marked unavailable** in the app. Do not mistake indexed file metadata for game metrics.

## Legacy prototype

The `replay_forge/` Python module is a previous proof-of-concept scanner and HTTP library API, **not the desktop app**. The previous Python/Tkinter Windows packaging pipeline is deprecated; development should target Electron.

## Product specification

- [Architecture](docs/architecture.md)
- [Metrics and definitions](docs/metrics.md)
- [Roadmap](docs/roadmap.md)

Never modify imported `.replay` files. Keep source replays on disk, compute derived data locally, record detector provenance and uncertainty.
