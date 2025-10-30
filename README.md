# Life of Discipline-inspired Habit Tracker

A single-page web app that recreates the Life of Discipline heatmap experience: click any calendar cell to log a habit, capture focus to-dos, and review streaks at a glance.

## Highlights

- 🗓️ **Per-habit heatmaps:** Scrollable month view that mirrors Life of Discipline’s calendar rows. Click any cell (past or present) to toggle completion.
- ✅ **Focus to-dos:** Add lightweight tasks beside the heatmap and mark them complete for a celebratory burst animation.
- 📝 **Habit notes:** Right-click or use the action buttons to attach context to each habit entry without leaving the grid.
- 🔍 **Quick logging:** Search a habit by name and hit enter to instantly log it for the selected day.
- 📚 **Habit library:** Edit colors, archive habits without losing history, and seed the heatmap with inspiring defaults.
- 🎨 **Color-tuned heatmaps:** Each habit row renders with its own shade so completions reflect the color you picked in the library.
- 🧭 **Daily focus panel:** Jump to any date, monitor completion rate, and keep your current streak in view.

All information is stored locally in `localStorage`. No accounts or servers are required.

## Getting started

1. Clone or download this repository.
2. Open `index.html` in a modern browser. (For the best experience, serve it via a simple static server.)
3. Explore the seeded data, then create your own habits from the library panel.

## Keyboard and mouse tips

- **Enter** while in the search box toggles the first matching habit for the selected day.
- **Right-click** any heatmap cell (or use the “Add note” buttons in the daily list) to open its habit note editor.
- **Enter** inside the to-do input quickly adds a new focus task.
- **Today** button jumps back to the current date and month.

## Resetting the demo

Press the **Reset data** button in the top bar to restore the original seeded entries, focus to-dos, and habit notes. You can also clear the `lod-tracker-data-v2` key from your browser’s developer tools.

## Tech stack

- Vanilla HTML, CSS, and JavaScript
- CSS glassmorphism styling to echo the Life of Discipline aesthetic
- No build tools or frameworks required

Feel free to adapt the visuals or extend the focus workflow to match your own ritual.
