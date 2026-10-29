# Roadmap and acceptance criteria

## M0 — Library foundation (in progress)
- [x] Recursive directory scan and incremental file indexing
- [x] SHA-256 fingerprints; SQLite persistent catalog
- [x] Basic JSON library, summary and health endpoints
- [ ] Initial GUI library views (table, grid, timeline, calendar)
- [ ] Multiple monitored roots, watcher/scan scheduler, cancel and progress
- [ ] Tests across renamed files, corrupt files, permissions and large directories

## M1 — Real replay decoding
- [ ] Integrate/version Boxcars or rrrocket; Windows parser distribution
- [ ] Extract metadata, player identities, timestamps, teams, mode, map
- [ ] Frame-level car/ball tracks with explicit missing-data handling
- [ ] Test decoding the five supplied benchmark replays

## M2 — Baseline metrics
- [ ] Goals/saves/credited shots and normalized playing time
- [ ] Speed, air/wall time and boost usage/path maps
- [ ] Time-series comparison by selected player and playlist
- [ ] CSV/JSON exports with unit + detector provenance

## M3 — Visual replay viewer
- [ ] Arena asset coordinate matching and world-space camera
- [ ] Render vehicles and ball from decoded frames
- [ ] Seek, scrub, frame stepping, speed change, event bookmarking
- [ ] Adjustable trajectories, vectors, boost path, shot traces and overlays

## M4 — Advanced inference
- [ ] Kickoff window, first touch, kickoff outcome
- [ ] Shot detection/placement/accuracy/speed
- [ ] 50/50 detection, immediate possession classifier
- [ ] Momentum loss, recoveries and mechanic detectors
- [ ] Human-label review and detector confidence calibration

## M5 — Product polish
- [ ] Installer and integrated dependency/codec management
- [ ] Searchable event clips and multi-replay comparison
- [ ] Performance profiling on directories of 1k–10k replays
- [ ] Privacy, crash recovery, error telemetry opt-in
- [ ] Continuous benchmark and regression suites

## Done means
For any displayed metric, users can see its source, exact definition, units, missing-data fraction and inference confidence. Directory import is restartable, skips bad files without blocking the batch, and doesn't modify original replay files.
