# Potyczka

A 3D auto-battle roguelike in the visual style of Thronefall and *Diplomacy Is
Not An Option* — pick a race, watch your army auto-fight a wave of another
race, and draft one card per win between rounds. No install.

## ▶ Play in your browser
**https://lbartoszcze.github.io/potyczka/**

1. Pick your race — **Humans**, **Dwarves**, **Elves**, or **Skeletons**. Each has its own base stats and its own card pool.
2. Watch your army auto-fight a wave of a different race.
3. Win → draw 3 random race-specific cards (Iron Plate, Berserker Pact, Longbow, Raise Dead, ...). Pick one. Repeat.
4. Lose → start a new run with any race.

Camera: WASD or screen edge to pan, scroll to zoom. Source under [`web/`](web/), auto-deployed to GitHub Pages on every push.

## Look and feel: design decisions

How Potyczka looks is the game's design: the browser scene in
[`web/scene.js`](web/scene.js), units in [`web/units.js`](web/units.js), and
shot appearance in [`web/render/projectiles.js`](web/render/projectiles.js).
The colours, light intensities, fog, sky, geometry sizes and segment counts,
camera offset, field of view and follow rate, scenery scatter, hit effects and
animation timing there are the design as it stands. No other file restates
them and nothing derives them; changing the look means editing those values
there.

What the scene can measure is not a design choice. The renderer follows the
stage's measured box and display-scale changes through `ResizeObserver` and
a resolution media-query event, without polling or reloading. The sun's
shadow frustum and camera far plane cover the ground's bounds; the shadow map
matches the drawing buffer within the GPU's texture limit. Panning stays over
the ground. The shot buffer grows with shots in flight and disposes the old
uploaded geometry before replacing its position attribute, so growth does
not retain previous GPU buffers.

### Rendering qualification

`tests/rendering/index.html?fixture=<same-origin-json-path>` is a real WebGL
qualification page for a dedicated Weles host serving this checkout root.
It loads the game's declared Three import map, not a test renderer or mock.
The fixture declares `revision`, `sourceHashes` keyed by
`../../web/render/projectiles.js` and `../../web/render/viewport.js`,
canvas `width`/`height`, orthographic `camera` constructor arguments,
`cameraPosition`, `cameraTarget`, and `frames` of projectile endpoint tuples.
Each tuple contains the start and end three-dimensional coordinates.
Hashes are SHA-256 of the exact served source bytes. Include a nonempty frame,
a larger frame, shrinkage and an empty frame; growth of an already rendered
frame is required.

The page submits these frames through the production projectile renderer.
It checks the actual WebGL buffer is deleted when capacity grows, validates
draw range and uploaded endpoint values, and retains each rendered PNG.
Weles qualification must retain `window.qualification`, the source revision,
fixture, page URL, recording and images. A source hash mismatch, absent
fixture or driver failure is a failed report with its cause, not a pass.
This focused test does not qualify display-scale transitions, the complete
battle journey or Unity; those still require their real graphical flows.

---

## Unity 2022 LTS version (under `Assets/`)

The repo also ships the original Unity scaffold — drag-select units, right-click move, edge-pan / WASD camera, scroll zoom. An Editor bootstrap script sets the scene up on first open.

### Run in Unity

1. Install Unity Hub: https://unity.com/download
2. Hub → **Installs → Install Editor → 2022.3 LTS** (any 2022.3.x release).
3. Clone:
   ```bash
   git clone https://github.com/lbartoszcze/potyczka.git
   ```
4. Hub → **Add → Add project from disk** → pick the cloned folder.
5. Wait for Unity to finish the first import. The bootstrap script (`Assets/Editor/SceneBootstrap.cs`) will:
   - Add `Ground` (layer 8) and `Unit` (layer 9) to the layer table.
   - Create `Assets/Scenes/Main.unity` with a green ground plane, a baked NavMesh, a directional light, an angled camera rig, the controller, and a 4×3 block of red capsule units.
   - Mark the scene built (`Assets/Scenes/.bootstrapped`) so it doesn't re-run.
6. Open `Assets/Scenes/Main.unity` if Unity hasn't already, hit ▶ **Play**.

To rebuild the scene from scratch: **Tools → RTS → Rebuild Demo Scene**.

## Controls

| Input | Action |
|---|---|
| Left-click | Select unit |
| Left-drag | Box-select units |
| Right-click on ground | Move selected units there in formation |
| WASD or push cursor to screen edge | Pan camera |
| Scroll wheel | Zoom |

## Code layout

| File | Role |
|---|---|
| `Assets/Scripts/RtsCamera.cs` | Edge-pan / WASD pan, scroll zoom, height clamp on the camera rig. |
| `Assets/Scripts/Selectable.cs` | Toggles a child SelectionRing GameObject. |
| `Assets/Scripts/Unit.cs` | Wraps `NavMeshAgent`, exposes `MoveTo` / `Stop`. |
| `Assets/Scripts/RtsController.cs` | Click + drag-box select, right-click formation move order. |
| `Assets/Editor/SceneBootstrap.cs` | One-shot Editor script that builds the demo scene on first open. |

## Suggested next steps

- **Combat** — add `Health.cs` plus an attack loop on `Unit`: nearest enemy in range → shoot, else chase.
- **Resources** — `ResourceNode` with an amount, `Worker` state machine (idle → gather → deposit at a base).
- **Buildings** — ghost placement on cursor, build timer, production queue spawning units.
- **Fog of war** — render a darkened overlay to a RenderTexture, punch holes around player-team units.
- **Minimap** — second top-down camera, RawImage in a Canvas, click-to-pan main camera.

## License

MIT — see `LICENSE`.
