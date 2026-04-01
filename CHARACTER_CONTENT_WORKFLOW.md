# Character Content Workflow

This document explains how we collect and maintain character data, build advice, images, and "latest snapshot" info for the Hippo Penny character pages.

## Goal

We want character pages that help users decide fast.

The page should answer:

- Is this character worth pulling, building, or skipping?
- What team or role does this character fit?
- What matters most for gear, weapons, Light Cones, or Echoes?
- What changed in the current banner or patch environment?

We are not trying to publish long patch-note summaries or copy generic wiki text.

## Coverage

Current main games:

- Genshin Impact
- Honkai: Star Rail
- Wuthering Waves

Main content types:

- Game hubs in [`_pages`](C:/hippopenny/hippopenny.github.io/_pages)
- Character entries in [`_characters`](C:/hippopenny/hippopenny.github.io/_characters)
- Shared game metadata in [`_data/character_games.yml`](C:/hippopenny/hippopenny.github.io/_data/character_games.yml)
- Character hero images in [`assets/images/characters`](C:/hippopenny/hippopenny.github.io/assets/images/characters)

## Source Priority

Use sources in this order.

1. Official game sources for current facts.
   Examples: official news pages, official character pages, official trailers, official social posts, official YouTube uploads.
2. High-signal secondary sources for build consensus.
   Examples: reputable guide sites, tier list updates, endgame discussion roundups, current banner trackers.
3. Our own synthesis.
   We turn source material into a short verdict, build priorities, teams, and mistakes to avoid.

Do not publish from a single source when the page is giving advice.

## What To Verify Fresh Every Time

These fields are time-sensitive and should be checked live before publishing or updating:

- Current version / patch
- Current banners
- Next banners or announced banner windows
- Big meta shifts caused by new teammates, relics, sets, Echoes, or system changes
- Whether a character's value changed because of new supports or competition

When in doubt, verify again. Add an exact date, not "today" or "recently."

## Workflow

### 1. Verify the live game state

For each game, confirm:

- current version
- current banner phase
- next announced banner phase
- any relevant meta note that changes pull/build value

Record that in [`_data/character_games.yml`](C:/hippopenny/hippopenny.github.io/_data/character_games.yml) under:

- `latest_snapshot.verified_at`
- `latest_snapshot.snapshot_title`
- `latest_snapshot.live_now`
- `latest_snapshot.next_up`
- `latest_snapshot.meta_watch`
- `latest_snapshot.sources`

## 2. Confirm the character's real role

Use official kit text and current community consensus to answer:

- main DPS, support, sustain, sub-DPS, enabler, buffer
- main combat type
- weapon or path
- where the character is actually strong
- what the character needs from teammates

This becomes:

- `role`
- `combat_type`
- `weapon_or_path`
- `quick_verdict`
- `mode_focus`
- `strengths`
- `weaknesses`

## 3. Build the recommendation from consensus, not one opinion

For builds, do not rely on one guide writer or one showcase video.

Cross-check:

- official kit mechanics
- at least two current build-oriented sources
- current endgame usage patterns
- whether the recommendation still makes sense for non-whale users

Write advice for real players, not perfect showcase accounts.

Focus on:

- what stat or resource matters first
- what makes the rotation stable
- which teammate types are mandatory vs flexible
- what is good enough early
- what is luxury investment later

This becomes:

- `build_priority`
- `gearing`
- `premium_team`
- `budget_team`
- `upgrade_order`
- `dupe_value`

## 4. Write the page in decision-first order

Every character page should lead with the answer, then support it.

Recommended structure:

1. `quick_verdict`
2. `quick_take`
3. strengths / weaknesses
4. best for / avoid if
5. build and team notes
6. tricks and mistakes
7. final verdict

The first screen should already tell the user whether the character is worth their time or currency.

## 5. Add practical tricks

Each page should include usable advice, not just rating language.

Good examples:

- rotation shortcuts
- easy build priorities
- common mistakes
- what to farm first
- what to ignore until later

Current fields:

- `quick_tricks`
- `rotation_trick`
- `daily_plan`
- `common_mistakes`

## 6. Source hero images correctly

Hero images should not come from:

- screenshots of our own site
- random reposts
- fan art with unclear rights
- hotlinked assets we cannot trace

Preferred image sources:

1. official site character assets
2. official YouTube thumbnails from high-view character trailers / demos
3. official social promo art

Process:

- download the image into [`assets/images/characters`](C:/hippopenny/hippopenny.github.io/assets/images/characters)
- store per-game in a dedicated folder
- point the character `teaser` to the local downloaded file
- record provenance in frontmatter

Current provenance fields:

- `image_source_label`
- `image_source_url`
- `image_source_views` when the source is an official video with visible view count

### 6b. Gallery images (optional)

Some character pages include a `gallery` list in front matter (see [`_layouts/character_detail.html`](_layouts/character_detail.html)). Each item is **`src`** (local path under the repo) and **`label`** (caption shown on the card).

Rules:

- Use the **same sourcing standards as hero images**: official or clearly licensed promo art, **downloaded into** [`assets/images/characters/...`](./assets/images/characters) (or another `assets/...` folder you own, e.g. first‑party promo graphics under `assets/images/offrail/`). Do **not** hotlink third‑party CDNs.
- **Labels** should describe what the viewer is seeing (e.g. “Character art”, “Trailer still”) so they are not mistaken for in‑game menu names. Editorial flair is fine if it stays honest.
- Extra gallery shots are **not** required for the checklist; they are decorative context.

Behavior on the site:

- By default, clicking a gallery image opens the **local `src` file** in a new tab (full resolution).
- Optional **`url`**: if set, the link goes there instead (official trailer, patch notes, or another approved page). Use a full `https://...` URL or a site path like `/path/` (Jekyll will resolve site-relative paths).

Example:

```yaml
gallery:
  - src: /assets/images/characters/honkai-star-rail/acheron.jpg
    label: "Character art"
  - src: /assets/images/characters/honkai-star-rail/acheron-promo.jpg
    label: "Official promo still"
    url: "https://www.youtube.com/watch?v=VIDEO_ID"
```

## 7. Update the relevant files

Typical file changes for one character:

- character page in [`_characters/<game>/<character>.md`](C:/hippopenny/hippopenny.github.io/_characters)
- optional game snapshot changes in [`_data/character_games.yml`](C:/hippopenny/hippopenny.github.io/_data/character_games.yml)
- downloaded image in [`assets/images/characters`](C:/hippopenny/hippopenny.github.io/assets/images/characters)

If the character affects hub messaging, also update:

- [`_layouts/character_hub.html`](C:/hippopenny/hippopenny.github.io/_layouts/character_hub.html)
- [`_pages/characters-*.md`](C:/hippopenny/hippopenny.github.io/_pages)

## 8. Verify locally before publishing

Always run:

```powershell
bundle exec jekyll build
```

Then spot-check:

- the character page loads
- the hero image is the sourced asset
- the hub card uses the same image
- if `gallery` is present, each image loads and the link opens the asset or optional `url`
- the page still reads cleanly on mobile and desktop
- the source note renders if present

## Character Checklist

Before a page is ready, make sure it has:

- `excerpt`
- `tagline`
- `quick_verdict`
- `quick_take`
- `pull_rating`
- `strengths`
- `weaknesses`
- `best_for`
- `avoid_if`
- `build_priority`
- `gearing`
- `premium_team`
- `budget_team`
- `upgrade_order`
- `dupe_value`
- `verdict`
- `quick_tricks`
- `rotation_trick`
- `daily_plan`
- `common_mistakes`
- `teaser`
- `image_source_label`
- `image_source_url`

## Writing Rules

- Keep it crisp.
- Use exact dates for live facts.
- Prefer "what should the player do" over "what happened in the patch."
- Do not oversell niche characters as universal pulls.
- Do not hide investment requirements.
- Do not pad the page with filler lore unless it helps the decision.

## Example Update Loop

When a banner or teammate change happens:

1. re-check the live snapshot for the game
2. update any affected character verdicts
3. adjust teams and build notes if needed
4. confirm the source date changed
5. rebuild the site

## Current Practical Rule

If a fact can change with a banner, patch, relic set, Echo set, or teammate release, verify it live before publishing.
