# OneStream RPG — Walkthrough (v1.0.0, initial release)

**How It Works:** It is a multiplayer RPG overlay. The streamer must be live and running the game. Viewers must accept Twitch ID sharing to spawn their character onto the video player.

**Core Gameplay:** Click the video stream to move, fight, gather resources, and interact with NPCs. Use the draggable UI to manage inventory, abilities, quests, and player-to-player trading.

## Getting Started

1. **Open the test channel:** `https://twitch.tv/[YOUR TEST CHANNEL]` — the game must be running, otherwise the extension shows "This streamer isn't running the game right now" (expected, not a bug).
2. **Share your Twitch ID** — click "Share ID" and accept the prompt. Required to save your character.
3. **Press "Join Game"** — your character spawns into the world on the video.
4. **Walk around** — click anywhere on the stream to move there.
6. **Gather** — click a tree, rock, or pond to chop, mine, or fish.
5. **Fight** — click an enemy to target it, then click an ability in the bottom action bar to attack.
7. **Talk to NPCs** — click an NPC to shop, sell, craft, stash items, or accept a quest.
8. **Open the UI** — use the icon bar on the right for Inventory, Abilities, Stats, Quests, Trade, Recipes and Settings. Windows are draggable; drag items to equip them.
9. **Trade** — send another player a trade invite; both sides must confirm. (Two accounts needed — happy to join you in-world.)
10. **Panel view** — the same game in a panel layout, opened with the ☰ menu.

## Notes for reviewers

- **Test access:** I keep the game running for the review. If the channel is offline, contact `[YOUR EMAIL / DISCORD]` and I'll bring it up within `[e.g. 12 hours]`.
- **Permissions:** Identity share is required to persist a character. One Helix call (`users?id=<viewer>`) fetches the viewer's own name and avatar. Local storage holds UI preferences only.
- **No monetization:** no Bits, purchases, or chat access. The "Gamble" NPC wagers only in-game gathered materials — nothing purchasable or cashable out.
- **Domains:** `onestreamrpg.pauledevelopment.com` (game backend), `cdn.onestreamrpg.com` (icons), `api.twitch.tv` (Helix lookup).
