# Habit tracker

A single-page web app for logging multi-checkpoint habits, capturing focus to-dos, and reviewing streaks at a glance.

## Highlights

- 🗓️ **Per-habit heatmaps:** Dense GitHub-style grids that flex per habit—weekly rows summarize a whole week while month and year layouts track individual days.
- 🔁 **Customizable range:** Tap a habit label to pick week, month, or year and the calendar instantly reflows with the right column count and cell size.
- 🎯 **Weekly goals:** Give weekly cells their own target (e.g., 3 gym visits) so the tint reflects how close you came to that goal.
- ✅ **Focus to-dos:** Add lightweight tasks beside the heatmap and mark them complete for a celebratory burst animation.
- 🧩 **Multi-checkpoint habits:** Define sub-habits (e.g., the five daily prayers or three meals) with the in-app builder and track each checkpoint from the daily list.
- 🔍 **Quick logging:** Search a habit by name and hit enter to instantly log it for the selected day.
- 📚 **Habit library:** Edit colors, manage checkpoints, archive habits without losing history, and browse archived habits from a dedicated tab.
- 🗑️ **Safe deletion:** Remove habits and their historical data when they no longer serve you.
- 🎨 **Color-tuned heatmaps:** Each habit row renders with its own shade so completions reflect the color you picked in the library.
- 🧭 **Daily checkpoint list:** Smash the glowing “Log habit” button to finish the day, or tick sub-habits individually for precision.

All information is stored locally in `localStorage`. No accounts or servers are required.

## Getting started

1. Clone or download this repository.
2. Open `index.html` in a modern browser. (For the best experience, serve it via a simple static server.)
3. Explore the seeded data, then create your own habits from the library panel.

## Keyboard and mouse tips

- **Click** any sub-habit chip to toggle that checkpoint without affecting the others.
- **Click** a weekly cell to focus that week; day cells can still be toggled directly.
- **Enter** while in the search box toggles the first matching habit for the selected day.
- **Enter** inside the to-do input quickly adds a new focus task.
- **Click a habit label** above the heatmap to switch between week, month, and year layouts, then adjust the weekly goal when relevant.

## Resetting the demo

Press the **Reset data** button in the top bar to restore the original seeded entries and focus to-dos. You can also clear the `habit-tracker-data-v2` key from your browser’s developer tools.

## Tech stack

- Vanilla HTML, CSS, and JavaScript
- CSS glassmorphism styling with celebratory bursts for quick wins
- No build tools or frameworks required

Feel free to adapt the visuals or extend the focus workflow to match your own ritual.
