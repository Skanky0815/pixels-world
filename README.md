![Pixel's World — Pixel knocking a vase off a shelf in a cozy autumn living room](assets/banner.png)

**One room. One cat. Absolutely no respect for gravity or expensive vases.**

*A cozy pixel-art sandbox about a small cat and a very big mess.*

## The idea

Play as **Pixel**, a curious, mischievous tabby cat home alone in Sara's apartment. Explore a room, jump onto furniture, climb curtains and knock things over. The fun starts with tactile movement, playful physics and an environment that reacts to Pixel.

When Sara returns home at an unpredictable time, she discovers the chaos. Her frustration depends on the damage. Pixel then has a limited window to make amends by purring, cuddling and giving affectionate head bumps. The calmer Sara is at the end, the more treats Pixel earns.

**Design direction:** physics-driven sandbox first, scoring and reconciliation later. Sock hiding was the original hook, but is now an optional future mechanic.

## Gameplay loop (planned)

1. **Home alone:** explore, jump, climb and cause mischief.
2. **Sara returns:** an unpredictable arrival ends the chaos phase.
3. **Make amends:** purr, cuddle and charm Sara before time runs out.
4. **Treats:** rewards depend on Sara's remaining frustration.

## Interactions (ideas)

| Action | World reaction |
| --- | --- |
| Push a vase | It tips, falls and breaks on impact |
| Scratch couch or wallpaper | Visible scratches |
| Climb curtains | Fabric reacts; perhaps the curtain falls |
| Knock books off shelves | Books fall and scatter |
| Tip over a water bowl | A puddle forms |
| Walk through water | Wet paw prints appear |

## Controls (planned)

| Input | Action |
| --- | --- |
| ← / → | Move |
| ↑ / ↓ | Climb up/down when attached to a climbable surface |
| ↓ | Crouch when on the ground |
| Space | Jump |
| Space + ← / → | Directional jump |
| Space while climbing | Jump away from the surface |

Climbing should feel slower and more deliberate than jumping. Pixel may automatically grab a climbable surface after jumping against it.

## Visual direction

- Cozy **2D side-view pixel art** with a warm, slightly autumnal apartment palette.
- **32×32 px** as the preferred starting point for Pixel's sprite, not a fixed screen resolution or color depth.
- Pixel is a short-haired brown-gray tabby with dark stripes, a forehead M, cream-colored muzzle, yellow-green eyes and a ringed tail.
- Animations to explore: idle, run, jump/land, **back-view climbing**, sneak, push, scratch, purr, cuddle and head bump.
- Frame counts and final asset sizes are still to be tested.

## Proposed tech stack

| Area | Choice |
| --- | --- |
| Language | TypeScript |
| Engine | Phaser 3 |
| Platform | Web browser |
| Rendering | 2D pixel art at a fixed logical resolution |
| Physics | Phaser-compatible arcade-style collisions to start; richer object behavior as needed |
| Backend/accounts | None planned for the prototype |

The room prototype now uses Phaser 3, TypeScript and Vite. Later gameplay systems remain planned.

## First playable prototype

**Goal:** Pixel can jump from the floor onto a couch, climb toward a shelf, and knock a vase down so it falls and breaks.

- [x] One playable room with floor, couch, shelf, curtain and platforms
- [ ] Pixel sprite and basic idle/run/jump/climb animations
- [ ] Arrow-key and space-bar controls
- [ ] Gravity, collisions, climbing, grabbing and jumping off
- [ ] One interactive vase with falling and breaking behavior

The first prototype does **not** need Sara's return, a frustration meter, treats, a complete round or user accounts. We should first establish that moving and making a mess feels fun.

## Project status

**Living room prototype implemented (Issue #1).** The room uses geometric placeholder art, solid floor/couch/shelves and a highlighted climbable curtain. The camera shows the full 960×540 room and scales it to the browser. No backend, accounts or external art downloads are required at runtime. Vase interactions and full sprite animations are future work.

## Run locally

Requires Node.js 22.12+ (or a supported newer LTS version) and npm.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite (normally http://127.0.0.1:5173). Keyboard required; touch controls are not included.

- **← / →:** move.
- **Space:** jump; hold a direction to move through the jump. Start a little before the couch edge to clear its solid side.
- **↑ / ↓ while overlapping the outlined curtain:** attach and climb. Release to hang, move sideways to leave, or press Space to jump away (left by default, or the held direction).
- **R:** reset Pixel to the floor.

The books, plant, couch back and picture are decorative. Collision platforms are the couch seat and shelf boards.

## Build and preview

```sh
npm run build
npm run preview
```

The build checks TypeScript and generates the static site in `dist/`. Phaser is bundled locally; Vite may report a bundle-size advisory for the engine.

## Manual smoke check

1. Launch locally: the complete room, Pixel, couch, shelves and outlined curtain are visible.
2. Walk left/right: the floor and room boundaries stop Pixel.
3. From the starting position, jump right onto the couch. Walk toward its right edge, then jump onto the first shelf and onward to the next shelf. Pixel lands on the visible surfaces.
4. Reach the curtain and hold Up: Pixel climbs; release to hang, use Down to descend, and Space with a direction to jump away. Gravity resumes after leaving.
5. Press R while on a platform or climbing: Pixel returns to the starting floor position.
6. Resize the browser: the whole room remains framed with its original aspect ratio.


## Quality checks

```sh
npm run lint       # ESLint, including TypeScript rules; warnings fail
npm run typecheck  # strict TypeScript checks
npm run qa         # lint, type checks and production build
```

GitHub Actions runs these checks on every pull request and every push to `main`, with a manual run option. CI installs the lockfile with `npm ci` on Node.js 22. The manual gameplay smoke check above complements static checks; gameplay is not covered by automated browser tests yet.
