# Replay viewer v0.3 (track playback foundation)

The Electron **Replay Viewer** tab now contains a 3D scene rendered with Three.js.

**Available:** orbit/zoom camera, follow ball or car, play/pause, frame stepping, playback rates, scrubber, clickable event markers, synthetic sample car/ball trajectories, and velocity-vector overlay when the input provides velocity.

**Not available:** direct `.replay` decoding, real replay-to-track conversion, authentic Rocket League car/arena assets, recorded controller inputs, rigorous physics-force reconstruction, accurate mechanic recognition.

## Input JSON

Load a local JSON file in the viewer; no upload occurs. The minimal v1 structure is:

```json
{
  "format": "replay-forge-tracks-v1",
  "title": "Example decoded match",
  "source": "decoded",
  "players": [
    {"id": "p1", "name": "Player 1", "team": "blue"}
  ],
  "frames": [
    {"time": 0, "ball": {"position": [0,0,100]}, "cars": {"p1": {"position": [0,-1000,20], "yaw": 0, "boost": 100}}},
    {"time": 0.05, "ball": {"position": [0,25,110]}, "cars": {"p1": {"position": [0,-985,20], "yaw": 0.02, "boost": 99}}}
  ],
  "events": [{"time": 0.0, "type": "kickoff", "label": "Kickoff"}]
}
```

Coordinates use Rocket League-style X,Y horizontal, Z up, in Unreal units. Yaw is radians. Position is mandatory; yaw, boost, velocity are optional. Velocity is an optional [X,Y,Z] vector in Unreal units per second.

Frames must be sorted by strictly increasing time and carry the full known player state. Current renderer interpolates car/ball positions linearly and uses the earlier frame's yaw (without angular interpolation). Bounding boxes and a rectangular field are schematic rather than arena-accurate. Up to 16 players and 250,000 frames are accepted by the current client validator; very large files may exhaust renderer memory.

## Next integration

Integrate a pinned Boxcars/rrrocket decoder, normalize actor physics states to this format, then add metadata and event extraction. Until this is done, do not claim the viewer plays native `.replay` files. The demo is expressly synthetic.

## Local run

```powershell
npm install
npm run dev
```

Installers are built by the Electron workflow. Build and Windows runtime validation are still needed.
