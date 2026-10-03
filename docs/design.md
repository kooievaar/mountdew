# Mount Dew 1.0.1

Three-team capture the flag on one desert map, played in the browser. Humans sync through an Amsterdam-IX relay (nickname, password, xp, position, shots). Open seats are match pilots so the field is alive alone.

## 1.0.1

- Surfaces are canvas textures baked once when the match loads: cloth, skin, hair, stone, wood, leaves, metal, ground grit, water, feathers. Instance color still tints them, so teams and biomes stay readable.
- Raised soldiers are green mutant models (hunched, long arms, glowing eyes, torn rags), not recolored pilots. They shamble on a two-bone stride matched to their speed, so the feet plant instead of skating. They turn to face the way they walk, hop a low ledge, and do not wallride or ride the train. They claw, hunt, and can still carry a flag. Pinpop, Wrapley, and Bonecaller raise them. Each team also starts with one on the field. Sixteen live mutants per team. Extra pieces: painted face, neck, brow, torn ears, chest wound, back spikes, three bone claws, shoulder caps, and rag flaps.
- Shadow maps stay off. The sky and ground stay Lambert / basic materials.

## Choices

- Third-person strafe, not vehicle steer. A moves screen-left while facing the camera. Mouse aims. Shots leave the crosshair with no spread and no recoil.
- Movement is immediate on your machine. Other pilots interpolate. Hits are sent without waiting for an ack. The relay caps xp and kills per 10 seconds.
- Collision is simple boxes so jumps, walljumps, climb, and pads stay easy: coyote time, step-up, generous wall probe.
- One draw for the static map (instancing), shared character parts, a separate mutant rig, line tracers for guns, pooled particles. Shadow maps stay off so the map does not go black.
- Cute candy pops stand in for gibs. No real-world weapon photo as the viewmodel.
- Nicknames are the account. New names register at once. Passwords are salted on the relay and also remembered in this browser, as requested. Wrong password cannot take an existing name.
- Voices stay local. You always hear your pilot. At most two other pilots and a handful of close guns. An announcer calls captures, returns, the hill, and rise. A commentator drops a short line every few seconds. Both fade if the camera leaves the field.
- V detaches a spectator camera. WASD flies along the look direction, A is screen-left, Space up, Ctrl down, Shift faster. The pilot stays where they were until V again.
- A match PC runs `node host/server.mjs`. That one process serves the site and the relay at https://newsfeed.qzz.io:8888 (websocket on the same port). Clear Match server to play inside the browser. `node relay/server.mjs` is the relay alone.

## Map

Citrus mesa in the coconut desert and white stone, Voltage on the space decks, Code Red in the red stone city. Trenches and a river sit two floors lower. A spiral and a climbable wall reach the hill. Air rings, a loop train, bounce cans, and medpacks connect the flags.

## Ranks

Recruit through General. Each rank asks for more levels than the last, Jaymod-style, not a real military chart.
