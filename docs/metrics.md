# Metrics specification (proposed)

Metrics are **not yet implemented**. Definitions below are initial operational specifications; they must be tested and calibrated on labeled replay footage. Every statistic must expose duration, game-mode, player identity, data coverage, and confidence.

| Metric | Proposed definition / data | Caveats |
| --- | --- | --- |
| Average speed | Distance integrated from interpolated car velocity / active play time (uu/s or km/h) | Exclude replays, countdowns and gaps; report mode |
| Peak speed / supersonic time | Highest sampled speed, fraction of active time above supersonic threshold | Replay sampling may miss peaks |
| Mechanic frequencies | Counts per match and per 5 active minutes by detector type | Detection-specific precision/recall |
| Time in air | Sum of intervals not in grounded/wall contact state | Distinguish wall driving, jumping, free flight |
| Kickoff timings | Time from kickoff release to first ball touch, per player | Replay state timestamps required |
| Kickoff wins/losses | Post-touch possession or favorable ball trajectory, per kickoff | Operational definition and team perspective |
| Goals / saves | Replicated game events / scoreboard if available | Distinguish credited saves from inferred defensive touches |
| Shot distance/location | Ball position and trajectory at shot event, field coordinates | Game-credited shots differ from inferred attempts |
| Momentum losses | Speed drop past configurable threshold not explained by intended stopping or reset | Inference; distinguish collisions and intentional control |
| Average boost usage | Boost spent per active minute | Track boost percentage changes, exclude refills |
| Peak boost usage | Largest consumption rate over window; configurable window | Not a game's built-in stat |
| Total boost usage | Sum of negative boost deltas, correcting pickups | Unit: boost points, not percentage of matches |
| Boost pathing | Spatial trajectory around small/large boost pads and pickups | Needs calibrated arena pad positions |
| Time without boost | Fraction/duration car boost equals zero during active play | Packet gaps may be misleading |
| 50s attempted | Ball contacts by opposing cars within temporal/spatial collision window | Heuristic; exclude ordinary successive touches |
| 50s won | Immediate controlled possession by team within configurable post-contact horizon | Requires possession model, can be indeterminate |
| Goal / shot ratio | Goals divided by shots with an explicitly defined shot source | Zero-shot cases undefined; credited vs inferred shot definition |
| Shot placement | Projected net-intersection coordinates / zones | Blocked attempts may not intersect the goal plane |
| Shot accuracy | Fraction of shot attempts projected on target without interception | Must define attempt detector independently |
| Shot speed | Ball velocity after impact / as it crosses goal plane (report both) | Can change markedly after a bounce |
| Recoveries | Time from collision/landing to stable useful movement | Label ground vs wall vs ceiling |
| Boost efficiency | Distance/velocity gain per unit boost, contextualized by route | Context-dependent, cannot replace coaching judgment |

## Viewer event overlays

- Ball and car trails (last N seconds, speed gradient)
- Velocity vectors; relative velocity and approach angle
- Derived acceleration vectors and estimated force direction, labelled *estimated*
- Boost usage/pickup markers and pad-state visualization
- Shot cone, target projection and goal-plane crossing
- Contact timeline, kickoff timers, air/ground/wall state
- Inferred mechanic event markers with confidence and evidence

## Validation

Maintain a human-labeled set of replay-video segments, covering successful, failed, and ambiguous techniques. Report precision, recall, and false-positive rates by detector, replay format, player level and game mode. Never report a raw mechanic count without detector quality and coverage.
