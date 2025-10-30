# Daily Alignment Heatmap

A minimalist habit tracker that leans on heatmaps, streak psychology, and a weekly reflection loop. It is designed to make it easy to “win the day,” protect streaks with one weekly grace day, and visualize progress with multiple heatmap modes.

## Features

- ✅ **Quick check-ins:** Today’s habits are one tap away, and the app opens on the current day.
- 🔥 **Streak protection:** Mark a habit done or use one weekly grace day that keeps streaks alive without counting as progress.
- 🎨 **Multiple heatmaps:** Switch between combined day view, per-habit rows, streak cards, and weekly success rates.
- 🧱 **Weekly recap:** See how many days you showed up, how many habits you’re tracking, and which streak is on fire.
- ➕ **On-device habit creation:** Add new habits with frequency, category, color, and visibility options. Habits are archived by toggling their visibility off.
- 🧠 **Tiny habit encouragement:** Metadata for each habit highlights its age and current streak to keep motivation high.

All data is stored locally in `localStorage`—no accounts or sync required.

## Getting started

1. Open `index.html` in your browser (double-click from Finder/Explorer or run a static file server).
2. Add the page to your phone’s home screen for an app-like experience.
3. Tap today’s habits to light up the heatmap and keep your streak alive.

## Development notes

- The UI is built with vanilla HTML, CSS, and JavaScript—no dependencies.
- Heatmap colors follow an encouraging palette. Misses stay neutral; wins get progressively richer.
- Grace days are stored per ISO week (`YYYY-Www`), with the allowance configured in `app.js` under `settings.skipAllowancePerWeek`.
- To reset the app, clear the `da-heatmap-data-v1` entry from your browser’s `localStorage`.

## Future ideas

- GPT-powered habit suggestions based on natural-language prompts.
- Predictive reminders that recommend better scheduling when you routinely miss a habit.
- Sunday reflections that help prune or recommit to habits for the coming week.
