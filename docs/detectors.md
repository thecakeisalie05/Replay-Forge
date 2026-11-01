# Extensible event detectors

Detectors are pure, versioned modules in `src/detectors/registry.ts`. Their output is a `ReplayEvent` with time, type, actor ID, evidence position, detector version and confidence.

The initial detectors identify **rapid slowdowns** and **rising above a height threshold**. Neither proves a mechanical error, wavedash, zapdash, 50/50, or aerial success. They are *candidates only* and may trigger on intentional braking, driving up walls or other normal play.

Future detector implementations should:
1. Define input requirements (pose, velocity, contacts, rigid body orientation, boost/input).
2. Validate against a human-labelled replay set and publish precision/recall.
3. Report missed-data coverage, candidate confidence and uncertainty.
4. Avoid counting events across corrupt/gapped telemetry.
5. Emit events independently from Three.js and enable toggling by detector ID.

Physics-only replays generally do not provide authoritative button presses, so speedflip and zapdash success claims require particularly careful validation.
