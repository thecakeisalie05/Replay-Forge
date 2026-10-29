# Replay Forge

**Local-first Rocket League replay library, analytics engine, and replay viewer.**

Replay Forge aims to import an entire directory of `.replay` files and let players navigate, compare, visualize, and understand improvements across months or years.

## Status

**Architecture and first library API scaffold.** The current backend discovers and catalogs replay files, fingerprints them, indexes them in SQLite, supports filtering, and exposes the catalog over HTTP. **It does not yet decode physics frames or provide a 3D viewer.** Never interpret file-count or filesize metrics as gameplay performance.

## Product goals

- Import a replay folder recursively, including new or changed files on rescan.
- Offer list, dense table, calendar, timeline, and thumbnail/grid library views with powerful filters.
- Track multi-match metrics with time-range, playlist, role, and opponent filters.
- Reconstruct game state through a synchronized 3D timeline with adjustable speed, multi-camera playback, overlays and event bookmarks.
- Overlay paths, velocity, boost pickups, contacts, jump events, inferred accelerations, and physics-derived forces (with clearly stated assumptions).
- Explain the evidence and confidence for mechanics and inferred events, never turn heuristics into ground truth.
- Offline-first operation; no mandatory replay uploads.

Read [docs/architecture.md](docs/architecture.md), [docs/metrics.md](docs/metrics.md), and [docs/roadmap.md](docs/roadmap.md).

## Prototype API

Requirements: Python 3.11+. No third-party dependencies for the initial scanner/API.

```powershell
python -m replay_forge scan "C:\Path\To\Rocket League\Demos"
python -m replay_forge serve --port 8765
```

API: `http://127.0.0.1:8765/replays`, `/summary`, `/health`. The scanner reads only replay file metadata and hashes, not decoded gameplay. The database defaults to `~/.replay_forge/library.sqlite3`.

Once parser integration is done, replay metadata and derived match data will be populated by an independent worker. The application must remain functional when individual replay files are corrupt or unsupported.

## Design principles

- Preserve raw parser output; store normalized values separately with parser and detection version.
- Each metric has a definition, unit, coverage rate, and provenance.
- Always group or normalize results by game mode (1v1/2v2/3v3), duration, and player identity.
- Keep detection algorithms independently testable with labeled replay clips.
- Parsing and indexing should be background jobs with cancellation, progress and error reporting.
- All potentially destructive operations require explicit consent.
- Default to read-only source directories.
