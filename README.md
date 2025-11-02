# Life of Discipline-inspired Habit Tracker

A single-page web app that recreates the Life of Discipline heatmap experience: click any calendar cell to log a habit, capture focus to-dos, and review streaks at a glance.

## Highlights

- 🗓️ **Per-habit heatmaps:** Scrollable month view that mirrors Life of Discipline’s calendar rows. Click any cell (past or present) to toggle completion.
- ✅ **Focus to-dos:** Add lightweight tasks beside the heatmap and mark them complete for a celebratory burst animation.
- 🧩 **Multi-checkpoint habits:** Define sub-habits (e.g., the five daily prayers or three meals) with the in-app builder and track each checkpoint from the daily list.
- 🔍 **Quick logging:** Search a habit by name and hit enter to instantly log it for the selected day.
- 📚 **Habit library:** Edit colors, manage checkpoints, archive habits without losing history, and seed the heatmap with inspiring defaults.
- 🎨 **Color-tuned heatmaps:** Each habit row renders with its own shade so completions reflect the color you picked in the library.
- 🧭 **Daily checkpoint list:** Jump to any date, smash the glowing “Log habit” button to finish the day, or tick sub-habits individually.

All information is stored locally in `localStorage`. No accounts or servers are required.

## Getting started

1. Clone or download this repository.
2. Open `index.html` in a modern browser. (For the best experience, serve it via a simple static server.)
3. Explore the seeded data, then create your own habits from the library panel.

## Keyboard and mouse tips

- **Click** any sub-habit chip to toggle that checkpoint without affecting the others.
- **Enter** while in the search box toggles the first matching habit for the selected day.
- **Enter** inside the to-do input quickly adds a new focus task.
- **Today** button jumps back to the current date and month.

## Resetting the demo

Press the **Reset data** button in the top bar to restore the original seeded entries and focus to-dos. You can also clear the `lod-tracker-data-v2` key from your browser’s developer tools.

## Tech stack

- Vanilla HTML, CSS, and JavaScript
- CSS glassmorphism styling to echo the Life of Discipline aesthetic
- No build tools or frameworks required

Feel free to adapt the visuals or extend the focus workflow to match your own ritual.
