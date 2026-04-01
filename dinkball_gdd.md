# Dinkball — Game Design Document
### Version 1.0

---

## Table of Contents

1. [Game Overview](#1-game-overview)
2. [Visual and Audio Identity](#2-visual-and-audio-identity)
3. [Core Concept and Pillars](#3-core-concept-and-pillars)
4. [Pickleball Rules Reference](#4-pickleball-rules-reference)
5. [Gameplay Loop](#5-gameplay-loop)
6. [Shot System](#6-shot-system)
7. [Fault System](#7-fault-system)
8. [Serving Mechanics](#8-serving-mechanics)
9. [Scoring and Match Structure](#9-scoring-and-match-structure)
10. [Game Modes](#10-game-modes)
11. [AI System](#11-ai-system)
12. [Environments](#12-environments)
13. [Progression and Unlockables](#13-progression-and-unlockables)
14. [Difficulty Scaling](#14-difficulty-scaling)
15. [UI and HUD](#15-ui-and-hud)
16. [Audio Design](#16-audio-design)
17. [Character Roster](#17-character-roster)

---

## 1. Game Overview

**Title:** Dinkball
**Genre:** Arcade sports — 16-bit
**Platform:** PC (primary target)
**Players:** Single-player vs AI (1v1 and 2v2)
**Reference title:** Super Tennis Champs (Amiga, 1992, Cyberstudio)

Dinkball is a 16-bit arcade-style pickleball game built in the visual and mechanical spirit of Super Tennis Champs on the Commodore Amiga. Where Super Tennis Champs delivered fast, satisfying tennis in a clean top-down-angled court view with chunky colourful sprites, Dinkball delivers that same arcade energy using the sport of pickleball — a paddle sport combining elements of tennis, badminton and table tennis, played on a compact court with a wiffle-style ball.

All rules and regulations in Dinkball follow the official pickleball rulebook. The sport's defining quirks — the non-volley zone (the kitchen), the double-bounce rule, underhand serving, and side-out scoring — are all faithfully implemented, and serve as the mechanical foundation for the game's strategy and depth.

The game supports 1v1 and 2v2 match formats. There is no human multiplayer in this version; all opponents and, in 2v2 mode, the player's partner are controlled by AI. The single-player experience is built around a career circuit structure, with tournament brackets, escalating AI opponents, and unlockable environments and cosmetics.

---

## 2. Visual and Audio Identity

### 2.1 Visual Style — 16-bit Amiga Aesthetic

Dinkball must look and feel like it shipped on the Commodore Amiga in the early 1990s. Every visual decision should be made through this lens.

**Perspective:**
The court is rendered in a top-down angled view (approximately 30–45 degrees), matching the Super Tennis Champs camera. The court is slightly foreshortened at the far end to give depth. The player's side is at the bottom of the screen; the opponent's side is at the top.

**Sprites:**
All player characters are large, expressive, chunky pixel art sprites. Characters should be immediately readable at a glance — exaggerated proportions with large heads, bold outlines. Each character has a distinct silhouette. Animation frames should be limited (in the spirit of Amiga hardware constraints) but feel punchy and satisfying: a serve wind-up, a forehand swing, a backhand swing, a smash overhead, a dive, an idle bounce.

**Colour palette:**
Vivid, saturated colours typical of Amiga OCS/ECS output. Bright court surface (teal, green, or blue depending on the environment theme), distinct out-of-bounds zones, high-contrast UI elements. Each environment should have a dominant colour identity — gardens are warm greens, stadiums are dramatic navy and gold, car parks are grey and orange.

**Court:**
The court lines are crisp white pixels. The kitchen (non-volley zone) is subtly shaded in a different tone to signal its importance. The net is a clear centre-screen element, rendered as a thick horizontal pixel bar with mesh detail.

**Background environments:**
While the court itself never changes dimensions or layout, everything beyond the court boundary is environment art — illustrated as a flat parallax-style backdrop. Crowds, trees, architecture, vehicles, and lighting all exist in this layer. These backgrounds use dithering and limited palettes consistent with Amiga aesthetics.

**Effects:**
Ball trails for fast drives and smashes. Screen flash and sprite pop for winning shots. Dust puff on ball bounce. A brief "FAULT!" or "POINT!" text callout in a bold Amiga-style bitmap font. Score flashes in the HUD.

**Font:**
All in-game text uses a bitmap pixel font consistent with 1990s Amiga software — bold, blocky, no anti-aliasing. Uppercase-heavy for callouts and scores; mixed case for menus and character names.

### 2.2 Reference Visual Touchstones

- **Super Tennis Champs** (Amiga, 1992) — court perspective, sprite scale, match pacing
- **Pong / Arkanoid** — ball physics feel (crisp, predictable, arcade-satisfying)
- **Sensible Soccer** (Amiga) — character exaggeration and icon legibility
- **International Karate+** (Amiga) — background crowd illustration style

---

## 3. Core Concept and Pillars

### Pillar 1 — Arcade feel, real rules
Dinkball is not a simulation. Rallies should feel fast, visceral, and satisfying, with exaggerated audio and visual feedback. But every rule from the official pickleball rulebook is implemented faithfully. The goal is that a player who masters Dinkball will understand real pickleball.

### Pillar 2 — Simple to pick up, deep to master
The shot system has a small vocabulary of inputs. Any player should be able to serve and return within one minute of starting. Strategic depth — kitchen discipline, third shot drops, poaching in 2v2 — reveals itself over time through play, not tutorials.

### Pillar 3 — A love letter to Amiga sports games
Every pixel, sound effect, and UI element should feel like it belongs on an Amiga floppy disk. The aesthetic is not retro for the sake of nostalgia — it is the genre's natural home. The screen should look like something a 12-year-old would have stared at for hours in 1993.

### Pillar 4 — Escalating stakes
The world of Dinkball starts small and personal. You play in a garden. You work your way up to a floodlit national stadium. The escalation of environments mirrors the escalation of opponent difficulty and gives the player a sense of a genuine journey.

---

## 4. Pickleball Rules Reference

All of the following are implemented in Dinkball exactly as per the official USA Pickleball rulebook.

### The Court
- Dimensions: 44 feet long × 20 feet wide (full court)
- Net height: 36 inches at sidelines, 34 inches at centre
- Non-Volley Zone (The Kitchen): 7 feet from the net on each side
- Service boxes: each side is divided into left and right service courts by a centre line

### The Double Bounce Rule
After a serve, the ball must bounce once on the receiving side before the receiver may return it. After the receiver returns it, the ball must bounce once on the serving side before the server's team may play it. After both bounces have occurred, both teams may volley the ball (hit it before it bounces). This mandatory two-bounce opening governs the start of every single rally.

### Serving
- The serve must be underhand
- The paddle must contact the ball below the server's waist
- The ball is served diagonally cross-court into the opponent's service box
- The serve must clear the net and land in bounds, excluding the kitchen
- Serves that land in the kitchen or on the kitchen line are faults
- Each player gets one serve attempt (unlike tennis, there is no second serve)
- The server must keep both feet behind the baseline during the serve

### Side-Out Scoring
- Only the serving side may score a point
- If the serving side commits a fault, no point is scored and service passes to the opponent (side-out)
- In 2v2 (doubles), both players on a side get a chance to serve before a side-out occurs (except at the start of the game, where the first serving team gets only one serve before a side-out)

### The Kitchen / Non-Volley Zone Rules
- A player may not volley the ball (hit it before it bounces) while standing in the kitchen or touching the kitchen line
- A player may enter the kitchen to play a ball that has bounced in it
- A player who volleys a ball and then steps into the kitchen commits a fault
- Momentum carrying a player into the kitchen after a volley is also a fault

### Faults
A fault results in the loss of the rally. The following are faults in Dinkball:

1. Ball lands out of bounds
2. Ball hits the net and does not cross over
3. Volleying from within the kitchen or on the kitchen line
4. Momentum fault: player steps into kitchen after volleying
5. Violation of the double bounce rule (volleying when a bounce was still required)
6. Foot fault on serve (server's feet over baseline at point of contact)
7. Serve lands in the kitchen or on the kitchen line
8. Serve does not land in the correct diagonal service box
9. Ball bounces twice before being returned

---

## 5. Gameplay Loop

### 5.1 Rally Sequence

Every rally in Dinkball follows this sequence:

```
1. SERVE
   → Underhand, diagonal, must bounce
   → If fault: side-out, opponent serves

2. DOUBLE BOUNCE PHASE
   → Receiver must let ball bounce (bounce 1)
   → Server's side must let the return bounce (bounce 2)
   → Both bounces enforced — volley before this = fault

3. RALLY PHASE
   → Both sides may now volley or let ball bounce
   → Kitchen zone is enforced every frame a player is near the net
   → Shot selection: Dink / Drive / Lob / Smash / Drop / Poach

4. FAULT CHECK
   → Every shot and every step checks against fault conditions
   → Fault detected: rally ends, fault callout displayed

5. POINT RESOLUTION
   → If serving side wins rally → +1 point to server
   → If receiving side wins rally → side-out (serve changes hands, no point)

6. GAME CHECK
   → First to 11 points, win by 2 → game won
   → Best of 3 games → match won
```

### 5.2 The Third Shot Drop (Tactical Layer)

After the mandatory double bounce phase, the serving team is typically still at the baseline while the receiving team has had time to advance to the net. The "third shot drop" is the standard response: a soft, arcing shot into the kitchen designed to neutralise the net advantage and allow the serving team to approach.

In Dinkball, this is represented as a distinct shot type (the Drop Shot) available after the double bounce phase. Using it successfully — landing the ball in the kitchen while the opponent is at net — rewards the player with a position shift animation and improved court positioning for the next shot. This mechanical reward teaches and reinforces authentic pickleball strategy.

### 5.3 Net Control and Court Positioning

Court positioning is tracked as a state for each player/team:

- **Baseline** — Default starting position. Wide shot angles available. Limited volley options.
- **Transition zone** — Mid-court. Vulnerable. Should not stay here long.
- **Net / Kitchen line** — Optimal attacking position. Tighter angles, more shot options, smash available.

Both the player and AI opponents actively shift positions based on shot results. The player who controls the kitchen line has the advantage — the game should make this legible through character position on screen at all times.

---

## 6. Shot System

All shots are mapped to simple button inputs combined with directional input. Higher difficulty opponents read shot telegraphing earlier.

| Shot | Input | Description | Best Used When |
|---|---|---|---|
| **Drive** | Attack button + direction | Flat, fast, aggressive shot | Opponent is out of position or at baseline |
| **Dink** | Soft button + direction | Slow, low arc into the kitchen | At the kitchen line; forces opponent to hit up |
| **Lob** | Up + attack button | High, deep shot over opponent | Opponent is crowding the net |
| **Smash** | Overhead button | Powerful downward strike | Opponent lobs too short |
| **Drop Shot** | Down + soft button | Soft arc designed to land in kitchen | After double bounce; transition to net |
| **Poach** (2v2 only) | Poach button | Partner cuts across to intercept | Opponent aims at partner; player is faster to the ball |

### 6.1 Shot Timing
Each shot has a timing window. Pressing the shot button at the optimal point in the swing animation produces the cleanest contact — better placement, cleaner sound effect, and a brief visual flash. Early or late contact results in reduced accuracy or slightly mishit direction.

### 6.2 Ball Physics
The ball behaves predictably and arcade-satisfyingly, not physically. Ball speed is exaggerated for drives and smashes. Dinks drop noticeably faster after peaking. Lobs have a visible hang time. All ball physics are tuned for readability and feel, not simulation realism. A ball trail renders on shots above a speed threshold.

---

## 7. Fault System

Faults are checked continuously. When a fault is detected, the rally ends immediately with:

- A visual callout in bold bitmap font (e.g. **"KITCHEN FAULT!"**, **"OUT!"**, **"NET!"**)
- A distinct audio sting for each fault type
- A brief freeze frame (2–3 frames) before the point resolution screen

### Fault Types and Visual/Audio Cues

| Fault | Visual Callout | Audio Cue |
|---|---|---|
| Ball out of bounds | "OUT!" — red flash at boundary | Sharp buzzer |
| Ball hits net | "NET!" — net shakes on impact | Thud + buzzer |
| Kitchen violation (volley) | "KITCHEN!" — kitchen zone flashes | Whistle sting |
| Momentum fault | "KITCHEN!" — character stumbles animation | Whistle sting |
| Double bounce violation | "LET IT BOUNCE!" | Descending tone |
| Foot fault on serve | "FOOT FAULT!" — foot highlights | Short whistle |
| Serve in kitchen | "KITCHEN SERVE!" — kitchen flashes | Low buzz |
| Serve in wrong box | "WRONG BOX!" | Low buzz |
| Ball bounces twice | "DOUBLE BOUNCE!" | Thud × 2 |

---

## 8. Serving Mechanics

### 8.1 Serve Input
The serve is initiated when the player presses the serve button after a point is resolved. A power/direction aiming mechanic then activates:

- **Aim cursor:** A small directional indicator appears in the opponent's service box. The player steers it with the directional input to choose serve placement.
- **Power meter:** A cycling bar fills and empties. The player presses the confirm button to lock in power. More power = faster serve, less arc margin. Softer serves are safer but more returnable.
- The cursor settles slightly off the chosen position, with a small randomness factor that shrinks at higher skill levels.

### 8.2 Serve Rules Enforcement
- Serve must land in the diagonal service box (cross-court)
- Serve must clear the net
- Serve cannot land in or on the kitchen line
- Server's feet must be behind the baseline at point of contact — a foot fault animation plays if this is violated
- One serve attempt only — a fault means side-out immediately

### 8.3 Service Rotation (2v2)
In doubles, both partners take turns serving before a side-out. The game tracks the service order and displays the current server's name/icon in the HUD. The starting team in a match begins with only one server before a side-out (per official rules).

---

## 9. Scoring and Match Structure

### 9.1 Scoring
- Side-out scoring: only the serving side may score
- Points are announced with a score callout animation and HUD update
- Score is always called server's score first, then receiver's score, then current game number (in 2v2 the convention is: serving team score, receiving team score, server number)

### 9.2 Game
- First to 11 points wins a game
- Must win by 2 points (no cap — play continues until a 2-point lead is established)

### 9.3 Match
- Best of 3 games wins the match
- After each game, sides switch ends (consistent with the Amiga aesthetic, this can be represented as the camera flipping so the player is always at the bottom of the screen)

### 9.4 Tournament (Circuit Mode)
- A tournament bracket contains 4, 8, or 16 players depending on tier
- Losing a match in a bracket results in elimination
- Winning a tournament advances the player to the next venue/tier on the circuit map

---

## 10. Game Modes

### 10.1 Quick Match
Jump directly into a 1v1 or 2v2 match against a selected or randomly assigned AI opponent. Choose from unlocked environments. No stakes — used for practice or casual play.

### 10.2 Circuit Mode (Main Campaign)
The primary single-player experience. The player selects a character and enters the Dinkball World Circuit — a series of tournaments spread across escalating venues.

**Structure:**
- The circuit is visualised as a world map (in 16-bit style) with venue icons
- Each venue hosts a tournament bracket (typically 8 players)
- The player must win the tournament to unlock the next venue
- Losing a match in the bracket results in a "retry qualifier" — a one-match rematch before re-entering the bracket
- Beating the full circuit unlocks a Championship bracket featuring the toughest opponents

**Progression path (example):**

| Tier | Venue | Format |
|---|---|---|
| 1 | Garden | 1v1, 4-player bracket |
| 2 | Community sports hall | 1v1, 8-player bracket |
| 3 | Car park | 1v1, 8-player bracket |
| 4 | Rooftop | 2v2, 8-player bracket |
| 5 | Beach court | 1v1, 8-player bracket |
| 6 | Indoor arena | 2v2, 8-player bracket |
| 7 | National stadium | 1v1, 16-player bracket |
| Championship | Grand Final Arena | 2v2, 16-player bracket |

### 10.3 Tournament Mode
A standalone tournament bracket the player can set up independently of Circuit Mode. Choose format (1v1 or 2v2), venue, and bracket size. AI opponents fill all slots. No persistent progression — purely for bracket-style replay value.

### 10.4 Practice Mode
Free play on any unlocked court. No scoring. The ball machine can be toggled — it fires balls at configurable speed and placement for the player to practice returns and shot types.

---

## 11. AI System

### 11.1 AI Behaviour Model
AI opponents do not cheat — they operate on the same input constraints as the player (shot timing, movement speed, etc.). Difficulty is tuned through the following parameters:

| Parameter | Easy | Medium | Hard | Expert |
|---|---|---|---|---|
| Reaction time | Slow | Moderate | Fast | Instant |
| Shot placement accuracy | Low | Medium | High | Near-perfect |
| Kitchen discipline | Rarely stays out | Sometimes faults | Disciplined | Perfect |
| Net aggression | Stays back | Approaches sometimes | Rushes net | Always controls net |
| Lob usage | Never | Rarely | When appropriate | Reads player position |
| Smash execution | Misses often | Hits sometimes | Reliable | Near-perfect |
| Third shot drop usage | Never | Occasionally | Frequently | Always |

### 11.2 AI Character Archetypes

Each named opponent on the circuit has a playstyle archetype:

- **The Pusher** — Gets everything back, no power, makes no faults. Frustrating but beatable with patience.
- **The Basher** — Drives everything hard. Accurate shot placement. Kitchen discipline is weak.
- **The Dink Master** — Lives at the kitchen line. Soft game is exceptional. Vulnerable to lobs.
- **The Lobber** — Counterpuncher. Lobs every overhead opportunity. Weak when at net.
- **The All-Rounder** — Balanced stats. Adapts to the player's patterns mid-match.
- **The Poacher** (2v2 only) — The AI partner type that reads ball direction and intercepts aggressively.

### 11.3 AI Partner Behaviour (2v2)
When the player is in a 2v2 match, the AI partner has a visible personality displayed on the character select screen:

- **Aggressive** — Will poach frequently, rushes the net, may leave the partner exposed
- **Consistent** — Plays the correct shot most of the time, minimal faults, won't take risks
- **Defensive** — Stays back, returns everything deep, rarely comes to net

The AI partner mirrors the player's court position — if the player is at baseline, the partner stays back. If the player advances, the partner advances. Partner positioning should always feel rational and readable.

---

## 12. Environments

The court dimensions and layout never change. What changes is everything surrounding the court — the crowd, the backdrop, the lighting, the ambient audio, and environmental effects.

### 12.1 Environment List

| Environment | Setting | Tier | Atmosphere |
|---|---|---|---|
| **The Garden** | Suburban back garden, flowerbeds, fence, bird sounds | 1 | Casual, quiet, sunny |
| **Community Sports Hall** | Indoor wooden floor, scoreboard, folding chairs | 2 | Local club energy |
| **Car Park** | Painted tarmac court, cars visible, streetlights | 3 | Scrappy, urban, evening |
| **Rooftop** | City skyline behind, wind, roof access door | 4 | Cool, elevated, dramatic |
| **Beach Court** | Sand surround, ocean horizon, seagulls | 5 | Bright, holiday-feel |
| **Indoor Arena** | Proper lighting rig, small seated crowd, scoreboard | 6 | First taste of real stakes |
| **National Stadium** | Packed crowd, big screens, dramatic lighting | 7 | High pressure, epic |
| **Grand Final Arena** | Championship banners, broadcast cameras, sell-out crowd | Championship | Maximum spectacle |

### 12.2 Environmental Effects

Environments are not purely cosmetic — select environments introduce minor gameplay-adjacent elements:

- **The Garden:** Sun glare — once per game, a brief screen glint obscures the ball for 0.5 seconds. Small warning icon appears before it triggers.
- **Car Park:** Night lighting — reduced visibility to the outer edges of the court. Ball is slightly harder to track on lob shots.
- **Rooftop:** Wind callout — occasional "WIND →" or "WIND ←" text appears, subtly affecting lob trajectory by one or two pixels of drift.
- **Beach Court:** No mechanical effect — purely visual with sand and wave animations.
- **National Stadium / Grand Final Arena:** Crowd noise — the crowd reacts dynamically to points, streaks, and faults. A rally of 10+ shots triggers a crowd-building crescendo.

### 12.3 Crowd System
Crowds are sprite-based and animated using a limited frame set (consistent with Amiga hardware). Crowd sprites react to:
- Long rallies (wave / cheer animation)
- Faults (groan)
- Match-winning points (full crowd celebration, confetti pixels)
- Kitchen violations (pantomime "ooooh")

---

## 13. Progression and Unlockables

### 13.1 Experience and Stars
After every match, the player receives a star rating (1–3 stars) based on:
- Score differential (blowout vs close match)
- Number of faults committed
- Number of consecutive rally exchanges
- Number of kitchen plays (dink exchanges)

Stars accumulate and unlock rewards at thresholds.

### 13.2 Unlockable Content

| Type | How Unlocked | Examples |
|---|---|---|
| **Environments** | Winning tournaments | Car park, rooftop, stadium, etc. |
| **Opponents** | Reaching new circuit tiers | Named AI characters per venue |
| **Paddle skins** | Star count milestones | Pixel patterns, neon, retro wood grain |
| **Character outfits** | Winning specific tournaments | Colour variants, themed costumes |
| **AI Partners (2v2)** | Completing venues | Different partner archetypes unlocked per tier |

### 13.3 Hall of Fame
A high score / records screen in the Amiga tradition. Tracks:
- Longest rally
- Most dinks in a single rally
- Most lopsided match win
- Fastest match completion

Records are stored locally and displayed in a pixel-art framed leaderboard screen.

---

## 14. Difficulty Scaling

Difficulty scales across two axes simultaneously:

**Axis 1 — AI opponent tier (automatic, circuit-driven)**
Each venue on the circuit introduces opponents with higher AI parameter values. The player does not manually set difficulty in Circuit Mode — the opponents get harder as the venues escalate.

**Axis 2 — Environmental pressure (automatic, venue-driven)**
Higher-tier venues introduce the environmental effects described in section 12.2, adding unpredictability that is not related to opponent skill.

**Manual difficulty (Quick Match and Tournament Mode only)**
Players can select Easy / Medium / Hard / Expert. This maps directly to the AI parameter table in section 11.1.

### 14.1 Rubber Band Prevention
There is no rubber band mechanic. AI opponents do not play worse when the player is losing, and do not play better when the player is winning. The difficulty is fixed per opponent tier. This preserves the arcade integrity of the experience.

---

## 15. UI and HUD

All UI and HUD elements are rendered in the 16-bit bitmap style.

### 15.1 In-Match HUD

```
┌────────────────────────────────────────────────────┐
│  PLAYER       0 – 0       OPPONENT      GAME 1     │
│  ████████░░░░░░░░░░░░░░░░ (stamina/focus bar TBD)  │
└────────────────────────────────────────────────────┘
                       [court]
```

- Score displayed at all times in large bitmap numerals
- Current game number displayed
- Server indicator (small paddle icon next to serving player's name)
- In 2v2: both player and partner name shown; both opponent names shown
- Fault callout appears centre-court in bold, fades after 1.5 seconds

### 15.2 Menus
All menus use a consistent 16-bit style:
- Dark background with pixel-art decorative border
- Highlighted menu options use an inverse colour block (white bg, dark text)
- Cursor is a paddle or ball icon
- Transitions between screens use screen wipes — horizontal or vertical, in the Amiga tradition

### 15.3 Character Select Screen
- Large character sprite on left, stat bars on right
- Stats displayed: Power / Speed / Kitchen / Consistency / Serve
- In 2v2: partner select follows player select on the same screen

### 15.4 Score Announcement
After each point:
- Large score numerals flash on screen centre for 1 second
- If a game ends: "GAME!" banner in bold text, brief pause, sides switch
- If a match ends: "MATCH!" banner, victory animation, results screen

---

## 16. Audio Design

Audio is one of the most important carriers of the Amiga 16-bit atmosphere. All sound design should reference MOD tracker music and 8/16-bit sampled sound effects.

### 16.1 Music
- **Main menu theme:** Upbeat chiptune/MOD-style track. Fast tempo, memorable melody. Should feel like an Amiga sports game loading screen.
- **Per-environment music:** Each venue has a distinct track that fits its atmosphere:
  - Garden: light, jangling melody
  - Car park: grittier, urban synth
  - Beach: bright Caribbean-influenced synth
  - Stadium/Arena: dramatic, swelling, crowd-echo feel
- **Victory fanfare:** Short jingle on match win. Distinct from point win.
- **Menu navigation:** Single chip click/bloop on each cursor movement.

### 16.2 Sound Effects

| Event | Sound Description |
|---|---|
| Ball drive | Sharp crack — sampled racket impact |
| Dink | Soft pop — lighter contact |
| Lob | Whoosh arc sound + pop on contact |
| Smash | Loud crack + whoosh of air |
| Ball bounce | Hollow plastic bounce (true to wiffle/pickleball ball) |
| Serve | Short wind-up swish then crack |
| Ball out | Sharp buzzer/whistle |
| Ball hits net | Dull thud |
| Kitchen fault | Referee whistle pip |
| Point scored | Short ascending sting |
| Side-out | Lower, flatter sting |
| Crowd cheer (rally) | Building crowd sample that increases with rally length |
| Crowd groan (fault) | Short disappointed murmur |
| Match win | 4-bar fanfare |

### 16.3 Commentary
No voice commentary in this version. The font-based callouts ("KITCHEN!", "OUT!", "POINT!") serve as the game's "commentary layer," consistent with Amiga-era sports titles.

---

## 17. Character Roster

### 17.1 Player Character
The player selects a character from the initial roster. Each character has a unique sprite, name, personality description, and stat spread. Stats affect: Shot Power, Movement Speed, Kitchen Accuracy (dink precision), Serve Consistency, and Stamina (reserved for future feature).

### 17.2 Starting Roster (Example)

| Character | Description | Strengths | Weaknesses |
|---|---|---|---|
| **Rex** | Former tennis pro, flashy dresser, huge drive | Power, Serve | Kitchen play, stamina |
| **Manda** | Retired table tennis champion, lightning quick | Speed, Dink | Power, serve range |
| **Big Clive** | Retired postman, plays every weekend, absolute dink machine | Kitchen, Consistency | Speed, power |
| **Suki** | Sports science student, textbook technique | Balanced stats | No standout weapon |

### 17.3 Unlockable Opponents (Examples)

| Character | Venue Introduced | Archetype |
|---|---|---|
| **The Colonel** | Garden | Pusher |
| **Dynamo Dave** | Car Park | Basher |
| **Net Queen** | Sports Hall | Dink Master |
| **High-Ball Harry** | Rooftop | Lobber |
| **The Circuit Pro** | Indoor Arena | All-Rounder |
| **The Champion** | Grand Final | Expert All-Rounder |

---

## Appendix A — Official Pickleball Court Dimensions (for reference)

```
┌──────────────────────────────────┐
│           OUT OF BOUNDS          │
│  ┌────────────┬───────────────┐  │
│  │            │               │  │
│  │  KITCHEN   │   KITCHEN     │  │
│  │  (7 feet)  │   (7 feet)    │  │
│  ├────────────┴───────────────┤  │
│  │    ═══════ NET ═══════     │  │
│  ├────────────┬───────────────┤  │
│  │  KITCHEN   │   KITCHEN     │  │
│  │  (7 feet)  │   (7 feet)    │  │
│  ├────────────┴───────────────┤  │
│  │                            │  │
│  │       PLAYER SIDE          │  │
│  └────────────────────────────┘  │
│           OUT OF BOUNDS          │
└──────────────────────────────────┘
Court: 44ft × 20ft
Kitchen: 7ft each side of net
Net: 36in sideline / 34in centre
```

---

## Appendix B — Glossary

| Term | Definition |
|---|---|
| **Dink** | A soft shot that lands in the kitchen; the signature pickleball shot |
| **Kitchen** | The non-volley zone; 7 feet from the net on each side |
| **Side-out** | Serving changes to the other side without a point being scored |
| **Double bounce rule** | The serve and return must each bounce once before volleys are allowed |
| **Third shot drop** | A soft drop into the kitchen by the serving team after the double bounce |
| **Poach** | When a doubles player crosses to intercept a ball aimed at their partner |
| **Foot fault** | Server's foot crossing the baseline at point of contact |
| **NVZ** | Non-Volley Zone; another name for the kitchen |
| **MOD music** | The tracker-based music format native to the Amiga; the audio target for Dinkball's soundtrack |

---

*Dinkball GDD v1.0 — Subject to revision as development progresses.*
