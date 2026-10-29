# Replay Forge architecture

## Layers

1. **Library indexer:** recursive folder scan, SHA-256 deduplication, SQLite cache, renamed/moved file detection, incremental rescans.
2. **Replay decoder:** Rust Boxcars/rrrocket adapter; capture header, frame metadata, actor replication/state and parser warnings. Pin parser version.
3. **Normalization:** turn decoded frames into timestamped, player-attributed position, rotation, linear/angular velocity, boost and contact signals; handle missing packets and irregular timestamps.
4. **Event inference:** deterministic event detectors output `{type, start, end, actors, confidence, evidence, detector_version}`. Label uncertain events as estimates.
5. **Metrics engine:** produce per-player/per-match statistics with units, coverage, denominator, methodology, confidence. Persist versioned summaries.
6. **Query service:** time ranges, playlist, player, rank (if known), map, opponent, session, perspective, and minimum data quality.
7. **Replay viewer:** Three.js arena/cars/ball playback, time scrubbing, camera modes, overlays, event timeline, exportable clips. Physics visualization is reconstructed from replay states, not guaranteed native game simulation.
8. **Desktop shell:** Electron or Tauri with first-run dependency checks, settings, offline mode, and safe update flow.

## Frame pipeline

```
.replay -> boxcars decode -> raw events -> normalized frame stream
          |                                  |
          +-> header/library metadata        +-> derived events
                                                  |
                                             metric snapshots
                                                  |
                                          SQLite + columnar cache
                                                  |
                                      library / trends / 3D viewer
```

## Important limits

Rocket League replay files generally provide replicated physics/game state, **not authoritative player button presses**. A jump, flip cancel, wavedash, or zapdash should be classified using observable state transitions and validated heuristics. "Forces" may be approximated from velocity deltas and effective physics assumptions; they are not directly measured forces.

Kickoff win, 50/50 success, possession, momentum loss, and shot accuracy are operational definitions, not standard packet fields. User-configurable thresholds, uncertainty flags, and detector calibration are required.

Always separate game-provided goals/saves/shots from model-derived shot opportunities or possession changes. Some player-specific events may not be reliably recoverable from every replay version.

## Initial backend

The `replay_forge` module currently provides an HTTP JSON endpoint to test the library experience. It is intentionally isolated from the future Rust decoding service so the parser can be changed without rewriting library UX.

Potential schema:
- `ReplayFile`: file_id, path, sha256, size, mtime, decode_state, decode_error
- `Match`: match_id, kickoff/start/end, playlist, map, duration, teams, players
- `Frame`: match_id, time, actor, state, quality
- `Event`: match_id, detector, event_type, t0, t1, participants, evidence, confidence
- `Metric`: match_id, player_id, name, unit, numerator, denominator, value, methodology, coverage
