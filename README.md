# Medieval Realm (working title)

A cozy 2D pixel-art game in plain HTML5 canvas + JavaScript. No engine, no build step, no dependencies.

## Run it
Double-click `index.html` (any modern browser). Or use the VS Code "Live Server" extension.

## Controls
| Key | Action |
|---|---|
| W A S D / arrows | Move |
| Shift | Run (scares animals!) |
| **Hold F** | Befriend a nearby animal / pet your followers |
| **Tab** | Open the Petdex (Esc / Tab closes) |
| Space | Starfrost Spell - a pretty frost star (10 mana) |
| E | Arcane Frost - freeze nearby water into walkable ice (30 mana) |
| **M** | Open the map (fog of war: it fills in as you explore) |
| N | Music on / off |
| **R** | Fish: face water, press R to cast, R again when the ! appears, then R in the green zone |
| **G** | Feed the friend next to you (fish, berries, bones...) |
| **I** | Backpack: items, fish book, friends (rename them!) |
| Walk into the front door | Enter your house (bed, fireplace, journal) |
| Esc | Pause (Q while paused = quit to title) |

## Animals
44 species across 7 rarities: common, uncommon, rare, epic, legendary, wild, secret.
- Walk up and **hold F** next to an animal. Rarer animals take longer to befriend.
- Running scares them. Wild animals (wolf, bear) are jumpy: walk up slowly, then stand still.
- Calm animals get curious and wander over if you stand still.
- Up to 4 tamed animals follow you; taming a 5th sends the oldest home. They stay in your Petdex.
- Epic and legendary animals glow and sparkle. The secret one only appears at night near the pond.
- Your Petdex is saved in the browser (localStorage).

## Friends, gifts and fishing
- Every tamed animal gets a **name** and a **friendship level (0-5 hearts)**. Hold F to pet them (a few times a day),
  or press **G** to feed them. Loved food (cats: fish, dogs: bones, bunnies: plants...) gives much more.
- From level 2 they **bring you gifts** while following you: dogs and pigs dig, others find things. Walk over the sparkle to pick it up.
- **Fishing**: 20 fish across the village pond, Crystal Lake, the frozen pond and the sea. Time of day, weather and rainbows
  change what bites; rare fish need night or storms. The Backpack (I) has a **fish book** and a **friends** page where you can rename your pets.
- Everything saves in the browser (Petdex, map, friendship, bag, fish book).

## World
A big realm (96x72 tiles) with 8 regions: Meadow Village (home), Mushroom Hollow, Whispering Pines,
Frostpeak, Old Ruins, Crystal Lake, Sunflower Fields and Sunset Shore. Roads with lamp posts lead to each one.
- **Map (M)**: unexplored parts are hidden. Areas, landmarks and an exploration percentage are tracked and saved.
- **6 landmarks** to find (a "?" appears on the map once you reach the area). Each one stirs a special animal nearby.
  The Island Altar sits in the lake: freeze the water with E to build an ice bridge.
- **Animals live in the places they fit**; rarity rates are unchanged (common most, legendary least).
  Weather and time matter too: Thunder Wolf only in storms, Moon Stag only at night, rainbows bring unicorns and pegasi,
  fog hides the Ghost Cat near the ruins.
- **Weather**: clear, cloudy, breezy, fog, rain and thunderstorms (snow in Frostpeak). Rain and storms refill mana faster,
  make frost ice last longer, turn the lamps on and make animals jumpier; fog shrinks how far you reveal the map.
- **House**: walk into the front door. Sleep (after 5 PM) to skip to morning, warm up by the fire, read your journal.
- Time runs a little faster than before.

## The People of Lanternfall (story)
The seven other heroes are **NPCs on the map** (not playable). They walk daily schedules between the shops, the lamps and the
Wolfclan camp, and each has a secret tied to one shared mystery (see `STORY.md`).
- **E**: talk (a new story chat is marked with a yellow "!"). Pick answers with W/S and E. **G**: give a gift (one per person per day).
- Trust comes from daily chats, gifts they love, helping with their requests, and what you say. Higher trust unlocks deeper chats,
  **hidden places** (E to enter, they show on the map) with a memory scene, and choices that change how the others treat each other.
- **P**: People book: trust hearts, replay old chats, Nina's nightmare fragments and the Seven Pieces. Kai only comes out after dark.

## Phone / touch
Open it in a phone browser (landscape works best). Touch controls switch on at your first touch:
- Hold and drag on the **left side** for a floating joystick (push to the edge to run).
- **Tap** to talk to a nearby person, advance dialogue, pick a choice, or feed a nearby pet.
- Small buttons: E, SPC (spell), G (gift), F (hold to befriend), BAG, MAP, PPL, DEX, ESC.
Put the folder on any web host (GitHub Pages, Netlify) to open it by link on your phone.

## Files
- `index.html`     - page + canvas
- `art.js`         - shared sprite helpers (outline, shading, 2x hi-res support)
- `nina_data.js`   - Nina's exact sprite frames (generated from the reference art)
- `characters.js`  - hero roster + sprite loader
- `animals.js`     - species list, rarities, habitats, sprites, taming, followers, Petdex
- `bonds.js`       - names, friendship, gifts, feeding, fishing, backpack
- `world.js`       - regions, landmarks, world generation, map, weather, house interior
- `lore.js`        - all story data: NPCs, dialogue, trust gates, gifts, places, memories
- `npcs.js`        - NPC schedules, dialogue UI, trust, gifts, hidden places, People book
- `npcart.js`      - NPC sprites, village buildings, camp, entrances
- `portraits.js`   - dialogue portraits (from your character art)
- `STORY.md`       - the story bible
- `touch.js`       - phone joystick + tap controls
- `game.js`        - menus, rendering, input, spells, day/night, lamps, HUD, music

## Adding things
- New animal: add an entry to `SPECIES` in `animals.js` (pick `kind: 'quad' | 'bird' | 'owl'` and tweak the parameters).
- New hero: copy Nina's draw function in `characters.js` and set `unlocked: true`.
