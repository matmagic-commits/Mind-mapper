# 🎹 Piano Steps

A free, no-subscription piano learning web app for ages 10 through adult.
It teaches keyboard basics, rhythm, and note reading in small incremental
steps, then guides you through real songs one short segment at a time —
with falling notes timed against the exact keys and positions on an
on-screen keyboard.

## Features

- **Guided lessons ("Learn")** — meet the keyboard, five-finger hand
  position, rhythm basics, steps vs. skips, and your first songs, building
  up real skills before tackling full pieces.
- **Song library** — traditional kids' songs (Twinkle Twinkle, Hot Cross
  Buns, Mary Had a Little Lamb, and more) plus simplified arrangements of
  well-loved classical "covers" (Ode to Joy, Für Elise, Canon in D...).
  Every song is split into short segments that unlock as you pass them.
- **Two practice modes:**
  - **Wait for Me** — untimed; the app waits for you to press the right
    key before moving on. Great for absolute beginners.
  - **Rhythm Mode** — notes fall from the top of the screen and land on
    the matching key in time with the music, like a real rhythm game,
    with accuracy/combo scoring.
- **Any input device** — click/tap the on-screen keys, use your computer
  keyboard (mapped like a typical DAW keyboard), or plug in a real MIDI
  keyboard/piano via the Web MIDI API. Whatever you play lights up the
  exact key and position on the on-screen keyboard.
- **Progress tracking** — saved locally in your browser (`localStorage`).
  No account, no server, no data leaves your device.
- **No subscription, ever** — this is a static site with zero backend
  costs, so there's nothing to charge for.

## Running locally

This is a static site with no build step. Any static file server works:

```bash
npx serve .
# or
python3 -m http.server 8080
```

Then open the printed URL in your browser.

## Deploying to GitHub Pages

1. Push this repository to GitHub (if it isn't already).
2. In the repo, go to **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **Deploy from a
   branch**.
4. Pick the branch you want to publish (e.g. `main`) and the `/ (root)`
   folder, then **Save**.
5. GitHub will give you a URL like
   `https://<your-username>.github.io/<repo-name>/` within a minute or two.

No further configuration is needed — `index.html` at the repo root is the
entry point, and everything else is plain HTML/CSS/JS loaded relatively.

## Project structure

```
index.html            App shell + navigation
css/style.css         All styling
js/
  notes.js            Note-name/MIDI/frequency utilities, keyboard key map
  audio.js            Web Audio synth (no samples/licensing needed)
  keyboard.js         On-screen piano keyboard component
  input.js            Computer-keyboard + Web MIDI input handling
  songs.js            Song library data
  curriculum.js       Guided lesson step definitions
  storage.js          localStorage progress persistence
  practice-engine.js  Core lesson/song player (falling notes, scoring)
  app.js              Hash router
  views/              One module per screen (home, learn, songs, etc.)
```

## About the songs

Kids' songs are traditional, public-domain melodies. Classical pieces are
labeled "simplified arrangement" because they're original, beginner-
friendly excerpts arranged for this app rather than transcriptions of any
particular copyrighted score. This keeps the app free to host and share
without licensing concerns.
